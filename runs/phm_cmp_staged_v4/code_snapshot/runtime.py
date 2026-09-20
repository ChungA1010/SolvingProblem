"""Local PHM inference, explicit scenario proxy and training-only OOD guard."""
from __future__ import annotations

import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors

from .common import CHANNELS,RAW_COLUMNS,STATUS,read_json,sha256,utcnow,write_json
from .data import describe_trace

CONTROLS = [
    ("CTRL-PRESSURE-01","PRESSURIZED_CHAMBER_PRESSURE","챔버 압력 지수"),
    ("CTRL-SLURRY-01","SLURRY_FLOW_LINE_A","슬러리 A 유량 지수"),
    ("CTRL-ROTATION-01","WAFER_ROTATION","웨이퍼 회전 지수"),
    ("CTRL-ROTATION-02","STAGE_ROTATION","스테이지 회전 지수"),
    ("CTRL-ROTATION-03","HEAD_ROTATION","헤드 회전 지수"),
]
NOTICE = "교육·연구용 데이터셋 지수입니다. 실제 공정 단위·인과 효과·품질 개선을 보증하지 않습니다."


class InferenceError(Exception):
    def __init__(self,code,message,status=422):
        self.code=code;self.message=message;self.status=status
        super().__init__(message)


def align_frame(record,bundles):
    cols=set(record)
    for bundle in bundles:
        if bundle.preprocessor is not None: cols.update(bundle.preprocessor.columns)
    return pd.DataFrame([{c:record.get(c,0. if c.endswith("__present") else np.nan) for c in sorted(cols)}])


def trace_features(rows):
    frame=pd.DataFrame(rows)
    if set(frame)!=RAW_COLUMNS or frame.empty:
        raise InferenceError("VALIDATION_ERROR","원본 시계열 컬럼이 일치하지 않습니다.")
    if not np.isfinite(frame.drop(columns="STAGE").to_numpy(float)).all() or not frame[STATUS].isin([0,1]).all():
        raise InferenceError("VALIDATION_ERROR","센서값은 유한수, 물 상태는 0 또는 1이어야 합니다.")
    if frame.WAFER_ID.nunique()!=1 or frame.MACHINE_ID.nunique()!=1 or frame.STAGE.nunique()!=1:
        raise InferenceError("VALIDATION_ERROR","한 요청에는 단일 웨이퍼·Stage·장비 시계열만 허용합니다.")
    frame=frame.drop_duplicates().copy()
    frame["source_file"]="runtime"
    frame["original_row"]=np.arange(len(frame))
    record={"STAGE":frame.STAGE.iloc[0],"chamber_route":"-".join(map(str,sorted(frame.CHAMBER.astype(int).unique()))),
            "f__chamber_count":float(frame.CHAMBER.nunique())}
    record.update({"f__all__"+k:v for k,v in describe_trace(frame).items()})
    for chamber,group in frame.groupby("CHAMBER"):
        prefix=f"f__ch{int(chamber)}__"
        record[prefix+"present"]=1.
        record.update({prefix+k:v for k,v in describe_trace(group).items()})
    return record


def apply_overrides(anchor,overrides):
    result=dict(anchor)
    fields={c[0]:c[1] for c in CONTROLS}
    if len({item["variable_id"] for item in overrides})!=len(overrides):
        raise InferenceError("VALIDATION_ERROR","동일 변수를 두 번 지정할 수 없습니다.")
    for item in overrides:
        if item["variable_id"] not in fields:
            raise InferenceError("VALIDATION_ERROR","알 수 없는 변수입니다.")
        col=fields[item["variable_id"]]
        delta=item["value"]-anchor[f"f__all__{col}__mean"]
        prefixes=["f__all__"]+[f"f__ch{c}__" for c in anchor["chamber_route"].split("-")]
        for prefix in prefixes:
            for stat in ["mean","min","max","first","last"]:
                key=prefix+col+"__"+stat
                if key in anchor and anchor[key] is not None: result[key]=anchor[key]+delta
            key=prefix+col+"__auc"
            if key in anchor and anchor[key] is not None:
                result[key]=anchor[key]+delta*anchor[prefix+"observed_duration"]
    return result


def build_runtime(source_run:Path,out:Path):
    if (out/"registry.json").exists(): raise FileExistsError("Runtime bundle exists")
    out.mkdir(parents=True,exist_ok=True)
    frame=pd.read_csv(source_run/"features.csv.gz")
    selection=read_json(source_run/"selection.json")
    registry={"version":"runtime-1.0.0","created_at":utcnow(),"source_run":"phm_cmp_v1",
              "notice":NOTICE,"release_status":"research_demo","stages":{},"files":{}}
    scenarios=[];variables=[]
    for stage in ["A","B"]:
        chosen=selection["stages"][stage]["selected_by_validation"]
        names=["StageMean","PrestonInspired",chosen]
        bundles=[];entries=[]
        for name in names:
            filename=f"{stage}_{name.replace('+','_')}.joblib"
            path=source_run/"models"/filename
            if sha256(path)!=selection["model_hashes"][filename]: raise ValueError("PHM model hash mismatch")
            bundle=joblib.load(path);bundles.append(bundle)
            entries.append({"name":name,"file":filename,"sha256":sha256(path),
                            "role":"reference" if name=="StageMean" else "primary" if name==chosen else "comparison",
                            "model_type":"stage_mean" if name=="StageMean" else "physics" if name=="PrestonInspired" else "hybrid" if name.startswith("Physics+") else "ml"})
        train=frame[frame.STAGE.eq(stage)&frame.split.eq("train")].copy()
        prep=bundles[-1].preprocessor
        matrix=prep.transform(train,scaled=True)
        nn=NearestNeighbors(n_neighbors=11,n_jobs=1).fit(matrix)
        loo=nn.kneighbors(matrix,return_distance=True)[0][:,1:].mean(axis=1)
        q95,q99=np.quantile(loo,[.95,.99])
        joblib.dump({"preprocessor":prep,"matrix":matrix,"q95":float(q95),"q99":float(q99),"k":10},out/f"ood_{stage}.joblib",compress=3)
        allowed=train.iloc[np.flatnonzero(loo<=q95)]
        control_cols=[f"f__all__{c[1]}__mean" for c in CONTROLS]
        values=train[control_cols].to_numpy(float)
        center=np.median(values,axis=0);scale=np.std(values,axis=0);scale[scale<1e-9]=1
        for variable,col in zip(CONTROLS,control_cols):
            sample=train[col]
            variables.append({"stage":stage,"variable_id":variable[0],"source_column":variable[1],"label":variable[2],
                              "unit":"dataset scale","normal_min":float(sample.quantile(.01)),"normal_max":float(sample.quantile(.99)),
                              "observed_hard_min":float(sample.min()),"observed_hard_max":float(sample.max()),
                              "default":float(sample.median()),"p25":float(sample.quantile(.25)),"p75":float(sample.quantile(.75)),
                              "status":"exploratory_proxy","catalog_version":"1.0.0"})
        for i,(label,target_col) in enumerate([("일반",None),("높은 챔버 압력",0),("높은 웨이퍼 회전",2),("높은 슬러리 A",1)],1):
            desired=center.copy()
            if target_col is not None: desired[target_col]=np.quantile(values[:,target_col],.8)
            distance=np.square((allowed[control_cols].to_numpy()-desired)/scale).sum(axis=1)
            anchor=allowed.iloc[int(np.argmin(distance))]
            record={c:(None if pd.isna(v) else float(v) if c.startswith("f__") else v)
                    for c,v in anchor.items() if c.startswith("f__") or c in ["STAGE","chamber_route"]}
            sid=f"SCN-{stage}-{i:03}"
            write_json(out/f"{sid}.json",record)
            scenarios.append({"scenario_id":sid,"stage":stage,"label":label,"anchor_id":anchor.sample_id,
                              "chamber_route":anchor.chamber_route,"catalog_version":"1.0.0",
                              "defaults":[{"variable_id":v[0],"value":float(anchor[c])} for v,c in zip(CONTROLS,control_cols)]})
        registry["stages"][stage]={"models":entries,"train_n":len(train),"train_chambers":list(bundles[-1].train_chambers),
                                    "ood_policy":"training-standardized-k10-loo-1.0.0","q95":float(q95),"q99":float(q99)}
    write_json(out/"scenarios.json",scenarios);write_json(out/"variables.json",variables)
    for file in sorted(out.iterdir()):
        if file.is_file(): registry["files"][file.name]=sha256(file)
    write_json(out/"registry.json",registry)
    print("Runtime bundle",out,"built from Train only",flush=True)


class Runtime:
    def __init__(self,root:Path):
        self.root=root; self.folder=root/"artifacts/runtime_v1"
        self.registry=read_json(self.folder/"registry.json")
        for name,digest in self.registry["files"].items():
            if sha256(self.folder/name)!=digest: raise InferenceError("ARTIFACT_HASH_MISMATCH",name,503)
        self.scenarios=read_json(self.folder/"scenarios.json")
        self.variables=read_json(self.folder/"variables.json")
        self.models={};self.ood={};self.neighbors={}
        for stage,info in self.registry["stages"].items():
            self.models[stage]=[]
            for item in info["models"]:
                path=root/"runs/phm_cmp_v1/models"/item["file"]
                if sha256(path)!=item["sha256"]:raise InferenceError("ARTIFACT_HASH_MISMATCH",item["file"],503)
                self.models[stage].append((item,joblib.load(path)))
            self.ood[stage]=joblib.load(self.folder/f"ood_{stage}.joblib")
            self.neighbors[stage]=NearestNeighbors(n_neighbors=10,n_jobs=1).fit(self.ood[stage]["matrix"])

    def scenario(self,stage,sid,overrides):
        match=next((s for s in self.scenarios if s["scenario_id"]==sid and s["stage"]==stage),None)
        if match is None:raise InferenceError("VALIDATION_ERROR","Stage와 시나리오가 일치하지 않습니다.")
        anchor=read_json(self.folder/f"{sid}.json")
        return apply_overrides(anchor,overrides),anchor

    def assess(self,stage,frame):
        try:
            seen=set(frame.chamber_route.iloc[0].split("-"))
            if seen-set(self.registry["stages"][stage]["train_chambers"]):
                raise InferenceError("UNSEEN_CHAMBER","학습에 없는 Chamber입니다.")
            variables=[v for v in self.variables if v["stage"]==stage]
            warning=[]
            for v in variables:
                value=float(frame[f"f__all__{v['source_column']}__mean"].iloc[0])
                if not v["observed_hard_min"]<=value<=v["observed_hard_max"]:
                    raise InferenceError("OOD_DANGER",f"{v['label']}: 학습 관측 범위를 벗어났습니다.")
                if not v["normal_min"]<=value<=v["normal_max"]:warning.append(v["variable_id"])
            artifact=self.ood[stage]
            vector=artifact["preprocessor"].transform(frame,scaled=True)
            score=float(self.neighbors[stage].kneighbors(vector,return_distance=True)[0].mean())
            if score>artifact["q99"]:raise InferenceError("OOD_DANGER","학습 분포에서 너무 먼 입력입니다.")
            return {"level":"warning" if warning or score>artifact["q95"] else "normal","score":score,
                    "q95":artifact["q95"],"q99":artifact["q99"],"warning_variables":warning,
                    "policy_version":"training-standardized-k10-loo-1.0.0"}
        except InferenceError:raise
        except Exception as e:raise InferenceError("OOD_EVALUATION_FAILED","입력 분포 검사를 완료할 수 없습니다.",503) from e

    def predict(self,record,anchor=None,include_interval=False):
        stage=record["STAGE"]
        if stage not in self.models:raise InferenceError("VALIDATION_ERROR","Stage는 A 또는 B입니다.")
        pairs=self.models[stage];bundles=[b for _,b in pairs]
        frame=align_frame(record,bundles)
        ood=self.assess(stage,frame)
        base=align_frame(anchor,bundles) if anchor is not None else None
        results=[]
        for item,bundle in pairs:
            entry={"name":item["name"],"model_type":item["model_type"],"role":item["role"],
                   "model_version":"phm_cmp_v1","artifact_hash":item["sha256"],"status":"ok", "interval":None,"error":None}
            try:
                value=float(bundle.predict(frame)[0])
                if not np.isfinite(value) or value < -1e-8:raise ValueError("Invalid model output")
                value=max(0.,value)
                entry["value"]=value
                if base is not None:
                    baseline=float(bundle.predict(base)[0]);delta=value-baseline
                    entry.update(anchor_value=baseline,delta=delta,relative_percent=delta/abs(baseline)*100 if abs(baseline)>=1e-8 else None)
                if include_interval and bundle.interval_radius is not None:
                    radius=bundle.interval_radius
                    entry["interval"]={"lower":max(0.,value-radius),"upper":max(0.,value+radius),"nominal_coverage":.9,
                                       "status":"empirical_only","calibration_n":bundle.calibration_n,
                                       "notice":"고정 보정 구간입니다. 시나리오 변경·새 공정의 coverage는 검증되지 않았습니다."}
            except Exception:
                entry.update(status="failed",value=None,error={"code":"INVALID_MODEL_OUTPUT"})
            results.append(entry)
        if all(r["status"]=="failed" for r in results):raise InferenceError("ALL_MODELS_FAILED","모든 모델의 예측이 실패했습니다.",503)
        return {"stage":stage,"release_mode":"research_demo","model_bundle_version":"runtime-1.0.0",
                "ood":ood,"model_results":results,"notice":NOTICE,
                "input_interpretation":"관측 요약값의 가상 이동" if anchor is not None else "관측 시계열",
                "status":"partial_success" if any(r["status"]=="failed" for r in results) else "success"}


if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser();p.add_argument("--source-run",type=Path,default=Path("runs/phm_cmp_v1"));p.add_argument("--output-dir",type=Path,default=Path("artifacts/runtime_v1"))
    args=p.parse_args();build_runtime(args.source_run,args.output_dir)
