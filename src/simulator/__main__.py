"""Explicit stub-only contract demo. Production predictors use the Python API."""
import argparse
from dataclasses import replace
from datetime import datetime
import json
from pathlib import Path
import sys

from .core import SimulationRequest, SimulatorCore
from .history import HistoryError, MRRMeasurement
from .predictor import BaseMRRPredictor
from .result import SimulatorWarning, failure


class RequestPayloadError(ValueError):
    code = "INVALID_REQUEST"


def _date(value):
    if not isinstance(value, str):
        raise HistoryError("INVALID_TIMESTAMP", "JSON timestamps must be ISO 8601 strings with offsets")
    try:
        date = datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)
    except ValueError as error:
        raise HistoryError("INVALID_TIMESTAMP", "invalid ISO 8601 timestamp") from error
    if date.tzinfo is None or date.utcoffset() is None:
        raise HistoryError("INVALID_TIMESTAMP", "timezone offsets are required")
    return date


def request_from_mapping(payload) -> SimulationRequest:
    required = {"wafer_id", "recipe", "pressure_scenario", "wafer_start_at", "history"}
    optional = {"target_removal", "target_removal_unit"}
    if not isinstance(payload, dict) or not required <= payload.keys() or payload.keys() - required - optional:
        raise RequestPayloadError("request must have the documented fields only; raw pressure, manual state and external delta are forbidden")
    if not isinstance(payload["history"], list):
        raise RequestPayloadError("JSON history must be an array")
    measurements = []
    fields = {"wafer_id", "recipe", "wafer_started_at", "measurement_completed_at", "mrr"}
    for row in payload["history"]:
        if not isinstance(row, dict) or row.keys() != fields:
            raise RequestPayloadError("each measurement must have the five documented fields")
        measurements.append(MRRMeasurement(
            row["wafer_id"], row["recipe"], _date(row["wafer_started_at"]),
            _date(row["measurement_completed_at"]), row["mrr"],
        ))
    return SimulationRequest(
        payload["wafer_id"], payload["recipe"], payload["pressure_scenario"],
        _date(payload["wafer_start_at"]), tuple(measurements),
        payload.get("target_removal"), payload.get("target_removal_unit"),
    )


class _DemoStub(BaseMRRPredictor):
    model_version = "TEST_STUB_ONLY_v1"

    def _predict(self, recipe, prev_mrr, state_ewm):
        return 0.25 * prev_mrr + 0.75 * state_ewm


def _invalid_constant(value):
    raise ValueError("non-finite JSON constants are not allowed")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Issue #4 simulator contract demo; synthetic stub only")
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--stub", action="store_true", help="explicitly use a deterministic test stub, not Ridge")
    args = parser.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if not args.stub:
        result = failure("PREDICTOR_REQUIRED", "explicit --stub is required for this demo; inject a fitted predictor using the Python API", None, None)
    else:
        try:
            payload = json.loads(args.request.read_text(encoding="utf-8-sig"), parse_constant=_invalid_constant)
        except (OSError, UnicodeError):
            result = failure("INPUT_FILE_ERROR", "request file cannot be read as UTF-8 JSON", None, None)
        except ValueError:
            result = failure("INVALID_JSON", "request file contains invalid or non-finite JSON", None, None)
        else:
            try:
                request = request_from_mapping(payload)
            except (RequestPayloadError, HistoryError) as error:
                result = failure(error.code, str(error), None, None)
            else:
                result = SimulatorCore(_DemoStub()).predict(request)
                if result.status == "OK":
                    result = replace(result, warnings=result.warnings + (SimulatorWarning(
                        "TEST_STUB_ONLY", "계약 확인용 결정론적 stub입니다. 실제 Ridge 예측이나 MRR 성능 평가가 아닙니다."
                    ),))
    print(json.dumps(result.to_dict(), ensure_ascii=False, allow_nan=False, indent=2))
    return 0 if result.status == "OK" else 2


if __name__ == "__main__":
    raise SystemExit(main())
