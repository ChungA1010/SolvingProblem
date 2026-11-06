"""Real HTTP integration and separation of classroom rules from MRR."""

import copy
import http.client
import json
from pathlib import Path
import threading
import unittest

from src.models.education_rules import EducationRules
from src.models.state_mrr import StateMRRPredictor
from src.models.state_mrr_service import PredictionServer, capabilities, predict_payload


ROOT = Path(__file__).resolve().parents[1]


def classroom_fixture():
    # Arithmetic fixture only: these numbers are not CMP effect estimates.
    return {"ruleset_version": "unit-test-fixture", "source_status": "CLASSROOM_ASSUMPTION_NOT_PHM_CALIBRATED",
            "reference_index": 100, "pressure_effect": {"Low": -2, "Normal": 0, "High": 3},
            "slurry_effect": {"Low": -4, "Normal": 0, "High": 1}}


class ServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = StateMRRPredictor.load(ROOT / "artifacts/state-mrr-v1/model.json")
        cls.server = PredictionServer(("127.0.0.1", 0), cls.model, "http://localhost:5173")
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(self, method, path, payload=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        try:
            body = json.dumps(payload) if payload is not None else None
            connection.request(method, path, body, headers or {"Content-Type": "application/json"})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), json.loads(response.read())
        finally:
            connection.close()

    def payload(self):
        return json.loads((ROOT / "examples/state_mrr_request.json").read_text(encoding="utf-8"))

    def test_health_and_capabilities(self):
        self.assertEqual(self.request("GET", "/health")[0], 200)
        status, _, result = self.request("GET", "/api/v1/capabilities")
        self.assertEqual(status, 200)
        self.assertFalse(result["modes"]["education"]["rule_based_simulation_enabled"])
        self.assertFalse(result["pressure_correction_enabled"])
        self.assertFalse(result["independent_final_validation"])

    def test_modes_share_exact_same_prediction(self):
        request = self.payload()
        expert = predict_payload(self.model, {**request, "mode": "expert"})
        education = predict_payload(self.model, {**request, "mode": "education"})
        self.assertEqual(expert["result"], education["result"])
        status, _, response = self.request("POST", "/api/v1/predictions", request)
        self.assertEqual(status, 200)
        self.assertEqual(response["result"], expert["result"])
        self.assertIsNone(response["result"]["recommended_polishing_time"])

    def test_identifiers_and_valid_start_change_do_not_change_numeric_prediction(self):
        original = self.payload()
        changed = {**original, "wafer_id": "different-id", "wafer_start_at": "2026-11-01T12:00:00+09:00"}
        first, second = predict_payload(self.model, original), predict_payload(self.model, changed)
        self.assertEqual(first["result"]["final_mrr"], second["result"]["final_mrr"])

    def test_unsupported_inputs_and_future_measurement_fail(self):
        for field in ("p_main", "pressure_level", "slurry", "u_pad", "prev_mrr", "mrr"):
            with self.subTest(field=field):
                status, _, response = self.request("POST", "/api/v1/predictions", {**self.payload(), field: 123})
                self.assertEqual(status, 422)
                self.assertNotIn("result", response)
        payload = self.payload()
        payload["history"][-1]["measurement_completed_at"] = payload["wafer_start_at"]
        self.assertEqual(self.request("POST", "/api/v1/predictions", payload)[0], 422)

    def test_bad_bodies_are_structured_errors(self):
        for payload in ([], {}, {"history": [None]}, {"history": [], "mode": "physics"}):
            self.assertEqual(self.request("POST", "/api/v1/predictions", payload)[0], 422)
        self.assertEqual(self.request("POST", "/api/v1/predictions", self.payload(),
                                      {"Content-Type": "text/plain"})[0], 415)
        self.assertEqual(self.request("GET", "/missing")[0], 404)

    def test_nonfinite_json_is_rejected(self):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        try:
            connection.request("POST", "/api/v1/predictions", '{"mrr": NaN}',
                               {"Content-Type": "application/json"})
            response = connection.getresponse()
            self.assertEqual(response.status, 400)
            self.assertEqual(json.loads(response.read())["error"]["code"], "INVALID_JSON")
        finally:
            connection.close()

    def test_cors_is_explicit(self):
        self.assertEqual(self.request("OPTIONS", "/api/v1/predictions", headers={"Origin": "http://wrong"})[0], 403)
        status, headers, _ = self.request("OPTIONS", "/api/v1/predictions", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(status, 200)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "http://localhost:5173")

    def test_no_implicit_classroom_rule(self):
        status, _, response = self.request("POST", "/api/v1/education/evaluate",
                                          {"pressure_level": "High", "slurry_level": "Normal"})
        self.assertEqual(status, 409)
        self.assertEqual(response["error"]["code"], "EDUCATION_RULESET_REQUIRED")

    def test_state_range_warning_does_not_clip_prediction(self):
        result = predict_payload(self.model, self.payload())["result"]
        self.assertEqual(result["state_support"], "OUTSIDE_TRAINING_RANGE")
        self.assertTrue(result["outside_training_features"])
        self.assertGreater(result["final_mrr"], 0)


class EducationRuleTests(unittest.TestCase):
    def test_configured_rule_endpoint(self):
        model = StateMRRPredictor.load(ROOT / "artifacts/state-mrr-v1/model.json")
        rules = EducationRules(classroom_fixture())
        with PredictionServer(("127.0.0.1", 0), model, education_rules=rules) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=5)
            try:
                connection.request("POST", "/api/v1/education/evaluate",
                                   json.dumps({"pressure_level": "High", "slurry_level": "Low"}),
                                   {"Content-Type": "application/json"})
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                self.assertEqual(json.loads(response.read())["educational_index"], 99)
                self.assertTrue(capabilities(model, rules)["modes"]["education"]["rule_based_simulation_enabled"])
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)

    def test_classroom_output_is_not_mrr(self):
        rules = EducationRules(classroom_fixture())
        result = rules.evaluate({"pressure_level": "High", "slurry_level": "Low"})
        self.assertEqual(result["educational_index"], 99)
        self.assertNotIn("final_mrr", result)
        self.assertNotIn("recommended_polishing_time", result)
        self.assertEqual(result["result_kind"], "EDUCATIONAL_RULE_SCORE")

    def test_rules_require_explicit_provenance_and_named_levels(self):
        config = classroom_fixture()
        config["source_status"] = "PHM_VALIDATED"
        with self.assertRaises(ValueError):
            EducationRules(config)
        rules = EducationRules(classroom_fixture())
        with self.assertRaises(ValueError):
            rules.evaluate({"pressure_level": 260, "slurry_level": "Normal"})
        config = classroom_fixture()
        config["pressure_effect"]["High"] = float("nan")
        with self.assertRaises(ValueError):
            EducationRules(config)

    def test_rule_changes_never_change_ridge(self):
        model = StateMRRPredictor.load(ROOT / "artifacts/state-mrr-v1/model.json")
        request = json.loads((ROOT / "examples/state_mrr_request.json").read_text(encoding="utf-8"))
        before = predict_payload(model, request)
        altered = copy.deepcopy(classroom_fixture())
        altered["pressure_effect"]["High"] = 1000
        EducationRules(altered).evaluate({"pressure_level": "High", "slurry_level": "Normal"})
        self.assertEqual(before, predict_payload(model, request))


if __name__ == "__main__":
    unittest.main()
