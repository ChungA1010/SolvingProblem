"""Publish already sealed external results; never select or fit a model."""
from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import LogLocator, NullFormatter, ScalarFormatter
import numpy as np
import pandas as pd

from .common import read_json, sha256, write_json
from .report import markdown_table


def report(run_dir):
    done, protocol, audit, verified, source = [read_json(run_dir / name) for name in [
        "completion.json", "protocol.json", "data_audit.json", "verification.json", "acquisition_index.json"]]
    if done["status"] != "complete" or verified["status"] != "passed":
        raise ValueError("External evaluation and model verification must be complete")
    for name, expected in done["artifact_hashes"].items():
        if name == "features.csv.gz" and not (run_dir / name).exists():
            continue
        if sha256(run_dir / name) != expected:
            raise ValueError(f"Frozen external artifact changed: {name}")
    scores = pd.read_csv(run_dir / "metrics.csv")
    overall = scores[scores.slice.eq("all")].copy()
    primary = overall[overall.primary].copy()
    manifest = pd.read_csv(run_dir / "external_manifest.csv")
    predictions = pd.read_csv(run_dir / "scored_predictions.csv")
    evidence = []
    for cohort, row in audit["cohorts"].items():
        evidence.append({"구분": cohort, "원본 표본": row["samples"], "기존 웨이퍼 직접 중복": row["direct_old_wafer_overlap"],
                         "그룹 단위 제외": row["old_component_overlap"], "새 Chamber 제외": row["unseen_chamber"],
                         "평가 표본": row["eligible"], "Stage A": row["eligible_stage_samples"]["A"], "Stage B": row["eligible_stage_samples"]["B"]})
    groups = manifest[manifest.eligible].groupby(["cohort", "STAGE"]).group_id.nunique()
    primary["groups"] = [int(groups.loc[(c, s)]) for c, s in zip(primary.cohort, primary.stage)]
    primary.to_csv(run_dir / "display_summary.csv", index=False)
    figures = run_dir / "figures"
    figures.mkdir(exist_ok=True)
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10,
                         "axes.spines.top": False, "axes.spines.right": False})
    order = ["GlobalMean", "StageMean", "Ridge", "PLS", "KNN", "SVR", "RandomForest", "PrestonInspired",
             "XGBoost", "CatBoost", "LightGBM", "Physics+CatBoost", "Physics+LightGBM"]
    fig, axes = plt.subplots(1, 2, figsize=(15, 7), layout="constrained")
    for stage, ax in zip(["A", "B"], axes):
        for offset, cohort, color in [(-.18, "test", "#267c92"), (.18, "validation", "#d2903b")]:
            values = overall[overall.stage.eq(stage) & overall.cohort.eq(cohort)].set_index("model").loc[order]
            ax.barh(np.arange(len(order)) + offset, values.mae, height=.34, color=color, label=cohort)
        ax.set_yticks(np.arange(len(order)), [m + (" *" if m == protocol["primary_models"][stage] else "") for m in order])
        ax.invert_yaxis()
        ax.set_xscale("log")
        ax.xaxis.set_major_locator(LogLocator(base=10, subs=[1, 2, 5]))
        ax.xaxis.set_major_formatter(ScalarFormatter())
        ax.xaxis.set_minor_formatter(NullFormatter())
        ax.set_xlabel("MAE (dataset scale; log axis; lower is better)")
        ax.set_title(f"Stage {stage} | * original v1 primary model")
        ax.grid(axis="x", alpha=.2)
        ax.legend()
    fig.suptitle("Unused PHM 2016 partitions | old-wafer/file components excluded", fontsize=15)
    fig.savefig(figures / "external_model_comparison.png", dpi=160)
    plt.close(fig)
    fig, axes = plt.subplots(2, 2, figsize=(11, 9), layout="constrained")
    for i, cohort in enumerate(protocol["cohorts"]):
        for j, stage in enumerate(["A", "B"]):
            ax = axes[i, j]
            part = predictions[predictions.primary & predictions.cohort.eq(cohort) & predictions.STAGE.eq(stage)]
            ax.scatter(part.y_true, part.y_pred, s=25, alpha=.7, color="#267c92")
            low, high = min(part.y_true.min(), part.y_pred.min()), max(part.y_true.max(), part.y_pred.max())
            margin = (high - low) * .07
            ax.plot([low - margin, high + margin], [low - margin, high + margin], "--", color="#d2903b", linewidth=1)
            ax.set(xlabel="Observed MRR (dataset scale)", ylabel="Predicted MRR (dataset scale)",
                   title=f"{cohort} | Stage {stage} | n={len(part)}")
            ax.grid(alpha=.2)
    fig.suptitle("Frozen primary models | every eligible external sample", fontsize=15)
    fig.savefig(figures / "external_primary_predictions.png", dpi=160)
    plt.close(fig)
    primary_table = primary[["cohort", "stage", "model", "n", "groups", "mae", "rmse", "r2", "coverage_90"]].rename(
        columns={"cohort": "구분", "stage": "Stage", "model": "고정 선정 모델", "n": "표본", "groups": "그룹",
                 "mae": "MAE", "rmse": "RMSE", "r2": "R²", "coverage_90": "90% 구간 실측 coverage"})
    primary_table["90% 구간 실측 coverage"] *= 100
    primary_table = primary_table.rename(columns={"90% 구간 실측 coverage": "90% 구간 coverage (%)"})
    body = ["# 이전에 사용하지 않은 PHM 2016 데이터 평가", "",
            "**평가 완료:** 공식 test·validation 분할의 공개 보관본에서 원본 시계열 370개와 정답 848개를 확보했습니다. "
            "기존 데이터와 웨이퍼 또는 파일 연결 그룹이 겹치는 표본을 제외한 **test 121개·validation 140개**를 채점했습니다. "
            "이 점수는 중복을 제외한 부분집합의 결과이며, 공식 전체 분할 점수나 대회 순위가 아닙니다.", "",
            "## 기존 선정 모델의 결과", "", markdown_table(primary_table), "",
            "Stage A는 기존 CatBoost, Stage B는 기존 Physics+CatBoost를 주 평가 모델로 유지했습니다. "
            "26개 기존 모델의 해시와 주 평가 모델을 새 데이터 정답 조회 전에 고정했고, 재학습·재보정·설정 변경을 하지 않았습니다. "
            "따라서 이전 v1 Test보다 숫자가 좋아진 것은 학습으로 성능을 개선했다는 증거가 아니라 평가 데이터 구성이 달라진 결과입니다.", "",
            "Stage B는 test 32개·validation 68개로 작습니다. test에서 Physics+CatBoost는 CatBoost·RandomForest보다 MAE가 작았지만, "
            "validation에서는 XGBoost·CatBoost 등의 단독 ML보다 컸습니다. 이전 내부 교차검증과 함께 보면 모델 순위는 평가 집단에 따라 바뀝니다. "
            "새 외부 점수를 보고 주 모델을 교체하거나 재튜닝하지 않았습니다.", "",
            "![External primary predictions](figures/external_primary_predictions.png)", "",
            "## 중복 제외와 데이터 검사", "", markdown_table(pd.DataFrame(evidence)), "",
            "기존 웨이퍼 직접 중복 수는 해당 WAFER_ID가 이전 1,981개 표본 중 어디든 존재하는 경우입니다. "
            "그룹 단위 제외 수는 그 웨이퍼와 같은 파일을 공유하는 다른 웨이퍼까지 전이적으로 포함합니다. "
            "따라서 직접 중복 수와 그룹 단위 제외 수를 더하면 안 됩니다. 두 Stage와 이전 Train·Validation·Calibration·Test 전체를 비교 대상으로 사용했습니다.", "",
            f"- test 시계열 {audit['raw_rows_by_cohort']['test']:,}행, validation {audit['raw_rows_by_cohort']['validation']:,}행입니다.",
            f"- 빈 파일 {len(audit['empty_files'])}개를 기록했습니다. 파생 데이터에서 동일 측정 행 {audit['exact_duplicate_rows_removed']:,}개를 제거했으며 원본은 유지했습니다.",
            f"- {audit['cross_file_samples']}개 표본이 파일을 걸쳤고, 장비와 시간 범위를 검사했습니다. "
            f"{audit['cross_file_gaps_over_threshold']}개 긴 공백은 기존 v1과 같은 AUC 규칙으로 처리했습니다.",
            "- 기존에 없던 Chamber는 0건입니다. 기존 전처리·특징 계산·모델을 그대로 사용했습니다.",
            "- 정답은 cohort/WAFER_ID/STAGE 기준으로 원본 표본 전체와 정확히 일대일 연결되는지 검사했습니다. 정답값을 기준으로 표본을 제외하지 않았습니다.", "",
            "## 해석 범위와 남은 조건", "",
            f"이전 데이터의 TIMESTAMP 범위는 {audit['prior_timestamp_range']}, 새 평가 파일의 범위는 {audit['external_timestamp_range']}로 겹칩니다. "
            "이번 실험은 모델이 쓰지 않았던 동일 PHM 2016 분할에 대한 평가이며, 새 공장·새 장비·미래 생산 시점 검증은 아닙니다. "
            "파일 그룹은 제공된 파일과 웨이퍼 ID로 정의했으며 실제 생산 lot의 완전한 독립성을 보장하지 않습니다.", "",
            "90% 예측구간은 기존 v1 Calibration으로 만든 반경을 그대로 썼습니다. 주 모델의 실측 coverage는 96.63–100%로 "
            "명세의 85–95% QA 범위를 벗어나며 구간 폭·보정 점검이 남아 있습니다. 작은 표본과 그룹 상관을 고려해야 하므로 "
            "90% coverage의 통계적 보장이나 서비스 배포 승인으로 해석하지 않습니다. R²도 분류 정확도 백분율이 아닙니다.", "",
            "## 전체 고정 모델 비교", "",
            markdown_table(overall[["cohort", "stage", "model", "n", "mae", "rmse", "r2", "negative_predictions"]]), "",
            "![All external model errors](figures/external_model_comparison.png)", "",
            "평균 기준선은 이전 Train의 평균입니다. Stage A 학습의 알려진 극단값과 서로 다른 Chamber 경로의 영향을 받으므로 "
            "그 기준선 대비 개선만으로 모델 우월성을 과장하지 않습니다. 음수·매우 큰 예측도 주 점수에서 숨기거나 잘라내지 않았습니다.", "",
            "## 출처와 재현 검증", "",
            f"- [PHM Society 공식 배포 안내]({source['official_url']})에 별도 test·validation 분할 및 정답 배포가 안내돼 있습니다.",
            f"- 사용한 파일은 [공개 보관본의 고정 커밋]({source['mirror_url']}) `{source['commit']}`에서 받았습니다.",
            "- 공식 ZIP 연결은 이번 환경에서 정상 다운로드로 이어지지 않았습니다. 보관본의 학습 시계열 185개와 학습 정답 1개는 "
            "기존 데이터와 바이트 단위로 모두 일치합니다. 정답은 보관본의 PHM16TestValidationAnswers 아래 orig_ 파일을 사용했고, "
            "보관본의 작업용 정답 파일과 Git blob 해시가 같은지 검사했습니다.",
            "- 다운로드한 372개 CSV의 고정 버전·크기·Git blob SHA-1·SHA-256을 기록했습니다. 공식 배포자의 별도 정답 체크섬은 "
            "확보하지 못했으므로 정답의 출처는 해당 공개 보관본까지 검증한 것입니다. 저장소의 코드 라이선스를 원본 데이터의 재배포 허가로 해석하지 않습니다.",
            "- 원본 CSV와 전체 특징표는 Git에 포함하지 않습니다. 모델 예측·점수·분할/제외 목록·해시·코드는 결과 증거로 남겼습니다.",
            "- 예측·제외 목록을 고정한 뒤 정답을 다운로드했고, 채점 시작 전에 봉인 파일을 썼습니다. 같은 결과 폴더의 재예측·재채점은 차단합니다.",
            f"- 모델 26개 모두 저장된 특징표로 예측·구간을 재현했습니다. 최대 점 예측 차이는 {max(x['max_prediction_difference'] for x in verified['models']):.3g}입니다.",
            "- 기존 v1 파일 전체와 모델 26개의 해시가 유지됐고, 이전 Stage B 교차검증 결과도 보존했습니다.", "",
            "실행 명령은 저장소 README를 참고하세요. 폴더를 새로 만들어 같은 정답으로 재튜닝해도 새 독립 평가가 되지 않습니다.", ""]
    (run_dir / "REPORT.md").write_text("\n".join(body), encoding="utf-8")
    write_json(run_dir / "report_provenance.json", {"completion_sha256": sha256(run_dir / "completion.json"),
               "reporter_source_sha256": sha256(Path(__file__)),
               "artifact_hashes": {name: sha256(run_dir / name) for name in ["REPORT.md", "display_summary.csv", "verification.json",
                   "figures/external_model_comparison.png", "figures/external_primary_predictions.png"]}})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", type=Path, required=True)
    report(parser.parse_args().run_dir)
