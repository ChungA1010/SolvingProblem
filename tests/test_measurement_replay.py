import copy
import pytest
import numpy as np
from cmp_ml.measurement_replay import Replay,ReplayOptions


def fixture():
    rows=[]
    for i in range(60):
        recipe='A456' if i%2==0 else 'B456'
        rows.append({'sample_id':str(i),'wafer_id':i,'stage':recipe[0],'recipe':recipe,'table':'ch4',
            'start':100.*i,'end':100.*i+30,'release5':100.*(i+5)+30 if i<55 else None,
            'ordinal':i,'mrr':float((70 if i%2==0 else 90)+(i//10)),
            'u_pad':i*3.,'u_dresser':i*.4,'gap_s':70.,'p_main':270.})
    return rows,[str(i) for i in range(30)],[str(i) for i in range(30,60)]


def test_future_truth_does_not_change_earlier_predictions():
    rows,tr,te=fixture(); a=Replay(rows,tr,te,ReplayOptions(mode='shared'));a.advance(5)
    changed=copy.deepcopy(rows)
    for r in changed[35:]:r['mrr']=999999.
    b=Replay(changed,tr,te,ReplayOptions(mode='shared'));b.advance(5)
    assert [r['prediction'] for r in a.rows]==[r['prediction'] for r in b.rows]


def test_replay_is_independent_of_step_batch_size():
    rows,tr,te=fixture();o=ReplayOptions(period=5,delay=5,mode='shared')
    a=Replay(rows,tr,te,o);a.advance(30)
    b=Replay(rows,tr,te,o)
    for _ in te:b.advance()
    assert a.snapshot()==b.snapshot()


def test_unmeasured_and_unavailable_truth_redacted():
    rows,tr,te=fixture();r=Replay(rows,tr,te,ReplayOptions(period=5,delay=5));s=r.advance(5)
    assert s['retrospective_metrics'] is None
    assert all(x['truth'] is None and x['error'] is None for x in s['rows'])
    assert s['measurements_requested']==1 and s['measurements_released']==0
    end=r.advance(30)
    assert end['retrospective_metrics']['n']==30
    assert end['measurements_released']<end['measurements_requested']


def test_shared_scale_and_equal_budget():
    rows,tr,te=fixture()
    # Different recipe levels, but identical normalized state.
    for r in rows:r['mrr']=70. if r['recipe']=='A456' else 90.
    for period in (1,5):
        a=Replay(rows,tr,te,ReplayOptions(period=period));b=Replay(rows,tr,te,ReplayOptions(period=period,mode='shared'))
        a.advance(30);b.advance(30)
        np.testing.assert_allclose([r['prediction'] for r in a.rows],[r['prediction'] for r in b.rows])
        assert a.snapshot()['measurements_requested']==b.snapshot()['measurements_requested']


@pytest.mark.parametrize('args',[{'period':2},{'delay':1},{'alpha':float('nan')},{'mode':'future'},{'offset':5}])
def test_invalid_options(args):
    with pytest.raises(ValueError):ReplayOptions(**args)


def test_same_wafer_a_to_b_is_a_legal_published_history_event():
    rows,tr,te=fixture();rows[31]['wafer_id']=rows[30]['wafer_id']
    r=Replay(rows,tr,te,ReplayOptions(mode='shared'));r.advance(2)
    assert r.rows[1]['last_available_at']>=rows[30]['end']
    assert r.rows[1]['last_available_at']<r.rows[1]['start']
