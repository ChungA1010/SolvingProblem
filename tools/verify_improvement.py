"""Independent audit, error diagnostics, and report for the frozen P2 improvement run."""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from cmp_ml.baselines import check_hash
from cmp_ml.common import TARGET, read_json, sha256, utcnow, write_json
from cmp_ml.improvement import audit_partition
from cmp_ml.improvement_models import POLICIES, PROCEDURES
from cmp_ml.paper_benchmark import ROOT
from cmp_ml.reconstruction import read_frame


def independent_score(block):
    return {"n": len(block), "mse": mean_squared_error(block.truth, block.prediction),
            "rmse": np.sqrt(mean_squared_error(block.truth, block.prediction)),
            "mae": mean_absolute_error(block.truth, block.prediction), "r2": r2_score(block.truth, block.prediction)}


def paired_effects(pred):
    rows = []
    rng = np.random.default_rng(20260918)
    for (evaluation, policy), block in pred.groupby(["evaluation", "policy"]):
        proposed = block[block.model.eq("proposed")].set_index("sample_id")
        for reference in ("control", "incumbent_refit"):
            baseline = block[block.model.eq(reference)].set_index("sample_id")
            if baseline.empty:
                continue
            baseline = baseline.loc[proposed.index]
            np.testing.assert_allclose(proposed.truth, baseline.truth)
            se_new, se_old = (proposed.prediction - proposed.truth) ** 2, (baseline.prediction - baseline.truth) ** 2
            # The official external partitions do not carry connected-file group IDs.
            # Do not invent independence or silently drop their rows from uncertainty estimates.
            lo = hi = np.nan
            groups_n = 0
            if proposed.group_id.notna().all():
                groups = pd.DataFrame({"group_id": proposed.group_id, "new": se_new, "old": se_old, "n": 1}).groupby("group_id").sum()
                groups_n = len(groups)
                sample = rng.integers(0, len(groups), size=(2000, len(groups)))
                n = groups.n.to_numpy()[sample].sum(axis=1)
                delta = (groups.new.to_numpy()[sample].sum(axis=1) - groups.old.to_numpy()[sample].sum(axis=1)) / n
                lo, hi = np.quantile(delta, [.025, .975])
            rows.append({"evaluation": evaluation, "policy": policy, "reference": reference, "n": len(proposed),
                "groups": groups_n, "reference_mse": float(se_old.mean()), "proposed_mse": float(se_new.mean()),
                "mse_delta": float(se_new.mean() - se_old.mean()), "mse_reduction_percent": float(100 * (1 - se_new.mean() / se_old.mean())),
                "descriptive_group_bootstrap_delta_low": float(lo), "descriptive_group_bootstrap_delta_high": float(hi)})
    return pd.DataFrame(rows)


def validate_inner(run, manifest):
    count = 0
    for path in sorted((run / "selection_details").glob("*.json")):
        detail = read_json(path)
        inner = pd.read_csv(path.with_suffix(".csv.gz"), float_precision="round_trip")
        assert inner.sample_id.is_unique and len(inner) == detail["train_n"]
        meta = manifest.set_index("sample_id").loc[inner.sample_id].reset_index()
        meta["inner_fold"] = inner.fold.to_numpy()
        for fold in range(3):
            a, b = meta[meta.inner_fold.ne(fold)], meta[meta.inner_fold.eq(fold)]
            assert not set(a.group_id) & set(b.group_id) and not set(a.WAFER_ID) & set(b.WAFER_ID)
        for row in detail["inner_candidates"]:
            assert np.isclose(mean_squared_error(inner.truth, inner[row["key"]]), row["mse"], rtol=1e-10)
        for candidate in detail["inner_blends"]:
            Z, w = inner[candidate["keys"]].to_numpy(), np.asarray(candidate["weights"])
            assert (w >= 0).all() and np.isclose(w.sum(), 1)
            assert np.isclose(mean_squared_error(inner.truth, Z @ w), candidate["inner_mse"], rtol=1e-10)
            if len(w) > 1:
                errors = np.array([[mean_squared_error(inner.loc[inner.fold.eq(f), "truth"], Z[inner.fold.eq(f), j])
                                   for j in range(len(w))] for f in range(3)])
                upper = errors.mean(axis=0) + 3 * errors.std(axis=0, ddof=1)
                prior = np.maximum(upper, 1e-12) ** -3
                prior /= prior.sum()
                if candidate["method"] == "paper":
                    np.testing.assert_allclose(w, prior, atol=1e-10)
                if candidate["method"] == "simplex":
                    optimized = mean_squared_error(inner.truth, Z @ w) + ((w - prior) ** 2).sum()
                    assert optimized <= mean_squared_error(inner.truth, Z @ prior) + 1e-7
        best = min(detail["inner_blends"], key=lambda r: (r["inner_mse"], r["id"]))
        assert best == detail["recipes"]["proposed"]
        count += 1
    assert count == 42
    return count


def availability(run, protocol, predictions):
    cache = ROOT / protocol["cache"]
    train = read_frame(cache / "train.csv.gz")
    source_cache = ROOT / protocol["source_cache"]
    dev = read_frame(source_cache / "development.csv.gz")
    test = read_frame(source_cache / "test_inputs.csv.gz")
    frames = {"validation": dev[dev.cohort.eq("validation")], "test": test}
    frames.update({f"outer_{i}": train for i in range(5)})
    frames["temporal"] = train
    output = []
    for (partition, policy, condition), block in predictions[predictions.model.eq("proposed")].groupby(["partition", "policy", "condition"]):
        prefix = "final" if partition in ("validation", "test") else partition
        bundle = joblib.load(cache / f"{prefix}_{policy}_{condition}.joblib")[0]
        query = frames[partition].set_index("sample_id").loc[block.sample_id].copy().reset_index().drop(columns=[TARGET], errors="ignore")
        slots, _ = bundle.history.referenced_indices(query)
        lag, neighbors = (slots[:, :11] >= 0).sum(axis=1), (slots[:, 11:] >= 0).sum(axis=1)
        for i, row in enumerate(query.itertuples()):
            idx = slots[i][slots[i] >= 0]
            refs = bundle.history.library.iloc[idx]
            assert not refs.WAFER_ID.eq(row.WAFER_ID).any()
            if policy == "completed" or partition == "temporal":
                assert (refs.end < row.start).all()
        missing = query[bundle.history.physical].isna().any(axis=1)
        part = pd.DataFrame({"partition": partition, "policy": policy, "sample_id": query.sample_id,
            "lag_count": lag, "neighbor_count": neighbors, "cold_history": (lag < 3) | (neighbors < 3),
            "missing_physical_feature": missing})
        output.append(part)
    availability_frame = pd.concat(output, ignore_index=True)
    availability_frame.to_csv(run / "availability_diagnostics.csv", index=False)
    combined = predictions.merge(availability_frame, on=["partition", "policy", "sample_id"], validate="many_to_one")
    rows = []
    for (evaluation, policy, model), block in combined.groupby(["evaluation", "policy", "model"]):
        for dimension in ("cold_history", "missing_physical_feature"):
            for value, subset in block.groupby(dimension):
                if len(subset) >= 2:
                    rows.append({"evaluation": evaluation, "policy": policy, "model": model,
                        "dimension": dimension, "value": bool(value), **independent_score(subset)})
    pd.DataFrame(rows).to_csv(run / "error_diagnostics.csv", index=False)
    return len(availability_frame)


def markdown_table(frame, columns, decimals=4):
    text = ["| " + " | ".join(columns) + " |", "|" + "|".join(["---"] * len(columns)) + "|"]
    for row in frame[columns].itertuples(index=False, name=None):
        text.append("| " + " | ".join(f"{v:.{decimals}f}" if isinstance(v, (float, np.floating)) else str(v) for v in row) + " |")
    return "\n".join(text)


def figure(run, scores):
    fig, axes = plt.subplots(2, 3, figsize=(15, 8.5), layout="constrained")
    labels = {"control": "3-fold control", "tuned": "Tuned", "features": "+ Features", "proposed": "Selected proposal", "incumbent_refit": "v2 incumbent"}
    colors = {"control": "#94a3b8", "tuned": "#60a5fa", "features": "#818cf8", "proposed": "#0f766e", "incumbent_refit": "#f59e0b"}
    for i, policy in enumerate(POLICIES):
        for j, evaluation in enumerate(("nested_oof", "temporal", "test")):
            ax = axes[i, j]
            block = scores[scores.policy.eq(policy) & scores.evaluation.eq(evaluation) & scores.dimension.eq("all")].set_index("model")
            names = (["incumbent_refit"] if policy == "retrospective" else []) + list(PROCEDURES)
            bars = ax.bar(np.arange(len(names)), [block.loc[n, "mse"] for n in names], color=[colors[n] for n in names])
            ax.bar_label(bars, fmt="%.2f", fontsize=9, padding=3)
            ax.set_xticks(np.arange(len(names)), [labels[n] for n in names], rotation=28, ha="right", fontsize=8)
            title = {"nested_oof": "Nested group CV", "temporal": "Forward-time diagnostic", "test": "Previously inspected Test"}[evaluation]
            ax.set_title(f"{policy} | {title}", fontsize=10)
            ax.set_ylabel("MSE (lower is better)")
            ax.margins(y=.18)
            ax.grid(axis="y", alpha=.2)
            ax.set_axisbelow(True)
    fig.suptitle("P2 improvement experiment — same samples within each panel", fontsize=15)
    fig.savefig(run / "comparison.png", dpi=180)
    plt.close(fig)


def report(run, scores, effects, verification):
    summary = scores[scores.dimension.eq("all")].pivot(index=["policy", "model"], columns="evaluation", values="mse").reset_index()
    summary.to_csv(run / "summary.csv", index=False)
    table = markdown_table(summary, ["policy", "model", "nested_oof", "temporal", "validation", "test"])
    nested = effects[effects.evaluation.eq("nested_oof")]
    effect_table = markdown_table(nested, ["policy", "reference", "reference_mse", "proposed_mse", "mse_reduction_percent", "descriptive_group_bootstrap_delta_low", "descriptive_group_bootstrap_delta_high"])
    final_rows = []
    for path in sorted((run / "selection_details").glob("final_*.json")):
        detail = read_json(path)
        recipe = detail["recipes"]["proposed"]
        final_rows.append({"policy": detail["policy"], "condition": detail["condition"], "view": recipe["view"],
            "method": recipe["method"], "models_and_weights": "; ".join(f"{k}={w:.4f}" for k, w in zip(recipe["keys"], recipe["weights"]))})
    final_table = markdown_table(pd.DataFrame(final_rows), ["policy", "condition", "view", "method", "models_and_weights"])
    contrasts = effects[effects.policy.eq("retrospective") & effects.reference.eq("incumbent_refit")].set_index("evaluation")
    if contrasts.loc["test", "mse_delta"] > 0 or contrasts.loc["temporal", "mse_delta"] > 0:
        conclusion = "**새 제안 모델로 교체하지 않는다.** 그룹 교차검증의 개선이 시간순 검증과 기존 공식 Test에서 일관되게 이어지지 않았다. 기존 P2 모델과 API/Unity 모델을 보존한다."
    else:
        conclusion = "개발 비교에서 개선 징후가 있다. 실제 계측값 확보 시각과 새 독립 데이터로 추가 확인해야 하며, 이 보고서 자체는 배포 승인이 아니다."
    verdict = f"""{conclusion}

기존 v2와 같은 이력 방식을 비교하면 중첩 그룹 CV MSE는 {contrasts.loc['nested_oof', 'reference_mse']:.4f} → {contrasts.loc['nested_oof', 'proposed_mse']:.4f}
(감소율 {contrasts.loc['nested_oof', 'mse_reduction_percent']:.2f}%)다.
반면 시간순 MSE는 {contrasts.loc['temporal', 'reference_mse']:.4f} → {contrasts.loc['temporal', 'proposed_mse']:.4f},
기존 Test MSE는 {contrasts.loc['test', 'reference_mse']:.4f} → {contrasts.loc['test', 'proposed_mse']:.4f}다.
Test 수치만 좋은 중간 단계를 사후 최종 모델로 바꾸지 않았다.
"""
    failure_note = ""
    if (run / "failure_analysis.json").exists():
        failure = read_json(run / "failure_analysis.json")
        failure_note = f"""
## 확인한 실패와 다음 실험의 우선순위

완료 이력만 쓰는 제안 모델의 바깥 CV에서 표본 `{failure['sample_id']}`의 실제 제거율은
{failure['truth']:.4f}인데 결합 예측은 {failure['predictions']['proposed']:.4f}였다.
이 표본에는 secondary 공정 통계 결측과 학습 분포를 크게 벗어난 primary duration/AUC가 함께 있었다.
Ridge의 선형 외삽이 큰 음수로 이어졌고, 내부 검증에서 정한 결합 가중치가 이를 충분히 억제하지 못했다.
결측만을 단독 원인으로 확정하지 않는다. [성분별 예측·특징 기여 분석](failure_analysis.json)에 근거를 남겼다.

다음 실험에서는 **긴 기록 간격·불완전 공정의 특징 집계 규칙**, 학습 fold 안에서 정한
입력 분포 검사 및 안정적인 fallback, 선형 모델의 외삽과 결합 가중치 제약을 먼저 검증하는 것이 타당하다.
이는 사후 분석으로 제안하는 다음 가설이며 이번 실험에서 검증한 개선 효과가 아니다.
이 표본을 평가에서 지우거나 결과를 본 뒤 예측을 자르는 방식으로 이번 점수를 수정하지 않았다.
"""
    text = f"""# P2 개선 실험 v1 결과

기존 P2 논문 baseline과 v2 모델을 보존하고, **Bagging/SVR 설정 → 공정·이력 특징 → 결합 방식**을 비교했다.
이 결과는 제안 모델 개발 실험이며 논문 성능의 완전 재현이나 새 독립 데이터 검증이 아니다.
API/Unity 모델은 변경하지 않았다.

{verdict}

## 동일 평가 표본에서의 MSE

{table}

- `nested_oof`: 원래 Train 1,977건, 5개 바깥 그룹 fold를 합친 MSE. 각 fold 모델의 설정은 해당 학습 부분의 내부 3fold만으로 선택했다. fold별 MSE의 단순 평균이 아니다.
- `temporal`: 과거 1,551건으로 학습해 이후 166건을 평가. 경계를 가로지르는 260건은 이 진단에서 제외했다. 이 166건도 다른 개발 진단에서는 사용된 원래 Train이므로 새 Test가 아니다.
- `validation`/`test`: 각 424건의 이전에 이미 확인한 공식 분할을 최종 선택 후 참고 평가했다.
- `retrospective`: v2와 같은 과거/미래 Train 이웃 라이브러리. 실시간 성능으로 해석하지 않는다.
- `completed`: 예측 공정 시작 전에 완료된 Train 공정의 제거율만 이력으로 사용. 계측값 즉시 확보 가정이며, 실제 계측 지연은 확인되지 않았다. 모델 자체의 시간 방향성은 temporal에서 따로 검사했다.
- `incumbent_refit`: 바깥/시간순 검증에서는 기존 v2 20회 MC CV 절차를 해당 학습 부분에 그대로 재적합했다. 공식 분할에서는 기존 저장 모델 그대로다.
- `control`: 개선 후보와 같은 내부 3fold 그룹 CV를 공유하는 단계 대조군. 20회 MC CV incumbent와 혼동하지 않는다.
- `tuned`: Ridge도 함께 도입한 설정 튜닝. 따라서 이 단계 차이를 Bagging/SVR만의 효과라고 단정하지 않는다.
- `features`: 네 특징 view에서 내부 MSE로 선택; `proposed`: 단독 모델·논문 가중식·OOF 비음수 가중 결합까지 선택.

## 바깥 교차검증의 차이

{effect_table}

양의 `mse_reduction_percent`는 개선, 음수는 악화다. 마지막 두 열은 **제안 모델 MSE−대조군 MSE**의 파일 연결 그룹 단위 bootstrap 2.5/97.5 분위수다.
공식 Validation/Test에는 이 연결 그룹 ID가 없으므로 해당 분할의 bootstrap 구간은 산출하지 않았다.
이는 이미 관찰한 데이터와 고정된 OOF 예측의 기술적 불확실성 요약이며, CV 재학습·연구 가설 선택의 불확실성을 포함하는 독립 통계 검정이 아니다.
범위가 0을 포함하면 일관된 개선 근거가 약하다. Test 결과로 후보를 재선정하지 않았다.

## 최종 Train-only 선택

{final_table}

선택 기준은 내부 OOF MSE, 동점은 후보 ID 사전순이다. 결합 가중치 적합에 사용한 내부 OOF 점수는 낙관적일 수 있어 최종 일반화 성능으로 보고하지 않는다.
최종 전체 Train 적합 모델과 바깥 fold별 모델은 서로 다르다. 가장 좋은 Test seed·모델을 사후에 고르지 않았다.

![동일 조건 성능 비교](comparison.png)

{failure_note}

## 검증과 재현

- 코드·탐색 범위·입력·분할은 학습 전에 고정: [사전 계획](PROTOCOL.md), [해시](protocol.json).
- [전체 216개 지표](metrics.csv), [fold별 지표](fold_metrics.csv), [조건/Stage별 지표](metrics.csv), [이력 부족·결측별 오차](error_diagnostics.csv).
- [단계별 요약](summary.csv), [대조군 대비 차이](paired_effects.csv), [최종 선택](selection.json), [각 내부 후보 점수·가중치·분할](selection_details).
- [학습 완료와 모델 6개](training_complete.json), [검증 완료](independent_verification.json), [이력 검사](history_audit.json).
- 내부 선택 {verification['inner_selection_partitions_checked']}개, 지표 {verification['metric_rows_recomputed']}개를 별도 계산으로 확인했다.
  기존 실행 파일 {verification['preserved_files_checked']}개의 해시가 동일함을 확인했다.
- 최종 모델은 `cmp_ml.improvement_models.ImprovementBundle.predict_all(frame)`으로 네 단계 예측을 제공한다.
  입력은 원시 CSV가 아니라 기존 P2 특징 추출 결과이며, 이력 조회에 필요한 wafer/condition/machine/start/end가 있어야 한다.
  모델 파일은 신뢰하는 이 저장소의 파일만 joblib로 읽는다.

실행 명령과 입력 준비는 [실험 문서](../../docs/p2-improvement-v1.md)를 따른다. 원시 데이터와 전체 외부 fold 모델 캐시는 Git에 게시하지 않는다.
"""
    # The count is generated instead of relying on a hard-coded expected table size.
    text = text.replace("전체 216개 지표", f"전체 {len(scores)}개 지표")
    (run / "README.md").write_text(text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", type=Path, default=ROOT / "runs/phm_cmp_improvement_v1")
    args = parser.parse_args()
    run = args.run_dir.resolve()
    protocol, completion = read_json(run / "protocol.json"), read_json(run / "completion.json")
    trained, seal = read_json(run / "training_complete.json"), read_json(run / "evaluation_seal.json")
    selection = read_json(run / "selection.json")
    assert protocol["frozen_at"] < selection["selected_at"] < seal["sealed_at"] < completion["completed_at"]
    assert sha256(run / "selection.json") == trained["selection_sha256"] == seal["selection_sha256"] == completion["selection_sha256"]
    check_hash(run / "metrics.csv", completion["metrics_sha256"])
    check_hash(run / "reference_predictions.csv.gz", seal["predictions_sha256"])
    check_hash(run / "reference_scored_predictions.csv.gz", completion["reference_scored_predictions_sha256"])
    check_hash(run / "development_predictions.csv.gz", trained["development_predictions_sha256"])
    for name, digest in trained["details_sha256"].items():
        check_hash(run / name, digest)
    for name, digest in protocol["code_sha256"].items():
        check_hash(run / "code_snapshot" / name, digest)
        check_hash(ROOT / "src/cmp_ml" / name, digest)
    for name, digest in protocol["preserved_files"].items():
        check_hash(ROOT / name, digest)
    manifest = read_frame(run / "manifest.csv")
    parts = pd.read_csv(run / "partitions.csv")
    for partition, block in parts.groupby("partition"):
        fit = manifest[manifest.sample_id.isin(block.loc[block.role.eq("train"), "sample_id"])]
        query = manifest[manifest.sample_id.isin(block.loc[block.role.eq("evaluation"), "sample_id"])]
        audit_partition(fit, query, partition == "temporal")
    pred = pd.concat([read_frame(run / n) for n in ("development_predictions.csv.gz", "reference_scored_predictions.csv.gz")], ignore_index=True)
    assert not pred.duplicated(["partition", "policy", "model", "sample_id"]).any()
    pred["evaluation"] = pred.partition.where(~pred.partition.str.startswith("outer_"), "nested_oof")
    for _, block in pred.groupby(["evaluation", "policy", "model"]):
        assert block.sample_id.is_unique
    scores = pd.read_csv(run / "metrics.csv", float_precision="round_trip")
    for row in scores.itertuples():
        b = pred[pred.evaluation.eq(row.evaluation) & pred.policy.eq(row.policy) & pred.model.eq(row.model)]
        if row.dimension != "all":
            b = b[b[row.dimension].eq(row.value)]
        expected = independent_score(b)
        np.testing.assert_allclose([row.mse, row.rmse, row.mae, row.r2], [expected[k] for k in ("mse", "rmse", "mae", "r2")], rtol=1e-10, atol=1e-10)
    old = pd.read_csv(ROOT / protocol["source_run"] / "metrics.csv", float_precision="round_trip")
    for split in ("validation", "test"):
        expected = old[old.split.eq(split) & old.model.eq("P2_Integrated") & old.stage.eq("all")].iloc[0].mse
        actual = scores[scores.evaluation.eq(split) & scores.model.eq("incumbent_refit") & scores.dimension.eq("all")].iloc[0].mse
        assert np.isclose(actual, expected, rtol=1e-10)
    inner_count = validate_inner(run, manifest)
    availability_n = availability(run, protocol, pred)
    parameters = {}
    for record in trained["models"]:
        check_hash(run / record["file"], record["sha256"])
        bundle = joblib.load(run / record["file"])
        assert set(bundle.history.library.sample_id) <= set(manifest.sample_id)
        assert bundle.history.library.cohort.eq("training").all()
        assert not bundle.history.library.excluded_extreme.any()
        parameters[record["file"]] = {key: model.steps[-1][1].get_params(deep=False) for key, model in bundle.models.items()}
    write_json(run / "model_parameters.json", parameters)
    effects = paired_effects(pred)
    effects.to_csv(run / "paired_effects.csv", index=False)
    fold_scores = [{"partition": p, "policy": h, "model": m, **independent_score(b)} for (p, h, m), b in
                   pred[pred.partition.str.startswith("outer_")].groupby(["partition", "policy", "model"])]
    pd.DataFrame(fold_scores).to_csv(run / "fold_metrics.csv", index=False)
    verification = {"verified_at": utcnow(), "metric_rows_recomputed": len(scores), "inner_selection_partitions_checked": inner_count,
        "availability_rows_checked": availability_n, "preserved_files_checked": len(protocol["preserved_files"]),
        "preserved_files_unchanged": True, "incumbent_reference_metrics_match_v2": True,
        "saved_models_train_only": True, "code_and_artifact_hashes_verified": True,
        "bootstrap_replicates": 2000, "bootstrap_note": "Descriptive paired group resampling of fixed predictions; not independent confirmatory inference."}
    write_json(run / "independent_verification.json", verification)
    figure(run, scores)
    report(run, scores, effects, verification)
    print(scores[scores.dimension.eq("all")][["evaluation", "policy", "model", "n", "mse", "rmse"]].to_string(index=False))


if __name__ == "__main__":
    main()
