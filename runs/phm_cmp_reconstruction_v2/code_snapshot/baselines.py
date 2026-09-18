"""Independent, fixed-protocol baselines for each of the three CMP papers.

The original paper_*.py implementation and completed experiments stay immutable.
An evaluation reloads existing models; a train run fits one paper in a new directory.
"""
from __future__ import annotations

import argparse
from importlib.metadata import version
import os
from pathlib import Path
import platform
import time

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .common import TARGET, read_json, sha256, utcnow, write_json
from .paper_benchmark import ROOT, log, partitions
from .paper_models import fit_p1, fit_p2, fit_p3, regression_metrics

DEFAULT_SOURCE = ROOT / "runs/phm_cmp_papers_v1"
TRACKS = ("official", "grouped")
GZIP = {"method": "gzip", "mtime": 0}


def check_hash(path, expected):
    if not path.is_file() or sha256(path) != expected:
        raise ValueError(f"Missing or changed artifact: {path}")


def spec_for(paper):
    if paper not in ("p1", "p2", "p3"):
        raise ValueError(f"Unknown paper: {paper}")
    return read_json(ROOT / "baselines" / paper / "baseline.json")


def load_inputs(source, feature_cache=None):
    protocol = read_json(source / "protocol.json")
    check_hash(source / "manifest.csv", protocol["manifest_sha256"])
    check_hash(source / "PROTOCOL.md", protocol["protocol_document_sha256"])
    for name, digest in protocol["code_sha256"].items():
        check_hash(Path(__file__).parent / name, digest)
    cache = Path(feature_cache) if feature_cache else ROOT / protocol["cache_relative"]
    if not cache.is_file():
        raise FileNotFoundError("Local feature cache is required. Follow baselines/README.md to prepare raw PHM data.")
    check_hash(cache, protocol["cache_sha256"])
    frame = pd.read_csv(cache, dtype={"sample_id": str, "group_id": str, "route": str}, float_precision="round_trip")
    if not frame.sample_id.is_unique:
        raise ValueError("Duplicate sample IDs in feature cache")
    return protocol, frame


def model_filename(spec, track, route):
    suffix = "_seed00" if spec["paper"] == "p1" else ""
    return f"{track}_{spec['paper'].upper()}_{route}{suffix}.joblib"


def model_record(path, output, track, route):
    return {"path": Path(os.path.relpath(path, output)).as_posix(), "sha256": sha256(path),
            "track": track, "route": route}


def predict_records(spec, records, root, track, query):
    """Route by paper-specific metadata; target columns never reach a predictor."""
    query = query.drop(columns=[TARGET, "truth"], errors="ignore").reset_index(drop=True)
    if query.empty or not query.sample_id.is_unique:
        raise ValueError("Prediction inputs must be nonempty with unique sample_id values")
    route_col = spec["routing_column"]
    routes = query[route_col].astype(str)
    if not routes.isin(spec["routing_values"]).all():
        raise ValueError(f"Unsupported {route_col}; expected {spec['routing_values']}")
    result = {name: np.full(len(query), np.nan) for name in spec["models"]}
    for route in spec["routing_values"]:
        idx = query.index[routes.eq(route)]
        if not len(idx):
            continue
        matches = [r for r in records if r["track"] == track and r["route"] == route]
        if len(matches) != 1:
            raise ValueError(f"Expected one saved model for {track}/{route}")
        record = matches[0]
        path = root / record["path"]
        check_hash(path, record["sha256"])
        model = joblib.load(path)
        predictions = model.predict_all(query.loc[idx])
        if set(predictions) != set(spec["models"]):
            raise ValueError("Saved model does not match the baseline model family")
        for name, values in predictions.items():
            values = np.asarray(values, float)
            if values.shape != (len(idx),) or not np.isfinite(values).all():
                raise ValueError(f"Invalid predictions: {name}")
            result[name][idx] = values
    return result


def prediction_rows(part, predictions, track, split, repeat=0):
    blocks = []
    for model, values in predictions.items():
        block = part[["sample_id", "STAGE"]].copy()
        block["track"], block["split"], block["model"], block["repeat"] = track, split, model, repeat
        block["prediction"] = values
        blocks.append(block)
    return pd.concat(blocks, ignore_index=True)


def score_predictions(predictions, targets):
    scores = []
    for (track, split, model, repeat), block in predictions.groupby(["track", "split", "model", "repeat"], sort=True):
        for stage in ("all", "A", "B"):
            subset = block if stage == "all" else block[block.STAGE.eq(stage)]
            if subset.empty:
                continue
            scores.append({"track": track, "split": split, "model": model, "repeat": int(repeat), "stage": stage,
                           **regression_metrics(targets.loc[subset.sample_id], subset.prediction)})
    return pd.DataFrame(scores)


def train_one_paper(spec, parts_by_track, output):
    records, repeated = [], []
    for track, parts in parts_by_track.items():
        grouped = track == "grouped"
        for repeat in range(spec["training_repeats"]):
            assembled = {split: {name: np.full(len(part), np.nan) for name in spec["models"]}
                         for split, part in parts.items() if split != "train"}
            for route in spec["routing_values"]:
                route_col = spec["routing_column"]
                train = parts["train"][parts["train"][route_col].astype(str).eq(route)].copy()
                seed = spec["seed"] + repeat
                if spec["paper"] == "p1":
                    model = fit_p1(train, seed, grouped)
                elif spec["paper"] == "p2":
                    model, cv, votes = fit_p2(train, seed, grouped, progress=lambda n: log(f"{track}/{route} CV {n}/20") if n % 5 == 0 else None)
                    pd.DataFrame(cv).to_csv(output / f"{track}_{route}_cv.csv", index=False)
                    pd.DataFrame(votes).to_csv(output / f"{track}_{route}_feature_votes.csv", index=False)
                else:
                    model = fit_p3(train, seed)
                if repeat == spec["saved_repeat"]:
                    path = output / "models" / model_filename(spec, track, route)
                    path.parent.mkdir(parents=True, exist_ok=True)
                    joblib.dump(model, path, compress=3)
                    records.append(model_record(path, output, track, route))
                for split, dest in assembled.items():
                    part = parts[split]
                    idx = part.index[part[route_col].astype(str).eq(route)]
                    for name, values in model.predict_all(part.loc[idx].drop(columns=[TARGET])).items():
                        dest[name][idx] = values
                log(f"Fitted {track}/{spec['paper']}/{route}, repeat {repeat + 1}/{spec['training_repeats']}")
            for split, predictions in assembled.items():
                if any(not np.isfinite(v).all() for v in predictions.values()):
                    raise ValueError("Incomplete training predictions")
                repeated.append(prediction_rows(parts[split], predictions, track, split, repeat))
    return records, pd.concat(repeated, ignore_index=True)


def source_model_records(source, output, spec, tracks):
    expected = {r["file"]: r["sha256"] for r in read_json(source / "verification.json")["models"]}
    records = []
    for track in tracks:
        for route in spec["routing_values"]:
            path = source / "models" / model_filename(spec, track, route)
            check_hash(path, expected[path.name])
            records.append(model_record(path, output, track, route))
    seal = read_json(source / "evaluation_seal.json")
    check_hash(source / "predictions.csv.gz", seal["predictions_sha256"])
    check_hash(source / "metrics.csv", read_json(source / "completion.json")["metrics_sha256"])
    return records


def compare_predictions(actual, expected):
    keys = ["track", "split", "model", "sample_id"]
    joined = actual.merge(expected[keys + ["prediction"]], on=keys, how="outer", validate="one_to_one", suffixes=("", "_expected"), indicator=True)
    if not joined._merge.eq("both").all():
        raise ValueError("Reloaded predictions have different sample/model keys")
    maximum = float(np.abs(joined.prediction - joined.prediction_expected).max())
    if not np.isfinite(maximum) or maximum > 1e-8:
        raise ValueError(f"Reloaded predictions differ: {maximum}")
    return maximum


def write_report(output, spec, metrics, protocol, verification):
    lines = [f"# {spec['paper'].upper()} baseline 결과", "", f"[{spec['title']}]({spec['source']}) ({spec['year']})", "",
             "**명시 조건 구현 + 미기재 조건을 공개한 부분 재현. 원문 수치의 완전 재현이 아니다.**", "",
             f"실행: `{protocol['mode']}`. 모델 {len(spec['models'])}종; 고정 seed {spec['seed']}. "
             "evaluate는 기존 학습 모델을 다시 로딩한 결과이며 재학습을 의미하지 않는다.", "",
             "모든 baseline을 유지하며 Test 점수로 다시 선정하지 않는다. 기존 Test를 사용하므로 새 독립 평가가 아니다.", "",
             f"원문 방법의 대표 비교 대상: {', '.join(spec['reference_models'])}. 이 목록은 성능 순위가 아니다.", ""]
    for track in protocol["tracks"]:
        lines += [f"## {track}", "", f"표본 수: {protocol['counts'][track]}", "",
                  "| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |",
                  "|---|---:|---:|---:|---:|---:|"]
        rows = metrics[metrics.track.eq(track) & metrics.stage.eq("all")]
        for name in spec["models"]:
            valid = rows[rows.model.eq(name) & rows.split.eq("validation")].iloc[0]
            test = rows[rows.model.eq(name) & rows.split.eq("test")].iloc[0]
            lines.append(f"| {name} | {valid.mse:.4f} | {test.mse:.4f} | {test.rmse:.4f} | {test.mae:.4f} | {test.r2:.4f} |")
        lines += [""]
    lines += ["## 실행 기록", "",
              "- [고정 설정](baseline.json), [원문 조건과 가정](PROTOCOL.md), [실행 프로토콜](protocol.json)",
              "- [저장 모델 경로·SHA-256](models.json), [전체·Stage별 지표](metrics.csv)",
              "- [평가 전 예측 기록](evaluation_seal.json), [재로딩 검증](verification.json)",
              f"- 저장 모델 재로딩 최대 예측 차이: {verification['reload_max_difference']:.12g}",
              "- P2/P3에도 P1의 네 극단 Train 표본 제외를 적용했다. 원 논문의 모든 조건과 같은 것은 아니다.",
              "- official 분할에는 서로 다른 Stage에서 Train과 같은 wafer가 있다. grouped는 wafer/file 연결 그룹을 분리한다.",
              "- 이 baseline과 기존 Physics+ML 후보 전체를 공통 조건으로 재학습한 최종 비교는 별도 작업이다.", ""]
    if spec["paper"] == "p1":
        lines += ["P1 표는 seed 0 모델의 점수다. [20회 반복 통계](repeat_summary.csv)는 별도 결과이며 저장 모델의 성능으로 대체하지 않는다.", ""]
    (output / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")


def execute(paper, mode, source, output, tracks=TRACKS, feature_cache=None):
    if mode not in ("train", "evaluate") or not tracks or len(set(tracks)) != len(tracks) or not set(tracks) <= set(TRACKS):
        raise ValueError("Choose train/evaluate and distinct official/grouped tracks")
    source, output = Path(source).resolve(), Path(output).resolve()
    if output.exists() or output == source or source in output.parents:
        raise FileExistsError("Use a new output directory outside the immutable source run")
    spec = spec_for(paper)
    source_protocol, frame = load_inputs(source, feature_cache)
    parts = {track: partitions(frame, track) for track in tracks}
    records = source_model_records(source, output, spec, tracks) if mode == "evaluate" else []
    output.mkdir(parents=True, exist_ok=False)
    started = time.perf_counter()
    protocol = {"created_at": utcnow(), "mode": mode, "paper": paper, "tracks": list(tracks),
                "status": "frozen_before_execution", "counts": {t: {s: len(p) for s, p in part.items()} for t, part in parts.items()},
                "source_run": Path(os.path.relpath(source, output)).as_posix(), "source_protocol_sha256": sha256(source / "protocol.json"),
                "feature_cache_sha256": source_protocol["cache_sha256"], "test_exposure": source_protocol["test_exposure"],
                "selection": "All paper baselines retained; no new global or within-paper selection",
                "implementation_sha256": {**source_protocol["code_sha256"], "baselines.py": sha256(Path(__file__))},
                "baseline_spec_sha256": sha256(ROOT / "baselines" / paper / "baseline.json")}
    write_json(output / "protocol.json", protocol)
    write_json(output / "baseline.json", spec)
    (output / "PROTOCOL.md").write_bytes((source / "PROTOCOL.md").read_bytes())
    for name in protocol["implementation_sha256"]:
        snapshot = output / "code_snapshot" / name
        snapshot.parent.mkdir(exist_ok=True)
        snapshot.write_bytes((Path(__file__).parent / name).read_bytes())
    write_json(output / "environment.json", {"python": platform.python_version(), "packages": {
        name: version(name) for name in ("numpy", "pandas", "scipy", "scikit-learn", "joblib", "threadpoolctl")}})
    repeats = None
    if mode == "train":
        records, repeats = train_one_paper(spec, parts, output)
        expected = repeats[repeats.repeat.eq(0)]
    else:
        expected = pd.read_csv(source / "predictions.csv.gz", dtype={"sample_id": str}, float_precision="round_trip")
        expected = expected[expected.model.isin(spec["models"]) & expected.track.isin(tracks)]
    write_json(output / "models.json", {"paper": paper, "records": records})
    predictions = []
    for track, split_parts in parts.items():
        for split in ("validation", "test"):
            pred = predict_records(spec, records, output, track, split_parts[split])
            predictions.append(prediction_rows(split_parts[split], pred, track, split))
    predictions = pd.concat(predictions, ignore_index=True)
    difference = compare_predictions(predictions, expected)
    predictions.to_csv(output / "predictions.csv.gz", index=False, compression=GZIP)
    write_json(output / "evaluation_seal.json", {"sealed_at": utcnow(), "predictions_sha256": sha256(output / "predictions.csv.gz"),
        "models_index_sha256": sha256(output / "models.json"), "selection_rule": protocol["selection"]})
    targets = frame.set_index("sample_id")[TARGET]
    metrics = score_predictions(predictions, targets)
    metrics.to_csv(output / "metrics.csv", index=False)
    if paper == "p1":
        if mode == "evaluate":
            seal = read_json(source / "evaluation_seal.json")
            check_hash(source / "p1_repeated_predictions.csv.gz", seal["repeated_predictions_sha256"])
            repeats = pd.read_csv(source / "p1_repeated_predictions.csv.gz", dtype={"sample_id": str}, float_precision="round_trip")
            repeats = repeats[repeats.track.isin(tracks)]
        repeat_metrics = score_predictions(repeats, targets)
        repeat_metrics.to_csv(output / "repeat_metrics.csv", index=False)
        repeat_metrics.groupby(["track", "split", "model", "stage"]).agg(
            repeats=("repeat", "nunique"), mse_mean=("mse", "mean"), mse_std=("mse", "std"),
            rmse_mean=("rmse", "mean"), rmse_std=("rmse", "std")).reset_index().to_csv(output / "repeat_summary.csv", index=False)
        if mode == "train":
            repeats.to_csv(output / "repeated_predictions.csv.gz", index=False, compression=GZIP)
    verification = {"created_at": utcnow(), "reload_max_difference": difference, "prediction_rows": len(predictions),
                   "metric_rows": len(metrics), "model_files_checked": len(records), "all_predictions_finite": True,
                   "comparison": "source sealed predictions" if mode == "evaluate" else "pre-serialization training predictions",
                   "p1_repeat_evidence": "source frozen 20-repeat predictions (not 20 reloaded models)" if paper == "p1" and mode == "evaluate" else None}
    write_json(output / "verification.json", verification)
    write_report(output, spec, metrics, protocol, verification)
    write_json(output / "completion.json", {"completed_at": utcnow(), "seconds": time.perf_counter() - started,
        "status": "completed_partial_paper_baseline", "artifact_sha256": {
            p.relative_to(output).as_posix(): sha256(p) for p in sorted(output.rglob("*")) if p.is_file()}})
    log(f"Completed {paper}/{mode}: {output}")
    return verification


def verify(output):
    output = Path(output)
    for name, digest in read_json(output / "completion.json")["artifact_sha256"].items():
        check_hash(output / name, digest)
    records = read_json(output / "models.json")["records"]
    for record in records:
        check_hash(output / record["path"], record["sha256"])
    return {"verified": True, "models": len(records), "paper": read_json(output / "baseline.json")["paper"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list")
    for name in ("evaluate", "train"):
        cmd = sub.add_parser(name)
        cmd.add_argument("--paper", choices=("p1", "p2", "p3"), required=True)
        cmd.add_argument("--source-run", type=Path, default=DEFAULT_SOURCE)
        cmd.add_argument("--output-dir", type=Path, required=True)
        cmd.add_argument("--track", choices=(*TRACKS, "both"), default="both")
        cmd.add_argument("--feature-cache", type=Path)
    cmd = sub.add_parser("verify")
    cmd.add_argument("--baseline-dir", type=Path, required=True)
    cmd = sub.add_parser("predict")
    cmd.add_argument("--baseline-dir", type=Path, required=True)
    cmd.add_argument("--track", choices=TRACKS, required=True)
    cmd.add_argument("--features", type=Path, required=True)
    cmd.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    with threadpool_limits(4):
        if args.command == "list":
            for paper in ("p1", "p2", "p3"):
                spec = spec_for(paper)
                print(f"{paper}: {spec['title']}\n  {', '.join(spec['models'])}")
        elif args.command in ("evaluate", "train"):
            execute(args.paper, args.command, args.source_run, args.output_dir,
                    TRACKS if args.track == "both" else (args.track,), args.feature_cache)
        elif args.command == "verify":
            print(verify(args.baseline_dir))
        else:
            if args.output.exists():
                raise FileExistsError("Prediction output already exists")
            verify(args.baseline_dir)
            spec = read_json(args.baseline_dir / "baseline.json")
            records = read_json(args.baseline_dir / "models.json")["records"]
            query = pd.read_csv(args.features, dtype={"sample_id": str, "route": str}, float_precision="round_trip")
            result = predict_records(spec, records, args.baseline_dir, args.track, query)
            rows = prediction_rows(query, result, args.track, "inference")
            args.output.parent.mkdir(parents=True, exist_ok=True)
            rows.to_csv(args.output, index=False)
            log(f"Predictions written: {args.output}")


if __name__ == "__main__":
    main()
