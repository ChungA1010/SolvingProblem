"""Frozen, validation-selected experiments on paper-condition discrepancies."""
from __future__ import annotations

import argparse
from importlib.metadata import version
import json
from pathlib import Path
import platform
import shutil

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .baselines import DEFAULT_SOURCE, check_hash, load_inputs
from .common import TARGET, read_json, sha256, utcnow, write_json
from .paper_benchmark import ROOT, log
from .paper_models import SEED
from .reconstruction_features import augment, p3_view
from .reconstruction_models import fit_meta, fit_p1_bank, fit_p2_variant, fit_p3_variant

GZIP = {"method": "gzip", "mtime": 0}
P2_VARIANTS = [
    {"id": "control", "exclude_four": True, "distance": "standardized", "lag": "completed", "stable_ols": False},
    {"id": "all_rows", "exclude_four": False, "distance": "standardized", "lag": "completed", "stable_ols": False},
    {"id": "raw_usage", "exclude_four": False, "distance": "raw", "lag": "completed", "stable_ols": False},
    {"id": "prior_start", "exclude_four": False, "distance": "raw", "lag": "prior_start", "stable_ols": False},
    {"id": "stable_ols", "exclude_four": False, "distance": "raw", "lag": "prior_start", "stable_ols": True},
    {"id": "stable_ols_clean", "exclude_four": True, "distance": "raw", "lag": "prior_start", "stable_ols": True},
]
P3_VARIANTS = [
    {"id": "control", "exclude_four": True, "phase": "legacy", "cpp": "legacy", "forest": "legacy"},
    {"id": "all_rows", "exclude_four": False, "phase": "legacy", "cpp": "legacy", "forest": "legacy"},
    {"id": "figure3_phase", "exclude_four": False, "phase": "figure3", "cpp": "legacy", "forest": "legacy"},
    {"id": "recipe_cpp_end", "exclude_four": False, "phase": "figure3", "cpp": "primary_end", "forest": "legacy"},
    {"id": "recipe_cpp_start", "exclude_four": False, "phase": "figure3", "cpp": "start", "forest": "legacy"},
    {"id": "recipe_cpp_clean", "exclude_four": True, "phase": "figure3", "cpp": "start", "forest": "legacy"},
    {"id": "random_subspace", "exclude_four": True, "phase": "figure3", "cpp": "start", "forest": "random_subspace"},
]


def meta_specs():
    specs = []
    for mode in ("oof_refit", "oof_fold_average", "table2_in_sample"):
        for leaf in (1, 5, 10):
            for depth in (None, 3):
                specs.append({"id": f"{mode}_cart_{leaf}_{depth}", "mode": mode, "family": "P1_CART_Stack", "leaf": leaf, "depth": depth})
        for hidden in (10, 50, 100):
            for rcond in (1e-8, 1e-5):
                specs.append({"id": f"{mode}_elm_{hidden}_{rcond}", "mode": mode, "family": "P1_ELM_Stack", "hidden": hidden, "rcond": rcond})
    return specs


def metrics(y, prediction):
    y, p = np.asarray(y, float), np.asarray(prediction, float)
    if y.shape != p.shape or not len(y) or not np.isfinite(y).all() or not np.isfinite(p).all():
        raise ValueError("Invalid evaluation input")
    d = p - y
    mse, sst = float(np.square(d).mean()), float(np.square(y - y.mean()).sum())
    relative = float(np.mean(np.abs(d / y))) if np.all(y != 0) else None
    exp = np.where(d < 0, -d / 13, d / 10)
    return {"n": len(y), "mse": mse, "rmse": float(np.sqrt(mse)), "mae": float(np.abs(d).mean()),
            "r2": float(1 - np.square(d).sum() / sst) if sst > 0 else None,
            "relative_error": relative, "mape_percent": 100 * relative if relative is not None else None,
            "s_score_literal_mean": float(np.exp(exp).mean()) if exp.max() <= 700 else None,
            "s_score_minus_one_mean": float(np.expm1(exp).mean()) if exp.max() <= 700 else None,
            "s_score_overflow": bool(exp.max() > 700)}


def hashes():
    directory = Path(__file__).parent
    names = ["common.py", "baselines.py", "paper_features.py", "paper_models.py", "paper_benchmark.py",
             "reconstruction_features.py", "reconstruction_models.py", "reconstruction.py"]
    return {name: sha256(directory / name) for name in names}


def prepare(run, original, external):
    if run.exists():
        raise FileExistsError("Use a new immutable experiment directory")
    original_protocol, frame = load_inputs(DEFAULT_SOURCE)
    frame = augment(frame, original, external, read_json(DEFAULT_SOURCE / "sources.json"), log)
    cache = ROOT / ".cache/reconstruction" / run.name
    cache.mkdir(parents=True, exist_ok=False)
    development = frame[~frame.cohort.eq("test")].reset_index(drop=True)
    test = frame[frame.cohort.eq("test")].reset_index(drop=True)
    development.to_csv(cache / "development.csv.gz", index=False, compression=GZIP)
    test.drop(columns=[TARGET]).to_csv(cache / "test_inputs.csv.gz", index=False, compression=GZIP)
    test[["sample_id", TARGET]].to_csv(cache / "test_truth.csv", index=False)
    run.mkdir(parents=True)
    doc = ROOT / "docs/paper-reconstruction-v2.md"
    (run / "PROTOCOL.md").write_bytes(doc.read_bytes())
    frame[["sample_id", "WAFER_ID", "STAGE", "cohort", "condition", "route", "excluded_extreme", "native_phase_fallback",
           "p3_cpp", "native_cpp_primary_end", "native_cpp_start"]].to_csv(run / "manifest.csv", index=False)
    for name in hashes():
        path = run / "code_snapshot" / name
        path.parent.mkdir(exist_ok=True)
        path.write_bytes((Path(__file__).parent / name).read_bytes())
    old_models = read_json(DEFAULT_SOURCE / "verification.json")["models"]
    write_json(run / "protocol.json", {"frozen_at": utcnow(), "seed": SEED, "track": "official", "p1_repeats": 20,
        "p1_candidates": meta_specs(), "p2_candidates": P2_VARIANTS, "p3_candidates": P3_VARIANTS,
        "selection_rule": "P1 each Stage and meta-family: minimum Validation MSE, tie MAE then candidate id; P2/P3: whole-Validation Integrated/CPP MSE respectively, tie MAE then id. Retain control if best. No test-based selection.",
        "test_exposure": original_protocol["test_exposure"], "status": "partial_reconstruction_and_validation_selected_development",
        "cache_relative": cache.relative_to(ROOT).as_posix(), "cache_hashes": {p.name: sha256(p) for p in cache.iterdir()},
        "code_sha256": hashes(), "document_sha256": sha256(run / "PROTOCOL.md"), "manifest_sha256": sha256(run / "manifest.csv"),
        "original_models": old_models, "original_protocol_sha256": sha256(DEFAULT_SOURCE / "protocol.json"),
        "counts": {c: int(frame.cohort.eq(c).sum()) for c in ("training", "validation", "test")},
        "cpp_counts": {c: int(frame[c].nunique()) for c in ("p3_cpp", "native_cpp_primary_end", "native_cpp_start")},
        "phase_fallback": int(frame.native_phase_fallback.sum())})
    write_json(run / "environment.json", {"python": platform.python_version(), "packages": {n: version(n) for n in ("numpy", "pandas", "scipy", "scikit-learn", "joblib")}})
    log(f"Frozen candidate list and separated development/test-label caches: {run}")


def context(run):
    protocol = read_json(run / "protocol.json")
    if hashes() != protocol["code_sha256"]:
        raise ValueError("Code changed after candidate freeze")
    check_hash(run / "PROTOCOL.md", protocol["document_sha256"])
    check_hash(run / "manifest.csv", protocol["manifest_sha256"])
    return protocol, ROOT / protocol["cache_relative"]


def read_frame(path):
    return pd.read_csv(path, dtype={"sample_id": str, "route": str, "group_id": str}, float_precision="round_trip")


def cached(cache, key, factory):
    path, record = cache / f"{key}.joblib", cache / f"{key}.json"
    if record.exists():
        check_hash(path, read_json(record)["sha256"])
        return joblib.load(path)
    result = factory()
    joblib.dump(result, path, compress=3)
    write_json(record, {"sha256": sha256(path), "completed_at": utcnow()})
    return result


def route_train(frame, spec, column, value):
    fit = frame[frame[column].astype(str).eq(value)].copy()
    return fit[~fit.excluded_extreme].copy() if spec["exclude_four"] else fit


def rows_for(part, predictions, split, repeat=0):
    blocks = []
    for name, prediction in predictions.items():
        block = part[["sample_id", "STAGE"]].copy()
        block["model"], block["split"], block["repeat"] = name, split, repeat
        block["prediction"] = prediction
        blocks.append(block)
    return pd.concat(blocks, ignore_index=True)


def train(run):
    if (run / "training_complete.json").exists() or (run / "evaluation_seal.json").exists():
        raise FileExistsError("Completed experiment cannot be retrained")
    protocol, cache = context(run)
    check_hash(cache / "development.csv.gz", protocol["cache_hashes"]["development.csv.gz"])
    dev = read_frame(cache / "development.csv.gz")
    if not set(dev.cohort) <= {"training", "validation"}:
        raise ValueError("Test labels entered development data")
    train_frame = dev[dev.cohort.eq("training")].reset_index(drop=True)
    validation = dev[dev.cohort.eq("validation")].reset_index(drop=True)
    choices, trials, fitted = {"p1": {}, "p2": None, "p3": None}, [], {}
    for stage in ("A", "B"):
        fit = train_frame[train_frame.STAGE.eq(stage) & ~train_frame.excluded_extreme]
        query = validation[validation.STAGE.eq(stage)].drop(columns=[TARGET])
        truth = validation.loc[query.index, TARGET]
        bank = cached(cache, f"P1_{stage}_bank", lambda: fit_p1_bank(fit, SEED))
        stage_rows, models = [], {}
        for spec in protocol["p1_candidates"]:
            model = fit_meta(bank, fit[TARGET], spec, SEED)
            Z = np.column_stack(list(bank.base_predict(query, spec["mode"]).values()))
            score = {"paper": "p1", "stage": stage, "model": spec["family"], "candidate": spec["id"], **metrics(truth, model.predict(Z))}
            stage_rows.append(score); models[spec["id"]] = model
        choices["p1"][stage] = {}
        for family in ("P1_CART_Stack", "P1_ELM_Stack"):
            best = min((r for r in stage_rows if r["model"] == family), key=lambda r: (r["mse"], r["mae"], r["candidate"]))
            spec = next(s for s in protocol["p1_candidates"] if s["id"] == best["candidate"])
            choices["p1"][stage][family] = {"spec": spec, "validation": best}
            bank.chosen[family] = (spec, models[spec["id"]])
            log(f"P1 {stage} {family}: Validation-selected {spec['id']} MSE={best['mse']:.5f}")
        trials.extend(stage_rows); fitted[f"P1_{stage}"] = bank
    for paper, specs, column, values, primary in (
        ("p2", protocol["p2_candidates"], "condition", ("Cond1", "Cond2", "Cond3"), "P2_Integrated"),
        ("p3", protocol["p3_candidates"], "route", ("456", "123"), "P3_RF_CPP")):
        scores = []
        for spec in specs:
            fit_frame = p3_view(train_frame, spec) if paper == "p3" else train_frame
            valid_frame = p3_view(validation, spec) if paper == "p3" else validation
            outputs = {}
            for route in values:
                key = f"{paper}_{spec['id']}_{route}"
                fit = route_train(fit_frame, spec, column, route)
                if paper == "p2":
                    factory = lambda: fit_p2_variant(fit, SEED, spec, lambda n: log(f"{key}: CV {n}/20") if n % 10 == 0 else None)
                    model, cv, votes = cached(cache, key, factory)
                    pd.DataFrame(cv).to_csv(run / f"{key}_cv.csv", index=False)
                    pd.DataFrame(votes).to_csv(run / f"{key}_votes.csv", index=False)
                else:
                    model = cached(cache, key, lambda: fit_p3_variant(fit, SEED, spec))
                idx = valid_frame.index[valid_frame[column].astype(str).eq(route)]
                pred = model.predict_all(valid_frame.loc[idx].drop(columns=[TARGET]))
                for name, values_pred in pred.items():
                    if name not in outputs:
                        outputs[name] = np.full(len(validation), np.nan)
                    outputs[name][idx] = values_pred
                fitted[key] = model
            variant_scores = [{"paper": paper, "stage": "all", "model": name, "candidate": spec["id"], **metrics(validation[TARGET], pred)} for name, pred in outputs.items()]
            trials.extend(variant_scores)
            scores.append(next(r for r in variant_scores if r["model"] == primary))
            log(f"{paper}/{spec['id']} Validation {primary} MSE={scores[-1]['mse']:.5f}")
        best = min(scores, key=lambda r: (r["mse"], r["mae"], r["candidate"]))
        choices[paper] = {"spec": next(s for s in specs if s["id"] == best["candidate"]), "validation": best}
    pd.DataFrame(trials).to_csv(run / "validation_trials.csv", index=False)
    # All choices are fixed before any current-run Test prediction or score.
    if (run / "selection.json").exists():
        if read_json(run / "selection.json")["choices"] != choices:
            raise ValueError("Resumed selection differs from sealed choices")
    else:
        write_json(run / "selection.json", {"selected_at": utcnow(), "rule": protocol["selection_rule"], "choices": choices,
            "validation_trials_sha256": sha256(run / "validation_trials.csv"), "test_labels_read_during_selection": False})
    check_hash(cache / "test_inputs.csv.gz", protocol["cache_hashes"]["test_inputs.csv.gz"])
    test = read_frame(cache / "test_inputs.csv.gz")
    if TARGET in test:
        raise ValueError("Test prediction input contains labels")
    parts = {"validation": validation.drop(columns=[TARGET]), "test": test}
    predictions, repeats, model_index = [], [], []
    (run / "models").mkdir(exist_ok=True)
    for stage in ("A", "B"):
        fit = train_frame[train_frame.STAGE.eq(stage) & ~train_frame.excluded_extreme]
        for repeat in range(20):
            def repeat_fit():
                bank = fitted[f"P1_{stage}"] if repeat == 0 else fit_p1_bank(fit, SEED + repeat)
                if repeat:
                    for family, chosen in choices["p1"][stage].items():
                        spec = chosen["spec"]
                        bank.chosen[family] = (spec, fit_meta(bank, fit[TARGET], spec, SEED + repeat))
                pred = {split: bank.predict_all(part[part.STAGE.eq(stage)]) for split, part in parts.items()}
                if repeat == 0:
                    joblib.dump(bank, run / "models" / f"P1_{stage}.joblib", compress=3)
                return pred
            result = cached(cache, f"P1_selected_{stage}_{repeat:02d}", repeat_fit)
            for split, part in parts.items():
                block = rows_for(part[part.STAGE.eq(stage)], result[split], split, repeat)
                repeats.append(block)
                if repeat == 0:
                    predictions.append(block)
            if repeat % 5 == 0 or repeat == 19:
                log(f"P1 {stage}: fixed-choice repeat {repeat + 1}/20 completed")
    for paper, column, values in (("p2", "condition", ("Cond1", "Cond2", "Cond3")), ("p3", "route", ("456", "123"))):
        spec = choices[paper]["spec"]
        for route in values:
            model = fitted[f"{paper}_{spec['id']}_{route}"]
            joblib.dump(model, run / "models" / f"{paper.upper()}_{route}.joblib", compress=3)
            for split, part in parts.items():
                query = p3_view(part, spec) if paper == "p3" else part
                query = query[query[column].astype(str).eq(route)]
                predictions.append(rows_for(query, model.predict_all(query), split))
    for path in sorted((run / "models").glob("*.joblib")):
        model_index.append({"file": path.name, "sha256": sha256(path)})
    pd.concat(predictions, ignore_index=True).to_csv(run / "predictions.csv.gz", index=False, compression=GZIP)
    pd.concat(repeats, ignore_index=True).to_csv(run / "p1_repeated_predictions.csv.gz", index=False, compression=GZIP)
    write_json(run / "training_complete.json", {"completed_at": utcnow(), "selection_sha256": sha256(run / "selection.json"),
        "predictions_sha256": sha256(run / "predictions.csv.gz"), "repeated_predictions_sha256": sha256(run / "p1_repeated_predictions.csv.gz"), "models": model_index})
    log("Training and selection complete; Test labels have not been loaded by the train command")


def score_frame(pred, targets):
    rows = []
    for (split, model, repeat), block in pred.groupby(["split", "model", "repeat"], sort=True):
        for stage in ("all", "A", "B"):
            part = block if stage == "all" else block[block.STAGE.eq(stage)]
            rows.append({"split": split, "model": model, "repeat": int(repeat), "stage": stage, **metrics(targets.loc[part.sample_id], part.prediction)})
    return pd.DataFrame(rows)


def evaluate(run):
    if (run / "evaluation_seal.json").exists():
        raise FileExistsError("Evaluation is sealed; do not reselect or overwrite")
    protocol, cache = context(run)
    complete = read_json(run / "training_complete.json")
    for name, key in (("selection.json", "selection_sha256"), ("predictions.csv.gz", "predictions_sha256"), ("p1_repeated_predictions.csv.gz", "repeated_predictions_sha256")):
        check_hash(run / name, complete[key])
    for record in complete["models"]:
        check_hash(run / "models" / record["file"], record["sha256"])
    # Seal before reading the separately stored Test labels.
    write_json(run / "evaluation_seal.json", {"sealed_at": utcnow(), "selection_sha256": complete["selection_sha256"], "predictions_sha256": complete["predictions_sha256"]})
    check_hash(cache / "test_truth.csv", protocol["cache_hashes"]["test_truth.csv"])
    check_hash(cache / "development.csv.gz", protocol["cache_hashes"]["development.csv.gz"])
    dev, test_y = read_frame(cache / "development.csv.gz"), read_frame(cache / "test_truth.csv")
    targets = pd.concat([dev[["sample_id", TARGET]], test_y]).set_index("sample_id")[TARGET]
    pred = read_frame(run / "predictions.csv.gz")
    scores = score_frame(pred, targets)
    scores.to_csv(run / "metrics.csv", index=False)
    pred.merge(targets.rename("truth"), left_on="sample_id", right_index=True, validate="many_to_one").to_csv(run / "scored_predictions.csv.gz", index=False, compression=GZIP)
    repeat_scores = score_frame(read_frame(run / "p1_repeated_predictions.csv.gz"), targets)
    repeat_scores.to_csv(run / "p1_repeat_metrics.csv", index=False)
    repeat_scores.groupby(["split", "model", "stage"]).agg(rmse_mean=("rmse", "mean"), rmse_std=("rmse", "std"), mse_mean=("mse", "mean"), mse_std=("mse", "std")).reset_index().to_csv(run / "p1_repeat_summary.csv", index=False)
    old = read_frame(DEFAULT_SOURCE / "metrics.csv")
    old = old[old.track.eq("official")].drop(columns=["track"])
    comparison = scores.merge(old, on=["split", "model", "stage"], validate="one_to_one", suffixes=("_v2", "_v1"))
    comparison["mse_reduction_percent"] = 100 * (1 - comparison.mse_v2 / comparison.mse_v1)
    comparison.to_csv(run / "comparison.csv", index=False)
    reload_diffs = {}
    inputs = {"validation": dev[dev.cohort.eq("validation")].drop(columns=[TARGET]), "test": read_frame(cache / "test_inputs.csv.gz")}
    choices = read_json(run / "selection.json")["choices"]
    for record in complete["models"]:
        path = run / "models" / record["file"]
        paper, route = path.stem.split("_", 1)
        model = joblib.load(path)
        maximum = 0.
        for split, frame in inputs.items():
            if paper == "P3":
                frame = p3_view(frame, choices["p3"]["spec"])
            column = "STAGE" if paper == "P1" else "condition" if paper == "P2" else "route"
            query = frame[frame[column].astype(str).eq(route)]
            for name, values in model.predict_all(query).items():
                expected = pred[pred.model.eq(name) & pred.split.eq(split)].set_index("sample_id").loc[query.sample_id, "prediction"].to_numpy()
                maximum = max(maximum, float(np.abs(values - expected).max()))
        if maximum > 1e-8:
            raise ValueError(f"Reload mismatch: {path.name}: {maximum}")
        reload_diffs[path.name] = maximum
    for record in protocol["original_models"]:
        check_hash(DEFAULT_SOURCE / "models" / record["file"], record["sha256"])
    write_json(run / "verification.json", {"verified_at": utcnow(), "reload_max_difference": reload_diffs, "original_models_unchanged": True,
        "evaluation_n": len(test_y), "same_test_sample_ids_as_v1": set(test_y.sample_id) == set(read_frame(DEFAULT_SOURCE / "scored_predictions.csv.gz").query("track == 'official' and split == 'test'").sample_id)})
    report(run)
    write_json(run / "completion.json", {"completed_at": utcnow(), "status": "completed_partial_reconstruction_v2", "metrics_sha256": sha256(run / "metrics.csv"),
        "selection_sha256": complete["selection_sha256"], "report_sha256": sha256(run / "REPORT.md")})
    log("Evaluation completed; retain all degradations and improvements")


def report(run):
    comparison = read_frame(run / "comparison.csv")
    choices = read_json(run / "selection.json")["choices"]
    protocol = read_json(run / "protocol.json")
    lines = ["# 논문별 원래 조건 차이 검증 — v2", "", "**원문 조건의 완전 재현이 아닌, 근거가 있는 조건 수정과 미기재 설정의 제한된 검증 실험이다.**", "",
        "공식 Train 1,981 / Validation 424 / Test 424를 사용했다. P1은 명시된 네 극단 Train 표본을 제외했다. P2/P3는 포함·제외 대조군을 비교했다.", "",
        "설정은 Validation MSE로 고르고 모든 선택을 저장한 뒤 Test 예측·평가를 했다. 이전에 본 Test를 다시 쓰는 개발 실험이며 새로운 독립 검증이 아니다. API/Unity 모델을 교체하지 않았다.", "",
        "## Validation으로 선택한 조건", ""]
    for stage, families in choices["p1"].items():
        for family, value in families.items():
            lines.append(f"- P1 {stage}/{family}: `{value['spec']['id']}`")
    for paper in ("p2", "p3"):
        lines.append(f"- {paper.upper()}: `{choices[paper]['spec']['id']}`; Train 네 극단 표본 제외={choices[paper]['spec']['exclude_four']}")
    lines += ["", "## 같은 Test에서 이전 구현과 비교", "", "MSE·RMSE는 낮을수록 좋다. 아래는 사전에 고정한 seed 0의 결과이며 반복 평균으로 대체하지 않는다.", "",
              "| 모델 | v1 MSE | v2 MSE | v1 RMSE | v2 RMSE | MSE 감소율 |", "|---|---:|---:|---:|---:|---:|"]
    for row in comparison[comparison.split.eq("test") & comparison.stage.eq("all")].itertuples(index=False):
        lines.append(f"| {row.model} | {row.mse_v1:.4f} | {row.mse_v2:.4f} | {row.rmse_v1:.4f} | {row.rmse_v2:.4f} | {row.mse_reduction_percent:.2f}% |")
    lines += ["", "## 원문 대표 지표와 대조", "", "| 원문 비교 모델 | 지표 | 발표값 | v2 |", "|---|---|---:|---:|"]
    for model, stage, metric, published in [("P1_CART_Stack", "A", "rmse", 5.065), ("P1_CART_Stack", "B", "rmse", 4.5),
        ("P1_ELM_Stack", "A", "rmse", 4.795), ("P1_ELM_Stack", "B", "rmse", 4.485), ("P2_Integrated", "all", "mse", 7.07), ("P3_RF_CPP", "all", "mse", 7.4)]:
        r = comparison[comparison.model.eq(model) & comparison.stage.eq(stage) & comparison.split.eq("test")].iloc[0]
        lines.append(f"| {model} / {stage} | {metric.upper()} | {published:.3f} | {r[metric + '_v2']:.4f} |")
    lines += ["", "## 해석 범위와 근거", "",
        "- [원문 근거·사전에 정한 가정과 후보](PROTOCOL.md), [모든 Validation 후보 점수](validation_trials.csv), [최종 선택](selection.json)",
        "- [전체·Stage별 지표](metrics.csv), [v1과 전체 비교](comparison.csv), [P1 20회 반복](p1_repeat_summary.csv)",
        "- [저장 모델과 학습 완료 기록](training_complete.json), [재로딩·기존 모델 보존](verification.json)",
        "- Test가 나빠져도 설정을 다시 고르지 않는다. MSE 감소율은 오차 감소량이며 예측 정확도 %가 아니다.",
        "- P1 Table 2의 in-sample 해석과 본문의 OOF 해석을 구분했다. ELM/CART 설정 후보는 저자의 원래 설정을 확인한 값이 아니다.",
        "- P2의 start 기반 lag는 이전에 시작했지만 아직 완료하지 않은 학습 run의 실측값을 사용할 수 있는 사후 분석 가정이다. 실시간 서비스의 측정 가능성을 검증하지 않았다.",
        "- P2 SVD 절단 OLS는 수치 안정성 보완이며 원문 알고리즘과 완전히 같은 OLS 해를 보장하지 않는다.",
        f"- P3 CPP 수는 {protocol['cpp_counts']}, phase fallback={protocol['phase_fallback']}건이다. 원문의 2,929 runs/1,267 CPP와 일치를 강제로 맞추지 않았다.",
        "- 전체 GA/85-feature 검색·DBN/신경망·저자 코드 복원은 이번 범위에 포함하지 않았다. 같은 연구의 다음 실험으로 독립성이 회복되지는 않는다.", ""]
    (run / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("command", choices=("prepare", "train", "evaluate"))
    p.add_argument("--run-dir", type=Path, required=True)
    p.add_argument("--original-root", type=Path)
    p.add_argument("--external-root", type=Path)
    args = p.parse_args()
    with threadpool_limits(4):
        if args.command == "prepare":
            prepare(args.run_dir, args.original_root, args.external_root)
        elif args.command == "train":
            train(args.run_dir)
        else:
            evaluate(args.run_dir)


if __name__ == "__main__":
    main()
