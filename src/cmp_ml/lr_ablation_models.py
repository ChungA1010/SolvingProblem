"""Single-component P2 ablation; keep the published reconstruction immutable."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .common import TARGET
from .paper_models import integration_weights
from .reconstruction_models import ReconstructionHistory, p2_regressors

SEED = 20260917
ALPHA = 10.0
COMPONENTS = ('P2_Persistent','P2_KNN','P2_LR','P2_SVR','P2_Bagging')
PROCEDURES = ('original','no_lr','ridge10')


def ridge_model():
    return make_pipeline(SimpleImputer(keep_empty_features=True), StandardScaler(), Ridge(alpha=ALPHA))


def without_lr(weights):
    w=np.asarray(weights,float).copy()
    if w.shape!=(5,) or not np.isfinite(w).all() or (w<0).any():
        raise ValueError('Invalid component weights')
    w[2]=0
    if w.sum()<=0: raise ValueError('No remaining component weight')
    return w/w.sum()


@dataclass
class LRBundle:
    reference: object
    ridge: object
    ridge_weights: np.ndarray

    def predict_all(self, query):
        original=self.reference.predict_all(query)
        Z=np.column_stack([original[n] for n in COMPONENTS])
        X=self.reference.history.transform(query)[:,self.reference.selected]
        r=self.ridge.predict(X)
        changed=Z.copy(); changed[:,2]=r
        return {**{n:original[n] for n in COMPONENTS}, 'P2_Ridge':r,
            'original':original['P2_Integrated'], 'no_lr':Z@without_lr(self.reference.weights),
            'ridge10':changed@self.ridge_weights}


def fit_ablation(reference, cv, votes, progress=None):
    """Replay frozen feature votes and original CV errors; only fit a new linear arm."""
    train=reference.history.library.reset_index(drop=True)
    cv, votes=pd.DataFrame(cv),pd.DataFrame(votes)
    names=reference.history.names
    errors=cv.pivot(index='fold',columns='model',values='mse').loc[range(20),list(COMPONENTS)].to_numpy()
    np.testing.assert_allclose(integration_weights(errors),reference.weights,rtol=1e-10,atol=1e-12)
    selected_votes=votes.pivot(index='fold',columns='feature',values='selected').loc[range(20),names].to_numpy(bool)
    final_selected=selected_votes.sum(axis=0)>=10
    if not final_selected.any(): final_selected=selected_votes.sum(axis=0)>0
    np.testing.assert_array_equal(final_selected,reference.selected)
    records,plans=[],[]
    replacement_errors=errors.copy()
    for fold,(a,b) in enumerate(GroupShuffleSplit(20,test_size=.2,random_state=SEED).split(train,groups=train.WAFER_ID)):
        fit,q=train.iloc[a],train.iloc[b]
        assert not set(fit.WAFER_ID)&set(q.WAFER_ID)
        history=ReconstructionHistory('raw','prior_start').fit(fit)
        X,V=history.transform(fit),history.transform(q.drop(columns=[TARGET]))
        cols=selected_votes[fold]; y=fit[TARGET].to_numpy(float)
        original=p2_regressors(SEED+fold,True)['P2_LR'].fit(X[:,cols],y).predict(V[:,cols])
        ridge=ridge_model().fit(X[:,cols],y).predict(V[:,cols])
        orig_mse=np.square(original-q[TARGET]).mean()
        np.testing.assert_allclose(orig_mse,errors[fold,2],rtol=1e-7,atol=1e-7)
        replacement_errors[fold,2]=np.square(ridge-q[TARGET]).mean()
        records.append(pd.DataFrame({'fold':fold,'sample_id':q.sample_id,'truth':q[TARGET],
            'original_lr':original,'ridge10_lr':ridge}))
        plans.append({'fold':fold,'fit_ids':fit.sample_id.tolist(),'query_ids':q.sample_id.tolist(),
            'selected_features':np.array(names)[cols].tolist(),'original_lr_mse':float(orig_mse),
            'stored_original_lr_mse':float(errors[fold,2]),'ridge10_lr_mse':float(replacement_errors[fold,2])})
        if progress and (fold+1)%10==0: progress(f'CV {fold+1}/20')
    X=reference.history.transform(train)[:,reference.selected]
    ridge=ridge_model().fit(X,train[TARGET])
    weights=integration_weights(replacement_errors)
    detail={'condition':train.condition.iloc[0],'train_n':len(train),'alpha':ALPHA,
        'components':COMPONENTS,'original_weights':reference.weights.tolist(),
        'no_lr_weights':without_lr(reference.weights).tolist(),'ridge10_weights':weights.tolist(),
        'original_cv_errors':errors.tolist(),'ridge10_cv_errors':replacement_errors.tolist(),
        'selected_features':np.array(names)[reference.selected].tolist(),'folds':plans}
    return LRBundle(reference,ridge,weights),detail,pd.concat(records,ignore_index=True)
