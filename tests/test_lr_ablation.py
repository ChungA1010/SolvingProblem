import inspect
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, read_json, sha256
from cmp_ml.lr_ablation import train
from cmp_ml.lr_ablation_models import without_lr, LRBundle, COMPONENTS, ridge_model


def test_removal_preserves_relative_weight_of_surviving_components():
    original=np.array([.1,.2,.3,.15,.25])
    actual=without_lr(original)
    assert actual[2]==0 and actual.sum()==pytest.approx(1)
    np.testing.assert_allclose(actual[[0,1,3,4]]/actual[0],[1,2,1.5,2.5])
    np.testing.assert_array_equal(original,[.1,.2,.3,.15,.25])
    with pytest.raises(ValueError): without_lr([0,0,1,0,0])


class FakeHistory:
    def transform(self,q): return q[['x']].to_numpy()


class FakeReference:
    history=FakeHistory()
    selected=np.array([True])
    weights=np.array([.1,.2,.3,.15,.25])
    def predict_all(self,q):
        result={name:q.x.to_numpy()+j for j,name in enumerate(COMPONENTS)}
        result['P2_Integrated']=np.column_stack(list(result.values()))@self.weights
        return result


class FakeRidge:
    def predict(self,X): return X[:,0]+20


def test_only_linear_column_is_replaced_and_query_targets_are_ignored():
    bundle=LRBundle(FakeReference(),FakeRidge(),np.array([.1,.2,.4,.1,.2]))
    q=pd.DataFrame({'x':[1.,2.,3.],TARGET:[70.,80.,90.]})
    a=bundle.predict_all(q)
    q=q.iloc[::-1].copy();q[TARGET]=-1e12
    b=bundle.predict_all(q)
    for n in a: np.testing.assert_allclose(a[n],b[n][::-1])
    expected=np.column_stack([a[n] if n!='P2_LR' else a['P2_Ridge'] for n in COMPONENTS])@bundle.ridge_weights
    np.testing.assert_allclose(a['ridge10'],expected)
    np.testing.assert_allclose(a['original'],np.column_stack([a[n] for n in COMPONENTS])@bundle.reference.weights)


def test_ridge_preprocessing_is_fit_only_on_supplied_training_rows():
    model=ridge_model().fit([[0.,np.nan],[2.,4.],[4.,6.]],[10.,12.,14.])
    means=model[1].mean_.copy()
    model.predict([[1e12,-1e12]])
    np.testing.assert_array_equal(model[1].mean_,means)
    np.testing.assert_allclose(means,[2.,5.])
    assert model[-1].alpha==10


def test_training_does_not_load_external_evaluation_frames_or_truth():
    source=inspect.getsource(train)
    assert 'test_truth' not in source and "'validation.csv.gz'" not in source and "'test.csv.gz'" not in source


def test_published_lr_ablation_is_paired_and_preserves_prior_runs():
    root=Path(__file__).resolve().parents[1];run=root/'runs/phm_cmp_lr_diagnosis_v1'
    if not (run/'completion.json').exists(): pytest.skip('Experiment not completed')
    p,c,t,s=[read_json(run/n) for n in ['protocol.json','completion.json','training_complete.json','evaluation_seal.json']]
    assert p['frozen_at']<t['completed_at']<s['sealed_at']<c['completed_at']
    assert p['alpha']==10 and p['procedures']==['original','no_lr','ridge10']
    for n,h in p['preserved_files'].items(): assert sha256(root/n)==h
    for n,h in p['code_sha256'].items(): assert sha256(root/'src/cmp_ml'/n)==h
    assert sha256(run/'metrics.csv')==c['metrics_sha256']
    f=pd.read_csv(run/'reference_scored_predictions.csv.gz')
    assert set(f.model)==set(COMPONENTS)|{'original','no_lr','ridge10','P2_Ridge'}
    for split,b in f.groupby('partition'):
        for _,q in b.groupby('model'): assert len(q)==424 and q.sample_id.is_unique


def test_saved_bundle_roundtrip_and_zero_weight_identity(tmp_path):
    bundle=LRBundle(FakeReference(),FakeRidge(),np.array([.1,.2,0.,.3,.4]))
    q=pd.DataFrame({'x':[1.,2.]})
    path=tmp_path/'model.joblib';joblib.dump(bundle,path)
    restored=joblib.load(path)
    for name,pred in bundle.predict_all(q).items(): np.testing.assert_array_equal(pred,restored.predict_all(q)[name])
    expected=np.column_stack([q.x+i for i in range(5)])@bundle.ridge_weights
    np.testing.assert_allclose(bundle.predict_all(q)['ridge10'],expected)
