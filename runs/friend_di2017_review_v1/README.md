# 친구 Di et al. (2017) baseline 평가 검토

2026-10-03. 사용자가 공유한 GitHub baseline의 저장 예측과 코드, 이슈를 검토한 결과입니다. **성능 지표의 재계산은 일치했습니다.** 최종 `history_first` 결과에서는 통합 모델이 가장 좋고 KNN이 가장 나빴습니다. 이번 작업은 저장된 예측 재계산과 코드 검토이며 모델 재학습·새 시간순 평가를 수행한 결과는 아닙니다.

## 확인한 버전과 이슈

- 저장소: [ChungA1010/SolvingProblem](https://github.com/ChungA1010/SolvingProblem).
- baseline 브랜치: `baseline/1-di2017-final`; 태그: `baseline-v1`.
- 검토한 커밋: [`8888c82bc4c3ad3ae88f12585ac61957496d3d92`](https://github.com/ChungA1010/SolvingProblem/commit/8888c82bc4c3ad3ae88f12585ac61957496d3d92). 아래 코드 링크는 이 커밋으로 고정했습니다.
- [이슈 #1: Di2017 baseline 확정](https://github.com/ChungA1010/SolvingProblem/issues/1)은 검토 시점에 닫혀 있었습니다.
- [이슈 #2: 신규 MRR 모델 개발 및 baseline 비교](https://github.com/ChungA1010/SolvingProblem/issues/2)는 열려 있었고, 무작위 분할 금지·미래 정보 금지·연마 시간 입력 금지·시간순 동일 조건 평가를 명시했습니다.
- `feat/2-mrr-model`도 검토 시점에는 같은 커밋이었습니다. 새로운 후보 모델의 평가 결과는 아직 없었습니다.

## 성능 재계산

원본 전처리 패키지 1,977행 중 baseline에 포함된 것은 1,974행입니다. 조건별로 20회 무작위 80/20 분할을 사용합니다. 한 회 평가 표본은 Cond1 159개, Cond2 163개, Cond3 73개로 총 395개입니다. 두 이력 방식에서 각각 7,900행, 합계 15,800행의 저장 예측을 확인했습니다. 반복 분할이므로 이 숫자는 서로 다른 웨이퍼 개수가 아닙니다.

아래는 최종 `history_first` 조건입니다. 낮을수록 좋습니다. MSE와 MAE는 각 반복에서 평가 표본을 합쳐 계산한 뒤 20회 평균했습니다. pooled RMSE는 그 평균 MSE의 제곱근이며 반복별 RMSE 평균과 구분합니다.

| 모델 | 재계산 MAE | 재계산 MSE | pooled RMSE |
|---|---:|---:|---:|
| Integrated | **2.2899** | **9.0553** | **3.0092** |
| Tree Bagging | 2.3653 | 9.5794 | 3.0951 |
| SVR | 2.5703 | 11.3602 | 3.3705 |
| Linear Regression | 2.5048 | 13.7408 | 3.7069 |
| Persistent | 2.8365 | 13.9912 | 3.7405 |
| KNN | **3.7280** | **22.6307** | **4.7572** |

MAE와 MSE의 중간 순위는 다릅니다. 선형회귀는 SVR보다 MAE가 낮지만 MSE가 높습니다. 최고·최저는 두 지표 모두 통합 모델·KNN입니다. 전체 조건/이력 방식의 [성능 CSV](performance_comparison.csv), [720개 지표 재계산 CSV](metrics_recomputed.csv), [검증 정보](verification.json)를 제공합니다.

모델 6종 × 조건 3개 × 반복 20회 × 이력 방식 2개 = **720개 MSE**를 다시 계산했고 최대 차이는 **1.78×10⁻¹⁴ 이하**였습니다. 저장된 평가 ID도 분할 재구성과 일치합니다. `persistent_strict_valid`는 별도 유효 표본 진단이므로 6종 모델 비교에 포함하지 않았습니다.

원문 발표값은 친구 보고서의 [final_summary_vs_paper.csv](https://github.com/ChungA1010/SolvingProblem/blob/8888c82bc4c3ad3ae88f12585ac61957496d3d92/results/di2017_final_audit/final_summary_vs_paper.csv)를 참조합니다. 해당 보고서에 적힌 통합 모델의 논문 MSE는 6.18, 재현은 9.0553으로 46.53% 높습니다. CSV의 `source_report_paper_mse`는 그 보고서에서 옮긴 값이며 이번 검토에서 논문 원문을 다시 검증한 값은 아닙니다.

## 동일 조건 비교 전에 보완할 사항

### 1. 시간순 평가가 필요합니다

[최종 audit의 분할 코드](https://github.com/ChungA1010/SolvingProblem/blob/8888c82bc4c3ad3ae88f12585ac61957496d3d92/src/models/di2017_final_audit.py#L243)는 timestamp로 정렬한 후 `choice`로 평가 행을 무작위 선택합니다. 60개 조건별 분할을 재구성한 결과 모두 학습의 마지막 시작 시점이 평가의 첫 시작 시점보다 뒤였습니다. timestamp 정렬과 chronology 검사는 시간순 학습/평가 분할을 보장하지 않습니다. [분할 진단](split_diagnostics.csv).

A/B 등 같은 wafer ID가 학습과 평가에 함께 들어간 개수는 반복별 **77~101개**였습니다. 이는 이 무작위 분할이 웨이퍼 그룹 분할도 아님을 보여 줍니다. 공개된 앞선 A 측정으로 이후 B를 예측하는 합법적인 온라인 참조와는 구별해야 합니다. 새 시간순 실험에서는 웨이퍼 경계와 측정 완료·공개 시점을 명시해 판단해야 합니다. [웨이퍼 중복 진단](wafer_overlap.csv).

무작위 Monte Carlo CV는 친구 보고서가 선택한 논문 재현 조건입니다. 이 결과를 이슈 #2의 시간순 성능으로 표시하거나 우리의 시간순 MAE 2.9644와 직접 비교해 우열을 판단할 수는 없습니다. 기존 논문용 baseline을 보존하고 새 비교에서 두 모델에 같은 학습/평가 ID와 공개 조건을 적용해야 합니다.

### 2. 통합 가중치의 선정과 재사용을 맞춰야 합니다

[audit 코드](https://github.com/ChungA1010/SolvingProblem/blob/8888c82bc4c3ad3ae88f12585ac61957496d3d92/src/models/di2017_final_audit.py#L307)는 20회 CV의 평가 MSE로 `mean + 3*std`의 역세제곱 가중치를 만든 뒤 동일한 20회 예측의 통합 성능을 계산합니다. 가중치 선정용 자료와 최종 평가 자료가 겹칩니다. 새 모델 비교에서는 바깥 평가를 사용하지 않고 학습 구간 내부 검증으로 가중치를 정해야 합니다.

[재사용 함수](https://github.com/ChungA1010/SolvingProblem/blob/8888c82bc4c3ad3ae88f12585ac61957496d3d92/src/models/di2017_baseline.py#L75)는 가중치를 생략하면 다섯 모델을 동일 가중치로 결합합니다. 따라서 함수 기본 호출만으로 보고서의 통합 설정이 재현되지는 않습니다. 선택 특징·가중치·이력 정의를 함께 저장하고 명시적으로 전달해야 합니다.

참고로 **기존에 저장된 다섯 예측을 동일 가중치로 평균한 진단 MSE는 9.6716**입니다. 이는 가중치 차이가 결과에 영향을 주는 예시이며 재사용 함수를 새로 적합해 얻은 성능은 아닙니다.

### 3. 현재 검증 스크립트는 Di baseline을 검증하지 않습니다

[scripts/verify_reproduction.py](https://github.com/ChungA1010/SolvingProblem/blob/8888c82bc4c3ad3ae88f12585ac61957496d3d92/scripts/verify_reproduction.py)는 SARC/RL 관련 JSON을 검사합니다. 검토한 baseline 파일만 있는 상태에서 실제 실행하면 **0 PASS / 0 FAIL / 8 SKIP**인데도 `ALL CHECKS PASS`를 출력합니다. [실제 출력](source_verifier_output.txt).

이번 검토의 720개 지표 재계산과 이 스크립트의 출력은 서로 다른 검사입니다. 전용 검증에서 필수 파일 누락을 실패로 처리하고, 예측·지표·분할·소스 버전을 검사하는 종료 코드를 제공해야 합니다.

### 4. 예측 시점과 입력을 명시해야 합니다

최종 특징 선택 감사에는 `g1_polishing_time`, `g2_polishing_time`이 포함되어 있고 실제 일부 반복에서 선택됩니다. 논문 baseline의 특징과 이슈 #2의 연마 시간 입력 금지 조건이 다릅니다. 공정 시작 전에 예측하려면 현재 공정의 완료 후 통계도 어떤 값이 그 시점에 이용 가능한지 확인해야 합니다.

따라서 논문 재현용 결과는 유지하면서, 교육 시뮬레이터의 예측 시점에 맞춘 입력 목록과 baseline 변형을 명확히 정의해야 합니다. 신규 모델에만 입력 제한을 적용해 서로 다른 정보량을 비교하지 않아야 합니다.

## 다음 비교 작업

1. 같은 시간순 학습/평가 목록과 웨이퍼 경계를 고정합니다.
2. 공정 시작/측정 완료/결과 공개 시점을 기준으로 두 모델의 가용 입력과 이력을 맞춥니다.
3. 특징 선택·전처리·통합 가중치는 학습 내부 검증에서만 결정합니다.
4. 같은 평가 표본에서 MAE·MSE·RMSE, Stage/조건별 지표를 산출합니다.
5. 측정 주기 1/5/10과 공개 지연을 같은 조건으로 비교한 뒤 Unity 모델 선정 근거를 보완합니다.

`kp_model.py`, `fit_kp.py`는 검토한 브랜치에 없어 문서의 MAE 2.63 모델은 여전히 미비교입니다. 이번 결과는 기존 서비스 모델 교체 근거나 세 논문의 완전한 수치 재현을 뜻하지 않습니다.

## 재계산 실행

아래는 저장 예측을 다시 계산하는 명령입니다. pandas/numpy가 준비된 기존 환경을 사용합니다. 검토한 소스 10개는 고정 커밋의 Git blob과 SHA-256이 일치하는지 확인했습니다. [원본 해시](source_manifest.json).

```powershell
# 현재 feat/cmp-virtual-lab 저장소 루트에서 실행
git clone --branch baseline-v1 --single-branch https://github.com/ChungA1010/SolvingProblem.git .cache/di2017-baseline-v1
git -C .cache/di2017-baseline-v1 rev-parse HEAD
# 위 출력은 8888c82bc4c3ad3ae88f12585ac61957496d3d92여야 합니다.
python tools/review_di2017_baseline.py --source-dir .cache/di2017-baseline-v1 --output-dir .cache/di2017-review-recheck
```

스크립트는 원본 파일 해시가 달라지거나 기존 출력 폴더가 있으면 중단합니다. [실행 코드](../../tools/review_di2017_baseline.py), [검토 산출물 해시](completion.json).
