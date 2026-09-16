"""Check that Git checkout preserves every frozen result's exact bytes."""
import hashlib
import json
from pathlib import Path


def test_published_artifact_chain():
    run = Path(__file__).resolve().parents[1] / "runs" / "phm_cmp_v1"
    def read(name):
        return json.loads((run / name).read_text(encoding="utf-8"))
    def digest(name):
        return hashlib.sha256((run / name).read_bytes()).hexdigest()
    audit = read("data_audit.json")
    selected = read("selection.json")
    seal = read("evaluation_seal.json")
    assert seal["status"] == "complete"
    assert digest("split_manifest.csv") == audit["split_sha256"] == selected["split_sha256"]
    assert digest("training_protocol.json") == selected["protocol_sha256"]
    assert digest("selection.json") == seal["selection_sha256"]
    assert digest("test_predictions.csv") == seal["test_predictions_sha256"]
    assert digest("test_metrics.csv") == seal["test_metrics_sha256"]
    assert len(selected["model_hashes"]) == 26
    for name, expected in selected["model_hashes"].items():
        assert digest("models/" + name) == expected
