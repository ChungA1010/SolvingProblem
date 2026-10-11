"""Optional adapter for an explicitly supplied, already fitted Issue #2 pipeline.

ML dependencies are imported only when constructing/using this adapter. There
is no artifact loader, training import, fit call, or automatic estimator choice.
"""
from copy import deepcopy

from .predictor import BaseMRRPredictor


class RidgeAdapterError(ValueError):
    code = "INVALID_RIDGE_ADAPTER"


class RidgeDependenciesUnavailable(RuntimeError):
    code = "RIDGE_DEPENDENCIES_UNAVAILABLE"


FEATURES = ("recipe", "prev_mrr", "state_ewm")


def _validate_fitted_pipeline(pipeline):
    try:
        from sklearn.compose import ColumnTransformer
        from sklearn.impute import SimpleImputer
        from sklearn.linear_model import Ridge
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import OneHotEncoder, StandardScaler
        from sklearn.utils.validation import check_is_fitted
    except ImportError as error:
        raise RidgeDependenciesUnavailable("install requirements-simulator-ridge.txt to use the adapter") from error
    try:
        if type(pipeline) is not Pipeline or [name for name, _ in pipeline.steps] != ["preprocessing", "model"]:
            raise ValueError("expected the Issue #2 preprocessing/model pipeline")
        pre, model = pipeline.named_steps["preprocessing"], pipeline.named_steps["model"]
        if type(pre) is not ColumnTransformer or type(model) is not Ridge:
            raise ValueError("expected ColumnTransformer and Ridge")
        if model.get_params(deep=False) != Ridge(alpha=1.0).get_params(deep=False):
            raise ValueError("Ridge settings differ from the fixed alpha=1.0 candidate")
        if pre.remainder != "drop" or pre.transformer_weights is not None:
            raise ValueError("unexpected remainder or feature weights")
        if [name for name, _, _ in pre.transformers] != ["recipe", "numeric"]:
            raise ValueError("expected recipe and numeric transformers only")
        if list(pre.transformers[0][2]) != ["recipe"] or list(pre.transformers[1][2]) != list(FEATURES[1:]):
            raise ValueError("unexpected feature names/order")
        check_is_fitted(pre)
        check_is_fitted(model)
        if list(pipeline.feature_names_in_) != list(FEATURES):
            raise ValueError("pipeline must have been fitted with the three named input columns")
        encoder = pre.named_transformers_["recipe"]
        numeric = pre.named_transformers_["numeric"]
        if type(encoder) is not OneHotEncoder or encoder.get_params(deep=False) != OneHotEncoder(handle_unknown="ignore").get_params(deep=False):
            raise ValueError("expected the Issue #2 recipe encoding")
        if type(numeric) is not Pipeline or [name for name, _ in numeric.steps] != ["imputer", "scaler"]:
            raise ValueError("expected median imputer then StandardScaler")
        imputer, scaler = numeric.named_steps["imputer"], numeric.named_steps["scaler"]
        if type(imputer) is not SimpleImputer or imputer.get_params(deep=False) != SimpleImputer(strategy="median").get_params(deep=False):
            raise ValueError("imputer settings differ from Issue #2")
        if type(scaler) is not StandardScaler or scaler.get_params(deep=False) != StandardScaler().get_params(deep=False):
            raise ValueError("scaling settings differ from Issue #2")
        for step in [encoder, imputer, scaler]:
            check_is_fitted(step)
        if len(encoder.categories_) != 1 or set(encoder.categories_[0]) != {"A456", "B456"}:
            raise ValueError("fitted encoding must contain A456 and B456 only")
        if model.coef_.ndim != 1 or model.n_features_in_ != 4:
            raise ValueError("expected a scalar MRR target with two encoded recipes and two state features")
    except (ValueError, TypeError, AttributeError, KeyError, IndexError) as error:
        raise RidgeAdapterError("a fitted pipeline matching the fixed Issue #2 contract is required: " + str(error)) from error


class Issue2RidgeAdapter(BaseMRRPredictor):
    def __init__(self, fitted_pipeline, *, model_version: str, provenance: str):
        if not isinstance(model_version, str) or not model_version.strip():
            raise RidgeAdapterError("a nonempty externally assigned model_version is required")
        if not isinstance(provenance, str) or not provenance.strip():
            raise RidgeAdapterError("explicit model provenance is required; no production status is inferred")
        _validate_fitted_pipeline(fitted_pipeline)
        self._pipeline = deepcopy(fitted_pipeline)  # Later caller mutations cannot change this predictor.
        self._model_version = model_version
        self._provenance = provenance

    @property
    def model_version(self) -> str:
        return self._model_version

    @property
    def provenance(self) -> str:
        return self._provenance

    def _predict(self, recipe: str, prev_mrr: float, state_ewm: float) -> float:
        import pandas as pd
        row = pd.DataFrame([[recipe, prev_mrr, state_ewm]], columns=list(FEATURES))
        output = self._pipeline.predict(row)
        if output.shape != (1,):
            raise RidgeAdapterError("the fitted pipeline must return one scalar MRR")
        return float(output[0])
