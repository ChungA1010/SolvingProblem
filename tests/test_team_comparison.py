import numpy as np
import pandas as pd
from cmp_ml.team_preprocessing import FoldPreprocessor,CONDITIONS
from cmp_ml.team_models import availability,purge,history_matrix


def frame(n=16):
    x=pd.DataFrame({'sample_id':[str(i) for i in range(n)],'wafer_id':range(n),
        'recipe':'A456','table':'ch4','machine':1,'stage':'A','t_start':np.arange(n)*100.,
        't_end':np.arange(n)*100.+20,'start':np.arange(n)*100.,'end':np.arange(n)*100.+40,
        'fold':np.where(np.arange(n)<8,1,2),'mrr':np.arange(n)*2.+70,'u_pad':np.arange(n)*6.,
        'u_dresser':np.arange(n)*.4,'p_main':270.,'slurry_c':435.,'t_polish':100.,'t_rinse':16.,
        '_pad_step':6.,'usage':np.arange(n,dtype=float)})
    for c in CONDITIONS:
        if c not in x:x[c]=0.
    return x


def test_fold_parameters_and_prefix_ignore_future_changes():
    a=frame(); p=FoldPreprocessor.fit(a.iloc[:8]); out=p.transform(a)
    b=a.copy(); b.loc[12:,['u_pad','u_dresser','p_main','mrr']]=99999
    other=p.transform(b)
    pd.testing.assert_frame_equal(out.loc[:11,CONDITIONS],other.loc[:11,CONDITIONS])
    assert p.steps['ch4']['pad_step']==6
    assert p.medians['A456']['p_main']==270
    assert 'prev_mrr' not in out


def test_same_wafer_and_completion_purge():
    x=frame();x.loc[3,'wafer_id']=x.loc[9,'wafer_id'];x.loc[7,'end']=850
    a,b,info=purge(x,2)
    assert 3 not in a.index and 7 not in a.index
    assert len(b)==8 and info['purged_n']==2


def test_history_cannot_read_own_or_future_target():
    a=frame();release=availability(a,0);q=a.iloc[[10]].drop(columns='mrr')
    first,audit=history_matrix(q,a,a.iloc[:8],release,['usage'],75,2,'online')
    b=a.copy();b.loc[10:,'mrr']=999999
    second,_=history_matrix(q,b,b.iloc[:8],release,['usage'],75,2,'online')
    np.testing.assert_array_equal(first,second)
    assert audit[0]['latest_available_at']<a.loc[10,'start']
    assert first[0,22]==a.loc[9,'mrr']


def test_frozen_history_does_not_update_from_evaluation():
    a=frame();q=a.iloc[[10]].drop(columns='mrr')
    h,records=history_matrix(q,a.iloc[:8],a.iloc[:8],availability(a,0),['usage'],75,2,'frozen')
    assert h[0,22]==a.loc[7,'mrr']
    assert set(records[0]['state_reference_ids'].split(';'))==set(a.iloc[:8].sample_id)


def test_delay_five_means_five_later_observed_completions():
    a=frame();release=availability(a,5)
    assert release.loc[0]==a.loc[5,'end']
    h,_=history_matrix(a.iloc[[10]].drop(columns='mrr'),a,a.iloc[:8],release,['usage'],75,2,'delay5')
    assert h[0,22]==a.loc[4,'mrr']
    assert release.iloc[-5:].eq(np.inf).all()


def test_ewma_matches_pandas_with_immediate_measurements():
    a=frame();expected=a.mrr.shift().ewm(alpha=.4).mean().iloc[10]
    h,_=history_matrix(a.iloc[[10]].drop(columns='mrr'),a,a.iloc[:8],availability(a,0),['usage'],75,2,'online')
    np.testing.assert_allclose(h[0,21],expected)
