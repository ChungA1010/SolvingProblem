from __future__ import annotations

import copy
import json
import sqlite3
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from cmp_ml.api import create_app
from cmp_ml.common import CHANNELS,STATUS
from cmp_ml.runtime import InferenceError,apply_overrides,trace_features
from cmp_ml.storage import Store

ROOT=Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def app(tmp_path_factory):return create_app(ROOT,tmp_path_factory.mktemp("db")/"experiments.sqlite3",classifiers=False)


@pytest.fixture
def client(app):return TestClient(app)


def predict(client,**extra):
    return client.post("/api/v1/predictions",json={"stage":"A","scenario_id":"SCN-A-001",**extra})


@pytest.mark.parametrize("body",[
    {"stage":"C"},{"scenario_id":"SCN-B-001"},
    {"overrides":[{"variable_id":"CTRL-PRESSURE-01","value":"42"}]},
    {"overrides":[{"variable_id":"CTRL-PRESSURE-01","value":True}]},
    {"overrides":[{"variable_id":"UNKNOWN","value":42.}]},
    {"overrides":[{"variable_id":"CTRL-PRESSURE-01","value":42.}]*2},
    {"extra_field":True},
])
def test_strict_schema(client,body):
    result=predict(client,**body)
    assert result.status_code==422
    assert result.json()["error"]["code"]=="VALIDATION_ERROR"
    assert result.json()["data"] is None


def test_nonfinite_body_is_error_envelope(client):
    result=client.post("/api/v1/predictions",content='{"stage":"A","scenario_id":"SCN-A-001","overrides":[{"variable_id":"CTRL-PRESSURE-01","value":NaN}]}',headers={"Content-Type":"application/json"})
    assert result.status_code==422 and result.json()["error"]["code"]=="VALIDATION_ERROR"


def test_hard_and_knn_ood_block_prediction_storage(client,app):
    for value in [-1.,10000.]:
        result=predict(client,overrides=[{"variable_id":"CTRL-PRESSURE-01","value":value}])
        assert result.status_code==422 and result.json()["error"]["code"]=="OOD_DANGER"
    record,anchor=app.state.runtime.scenario("A","SCN-A-001",[])
    record["f__all__USAGE_OF_DRESSER__mean"]=1e15
    with pytest.raises(InferenceError,match="학습 분포"):app.state.runtime.predict(record,anchor)


def test_partial_and_all_failed_model_contract(client,app,monkeypatch):
    pairs=app.state.runtime.models["A"]
    def failure(*args,**kwargs):raise ValueError("test failure")
    with monkeypatch.context() as context:
        context.setattr(pairs[0][1],"predict",failure)
        response=predict(client)
        assert response.status_code==200 and response.json()["status"]=="partial_success"
        item=response.json()["data"]["model_results"][0]
        assert item["value"] is None and item["status"]=="failed"
        for _,model in pairs[1:]:context.setattr(model,"predict",failure)
        response=predict(client)
        assert response.status_code==503 and response.json()["error"]["code"]=="ALL_MODELS_FAILED"


def test_runtime_intervals_and_shape_proxy(app,client):
    record,anchor=app.state.runtime.scenario("A","SCN-A-001",[])
    channel="WAFER_ROTATION";old=anchor[f"f__all__{channel}__mean"]
    shifted=apply_overrides(anchor,[{"variable_id":"CTRL-ROTATION-01","value":old+1}])
    assert shifted[f"f__all__{channel}__mean"]==old+1
    assert shifted[f"f__all__{channel}__std"]==anchor[f"f__all__{channel}__std"]
    assert shifted[f"f__all__{channel}__auc"]==anchor[f"f__all__{channel}__auc"]+anchor["f__all__observed_duration"]
    response=predict(client,include_interval=True).json()["data"]
    for result in response["model_results"]:
        assert result["interval"]["status"]=="empirical_only"
        assert result["interval"]["lower"]<=result["value"]<=result["interval"]["upper"]


def test_trace_feature_golden_dedup_and_chamber():
    rows=[]
    for t,val in [(0.,1.),(1.,3.),(100.,5.)]:
        rows.append({"MACHINE_ID":1,"MACHINE_DATA":1.,"WAFER_ID":1,"STAGE":"A","CHAMBER":1,"TIMESTAMP":t,
                     **{c:val for c in CHANNELS},STATUS:0})
    feature=trace_features(rows+[rows[0]])
    assert feature["f__all__observed_duration"]==1
    assert feature["f__all__WAFER_ROTATION__auc"]==2
    assert feature["f__ch1__present"]==1
    assert feature["chamber_route"]=="1"
    invalid=copy.deepcopy(rows);invalid[-1]["WAFER_ID"]=2
    with pytest.raises(InferenceError):trace_features(invalid)


def test_idempotency_restart_duplicate_delete_cursor_and_backup(tmp_path,client):
    payload=predict(client).json()["data"]
    store=Store(tmp_path/"db.sqlite3")
    prediction=store.add_prediction(payload)
    body={"name":"test","notes":"","prediction_id":prediction["prediction_id"],"force":False}
    saved=store.save(body,"same-key")
    restarted=Store(store.path)
    assert restarted.save(body,"same-key")==saved
    with pytest.raises(InferenceError) as error:restarted.save({**body,"name":"changed"},"same-key")
    assert error.value.code=="IDEMPOTENCY_CONFLICT"
    with pytest.raises(InferenceError) as error:restarted.save(body,"new-key")
    assert error.value.code=="DUPLICATE_EXPERIMENT"
    second=restarted.save({**body,"force":True},"forced-key")
    page=restarted.list(1)
    assert page["has_more"] and page["items"][0]["id"]==second["id"]
    assert restarted.list(1,page["next_cursor"])["items"][0]["id"]==saved["id"]
    with pytest.raises(InferenceError):restarted.list(1,page["next_cursor"],stage="B")
    restarted.backup(tmp_path/"backup.sqlite3")
    assert Store(tmp_path/"backup.sqlite3").detail(saved["id"])==saved
    restarted.delete(saved["id"])
    with pytest.raises(InferenceError):restarted.detail(saved["id"])


def test_api_save_roundtrip_and_confirmation(client):
    prediction=predict(client).json()["data"]
    body={"name":"API roundtrip","prediction_id":prediction["prediction_id"]}
    saved=client.post("/api/v1/experiments",json=body,headers={"Idempotency-Key":prediction["prediction_id"]})
    assert saved.status_code==200
    identifier=saved.json()["data"]["id"]
    detail=client.get("/api/v1/experiments/"+identifier).json()["data"]
    assert detail["prediction"]==prediction
    assert client.get("/api/v1/experiments/"+identifier+"/export").json()==detail
    assert client.delete("/api/v1/experiments/"+identifier).status_code==422
    assert client.delete("/api/v1/experiments/"+identifier+"?confirm=true").status_code==204
    assert client.get("/api/v1/experiments/"+identifier).status_code==404


def test_foreign_origin_and_streamed_large_body(client):
    assert client.post("/api/v1/predictions",json={},headers={"Origin":"https://example.com"}).status_code==403
    response=client.post("/api/v1/predictions",content=(b"a"*1000000 for _ in range(9)))
    assert response.status_code==413


def test_sensitivity_omits_ood_values(client):
    result=client.post("/api/v1/sensitivity",json={"stage":"A","scenario_id":"SCN-A-001","variable_id":"CTRL-PRESSURE-01","values":[44.,1e6]})
    assert result.status_code==200
    assert result.json()["data"]["points"][1]["error"]["code"]=="OOD_DANGER"
