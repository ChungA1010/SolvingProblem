import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import read_json,sha256
from cmp_ml.wafer_train import metrics

ROOT=Path(__file__).resolve().parents[1]


@pytest.mark.parametrize("dataset",["wm811k","mixedwm38"])
def test_frozen_hashes_and_training_code(dataset):
    run=ROOT/"runs"/(dataset+"_v1")
    protocol=read_json(run/"protocol.json");selection=read_json(run/"selection.json")
    seal=read_json(run/"evaluation_seal.json");complete=read_json(run/"completion.json")
    assert sha256(run/"split_manifest.csv.gz")==protocol["manifest_sha256"]
    assert sha256(run/"selection.json")==seal["selection_sha256"]==complete["selection_sha256"]
    assert sha256(run/"cnn.weights.pt")==selection["weights_sha256"]==complete["weights_sha256"]
    assert sha256(run/"metrics.csv")==complete["metrics_sha256"]
    assert sha256(run/"predictions.csv.gz")==complete["predictions_sha256"]
    code=read_json(run/"recovery.json")["code_sha256"]
    for name,digest in code.items():assert sha256(run/"code_snapshot"/name)==digest
    assert selection["created_at"]<=seal["sealed_at"]<complete["completed_at"]


@pytest.mark.parametrize("dataset",["wm811k","mixedwm38"])
def test_image_and_lot_disjoint_and_scores_reproduce(dataset):
    run=ROOT/"runs"/(dataset+"_v1")
    m=pd.read_csv(run/"split_manifest.csv.gz",low_memory=False)
    used=m[m.split.ne("excluded")]
    assert (used.groupby("image_group").split.nunique()==1).all()
    if dataset=="wm811k":assert (used.groupby("lot").split.nunique()==1).all()
    selection=read_json(run/"selection.json")
    p=pd.read_csv(run/"predictions.csv.gz",float_precision="round_trip",dtype={"target":str})
    scores=pd.read_csv(run/"metrics.csv",float_precision="round_trip")
    for split in ["calibration","test"]:
        rows=p[p.split.eq(split)]
        assert len(rows)==len(used[used.split.eq(split)]) and not rows.source_id.duplicated().any()
        assert set(rows.source_id)==set(used.loc[used.split.eq(split),"source_id"])
        target=np.array([json.loads(x) for x in rows.target])
        prob=rows[["score_"+label for label in selection["label_names"]]].to_numpy()
        actual=metrics(target,prob,dataset,selection["thresholds"])
        expected=scores[scores.split.eq(split)&scores.model.eq("WaferCNN")].iloc[0]
        for key in ["accuracy","macro_f1","micro_f1"]:assert actual[key]==pytest.approx(expected[key],abs=1e-12)


def test_service_bundle_integrity_and_preserved_phm():
    folder=ROOT/"artifacts/runtime_v1"
    registry=read_json(folder/"registry.json")
    for name,digest in registry["files"].items():assert sha256(folder/name)==digest
    for name,digest in read_json(ROOT/"runs/phm_cmp_v1/selection.json")["model_hashes"].items():
        assert sha256(ROOT/"runs/phm_cmp_v1/models"/name)==digest
