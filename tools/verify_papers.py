"""Independent checks and publication artifacts for completed paper experiments."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from cmp_ml.common import PRESSURE, ROTATION, SLURRY, STATUS, USAGE, read_json, sha256, utcnow, write_json
from cmp_ml.paper_features import APPENDIX, P1_COLUMNS, P3_FINE, P3_ROUGH, SIGNALS


def verify(run):
    root = run.resolve().parents[1]
    protocol, selected, seal = (read_json(run / x) for x in ["protocol.json", "selection.json", "evaluation_seal.json"])
    assert sha256(run / "selection.json") == seal["selection_sha256"]
    assert sha256(run / "predictions.csv.gz") == seal["predictions_sha256"]
    assert sha256(run / "p1_repeated_predictions.csv.gz") == seal["repeated_predictions_sha256"]
    assert sha256(run / "manifest.csv") == protocol["manifest_sha256"]
    assert sha256(run / "PROTOCOL.md") == protocol["protocol_document_sha256"]
    scored = pd.read_csv(run / "scored_predictions.csv.gz", float_precision="round_trip", dtype={"sample_id": str})
    metrics = pd.read_csv(run / "metrics.csv", float_precision="round_trip")
    checked = []
    for row in metrics.itertuples(index=False):
        sub = scored[(scored.track == row.track) & (scored.split == row.split) & (scored.model == row.model)]
        if row.stage != "all":
            sub = sub[sub.STAGE == row.stage]
        assert len(sub) == row.n and sub.sample_id.is_unique
        for actual, expected in [(mean_squared_error(sub.truth, sub.prediction), row.mse),
                                 (mean_absolute_error(sub.truth, sub.prediction), row.mae),
                                 (r2_score(sub.truth, sub.prediction), row.r2)]:
            assert np.isclose(actual, expected, rtol=1e-12, atol=1e-10)
        checked.append((row.track, row.split, row.model, row.stage))
    for track, choice in selected["tracks"].items():
        validation = metrics[(metrics.track == track) & (metrics.split == "validation") & (metrics.stage == "all")]
        expected = validation.sort_values(["mse", "mae", "model"]).iloc[0].model
        assert expected == choice["model"]
    source_models = root / "runs/phm_cmp_v1/models"
    for filename, digest in protocol["frozen_existing_models"].items():
        assert sha256(source_models / filename) == digest
    snapshots = run / "code_snapshot"
    snapshots.mkdir(exist_ok=True)
    for name, digest in protocol["code_sha256"].items():
        source = root / "src/cmp_ml" / name
        assert sha256(source) == digest
        destination = snapshots / name
        if destination.exists():
            assert sha256(destination) == digest
        else:
            destination.write_bytes(source.read_bytes())
    repeat = pd.read_csv(run / "p1_repeated_predictions.csv.gz", float_precision="round_trip", dtype={"sample_id": str})
    for key, block in repeat.groupby(["track", "split", "model"]):
        assert block.repeat.nunique() == 20
        assert block.groupby("repeat").sample_id.nunique().nunique() == 1
        assert not block.duplicated(["repeat", "sample_id"]).any()
        primary = scored[(scored.track == key[0]) & (scored.split == key[1]) & (scored.model == key[2])].set_index("sample_id")
        seed0 = block[block.repeat == 0].set_index("sample_id")
        np.testing.assert_allclose(primary.prediction, seed0.loc[primary.index, "prediction"], rtol=0, atol=1e-12)
    # Validate data-driven integration weights against the saved 20-fold errors.
    weight_audit = []
    for path in sorted((run / "checkpoints").glob("*_P2_*.json")):
        record = read_json(path)
        errors = pd.read_csv(run / (path.stem + "_cv.csv")).pivot(index="fold", columns="model", values="mse")
        assert len(errors) == 20
        upper = errors.mean() + 3 * errors.std(ddof=1)
        expected = upper.pow(-3) / upper.pow(-3).sum()
        for model, weight in record["metadata"]["weights"].items():
            assert np.isclose(weight, expected[model], rtol=1e-12)
        weight_audit.append(path.stem)
    write_json(run / "independent_verification.json", {
        "verified_at": utcnow(), "metric_rows_recomputed_with_sklearn": len(checked),
        "validation_selection_reproduced": True, "p1_twenty_repetitions_checked": True,
        "p2_weights_recomputed": weight_audit, "prior_26_models_unchanged": True,
        "original_model_code_preserved": True, "all_checks_passed": True,
    })
    parameters = {}
    manifest = pd.read_csv(run / "manifest.csv", dtype={"sample_id": str})
    history_libraries = []
    for path in sorted((run / "models").glob("*.joblib")):
        bundle = joblib.load(path)
        estimators = {**bundle.base, **bundle.meta} if hasattr(bundle, "base") else bundle.models if hasattr(bundle, "models") else {"RF": bundle.model}
        parameters[path.name] = {name: {k: repr(v) for k, v in estimator.get_params(deep=True).items()}
                                 for name, estimator in estimators.items()}
        if hasattr(bundle, "history"):
            candidates = manifest[manifest.cohort.eq("training") & ~manifest.excluded_extreme]
            if path.name.startswith("grouped_"):
                candidates = candidates[candidates.split.eq("train")]
            assert set(bundle.history.library.sample_id) <= set(candidates.sample_id)
            history_libraries.append({"model_file": path.name, "n": len(bundle.history.library), "only_allowed_training_ids": True})
    write_json(run / "implementation_parameters.json", parameters)
    write_json(run / "history_library_audit.json", history_libraries)
    family = selected["final_research_candidate"].split('_')[0]
    model_paths = sorted((run / "models").glob(f"grouped_{family}_*.joblib"))
    write_json(run / "final_candidate.json", {
        "model": selected["final_research_candidate"], "chosen_by": "grouped Validation MSE",
        "seed": protocol["seed"], "deployment_status": "research_only; not installed into existing Unity/API",
        "artifacts": [{"path": "models/" + path.name, "sha256": sha256(path)} for path in model_paths],
        "input": "Per-wafer-stage paper features and context as defined by paper_features.py; not one raw sensor row",
        "history_requirement": "P2 needs fitted historical training library; P3 needs the original CPP context; see PROTOCOL.md",
    })
    catalog = [{"paper": "P1", "paper_feature_id": f"F{i}", "implementation_column": column,
                "definition": f"{stat}({SIGNALS[n - 7]})"} for i, (column, (stat, n)) in enumerate(zip(P1_COLUMNS, APPENDIX), 1)]
    p2 = [f"lag_{i}" for i in range(1, 12)] + [f"neighbor_{i}" for i in range(1, 11)]
    p2 += [f"p2_{group}_duration" for group in ["primary", "secondary"]]
    for variables, stats in [(USAGE, ["mean", "std", "decreasing"]),
                             (["PRESSURIZED_CHAMBER_PRESSURE"] + PRESSURE, ["mean", "std", "auc"]),
                             (SLURRY + [STATUS], ["mean", "std", "auc"]), (ROTATION, ["mean"])]:
        for stat in stats:
            for group in ["primary", "secondary"]:
                p2.extend(f"p2_{group}_{c}_{stat}" for c in variables)
    assert len(p2) == len(set(p2)) == 125
    catalog += [{"paper": "P2", "paper_feature_id": str(i), "implementation_column": name, "definition": name} for i, name in enumerate(p2, 1)]
    catalog += [{"paper": "P3", "paper_feature_id": f"TableIII_{route}_{i}", "implementation_column": name, "definition": name}
                for route, names in [("456", P3_ROUGH), ("123", P3_FINE)] for i, name in enumerate(names, 1)]
    pd.DataFrame(catalog).to_csv(run / "feature_catalog.csv", index=False)
    references = []
    p1 = {
        "A": {"P1_GBT": (6.552, .970, .051, 1.674), "P1_RF": (5.395, .981, .046, .512), "P1_ERT": (7.048, .966, .050, 3.723),
              "P1_CART_Stack": (5.065, .983, .047, .479), "P1_ELM_Stack": (4.795, .984, .043, .446)},
        "B": {"P1_GBT": (4.781, .687, .047, .440), "P1_RF": (4.598, .722, .045, .419), "P1_ERT": (4.792, .701, .048, .444),
              "P1_CART_Stack": (4.500, .725, .044, .404), "P1_ELM_Stack": (4.485, .727, .044, .404)},
    }
    for stage, models in p1.items():
        for name, values in models.items():
            for metric, value in zip(["rmse", "r2", "relative_error", "s_score_published_ambiguous"], values):
                references.append({"paper": "P1", "table": "7" if stage == "A" else "8", "stage": stage, "model": name, "metric": metric, "paper_value": value})
    for name, value in {"P2_Integrated": 7.07, "P2_Persistent": 8.23, "P2_KNN": 9.60, "P2_SVR": 7.44, "P2_LR": 7.32, "P2_Bagging": 7.22, "P3_RF": 7.6, "P3_RF_CPP": 7.4}.items():
        references.append({"paper": name[:2], "table": "5" if name.startswith("P2") else "II", "stage": "all", "model": name, "metric": "mse", "paper_value": value})
    compare = []
    for reference in references:
        row = metrics[(metrics.track == "official") & (metrics.split == "test") & (metrics.stage == reference["stage"]) & (metrics.model == reference["model"])].iloc[0]
        value = row.get(reference["metric"], np.nan)
        compare.append({**reference, "reconstruction_value": value,
                        "difference": value - reference["paper_value"], "comparability": "partial; see PROTOCOL.md"})
    pd.DataFrame(compare).to_csv(run / "paper_comparison.csv", index=False)
    additions = ["", "## 원문 대조 및 재현 진단", "",
        "- [특징 번호 대응표](feature_catalog.csv): P1 Appendix F1–F35, P2 Table 3의 1–125, P3 Table III의 11/6개를 코드 컬럼에 연결한다.",
        "- [논문 발표값 대조](paper_comparison.csv): P1 Stage별 RMSE/R²/RE, P2/P3 MSE를 각각 비교한다. S-score는 집계 불명확성을 유지해 직접 차이를 비워 두었다.",
        "- [실제 라이브러리 설정](implementation_parameters.json): 저장 모델에서 get_params로 읽은 설정이다. 원문이 명시한 값인지 여부는 PROTOCOL.md와 함께 본다.",
        "- [최종 후보 파일](final_candidate.json): 선택된 모델군의 실제 학습 파일과 해시. 입력에 이력/CPP 문맥이 필요한 모델은 단순 시나리오 슬라이더로 대체할 수 없다.",
        f"- P3의 원문은 2,929 runs/1,267 CPP를 적고 있으나 확보한 데이터는 2,829 wafer-stage이고 구현의 CPP는 {protocol['cpp_count']}개이다. CPP 구성 규칙이 완전히 일치한 재현이 아니다.",
        f"- P3의 primary chamber 유효 phase 판정에 쓸 양수 신호가 없어 전체 primary 구간을 사용한 표본은 {protocol['phase_fallback_samples']}개이다. 물리 구간 판정의 한계를 감추지 않는다.",
        "- P3의 wafer/CPP ID 인코딩은 원문에 없어 코드에 고정한 원래 수치값을 사용했다. ID 순서가 물리량이라는 가정을 검증한 것은 아니다.",
        "- P2_LR는 grouped Validation의 선정 기준을 만족했지만 official에서 큰 개별 오차가 있다. 이 분할 의존성과 선형 외삽 위험 때문에 모든 환경에서 최고인 모델이라고 추천하지 않는다. Test를 본 뒤 후보를 바꾸지는 않았다.",
        "", "![Validation 기준 모델 비교](paper_model_comparison.png)", ""]
    report_path = run / "REPORT.md"
    report_text = report_path.read_text(encoding="utf-8").split("\n## 원문 대조 및 재현 진단")[0]
    report_path.write_text(report_text.rstrip() + "\n" + "\n".join(additions), encoding="utf-8")
    print(json.dumps({"verified": True, "metric_rows": len(checked), "feature_catalog_rows": len(catalog)}, indent=2))


def plot(run):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    data = pd.read_csv(run / "metrics.csv")
    fig, axes = plt.subplots(1, 2, figsize=(15, 7), constrained_layout=True)
    for ax, track in zip(axes, ["official", "grouped"]):
        rows = data[(data.track == track) & (data.stage == "all")]
        order = rows[rows.split == "validation"].sort_values("mse").model.tolist()
        for split, offset, color in [("validation", -.18, "#287AAB"), ("test", .18, "#E09835")]:
            values = rows[rows.split == split].set_index("model").loc[order, "rmse"]
            ax.scatter(values, np.arange(len(order)) + offset, s=42, color=color, label=split.title(), zorder=3)
        ax.set_yticks(np.arange(len(order)), order)
        ax.invert_yaxis()
        ax.set_xlabel("RMSE (lower is better; log scale)")
        ax.set_xscale("log")
        ax.set_title("Official challenge split" if track == "official" else "Wafer/file-group split")
        ax.legend(loc="lower left")
        ax.grid(axis="x", alpha=.2)
        ax.set_axisbelow(True)
    fig.suptitle("Three-paper reconstruction: fixed seed; ranked by validation only\nPartial reproduction with documented assumptions; previously seen test data", fontsize=13)
    fig.savefig(run / "paper_model_comparison.png", dpi=160)
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", type=Path, required=True)
    args = parser.parse_args()
    verify(args.run_dir)
    plot(args.run_dir)
