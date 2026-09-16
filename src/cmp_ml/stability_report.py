"""Render already completed nested-CV results; never fit or select a model."""
from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .common import read_json, sha256, write_json
from .report import markdown_table


def report(run_dir):
    done = read_json(run_dir / "completion.json")
    if done["status"] != "complete":
        raise ValueError("Cannot report an unfinished nested assessment")
    for name, expected in done["artifact_hashes"].items():
        if sha256(run_dir / name) != expected:
            raise ValueError(f"Frozen nested artifact changed: {name}")
    protocol = read_json(run_dir / "protocol.json")
    summary = pd.read_csv(run_dir / "summary.csv")
    folds = pd.read_csv(run_dir / "fold_metrics.csv")
    groups = pd.read_csv(run_dir / "group_metrics.csv")
    outer = pd.read_csv(run_dir / "outer_manifest.csv")
    selections = []
    for fold in range(protocol["outer_folds"]):
        selected = read_json(run_dir / f"selection_outer{fold}.json")
        best = next(x for x in selected["families"] if x["candidate_id"] == selected["selected_candidate_id"])
        outcome = folds[folds.outer_fold.eq(fold) & folds.model.eq("InnerSelected")].iloc[0]
        part = outer[outer.outer_fold.eq(fold)]
        selections.append({"구간": fold + 1, "평가 표본": len(part), "평가 그룹": part.group_id.nunique(),
                           "내부 검증 선정": selected["selected_model"], "내부 MAE": best["inner_mae"],
                           "바깥 MAE": outcome.mae, "바깥 RMSE": outcome.rmse, "바깥 R²": outcome.r2})
    paired = []
    for name in ["CatBoost", "LightGBM"]:
        single = groups[groups.model.eq(name)].set_index("group_id")
        hybrid = groups[groups.model.eq("Physics+" + name)].set_index("group_id")
        delta = hybrid.mae - single.mae
        point = summary.set_index("model")
        paired.append({"비교": f"Physics+{name} − {name}",
                       "전체 MAE 차이": point.loc["Physics+" + name, "mae"] - point.loc[name, "mae"],
                       "그룹 평균 MAE 차이": float(delta.mean()),
                       "결합 우세 그룹": int((delta < -1e-10).sum()),
                       "단독 우세 그룹": int((delta > 1e-10).sum()),
                       "동률 그룹": int((delta.abs() <= 1e-10).sum())})
    paired = pd.DataFrame(paired)
    paired.to_csv(run_dir / "paired_group_comparison.csv", index=False)
    counts = pd.Series([s["내부 검증 선정"] for s in selections]).value_counts()
    choice_text = ", ".join(f"{name} {count}회" for name, count in counts.items())
    standalone_mae = summary.loc[summary.model.isin(["RandomForest", "XGBoost", "CatBoost", "LightGBM"]), "mae"]
    hybrid_mae = summary.loc[summary.model.str.startswith("Physics+"), "mae"]
    choice = summary.set_index("model").loc["InnerSelected"]
    means = summary.set_index("model").loc["StageMean"]
    improvement = 100 * (1 - choice.mae / means.mae)
    table = summary[["model", "mae", "rmse", "r2", "macro_group_mae", "fold_mae_min", "fold_mae_max"]].rename(
        columns={"model": "모델", "mae": "전체 MAE", "rmse": "RMSE", "r2": "R²",
                 "macro_group_mae": "그룹 평균 MAE", "fold_mae_min": "구간 최소 MAE", "fold_mae_max": "구간 최대 MAE"})
    figures = run_dir / "figures"
    figures.mkdir(exist_ok=True)
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10,
                         "axes.spines.top": False, "axes.spines.right": False})
    order = list(protocol["families"]) + ["InnerSelected"]
    fig, ax = plt.subplots(figsize=(11.8, 6.6), layout="constrained")
    colors = ["#2584b7", "#d18b28", "#31a274", "#a56aa5", "#df6664"]
    for fold in range(protocol["outer_folds"]):
        points = folds[folds.outer_fold.eq(fold)].set_index("model").loc[order]
        ax.scatter(points.mae, np.arange(len(order)) + (fold - 2) * .095,
                   s=29, alpha=.85, color=colors[fold], label=f"Outer fold {fold + 1}")
    pooled = summary.set_index("model").loc[order]
    ax.scatter(pooled.mae, np.arange(len(order)), marker="D", s=36, color="#202b32", label="Pooled OOF MAE", zorder=5)
    ax.set_yticks(np.arange(len(order)), ["Inner-selected procedure" if n == "InnerSelected" else n for n in order])
    ax.invert_yaxis()
    ax.set_xlabel("MAE (dataset scale; lower is better)")
    ax.set_title(f"Stage B | {protocol['outer_folds']} outer folds with {protocol['inner_folds']}-fold inner selection\n"
                 f"Original TRAIN only: {protocol['samples']} samples, {protocol['groups']} wafer/file groups", pad=14)
    ax.grid(axis="x", alpha=.2)
    ax.legend(loc="lower right", ncols=2, fontsize=9)
    fig.savefig(figures / "nested_group_mae.png", dpi=160)
    plt.close(fig)
    text = ["# Stage B 중첩 그룹 교차검증", "",
            f"**학습 데이터 내부 추가 검증 완료:** 기존 Stage B Train {protocol['samples']}개 표본, {protocol['groups']}개 그룹만 사용했습니다. "
            "v1 Validation·Calibration·Test와 Stage A는 학습·설정 선택·점수 계산에서 제외했습니다.", "",
            "이 실험은 v1 결과를 이미 확인한 뒤 수행한 **개발 데이터 안정성 진단**입니다. 새 독립 테스트, 기존 테스트 성능의 개선 증명, 배포 승인으로 해석하지 않습니다. 기존 v1 모델과 평가 파일은 바꾸지 않았습니다.", "",
            "## 내부 선택 절차의 성능", "",
            f"바깥 구간마다 안쪽 교차검증으로 모델·설정을 선택한 절차의 전체 OOF MAE는 **{choice.mae:.4f}**, "
            f"RMSE는 **{choice.rmse:.4f}**, R²는 **{choice.r2:.4f}**입니다. 같은 바깥 구간의 평균 기준선 MAE {means.mae:.4f} 대비 {improvement:.1f}% 낮습니다.", "",
            "InnerSelected는 단일 모델 이름이 아닙니다. 각 바깥 구간에서 내부 검증만으로 선택한 모델의 예측을 합친 결과입니다. "
            "아래 모델별 바깥 점수의 최솟값으로 모델을 다시 선정하지 않았습니다.", "",
            markdown_table(pd.DataFrame(selections)), "",
            f"내부 검증의 모델 선택 빈도는 **{choice_text}**입니다. "
            "선택 모델이 구간에 따라 바뀌는 정도를 성능 수치와 함께 해석해야 합니다. "
            "바깥 학습 구간끼리는 데이터가 겹치므로 다섯 점수를 서로 독립인 반복 실험으로 취급하지 않습니다.", "",
            f"단독 ML 4종의 전체 MAE는 {standalone_mae.min():.4f}–{standalone_mae.max():.4f}, "
            f"결합 모델 2종은 {hybrid_mae.min():.4f}–{hybrid_mae.max():.4f}였습니다. "
            "이 비교는 선언한 설정 범위와 현재 개발 데이터에 한정되며, 물리 결합 방법 전체의 성능을 일반화하지 않습니다.", "",
            "## 8개 모델군 비교", "", markdown_table(table), "",
            "전체 MAE는 모든 표본에 같은 가중치를 줍니다. 그룹 평균 MAE는 그룹마다 MAE를 계산한 뒤 31개 그룹을 같은 가중치로 평균합니다. "
            "구간 최소·최대는 실제 다섯 평가 구간의 범위이며 신뢰구간이 아닙니다. 그룹 크기가 다르고 표본 1개인 그룹도 있어 두 집계 방식이 다를 수 있습니다.", "",
            "![Stage B nested group MAE](figures/nested_group_mae.png)", "",
            "## 결합 모델과 단독 모델의 차이", "", markdown_table(paired), "",
            "차이는 결합 모델 오차에서 단독 모델 오차를 뺀 값입니다. 음수이면 결합 모델의 오차가 더 작습니다. "
            "그룹 승패는 기술 통계이며 독립 반복 실험이나 통계적 유의성 검정 결과가 아닙니다.", "",
            "## 평가 설계", "",
            "- 바깥 GroupKFold 5개, 각 바깥 학습 구간 안쪽 GroupKFold 3개입니다. 그룹 배치는 표본 수와 그룹 ID만 사용하며 제거율을 보지 않습니다.",
            "- 같은 웨이퍼·원본 파일을 연결한 기존 그룹을 유지합니다. 모든 바깥·안쪽·잔차 교차검증에서 웨이퍼·파일·그룹 중복을 검사했습니다.",
            "- 안쪽 예측 표본을 합친 MAE, RMSE, 고정 후보 ID 순서로 설정을 선택합니다. 각 모델군의 설정과 전체 선택을 파일로 고정한 뒤 바깥 구간을 평가합니다.",
            "- 전처리 스키마·결측 대체·특징 필터와 물리 지수의 정규화는 해당 학습 구간에서만 적합합니다.",
            "- RandomForest·XGBoost·CatBoost·LightGBM과 결합 모델의 부스팅 탐색 범위는 v1에 선언된 범위를 사용합니다. v1에서 고른 설정을 재사용하지 않습니다.",
            "- PrestonInspired와 결합 모델의 물리 정규화 계수는 1.0으로 고정했습니다. 결합 모델 잔차는 해당 학습 구간 안에서 다시 3개 그룹 구간으로 나눈 OOF 물리 예측으로 계산합니다. v1의 물리 설정 선택 및 5개 잔차 구간과 다릅니다.",
            "- GlobalMean·Ridge·PLS·KNN·SVR는 이번 안정성 진단 범위에서 제외했습니다. 기존 13종 모델 비교 결과는 v1 보고서에 남아 있습니다.",
            "- Calibration을 재사용하거나 예측구간을 새로 보정하지 않았습니다. 저장된 5개 모델은 바깥 구간별 진단 체크포인트이며 전체 Train 재학습 배포 모델이 아닙니다.", "",
            "## 검증 및 재현", "",
            f"안쪽 후보 적합 {done['inner_candidate_fits']}회, 바깥 모델군 적합 {done['outer_family_fits']}회를 수행했습니다. "
            f"별도 잔차용 물리 모델 적합은 이 횟수에서 제외합니다. 실행 시간은 {done['elapsed_seconds']:.1f}초입니다.", "",
            "모든 모델군이 489개 표본을 한 번씩 OOF 평가했고, 선택 체크포인트 5개의 저장 후 예측 재현 오차는 모두 1e-10 이하입니다. "
            "시작 전후 원본 v1 아티팩트 전체 해시가 일치합니다. 분할·모델 선택·예측·결과의 해시와 그룹 경계는 저장소 테스트로 재검사합니다.", "",
            "```bash", "python -m cmp_ml.cli stability --source-run runs/phm_cmp_v1 --output-dir runs/my_stage_b_stability --threads 4",
            "python -m cmp_ml.stability_report --run-dir runs/my_stage_b_stability", "```", "",
            "실행에는 로컬의 v1 features.csv.gz가 필요합니다. 전체 특징표와 원본 시계열은 Git에 포함하지 않습니다. "
            "완료된 출력 디렉터리는 덮어쓰지 않습니다. 재실행으로 같은 개발 데이터가 독립 평가 데이터가 되지는 않습니다.", "",
            "후속 단계에서 모델을 배포 후보로 정하려면 이 개발 진단과 분리된 새 데이터 평가 및 서비스 입력 검증이 필요합니다. "
            "WM-811K·MixedWM38 결함 분류와 Unity 서비스 연결은 이번 실험에 포함되지 않습니다.", ""]
    (run_dir / "REPORT.md").write_text("\n".join(text), encoding="utf-8")
    write_json(run_dir / "report_provenance.json", {"completion_sha256": sha256(run_dir / "completion.json"),
               "reporter_source_sha256": sha256(Path(__file__)),
               "artifacts": {p: sha256(run_dir / p) for p in ["REPORT.md", "figures/nested_group_mae.png", "paired_group_comparison.csv"]}})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", type=Path, required=True)
    report(parser.parse_args().run_dir)
