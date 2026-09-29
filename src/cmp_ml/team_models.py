"""Explicit measurement availability shared by all paired model families."""
from __future__ import annotations

import numpy as np
import pandas as pd
from .team_preprocessing import CONDITIONS

STATE_NAMES=['ewma','last_mrr','last_age_seconds','last_wafers_back','observed_count']
SEEDS=(20260920,20260921,20260922)


def availability(frame, delay):
    result=pd.Series(np.inf,index=frame.index,dtype=float)
    for _,d in frame.groupby('table'):
        d=d.sort_values(['end','sample_id'])
        result.loc[d.index]=d.end.shift(-delay).fillna(np.inf)
    return result


def purge(frame, fold):
    query=frame[frame.fold.eq(fold)]
    earlier=frame[frame.fold.lt(fold)]
    fit=earlier[(earlier.end<query.start.min())&~earlier.wafer_id.isin(query.wafer_id)]
    assert not set(fit.wafer_id)&set(query.wafer_id)
    assert fit.end.max()<query.start.min()
    return fit,query,{'fold':fold,'initial_train_n':len(earlier),'train_n':len(fit),
        'purged_n':len(earlier)-len(fit),'query_n':len(query),'cutoff':float(query.start.min())}


def history_matrix(query, library, calibration, release, usage_columns, fallback,
                   partition, policy, record=True):
    """Choose references before reading targets. Query target is never consulted."""
    result=[]; details=[]
    # Distance imputation is fitted only on the fold's training library, independent
    # of online query rows. Raw distance reproduces the old RF/Bagging baseline.
    med=calibration[usage_columns].median().fillna(0)
    lu=library[usage_columns].fillna(med).to_numpy(float)
    qu=query[usage_columns].fillna(med).to_numpy(float)
    avail=release.reindex(library.index).to_numpy(float)
    for i,(qi,row) in enumerate(query.iterrows()):
        mask=(library.recipe.eq(row.recipe)&library.machine.eq(row.machine)&
              library.wafer_id.ne(row.wafer_id)).to_numpy() & (avail<float(row.start))
        ids=np.flatnonzero(mask)
        # Process chronology, even when delayed measurements arrive out of order.
        ids=ids[np.argsort(library.iloc[ids].start.to_numpy(),kind='stable')]
        refs=library.iloc[ids]
        y=refs.mrr.to_numpy(float)
        if len(y):
            weight=np.power(.6,np.arange(len(y)-1,-1,-1,dtype=float))
            ewma=float(np.dot(weight,y)/weight.sum())
            last=refs.iloc[-1]
            step=float(row['_pad_step'])
            back=max(1.,float(np.round((row.u_pad-last.u_pad)/step))) if row.u_pad>=last.u_pad else np.nan
            state=[ewma,float(last.mrr),float(row.start-last.end),back,float(len(y))]
        else:
            state=[float(fallback),np.nan,np.nan,np.nan,0.]
        lagids=ids[np.argsort(-library.iloc[ids].end.to_numpy(),kind='stable')][:11]
        nearids=ids[np.argsort(np.square(lu[ids]-qu[i]).sum(axis=1),kind='stable')[:10]]
        dynamic=np.full(21,np.nan)
        dynamic[:len(lagids)]=library.iloc[lagids].mrr
        dynamic[11:11+len(nearids)]=library.iloc[nearids].mrr
        result.append(np.r_[dynamic,state])
        if record:
            details.append({'partition':partition,'policy':policy,'query_id':row.sample_id,
                'query_start':float(row.start),'n_references':len(ids),
                'latest_available_at':float(avail[ids].max()) if len(ids) else np.nan,
                'state_reference_ids':';'.join(library.iloc[ids].sample_id),
                'lag_ids':';'.join(library.iloc[lagids].sample_id),
                'neighbor_ids':';'.join(library.iloc[nearids].sample_id)})
    return np.asarray(result,float).reshape(len(query),26),details


def matrices(frame, history, legacy_columns):
    new=frame[CONDITIONS].to_numpy(float)
    state=history[:,21:]
    return {'legacy_full125':np.column_stack([history[:,:21],frame[legacy_columns['full']]]),
            'legacy_primary73':np.column_stack([history[:,:21],frame[legacy_columns['primary']]]),
            'new_conditions':new,
            'new_state_residual':np.column_stack([new,state])}


def state_predictions(history,fallback):
    return {'recipe_mean':np.full(len(history),fallback),
        'persistent':np.where(np.isfinite(history[:,22]),history[:,22],fallback),
        'ewma':history[:,21]}
