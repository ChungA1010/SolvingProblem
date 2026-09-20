"""Verify portable inference after frozen scoring, never refit/reselect a model."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from scipy.special import expit,softmax

from .common import read_json,sha256,utcnow,write_json
from .wafer_model import WaferCNN,logits_for


def verify(run:Path,data_dir:Path):
    if (run/"verification.json").exists():raise FileExistsError("Verification already recorded")
    selection=read_json(run/"selection.json");protocol=read_json(run/"protocol.json")
    seal=read_json(run/"evaluation_seal.json")
    if sha256(run/"selection.json")!=seal["selection_sha256"]:raise ValueError("Selection changed")
    if sha256(run/"cnn.weights.pt")!=selection["weights_sha256"]:raise ValueError("Weights changed")
    # Scoring must have completed and saved all expected rows before finalization.
    manifest=pd.read_csv(run/"split_manifest.csv.gz",low_memory=False)
    predictions=pd.read_csv(run/"predictions.csv.gz")
    for split in ["test","calibration"]:
        expected=set(manifest.loc[manifest.split.eq(split),"source_id"])
        got=predictions.loc[predictions.split.eq(split),"source_id"]
        if set(got)!=expected or got.duplicated().any():raise ValueError("Incomplete frozen predictions")
    task=selection["dataset"]
    z=np.load(data_dir/task/"prepared_v1.npz",allow_pickle=False)
    ids=manifest.loc[manifest.split.eq("validation"),"array_index"].to_numpy()[:512]
    x=z["x"][ids]
    torch.set_num_threads(4)
    cpu=WaferCNN(len(selection["label_names"]));cpu.load_state_dict(torch.load(run/"cnn.weights.pt",weights_only=True,map_location="cpu"))
    reference=logits_for(cpu,x)
    repeated=logits_for(cpu,x)
    repeat_diff=float(abs(reference-repeated).max())
    gpu=WaferCNN(len(selection["label_names"])).cuda();gpu.load_state_dict(cpu.state_dict())
    torch.backends.cudnn.allow_tf32=True
    reduced=logits_for(gpu,x,"cuda")
    torch.backends.cudnn.allow_tf32=False
    accurate=logits_for(gpu,x,"cuda")
    maxdiff=float(abs(reference-accurate).max())
    if maxdiff>1e-3 or repeat_diff>1e-10:raise ValueError("Portable full-FP32 or CPU repeatability check failed")
    prob=lambda a:expit(a) if task=="mixedwm38" else softmax(a,axis=1)
    predict=lambda p:(p>=np.array(selection["thresholds"])) if task=="mixedwm38" else p.argmax(axis=1)
    p_cpu,p_reduced=prob(reference),prob(reduced)
    verification={"verified_at":utcnow(),"dataset":task,"samples":len(x),"split":"validation",
                  "cpu_repeat_max_abs_logit_diff":repeat_diff,"cpu_full_fp32_gpu_max_abs_logit_diff":maxdiff,
                  "full_fp32_logit_tolerance":1e-3,"passed":True,
                  "original_gpu_tf32_cpu_max_abs_logit_diff":float(abs(reference-reduced).max()),
                  "original_gpu_tf32_cpu_max_abs_score_diff":float(abs(p_cpu-p_reduced).max()),
                  "original_gpu_tf32_cpu_different_decisions":int(np.count_nonzero(predict(p_cpu)!=predict(p_reduced))),
                  "recovery_note":"Original finalizer compared CPU FP32 with default cuDNN TF32 against a strict logit tolerance. The new check disables TF32 for the cross-device FP32 comparison. Frozen training/evaluation scores remain unchanged and used default GPU TF32. Runtime uses CPU FP32; no deployment accuracy identity is claimed from this subset check.",
                  "weights_sha256":sha256(run/"cnn.weights.pt"),"selection_sha256":sha256(run/"selection.json"),
                  "verification_code_sha256":sha256(Path(__file__))}
    write_json(run/"verification.json",verification)
    if not (run/"completion.json").exists():
        write_json(run/"completion.json",{"completed_at":utcnow(),"best_epoch":selection["best_epoch"],
                   "epochs_run":len(pd.read_csv(run/"training_history.csv")),"weights_sha256":selection["weights_sha256"],
                   "selection_sha256":sha256(run/"selection.json"),"metrics_sha256":sha256(run/"metrics.csv"),
                   "predictions_sha256":sha256(run/"predictions.csv.gz"),"holdout_evaluated_once":True,
                   "portability_finalizer":"wafer_verify.py","verification_sha256":sha256(run/"verification.json")})
    print(verification,flush=True)


if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--run-dir",type=Path,required=True);p.add_argument("--data-dir",type=Path,default=Path("data/wafer"))
    a=p.parse_args();verify(a.run_dir,a.data_dir)
