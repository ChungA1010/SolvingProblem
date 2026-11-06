"""Inference contracts, schemas and errors for the Issue #4 simulator core.

Only the pure-Python predictor interface is re-exported here; it has no
external dependencies, reads no files and fits no estimator.
"""
from .predictor import BaseMRRPredictor

__all__ = ["BaseMRRPredictor"]
