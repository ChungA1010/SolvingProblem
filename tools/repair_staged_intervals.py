"""One-time reporting-only amendment; models, selection and point metrics unchanged."""
import pandas as pd
from cmp_ml.common import read_json,write_json,sha256,utcnow
from cmp_ml.reconstruction import read_frame
from cmp_ml.staged_experiment import RUN,code_hashes,bootstrap_comparisons,context

path=RUN/'amendments/01_reference_intervals.json'
if path.exists():raise FileExistsError('Amendment already applied')
protocol=read_json(RUN/'protocol.json')
before=read_json(RUN/'amendments/01_completion_before.json')
sealed=['protocol.json','training_complete.json','development_predictions.csv.gz',
        'reference_predictions.csv.gz','reference_scored_predictions.csv.gz','metrics.csv','fold_metrics.csv']
unchanged={n:sha256(RUN/n) for n in sealed}
current=code_hashes()
assert [n for n,h in current.items() if h!=protocol['code_sha256'][n]]==['staged_experiment.py']
write_json(path,{'applied_at':utcnow(),'scope':'reporting-only; reference rows lack connected-group metadata',
    'reason':'Initial group bootstrap produced NaN point values for official Validation/Test because their group_id is missing. Group/time point values and all trained predictions are unaffected. Report reference point gains, leave intervals unavailable; never substitute row-IID resampling.',
    'original_protocol_sha256':unchanged['protocol.json'],'original_code_sha256':protocol['code_sha256'],
    'updated_code_sha256':current,'unchanged_artifacts':unchanged,
    'original_completion_sha256':sha256(RUN/'amendments/01_completion_before.json'),
    'original_driver_sha256':sha256(RUN/'amendments/01_staged_experiment_before.py'),
    'original_comparisons_sha256':sha256(RUN/'amendments/01_paired_comparisons_before.csv')})
context()
pred=pd.concat([read_frame(RUN/n) for n in ('development_predictions.csv.gz','reference_scored_predictions.csv.gz')],ignore_index=True)
fixed=bootstrap_comparisons(pred)
assert fixed[['baseline_rmse','candidate_rmse','rmse_improvement_pct']].notna().all().all()
assert fixed[fixed.evaluation.isin(['group_oof','temporal'])][['bootstrap_low_pct','bootstrap_high_pct']].notna().all().all()
fixed.to_csv(RUN/'paired_comparisons.csv',index=False)
for n,h in unchanged.items():assert sha256(RUN/n)==h
done=read_json(RUN/'completion.json')
done['artifact_hashes']['paired_comparisons.csv']=sha256(RUN/'paired_comparisons.csv')
done['report_amendment']={'file':path.relative_to(RUN).as_posix(),'sha256':sha256(path),'no_retraining':True}
write_json(RUN/'completion.json',done)
print('Repaired reference comparison reporting; sealed models/predictions/point metrics unchanged')
