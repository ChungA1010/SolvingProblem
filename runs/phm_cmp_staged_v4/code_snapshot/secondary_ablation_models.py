"""P2 physical-input ablation: remove only secondary chamber statistics."""
from __future__ import annotations

import hashlib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from .common import TARGET
from .lr_ablation_models import COMPONENTS, SEED
from .paper_models import P2Bundle, select_features, direct_predictions, integration_weights
from .reconstruction_models import ReconstructionHistory, p2_regressors


def ids_hash(values):
    return hashlib.sha256('\n'.join(map(str,values)).encode()).hexdigest()


def primary_inputs(frame):
    """Preserve rows, primary signals and history metadata; discard secondary columns."""
    return frame.drop(columns=[c for c in frame if c.startswith('p2_secondary_')]).copy()


def pair_predictions(reference, candidate, query):
    old, new = reference.predict_all(query), candidate.predict_all(query)
    result={}
    for prefix,values in [('original',old),('primary_only',new)]:
        for name,p in values.items():
            result[prefix if name=='P2_Integrated' else f'{prefix}_{name}']=p
    for name in COMPONENTS[:2]:
        np.testing.assert_allclose(old[name],new[name],rtol=0,atol=1e-10)
    return result


def fit_primary_only(reference, original_cv, progress=None):
    full=reference.history.library.reset_index(drop=True)
    train=primary_inputs(full)
    assert len(reference.history.names)==125
    assert sum(c.startswith('p2_secondary_') for c in full)==52
    assert train.cohort.eq('training').all() and not train.excluded_extreme.any()
    stored=pd.DataFrame(original_cv).pivot(index='fold',columns='model',values='mse').loc[range(20),list(COMPONENTS)].to_numpy()
    np.testing.assert_allclose(integration_weights(stored),reference.weights,rtol=1e-10,atol=1e-12)
    votes, errors, records, importances, folds = [], [], [], [], []
    for fold,(a,b) in enumerate(GroupShuffleSplit(20,test_size=.2,random_state=SEED).split(train,groups=train.WAFER_ID)):
        fit,q=train.iloc[a],train.iloc[b]
        assert not set(fit.WAFER_ID)&set(q.WAFER_ID)
        history=ReconstructionHistory('raw','prior_start').fit(fit)
        X,V=history.transform(fit),history.transform(q.drop(columns=[TARGET]))
        assert X.shape[1]==73 and not any(n.startswith('p2_secondary_') for n in history.names)
        y=fit[TARGET].to_numpy(float)
        selected,t,importance=select_features(X,y,SEED+fold)
        values=direct_predictions(V,float(y.mean()))
        for name,model in p2_regressors(SEED+fold,True).items():
            values[name]=model.fit(X[:,selected],y).predict(V[:,selected])
        assert tuple(values)==COMPONENTS
        losses=np.array([np.square(values[n]-q[TARGET]).mean() for n in COMPONENTS])
        # Dynamic-only predictors must reproduce the same original folds and history.
        np.testing.assert_allclose(losses[:2],stored[fold,:2],rtol=1e-10,atol=1e-9)
        errors.append(losses);votes.append(selected)
        records.append(pd.DataFrame({'fold':fold,'sample_id':q.sample_id,'truth':q[TARGET],**values}))
        importances.extend({'fold':fold,'feature':name,'t_abs':float(t[j]),'oob_importance':float(importance[j]),
            'selected':bool(selected[j])} for j,name in enumerate(history.names))
        folds.append({'fold':fold,'fit_ids_sha256':ids_hash(fit.sample_id),'query_ids_sha256':ids_hash(q.sample_id),
            'train_n':len(fit),'query_n':len(q),'overlapping_wafers':0,
            'overlapping_file_groups':len(set(fit.group_id)&set(q.group_id))})
        if progress and (fold+1)%5==0: progress(f'CV {fold+1}/20')
    selected=np.sum(votes,axis=0)>=10
    if not selected.any(): selected=np.sum(votes,axis=0)>0
    history=ReconstructionHistory('raw','prior_start').fit(train)
    X,y=history.transform(train),train[TARGET].to_numpy(float)
    models={n:m.fit(X[:,selected],y) for n,m in p2_regressors(SEED,True).items()}
    weights=integration_weights(np.asarray(errors))
    candidate=P2Bundle(history,selected,models,weights,float(y.mean()))
    detail={'train_n':len(train),'seed':SEED,'feature_count':len(history.names),
        'removed_features':[c for c in full if c.startswith('p2_secondary_')],
        'selected_features':np.asarray(history.names)[selected].tolist(),
        'original_selected_features':np.asarray(reference.history.names)[reference.selected].tolist(),
        'original_weights':reference.weights.tolist(),'candidate_weights':weights.tolist(),
        'original_cv_errors':stored.tolist(),'candidate_cv_errors':np.asarray(errors).tolist(),
        'folds':folds,'inner_cv_policy':'Original wafer-only splits; file-group overlap remains unchanged.'}
    return candidate,detail,pd.concat(records,ignore_index=True),pd.DataFrame(importances)
