"""Small synthetic provenance fixtures; external answer values are unnecessary."""
import csv
import importlib.util
import json
from pathlib import Path

import pytest

from src.validation.independent import identity_hash, sha256, write_json

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("readiness_audit", ROOT / "tools/audit-independent-readiness.py")
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


def write_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)


@pytest.fixture
def inputs(tmp_path):
    table, artifact = tmp_path / "table.csv", tmp_path / "model.json"
    write_csv(table, [dict(wafer_id="dev-a", recipe="A456", fold=1, mrr=60),
                      dict(wafer_id="dev-b", recipe="B456", fold=2, mrr=80),
                      dict(wafer_id="used-fold5", recipe="A456", fold=5, mrr=99)])
    model = json.loads((ROOT / "artifacts/education-ridge-v1/model.json").read_text())
    model["provenance"].update(source_sha256=sha256(table), training_rows=2,
                               training_rows_by_recipe={"A456": 1, "B456": 1})
    write_json(artifact, model)
    prior, external = tmp_path / "prior", tmp_path / "external"
    prior.mkdir(); external.mkdir()
    write_csv(prior / "split_manifest.csv", [dict(WAFER_ID="old-prior", group_id="CMP-training-001.csv",
                                                   source_files="CMP-training-001.csv;CMP-training-002.csv")])
    write_csv(external / "external_manifest.csv", [dict(WAFER_ID="old-test", group_id="test-group", source_files="test/CMP-test-001.csv", eligible="False"),
                                                    dict(WAFER_ID="old-validation", group_id="validation-group", source_files="validation/CMP-validation-001.csv", eligible="True")])
    write_json(external / "protocol.json", {"source_artifact_hashes": {"split_manifest.csv": sha256(prior / "split_manifest.csv")}})
    write_json(external / "data_audit.json", {"prior_timestamp_range": [1, 10], "external_timestamp_range": [2, 11],
                                                "cohorts": {"test": {"eligible": 0}, "validation": {"eligible": 1}}})
    write_json(external / "evaluation_seal.json", {"status": "complete", "label_counts": {"test": 1, "validation": 1}})
    write_json(external / "completion.json", {"status": "complete", "all_external_values_scored_once": True,
                                                "completed_at": "2026-09-16T12:00:00+00:00",
                                                "artifact_hashes": {name: sha256(external / name) for name in
                                                                    ("protocol.json", "data_audit.json", "external_manifest.csv", "evaluation_seal.json")}})
    return table, prior, external, artifact, tmp_path / "output"


def test_exposure_audit_includes_fold5_and_all_external_rows_without_answer_files(inputs):
    table, prior, external, artifact, output = inputs
    report = audit_module.audit(table, prior, external, artifact, sha256(artifact), output)
    registry = json.loads((output / "known-data-registry.json").read_text())
    assert report["status"] == "WAITING_FOR_UNSEEN_DATA" and report["new_final_score_count"] == 0
    assert report["known_unique_wafer_ids"] == 6
    assert all(identity_hash(name) in registry["wafer_sha256"] for name in
               ("used-fold5", "old-test", "old-validation"))
    assert identity_hash("prior/CMP-training-002.csv") in registry["group_sha256"]
    assert registry["reference_recipe_means"] == {"A456": 60., "B456": 80.}
    assert not list(output.glob("*predictions*")) and not list(output.glob("*metrics*"))
    with pytest.raises(ValueError, match="already exists"):
        audit_module.audit(table, prior, external, artifact, sha256(artifact), output)


@pytest.mark.parametrize("changed", ["table", "prior", "external"])
def test_changed_exposure_source_does_not_generate_a_readiness_claim(inputs, changed):
    table, prior, external, artifact, output = inputs
    path = table if changed == "table" else (prior / "split_manifest.csv" if changed == "prior" else external / "external_manifest.csv")
    with path.open("a") as handle: handle.write("\n")
    with pytest.raises(ValueError, match="differs|changed"):
        audit_module.audit(table, prior, external, artifact, sha256(artifact), output)
    assert not output.exists()
