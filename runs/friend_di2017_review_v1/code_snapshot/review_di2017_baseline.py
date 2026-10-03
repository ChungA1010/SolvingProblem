"""Recalculate published Di baseline results without refitting any estimator."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys

import numpy as np
import pandas as pd

MODELS = ['persistent', 'knn', 'linear_regression', 'svr', 'tree_bagging', 'integrated']
BASELINE_SHA = '8888c82bc4c3ad3ae88f12585ac61957496d3d92'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    source = args.source_dir.resolve()
    result = source / 'results/di2017_final_audit'
    output = args.output_dir.resolve()
    if output.exists():
        raise FileExistsError('Use a new output directory to preserve earlier results.')
    manifest_path = Path(__file__).resolve().parents[1] / 'runs/friend_di2017_review_v1/source_manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    assert manifest['commit'] == BASELINE_SHA
    for name, digest in manifest['input_sha256'].items():
        if hashlib.sha256((source / name).read_bytes()).hexdigest() != digest:
            raise ValueError('Source differs from the reviewed baseline commit: ' + name)
    predictions = pd.read_csv(result / 'cv_predictions.csv')
    metrics = pd.read_csv(result / 'cv_fold_metrics.csv')
    table = pd.read_csv(result / 'final_di2017_feature_table.csv')
    summary = pd.read_csv(result / 'final_summary_vs_paper.csv')
    info = json.loads((result / 'run_info.json').read_text(encoding='utf-8'))
    recomputed = []
    for (mode, split, condition), rows in predictions.groupby(['lag_mode', 'split', 'condition']):
        for model in MODELS:
            saved = metrics[(metrics.lag_mode == mode) & (metrics.split == split)
                            & (metrics.condition == condition) & (metrics.model == model)]
            assert len(saved) == 1
            value = float(((rows['pred_' + model] - rows.AVG_REMOVAL_RATE) ** 2).mean())
            difference = abs(value - float(saved.iloc[0].mse))
            assert len(rows) == int(saved.iloc[0].n_eval) and difference < 1e-10
            recomputed.append({'lag_mode': mode, 'split': split, 'condition': condition,
                               'model': model, 'n': len(rows), 'reported_mse': float(saved.iloc[0].mse),
                               'recomputed_mse': value, 'absolute_difference': difference})
    comparisons = []
    for mode, rows in predictions.groupby('lag_mode'):
        for model in MODELS:
            error = rows['pred_' + model] - rows.AVG_REMOVAL_RATE
            mse = float((error ** 2).groupby(rows.split).mean().mean())
            mae = float(error.abs().groupby(rows.split).mean().mean())
            saved = summary[summary.model == model].iloc[0]
            reported = float(saved.Final_Reproduction_MSE) if mode == 'history_first' else None
            if reported is not None:
                assert abs(mse - reported) < 1e-10
            comparisons.append({'lag_mode': mode, 'model': model, 'prediction_rows': len(rows),
                                'recomputed_mae': mae, 'recomputed_mse': mse,
                                'pooled_rmse': float(np.sqrt(mse)), 'reported_mse': reported,
                                'source_report_paper_mse': float(saved.Paper_MSE)})

    # Reconstruct the source's random split selection and confirm its saved evaluation IDs.
    rng = np.random.default_rng(info['seed'])
    diagnostics = []
    overlaps = []
    for split in range(info['n_splits']):
        split_rng = np.random.default_rng(int(rng.integers(0, 1_000_000_000)))
        trains, evaluations = [], []
        for condition, original in table.groupby('condition'):
            rows = original.sort_values(['first_timestamp', 'WAFER_ID']).reset_index(drop=True)
            n_eval = max(1, int(round(len(rows) * info['test_size'])))
            eval_idx = np.sort(split_rng.choice(rows.index.to_numpy(), size=n_eval, replace=False))
            train_idx = np.array([i for i in rows.index if i not in set(eval_idx.tolist())])
            train, evaluation = rows.iloc[train_idx], rows.iloc[eval_idx]
            saved = predictions[(predictions.lag_mode == 'history_first')
                                & (predictions.split == split) & (predictions.condition == condition)]
            assert set(zip(evaluation.WAFER_ID, evaluation.STAGE)) == set(zip(saved.WAFER_ID, saved.STAGE))
            diagnostics.append({'split': split, 'condition': condition, 'train_n': len(train),
                                'evaluation_n': len(evaluation), 'saved_ids_match': True,
                                'train_max_start': float(train.first_timestamp.max()),
                                'evaluation_min_start': float(evaluation.first_timestamp.min()),
                                'strict_temporal_split': bool(train.first_timestamp.max() < evaluation.first_timestamp.min())})
            trains.append(train)
            evaluations.append(evaluation)
        train, evaluation = pd.concat(trains), pd.concat(evaluations)
        overlaps.append({'split': split, 'shared_wafer_ids': len(set(train.WAFER_ID) & set(evaluation.WAFER_ID)),
                         'train_n': len(train), 'evaluation_n': len(evaluation)})

    # This inspected helper only reads unrelated result JSONs and prints a verdict.
    script = subprocess.run([sys.executable, str(source / 'scripts/verify_reproduction.py')],
                            cwd=source, capture_output=True, text=True, encoding='utf-8', check=True)
    assert '0 PASS / 0 FAIL / 8 SKIP' in script.stdout and 'ALL CHECKS PASS' in script.stdout
    rows = predictions[predictions.lag_mode == 'history_first']
    uniform_error = rows[['pred_' + m for m in MODELS[:-1]]].mean(axis=1) - rows.AVG_REMOVAL_RATE
    uniform_mse = float((uniform_error ** 2).groupby(rows.split).mean().mean())
    inputs = ['results/di2017_final_audit/' + n for n in
              ['cv_predictions.csv', 'cv_fold_metrics.csv', 'final_di2017_feature_table.csv',
               'final_summary_vs_paper.csv', 'run_info.json', 'feature_selection_audit.csv']]
    inputs += ['src/models/di2017_baseline.py', 'src/models/di2017_final_audit.py',
               'src/models/reproduce_di2017.py', 'scripts/verify_reproduction.py']
    output.mkdir(parents=True)
    pd.DataFrame(recomputed).to_csv(output / 'metrics_recomputed.csv', index=False)
    pd.DataFrame(comparisons).to_csv(output / 'performance_comparison.csv', index=False)
    pd.DataFrame(diagnostics).to_csv(output / 'split_diagnostics.csv', index=False)
    pd.DataFrame(overlaps).to_csv(output / 'wafer_overlap.csv', index=False)
    (output / 'source_verifier_output.txt').write_text(script.stdout, encoding='utf-8')
    report = {'review_date': '2026-10-03', 'status': 'published_metrics_recalculation_passed',
              'reviewed_commit': BASELINE_SHA, 'model_refits': 0,
              'prediction_rows': len(predictions), 'metrics_checked': len(recomputed),
              'max_mse_difference': max(r['absolute_difference'] for r in recomputed),
              'random_condition_splits_confirmed': len(diagnostics),
              'strict_temporal_splits': sum(r['strict_temporal_split'] for r in diagnostics),
              'wafer_overlap_per_split_min': min(r['shared_wafer_ids'] for r in overlaps),
              'wafer_overlap_per_split_max': max(r['shared_wafer_ids'] for r in overlaps),
              'source_verifier': {'pass': 0, 'fail': 0, 'skip': 8, 'printed_verdict': 'ALL CHECKS PASS',
                                  'supports_di_baseline_validation': False},
              'uniform_average_of_saved_predictions_mse': uniform_mse,
              'uniform_diagnostic_is_not_a_refitted_helper_score': True,
              'input_sha256': {name: hashlib.sha256((source / name).read_bytes()).hexdigest() for name in inputs}}
    (output / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'input_sha256'}))


if __name__ == '__main__':
    main()
