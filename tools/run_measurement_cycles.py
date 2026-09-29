"""Paired measurement-budget experiment and portable server replay fixture."""
from pathlib import Path
from dataclasses import asdict
from zipfile import ZipFile
from io import BytesIO
import argparse,json,hashlib,shutil
import numpy as np
import pandas as pd
from cmp_ml.measurement_replay import Replay,ReplayOptions

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runs/phm_cmp_measurement_cycles_v1'
PREVIOUS=ROOT/'runs/phm_cmp_team_comparison_v1'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,x):Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')


def main(archive):
    if RUN.exists():raise FileExistsError('Run already exists')
    RUN.mkdir()
    with ZipFile(archive) as z:w=pd.read_csv(BytesIO(z.read('preprocessed/wafer_table.csv')))
    m=pd.read_csv(PREVIOUS/'manifest.csv')
    x=m.merge(w[['wafer_id','stage','u_pad','u_dresser','gap_s','p_main']],on=['wafer_id','stage'],validate='one_to_one')
    x=x[x.table.eq('ch4')].sort_values(['start','sample_id']).reset_index(drop=True)
    assert len(x)==1613 and set(x.recipe)=={'A456','B456'}
    x['ordinal']=np.arange(len(x))
    byend=x.sort_values(['end','sample_id'])
    x['release5']=byend.end.shift(-5)
    records=json.loads(x.replace([np.inf,-np.inf],np.nan).to_json(orient='records'))
    cases=[]
    for f in range(2,6):
        p=pd.read_csv(PREVIOUS/f'partition_fold{f}.csv')
        valid=set(x.sample_id)
        train=[i for i in p.loc[p.role.eq('train'),'sample_id'] if i in valid]
        query=[i for i in p.loc[p.role.eq('evaluation'),'sample_id'] if i in valid]
        cases.append({'scenario_id':f'fold_{f}','fold':f,'train_ids':train,'query_ids':query,
                      'label':{2:'초기 장비 상태',3:'중기 제거율 변화',4:'후기 장비 상태',5:'후기 압력 설정 변화'}[f]})
    fixture={'version':'measurement-replay-v1','records':records,'cases':cases}
    write(RUN/'replay_fixture.json',fixture)
    snapshot=RUN/'code_snapshot';snapshot.mkdir()
    source=[ROOT/'src/cmp_ml/measurement_replay.py',Path(__file__),ROOT/'docs/measurement-cycle-protocol.md']
    for p in source:shutil.copyfile(p,snapshot/p.name)
    shutil.copyfile(source[-1],RUN/'PROTOCOL.md')
    write(RUN/'protocol.json',{'alpha':.4,'periods':[1,5,10],'delays':[0,5],'modes':['separate','shared'],
        'source_archive_sha256':sha(archive),'fixture_sha256':sha(RUN/'replay_fixture.json'),
        'source_hashes':{p.relative_to(ROOT).as_posix():sha(p) for p in source},
        'previous_partition_hashes':{p.name:sha(p) for p in PREVIOUS.glob('partition_fold*.csv')}})
    predictions=[];metrics=[];counts=[]
    checks=0;max_difference=0.;bad_refs=0
    for case in cases:
        for period in (1,5,10):
            for offset in range(period):
                for delay in (0,5):
                    paired={}
                    for mode in ('separate','shared'):
                        options=ReplayOptions(period,delay,mode,.4,offset)
                        replay=Replay(records,case['train_ids'],case['query_ids'],options)
                        replay.advance(len(replay.queries))
                        tags={'fold':case['fold'],'period':period,'offset':offset,'delay':delay,'mode':mode,
                              'canonical':offset==period-1}
                        rows=pd.DataFrame(replay.rows)
                        # Independent vector formulation: released selected references,
                        # sorted by arrival, geometrically weighted from newest to oldest.
                        lib=x[x.sample_id.isin(set(case['train_ids'])|set(case['query_ids']))].copy()
                        lib['release']=lib.release5 if delay else lib.end
                        lib=lib[(lib.ordinal%period==offset)&lib.release.notna()].sort_values(['release','sample_id'])
                        for r in replay.rows:
                            prior=lib[lib.release.lt(r['start'])]
                            if mode=='separate':prior=prior[prior.recipe.eq(r['recipe'])]
                            z=prior.mrr.to_numpy()/prior.recipe.map(replay.means).to_numpy()
                            weights=np.power(.6,np.arange(len(z)-1,-1,-1,dtype=float))
                            expected=replay.means[r['recipe']]*(np.dot(z,weights)/weights.sum() if len(z) else 1.)
                            diff=abs(expected-r['prediction']);max_difference=max(max_difference,diff)
                            assert diff<1e-9
                            assert not prior.sample_id.eq(r['sample_id']).any()
                            checks+=1
                        assert set(rows.sample_id)==set(case['query_ids'])
                        predictions.extend(rows.assign(**tags).to_dict('records'))
                        for subgroup,d in [('all',rows)]+list(rows.groupby('recipe')):
                            e=d.prediction-d.truth
                            metrics.append({**tags,'subgroup':subgroup,'n':len(d),'mae':float(abs(e).mean()),
                                            'mse':float((e*e).mean()),'rmse':float(np.sqrt((e*e).mean()))})
                        status=replay.snapshot()
                        counts.append({**tags,'initial_measurements':replay.initial_measurements,
                            'requested':status['measurements_requested'],'released':status['measurements_released'],
                            'evaluation_n':len(rows)})
                        paired[mode]=status['measurements_requested'],status['measurements_released'],replay.initial_measurements
                    assert paired['separate']==paired['shared']
            print(f'Completed fold {case["fold"]}, period {period}, all offsets and delays',flush=True)
    pred=pd.DataFrame(predictions);met=pd.DataFrame(metrics);count=pd.DataFrame(counts)
    pred.to_csv(RUN/'predictions.csv.gz',index=False,compression={'method':'gzip','mtime':0})
    met.to_csv(RUN/'metrics.csv',index=False);count.to_csv(RUN/'measurement_counts.csv',index=False)
    # Equal-weight average over offsets, then folds; every phase has the same queries.
    mean=met[met.subgroup.eq('all')].groupby(['period','delay','mode']).mae.mean().unstack()
    mean['shared_error_change_pct']=100*(mean.shared/mean.separate-1)
    mean.reset_index().to_csv(RUN/'summary.csv',index=False)
    canonical=met[met.subgroup.eq('all')&met.canonical].groupby(['period','delay','mode']).mae.mean().unstack()
    canonical.reset_index().to_csv(RUN/'canonical_summary.csv',index=False)
    phase=met[met.subgroup.eq('all')].groupby(['period','delay','offset','mode']).mae.mean().unstack()
    phase['shared_change']=phase.shared-phase.separate
    phase.reset_index().to_csv(RUN/'phase_sensitivity.csv',index=False)
    fold=met[met.subgroup.eq('all')].groupby(['fold','period','delay','mode']).mae.mean().unstack()
    fold['shared_change']=fold.shared-fold.separate
    fold.reset_index().to_csv(RUN/'fold_sensitivity.csv',index=False)
    def md(d):
        return '| '+' | '.join(d.columns)+' |\n| '+' | '.join(['---']*len(d.columns))+' |\n'+\
            '\n'.join('| '+' | '.join(f'{v:.4f}' if isinstance(v,float) else str(v) for v in row)+' |' for row in d.itertuples(index=False,name=None))
    text=f'''# 측정 주기 1/5/10장과 A/B 공유 추적 비교

2026-09-29. 같은 시간순 학습/평가 목록, 같은 측정 예산과 공개 시점에서 별도 EWMA와 정규화 공유 EWMA를 비교했습니다. alpha=0.4 고정이며 별도 모델의 학습 가중치를 추가 튜닝하지 않았습니다. A123은 다른 테이블이므로 제외했습니다.

## 모든 측정 시작 위치를 평균한 결과

주기별 offset 전체와 네 평가 fold의 MAE 평균입니다. 낮을수록 좋습니다. `shared_error_change_pct`가 음수이면 공유 추적의 오차가 낮습니다. delay=0/5는 **측정 주기와 별개의 공개 지연**이며, 5는 같은 테이블에서 기록된 후속 공정 다섯 개의 완료를 뜻합니다.

{md(mean.reset_index())}

## Unity 기본 시작 위치의 결과

UI는 매 n번째 공정을 측정합니다(offset=n-1). 위 평균과 다른 숫자가 나올 수 있으므로 별도로 표시합니다. 특정 offset의 결과만 골라 대표 성능으로 발표하지 않습니다.

{md(canonical.reset_index())}

## 비교 조건과 해석

- 주기는 A/B 합친 테이블의 기록된 공정 순서에 적용합니다. 두 방식의 측정 횟수가 같습니다. 학습 이력도 같은 주기로 줄였습니다.
- 정규화는 해당 학습 목록에서 측정되어 평가 시작 전에 공개된 레시피별 평균입니다. 공유 추적은 MRR/레시피 평균을 추적한 뒤 현재 레시피의 평균을 곱합니다. 서로 다른 MRR 수준을 그대로 섞지 않습니다.
- 측정 시점이 예측 시작보다 엄격히 이전인 값만 상태에 들어갑니다. 같은 웨이퍼의 앞선 A 측정이 이미 공개됐으면 이후 B 예측에서 사용할 수 있습니다.
- 전체 평가 1,286개 기록에 대해 계산한 사후 MAE입니다. 측정하지 않는 행의 과거 정답도 **평가에만** 쓰고, 상태 갱신에는 쓰지 않습니다. 실시간 화면은 공개 측정 오차와 전체 사후 오차를 구분합니다.
- 같은 데이터에서 이전 실험을 여러 번 확인한 후속 개발 결과입니다. 새로운 독립 Test의 성능이나 일반적인 공유 추적 우월성을 뜻하지 않습니다. [시작 위치별](phase_sensitivity.csv), [fold별](fold_sensitivity.csv), [측정 횟수](measurement_counts.csv)를 함께 확인해야 합니다.
- 문서에 적힌 MAE 2.63 모델의 kp_model.py/fit_kp.py는 여전히 없어 이 표에 넣지 않았습니다. 기존 RF 모델 교체나 압력/소모품의 인과 효과를 주장하지 않습니다.

## 확인

- 예측 {len(pred):,}개를 별도 벡터 계산으로 다시 확인했습니다. 최대 차이 {max_difference:.3g}, 미래 또는 자기 자신의 측정 참조 위반 0건입니다.
- 같은 공정 예산에서 두 방식의 요청/공개/초기 측정 수가 일치합니다. [고정 계획](PROTOCOL.md), [행별 예측](predictions.csv.gz), [전체 지표](metrics.csv).
- Unity/API 구현 및 실행 검증은 별도 [교육 데모 보고서](../measurement_demo_v1/README.md)에 기록합니다.
'''
    (RUN/'README.md').write_text(text,encoding='utf-8')
    write(RUN/'verification.json',{'status':'passed','independent_predictions_checked':checks,
        'max_difference':max_difference,'noncausal_or_self_references':bad_refs,
        'same_measurement_budget':True,'queries_per_configuration':1286,
        'configuration_runs':len(count),'missing_kp_model':True})
    write(RUN/'completion.json',{'status':'completed','hashes':{p.relative_to(RUN).as_posix():sha(p) for p in RUN.rglob('*') if p.is_file()}})
    print(mean.to_string());print('Canonical:',canonical.to_string())


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);main(p.parse_args().archive)
