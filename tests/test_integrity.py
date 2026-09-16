import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import CHANNELS, STATUS
from cmp_ml.data import allocate_splits, assert_split_integrity, connected_file_groups, describe_trace
from cmp_ml.experiment import conformal_radius, evaluate
from cmp_ml.models import FeaturePreprocessor, ModelBundle


def test_transitive_file_wafer_components_across_stages():
    raw = pd.DataFrame({"WAFER_ID": [1, 1, 2, 2, 3], "STAGE": ["A", "B", "A", "A", "B"],
                        "source_file": ["f1", "f2", "f2", "f3", "f4"]})
    groups = connected_file_groups(raw)
    assert groups["f1"] == groups["f2"] == groups["f3"]
    assert groups["f4"] != groups["f1"]


def test_long_gap_is_not_integrated_and_duplicate_time_is_collapsed():
    frame = pd.DataFrame({c: [2., 2., 2., 2.] for c in CHANNELS})
    frame["TIMESTAMP"] = [0., 1., 1., 1000.]
    frame[STATUS] = [0., 0., 1., 1.]
    frame["source_file"] = "one"
    frame["original_row"] = [2, 3, 4, 5]
    stats = describe_trace(frame)
    assert stats["n_timesteps"] == 3
    assert stats["observed_duration"] == 1
    assert stats["gap_count"] == 1
    assert stats[CHANNELS[0] + "__auc"] == 2
    assert stats["water_active_ratio"] == pytest.approx(2 / 3)


def test_train_only_preprocessing_and_identifier_exclusion():
    tr = pd.DataFrame({"WAFER_ID": [1, 2, 3], "AVG_REMOVAL_RATE": [9., 90., 900.],
                       "f__x": [1., np.nan, 3.], "f__constant": [0., 0., 0.], "f__missing": [np.nan]*3})
    pre = FeaturePreprocessor().fit(tr)
    assert "WAFER_ID" not in pre.columns and "AVG_REMOVAL_RATE" not in pre.columns
    assert "f__missing" not in pre.columns
    future = tr.copy()
    future["f__x"] = [1000., np.nan, 3000.]
    future["f__constant"] = 100.
    got = pre.transform(future)
    assert got[1, pre.feature_names.index("f__x")] == 2.
    assert "f__constant" not in pre.feature_names
    assert pre.medians[pre.columns.index("f__x")] == 2.


def test_split_target_blind_deterministic_and_calibration_minimum():
    rows = [{"group_id": f"g{i:02}", "STAGE": s, "AVG_REMOVAL_RATE": 1.}
            for i in range(50) for s in ["A", "B"] for _ in range(16)]
    data = pd.DataFrame(rows)
    one, info = allocate_splits(data)
    data["AVG_REMOVAL_RATE"] = np.arange(len(data)) * 1000
    two, _ = allocate_splits(data)
    assert one.equals(two)
    assert info["counts"]["calibration"]["A"] >= 80
    assert info["counts"]["calibration"]["B"] >= 80
    assert (pd.DataFrame({"group": data.group_id, "split": one}).groupby("group").split.nunique() == 1).all()


def test_split_integrity_rejects_shared_wafer_even_across_stages():
    manifest = pd.DataFrame({"WAFER_ID": [1, 1], "STAGE": ["A", "B"], "sample_id": ["a", "b"],
                             "group_id": ["f1", "f2"], "source_files": ["f1", "f2"], "split": ["train", "test"]})
    with pytest.raises(ValueError, match="WAFER_ID"):
        assert_split_integrity(manifest)


def test_interval_finite_sample_rank_and_minimum():
    assert conformal_radius(np.arange(100), np.zeros(100)) == 90
    assert conformal_radius(np.arange(79), np.zeros(79)) is None


def test_bundle_rejects_wrong_stage_and_unseen_chamber():
    bundle = ModelBundle("mean", "A", "constant", constant=10., train_chambers=("1", "2"))
    with pytest.raises(ValueError, match="Stage A"):
        bundle.predict(pd.DataFrame({"STAGE": ["B"], "chamber_route": ["1"]}))
    with pytest.raises(ValueError, match="Unseen chamber"):
        bundle.predict(pd.DataFrame({"STAGE": ["A"], "chamber_route": ["3"]}))


def test_evaluation_seal_prevents_reusing_holdout(tmp_path):
    (tmp_path / "evaluation_seal.json").write_text("{}")
    with pytest.raises(FileExistsError, match="already evaluated"):
        evaluate(tmp_path)
