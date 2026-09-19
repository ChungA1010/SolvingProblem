"""Pre-Test, Train-motivated matched-row control for the completion experiment."""
from pathlib import Path
import argparse

from threadpoolctl import threadpool_limits

from cmp_ml.common import read_json, write_json, sha256, utcnow
from cmp_ml.completion import RUN, CACHE, context, save_model
from cmp_ml.completion_features import PUBLISHED_FINE
from cmp_ml.completion_models import genetic_search, fit_ga_final, SEED
from cmp_ml.reconstruction_models import fit_p3_variant


def prepare():
    assert not (RUN / 'prediction_seal.json').exists()
    assert not (RUN / 'p3_clean_sensitivity_protocol.json').exists()
    train, _ = context()
    extreme = train[train.excluded_extreme]
    assert len(extreme) == 4 and set(extreme.route) == {'123'}
    doc = {
        'frozen_at': utcnow(),
        'reason': 'Train-only diagnosis: all four previously excluded extremes are in fine route 123, MRR 4129-4326 versus median 151.15. Add a matched-1977-row comparison so feature/GA effects are not conflated with removing those records. Current-run Test predictions/targets have not been evaluated.',
        'arms': ['ga_clean_1977', 'phase_clean_1977', 'legacy_clean_1977'],
        'selection': 'No Test selection. Reuse every rough model unchanged (no excluded records there); rerun fine GA on 1977-row cohort with identical population12/generations8/families/seed/3fold settings, nominal phase. Also fit the fixed six-feature nominal and legacy RF fine controls.',
        'excluded_ids': extreme.sample_id.tolist(),
        'script_sha256': sha256(Path(__file__)),
        'core_code_sha256': read_json(RUN / 'protocol.json')['code_hashes'],
        'limitation': 'A sensitivity arm using the earlier P1 exclusions, not a claim that P3 authors removed these four records.'}
    write_json(RUN / 'p3_clean_sensitivity_protocol.json', doc)
    (RUN / 'code_snapshot/complete_p3_clean_sensitivity.py').write_bytes(Path(__file__).read_bytes())
    print('Frozen matched-row P3 control before Test scoring', flush=True)


def train_extra():
    assert not (RUN / 'prediction_seal.json').exists()
    assert not (RUN / 'p3_clean_sensitivity_complete.json').exists()
    spec = read_json(RUN / 'p3_clean_sensitivity_protocol.json')
    assert sha256(Path(__file__)) == spec['script_sha256']
    train, _ = context()
    fit = train[train.route.eq('123') & ~train.excluded_extreme]
    with threadpool_limits(limits=1):
        ga = genetic_search(fit, '123', 'nominal')
        phase = fit_ga_final(fit, [f'c3_nominal_{c}' for c in PUBLISHED_FINE], 'rf')
        legacy = fit_p3_variant(fit, SEED, {'forest': 'standard'})
    folder = RUN / 'amendments/02_matched_row_control'
    folder.mkdir(parents=True, exist_ok=False)
    for name in ('selection.json', 'model_registry.json', 'evaluation_seal.json'):
        (folder / name).write_bytes((RUN / name).read_bytes())
    registry = read_json(RUN / 'model_registry.json')
    for source, arm, model in [('ga_selected', 'ga_clean_1977', ga['bundle']),
                                ('phase_1981', 'phase_clean_1977', phase), ('legacy_1981', 'legacy_clean_1977', legacy)]:
        rough = next(r for r in registry if r['paper'] == 'p3' and r['arm'] == source and r['group'] == '456')
        registry.append({**rough, 'arm': arm})
        save_model(f'P3_{arm}_123', model, registry, 'p3', arm, 'route', '123')
    choices = read_json(RUN / 'selection.json')
    choices['choices']['p3_clean'] = ga['selection']
    choices['matched_row_control_selected_at'] = utcnow()
    write_json(RUN / 'selection.json', choices)
    write_json(RUN / 'model_registry.json', registry)
    for suffix, data in [('evaluations', ga['logs']), ('generations', ga['history']), ('folds', ga['membership'])]:
        write_json(RUN / f'p3clean_123_nominal_{suffix}.json', data)
    seal = read_json(RUN / 'evaluation_seal.json')
    seal.update(sealed_at=utcnow(), selection_sha256=sha256(RUN / 'selection.json'), registry_sha256=sha256(RUN / 'model_registry.json'),
                models={m['path']: m['sha256'] for m in registry},
                matched_row_protocol_sha256=sha256(RUN / 'p3_clean_sensitivity_protocol.json'))
    write_json(RUN / 'evaluation_seal.json', seal)
    write_json(RUN / 'p3_clean_sensitivity_complete.json', dict(completed_at=utcnow(), selection=ga['selection'],
        evaluations=len(ga['logs']), protocol_sha256=seal['matched_row_protocol_sha256'],
        prior_seal_sha256=sha256(folder / 'evaluation_seal.json'), script_sha256=spec['script_sha256']))
    print('Completed matched-row control:', ga['selection'], flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('action', choices=['prepare', 'train'])
    args = parser.parse_args()
    prepare() if args.action == 'prepare' else train_extra()
