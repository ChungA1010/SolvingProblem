"""Load a portable, explicitly selected educational Ridge artifact; never fit."""
import hashlib
import json
from pathlib import Path

from .predictor import BaseMRRPredictor, _finite_number


class ArtifactError(ValueError):
    code = "INVALID_MODEL_ARTIFACT"


def _reject_constant(value):
    raise ArtifactError("non-finite JSON is forbidden")


class FrozenRidgePredictor(BaseMRRPredictor):
    """Equivalent inference for the fixed Issue #2 encoded/scaled Ridge."""

    def __init__(self, payload):
        try:
            required = {"schema", "model_version", "usage", "features", "ridge_alpha",
                        "ewma_alpha", "recipes", "numeric_mean", "numeric_scale",
                        "imputer_median", "coefficients", "intercept", "provenance"}
            if not isinstance(payload, dict) or payload.keys() != required:
                raise ValueError("unexpected artifact schema fields")
            if payload["schema"] != "cmp-frozen-ridge-v1" or payload["usage"] != "EDUCATIONAL_DEVELOPMENT_ONLY":
                raise ValueError("only the versioned educational artifact is supported")
            if payload["features"] != ["recipe", "prev_mrr", "state_ewm"] or payload["recipes"] != ["A456", "B456"]:
                raise ValueError("feature/category contract mismatch")
            for key, expected in [("ridge_alpha", 1.0), ("ewma_alpha", 0.4)]:
                if _finite_number(key, payload[key]) != expected:
                    raise ValueError("fixed alpha mismatch")
            if not isinstance(payload["model_version"], str) or not payload["model_version"].strip():
                raise ValueError("model version is required")
            provenance = payload["provenance"]
            if not isinstance(provenance, dict) or provenance.get("independent_final_test") is not False:
                raise ValueError("development provenance is required")
            if provenance.get("measurement_assumption") != "N0_ORDINAL_NOT_OBSERVED_TIMESTAMPS":
                raise ValueError("measurement assumption is required")
            fold = provenance.get("evaluation_fold")
            if type(fold) is not int or fold not in range(2, 6) or provenance.get("training_folds") != list(range(1, fold)):
                raise ValueError("expected chronological past-fold training")
            if provenance.get("production_model") is not False:
                raise ValueError("production status must remain false")
            digest = provenance.get("source_sha256")
            if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
                raise ValueError("source digest is required")
            arrays = {}
            for key, size in [("numeric_mean", 2), ("numeric_scale", 2), ("imputer_median", 2), ("coefficients", 4)]:
                if not isinstance(payload[key], list) or len(payload[key]) != size:
                    raise ValueError("unexpected parameter dimensions")
                arrays[key] = tuple(_finite_number(key, x) for x in payload[key])
            if any(x <= 0 for x in arrays["numeric_scale"]):
                raise ValueError("scales must be positive")
            self._intercept = _finite_number("intercept", payload["intercept"])
        except (KeyError, ValueError, TypeError) as error:
            raise ArtifactError(str(error)) from error
        self._version = payload["model_version"]
        self._mean = arrays["numeric_mean"]
        self._scale = arrays["numeric_scale"]
        self._coefficients = arrays["coefficients"]
        # An independent JSON copy prevents caller mutation of metadata.
        self._provenance_json = json.dumps(provenance, allow_nan=False)
        self._artifact_sha256 = None

    @property
    def model_version(self):
        return self._version

    @property
    def provenance(self):
        return json.loads(self._provenance_json)

    @property
    def artifact_sha256(self):
        return self._artifact_sha256

    def _predict(self, recipe, prev_mrr, state_ewm):
        category = self._coefficients[0 if recipe == "A456" else 1]
        numeric = sum(coef * ((value - mean) / scale) for coef, value, mean, scale in zip(
            self._coefficients[2:], (prev_mrr, state_ewm), self._mean, self._scale, strict=True))
        return self._intercept + category + numeric


def load_artifact(path: Path, *, expected_sha256: str | None = None) -> FrozenRidgePredictor:
    """Explicit JSON loader. No executable serialization or automatic model search."""
    try:
        raw = Path(path).read_bytes()
        if len(raw) > 65536:
            raise ArtifactError("artifact exceeds 64 KiB")
        if expected_sha256 is not None and hashlib.sha256(raw).hexdigest() != expected_sha256:
            raise ArtifactError("artifact SHA256 mismatch")
        payload = json.loads(raw.decode("utf-8-sig"), parse_constant=_reject_constant)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ArtifactError("cannot read a UTF-8 JSON artifact") from error
    predictor = FrozenRidgePredictor(payload)
    predictor._artifact_sha256 = hashlib.sha256(raw).hexdigest()
    return predictor
