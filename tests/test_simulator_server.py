import json
from pathlib import Path
from threading import Thread
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

from src.simulator.artifact import load_artifact
from src.simulator.server import make_server

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def api():
    server = make_server(load_artifact(ROOT / "artifacts/education-ridge-v1/model.json"), 0)
    thread = Thread(target=server.serve_forever, daemon=True); thread.start()
    yield "http://127.0.0.1:" + str(server.server_port)
    server.shutdown(); server.server_close(); thread.join(timeout=5)


def call(api, path, payload=None, *, content_type="application/json"):
    raw = json.dumps(payload).encode() if payload is not None else None
    req = Request(api + path, data=raw, headers={"Content-Type": content_type})
    try:
        response = urlopen(req, timeout=10)
    except HTTPError as error:
        response = error
    with response:
        return response.status, json.loads(response.read())


def sample():
    return json.loads((ROOT / "examples/simulator_request.json").read_text())


def test_health_and_registry(api):
    code, result = call(api, "/api/v1/health")
    assert code == 200 and result["ready"] is True
    assert result["usage"] == "EDUCATIONAL_DEVELOPMENT_ONLY" and result["independent_final_test"] is False
    code, result = call(api, "/api/v1/scenarios")
    assert code == 200 and len(result["items"]) == 5
    assert all(x["correction_enabled"] is False for x in result["items"])


def test_real_artifact_http_prediction(api):
    code, result = call(api, "/api/v1/predictions", sample())
    predictor = load_artifact(ROOT / "artifacts/education-ridge-v1/model.json")
    assert code == 200 and result["status"] == "OK"
    assert result["final_mrr"] == pytest.approx(predictor.predict("B456", 80., 68.))
    assert result["final_mrr"] == result["base_mrr"] and result["applied_correction"] == 0
    assert result["recommended_polishing_time"] is None
    codes = {x["code"] for x in result["warnings"]}
    assert "EDUCATIONAL_DEVELOPMENT_MODEL" in codes and "NO_INDEPENDENT_FINAL_TEST" in codes
    assert "TEST_STUB_ONLY" not in codes


@pytest.mark.parametrize("field,value,expected,code", [
    ("recipe", "A456", "UNSUPPORTED_PRESSURE_SCENARIO", 422),
    ("pressure_scenario", 270., "UNSUPPORTED_PRESSURE_SCENARIO", 422),
    ("history", [], "INSUFFICIENT_HISTORY", 422),
    ("wafer_start_at", "2026-10-11T09:00:10", "INVALID_TIMESTAMP", 400),
    ("raw_pressure", 270., "INVALID_REQUEST", 400),
    ("prev_mrr", 80., "INVALID_REQUEST", 400),
])
def test_http_rejects_unsupported_inputs(api, field, value, expected, code):
    payload = sample(); payload[field] = value
    status, result = call(api, "/api/v1/predictions", payload)
    assert status == code and result["error"]["code"] == expected
    assert result["final_mrr"] is None


def test_http_type_and_route(api):
    status, result = call(api, "/api/v1/predictions", sample(), content_type="text/plain")
    assert status == 415 and result["error"]["code"] == "CONTENT_TYPE"
    assert call(api, "/unknown")[0] == 404
    assert call(api, "/unknown", sample())[0] == 404
