"""Loopback-only research demo API. Run with python -m cmp_ml.api."""
from __future__ import annotations

import argparse
import csv
import io
import json
import sqlite3
import threading
import uuid
from pathlib import Path
from typing import Annotated,Literal

import numpy as np
from fastapi import FastAPI,Header,Query,Request,Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel,ConfigDict,Field,StrictInt,create_model
from scipy.special import expit,softmax

from .common import CHANNELS,META,RAW_COLUMNS,STATUS,read_json,sha256
from .runtime import InferenceError,NOTICE,Runtime,trace_features
from .storage import Store,digest
from .wafer_data import encode_map

Finite=Annotated[float,Field(strict=True,allow_inf_nan=False)]


class DTO(BaseModel):
    model_config=ConfigDict(extra="forbid",strict=True,allow_inf_nan=False)


class Override(DTO):
    variable_id:str
    value:Finite


class PredictionInput(DTO):
    input_schema_version:Literal["1.0.0"]="1.0.0"
    stage:Literal["A","B"]
    scenario_id:str
    overrides:list[Override]=Field(default_factory=list,max_length=5)
    include_interval:bool=False


raw_fields={c:(Finite,...) for c in RAW_COLUMNS}
raw_fields.update(STAGE=(Literal["A","B"],...),WAFER_ID=(StrictInt,...),MACHINE_ID=(StrictInt,...),CHAMBER=(StrictInt,...),DRESSING_WATER_STATUS=(Annotated[StrictInt,Field(ge=0,le=1)],...))
RawRow=create_model("RawRow",__base__=DTO,**raw_fields)


class TraceInput(DTO):
    rows:list[RawRow]=Field(min_length=1,max_length=10000)
    include_interval:bool=False


class WaferInput(DTO):
    dataset:Literal["wm811k","mixedwm38"]
    width:Annotated[StrictInt,Field(ge=2,le=1024)]
    height:Annotated[StrictInt,Field(ge=2,le=1024)]
    pixels:list[Annotated[StrictInt,Field(ge=0,le=2)]]=Field(min_length=4,max_length=1048576)


class ExperimentInput(DTO):
    name:str=Field(min_length=1,max_length=80)
    notes:str=Field(default="",max_length=2000)
    prediction_id:str=Field(min_length=1,max_length=80)
    force:bool=False


class SensitivityInput(PredictionInput):
    variable_id:str
    values:list[Finite]=Field(min_length=2,max_length=20)


class ComparisonInput(DTO):
    experiment_ids:list[str]=Field(min_length=2,max_length=5)


class Classifiers:
    def __init__(self,root):
        import torch
        from .wafer_model import WaferCNN
        torch.set_num_threads(4)
        self.lock=threading.Lock();self.models={};self.metadata={}
        for dataset in ["wm811k","mixedwm38"]:
            run=root/"runs"/(dataset+"_v1")
            selection=read_json(run/"selection.json")
            complete=read_json(run/"completion.json")
            if sha256(run/"selection.json")!=complete["selection_sha256"] or sha256(run/"cnn.weights.pt")!=selection["weights_sha256"]:
                raise InferenceError("ARTIFACT_HASH_MISMATCH",dataset,503)
            model=WaferCNN(len(selection["label_names"]))
            model.load_state_dict(torch.load(run/"cnn.weights.pt",map_location="cpu",weights_only=True));model.eval()
            self.models[dataset]=model;self.metadata[dataset]=selection

    def predict(self,body):
        import torch
        if len(body.pixels)!=body.height*body.width:raise InferenceError("VALIDATION_ERROR","픽셀 수가 너비×높이와 다릅니다.")
        grid=np.array(body.pixels,dtype=np.uint8).reshape(body.height,body.width)
        try:encoded=encode_map(grid)
        except ValueError as e:raise InferenceError("VALIDATION_ERROR",str(e)) from e
        if body.dataset=="mixedwm38" and grid.shape!=(52,52):
            raise InferenceError("UNSUPPORTED_MAP_SHAPE","MixedWM38 모델은 52×52 입력만 검증되었습니다.")
        with self.lock,torch.inference_mode():
            logits=self.models[body.dataset](torch.from_numpy(encoded[None]).float()/255).numpy()[0]
        meta=self.metadata[body.dataset]
        score=expit(logits) if body.dataset=="mixedwm38" else softmax(logits)
        selected=score>=np.array(meta["thresholds"]) if body.dataset=="mixedwm38" else np.arange(len(score))==score.argmax()
        labels=meta["label_names"]
        return {"dataset":body.dataset,"model_version":body.dataset+"_v1","artifact_hash":meta["weights_sha256"],
                "labels":[label for label,yes in zip(labels,selected) if yes],
                "scores":[{"label":label,"score":float(p),"selected":bool(yes),"threshold":float(meta["thresholds"][i]) if meta["thresholds"] is not None else None}
                          for i,(label,p,yes) in enumerate(zip(labels,score,selected))],
                "notice":"점수는 보정된 확률이 아닙니다. 제거율·공정 조건과 연결된 예측이 아닙니다.",
                "input_hash":digest(body.model_dump()),"status":"success"}


def envelope(request,data=None,error=None,status="success"):
    return {"request_id":getattr(request.state,"request_id",uuid.uuid4().hex),"api_version":"1.0",
            "status":"error" if error else status,"data":data,"error":error}


def create_app(root:Path|None=None,db_path:Path|None=None,classifiers=True):
    root=(root or Path(__file__).resolve().parents[2]).resolve()
    app=FastAPI(title="CMP Virtual Lab",version="1.0.0")
    app.state.runtime=Runtime(root)
    app.state.store=Store(db_path or root/"data/app/experiments.sqlite3")
    app.state.classifiers=Classifiers(root) if classifiers else None

    @app.middleware("http")
    async def guard(request,call_next):
        request.state.request_id="req_"+uuid.uuid4().hex
        origin=request.headers.get("origin")
        if origin:
            from urllib.parse import urlparse
            if urlparse(origin).hostname not in ["127.0.0.1","localhost","::1"]:
                return JSONResponse(envelope(request,error={"code":"ORIGIN_NOT_ALLOWED","message":"로컬 앱만 허용합니다.","field_errors":[],"retryable":False}),403)
        # Enforce streamed body size too, including requests without Content-Length.
        count=0
        chunks=[]
        async for chunk in request.stream():
            count+=len(chunk)
            if count>8_000_000:return JSONResponse(envelope(request,error={"code":"PAYLOAD_TOO_LARGE","message":"요청은 8MB 이하여야 합니다.","field_errors":[],"retryable":False}),413)
            chunks.append(chunk)
        request._body=b"".join(chunks)
        return await call_next(request)

    @app.exception_handler(InferenceError)
    async def known_error(request,error):
        return JSONResponse(envelope(request,error={"code":error.code,"message":error.message,"field_errors":[],"retryable":error.status>=500}),error.status)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request,error):
        fields=[{"field":".".join(map(str,e["loc"])),"message":e["msg"]} for e in error.errors()[:20]]
        return JSONResponse(envelope(request,error={"code":"VALIDATION_ERROR","message":"입력 형식이나 값이 올바르지 않습니다.","field_errors":fields,"retryable":False}),422)

    @app.exception_handler(sqlite3.Error)
    async def storage_error(request,error):
        full="full" in str(error).lower()
        return JSONResponse(envelope(request,error={"code":"INSUFFICIENT_STORAGE" if full else "STORAGE_UNAVAILABLE","message":"로컬 저장소에 접근할 수 없습니다.","field_errors":[],"retryable":True}),507 if full else 503)

    @app.get("/api/v1/health")
    def health(request:Request):return envelope(request,{"ready":True,"mrr":True,"wafer_classification":app.state.classifiers is not None,"release_status":"research_demo"})

    @app.get("/api/v1/variables")
    def variables(request:Request):return envelope(request,{"items":app.state.runtime.variables})

    @app.get("/api/v1/scenarios")
    def scenarios(request:Request):return envelope(request,{"items":app.state.runtime.scenarios})

    @app.get("/api/v1/models/metadata")
    def metadata(request:Request):return envelope(request,{"phm":app.state.runtime.registry,"wafer":app.state.classifiers.metadata if app.state.classifiers else {},"notice":NOTICE})

    @app.post("/api/v1/predictions")
    def predictions(body:PredictionInput,request:Request):
        record,anchor=app.state.runtime.scenario(body.stage,body.scenario_id,[o.model_dump() for o in body.overrides])
        result=app.state.runtime.predict(record,anchor,body.include_interval)
        result.update(scenario_id=body.scenario_id,input=body.model_dump(),input_hash=digest(body.model_dump()))
        result=app.state.store.add_prediction(result)
        return envelope(request,result,status=result["status"])

    @app.post("/api/v1/predictions/trace")
    def traces(body:TraceInput,request:Request):
        result=app.state.runtime.predict(trace_features([r.model_dump() for r in body.rows]),include_interval=body.include_interval)
        result.update(input_hash=digest(body.model_dump()),row_count=len(body.rows))
        result=app.state.store.add_prediction(result)
        return envelope(request,result,status=result["status"])

    @app.post("/api/v1/wafer-predictions")
    def wafer(body:WaferInput,request:Request):
        if app.state.classifiers is None:raise InferenceError("NO_ACTIVE_MODEL","분류 모델이 준비되지 않았습니다.",503)
        return envelope(request,app.state.store.add_prediction(app.state.classifiers.predict(body)))

    @app.post("/api/v1/experiments")
    def save(body:ExperimentInput,request:Request,idempotency_key:Annotated[str,Header(min_length=8,max_length=128)]):
        return envelope(request,app.state.store.save(body.model_dump(),idempotency_key))

    @app.get("/api/v1/experiments")
    def listing(request:Request,limit:int=Query(20,ge=1,le=100),cursor:str|None=None,stage:str|None=None):
        return envelope(request,app.state.store.list(limit,cursor,stage))

    @app.get("/api/v1/experiments/{identifier}")
    def detail(identifier:str,request:Request):return envelope(request,app.state.store.detail(identifier))

    @app.delete("/api/v1/experiments/{identifier}",status_code=204)
    def delete(identifier:str,confirm:bool=False):
        if not confirm:raise InferenceError("CONFIRMATION_REQUIRED","삭제하려면 confirm=true가 필요합니다.")
        app.state.store.delete(identifier);return Response(status_code=204)

    @app.get("/api/v1/experiments/{identifier}/export")
    def export(identifier:str,format:Literal["json","csv"]="json"):
        data=app.state.store.detail(identifier)
        if format=="json":return JSONResponse(data,headers={"Content-Disposition":f'attachment; filename="{identifier}.json"'})
        stream=io.StringIO();writer=csv.writer(stream);writer.writerow(["field","value"])
        # JSON string prefix prevents spreadsheet formulas in free-text cells.
        for key,value in data.items():writer.writerow([key,json.dumps(value,ensure_ascii=False,allow_nan=False)])
        return Response("\ufeff"+stream.getvalue(),media_type="text/csv",headers={"Content-Disposition":f'attachment; filename="{identifier}.csv"'})

    @app.post("/api/v1/sensitivity")
    def sensitivity(body:SensitivityInput,request:Request):
        points=[]
        for value in body.values:
            overrides=[o.model_dump() for o in body.overrides if o.variable_id!=body.variable_id]+[{"variable_id":body.variable_id,"value":value}]
            try:
                record,anchor=app.state.runtime.scenario(body.stage,body.scenario_id,overrides)
                result=app.state.runtime.predict(record,anchor)
                points.append({"input_value":value,"result":result,"error":None})
            except InferenceError as e:
                if e.code!="OOD_DANGER":raise
                points.append({"input_value":value,"result":None,"error":{"code":e.code,"message":e.message}})
        return envelope(request,{"points":points,"notice":"가상 입력에 대한 모델 반응이며 인과 효과가 아닙니다."})

    @app.post("/api/v1/comparisons")
    def compare(body:ComparisonInput,request:Request):
        items=[app.state.store.detail(i) for i in body.experiment_ids]
        versions={i["prediction"].get("model_bundle_version",i["prediction"].get("model_version")) for i in items}
        return envelope(request,{"items":items,"version_mismatch":len(versions)>1})
    return app


def main():
    import uvicorn
    p=argparse.ArgumentParser();p.add_argument("--port",type=int,default=8765);p.add_argument("--root",type=Path);p.add_argument("--db",type=Path)
    args=p.parse_args()
    uvicorn.run(create_app(args.root,args.db),host="127.0.0.1",port=args.port,access_log=False)


if __name__=="__main__":main()
