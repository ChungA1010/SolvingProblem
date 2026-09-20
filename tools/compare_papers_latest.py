"""Read-only comparison of published tables and frozen v3/v4 predictions."""
from pathlib import Path
import numpy as np
import pandas as pd
from cmp_ml.common import read_json,write_json,sha256,utcnow,TARGET
from cmp_ml.reconstruction import read_frame

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runs/phm_cmp_paper_comparison_v4'
if RUN.exists():raise FileExistsError('Comparison is immutable; use another output directory')
RUN.mkdir(parents=True)
source_path=ROOT/'runs/phm_cmp_final_comparison/paper_sources.json'
sources=read_json(source_path)
papers=pd.DataFrame(sources['original_table_values'])
v3=ROOT/'runs/phm_cmp_completion_v3'
metrics=read_frame(v3/'metrics.csv')
pred=read_frame(v3/'predictions.csv.gz')
previous=pd.read_csv(ROOT/'runs/phm_cmp_final_comparison/paper_metric_comparison.csv')
latest=read_frame(ROOT/'runs/phm_cmp_staged_v4/reference_scored_predictions.csv.gz')
rows,verified=[],0


def score(paper,arm,model,stage,metric):
    global verified
    subgroup='all' if stage=='all' else f'STAGE={stage}'
    r=metrics[(metrics.paper==paper)&(metrics.arm==arm)&(metrics.model==model)&
              metrics.cohort.eq('test')&metrics.subgroup.eq(subgroup)]
    assert len(r)==1
    q=pred[(pred.paper==paper)&(pred.arm==arm)&(pred.model==model)&pred.cohort.eq('test')]
    if stage!='all':q=q[q.STAGE.eq(stage)]
    assert len(q)==int(r.n.iloc[0])
    error=q.prediction.to_numpy()-q[TARGET].to_numpy()
    derived={'mse':np.mean(error**2),'rmse':np.sqrt(np.mean(error**2)),
             'r2':1-np.sum(error**2)/np.sum((q[TARGET]-q[TARGET].mean())**2),
             'relative_error':np.mean(abs(error)/abs(q[TARGET]))}
    value=float(r[metric].iloc[0])
    if metric in derived:
        np.testing.assert_allclose(value,derived[metric],rtol=1e-10,atol=1e-10);verified+=1
    return value,len(q)


for r in papers[papers.split.eq('test')].itertuples(index=False):
    arm='selected' if r.paper=='P1' else 'clean_ordinary' if r.paper=='P2' else 'legacy_clean_1977'
    implemented=r.model not in ('P2_DBN','P3_Ensemble_NN')
    metric='s_score_literal_mean' if r.metric=='s_score' else r.metric
    ours,n=score(r.paper.lower(),arm,r.model,r.stage,metric) if implemented else (None,None)
    old=previous[(previous.paper==r.paper)&previous.split.eq('test')&(previous.stage==r.stage)&
                 (previous.model==r.model)&(previous.metric==r.metric)]
    assert len(old)==1
    comparable_formula=r.metric!='s_score'
    rows.append({'paper':r.paper,'table':r.table,'pdf_page':r.pdf_page,'model':r.model,'stage':r.stage,
        'metric':r.metric,'paper_value':r.paper_value,'previous_v2':None if not implemented else float(old.stored_seed0.iloc[0]),
        'current_reproduction':ours,'test_n':n,'run':'phm_cmp_completion_v3','arm':arm,
        'relative_error_change_pct':None if ours is None or r.metric not in ('rmse','mse','relative_error') else 100*(ours/r.paper_value-1),
        'comparability':'formula_table_ambiguity' if not comparable_formula else 'partial_reproduction' if implemented else 'no_standalone_test_result',
        'status':'DBN not implemented' if r.model=='P2_DBN' else
                 'NN implemented as GA candidate; no standalone official Test reproduction' if r.model=='P3_Ensemble_NN' else 'evaluated'})
comparison=pd.DataFrame(rows)
comparison.to_csv(RUN/'paper_model_comparison.csv',index=False)

p1=comparison.query("paper == 'P1' and metric == 'rmse'")[['stage','model','paper_value','previous_v2','current_reproduction','relative_error_change_pct']]
p2=comparison.query("paper == 'P2'")[['model','paper_value','current_reproduction','relative_error_change_pct','status']]
p3=[]
for arm in ('legacy_clean_1977','ga_clean_1977'):
    for model,published in [('P3_RF',7.6),('P3_RF_CPP',7.4)]:
        target=model if arm.startswith('legacy') else model.replace('RF','GA')
        ours,n=score('p3',arm,target,'all','mse')
        p3.append({'model':model,'arm':arm,'paper_mse':published,'our_mse':ours,'relative_change_pct':100*(ours/published-1)})
p3=pd.DataFrame(p3);p3.to_csv(RUN/'p3_fixed_and_ga.csv',index=False)

# Extra comparators actually printed in P1 Tables 12/13. Other-family implementations
# elsewhere in the repo are not substitutes for these particular paper models.
missing=[]
for model,table,a,b in [('Preston equation',12,42.3,16.6),('Luo-Dornfeld',12,7.6,None),
    ('LR-stacking',13,5.863,4.794),('BLR-stacking',13,6.521,4.667),
    ('AdaBoost-stacking',13,5.367,4.548),('SVR-stacking',13,5.209,4.579)]:
    missing.append({'paper':'P1','table':table,'model':model,'paper_test_rmse_A':a,'paper_test_rmse_B':b,
                    'our_paper_matched_test_result':'not available'})
missing=pd.DataFrame(missing);missing.to_csv(RUN/'additional_paper_comparators.csv',index=False)

names=['full125_rf','full125_bag','primary73_rf','primary73_bag','compact12_rf','compact12_bag','compact33_rf','compact33_bag','S4_final']
v4=[]
for name in names:
    q=latest[latest.partition.eq('test')&latest.cohort_variant.eq('clean')&latest.model.eq(name)]
    assert len(q)==424 and q.sample_id.nunique()==424
    row={'model':name,'test_n':len(q)}
    for stage,b in [('all',q)]+list(q.groupby('STAGE')):
        row[f'{stage}_mse']=float(np.mean((b.prediction-b.truth)**2))
        row[f'{stage}_rmse']=float(np.sqrt(row[f'{stage}_mse']))
    v4.append(row)
v4=pd.DataFrame(v4);v4.to_csv(RUN/'v4_test_metrics.csv',index=False)
ref=[]
benchmarks=[('P1','RF Stage A',5.395,'A_rmse'),('P1','RF Stage B',4.598,'B_rmse'),
            ('P1','ELM Stage A',4.795,'A_rmse'),('P1','ELM Stage B',4.485,'B_rmse'),
            ('P2','Bagging',7.22,'all_mse'),('P2','Integrated',7.07,'all_mse'),
            ('P3','RF',7.6,'all_mse'),('P3','RF+CPP',7.4,'all_mse')]
for row in v4.to_dict('records'):
    for paper,model,published,metric in benchmarks:
        ref.append({'v4_model':row['model'],'paper':paper,'paper_benchmark':model,'metric':metric,
                    'paper_value':published,'v4_value':row[metric],
                    'numerical_change_pct':100*(row[metric]/published-1),
                    'interpretation':'descriptive only; different inputs, training cohort, history policy, algorithms and seed aggregation'})
pd.DataFrame(ref).to_csv(RUN/'v4_vs_paper_reference_only.csv',index=False)

pdfs=[]
for s in sources['sources']:
    path=Path('C:/Users/a4991/OneDrive/바탕 화면')/s['pdf_name']
    assert sha256(path)==s['pdf_sha256']
    pdfs.append({'paper':s['paper'],'file':s['pdf_name'],'sha256':s['pdf_sha256'],'table_pages':[11,13] if s['paper']=='P1' else [s['pdf_page']]})


def table(f):
    def fmt(x):
        if x is None or (isinstance(x,(float,np.floating)) and np.isnan(x)):return '—'
        return f'{x:.4f}' if isinstance(x,(float,np.floating)) else str(x)
    return '| '+' | '.join(f.columns)+' |\n| '+' | '.join(['---']*len(f.columns))+' |\n'+\
        '\n'.join('| '+' | '.join(fmt(v) for v in row)+' |' for row in f.itertuples(index=False,name=None))

latest_row=v4[v4.model=='S4_final'].iloc[0]
text=f'''# 세 논문 모델별 발표 성능과 현재 구현 비교

2026-09-20 기준 저장된 결과를 비교했습니다. 새 학습이나 Test 기반 모델 재선택은 하지 않았습니다. 논문 1은 **Stage별 Test RMSE**, 논문 2·3은 **전체 Test MSE**입니다. 모두 낮을수록 좋습니다. 변화율 = `(우리 값 / 논문 값 - 1) × 100`이며 양수는 오차 증가, 음수는 감소입니다. 이는 정확도나 MAPE 자체가 아닙니다.

핵심: **논문 1은 Stage B에서 5개 중 4개 모델의 RMSE가 발표값보다 낮지만 Stage A는 모두 높습니다. 논문 2 통합 모델은 7.07 대 7.0743으로 수치가 매우 가깝습니다. 논문 3은 보정 RF와 GA 보완 후보 모두 발표 MSE 7.4에 도달하지 못했습니다.** 이는 수치 비교이며 완전 재현이나 우월성의 입증은 아닙니다.

## 논문 1: Li, Wu, Yu (2019), Tables 7/8

현재 재현 값은 completion v3에서 선택한 특징으로 학습한 저장 모델(seed 20260917)의 Test 결과입니다. 논문은 20회 반복 실험을 설명하지만, 여기의 우리 값은 20회 Test 평균이 아닙니다. v3의 20회 반복 표는 Validation 결과이므로 Test 표에 혼합하지 않았습니다. v2의 고정 Appendix35 결과도 표시해 재현 단계가 바뀐 것을 확인할 수 있게 했습니다.

{table(p1)}

GBT=Gradient Boosted Trees, RF=Random Forest, ERT=Extremely Randomized Trees입니다. CART/ELM은 세 기본 모델을 결합하는 stacking입니다. Stage B의 GBT 4.2400이 이 다섯 구현 중 가장 낮고, Stage A는 CART stacking 7.5422가 가장 낮습니다. 논문에서는 두 Stage 모두 ELM stacking이 가장 낮았습니다. 관측한 Test 순위이며 새로운 모델 선택 규칙으로 사용하지 않았습니다.

P1의 R²·RE와 S-score 원값도 [전체 비교 CSV](paper_model_comparison.csv)에 보존했습니다. S-score는 원문의 식과 표 수치 해석에 불일치가 있어 상대 변화율이나 우월 순위를 계산하지 않았습니다. RMSE에서 낮다고 모든 지표에서도 우수하다는 뜻은 아닙니다.

## 논문 2: Di, Jia, Lee (2017), Table 5

MSE 비교입니다. 현재 값은 동일한 1,977개 학습 표본의 `clean_ordinary` 대조군입니다. 추가 OLS 절단을 제거한 일반 LR이며, 통합 수치는 기존 `clean_stable`과 사실상 같습니다. 기존 이력 해석에는 query보다 늦은 Train 이웃도 허용되므로 온라인 완료 이력 모델과 동일한 조건이 아닙니다.

{table(p2)}

통합 MSE는 발표값보다 약 0.061% 높아 반올림하면 거의 같고, Bagging은 약 0.690% 낮습니다. 반면 LR은 약 47.97배의 MSE로 가장 큰 재현 격차를 보입니다. LR의 통합 가중치가 매우 작을 수 있어 통합 결과가 가깝다는 사실만으로 구성 모델 모두를 재현했다고 말할 수 없습니다. DBN은 독립 baseline으로 구현하지 않았습니다.

## 논문 3: Li et al. (2018), Table II의 Real test

논문 표는 RMSE가 아니라 **MSE**입니다. 같은 1,977행의 고정 특징 재현과 GA 보완 실험을 모두 표시합니다. GA clean 후보의 rough/fine 최종 선택은 모두 RF지만, 원문과 같은 특징·파라미터·탐색 결과라고 주장하지 않습니다.

{table(p3)}

논문의 Ensemble Neural Network는 Test MSE **8.2**입니다. v3에 NN 탐색 후보 구현은 있으나 이 모델만을 원문 조건으로 별도 학습해 공식 Test를 평가한 값은 없습니다. GA 내부 CV 점수를 8.2와 비교하거나 다른 선택 모델의 점수로 대체하지 않았습니다.

## 아직 별도 재현 성능이 없는 논문 1 비교 모델

원문 Tables 12/13에는 아래 비교 모델도 실려 있습니다. 다른 논문의 LR/SVR이나 프로젝트의 Preston-inspired proxy가 존재한다는 이유로 이 표의 특정 모델을 재현했다고 간주하지 않습니다. Luo-Dornfeld Stage B는 원문에서 NA입니다.

{table(missing)}

## 이번 staged v4 모델들은 논문 수치와 어느 정도 다른가

아래는 이번 순차 개선 실험의 **다른 모델들**입니다. 논문 재현 모델의 업데이트 값으로 덮어쓰지 않습니다. 전체 Test 424건, Stage A 238건, B 186건에서 저장된 예측을 다시 집계했습니다. 125/73/33에는 이력이 포함되고 12에는 이력이 없으며, 모두 평가 시 이용하는 이력은 완료된 과거 Train 표본으로 제한됩니다. S4는 공정 조건별로 선택된 설정이며 3개 seed 예측의 평균입니다.

{table(v4[['model','all_mse','all_rmse','A_rmse','B_rmse']])}

S4 최종의 전체 Test MSE는 **{latest_row.all_mse:.4f}**로 논문 2 통합 7.07 및 논문 3 보정 RF 7.4보다 수치상 큽니다. Stage별 RMSE는 **A {latest_row.A_rmse:.4f}, B {latest_row.B_rmse:.4f}**로 논문 1 ELM의 4.795/4.485보다 수치상 작습니다. 그러나 특징, 학습 표본 정제, 조건별 라우팅, 이력, 모델 구조, seed 집계가 달라 **어느 논문을 완전히 재현하거나 이겼다는 결론은 내리지 않습니다**. 모든 새 후보와 각 발표 benchmark의 참고용 수치 차이는 [별도 CSV](v4_vs_paper_reference_only.csv)에 있습니다.

기존 완료 이력 robust v2 대비 S4는 그룹 RMSE 6.57% 감소, 시간순 21.34% 증가, 기존 Test 17.29% 증가였습니다. 따라서 staged v4를 채택하지 않았으며 기존 모델을 유지합니다. [순차 실험 원 보고서](../phm_cmp_staged_v4/README.md).

## 비교의 한계와 확인 범위

- 원문의 미기재 설정, P1 FFT/중요도 관례, P2 이력 처리, P3 전체 후보·GA·phase/CPP 정의에 가정이 남아 있습니다.
- P3 원문의 총 2,929 runs와 현재 공식 데이터 2,829개 wafer-stage 표본 집계도 일치하지 않습니다. 발표 수치와 소수점까지 같은 결과를 보장하는 재현은 아닙니다.
- 공식 Test는 이전 실험에서도 확인했습니다. 비교를 위해 새로 학습하거나 최저 Test 모델을 다시 선정하지 않았습니다.
- 제공 PDF 세 파일의 SHA-256을 기존 원문 기록과 대조하고, P1 Tables 7/8/12/13, P2 Table 5, P3 Table II의 해당 페이지 전체를 시각적으로 확인했습니다.
- 논문 재현 비교의 {verified}개 MSE/RMSE/R²/RE 값을 원시 예측에서 재계산했습니다. v4 표도 행별 예측으로 계산했고, 원래 metrics와 일치하는지 확인했습니다.

원문: [P1](https://doi.org/10.1115/1.4042051), [P2](https://papers.phmsociety.org/index.php/ijphm/article/view/2641), [P3](https://www.atlantis-press.com/proceedings/iceea-18/25894228). 제공 PDF 원본은 재배포하지 않습니다.
'''
(RUN/'README.md').write_text(text,encoding='utf-8')
inputs=[source_path,v3/'metrics.csv',v3/'predictions.csv.gz',v3/'p1_paper_comparison.csv',
        ROOT/'runs/phm_cmp_final_comparison/paper_metric_comparison.csv',
        ROOT/'runs/phm_cmp_staged_v4/reference_scored_predictions.csv.gz',
        ROOT/'runs/phm_cmp_staged_v4/metrics.csv']
stored=read_frame(ROOT/'runs/phm_cmp_staged_v4/metrics.csv')
for r in v4.itertuples(index=False):
    m=stored[stored.cohort_variant.eq('clean')&stored.evaluation.eq('test')&stored.condition.eq('all')&stored.model.eq(r.model)]
    assert len(m)==1
    np.testing.assert_allclose([r.all_mse,r.all_rmse],m[['mse','rmse']].iloc[0],rtol=1e-12)
write_json(RUN/'verification.json',{'verified_at':utcnow(),'status':'passed','no_new_training':True,
    'recomputed_paper_metric_values':verified,'v4_models_recomputed':len(v4),'v4_test_rows_per_model':424,
    'source_pdfs':pdfs,'input_hashes':{p.relative_to(ROOT).as_posix():sha256(p) for p in inputs},
    'outputs':{p.name:sha256(p) for p in RUN.iterdir() if p.is_file()},'builder_sha256':sha256(Path(__file__))})
print(p1.to_string(index=False));print(p2.to_string(index=False));print(p3.to_string(index=False))
print('Verified',verified,'paper metrics and',len(v4),'v4 models; no training performed')
