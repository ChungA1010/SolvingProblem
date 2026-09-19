"""Target-free candidates for the explicitly assumed paper-completion protocol."""
from __future__ import annotations

import numpy as np

from .common import PRESSURE, ROTATION, SLURRY, USAGE
from .paper_features import SIGNALS, moment_features

STATS = ('moment3', 'skew', 'std', 'kurtosis')
TIME_COLUMNS = [f'c1_{stat}_x{n}' for stat in STATS for n in range(7, 26)]
FFT_STATS = ('amplitude', 'centroid', 'kurtosis')
VIEWS = ('rows_dc', 'time_ac')
PHASES = {'loose': (.85, 1.3), 'nominal': (.90, 1.2), 'strict': (.95, 1.1)}
PRESSURES = ['PRESSURIZED_CHAMBER_PRESSURE'] + PRESSURE
META = ['wafer', 'stage', 'start', 'cpp', 'first']
FINE = [f'initial_{c}' for c in USAGE] + META + ['duration']
ROUGH = FINE + [f'{c}_{s}' for c in PRESSURES + ROTATION for s in ('mean', 'median', 'integral')] + [f'{c}_{s}' for c in SLURRY for s in ('mean', 'median')]
PUBLISHED_ROUGH = ['wafer', 'stage', 'initial_USAGE_OF_DRESSER', 'initial_USAGE_OF_DRESSER_TABLE',
                   'initial_USAGE_OF_POLISHING_TABLE', 'initial_USAGE_OF_MEMBRANE', 'duration',
                   'CENTER_AIR_BAG_PRESSURE_integral', 'first', 'start', 'cpp']
PUBLISHED_FINE = ['wafer', 'initial_USAGE_OF_DRESSER', 'initial_USAGE_OF_DRESSER_TABLE',
                 'initial_USAGE_OF_POLISHING_TABLE', 'initial_USAGE_OF_MEMBRANE', 'cpp']


def p1_columns(view):
    if view not in VIEWS:
        raise ValueError(view)
    return TIME_COLUMNS + [f'c1_{view}_{s}_x{n}' for n in (21, 22, 23) for s in FFT_STATS]


def p3_columns(route, phase):
    return [f'c3_{phase}_{c}' for c in (ROUGH if route == '456' else FINE)]


def segments(t, ids=None, gap=60.):
    t = np.asarray(t, float)
    ids = np.arange(len(t)) if ids is None else np.asarray(ids, int)
    if not len(ids):
        return []
    breaks = (np.diff(ids) > 1) | (np.diff(t[ids]) > gap)
    return np.split(ids, np.flatnonzero(breaks) + 1)


def spectrum(x, spacing=1., demean=False):
    x = np.asarray(x, float)
    if not len(x) or not np.isfinite(x).all() or spacing <= 0:
        raise ValueError('Nonfinite/empty spectrum input or invalid spacing')
    if demean:
        x = x - x.mean()
    amplitude = np.abs(np.fft.rfft(x)) / len(x)
    f = np.fft.rfftfreq(len(x), d=spacing)
    w = amplitude ** 2
    if w.sum() <= 1e-24:
        return np.zeros(3)
    w /= w.sum()
    center = np.dot(w, f)
    var = np.dot(w, (f - center) ** 2)
    kurt = np.dot(w, (f - center) ** 4) / var ** 2 if var > 1e-24 else 0.
    return np.array([amplitude.max(), center, kurt])


def time_spectrum(t, x):
    values, weights = [], []
    for ids in segments(t):
        ti, xi = t[ids], x[ids]
        if len(ids) < 2:
            continue
        step = float(np.median(np.diff(ti)))
        grid = np.arange(ti[0], ti[-1] + step * 1e-6, step)
        values.append(spectrum(np.interp(grid, ti, xi), step, True))
        weights.append(float(ti[-1] - ti[0]))
    return np.average(values, axis=0, weights=weights) if weights else np.zeros(3)


def choose_phase(values, route, phase):
    t = values.index.to_numpy(float)
    if not len(t):
        raise ValueError('Missing primary chamber')
    if route == '123':
        return np.arange(len(t)), False
    p, s = values.CENTER_AIR_BAG_PRESSURE.to_numpy(), values.SLURRY_FLOW_LINE_A.to_numpy()
    pressure_fraction, slurry_ratio = PHASES[phase]
    plateau = np.quantile(p[p > 0], .9) if (p > 0).any() else 0.
    mask = p >= pressure_fraction * plateau if plateau > 0 else np.zeros(len(p), bool)
    positive = s[mask & (s > 0)]
    if len(positive):
        mask &= s <= slurry_ratio * np.median(positive)
    mask &= (values.WAFER_ROTATION.to_numpy() > 0) | (values.STAGE_ROTATION.to_numpy() > 0)
    candidates = [ids for ids in segments(t, np.flatnonzero(mask)) if len(ids) >= 2]
    fallback = not candidates
    if fallback:
        candidates = segments(t)
    chosen = max(candidates, key=lambda ids: (t[ids[-1]] - t[ids[0]], len(ids), -int(ids[0])))
    return chosen, fallback


def phase_features(trace, route, phase):
    primary = 4 if route == '456' else 1
    vals = trace[trace.CHAMBER.eq(primary)].groupby('TIMESTAMP', sort=True)[SIGNALS].mean()
    ids, fallback = choose_phase(vals, route, phase)
    t = vals.index.to_numpy(float)
    blocks = segments(t, ids)
    result = {f'initial_{c}': float(vals[c].iloc[0]) for c in USAGE}
    result.update(wafer=float(trace.WAFER_ID.iloc[0]), stage=float(trace.STAGE.iloc[0] == 'B'),
                  start=float(t[0]), duration=float(sum(t[b[-1]] - t[b[0]] for b in blocks)))
    for c in PRESSURES + ROTATION + SLURRY:
        x = vals[c].to_numpy(float)
        result[f'{c}_mean'], result[f'{c}_median'] = float(x[ids].mean()), float(np.median(x[ids]))
        if c not in SLURRY:
            result[f'{c}_integral'] = float(sum(np.trapezoid(x[b], t[b]) for b in blocks))
    result = {f'c3_{phase}_{k}': v for k, v in result.items()}
    result.update({f'qc_{phase}_fallback': fallback, f'qc_{phase}_start': float(t[ids[0]]),
                   f'qc_{phase}_end': float(t[ids[-1]]), f'qc_{phase}_rows': len(ids),
                   f'qc_{phase}_segments': len(blocks)})
    return result


def extract_candidates(trace):
    trace = trace.sort_values(['TIMESTAMP', 'CHAMBER'], kind='stable')
    # Mixed nullable/integer CSV blocks can become object dtype after concatenation.
    # Explicit numeric conversion avoids pandas' slow Python aggregation fallback.
    trace[SIGNALS] = trace[SIGNALS].astype(float)
    stats = moment_features(trace[SIGNALS].to_numpy(float))
    result = {f'c1_{s}_x{n}': float(stats[s][n - 7]) for s in STATS for n in range(7, 26)}
    values = trace.groupby('TIMESTAMP', sort=True)[ROTATION].mean()
    for n, c in zip((21, 22, 23), ROTATION):
        summaries = {'rows_dc': spectrum(trace[c].to_numpy(float)),
                     'time_ac': time_spectrum(values.index.to_numpy(float), values[c].to_numpy(float))}
        for view, summary in summaries.items():
            result.update({f'c1_{view}_{s}_x{n}': float(v) for s, v in zip(FFT_STATS, summary)})
    route = '456' if 4 in set(trace.CHAMBER) else '123'
    for phase in PHASES:
        result.update(phase_features(trace, route, phase))
    return result


def catalog():
    return {'p1': {v: p1_columns(v) for v in VIEWS}, 'p3': {'rough_45': ROUGH, 'fine_12': FINE},
            'p3_published_subset': {'456': PUBLISHED_ROUGH, '123': PUBLISHED_FINE},
            'limitations': 'P3 author reports 47 rough features but does not list all; this explicit reconstruction has 45.'}
