import json
from pathlib import Path
import subprocess
import sys

import pytest


ROOT = Path(__file__).resolve().parents[1]


def run_cli(path, stub=True):
    command = [sys.executable, "-m", "src.simulator", "--request", str(path)]
    if stub:
        command.append("--stub")
    process = subprocess.run(command, cwd=ROOT, capture_output=True, encoding="utf-8")
    return process.returncode, json.loads(process.stdout)


def test_published_demo_is_reproducible_and_explicitly_labeled_as_a_stub():
    code, result = run_cli(ROOT / "examples/simulator_request.json")
    expected = json.loads((ROOT / "examples/simulator_output.json").read_text(encoding="utf-8"))
    assert code == 0 and result == expected
    assert result["final_mrr"] == 71.0 and result["recommended_polishing_time"] is None
    assert result["model_version"] == "TEST_STUB_ONLY_v1"
    assert "TEST_STUB_ONLY" in {warning["code"] for warning in result["warnings"]}


def test_demo_never_selects_a_predictor_implicitly():
    code, result = run_cli(ROOT / "examples/simulator_request.json", stub=False)
    assert code == 2 and result["error"]["code"] == "PREDICTOR_REQUIRED"


@pytest.mark.parametrize("changes,error", [
    ({"pressure_scenario": 270}, "UNSUPPORTED_PRESSURE_SCENARIO"),
    ({"pressure_scenario": "unknown"}, "UNSUPPORTED_PRESSURE_SCENARIO"),
    ({"p_main": 270}, "INVALID_REQUEST"),
    ({"prev_mrr": 60}, "INVALID_REQUEST"),
    ({"state_ewm": 68}, "INVALID_REQUEST"),
    ({"applied_correction": 12}, "INVALID_REQUEST"),
    ({"history": []}, "INSUFFICIENT_HISTORY"),
    ({"wafer_start_at": "2026-10-11T09:00:10"}, "INVALID_TIMESTAMP"),
])
def test_json_boundary_rejects_forbidden_fields_or_missing_contract_values(tmp_path, changes, error):
    payload = json.loads((ROOT / "examples/simulator_request.json").read_text(encoding="utf-8"))
    payload.update(changes)
    path = tmp_path / "request.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    code, result = run_cli(path)
    assert code == 2 and result["error"]["code"] == error
    assert result["final_mrr"] is None


def test_invalid_json_and_missing_file_have_structured_errors(tmp_path):
    path = tmp_path / "invalid.json"
    path.write_text('{"mrr": NaN}', encoding="utf-8")
    assert run_cli(path)[1]["error"]["code"] == "INVALID_JSON"
    assert run_cli(tmp_path / "absent.json")[1]["error"]["code"] == "INPUT_FILE_ERROR"
