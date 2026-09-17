"""Prepare, train and report the documented three-paper PHM comparison."""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .common import KEYS, TARGET, read_json, sample_id, sha256, utcnow, write_json
from .paper_features import P1_COLUMNS, P3_FINE, P3_ROUGH, assign_cpp, extract
from .paper_models import SEED, fit_p1, fit_p2, fit_p3, regression_metrics

ROOT = Path(__file__).resolve().parents[2]
OUTLIERS = [1834206730, 1834206944, 1834206972, 2058207580]
MODEL_NAMES = ["P1_RF", "P1_GBT", "P1_ERT", "P1_CART_Stack", "P1_ELM_Stack",
               "P2_Persistent", "P2_KNN", "P2_LR", "P2_SVR", "P2_Bagging", "P2_Integrated", "P3_RF", "P3_RF_CPP"]


def code_hashes():
    return {p.name: sha256(p) for p in Path(__file__).parent.glob("paper_*.py")}


def log(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)


def prepare(original_root, external_root, source_run, run_dir):
    if run_dir.exists():
        raise FileExistsError("Use a new run directory; existing evidence is immutable")
    source_manifest = pd.read_csv(source_run / "split_manifest.csv", dtype={"sample_id": str, "group_id": str})
    records, sources = [], []
    for cohort in ["training", "validation", "test"]:
        folder = original_root / "CMP-data" / cohort if cohort == "training" else external_root / cohort
        label_path = original_root / "CMP-training-removalrate.csv" if cohort == "training" else external_root / "labels" / f"CMP-{cohort}-removalrate.csv"
        labels = pd.read_csv(label_path)
        assert not labels.duplicated(KEYS).any()
        frames = []
        for file in sorted(folder.glob(f"CMP-{cohort}-[0-9]*.csv")):
            frame = pd.read_csv(file)
            sources.append({"cohort": cohort, "file": file.name, "sha256": sha256(file), "rows": len(frame)})
            if len(frame):
                frames.append(frame)
        raw = pd.concat(frames, ignore_index=True)
        # Keep source observations for P1's time-domain statistics; no synthetic rows.
        by_key = raw.groupby(KEYS, sort=True)
        assert len(by_key) == len(labels)
        label_map = labels.set_index(KEYS)[TARGET]
        for (wafer, stage), trace in by_key:
            row = {"sample_id": sample_id(wafer, stage), "WAFER_ID": int(wafer), "STAGE": stage,
                   "cohort": cohort, TARGET: float(label_map.loc[(wafer, stage)])}
            row.update(extract(trace)); records.append(row)
        sources.append({"cohort": cohort, "file": label_path.name, "sha256": sha256(label_path), "rows": len(labels)})
        log(f"Extracted {cohort}: {len(labels)} samples, {len(raw)} source rows")
    frame = assign_cpp(pd.DataFrame(records))
    assert frame.sample_id.is_unique and len(frame) == 2829
    frame = frame.merge(source_manifest[["sample_id", "split", "group_id"]], how="left", on="sample_id", validate="one_to_one")
    frame["excluded_extreme"] = frame.STAGE.eq("A") & frame.WAFER_ID.isin(OUTLIERS)
    assert frame.excluded_extreme.sum() == 4
    run_dir.mkdir(parents=True)
    cache = ROOT / ".cache" / "paper_benchmark" / run_dir.name
    cache.mkdir(parents=True, exist_ok=False)
    cache_file = cache / "features.csv.gz"
    frame.to_csv(cache_file, index=False, compression={"method": "gzip", "mtime": 0})
    manifest_cols = ["sample_id", "WAFER_ID", "STAGE", "cohort", "split", "group_id", "condition", "route", "machine", "start", "end", "p3_cpp", "p3_first", "excluded_extreme", "phase_fallback"]
    frame[manifest_cols].to_csv(run_dir / "manifest.csv", index=False)
    assumptions = ROOT / "docs" / "paper-reproduction.md"
    (run_dir / "PROTOCOL.md").write_bytes(assumptions.read_bytes())
    write_json(run_dir / "sources.json", sources)
    pdf_sources = ROOT / ".cache" / "papers" / "sources.json"
    if pdf_sources.exists():
        write_json(run_dir / "paper_sources.json", read_json(pdf_sources))
    publication_audit = {}
    train_wafers = set(frame.loc[frame.cohort.eq("training"), "WAFER_ID"])
    for cohort in ["validation", "test"]:
        partition = frame[frame.cohort.eq(cohort)]
        publication_audit[cohort] = {"n": len(partition), "shared_wafer_ids_with_train": len(train_wafers & set(partition.WAFER_ID))}
    write_json(run_dir / "protocol.json", {
        "created_at": utcnow(), "status": "frozen_before_training", "seed": SEED, "p1_repeats": 20, "p2_mc_cv": 20,
        "model_names": MODEL_NAMES, "selection_rule": "Minimum seed-0 Validation MSE, tie MAE, then model name; Test never selects",
        "final_research_candidate_track": "grouped", "reproduction_status": "partial_with_declared_assumptions",
        "test_exposure": "Both official and grouped Test outcomes were already observed in earlier project work; not fresh independent tests",
        "cache_relative": str(cache_file.relative_to(ROOT)).replace('\\', '/'), "cache_sha256": sha256(cache_file),
        "manifest_sha256": sha256(run_dir / "manifest.csv"), "source_manifest_sha256": sha256(source_run / "split_manifest.csv"),
        "protocol_document_sha256": sha256(run_dir / "PROTOCOL.md"), "code_sha256": code_hashes(),
        "exclude_training_stage_A_wafer_ids": OUTLIERS, "official_overlap_audit": publication_audit,
        "feature_counts": {"P1": 35, "P2": 125, "P3_456": 11, "P3_123": 6},
        "cpp_count": int(frame.p3_cpp.nunique()), "phase_fallback_samples": int(frame.phase_fallback.sum()),
        "frozen_existing_models": read_json(source_run / "selection.json")["model_hashes"],
    })
    log(f"Frozen protocol and feature cache: {run_dir}")


def partitions(frame, track):
    if track == "official":
        result = {"train": frame[frame.cohort.eq("training")], "validation": frame[frame.cohort.eq("validation")], "test": frame[frame.cohort.eq("test")]}
    else:
        result = {split: frame[frame.cohort.eq("training") & frame.split.eq(split)] for split in ["train", "validation", "test"]}
        for i, a in enumerate(result):
            for b in list(result)[i + 1:]:
                assert not (set(result[a].WAFER_ID) & set(result[b].WAFER_ID))
                assert not (set(result[a].group_id) & set(result[b].group_id))
    result["train"] = result["train"][~result["train"].excluded_extreme]
    return {name: part.reset_index(drop=True) for name, part in result.items()}


def save_checkpoint(run_dir, key, model, predictions, seconds, metadata=None):
    cache = ROOT / ".cache" / "paper_benchmark" / run_dir.name
    pred_file = cache / (key + ".joblib")
    joblib.dump(predictions, pred_file, compress=3)
    model_file = run_dir / "models" / (key + ".joblib")
    if model is not None:
        model_file.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, model_file, compress=3)
    record = {"completed_at": utcnow(), "seconds": seconds, "prediction_sha256": sha256(pred_file),
              "model_sha256": sha256(model_file) if model is not None else None, "metadata": metadata}
    write_json(run_dir / "checkpoints" / (key + ".json"), record)
    return predictions, record


def load_checkpoint(run_dir, key):
    path = run_dir / "checkpoints" / (key + ".json")
    if not path.exists():
        return None
    record = read_json(path)
    pred_file = ROOT / ".cache" / "paper_benchmark" / run_dir.name / (key + ".joblib")
    assert sha256(pred_file) == record["prediction_sha256"]
    if record["model_sha256"]:
        assert sha256(run_dir / "models" / (key + ".joblib")) == record["model_sha256"]
    return joblib.load(pred_file), record


def train(run_dir):
    if (run_dir / "completion.json").exists() or (run_dir / "evaluation_seal.json").exists():
        raise FileExistsError("Training/evaluation is sealed; do not tune on this Test")
    protocol = read_json(run_dir / "protocol.json")
    assert code_hashes() == protocol["code_sha256"], "Implementation changed after protocol freeze"
    assert sha256(run_dir / "PROTOCOL.md") == protocol["protocol_document_sha256"]
    cache = ROOT / protocol["cache_relative"]
    assert sha256(cache) == protocol["cache_sha256"]
    frame = pd.read_csv(cache, dtype={"sample_id": str, "group_id": str, "route": str}, float_precision="round_trip")
    all_rows, repeated_rows, selections, integrity = [], [], {}, []
    for track in ["official", "grouped"]:
        parts = partitions(frame, track)
        outputs = {split: {name: np.full(len(part), np.nan) for name in MODEL_NAMES} for split, part in parts.items() if split != "train"}
        repeat_outputs = {split: {name: np.full((20, len(part)), np.nan) for name in MODEL_NAMES[:5]} for split, part in parts.items() if split != "train"}
        grouped = track == "grouped"
        for stage in ["A", "B"]:
            fit = parts["train"][parts["train"].STAGE.eq(stage)].copy()
            for repeat in range(20):
                key = f"{track}_P1_{stage}_seed{repeat:02d}"
                checkpoint = load_checkpoint(run_dir, key)
                if checkpoint is None:
                    started = time.perf_counter()
                    model = fit_p1(fit, SEED + repeat, grouped)
                    preds = {split: model.predict_all(part[part.STAGE.eq(stage)].drop(columns=[TARGET])) for split, part in parts.items() if split != "train"}
                    checkpoint = save_checkpoint(run_dir, key, model if repeat == 0 else None, preds, time.perf_counter() - started)
                    log(f"{key} fitted ({checkpoint[1]['seconds']:.1f}s)")
                preds, record = checkpoint
                for split in outputs:
                    indices = parts[split].index[parts[split].STAGE.eq(stage)]
                    for name, prediction in preds[split].items():
                        repeat_outputs[split][name][repeat, indices] = prediction
                        if repeat == 0:
                            outputs[split][name][indices] = prediction
        for condition in ["Cond1", "Cond2", "Cond3"]:
            key = f"{track}_P2_{condition}"
            checkpoint = load_checkpoint(run_dir, key)
            if checkpoint is None:
                started = time.perf_counter()
                fit = parts["train"][parts["train"].condition.eq(condition)].copy()
                model, cv_rows, features = fit_p2(fit, SEED, grouped, progress=lambda n: log(f"{key} Monte Carlo CV {n}/20") if n % 5 == 0 else None)
                pd.DataFrame(cv_rows).to_csv(run_dir / f"{key}_cv.csv", index=False)
                pd.DataFrame(features).to_csv(run_dir / f"{key}_feature_votes.csv", index=False)
                preds = {split: model.predict_all(part[part.condition.eq(condition)].drop(columns=[TARGET])) for split, part in parts.items() if split != "train"}
                metadata = {"selected_features": np.asarray(model.history.names)[model.selected].tolist(), "weights": dict(zip(MODEL_NAMES[5:10], model.weights.tolist())), "library_n": len(fit)}
                checkpoint = save_checkpoint(run_dir, key, model, preds, time.perf_counter() - started, metadata)
                log(f"{key} fitted ({checkpoint[1]['seconds']:.1f}s)")
            for split in outputs:
                indices = parts[split].index[parts[split].condition.eq(condition)]
                for name, prediction in checkpoint[0][split].items():
                    outputs[split][name][indices] = prediction
        for route in ["456", "123"]:
            key = f"{track}_P3_{route}"
            checkpoint = load_checkpoint(run_dir, key)
            if checkpoint is None:
                started = time.perf_counter()
                fit = parts["train"][parts["train"].route.eq(route)].copy()
                model = fit_p3(fit, SEED)
                preds = {split: model.predict_all(part[part.route.eq(route)].drop(columns=[TARGET])) for split, part in parts.items() if split != "train"}
                checkpoint = save_checkpoint(run_dir, key, model, preds, time.perf_counter() - started,
                    {"features": model.columns, "train_cpp_n": len(model.cpp_residuals), "train_n": len(fit)})
                log(f"{key} fitted")
            for split in outputs:
                indices = parts[split].index[parts[split].route.eq(route)]
                for name, prediction in checkpoint[0][split].items():
                    outputs[split][name][indices] = prediction
        # Validation-only family selection before Test metrics are calculated.
        validation_scores = [{"model": name, **regression_metrics(parts["validation"][TARGET], pred)} for name, pred in outputs["validation"].items()]
        winner = min(validation_scores, key=lambda x: (x["mse"], x["mae"], x["model"]))
        selections[track] = {"model": winner["model"], "validation": winner,
                             "counts": {name: len(part) for name, part in parts.items()}, "selected_at": utcnow()}
        # Only predictions are written here. Test outcomes do not enter selection.
        for split, models in outputs.items():
            part = parts[split]
            for name, pred in models.items():
                assert np.isfinite(pred).all()
                for i, row in part.iterrows():
                    all_rows.append({"track": track, "split": split, "model": name, "sample_id": row.sample_id,
                                     "WAFER_ID": row.WAFER_ID, "STAGE": row.STAGE, "condition": row.condition, "prediction": float(pred[i])})
            for name, values in repeat_outputs[split].items():
                assert np.isfinite(values).all()
                for repeat in range(20):
                    for i, row in part.iterrows():
                        repeated_rows.append({"track": track, "split": split, "model": name, "repeat": repeat,
                                              "sample_id": row.sample_id, "STAGE": row.STAGE, "prediction": float(values[repeat, i])})
        # Reload seed-0 model artifacts against the already frozen predictions.
        for file in sorted((run_dir / "models").glob(track + "_*.joblib")):
            model = joblib.load(file)
            suffix = file.stem
            selector = parts["validation"].STAGE.eq(suffix.split('_')[2]) if "_P1_" in suffix else parts["validation"].condition.eq(suffix.split('_')[2]) if "_P2_" in suffix else parts["validation"].route.eq(suffix.split('_')[2])
            query = parts["validation"][selector].drop(columns=[TARGET])
            predictions = model.predict_all(query)
            expected, _ = load_checkpoint(run_dir, suffix)
            maximum = max(float(np.max(np.abs(predictions[name] - expected["validation"][name]))) for name in predictions)
            assert maximum < 1e-9
            integrity.append({"file": file.name, "sha256": sha256(file), "reload_max_difference": maximum})
    write_json(run_dir / "selection.json", {"created_at": utcnow(), "tracks": selections,
        "final_research_candidate": selections["grouped"]["model"], "deployment_status": "research_candidate; existing API unchanged"})
    prediction_file = run_dir / "predictions.csv.gz"
    pd.DataFrame(all_rows).to_csv(prediction_file, index=False, compression={"method": "gzip", "mtime": 0})
    repeat_file = run_dir / "p1_repeated_predictions.csv.gz"
    pd.DataFrame(repeated_rows).to_csv(repeat_file, index=False, compression={"method": "gzip", "mtime": 0})
    write_json(run_dir / "evaluation_seal.json", {"sealed_at": utcnow(), "selection_sha256": sha256(run_dir / "selection.json"),
        "predictions_sha256": sha256(prediction_file), "repeated_predictions_sha256": sha256(repeat_file), "rule": "No test-based reselection"})
    targets = frame.set_index("sample_id")[TARGET]
    scores = []
    predicted = pd.DataFrame(all_rows)
    for (track, split, model), block in predicted.groupby(["track", "split", "model"], sort=True):
        for stage in ["all", "A", "B"]:
            subset = block if stage == "all" else block[block.STAGE.eq(stage)]
            scores.append({"track": track, "split": split, "model": model, "stage": stage,
                           **regression_metrics(targets.loc[subset.sample_id], subset.prediction)})
    pd.DataFrame(scores).to_csv(run_dir / "metrics.csv", index=False)
    repeated = pd.DataFrame(repeated_rows)
    rows = []
    for (track, split, model, repeat), block in repeated.groupby(["track", "split", "model", "repeat"], sort=True):
        rows.append({"track": track, "split": split, "model": model, "repeat": repeat,
                     **regression_metrics(targets.loc[block.sample_id], block.prediction)})
    pd.DataFrame(rows).to_csv(run_dir / "p1_repeat_metrics.csv", index=False)
    truth = frame[["sample_id", TARGET]].rename(columns={TARGET: "truth"})
    predicted.merge(truth, on="sample_id", validate="many_to_one").to_csv(run_dir / "scored_predictions.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})
    write_json(run_dir / "verification.json", {"created_at": utcnow(), "models": integrity, "all_predictions_finite": True,
        "validation_target_not_in_history_library": True, "test_target_not_in_history_library": True,
        "protocol_sha256": sha256(run_dir / "protocol.json"), "code_sha256": code_hashes()})
    write_json(run_dir / "completion.json", {"completed_at": utcnow(), "selection_sha256": sha256(run_dir / "selection.json"),
        "metrics_sha256": sha256(run_dir / "metrics.csv"), "status": "completed_partial_paper_reconstruction",
        "final_research_candidate": selections["grouped"]["model"], "models_saved": len(integrity)})
    log(f"Completed; grouped Validation-selected candidate: {selections['grouped']['model']}")


def report(run_dir):
    metrics = pd.read_csv(run_dir / "metrics.csv")
    selection = read_json(run_dir / "selection.json")
    protocol = read_json(run_dir / "protocol.json")
    lines = ["# 세 논문 기반 PHM CMP 재현 결과", "",
        "**판정: 명시 조건 구현 + 미기재 조건을 공개한 부분 재현. 저자 수치의 완전 재현은 아니다.**", "",
        "[원문 대응·수식·설정·가정](PROTOCOL.md). 원문 PDF는 재배포하지 않으며 파일 해시는 paper_sources.json에 기록했다.", "",
        f"공통 그룹 분할의 Validation MSE로 선택한 최종 연구 후보: **{selection['final_research_candidate']}**. 기존 API/Unity 모델을 자동 교체하지 않았다.", "",
        "이전 실험에서 이미 확인한 Test를 재사용했다. 이 결과를 새로운 독립 Test나 새 공장/미래 시점의 검증이라고 부르지 않는다.", ""]
    for track in ["official", "grouped"]:
        chosen = selection["tracks"][track]
        lines += [f"## {track} 분할", "", f"표본 수: {chosen['counts']}. 선택 모델: **{chosen['model']}**. 표는 미리 고정한 seed 20260917의 결과다.", "",
            "| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |", "|---|---:|---:|---:|---:|---:|"]
        values = metrics[(metrics.track == track) & (metrics.stage == "all")]
        for name in values[values.split == "validation"].sort_values("mse").model:
            v = values[(values.model == name) & (values.split == "validation")].iloc[0]
            t = values[(values.model == name) & (values.split == "test")].iloc[0]
            lines.append(f"| {name} | {v.mse:.4f} | {t.mse:.4f} | {t.rmse:.4f} | {t.mae:.4f} | {t.r2:.4f} |")
        lines += ["", "Test 순위가 Validation 순위와 달라도 재선정하지 않는다. Stage별·RE·MAPE·두 S-score는 metrics.csv에 있다.", ""]
    lines += ["## 논문 수치와의 대조", "", "| 원문 | 발표한 Test 수치 | 이번 대조 범위 |", "|---|---|---|",
        "| P1 Table 7–8 | CART RMSE A=5.065/B=4.500; ELM A=4.795/B=4.485 | official Stage별 RMSE. ELM/CART 미기재 설정과 집계 차이 때문에 동일 재현으로 단정 불가 |",
        "| P2 Table 5 | Integrated MSE=7.07, Persistent=8.23, KNN=9.60, SVR=7.44, LR=7.32, Bagging=7.22 | official 전체 MSE. 과거 실측 이력의 사용 가능성·CV·모델 설정 미기재 |",
        "| P3 Table II | RF MSE=7.6, CPP revised RF=7.4 | official 전체 MSE. GA 과정 미재현, 최종 subset만 구현, phase 규칙 근사 |", "",
        "이 표의 발표 수치는 학습의 목표값이나 선정 기준으로 사용하지 않았다. 논문의 MSE를 정확도(%)로 바꾸지 않는다.", "",
        "## 반복·무결성·한계", "",
        "- P1: Stage별 20회 seed 반복, 각 반복에서 5-fold stacking. p1_repeat_metrics.csv는 반복별 지표, p1_repeated_predictions.csv.gz는 예측이다.",
        "- P2: condition별 20회 Monte Carlo CV, fold 안에서 이력·선택·전처리 재계산. *_cv.csv와 *_feature_votes.csv에 근거를 기록했다.",
        "- P3: 논문의 최종 11/6개 특징과 CPP 보정 구현. 전체 GA/47개 후보 탐색의 재현을 주장하지 않는다.",
        f"- 원래 대회 분할에서 Train과 동일 wafer가 validation {protocol['official_overlap_audit']['validation']['shared_wafer_ids_with_train']}개, test {protocol['official_overlap_audit']['test']['shared_wafer_ids_with_train']}개 존재한다(다른 Stage).",
        "- 네 극단 제거율의 공통 제외는 P1 조건이며 P2/P3에는 추가 가정이다. 그 극단값을 예측하는 모델로 검증되지 않았다.",
        "- P2의 이웃/과거 정답과 P3 보정은 각 학습 라이브러리에서만 사용한다. holdout 정답을 입력으로 사용하지 않는다.",
        "- P3의 ID·절대시각 입력과 label-free 전체 CPP 구조는 원문에 가까운 내삽 환경이다. 일반적인 신규 웨이퍼 온라인 추론의 보증이 아니다.",
        "- P1 수식 오기/집계 불명확성 때문에 표준 R²와 literal/exp-1 S-score를 분리했다.",
        "- 저장 모델 재로딩 비교와 특징/분할/선정/예측 해시는 verification.json, protocol.json, evaluation_seal.json에 있다.", ""]
    repeat = pd.read_csv(run_dir / "p1_repeat_metrics.csv")
    summary = repeat.groupby(["track", "split", "model"]).agg(mse_mean=("mse", "mean"), mse_std=("mse", "std"), rmse_mean=("rmse", "mean"), rmse_std=("rmse", "std")).reset_index()
    summary.to_csv(run_dir / "p1_repeat_summary.csv", index=False)
    (run_dir / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")
    log(f"Report written: {run_dir / 'REPORT.md'}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["prepare", "train", "report"])
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--original-root", type=Path)
    parser.add_argument("--external-root", type=Path)
    parser.add_argument("--source-run", type=Path, default=ROOT / "runs/phm_cmp_v1")
    args = parser.parse_args()
    with threadpool_limits(4):
        if args.command == "prepare":
            prepare(args.original_root, args.external_root, args.source_run, args.run_dir)
        elif args.command == "train":
            train(args.run_dir)
        else:
            report(args.run_dir)


if __name__ == "__main__":
    main()
