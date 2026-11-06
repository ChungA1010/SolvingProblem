"""Local integration API for the shared expert/education MRR predictor.

Both modes use the same frozen model. A separate optional classroom ruleset
can produce a dimensionless teaching index, never a calibrated MRR correction.
Not a production host.
"""

from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit

from .education_rules import EducationRules
from .state_mrr import PredictionRequest, StateMRRPredictor


def _reject_constant(value: str):
    raise ValueError(f"Nonfinite JSON number: {value}")


def capabilities(predictor: StateMRRPredictor, education_rules: EducationRules | None = None) -> dict:
    return {
        "schema_version": 1, "model_version": predictor.model_version,
        "modes": {
            "expert": {"prediction_enabled": True, "physical_controls_enabled": False},
            "education": {"prediction_enabled": True, "physical_controls_enabled": False,
                          "rule_based_simulation_enabled": education_rules is not None,
                          "rule_endpoint": "/api/v1/education/evaluate",
                          "rule_output": "dimensionless_classroom_index; not MRR"},
        },
        "recipes": ["A456", "B456"],
        "model_features": ["recipe", "prev_mrr", "state_ewm"],
        "request_fields": ["mode", "wafer_id", "recipe", "wafer_start_at", "history"],
        "history_fields": ["wafer_id", "recipe", "wafer_started_at", "measurement_completed_at", "mrr"],
        "variables": {
            "recipe": "MODEL_INPUT", "history.mrr": "MEASURED_STATE_INPUT",
            "wafer_id": "IDENTIFIER_ONLY", "wafer_start_at": "AVAILABILITY_CHECK_ONLY",
            "history.wafer_started_at": "STATE_ORDER_AND_VALIDATION",
            "history.measurement_completed_at": "AVAILABILITY_CHECK_ONLY",
            "pressure": "NUMERICAL_EFFECT_UNSUPPORTED",
            "slurry": "NUMERICAL_EFFECT_UNSUPPORTED",
            "rotation": "NUMERICAL_EFFECT_UNSUPPORTED",
            "consumables": "PRESTART_SNAPSHOT_NOT_VERIFIED",
            "rest_duration": "NUMERICAL_EFFECT_UNSUPPORTED",
            "measurement_interval": "DELAYED_MEASUREMENT_SCENARIO_NOT_VALIDATED",
        },
        "measurement_policy": "N0_COMPLETE_BEFORE_START",
        "raw_label_scale": {"status": "VERIFIED", "factor": 1},
        "physical_mrr_unit": "UNIT_UNVERIFIED",
        "target_removal": "NOT_AVAILABLE_IN_PHM_CMP1",
        "t_polish_unit": "seconds", "polishing_time_numerical_output": "disabled",
        "pressure_correction_enabled": False, "independent_final_validation": False,
        "data_support_note": "Marginal training ranges are warnings, not joint coverage or confidence intervals.",
        "education_rule_policy": "Separate explicit teacher ruleset required; no default weights",
    }


def predict_payload(predictor: StateMRRPredictor, payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("JSON request must be an object")
    data = dict(payload)
    mode = data.pop("mode", "expert")
    if mode not in ("expert", "education"):
        raise ValueError("mode must be expert or education")
    result = predictor.predict(PredictionRequest.from_dict(data))
    return {"status": "OK", "mode": mode,
            "result_kind": "DATA_DRIVEN_STATE_FORECAST", "result": result}


class PredictionServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, predictor: StateMRRPredictor, allowed_origin: str | None = None,
                 education_rules: EducationRules | None = None):
        self.predictor = predictor
        self.allowed_origin = allowed_origin
        self.education_rules = education_rules
        super().__init__(address, PredictionHandler)


class PredictionHandler(BaseHTTPRequestHandler):
    # Keep this endpoint bounded even for invalid web requests.
    MAX_BODY_BYTES = 1_048_576

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, format, *args):
        # No history values/request bodies in access logs.
        pass

    def _send(self, code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if self.server.allowed_origin and self.headers.get("Origin") == self.server.allowed_origin:
            self.send_header("Access-Control-Allow-Origin", self.server.allowed_origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status: int, code: str, message: str):
        self._send(status, {"status": "ERROR", "error": {"code": code, "message": message}})

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/health":
            self._send(200, {"status": "OK", "model_version": self.server.predictor.model_version})
        elif path == "/api/v1/capabilities":
            self._send(200, capabilities(self.server.predictor, self.server.education_rules))
        else:
            self._error(404, "NOT_FOUND", "Unknown endpoint")

    def do_OPTIONS(self):
        if urlsplit(self.path).path not in ("/api/v1/predictions", "/api/v1/education/evaluate", "/api/v1/capabilities", "/health"):
            self._error(404, "NOT_FOUND", "Unknown endpoint")
        elif not self.server.allowed_origin or self.headers.get("Origin") != self.server.allowed_origin:
            self._error(403, "ORIGIN_NOT_ALLOWED", "Configure the web origin explicitly")
        else:
            self._send(200, {"status": "OK"})

    def do_POST(self):
        path = urlsplit(self.path).path
        if path not in ("/api/v1/predictions", "/api/v1/education/evaluate"):
            self._error(404, "NOT_FOUND", "Unknown endpoint")
            return
        if self.headers.get_content_type() != "application/json":
            self._error(415, "JSON_REQUIRED", "Content-Type must be application/json")
            return
        if self.headers.get("Transfer-Encoding"):
            self._error(400, "INVALID_BODY", "Transfer-Encoding is unsupported; use Content-Length")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= self.MAX_BODY_BYTES:
                self._error(413, "INVALID_BODY_SIZE", "JSON body must be between 1 and 1048576 bytes")
                return
            raw = self.rfile.read(length)
            if len(raw) != length:
                raise ValueError("Incomplete request body")
            payload = json.loads(raw, parse_constant=_reject_constant)
        except (ValueError, UnicodeDecodeError, TimeoutError, RecursionError):
            self._error(400, "INVALID_JSON", "Invalid or incomplete JSON request body")
            return
        try:
            if path == "/api/v1/education/evaluate":
                if self.server.education_rules is None:
                    self._error(409, "EDUCATION_RULESET_REQUIRED", "No teacher-approved classroom ruleset configured")
                    return
                result = self.server.education_rules.evaluate(payload)
            else:
                result = predict_payload(self.server.predictor, payload)
        except (ValueError, TypeError, KeyError, OverflowError) as exc:
            self._error(422, "INVALID_PREDICTION_REQUEST", str(exc))
            return
        self._send(200, result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--allow-origin", help="Exact web origin, e.g. http://localhost:5173")
    parser.add_argument("--education-rules", type=Path, help="Explicit classroom-only ruleset; never used by Ridge")
    args = parser.parse_args()
    predictor = StateMRRPredictor.load(args.model)
    rules = EducationRules.load(args.education_rules) if args.education_rules else None
    with PredictionServer((args.host, args.port), predictor, args.allow_origin, rules) as server:
        print(f"Local MRR API: http://{args.host}:{server.server_port}; model={predictor.model_version}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
