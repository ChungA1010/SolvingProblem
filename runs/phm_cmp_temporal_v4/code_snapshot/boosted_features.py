"""Target-free summaries of all active episodes and an auditable raw-input cache."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from .baselines import check_hash
from .common import KEYS, TARGET, SLURRY, sample_id, sha256, utcnow, read_json, write_json
from .paper_benchmark import ROOT, log
from .reconstruction import GZIP, read_frame
from .robust_features import GAP, SIGNALS, segments

PREVIOUS = ROOT / "runs/phm_cmp_robust_v2"


def active_summary(values):
    t = values.index.to_numpy(float)
    p = values.CENTER_AIR_BAG_PRESSURE.to_numpy(float)
    speed = np.abs(values.WAFER_ROTATION.to_numpy(float)) + np.abs(values.STAGE_ROTATION.to_numpy(float))
    slurry = values[SLURRY].sum(axis=1, min_count=len(SLURRY)).to_numpy(float)
    active = (p > 0) & ((values.WAFER_ROTATION.to_numpy() > 0) | (values.STAGE_ROTATION.to_numpy() > 0)) & (slurry > 0)
    dt = np.diff(t)
    observed = (dt > 0) & (dt <= GAP)
    on = observed & active[:-1] & active[1:]
    total, duration = float(dt[observed].sum()), float(dt[on].sum())
    pieces = [s for s in segments(t, active) if len(s) >= 2 and t[s[-1]] - t[s[0]] >= 10]
    spans = np.array([t[s[-1]] - t[s[0]] for s in pieces])
    result = {"observed_time": total, "active_time": duration, "inactive_time": total - duration,
        "active_fraction": duration / total if total else np.nan,
        "active_point_fraction": float(active.mean()) if len(t) else np.nan,
        "episode_count": len(pieces), "episode_min": float(spans.min()) if len(spans) else np.nan,
        "episode_median": float(np.median(spans)) if len(spans) else np.nan,
        "episode_max": float(spans.max()) if len(spans) else np.nan,
        "episode_std": float(spans.std()) if len(spans) else np.nan}
    for name, x in (("pressure", p), ("rotation_sum", speed), ("slurry", slurry), ("pressure_rotation_proxy", p * speed)):
        finite = np.isfinite(x)
        use = active & finite
        intervals = on & finite[:-1] & finite[1:]
        result[name + "_mean"] = float(x[use].mean()) if use.any() else np.nan
        result[name + "_std"] = float(x[use].std()) if use.any() else np.nan
        result[name + "_integral"] = float(np.sum(.5 * (x[:-1][intervals] + x[1:][intervals]) * dt[intervals])) if len(t) else np.nan
    return result


def extract_multi(trace):
    primary = 4 if 4 in set(trace.CHAMBER) else 1
    result = {}
    for zone, mask in (("primary", trace.CHAMBER.eq(primary)), ("secondary", trace.CHAMBER.ne(primary))):
        values = trace.loc[mask].groupby("TIMESTAMP", sort=True)[SIGNALS].mean()
        result.update({f"multi_{zone}_{k}": v for k, v in active_summary(values).items()})
    return result


def prepare_inputs(cache, original_root, external_root):
    if cache.exists():
        raise FileExistsError("Use a new cache; existing extraction is immutable")
    cache.mkdir(parents=True)
    previous = read_json(PREVIOUS / "protocol.json")
    sources = read_json(PREVIOUS / "sources.json")
    expected = {(r['cohort'], r['file']): r['sha256'] for r in sources}
    metadata = []
    for cohort in ("training", "validation", "test"):
        old = ROOT / previous['cache'] / f'{cohort}.csv.gz'
        check_hash(old, previous['cache_sha256'][old.name])
        frame = read_frame(old)
        if cohort != 'training' and TARGET in frame:
            raise ValueError('Held-out label in feature input')
        folder = original_root / 'CMP-data/training' if cohort == 'training' else external_root / cohort
        files = sorted(folder.glob(f'CMP-{cohort}-[0-9]*.csv'))
        if len(files) != 185:
            raise ValueError('Expected 185 source logs')
        chunks = []
        for path in files:
            check_hash(path, expected[cohort, path.name])
            raw = pd.read_csv(path)
            if TARGET in raw:
                raise ValueError('Label in raw process input')
            raw['source_file'] = path.name
            chunks.append(raw)
        raw = pd.concat(chunks, ignore_index=True)
        records = []
        for (w, s), trace in raw.groupby(KEYS, sort=True):
            sid = sample_id(w, s)
            records.append({'sample_id': sid, **extract_multi(trace)})
            metadata.append({'sample_id': sid, 'cohort': cohort, 'raw_rows': len(trace),
                'source_files': ';'.join(sorted(trace.source_file.unique())),
                'chambers': ';'.join(map(str, sorted(trace.CHAMBER.unique()))),
                'raw_start': float(trace.TIMESTAMP.min()), 'raw_end': float(trace.TIMESTAMP.max()),
                'duplicate_chamber_times': int(trace.duplicated(['CHAMBER', 'TIMESTAMP']).sum())})
        frame = frame.merge(pd.DataFrame(records), on='sample_id', how='left', validate='one_to_one')
        assert frame.multi_primary_episode_count.notna().all()
        frame.to_csv(cache / f'{cohort}.csv.gz', index=False, compression=GZIP)
        log(f'All-episode extraction {cohort}: {len(frame)} samples')
        del raw, chunks
    pd.DataFrame(metadata).to_csv(cache / 'raw_metadata.csv', index=False)
    # Review the previously identified tail, without modifying its labels or inclusion.
    pred = read_frame(PREVIOUS / 'development_predictions.csv.gz')
    pred = pred[pred.partition.str.startswith('outer_') & pred.policy.eq('completed') & pred.model.eq('selected')].copy()
    pred['squared_error'] = (pred.prediction - pred.truth) ** 2
    tail = pred.nlargest(int(np.ceil(.05 * len(pred))), 'squared_error')
    labels = original_root / 'CMP-training-removalrate.csv'
    label_source = next(r for r in read_json(ROOT / 'runs/phm_cmp_papers_v1/sources.json') if r['file'] == labels.name)
    check_hash(labels, label_source['sha256'])
    truth = pd.read_csv(labels)
    groups = truth.groupby(KEYS)[TARGET].agg(['size', 'min', 'max', 'mean']).reset_index()
    groups['sample_id'] = [sample_id(w, s) for w, s in zip(groups.WAFER_ID, groups.STAGE)]
    groups = groups.rename(columns={'size': 'label_rows', 'min': 'label_min', 'max': 'label_max', 'mean': 'raw_label_mean'})
    audit = tail.merge(groups.drop(columns=KEYS), on='sample_id', validate='one_to_one')
    audit = audit.merge(pd.DataFrame(metadata).query("cohort == 'training'"), on='sample_id', validate='one_to_one')
    quality = read_frame(cache / 'training.csv.gz')
    audit = audit.merge(quality[['sample_id'] + [c for c in quality if c.startswith(('qc_', 'multi_'))]], on='sample_id', validate='one_to_one')
    audit['label_mean_matches'] = np.isclose(audit.truth, audit.raw_label_mean, atol=1e-10, rtol=0)
    assert audit.label_mean_matches.all() and len(audit) == 99
    audit.to_csv(cache / 'tail_audit.csv', index=False)
    write_json(cache / 'inputs.json', {'prepared_at': utcnow(), 'source_run': PREVIOUS.relative_to(ROOT).as_posix(),
        'sources': sources, 'label_source': label_source,
        'raw_source_labels_match': int(audit.label_mean_matches.sum()), 'tail_n': len(audit),
        'tail_squared_error_share': float(tail.squared_error.sum() / pred.squared_error.sum()),
        'episode_label_alignment': 'not established by aggregate label matching; no sample/label was removed or corrected',
        'source_cache_sha256': previous['cache_sha256'],
        'code_sha256': sha256(Path(__file__)),
        'cache_sha256': {p.name: sha256(p) for p in cache.glob('*.csv*')}})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=ROOT / '.cache/boosted/phm_cmp_boosted_v3')
    parser.add_argument('--original-root', type=Path, default=ROOT.parent / '.tmp_phm_review/PHM/Dataset/CMP1')
    parser.add_argument('--external-root', type=Path, default=ROOT.parent / 'cmp-virtual-lab-ml/data/phm2016_external')
    a = parser.parse_args()
    prepare_inputs(a.cache_dir.resolve(), a.original_root, a.external_root)
