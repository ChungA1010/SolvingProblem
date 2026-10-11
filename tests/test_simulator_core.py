from dataclasses import replace
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import subprocess
import sys

import pytest

from src.simulator import MRRMeasurement, PRESSURE_SCENARIOS, SimulationRequest, SimulatorCore, build_history_state
from test_simulator_result import RecordingPredictor


ORIGIN = datetime(2026, 10, 11, 9, tzinfo=timezone.utc)


def measurement(wafer_id="old1", recipe="A456", mrr=60.0, started=0, completed=1):
    return MRRMeasurement(wafer_id, recipe, ORIGIN + timedelta(seconds=started),
                          ORIGIN + timedelta(seconds=completed), mrr)


def request(recipe="A456", scenario="Normal", history=None, **changes):
    if history is None:
        history = (measurement(recipe=recipe), measurement("old2", recipe, 80, 2, 3))
    base = SimulationRequest("current", recipe, scenario, ORIGIN + timedelta(seconds=10), history)
    return replace(base, **changes)


@pytest.mark.parametrize("pair", list(PRESSURE_SCENARIOS))
def test_complete_history_to_prediction_pipeline_matches_issue4_contract(pair):
    predictor = RecordingPredictor()
    result = SimulatorCore(predictor).predict(request(*pair))
    assert result.status == "OK" and result.final_mrr == pytest.approx(71.0)
    assert result.base_mrr == result.final_mrr and result.applied_correction == 0.0
    assert result.history_used == 2 and result.latest_measurement_completed_at.endswith("+00:00")
    assert predictor.calls == [(pair[0], 80.0, 68.0)]
    assert result.correction_status == PRESSURE_SCENARIOS[pair].correction_status
    assert result.recommended_polishing_time is None and result.time_status == "UNIT_UNVERIFIED"
    json.dumps(result.to_dict(), allow_nan=False)


def test_ewma_seeds_first_measurement_and_uses_alpha_point_four_adjust_false():
    rows = (measurement(), measurement("old2", "A456", 80, 2, 3), measurement("old3", "A456", 100, 4, 5))
    state = build_history_state("A456", "current", ORIGIN + timedelta(seconds=10), rows[::-1])
    assert state.prev_mrr == 100 and state.state_ewm == pytest.approx(80.8)
    first = build_history_state("A456", "current", ORIGIN + timedelta(seconds=10), rows[:1])
    assert first.prev_mrr == first.state_ewm == 60.0


def test_same_recipe_only_with_current_future_and_equal_start_completions_excluded():
    rows = (
        measurement(), measurement("old2", "A456", 80, 2, 3),
        measurement("other", "B456", 90000),
        measurement("current", "A456", 90000),
        measurement("late", "A456", float("nan"), 4, 11),
        measurement("boundary", "A456", 90000, 4, 10),
    )
    result = SimulatorCore(RecordingPredictor()).predict(request(history=rows))
    assert result.final_mrr == pytest.approx(71.0) and result.history_used == 2


def test_measurement_completion_order_not_input_order_drives_latest_state():
    rows = (measurement("older-process", "A456", 60, 0, 8), measurement("newer-process", "A456", 80, 1, 2))
    state = build_history_state("A456", "current", ORIGIN + timedelta(seconds=10), rows)
    assert state.prev_mrr == 60 and state.state_ewm == 72.0


def test_timezone_offsets_and_completion_ties_have_a_defined_order():
    rows = (measurement(), measurement("old2", "A456", 80, 0.5, 1))
    kst = timezone(timedelta(hours=9))
    rows = tuple(replace(row, wafer_started_at=row.wafer_started_at.astimezone(kst),
                         measurement_completed_at=row.measurement_completed_at.astimezone(kst)) for row in rows)
    result = SimulatorCore(RecordingPredictor()).predict(request(history=rows))
    assert result.final_mrr == pytest.approx(71.0)


@pytest.mark.parametrize("rows", [(), (measurement(recipe="B456"),), (measurement(completed=10),), (measurement(wafer_id="current"),)])
def test_insufficient_history_is_an_error_and_never_invents_state(rows):
    predictor = RecordingPredictor()
    result = SimulatorCore(predictor).predict(request(history=rows))
    assert result.error.code == "INSUFFICIENT_HISTORY" and result.final_mrr is None
    assert predictor.calls == []


@pytest.mark.parametrize("history", [None, "history", [{}], [60]])
def test_malformed_history_cannot_reach_the_predictor(history):
    predictor = RecordingPredictor()
    result = SimulatorCore(predictor).predict(replace(request(), history=history))
    assert result.error.code == "INVALID_HISTORY" and predictor.calls == []


@pytest.mark.parametrize("value", [None, True, "60", float("nan"), float("inf")])
def test_invalid_available_measurement_is_not_imputed(value):
    result = SimulatorCore(RecordingPredictor()).predict(request(history=(measurement(mrr=value),)))
    assert result.error.code == "INVALID_HISTORY_VALUE"


@pytest.mark.parametrize("changes,code", [
    ({"wafer_start_at": ORIGIN.replace(tzinfo=None)}, "INVALID_TIMESTAMP"),
    ({"wafer_start_at": "2026-10-11"}, "INVALID_TIMESTAMP"),
    ({"wafer_id": ""}, "INVALID_WAFER_ID"),
    ({"history": (measurement(started=5, completed=2),)}, "INVALID_MEASUREMENT_TIMESTAMP"),
    ({"history": (measurement(), measurement())}, "DUPLICATE_HISTORY"),
    ({"history": (measurement(), measurement("second"))}, "AMBIGUOUS_HISTORY_ORDER"),
    ({"history": (replace(measurement(), measurement_completed_at=ORIGIN.replace(tzinfo=None)),)}, "INVALID_TIMESTAMP"),
])
def test_timestamp_and_history_integrity_errors_are_structured(changes, code):
    predictor = RecordingPredictor()
    result = SimulatorCore(predictor).predict(replace(request(), **changes))
    assert result.error.code == code and predictor.calls == []


def test_future_label_mutation_does_not_change_earlier_prediction():
    baseline = request(history=(measurement(), measurement("future", "A456", 10, 2, 11)))
    mutated = replace(baseline, history=(baseline.history[0], replace(baseline.history[1], mrr=10000000)))
    core = SimulatorCore(RecordingPredictor())
    assert core.predict(baseline).to_dict() == core.predict(mutated).to_dict()


def test_invalid_request_and_scenario_cannot_call_predictor():
    predictor = RecordingPredictor()
    core = SimulatorCore(predictor)
    assert core.predict({}).error.code == "INVALID_REQUEST"
    assert core.predict(request(scenario="High")).error.code == "UNSUPPORTED_PRESSURE_SCENARIO"
    assert predictor.calls == []


def test_history_request_target_removal_does_not_change_mrr():
    core = SimulatorCore(RecordingPredictor())
    values = [core.predict(request(target_removal=value, target_removal_unit="nm")) for value in [None, 100, 1000]]
    assert all(value.final_mrr == 71.0 and value.recommended_polishing_time is None for value in values)


def test_public_core_import_and_requests_never_read_models_or_train():
    code = """
import builtins
import importlib.abc
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
def no_read(*args, **kwargs):
    raise AssertionError('core must not read datasets, results, or model files')
class Blocker(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.startswith(('src.models', 'sklearn', 'numpy', 'pandas', 'torch')):
            raise AssertionError('core must not import training or ML: ' + fullname)
sys.meta_path.insert(0, Blocker())
builtins.open = no_read
Path.open = Path.read_text = Path.read_bytes = no_read
from src.simulator import BaseMRRPredictor, MRRMeasurement, SimulationRequest, SimulatorCore
class Stub(BaseMRRPredictor):
    model_version = 'TEST_STUB_ONLY_v1'
    def fit(self, *args):
        raise AssertionError('request must not fit')
    def _predict(self, recipe, prev_mrr, state_ewm):
        return state_ewm
t = datetime(2026, 10, 11, tzinfo=timezone.utc)
row = MRRMeasurement('past:A', 'A456', t, t + timedelta(seconds=1), 60)
request = SimulationRequest('current:A', 'A456', 'Normal', t + timedelta(seconds=10), (row,))
result = SimulatorCore(Stub()).predict(request)
assert result.status == 'OK' and result.final_mrr == 60 and result.recommended_polishing_time is None
print('HISTORY_CORE_WITHOUT_TRAINING_OK')
"""
    process = subprocess.run([sys.executable, "-c", code], cwd=Path(__file__).resolve().parents[1], capture_output=True, text=True)
    assert process.returncode == 0, process.stderr
    assert "HISTORY_CORE_WITHOUT_TRAINING_OK" in process.stdout
