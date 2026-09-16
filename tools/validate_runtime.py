"""Runtime evidence on Train anchors and fixtures, not another model selection."""
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from cmp_ml.api import WaferInput,create_app
from cmp_ml.common import RAW_COLUMNS,read_json,sha256,utcnow,write_json
from cmp_ml.runtime import CONTROLS,InferenceError,align_frame,apply_overrides,trace_features


def main():
    root=Path(__file__).resolve().parents[1]
    out=root/"runs/service_v1"
    out.mkdir(exist_ok=True,parents=True)
    if (out/"verification.json").exists():raise FileExistsError("Runtime evidence already exists")
    start=time.perf_counter()
    app=create_app(root,root/".cache/runtime-validation.sqlite3")
    cold=time.perf_counter()-start
    client=TestClient(app)
    runt=app.state.runtime
    timings=[];responses={};repeat={};reaction=[]
    for stage in ["A","B"]:
        body={"stage":stage,"scenario_id":f"SCN-{stage}-001"}
        response=client.post("/api/v1/predictions",json=body)
        assert response.status_code==200
        base=response.json()["data"]
        values=np.array([r["value"] for r in base["model_results"]])
        durations=[];difference=[]
        for _ in range(100):
            start=time.perf_counter();r=client.post("/api/v1/predictions",json=body)
            durations.append(time.perf_counter()-start)
            assert r.status_code==200
            difference.append(np.max(np.abs(np.array([m["value"] for m in r.json()["data"]["model_results"]])-values)))
        timings.append({"task":"MRR_"+stage,"calls":100,"p95_seconds":float(np.quantile(durations,.95)),"max_seconds":max(durations)})
        repeat[stage]=float(max(difference));responses[stage]=base
        record,anchor=runt.scenario(stage,body["scenario_id"],[])
        for variable in [v for v in runt.variables if v["stage"]==stage]:
            for level in ["p25","p75"]:
                changed=apply_overrides(anchor,[{"variable_id":variable["variable_id"],"value":variable[level]}])
                row={"stage":stage,"variable_id":variable["variable_id"],"level":level,"input_value":variable[level]}
                try:
                    result=runt.predict(changed,anchor)
                    primary=next(m for m in result["model_results"] if m["role"]=="primary")
                    row.update(status="ok",delta=primary["delta"],threshold=max(1e-6,abs(primary["anchor_value"])*.001),ood=result["ood"]["level"])
                except InferenceError as e:row.update(status=e.code,delta=None,threshold=None,ood="danger")
                reaction.append(row)
    classifier_results={}
    for dataset in ["wm811k","mixedwm38"]:
        # Fixed synthetic UI fixture, not a heldout accuracy test.
        yy,xx=np.mgrid[:52,:52];r=np.hypot(xx-25.5,yy-25.5)/25
        grid=np.where(r>.96,0,np.where(r<.25,2,1)).astype(int)
        body={"dataset":dataset,"width":52,"height":52,"pixels":grid.ravel().tolist()}
        result=client.post("/api/v1/wafer-predictions",json=body)
        assert result.status_code==200
        base=result.json()["data"];expected=np.array([r["score"] for r in base["scores"]]);durations=[];difference=[]
        for _ in range(100):
            start=time.perf_counter();response=client.post("/api/v1/wafer-predictions",json=body);durations.append(time.perf_counter()-start)
            assert response.status_code==200
            difference.append(float(abs(expected-np.array([r["score"] for r in response.json()["data"]["scores"]])).max()))
        classifier_results[dataset]={"max_score_difference":max(difference),"labels":base["labels"]}
        timings.append({"task":dataset,"calls":100,"p95_seconds":float(np.quantile(durations,.95)),"max_seconds":max(durations)})
    # Verify actual raw-to-feature parity for a Train anchor only.
    scenario=runt.scenarios[0]
    source=root/"runs/phm_cmp_v1"
    manifest=pd.read_csv(source/"split_manifest.csv")
    anchor=manifest.loc[manifest.sample_id.eq(scenario["anchor_id"])].iloc[0]
    assert anchor.split=="train"
    rawroot=root.parent/".tmp_phm_review/PHM/Dataset/CMP1/CMP-data/training"
    frames=[pd.read_csv(rawroot/name) for name in anchor.source_files.split(";")]
    raw=pd.concat(frames);raw=raw[raw.WAFER_ID.eq(anchor.WAFER_ID)&raw.STAGE.eq(anchor.STAGE)]
    record=trace_features(raw.to_dict(orient="records"))
    expected=pd.read_csv(source/"features.csv.gz")
    expected=expected[expected.sample_id.eq(anchor.sample_id)].iloc[0]
    feature_delta=max(abs(float(value)-float(expected[key])) for key,value in record.items() if key.startswith("f__"))
    assert feature_delta<1e-7
    typed_rows=[]
    for item in raw.to_dict(orient="records"):
        for key in ["WAFER_ID","MACHINE_ID","CHAMBER","DRESSING_WATER_STATUS"]:item[key]=int(item[key])
        typed_rows.append(item)
    trace_response=client.post("/api/v1/predictions/trace",json={"rows":typed_rows})
    assert trace_response.status_code==200
    sha=read_json(source/"selection.json")["model_hashes"]
    assert all(sha256(source/"models"/name)==value for name,value in sha.items())
    invalid=client.post("/api/v1/wafer-predictions",json={"dataset":"mixedwm38","height":2,"width":2,"pixels":[0,1,2,3]})
    assert invalid.status_code==422
    assert all(d==0 for d in repeat.values()) and all(v["max_score_difference"]==0 for v in classifier_results.values())
    pd.DataFrame(timings).to_csv(out/"latency.csv",index=False)
    pd.DataFrame(reaction).to_csv(out/"input_reaction.csv",index=False)
    coverage=pd.read_csv(root/"runs/phm_cmp_external_v1/primary_summary.csv")
    coverage.to_csv(out/"existing_interval_evidence.csv",index=False)
    report={"verified_at":utcnow(),"cold_app_construction_seconds":cold,"timing_environment":"This Windows workstation; CPU inference, 4 PyTorch threads; includes HTTP TestClient and local SQLite writes, not network or a fresh OS install",
            "mrr_100_call_max_abs_diff":repeat,"classification_100_calls":classifier_results,"timings":timings,
            "train_raw_feature_max_abs_diff":feature_delta,"original_phm_26_model_hashes_unchanged":True,
            "interval_policy":"Existing fixed intervals retained. Observed PHM external coverage exceeds 85-95% QA band; no recalibration against revealed outcomes. Scenario-shift coverage unknown.",
            "release_status":"research_demo","human_ux_study_performed":False,"new_factory_data_tested":False,
            "code_sha256":{name:sha256(root/"src/cmp_ml"/name) for name in ["api.py","runtime.py","storage.py","wafer_model.py"]}}
    write_json(out/"verification.json",report)
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=="__main__":main()
