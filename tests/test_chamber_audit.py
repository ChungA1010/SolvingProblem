import numpy as np
import pandas as pd
import pytest

from cmp_ml.chamber_audit import prepare_segments, matching_blocks, verify_blocks, summarize, SIGNALS, TARGET


def trace(wafer, chamber, start, n=15, stage='A', dynamic=True):
    data={c:np.full(n,float(i+1)) for i,c in enumerate(SIGNALS)}
    if dynamic:
        data['CENTER_AIR_BAG_PRESSURE']=np.arange(n,dtype=float)
        data['WAFER_ROTATION']=np.arange(n,dtype=float)**2
    return pd.DataFrame({**data,'MACHINE_ID':2,'WAFER_ID':wafer,'STAGE':stage,
        'CHAMBER':chamber,'TIMESTAMP':start+np.arange(n,dtype=float),'source_file':'synthetic.csv'})


def audit(*frames):
    f,m,c,_=prepare_segments(pd.concat(frames,ignore_index=True))
    b,_=matching_blocks(f,m)
    verify_blocks(f,m,b)
    return f,m,c,b


def test_shifted_multichannel_copy_is_detected():
    own=trace(2,4,100); own['CENTER_AIR_BAG_PRESSURE']+=1000
    f,m,c,b=audit(trace(1,4,0),own,trace(2,5,120))
    strong=b.loc[b.strong]
    assert len(strong)==1
    r=strong.iloc[0]
    assert r.rows==15 and r.offset==120 and r.relation=='earlier_primary'
    assert not r.simultaneous and r.same_stage
    summary,_,_=summarize(f,m,b,c)
    assert summary['previous_same_stage_covered_rows']==15


def test_constant_recipe_is_not_strong_copy_evidence():
    _,_,_,b=audit(trace(1,4,0,dynamic=False),trace(2,5,100,dynamic=False))
    assert len(b)>0 and not b.strong.any()


def test_usage_ramp_alone_does_not_qualify():
    p,q=trace(1,4,0,dynamic=False),trace(2,5,100,dynamic=False)
    for f in [p,q]:
        f['USAGE_OF_DRESSER']=np.arange(len(f))
        f['USAGE_OF_MEMBRANE']=np.arange(len(f))**2
    _,_,_,b=audit(p,q)
    assert len(b)>0 and not b.strong.any()


def test_one_different_sensor_breaks_exact_match():
    p,q=trace(1,4,0),trace(2,5,100)
    q['HEAD_ROTATION']+=1e-8
    _,_,_,b=audit(p,q)
    assert b.empty


def test_time_gap_and_short_sequences_do_not_join():
    p,q=trace(1,4,0),trace(2,5,100)
    p.loc[7:,'TIMESTAMP']+=100
    q.loc[7:,'TIMESTAMP']+=100
    _,_,_,b=audit(p,q)
    assert b.empty


def test_simultaneous_later_wafer_is_not_previous_wafer():
    own=trace(2,4,50); own['CENTER_AIR_BAG_PRESSURE']+=1000
    _,_,_,b=audit(trace(3,4,100),own,trace(2,5,100))
    r=b.loc[b.strong].iloc[0]
    assert r.simultaneous and r.relation=='later_primary'


def test_cross_stage_is_retained_but_not_same_stage_evidence():
    f,m,c,b=audit(trace(1,4,0,stage='B'),trace(2,5,100,stage='A'))
    assert not b.loc[b.strong,'same_stage'].any()
    summary,_,_=summarize(f,m,b,c)
    assert summary['sample_counts']['strong_cross_stage_blocks']==1
    assert summary['previous_same_stage_covered_rows']==0


def test_identical_duplicates_do_not_inflate_evidence():
    p,q=trace(1,4,0),trace(2,5,100)
    _,_,c,b=audit(p,q,q)
    assert c['exact_duplicate_records']==15
    assert b.loc[b.strong,'rows'].sum()==15


def test_conflicting_timestamp_breaks_sequence_without_averaging():
    p,q=trace(1,4,0),trace(2,5,100)
    extra=q.iloc[[7]].copy(); extra['CENTER_AIR_BAG_PRESSURE']+=1
    _,_,c,b=audit(p,q,extra)
    assert c['conflicting_keys']==1 and b.empty


def test_targets_rejected_and_input_order_invariant():
    raw=pd.concat([trace(1,4,0),trace(2,5,100)],ignore_index=True)
    f,m,_,_=prepare_segments(raw)
    a,_=matching_blocks(f,m)
    f,m,_,_=prepare_segments(raw.sample(frac=1,random_state=3))
    b,_=matching_blocks(f,m)
    pd.testing.assert_frame_equal(a,b)
    with pytest.raises(ValueError,match='Targets'):
        prepare_segments(raw.assign(**{TARGET:999}))
