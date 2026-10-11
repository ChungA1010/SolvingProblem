"""Loopback-only HTTP boundary for Unity. Explicit artifact, no training imports."""
import argparse
from dataclasses import replace
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path

from .__main__ import RequestPayloadError, _invalid_constant, request_from_mapping
from .artifact import ArtifactError, load_artifact
from .core import SimulatorCore
from .history import HistoryError
from .pressure_scenarios import PRESSURE_SCENARIOS, PRESSURE_POLICY_VERSION
from .result import SimulatorWarning, failure

MAX_REQUEST_BYTES = 1024 * 1024


def make_server(predictor, port=8765):
    core = SimulatorCore(predictor)

    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(10)

        def log_message(self, format, *args):
            pass

        def send_json(self, code, body):
            raw = json.dumps(body, ensure_ascii=False, allow_nan=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self):
            if self.path == "/api/v1/health":
                self.send_json(200, {"ready": True, "model_version": predictor.model_version,
                                    "artifact_sha256": getattr(predictor, "artifact_sha256", None),
                                    "usage": "EDUCATIONAL_DEVELOPMENT_ONLY", "policy_version": PRESSURE_POLICY_VERSION,
                                    "independent_final_test": False})
            elif self.path == "/api/v1/scenarios":
                self.send_json(200, {"items": [
                    {"recipe": x.recipe, "pressure_scenario": x.pressure_scenario,
                     "support_level": x.support_level, "correction_status": x.correction_status,
                     "correction_enabled": False} for x in PRESSURE_SCENARIOS.values()]})
            else:
                self.send_json(404, failure("NOT_FOUND", "unknown endpoint", None, None).to_dict())

        def do_POST(self):
            if self.path != "/api/v1/predictions":
                self.send_json(404, failure("NOT_FOUND", "unknown endpoint", None, None).to_dict())
                return
            try:
                if self.headers.get("Transfer-Encoding") is not None:
                    raise RequestPayloadError("chunked requests are not supported")
                length = int(self.headers.get("Content-Length", "-1"))
                if not 0 < length <= MAX_REQUEST_BYTES:
                    self.send_json(413, failure("REQUEST_SIZE", "request size must be 1..1048576 bytes", None, None).to_dict())
                    return
                if self.headers.get_content_type() != "application/json":
                    self.send_json(415, failure("CONTENT_TYPE", "application/json is required", None, None).to_dict())
                    return
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise RequestPayloadError("incomplete request body")
                payload = json.loads(raw.decode("utf-8-sig"), parse_constant=_invalid_constant)
                request = request_from_mapping(payload)
            except (RequestPayloadError, HistoryError) as error:
                self.send_json(400, failure(error.code, str(error), None, None).to_dict())
                return
            except (ValueError, UnicodeError):
                self.send_json(400, failure("INVALID_JSON", "invalid JSON body or length", None, None).to_dict())
                return
            except (OSError, TimeoutError):
                self.close_connection = True
                return
            result = core.predict(request)
            if result.status == "OK":
                result = replace(result, warnings=result.warnings + (SimulatorWarning(
                    "EDUCATIONAL_DEVELOPMENT_MODEL", "개발 자료로 학습된 교육용 모델입니다. 독립 최종 성능은 검증되지 않았습니다."),))
            self.send_json(200 if result.status == "OK" else 422, result.to_dict())

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", type=Path, required=True)
    parser.add_argument("--sha256", required=True, help="explicit expected artifact digest")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args(argv)
    if not 1 <= args.port <= 65535:
        parser.error("port must be 1..65535")
    try:
        predictor = load_artifact(args.artifact, expected_sha256=args.sha256)
    except ArtifactError as error:
        parser.error(str(error))
    with make_server(predictor, args.port) as server:
        print("CMP educational API ready at http://127.0.0.1:" + str(args.port), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
