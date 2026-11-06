"""History availability and portable Ridge regression checks."""

import builtins
from dataclasses import replace
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from src.models.state_mrr import Measurement, PredictionRequest, StateMRRPredictor, build_state


def request():
    return PredictionRequest("next", "A456", "2026-10-31T12:00:00+09:00", (
        Measurement("one", "A456", "2026-10-31T09:00:00+09:00", "2026-10-31T09:30:00+09:00", 100),
        Measurement("two", "A456", "2026-10-31T10:00:00+09:00", "2026-10-31T10:30:00+09:00", 110),
        Measurement("three", "A456", "2026-10-31T11:00:00+09:00", "2026-10-31T11:30:00+09:00", 90),
    ))


class StateTests(unittest.TestCase):
    def test_order_same_recipe_and_adjust_false(self):
        req = request()
        foreign = Measurement("foreign", "B456", "invalid", "invalid", 999)
        state = build_state(replace(req, history=(*reversed(req.history), foreign)))
        self.assertEqual(state.prev_mrr, 90)
        self.assertAlmostEqual(state.state_ewm, 98.4)
        self.assertEqual(state.history_count, 3)

    def test_future_and_incomplete_measurements_fail(self):
        req = request()
        for value in ("2026-10-31T12:00:00+09:00", "2026-10-31T12:01:00+09:00",
                      "2026-10-31T10:59:00+09:00", "2026-10-31T11:30:00"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                build_state(replace(req, history=(replace(req.history[-1], measurement_completed_at=value),)))

    def test_bad_history_and_recipe(self):
        req = request()
        for history in ((), (req.history[0], req.history[0]),
                        (replace(req.history[0], wafer_id="next"),),
                        (replace(req.history[0], mrr=float("nan")),),
                        (replace(req.history[0], mrr=-1),),
                        (replace(req.history[0], mrr=True),),
                        (replace(req.history[0], wafer_started_at=req.wafer_start_at),)):
            with self.subTest(history=history), self.assertRaises(ValueError):
                build_state(replace(req, history=history))
        with self.assertRaises(ValueError):
            build_state(replace(req, recipe="A123"))

    def test_pressure_or_current_target_cannot_be_submitted(self):
        payload = {"wafer_id": "next", "recipe": "A456",
                   "wafer_start_at": "2026-10-31T12:00:00+09:00", "history": []}
        for name in ("mrr", "p_main", "state_ewm", "prev_mrr", "t_polish"):
            with self.subTest(name=name), self.assertRaises(TypeError):
                PredictionRequest.from_dict({**payload, name: 100})


class PortableModelTests(unittest.TestCase):
    def test_pipeline_roundtrip_and_no_training_at_inference(self):
        import numpy as np
        import pandas as pd
        from src.models.prepare_state_mrr import export_pipeline
        from src.models.train_mrr_chronological import _fixed_regression
        features = ["recipe", "prev_mrr", "state_ewm"]
        frame = pd.DataFrame({"recipe": ["A456", "B456"] * 4,
                              "prev_mrr": [90, 70, 100, 80, 110, 85, 95, 75],
                              "state_ewm": [92, 72, 98, 78, 104, 82, 100, 77]})
        # Include a cold-start missing training value to exercise train-only imputation.
        frame.loc[0, "prev_mrr"] = np.nan
        pipeline = _fixed_regression(features, "ridge")
        pipeline.fit(frame, [92, 72, 99, 79, 108, 83, 97, 76])
        with patch.object(Path, "read_text", return_value=json.dumps(export_pipeline(pipeline))):
            portable = StateMRRPredictor.load("model.json")
        expected_frame = frame.iloc[1:]
        actual = [portable.predict_state(row.recipe, row.prev_mrr, row.state_ewm)
                  for row in expected_frame.itertuples()]
        np.testing.assert_allclose(actual, pipeline.predict(expected_frame), atol=1e-10, rtol=0)
        original_import = builtins.__import__

        def guard(name, *args, **kwargs):
            if name.startswith(("sklearn", "pandas", "numpy")):
                raise AssertionError("Inference must not load training dependencies")
            return original_import(name, *args, **kwargs)

        with patch.object(type(pipeline), "fit", side_effect=AssertionError("No inference fitting")), \
                patch("builtins.__import__", side_effect=guard):
            result = portable.predict(request())
        self.assertEqual(result["base_mrr"], result["final_mrr"])
        self.assertEqual(result["applied_correction"], 0)
        self.assertIsNone(result["recommended_polishing_time"])
        self.assertEqual(result["time_status"], "UNIT_UNVERIFIED")
        artifact = export_pipeline(pipeline)
        artifact["numeric_scale"][0] = 0
        with self.assertRaises(ValueError):
            StateMRRPredictor(artifact)


if __name__ == "__main__":
    unittest.main()
