"""Target-free, explicitly defined feature sets for the staged CMP experiment."""
from __future__ import annotations

import numpy as np

from .common import USAGE
from .robust_features import SIGNALS, segments, statistics

PRESSURES = ['CENTER_AIR_BAG_PRESSURE', 'RIPPLE_AIR_BAG_PRESSURE',
             'MAIN_OUTER_AIR_BAG_PRESSURE', 'EDGE_AIR_BAG_PRESSURE']
COMPACT_SIGNALS = USAGE[:3] + PRESSURES + ['WAFER_ROTATION', 'HEAD_ROTATION', 'SLURRY_FLOW_LINE_C']
PHASES = ('raw', 'gap', 'active', 'longest', 'trimmed')


def episode_indices(values):
    """Change one rule at each step; never bridge gaps/excluded observations."""
    t = values.index.to_numpy(float)
    all_ids = np.arange(len(t))
    active = ((values.MAIN_OUTER_AIR_BAG_PRESSURE.to_numpy() > 1) &
              (values.WAFER_ROTATION.to_numpy() > 1))
    pieces = segments(t, active)
    longest = max(pieces, key=lambda s: (t[s[-1]]-t[s[0]], len(s), -int(s[0]))) if pieces else np.array([], int)
    trimmed = longest
    if len(longest) >= 3:
        lo, hi = t[longest[0]], t[longest[-1]]
        trimmed = longest[(t[longest] >= lo+.05*(hi-lo)) & (t[longest] <= hi-.05*(hi-lo))]
    return {'raw': all_ids, 'gap': all_ids, 'active': np.flatnonzero(active),
            'longest': longest, 'trimmed': trimmed}, len(pieces)


def extract_staged(trace):
    primary = 4 if 4 in set(trace.CHAMBER) else 1
    values = trace.loc[trace.CHAMBER.eq(primary)].groupby('TIMESTAMP', sort=True)[SIGNALS].mean()
    views, n = episode_indices(values)
    result = {'qc_active_episodes': n}
    for view, ids in views.items():
        s = statistics(values, ids)
        if view == 'raw':
            t = values.index.to_numpy(float)
            s['duration'] = float(t[-1]-t[0]) if len(t) else 0.
        else:
            result.update({f'{view}__p2_primary_{k}': v for k, v in s.items()})
        sub = values.iloc[ids]
        result.update({f'{view}__compact_{c}': float(sub[c].mean()) if len(sub) else np.nan
                       for c in COMPACT_SIGNALS + ['STAGE_ROTATION']})
        result[f'{view}__compact_duration'] = s['duration']
        result[f'{view}__compact_count'] = len(sub)
        result[f'qc_{view}_count'] = len(sub)
    return result


def physical_columns(frame, feature_set, phase):
    if feature_set in ('full125', 'primary73'):
        cols = sorted(c for c in frame if c.startswith('p2_') and
                      (feature_set == 'full125' or c.startswith('p2_primary_')))
        return [f'{phase}__{c}' if phase != 'raw' and c.startswith('p2_primary_') else c for c in cols]
    signals = COMPACT_SIGNALS.copy()
    if feature_set == 'compact_no_pressure':
        signals = [c for c in signals if c not in PRESSURES]
    if feature_set == 'compact_no_usage':
        signals = [c for c in signals if c not in USAGE[:3]]
    if feature_set == 'compact_no_slurry':
        signals.remove('SLURRY_FLOW_LINE_C')
    tail = ['duration', 'STAGE_ROTATION' if feature_set == 'compact_stage12' else 'count']
    return [f'{phase}__compact_{c}' for c in signals+tail]
