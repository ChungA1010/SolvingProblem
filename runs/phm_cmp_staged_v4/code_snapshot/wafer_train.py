"""Single-run training, validation checkpoint selection, sealed final scoring."""
from __future__ import annotations

import argparse
import json
import os
import random
import time
from pathlib import Path

os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG",":4096:8")
import joblib
import numpy as np
import pandas as pd
import torch
from scipy.special import expit, softmax
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, average_precision_score, classification_report,
                             confusion_matrix, f1_score, hamming_loss, log_loss)
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from torch import nn

from .common import sha256,utcnow,write_json
from .wafer_model import WaferCNN,logits_for,spatial_features


def threshold_search(y,p):
    thresholds=[]
    for column in range(y.shape[1]):
        candidates=[(f1_score(y[:,column],p[:,column]>=t,zero_division=0),-abs(t-.5),-t,t)
                    for t in np.linspace(.15,.85,15)]
        thresholds.append(float(max(candidates)[-1]))
    return thresholds


def metrics(y,p,task,thresholds=None):
    multi=task=="mixedwm38"
    pred=(p>=np.asarray(thresholds)).astype(int) if multi else p.argmax(axis=1)
    result={"n":len(y),"accuracy":float(accuracy_score(y,pred)),
            "macro_f1":float(f1_score(y,pred,average="macro",zero_division=0)),
            "micro_f1":float(f1_score(y,pred,average="micro",zero_division=0))}
    if multi:
        result.update(hamming_loss=float(hamming_loss(y,pred)),macro_average_precision=float(average_precision_score(y,p,average="macro")),
                      brier_score=float(np.square(y-p).mean()),
                      binary_log_loss=float(-(y*np.log(np.clip(p,1e-7,1-1e-7))+(1-y)*np.log(np.clip(1-p,1e-7,1-1e-7))).mean()))
    else:
        result.update(log_loss=float(log_loss(y,p,labels=np.arange(p.shape[1]))),
                      brier_score=float(np.square(np.eye(p.shape[1])[y]-p).sum(axis=1).mean()))
    return result


def reliability(y,p,task):
    if task=="mixedwm38":
        confidence=np.maximum(p,1-p).ravel()
        correct=((p>=.5)==y).ravel()
    else:
        confidence=p.max(axis=1)
        correct=p.argmax(axis=1)==y
    rows=[]
    for lo,hi in zip(np.linspace(0,1,11)[:-1],np.linspace(0,1,11)[1:]):
        mask=(confidence>=lo)&((confidence<hi) if hi<1 else (confidence<=hi))
        if mask.any():
            rows.append({"lower":float(lo),"upper":float(hi),"n":int(mask.sum()),
                         "mean_confidence":float(confidence[mask].mean()),"observed_accuracy":float(correct[mask].mean())})
    ece=sum(row["n"]*abs(row["mean_confidence"]-row["observed_accuracy"]) for row in rows)/len(confidence)
    return {"bins":rows,"expected_calibration_error":ece,"definition":"Equal-width 10 bins; Mixed is pooled binary decisions at 0.5"}


def train(run_dir,data_dir,device,recover=False):
    if (run_dir/"training_started.json").exists() and not recover:
        raise FileExistsError("Run already started; do not overwrite or reuse sealed holdout")
    protocol=json.loads((run_dir/"protocol.json").read_text())
    task=protocol["dataset"]
    source=data_dir/task/"prepared_v1.npz"
    if sha256(source)!=protocol["prepared_sha256"] or sha256(run_dir/"split_manifest.csv.gz")!=protocol["manifest_sha256"]:
        raise ValueError("Prepared data/manifest changed")
    stamp={"started_at":utcnow(),"protocol_sha256":sha256(run_dir/"protocol.json"),
           "code_sha256":{n:sha256(Path(__file__).with_name(n)) for n in ["wafer_data.py","wafer_model.py","wafer_train.py"]}}
    if recover:
        if any((run_dir/n).exists() for n in ["training_history.csv","cnn.weights.pt","selection.json","evaluation_seal.json","recovery.json"]):
            raise FileExistsError("Recovery allowed only before the first completed epoch/weight/holdout")
        stamp.update(reason="First batch failed before optimizer step: CUDA adaptive pooling backward lacks deterministic implementation. Equivalent 8-to-4 fixed average pooling substituted.",
                     original_start_sha256=sha256(run_dir/"training_started.json"),baseline_sha256=sha256(run_dir/"spatial_logistic.joblib"))
        write_json(run_dir/"recovery.json",stamp)
    else:
        write_json(run_dir/"training_started.json",stamp)
    seed=protocol["seed"]
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    torch.set_num_threads(4)
    torch.use_deterministic_algorithms(True)
    torch.backends.cudnn.benchmark=False
    multi=task=="mixedwm38"
    if device=="cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable")
    print(task,"device",device,"torch",torch.__version__,flush=True)
    z=np.load(source,allow_pickle=False)
    x,y,source_ids=z["x"],z["y"],z["source_id"]
    m=pd.read_csv(run_dir/"split_manifest.csv.gz",low_memory=False)
    indices={s:m.loc[m.split.eq(s),"array_index"].to_numpy() for s in ["train","validation","calibration","test"]}
    it,iv=indices["train"],indices["validation"]
    labels=protocol["label_names"]
    # These fits read training labels only. Test outcomes remain unused.
    print(task,"training spatial logistic baseline",flush=True)
    estimator=LogisticRegression(C=1.0,max_iter=600,class_weight="balanced",random_state=seed)
    if multi: estimator=OneVsRestClassifier(estimator,n_jobs=1)
    baseline=make_pipeline(StandardScaler(),estimator)
    if recover:
        baseline=joblib.load(run_dir/"spatial_logistic.joblib")
    else:
        baseline.fit(spatial_features(x[it]),y[it])
        joblib.dump(baseline,run_dir/"spatial_logistic.joblib",compress=3)
    base_val=baseline.predict_proba(spatial_features(x[iv]))
    base_thresholds=threshold_search(y[iv],base_val) if multi else None
    write_json(run_dir/"baseline_validation.json",metrics(y[iv],base_val,task,base_thresholds))
    prior=y[it].mean(axis=0) if multi else np.bincount(y[it],minlength=len(labels))/len(it)
    model=WaferCNN(len(labels)).to(device)
    cfg=protocol["training"]
    if multi:
        positive=y[it].sum(axis=0)
        loss_fn=nn.BCEWithLogitsLoss(pos_weight=torch.tensor(np.clip((len(it)-positive)/np.maximum(positive,1),1,30),dtype=torch.float32,device=device))
    else:
        count=np.bincount(y[it],minlength=len(labels))
        weight=np.sqrt(len(it)/(len(labels)*count))
        weight/=weight.mean()
        loss_fn=nn.CrossEntropyLoss(weight=torch.tensor(weight,dtype=torch.float32,device=device))
    optimizer=torch.optim.AdamW(model.parameters(),lr=cfg["learning_rate"],weight_decay=cfg["weight_decay"])
    scheduler=torch.optim.lr_scheduler.CosineAnnealingLR(optimizer,T_max=cfg["epochs"],eta_min=1e-5)
    rng=np.random.default_rng(seed)
    best=-1.;best_epoch=0;history=[];started=time.monotonic()
    for epoch in range(1,cfg["epochs"]+1):
        model.train();total_loss=0.
        order=rng.permutation(it)
        for start in range(0,len(order),cfg["batch_size"]):
            idx=order[start:start+cfg["batch_size"]]
            batch=torch.from_numpy(x[idx]).to(device=device,dtype=torch.float32)/255
            batch=torch.rot90(batch,int(rng.integers(4)),dims=(-2,-1))
            if rng.random()<.5: batch=batch.flip(-1)
            target=torch.from_numpy(y[idx]).to(device=device,dtype=torch.float32 if multi else torch.long)
            optimizer.zero_grad(set_to_none=True)
            loss=loss_fn(model(batch),target)
            loss.backward();optimizer.step()
            total_loss+=float(loss.detach())*len(idx)
        scheduler.step()
        logits=logits_for(model,x[iv],device)
        p=expit(logits) if multi else softmax(logits,axis=1)
        score=metrics(y[iv],p,task,[.5]*len(labels) if multi else None)
        if score["macro_f1"]>best+1e-12:
            best=score["macro_f1"];best_epoch=epoch
            torch.save({k:v.detach().cpu() for k,v in model.state_dict().items()},run_dir/"cnn.weights.pt")
        row={"epoch":epoch,"train_loss":total_loss/len(it),"validation_macro_f1":score["macro_f1"],
             "validation_accuracy":score["accuracy"],"elapsed_seconds":time.monotonic()-started}
        history.append(row)
        pd.DataFrame(history).to_csv(run_dir/"training_history.csv",index=False)
        print(task,json.dumps(row),"best_epoch",best_epoch,flush=True)
        if epoch>=cfg["minimum_epochs"] and epoch-best_epoch>=cfg["patience"]: break
    model.load_state_dict(torch.load(run_dir/"cnn.weights.pt",map_location=device,weights_only=True))
    val_logits=logits_for(model,x[iv],device)
    val_p=expit(val_logits) if multi else softmax(val_logits,axis=1)
    thresholds=threshold_search(y[iv],val_p) if multi else None
    selection={"created_at":utcnow(),"model":"WaferCNN_v1","dataset":task,"label_names":labels,
               "best_epoch":best_epoch,"thresholds":thresholds,"baseline_thresholds":base_thresholds,
               "validation":metrics(y[iv],val_p,task,thresholds),"train_prior":prior.tolist(),
               "weights_sha256":sha256(run_dir/"cnn.weights.pt"),"baseline_sha256":sha256(run_dir/"spatial_logistic.joblib"),
               "decision_note":"CNN family specified before training. Checkpoint and thresholds selected using Validation only.",
               "probability_note":"Scores are not calibrated probabilities; Calibration reliability is reported separately.",
               "training_seconds":time.monotonic()-started,"device":torch.cuda.get_device_name(0) if device=="cuda" else "cpu",
               "torch_version":torch.__version__,"input_size":64,"input_channels":protocol["input_channels"]}
    write_json(run_dir/"selection.json",selection)
    # Exclusive seal is written BEFORE the first holdout score is computed.
    with (run_dir/"evaluation_seal.json").open("x",encoding="utf-8") as stream:
        json.dump({"sealed_at":utcnow(),"selection_sha256":sha256(run_dir/"selection.json"),
                   "manifest_sha256":protocol["manifest_sha256"],"no_retraining_after_evaluation":True},stream,indent=2)
    all_metrics=[];prediction_rows=[]
    for split in ["calibration","test"]:
        idx=indices[split]
        logits=logits_for(model,x[idx],device)
        p=expit(logits) if multi else softmax(logits,axis=1)
        base=baseline.predict_proba(spatial_features(x[idx]))
        prior_matrix=np.repeat(np.asarray(prior)[None,:],len(idx),axis=0)
        for name,prob,thr in [("WaferCNN",p,thresholds),("SpatialLogistic",base,base_thresholds),("TrainPrior",prior_matrix,[.5]*len(labels) if multi else None)]:
            all_metrics.append({"split":split,"model":name,**metrics(y[idx],prob,task,thr)})
        write_json(run_dir/f"{split}_reliability.json",reliability(y[idx],p,task))
        pred=(p>=np.asarray(thresholds)).astype(int) if multi else p.argmax(axis=1)
        write_json(run_dir/f"{split}_class_report.json",classification_report(y[idx],pred,target_names=labels,output_dict=True,zero_division=0))
        if not multi:
            pd.DataFrame(confusion_matrix(y[idx],pred),index=labels,columns=labels).to_csv(run_dir/f"{split}_confusion.csv")
        for i,array_index in enumerate(idx):
            row={"source_id":int(source_ids[array_index]),"split":split,
                 "target":json.dumps(y[array_index].tolist()),"predicted":json.dumps(pred[i].tolist())}
            row.update({"score_"+label:float(p[i,j]) for j,label in enumerate(labels)})
            prediction_rows.append(row)
    pd.DataFrame(all_metrics).to_csv(run_dir/"metrics.csv",index=False)
    pd.DataFrame(prediction_rows).to_csv(run_dir/"predictions.csv.gz",index=False)
    # Verify the exported portable weights against the original device once.
    cpu=WaferCNN(len(labels)).eval()
    cpu.load_state_dict(torch.load(run_dir/"cnn.weights.pt",map_location="cpu",weights_only=True))
    cpu_logits=logits_for(cpu,x[iv[:32]],"cpu")
    original_diff=float(np.max(np.abs(cpu_logits-val_logits[:32])))
    torch.backends.cudnn.allow_tf32=False
    fp32_logits=logits_for(model,x[iv[:32]],device)
    maxdiff=float(np.max(np.abs(cpu_logits-fp32_logits)))
    if maxdiff>1e-3: raise AssertionError(f"CPU checkpoint reproduction failed: {maxdiff}")
    write_json(run_dir/"completion.json",{"completed_at":utcnow(),"best_epoch":best_epoch,"epochs_run":len(history),
               "cpu_gpu_logit_max_abs_diff":maxdiff,"cpu_gpu_logit_tolerance":1e-3,
               "cpu_original_tf32_max_abs_logit_diff":original_diff,
               "weights_sha256":selection["weights_sha256"],"selection_sha256":sha256(run_dir/"selection.json"),
               "metrics_sha256":sha256(run_dir/"metrics.csv"),"predictions_sha256":sha256(run_dir/"predictions.csv.gz"),
               "holdout_evaluated_once":True})
    print(pd.DataFrame(all_metrics).to_string(index=False),flush=True)


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--run-dir",type=Path,required=True)
    parser.add_argument("--data-dir",type=Path,default=Path("data/wafer"))
    parser.add_argument("--device",choices=["cpu","cuda"],default="cuda")
    parser.add_argument("--recover-before-first-epoch",action="store_true")
    a=parser.parse_args();train(a.run_dir,a.data_dir,a.device,a.recover_before_first_epoch)
