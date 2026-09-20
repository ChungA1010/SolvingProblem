"""Independent recomputation and audit of the staged run's sealed outputs."""
from pathlib import Path
from dataclasses import replace
import numpy as np
import pandas as pd
import joblib
from cmp_ml.common import read_json,write_json,sha256,utcnow,TARGET
from cmp_ml.baselines import check_hash
from cmp_ml.reconstruction import read_frame
from cmp_ml.staged_models import Spec,SETS,FAMILIES,HISTORIES,SEEDS
from cmp_ml.staged_features import PHASES
from cmp_ml.staged_experiment import context,plan,CACHE,RUN,ROOT

p=context(); seal=read_json(RUN/'training_complete.json');done=read_json(RUN/'completion.json')
if 'report_amendment' in done:
    amendment=done['report_amendment']
    check_hash(RUN/amendment['file'],amendment['sha256'])
    for n,h in read_json(RUN/amendment['file'])['unchanged_artifacts'].items():check_hash(RUN/n,h)
    original=pd.read_csv(RUN/'amendments/01_paired_comparisons_before.csv')
    repaired=pd.read_csv(RUN/'paired_comparisons.csv')
    pd.testing.assert_frame_equal(original[original.evaluation.isin(['group_oof','temporal'])],
                                  repaired[repaired.evaluation.isin(['group_oof','temporal'])])
check_hash(RUN/'training_complete.json',done['training_seal_sha256'])
for n,h in done['artifact_hashes'].items():check_hash(RUN/n,h)
for n,h in seal['fit_detail_hashes'].items():check_hash(RUN/'fit_details'/n,h)
pred=pd.concat([read_frame(RUN/'development_predictions.csv.gz'),read_frame(RUN/'reference_scored_predictions.csv.gz')],ignore_index=True)
assert not pred.duplicated(['cohort_variant','partition','model','sample_id']).any()
assert np.isfinite(pred[['prediction','truth']]).all().all()
rows=[]
for (cohort,evaluation,model),b in pred.assign(evaluation=pred.partition.map(lambda x:'group_oof' if x.startswith('outer_') else x)).groupby(['cohort_variant','evaluation','model']):
    for condition,q in [('all',b)]+list(b.groupby('condition')):
        errors=q.prediction.to_numpy(float)-q.truth.to_numpy(float)
        rows.append({'cohort_variant':cohort,'evaluation':evaluation,'model':model,'condition':condition,'n':len(q),
                     'mse':np.dot(errors,errors)/len(errors),'rmse':np.linalg.norm(errors)/np.sqrt(len(errors)),
                     'mae':np.linalg.norm(errors,ord=1)/len(errors),'p95_abs_error':np.percentile(abs(errors),95)})
recomputed=pd.DataFrame(rows).sort_values(['cohort_variant','evaluation','model','condition'])
stored=pd.read_csv(RUN/'metrics.csv').query("cohort_variant != 'full_fit_clean_eval'").sort_values(['cohort_variant','evaluation','model','condition'])
assert recomputed[['cohort_variant','evaluation','model','condition','n']].reset_index(drop=True).equals(stored[['cohort_variant','evaluation','model','condition','n']].reset_index(drop=True))
np.testing.assert_allclose(recomputed[['mse','rmse','mae','p95_abs_error']],stored[['mse','rmse','mae','p95_abs_error']],rtol=1e-12,atol=1e-10)
checks=0
for file in (RUN/'fit_details').glob('*.json'):
    d=read_json(file);scores=d['scores'];s=d['selections']
    def winner(candidates):return min(candidates,key=lambda x:(scores[x.key()]['score'],x.key()))
    s1=winner([Spec(f,history='none' if f=='compact12' else 'raw',family=m) for f in SETS for m in FAMILIES])
    s2=winner([replace(s1,phase=phase) for phase in PHASES])
    s3=winner([replace(s2,history=h) for h in HISTORIES])
    s4=winner([s3,Spec('compact12',history='none',family='mean'),Spec('compact12',history='raw',family='persistent')])
    for name,spec in [('S1_features',s1),('S2_phase',s2),('S3_history',s3),('S4_final',s4)]:
        assert spec==Spec(**s[name]);checks+=1
    for fold in d['inner_partitions']:
        assert not set(fold['train_ids'])&set(fold['query_ids'])
        assert fold['audit']['overlapping_groups']==fold['audit']['overlapping_wafers']==0
    for audit in d['prediction_audits'].values():assert audit['noncausal']==audit['same_wafer']==0
    for row in d['fold_scores']:assert row['history_audit']['noncausal']==row['history_audit']['same_wafer']==0
    for name,count in [('full125_rf',125),('primary73_rf',73),('compact12_rf',12),('compact33_rf',33)]:
        assert len(d['input_names'][name])==count

full=read_frame(CACHE/'training.csv.gz');plans=plan(full)
replay=0.
actual_history_references=0
for m in seal['models']:
    check_hash(RUN/m['file'],m['sha256']);bundle=joblib.load(RUN/m['file'])
    expected=plans[f"final_{m['condition']}"][2]
    assert set(bundle.inputs.library.sample_id)==set(expected.sample_id)
    _,audit=bundle.inputs.transform(expected.drop(columns=[TARGET]),True)
    assert audit['noncausal']==audit['same_wafer']==0
    actual_history_references+=audit['references']
    for cohort in ('validation','test'):
        q=read_frame(CACHE/f'{cohort}.csv.gz');q=q[q.condition.eq(m['condition'])]
        matched=pred[pred.cohort_variant.eq('clean')&pred.partition.eq(cohort)&pred.model.eq(m['name'])&pred.condition.eq(m['condition'])].set_index('sample_id')
        x=bundle.predict_seeds(q)
        _,audit=bundle.inputs.transform(q,True)
        assert audit['noncausal']==audit['same_wafer']==0
        actual_history_references+=audit['references']
        np.testing.assert_allclose(x,matched.loc[q.sample_id,[f'seed_{s}' for s in SEEDS]],rtol=0,atol=1e-9)
        replay=max(replay,float(np.abs(x.mean(axis=1)-matched.loc[q.sample_id,'prediction'].to_numpy()).max()))
for n,h in p['preserved_files'].items():check_hash(ROOT/n,h)
# Verify that the historical comparison really uses the same query IDs/truths.
old=pd.concat([read_frame(ROOT/'runs/phm_cmp_robust_v2'/n) for n in
               ('development_predictions.csv.gz','reference_scored_predictions.csv.gz')])
old=old[old.policy.eq('completed')&old.model.eq('selected')].set_index(['partition','sample_id']).sort_index()
new=pred[pred.cohort_variant.eq('clean')&pred.model.eq('S4_final')].set_index(['partition','sample_id']).sort_index()
assert old.index.equals(new.index)
np.testing.assert_allclose(old.truth,new.truth,rtol=0,atol=1e-10)
write_json(RUN/'verification.json',{'verified_at':utcnow(),'status':'passed','prediction_rows':len(pred),
    'recomputed_metric_rows':len(recomputed),'selection_checks':checks,'model_routes_checked':len(seal['models']),
    'max_reload_difference':replay,'historical_files_unchanged':len(p['preserved_files']),
    'causal_history_violations':0,'recomputed_history_references':actual_history_references,
    'feature_counts_verified':[125,73,12,33],'historical_comparison_query_rows_verified':len(new),
    'method':'Recomputed metrics from row predictions; reconstructed every inner-score selection; checked all split/audit records and replayed all saved models; no service promotion.'})
print(read_json(RUN/'verification.json'))
