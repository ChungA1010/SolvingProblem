import numpy as np
import pandas as pd

from cmp_ml.common import TARGET, USAGE
from cmp_ml.staged_features import COMPACT_SIGNALS, episode_indices, extract_staged
from cmp_ml.staged_models import CausalInputs, Spec
from cmp_ml.robust_features import SIGNALS


def library():
    data=pd.DataFrame({'WAFER_ID':[1,2,3,4,5], 'condition':['Cond1']*5,
        'machine':[2]*5,'start':[0.,10.,20.,30.,40.],'end':[5.,15.,25.,35.,45.],TARGET:[70.,71.,72.,73.,10000.]})
    for c in USAGE:data[f'p2_primary_{c}_mean']=[10.,20.,30.,40.,50.]
    for c in COMPACT_SIGNALS:data[f'raw__compact_{c}']=2.
    data['raw__compact_duration']=5.;data['raw__compact_count']=6
    return data


def test_history_never_reads_future_same_wafer_or_query_targets():
    train=library();history=CausalInputs(Spec('compact33')).fit(train)
    q=train.iloc[[3]].copy();q[TARGET]=-1e10
    X,audit=history.transform(q,True)
    q[TARGET]=1e10
    np.testing.assert_equal(X,history.transform(q))
    assert set(X[0,:21][np.isfinite(X[0,:21])])=={70.,71.,72.}
    assert audit['noncausal']==audit['same_wafer']==0
    # Mutating labels that were not available cannot affect history.
    train.loc[3:,TARGET]=2e10
    np.testing.assert_equal(X,CausalInputs(Spec('compact33')).fit(train).transform(q))


def test_history_excludes_equal_end_and_other_condition():
    train=library();q=train.iloc[[3]].copy();q['start']=25.
    train.loc[0,'condition']='Cond2'
    X=CausalInputs(Spec('compact33')).fit(train).transform(q)
    assert set(X[0,:21][np.isfinite(X[0,:21])])=={71.}


def test_compact_and_history_bridge_have_exact_declared_counts():
    train=library()
    assert CausalInputs(Spec('compact12',history='none')).fit(train).transform(train).shape==(5,12)
    assert CausalInputs(Spec('compact33')).fit(train).transform(train).shape==(5,33)
    assert CausalInputs(Spec('compact33',history='reset_summary')).fit(train).transform(train).shape==(5,38)


def test_reset_starts_empty_history_in_new_counter_era():
    train=library();q=train.iloc[[4]].copy()
    for c in USAGE[:3]:q[f'p2_primary_{c}_mean']=1.
    raw=CausalInputs(Spec('compact33',history='standardized')).fit(train).transform(q)
    reset=CausalInputs(Spec('compact33',history='reset')).fit(train).transform(q)
    assert np.isfinite(raw[0,:21]).any()
    assert np.isnan(reset[0,:21]).all()


def trace(times,active):
    frame=pd.DataFrame({c:np.ones(len(times))*10 for c in SIGNALS})
    frame['TIMESTAMP']=times;frame['CHAMBER']=4
    frame['MAIN_OUTER_AIR_BAG_PRESSURE']=np.where(active,10.,0.)
    return frame


def test_phase_duration_never_crosses_gap_or_inactive_row():
    t=trace([0,1,2,200,201,202,203],[1,1,0,1,1,1,1])
    f=extract_staged(t)
    assert f['raw__compact_duration']==203
    assert f['gap__compact_duration']==5
    assert f['active__compact_duration']==4
    assert f['longest__compact_duration']==3
    assert f['longest__compact_count']==4
    assert f['trimmed__compact_count']==2


def test_empty_phase_preserves_missing_signals_without_using_full_trace():
    f=extract_staged(trace([0,1,2],[0,0,0]))
    assert f['active__compact_duration']==0 and f['active__compact_count']==0
    assert np.isnan(f['active__compact_WAFER_ROTATION'])
    assert f['raw__compact_WAFER_ROTATION']==10


def test_phase_extraction_ignores_any_target_column():
    t=trace([0,1,2,3,4],[1]*5);a=extract_staged(t)
    t[TARGET]=[1,2,3,4,1e12];b=extract_staged(t)
    for k in a:np.testing.assert_equal(a[k],b[k])


def test_reference_without_group_metadata_has_point_gain_but_no_fake_interval():
    from cmp_ml.staged_experiment import bootstrap_comparisons
    rows=[]
    for model in ('full125_rf','full125_bag','S1_features','S2_phase','S3_history','S4_final'):
        for i in range(3):
            rows.append({'sample_id':str(i),'partition':'test','cohort_variant':'clean','model':model,
                         'group_id':np.nan,'truth':10.,'prediction':12. if model.startswith('full') else 11.})
    result=bootstrap_comparisons(pd.DataFrame(rows))
    assert np.all(result.rmse_improvement_pct==50.)
    assert result.bootstrap_low_pct.isna().all() and result.bootstrap_high_pct.isna().all()
    assert np.all(result.groups==0)
