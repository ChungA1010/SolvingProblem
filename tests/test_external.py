import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET
from cmp_ml.external import align_features, assign_novelty, freeze, join_answers, prepare_predictions, score


def test_any_prior_wafer_excludes_entire_transitively_connected_external_files():
    prior = pd.DataFrame({"WAFER_ID": [1, 10], "STAGE": ["A", "B"], "split": ["test", "calibration"],
                          "source_files": ["CMP-training-001.csv", "CMP-training-010.csv"]})
    new = pd.DataFrame({"WAFER_ID": [1, 2, 3, 4, 10], "STAGE": ["B"] * 5,
                        "source_files": ["test/a.csv", "test/a.csv;test/b.csv", "test/b.csv", "test/c.csv", "validation/d.csv"]})
    result = assign_novelty(new, prior).set_index("WAFER_ID")
    assert result.prior_component_overlap.to_dict() == {1: True, 2: True, 3: True, 4: False, 10: True}
    assert result.prior_wafer_overlap.to_dict() == {1: True, 2: False, 3: False, 4: False, 10: True}
    assert result.loc[1, "group_id"] == result.loc[3, "group_id"]


def test_absent_chamber_features_preserve_missingness_and_zero_presence():
    frame = pd.DataFrame({"f__all__sensor__mean": [10., 20.], "f__ch4__present": [1., np.nan]})
    result, missing = align_features(frame, ["f__all__sensor__mean", "f__ch4__present", "f__ch5__present", "f__ch5__sensor__mean"])
    assert result["f__ch5__sensor__mean"].isna().all()
    assert result["f__ch5__present"].eq(0).all()
    assert result["f__ch4__present"].tolist() == [1., 0.]
    assert result["f__all__sensor__mean"].tolist() == [10., 20.]


def test_answer_join_distinguishes_cohorts_and_preserves_extreme_values():
    manifest = pd.DataFrame({"cohort": ["test", "validation"], "WAFER_ID": [1, 1], "STAGE": ["B", "B"], "eligible": [True, True]})
    labels = manifest[["cohort", "WAFER_ID", "STAGE"]].assign(AVG_REMOVAL_RATE=[1., 1e9])
    result = join_answers(manifest, labels)
    assert result[TARGET].tolist() == [1., 1e9]
    with pytest.raises(ValueError, match="match exactly"):
        join_answers(manifest, labels.iloc[:1])
    with pytest.raises(ValueError, match="Duplicate"):
        join_answers(manifest, pd.concat([labels, labels.iloc[:1]]))


def test_external_score_refuses_revealed_outcomes_before_any_file_read(tmp_path):
    (tmp_path / "evaluation_seal.json").write_text("{}")
    with pytest.raises(FileExistsError, match="already opened"):
        score(tmp_path / "missing_source", tmp_path / "missing_data", tmp_path)


def test_external_predictions_and_protocol_cannot_be_overwritten(tmp_path):
    (tmp_path / "prediction_freeze.json").write_text("{}")
    with pytest.raises(FileExistsError, match="already frozen"):
        prepare_predictions(tmp_path / "missing_source", tmp_path / "missing_data", tmp_path)
    with pytest.raises(FileExistsError, match="empty output"):
        freeze(tmp_path / "missing_source", tmp_path)
