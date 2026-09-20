"""Target-free exact sequence audit of primary/secondary CMP chamber records.

This inspects recording redundancy, not causality, and never opens removal-rate files.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from .common import TARGET, USAGE, read_json, write_json, sha256, sample_id, utcnow
from .paper_features import SIGNALS

ROOT = Path(__file__).resolve().parents[2]
KEY = ['MACHINE_ID', 'WAFER_ID', 'STAGE', 'CHAMBER', 'TIMESTAMP']
MIN_ROWS = 10
MAX_GAP = 60.0
OFFSET_DECIMALS = 6
PROCESS = [c for c in SIGNALS if c not in USAGE]
BLOCK_COLUMNS = ('q_segment p_segment q_sample p_sample q_wafer p_wafer q_stage p_stage route q_chamber '
    'q_first_pos p_first_pos rows q_start q_end p_start p_end offset offset_spread process_dynamic_channels '
    'dynamic_signals strong same_wafer same_stage relation simultaneous source_episode_completed_before_secondary '
    'q_own_primary_start q_source_files p_source_files').split()


def prepare_segments(raw):
    if TARGET in raw:
        raise ValueError('Targets are forbidden in the audit input')
    if not np.isfinite(raw[SIGNALS + ['TIMESTAMP']].to_numpy(float)).all():
        raise ValueError('Nonfinite sensor/time value; do not silently impute')
    f = raw.copy()
    # Identical same-key rows are redundant records; conflicting keys are not averaged.
    unique = f.drop_duplicates(KEY + SIGNALS).sort_values(KEY, kind='stable').reset_index(drop=True)
    unique['_pre_pos'] = unique.groupby(KEY[:-1], sort=False).cumcount()
    conflict = unique.duplicated(KEY, keep=False)
    bad = unique.loc[conflict, KEY].drop_duplicates()
    counts = {'raw_rows': len(f), 'exact_duplicate_records': len(f) - len(unique),
              'conflicting_keys': len(bad), 'conflicting_unique_rows': int(conflict.sum())}
    f = unique.loc[~conflict].sort_values(KEY, kind='stable').reset_index(drop=True)
    f['route'] = np.where(f.CHAMBER.gt(3), '456', '123')
    f['primary'] = f.CHAMBER.isin([1, 4])
    f['sample_id'] = [sample_id(w, s) for w, s in zip(f.WAFER_ID, f.STAGE)]
    group = f.groupby(KEY[:-1], sort=False)
    gap = group.TIMESTAMP.diff()
    boundary = gap.isna() | gap.gt(MAX_GAP) | group._pre_pos.diff().ne(1)
    f['segment'] = boundary.cumsum().astype(int) - 1
    f['pos'] = f.groupby('segment').cumcount()
    f['row_id'] = np.arange(len(f))
    f['sig'] = pd.util.hash_pandas_object(f[SIGNALS], index=False).to_numpy()
    meta = f.groupby('segment').agg(sample_id=('sample_id','first'), wafer=('WAFER_ID','first'),
        stage=('STAGE','first'), machine=('MACHINE_ID','first'), route=('route','first'),
        chamber=('CHAMBER','first'), primary=('primary','first'), start=('TIMESTAMP','min'),
        end=('TIMESTAMP','max'), rows=('pos','size'), first_row=('row_id','min'),
        source_files=('source_file',lambda a: ';'.join(sorted(set(a)))))
    # Reference chronology uses the latest observed same-wafer primary start at/before this segment.
    # This does not establish which episode the wafer-level metrology describes.
    by_sample = {k:g for k,g in meta[meta.primary].groupby('sample_id')}
    meta['own_primary_start'] = np.nan
    meta['own_primary_candidates'] = 0
    for sid, r in meta[~meta.primary].iterrows():
        g = by_sample.get(r.sample_id)
        if g is not None:
            g = g[(g.machine == r.machine) & (g.route == r.route) & (g.start <= r.start)]
            meta.at[sid, 'own_primary_candidates'] = len(g)
            if len(g):
                meta.at[sid, 'own_primary_start'] = g.start.max()
    return f, meta, counts, bad


def matching_blocks(f, meta):
    cols = ['MACHINE_ID','route','sig','row_id','segment','pos','TIMESTAMP']
    sec = f.loc[~f.primary, cols].rename(columns={c:'q_'+c for c in cols[3:]})
    pri = f.loc[f.primary, cols].rename(columns={c:'p_'+c for c in cols[3:]})
    pairs = sec.merge(pri, on=cols[:3], how='inner', validate='many_to_many')
    potential = len(pairs)
    # Verify all 19 values, so hashing cannot itself establish a match.
    X = f[SIGNALS].to_numpy(float)
    equal = np.zeros(len(pairs), bool)
    for start in range(0, len(pairs), 100000):
        part = pairs.iloc[start:start+100000]
        equal[start:start+len(part)] = (X[part.q_row_id] == X[part.p_row_id]).all(axis=1)
    pairs = pairs.loc[equal].copy()
    exact = len(pairs)
    pairs['offset'] = np.round(pairs.q_TIMESTAMP - pairs.p_TIMESTAMP, OFFSET_DECIMALS)
    pairs = pairs.sort_values(['q_segment','p_segment','offset','q_pos','p_pos'], kind='stable').reset_index(drop=True)
    if not len(pairs):
        return pd.DataFrame(columns=BLOCK_COLUMNS), {'candidate_row_pairs':potential, 'verified_exact_row_pairs':exact}
    boundary = pairs[['q_segment','p_segment','offset']].ne(pairs[['q_segment','p_segment','offset']].shift()).any(axis=1)
    boundary |= pairs.q_pos.diff().ne(1) | pairs.p_pos.diff().ne(1)
    boundary |= pairs.q_TIMESTAMP.diff().le(0) | pairs.q_TIMESTAMP.diff().gt(MAX_GAP)
    starts = np.flatnonzero(boundary)
    ends = np.r_[starts[1:],len(pairs)]
    out = []
    process_idx = [SIGNALS.index(c) for c in PROCESS]
    for a,b in zip(starts, ends):
        if b-a < MIN_ROWS:
            continue
        block = pairs.iloc[a:b]
        first, last = block.iloc[0], block.iloc[-1]
        q, p = meta.loc[int(first.q_segment)], meta.loc[int(first.p_segment)]
        values = X[block.q_row_id.to_numpy(int)]
        dynamic = [PROCESS[j] for j,k in enumerate(process_idx) if len(np.unique(values[:,k])) >= 3]
        same_wafer = q.wafer == p.wafer
        same_stage = q.stage == p.stage
        relation = 'unknown_own_primary'
        if same_wafer:
            relation = 'same_wafer'
        elif np.isfinite(q.own_primary_start):
            relation = 'earlier_primary' if p.start < q.own_primary_start else 'later_primary' if p.start > q.own_primary_start else 'equal_primary_start'
        offset_values = block.q_TIMESTAMP.to_numpy() - block.p_TIMESTAMP.to_numpy()
        verified_offset = float(np.ptp(offset_values)) <= 10 ** (-OFFSET_DECIMALS)
        out.append({'q_segment':int(first.q_segment),'p_segment':int(first.p_segment),
            'q_sample':q.sample_id,'p_sample':p.sample_id,'q_wafer':int(q.wafer),'p_wafer':int(p.wafer),
            'q_stage':q.stage,'p_stage':p.stage,'route':q.route,'q_chamber':int(q.chamber),
            'q_first_pos':int(first.q_pos),'p_first_pos':int(first.p_pos),'rows':int(b-a),
            'q_start':float(first.q_TIMESTAMP),'q_end':float(last.q_TIMESTAMP),
            'p_start':float(first.p_TIMESTAMP),'p_end':float(last.p_TIMESTAMP),
            'offset':float(first.offset),'offset_spread':float(np.ptp(offset_values)),
            'process_dynamic_channels':len(dynamic),'dynamic_signals':';'.join(dynamic),
            'strong':len(dynamic)>=2 and verified_offset,'same_wafer':bool(same_wafer),
            'same_stage':bool(same_stage),'relation':relation,'simultaneous':bool(np.max(np.abs(offset_values))<=1e-6),
            'source_episode_completed_before_secondary':bool(p.end<q.start),
            'q_own_primary_start':None if not np.isfinite(q.own_primary_start) else float(q.own_primary_start),
            'q_source_files':q.source_files,'p_source_files':p.source_files})
    return pd.DataFrame(out, columns=BLOCK_COLUMNS), {'candidate_row_pairs':potential,'verified_exact_row_pairs':exact}


def verify_blocks(f, meta, blocks):
    # Independent direct slices: no reliance on hashes, joins, or the detector's row-pair table.
    verified = 0
    for r in blocks.itertuples(index=False):
        q0 = int(meta.loc[r.q_segment,'first_row']) + r.q_first_pos
        p0 = int(meta.loc[r.p_segment,'first_row']) + r.p_first_pos
        q, p = f.iloc[q0:q0+r.rows], f.iloc[p0:p0+r.rows]
        assert (q.segment == r.q_segment).all() and (p.segment == r.p_segment).all()
        assert np.array_equal(q[SIGNALS].to_numpy(), p[SIGNALS].to_numpy())
        for v in [q,p]:
            dt = np.diff(v.TIMESTAMP.to_numpy())
            assert ((dt>0)&(dt<=MAX_GAP)).all()
        delta = q.TIMESTAMP.to_numpy() - p.TIMESTAMP.to_numpy()
        nd = sum(q[c].nunique()>=3 for c in PROCESS)
        assert nd == r.process_dynamic_channels
        assert bool(nd>=2 and np.ptp(delta)<=1e-6) == r.strong
        assert bool(np.max(np.abs(delta))<=1e-6) == r.simultaneous
        verified += 1
    return {'blocks_checked_by_direct_slices':verified,'all_19_values_equal':True,
        'contiguity_and_variation_recomputed':True,'label_files_opened':0}


def summarize(f, meta, blocks, counts):
    strong = blocks.loc[blocks.strong.astype(bool)] if len(blocks) else blocks
    all_samples = meta.groupby('sample_id').agg(wafer=('wafer','first'),stage=('stage','first'),route=('route','first'),
        segments=('rows','size'),rows=('rows','sum'))
    for name, mask in {
        'strong_any':lambda b: np.ones(len(b),bool),
        'strong_same_stage_previous':lambda b:(~b.same_wafer)&b.same_stage&b.relation.eq('earlier_primary'),
        'strong_same_stage_later':lambda b:(~b.same_wafer)&b.same_stage&b.relation.eq('later_primary'),
        'strong_cross_stage':lambda b:(~b.same_wafer)&(~b.same_stage),
        'strong_same_wafer':lambda b:b.same_wafer,
        'strong_simultaneous_other_wafer':lambda b:(~b.same_wafer)&b.simultaneous,
    }.items():
        subset=strong.loc[mask(strong)] if len(strong) else strong
        tally=subset.groupby('q_sample').size() if len(subset) else pd.Series(dtype=int)
        all_samples[name+'_blocks']=all_samples.index.map(tally).fillna(0).astype(int)
    covered = np.zeros(len(f), bool)
    simultaneous = np.zeros(len(f), bool)
    previous = np.zeros(len(f), bool)
    for r in strong.itertuples(index=False):
        a=int(meta.loc[r.q_segment,'first_row'])+r.q_first_pos
        covered[a:a+r.rows]=True
        if r.simultaneous and not r.same_wafer:
            simultaneous[a:a+r.rows]=True
        if r.same_stage and not r.same_wafer and r.relation=='earlier_primary':
            previous[a:a+r.rows]=True
    f=f.assign(strong_covered=covered,simultaneous_other_covered=simultaneous,previous_covered=previous)
    group=f[~f.primary].groupby(['STAGE','route']).agg(secondary_rows=('row_id','size'),
        any_strong_rows=('strong_covered','sum'),simultaneous_other_rows=('simultaneous_other_covered','sum'),
        previous_same_stage_rows=('previous_covered','sum')).reset_index()
    summary={**counts,'audit_rows':len(f),'samples':len(all_samples),'segments':len(meta),
        'primary_segments':int(meta.primary.sum()),'secondary_segments':int((~meta.primary).sum()),
        'secondary_rows':int((~f.primary).sum()),'blocks_min_10_rows':len(blocks),'strong_blocks':len(strong),
        'strong_covered_secondary_rows':int(covered.sum()),'simultaneous_other_covered_rows':int(simultaneous.sum()),
        'previous_same_stage_covered_rows':int(previous.sum()),
        'sample_counts':{c:int((all_samples[c]>0).sum()) for c in all_samples if c.endswith('_blocks')},
        'rows_by_condition':group.to_dict('records'),
        'limitation':'Exact repeated sequences do not establish which sensor/wafer caused the signal. Train-only gaps may hide previous wafers.'}
    if len(strong):
        summary['strong_block_relations']=strong.groupby(['same_stage','relation','simultaneous']).size().reset_index(name='blocks').to_dict('records')
    return summary, all_samples.reset_index(), group


def run(raw_root, destination):
    if destination.exists():
        raise FileExistsError('Use a new output directory; prior audits are immutable')
    destination.mkdir(parents=True)
    files=sorted(raw_root.glob('CMP-training-[0-9]*.csv'))
    expected={r['file']:r['sha256'] for r in read_json(ROOT/'runs/phm_cmp_robust_v2/sources.json') if r['cohort']=='training'}
    if len(files)!=185 or set(p.name for p in files)!=set(expected):
        raise ValueError('Expected the 185 original Train process files')
    write_json(destination/'protocol.json',{'created_at':utcnow(),'scope':'Train process signals only, all 1981 wafer-stages; no label/outlier removal',
        'input_name_pattern':'CMP-training-[0-9]*.csv','sources_expected':expected,
        'signals':SIGNALS,'matching_values':'exact numeric equality, 19/19; hash only proposes pairs',
        'minimum_consecutive_rows':MIN_ROWS,'max_gap_source_timestamp_units':MAX_GAP,
        'offset_round_decimals':OFFSET_DECIMALS,'offset_spread_tolerance':1e-6,
        'strong_criterion':'at least two non-usage sensor channels each have >=3 distinct values in a >=10-row exact block',
        'candidate_scope':'same machine and chamber route; same/different wafer and Stage both retained and reported separately',
        'previous_definition':'source primary episode starts before latest observed own primary episode start at/before query secondary start; chronology proxy, not label alignment',
        'conflicting_same_timestamp':'exclude the conflicting timestamp from audit only, never average',
        'duplicates':'deduplicate identical same-key sensor rows, retain first source location',
        'preliminary_inspection':'Schema/row totals/hash bucket sizes were inspected without labels before fixing sequence criteria. Not statistical preregistration.',
        'training_performed':False,'code_sha256':sha256(Path(__file__))})
    Path(destination/'audit_source.py').write_bytes(Path(__file__).read_bytes())
    chunks=[]
    for p in files:
        assert sha256(p)==expected[p.name], p.name
        frame=pd.read_csv(p)
        if TARGET in frame:
            raise ValueError('Label column in process input')
        frame['source_file']=p.name
        frame['source_row']=np.arange(len(frame))+2
        chunks.append(frame)
    raw=pd.concat(chunks,ignore_index=True)
    f, meta, counts, conflicts=prepare_segments(raw)
    print(f'Prepared {len(f)} signal records and {len(meta)} segments',flush=True)
    del raw,chunks
    blocks,pair_counts=matching_blocks(f,meta)
    print(f'Matched {len(blocks)} contiguous candidate blocks',flush=True)
    verification=verify_blocks(f,meta,blocks)
    summary,samples,conditions=summarize(f,meta,blocks,{**counts,**pair_counts})
    meta.to_csv(destination/'segments.csv.gz',compression={'method':'gzip','mtime':0})
    blocks.to_csv(destination/'blocks.csv.gz',index=False,compression={'method':'gzip','mtime':0})
    samples.to_csv(destination/'samples.csv',index=False)
    conditions.to_csv(destination/'condition_summary.csv',index=False)
    conflicts.to_csv(destination/'conflicting_keys.csv',index=False)
    # Representative metadata only. Do not publish raw signal arrays.
    examples=blocks.loc[blocks.strong.astype(bool)].sort_values(['rows','q_segment','p_segment'],ascending=[False,True,True]).head(20)
    examples.to_csv(destination/'examples.csv',index=False)
    write_json(destination/'summary.json',summary)
    write_json(destination/'verification.json',{**verification,'all_185_source_hashes_match':True,
        'code_matches_protocol':sha256(Path(__file__))==read_json(destination/'protocol.json')['code_sha256']})
    write_json(destination/'artifact_manifest.json',{p.name:sha256(p) for p in sorted(destination.iterdir())})
    print(summary,flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raw-root',type=Path,default=ROOT.parent/'.tmp_phm_review/PHM/Dataset/CMP1/CMP-data/training')
    parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_chamber_audit_v1')
    a=parser.parse_args()
    run(a.raw_root.resolve(),a.run_dir.resolve())
