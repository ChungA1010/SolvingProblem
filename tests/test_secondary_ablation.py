import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import make_pipeline

from cmp_ml.common import TARGET, USAGE
from cmp_ml.reconstruction_models import ReconstructionHistory
from cmp_ml.paper_models import P2Bundle
from cmp_ml.secondary_ablation_models import primary_inputs, pair_predictions, ids_hash


def frame():
    n=18
    f=pd.DataFrame({'sample_id':[f's{i}' for i in range(n)],'WAFER_ID':np.arange(n),
        'condition':'Cond1','machine':2,'start':np.arange(n)*100.,'end':np.arange(n)*100.+50,
        TARGET:60.+np.sin(np.arange(n))})
    for j,c in enumerate(USAGE):f['p2_primary_'+c+'_mean']=np.arange(n)*(j+1.)
    f['p2_primary_duration']=40.+np.arange(n)
    f['p2_secondary_duration']=50.-np.arange(n)
    return f


def test_removal_preserves_sample_order_primary_and_target():
    f=frame();before=f.copy(deep=True);reduced=primary_inputs(f)
    pd.testing.assert_frame_equal(f,before)
    pd.testing.assert_frame_equal(reduced,f.drop(columns=['p2_secondary_duration']))
    pd.testing.assert_frame_equal(primary_inputs(reduced),reduced)


def test_history_slots_identical_after_secondary_removal():
    f=frame();q=f.iloc[[0,4,12,17]].drop(columns=[TARGET])
    old=ReconstructionHistory('raw','prior_start').fit(f)
    new=ReconstructionHistory('raw','prior_start').fit(primary_inputs(f))
    np.testing.assert_array_equal(old.transform(q)[:,:21],new.transform(q)[:,:21])
    assert not any(c.startswith('p2_secondary_') for c in new.names)


def test_history_does_not_consult_secondary_query_values_or_truth():
    f=frame();h=ReconstructionHistory('raw','prior_start').fit(primary_inputs(f))
    q=f.iloc[[2,5,8]].copy()
    expected=h.transform(q)
    q[TARGET]=-1e15;q['p2_secondary_duration']=np.nan
    np.testing.assert_array_equal(expected,h.transform(q))
    np.testing.assert_array_equal(expected,h.transform(q.drop(columns=['p2_secondary_duration'])))
    np.testing.assert_array_equal(expected,h.transform(q.iloc[::-1])[::-1])


def test_real_bundle_prediction_ignores_secondary_and_heldout_target():
    f=frame();h=ReconstructionHistory('raw','prior_start').fit(primary_inputs(f.iloc[:12]))
    X=h.transform(f.iloc[:12]);selected=np.ones(X.shape[1],bool)
    reg=make_pipeline(SimpleImputer(keep_empty_features=True),RandomForestRegressor(n_estimators=3,random_state=3)).fit(X,f[TARGET].iloc[:12])
    bundle=P2Bundle(h,selected,{'P2_LR':reg,'P2_SVR':reg,'P2_Bagging':reg},np.full(5,.2),float(f[TARGET].iloc[:12].mean()))
    q=f.iloc[12:].copy();a=bundle.predict_all(q)
    q[TARGET]=1e15;q['p2_secondary_duration']=-1e15
    for name,value in bundle.predict_all(q.iloc[::-1]).items():
        np.testing.assert_array_equal(value[::-1],a[name])


def test_pair_rejects_a_changed_dynamic_predictor():
    class Stub:
        def __init__(self,value):self.value=value
        def predict_all(self,q):return {n:np.full(len(q),self.value) for n in ['P2_Persistent','P2_KNN','P2_Integrated']}
    with pytest.raises(AssertionError):pair_predictions(Stub(1),Stub(2),frame())


def test_id_hash_tracks_order_as_well_as_membership():
    assert ids_hash(['a','b'])!=ids_hash(['b','a'])
    assert ids_hash(['ab','c'])!=ids_hash(['a','bc'])


def test_missing_reference_groups_do_not_create_invalid_bootstrap(monkeypatch):
    from pathlib import Path
    import warnings
    monkeypatch.syspath_prepend(str(Path(__file__).resolve().parents[1]/'tools'))
    from verify_secondary_ablation import paired_effects
    rows=[]
    for evaluation,group in [('nested_oof','g1'),('test',None)]:
        for sid,truth in [('a',1.),('b',2.)]:
            for model,delta in [('original',1.),('primary_only',.5)]:
                rows.append(dict(evaluation=evaluation,partition=evaluation,sample_id=sid,group_id=group,
                    truth=truth,model=model,prediction=truth+delta))
    with warnings.catch_warnings():
        warnings.simplefilter('error',RuntimeWarning)
        effects,_=paired_effects(pd.DataFrame(rows))
    effects=effects.set_index('evaluation')
    assert effects.loc['test','bootstrap_status']=='not_computed_missing_group_metadata'
    assert pd.isna(effects.loc['test','descriptive_group_bootstrap_2_5'])
    assert effects.loc['test','mse_change']==pytest.approx(-.75)
    assert effects.loc['nested_oof','descriptive_group_bootstrap_2_5']==pytest.approx(-.75)
