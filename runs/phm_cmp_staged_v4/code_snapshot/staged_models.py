"""Fold-local causal history and sequential, nested model selection."""
from __future__ import annotations

from dataclasses import dataclass, replace, asdict
import warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import make_pipeline

from .common import TARGET, USAGE
from .improvement import audit_partition
from .staged_features import physical_columns, PHASES

SEEDS = (20260920, 20260921, 20260922)
FAMILIES = ('rf', 'bag')
SETS = ('full125', 'primary73', 'compact12', 'compact33')
HISTORIES = ('none', 'raw', 'standardized', 'reset', 'reset_summary')


@dataclass(frozen=True)
class Spec:
    features: str = 'full125'
    phase: str = 'raw'
    history: str = 'raw'
    family: str = 'rf'

    def key(self):
        return '|'.join(asdict(self).values())


class CausalInputs:
    def __init__(self, spec):
        self.spec = spec

    def fit(self, frame):
        self.library = frame.reset_index(drop=True).copy()
        self.columns = physical_columns(frame, self.spec.features, self.spec.phase)
        self.usage = [f'p2_primary_{c}_mean' for c in USAGE]
        self.imputer = SimpleImputer(strategy='median', keep_empty_features=True).fit(frame[self.usage])
        self.u = self.imputer.transform(frame[self.usage])
        self.scale = self.u.std(axis=0)
        self.scale[self.scale < 1e-12] = 1.
        self.reset_threshold = np.maximum(.2*(np.quantile(self.u[:,:3], .9, axis=0)-
                                                  np.quantile(self.u[:,:3], .1, axis=0)), 1e-8)
        self.names = ([] if self.spec.history == 'none' else
                      [f'lag_{i}' for i in range(11)]+[f'neighbor_{i}' for i in range(10)])
        if self.spec.history == 'reset_summary':
            self.names += ['lag_count', 'neighbor_count', 'last_age', 'nearest_distance', 'reset_flag']
        self.names += self.columns
        return self

    def indices(self, query):
        lib = self.library
        times, end = lib.start.to_numpy(float), lib.end.to_numpy(float)
        wafers, cond = lib.WAFER_ID.to_numpy(), lib.condition.to_numpy()
        machine = lib.machine.to_numpy()
        ux = self.imputer.transform(query[self.usage])
        slots = np.full((len(query), 21), -1, int)
        quality = np.full((len(query), 5), np.nan)
        for i, row in enumerate(query.itertuples(index=False)):
            # The stored training library is the ONLY source of target history.
            ok = (wafers != row.WAFER_ID) & (cond == row.condition) & (machine == row.machine) & (end < row.start)
            prior = np.flatnonzero(ok)
            order = prior[np.argsort(times[prior], kind='stable')]
            reset = False
            if self.spec.history in ('reset', 'reset_summary') and len(order):
                chain = np.vstack([self.u[order,:3], ux[i,:3]])
                drops = np.flatnonzero((np.diff(chain, axis=0) < -self.reset_threshold).any(axis=1))
                if len(drops):
                    first = int(drops[-1]+1)
                    reset = first == len(order)
                    prior = order[first:]
            lag = prior[np.argsort(-end[prior], kind='stable')][:11]
            scale = 1. if self.spec.history == 'raw' else self.scale
            d = np.square((self.u[prior]-ux[i])/scale).sum(axis=1)
            rank = np.argsort(d, kind='stable')[:10]
            neighbors = prior[rank]
            slots[i,:len(lag)] = lag
            slots[i,11:11+len(neighbors)] = neighbors
            quality[i] = [len(lag),len(neighbors),row.start-end[lag[0]] if len(lag) else np.nan,
                          float(np.sqrt(d[rank[0]])) if len(rank) else np.nan,float(reset)]
        return slots, quality

    def transform(self, query, audit=False):
        physical = query[self.columns].to_numpy(float)
        if self.spec.history == 'none':
            return (physical, {'references':0,'noncausal':0,'same_wafer':0}) if audit else physical
        slots, quality = self.indices(query)
        y = self.library[TARGET].to_numpy(float)
        dyn = np.full(slots.shape, np.nan)
        valid = slots >= 0
        dyn[valid] = y[slots[valid]]
        X = np.column_stack([dyn, quality, physical] if self.spec.history == 'reset_summary' else [dyn, physical])
        if not audit:
            return X
        qindices, _ = np.where(valid)
        refs = slots[valid]
        bad_time = int((self.library.end.to_numpy()[refs] >= query.start.to_numpy()[qindices]).sum())
        bad_wafer = int((self.library.WAFER_ID.to_numpy()[refs] == query.WAFER_ID.to_numpy()[qindices]).sum())
        assert bad_time == bad_wafer == 0
        return X, {'references':len(refs),'noncausal':bad_time,'same_wafer':bad_wafer,
                   'without_lag':int((slots[:,0]<0).sum()),'reset_at_query':int(quality[:,4].sum())}


@dataclass
class Bundle:
    spec: Spec
    inputs: CausalInputs
    models: list
    mean: float

    def predict_seeds(self, query):
        X = self.inputs.transform(query)
        if self.spec.family == 'mean':
            return np.full((len(query), len(SEEDS)), self.mean)
        if self.spec.family == 'persistent':
            p = X[:,0].copy()
            p[~np.isfinite(p)] = self.mean
            return np.tile(p[:,None], (1,len(SEEDS)))
        return np.column_stack([m.predict(X) for m in self.models])

    def predict(self, query):
        return self.predict_seeds(query).mean(axis=1)


def estimator(family, seed):
    return make_pipeline(SimpleImputer(strategy='median', keep_empty_features=True),
                         RandomForestRegressor(n_estimators=100, min_samples_leaf=5,
                         max_features=.7 if family == 'rf' else 1., bootstrap=True, n_jobs=1, random_state=seed))


def fit_bundle(train, spec, seeds=SEEDS):
    inputs = CausalInputs(spec).fit(train)
    X = inputs.transform(train.drop(columns=[TARGET]))
    y = train[TARGET].to_numpy(float)
    models = [] if spec.family in ('mean','persistent') else [estimator(spec.family,s).fit(X,y) for s in seeds]
    return Bundle(spec,inputs,models,float(y.mean()))


def inner_partitions(train):
    result = []
    for f,(a,b) in enumerate(GroupKFold(3,shuffle=True,random_state=SEEDS[0]).split(train,groups=train.group_id)):
        fit,q = train.iloc[a],train.iloc[b]
        result.append((f'group_{f}',fit,q,audit_partition(fit,q)))
    groups = train.groupby('group_id').agg(start=('start','min'),end=('end','max'))
    cutoff = float(train.start.quantile(.75))
    past = groups.index[groups.end < cutoff]
    future = groups.index[groups.start >= cutoff]
    fit, q = train[train.group_id.isin(past)], train[train.group_id.isin(future)]
    if len(fit) >= 30 and len(q) >= 10 and fit.group_id.nunique() >= 2:
        result.append(('time',fit,q,audit_partition(fit,q,True)))
    else:
        raise ValueError('Insufficient purged inner time holdout; protocol must be revised explicitly')
    return result


def select_stages(train, progress=print):
    """Outer query/labels never enter selection. Every stage retains its predecessor."""
    inner = inner_partitions(train)
    scores, fold_records = {}, []
    matrices = {}
    def score(spec):
        key = spec.key()
        if key in scores:
            return scores[key]['score']
        losses = []
        for fold,fit,q,_ in inner:
            ikey = (fold,spec.features,spec.phase,spec.history)
            if ikey not in matrices:
                inputs = CausalInputs(spec).fit(fit)
                X = inputs.transform(fit.drop(columns=[TARGET]))
                V,audit = inputs.transform(q.drop(columns=[TARGET]),True)
                matrices[ikey] = X,V,audit
            X,V,audit = matrices[ikey]
            y,truth = fit[TARGET].to_numpy(float),q[TARGET].to_numpy(float)
            if spec.family == 'mean':
                pred = np.full(len(q),y.mean())
            elif spec.family == 'persistent':
                pred = np.where(np.isfinite(V[:,0]),V[:,0],y.mean())
            else:
                pred = estimator(spec.family,SEEDS[0]).fit(X,y).predict(V)
            losses.append((fold,float(np.square(pred-truth).sum()),len(q)))
            fold_records.append({'spec':key,'fold':fold,'mse':losses[-1][1]/len(q),
                                 'n':len(q),'history_audit':audit})
        group_mse = sum(s for f,s,n in losses if f.startswith('group')) / sum(n for f,s,n in losses if f.startswith('group'))
        time_mse = next(s/n for f,s,n in losses if f=='time')
        scores[key] = {'score':.5*(group_mse+time_mse),'group_mse':group_mse,'time_mse':time_mse}
        return scores[key]['score']

    def choose(specs):
        return min(specs,key=lambda s:(score(s),s.key()))
    step1 = [Spec(f,history='none' if f=='compact12' else 'raw',family=m) for f in SETS for m in FAMILIES]
    s1 = choose(step1)
    progress(f'Feature selection: {s1.key()}')
    step2 = [replace(s1,phase=p) for p in PHASES]
    s2 = choose(step2)
    progress(f'Phase selection: {s2.phase}')
    step3 = [replace(s2,history=h) for h in HISTORIES]
    s3 = choose(step3)
    mean = Spec('compact12',history='none',family='mean')
    persistent = Spec('compact12',history='raw',family='persistent')
    s4 = choose([s3,mean,persistent])
    # Ablations are diagnostic only and do not enlarge the selection pool.
    diagnostic = [Spec(f,phase='active',history='none',family=m)
                  for f in ('compact12','compact_no_pressure','compact_no_usage','compact_no_slurry','compact_stage12')
                  for m in FAMILIES]
    for spec in diagnostic:
        score(spec)
    detail = {'selection_objective':'0.5 pooled inner group MSE + 0.5 purged inner time MSE',
              'selections':{k:asdict(v) for k,v in [('S1_features',s1),('S2_phase',s2),('S3_history',s3),('S4_final',s4)]},
              'scores':scores,'fold_scores':fold_records,
              'inner_partitions':[{'fold':f,'train_ids':a.sample_id.tolist(),'query_ids':b.sample_id.tolist(),'audit':audit}
                                  for f,a,b,audit in inner]}
    requested = {f'{s.features}_{s.family}':s for s in step1}
    requested.update({'S1_features':s1,'S2_phase':s2,'S3_history':s3,'S4_final':s4,'condition_mean':mean,'persistent':persistent})
    requested.update({f'phase_{s.phase}':s for s in step2})
    requested.update({f'history_{s.history}':s for s in step3})
    requested.update({f'ablation_{s.features}_{s.family}':s for s in diagnostic})
    return requested,detail
