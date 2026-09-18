# 논문 조건 차이 검증 v2 — 실행 전 프로토콜

이 실험은 사용자 요청에 따라 세 CMP 논문의 원래 조건에 더 가까운 해석과 기존 구현의 차이를 검증한다. 공개된 저자 코드·완전한 설정을 확보한 재현이 아니다. **원문 근거가 있는 수정, 미기재 조건의 가정, 수치 안정성을 위한 보완을 구분**한다. 낮은 Test 오차를 얻을 때까지 반복해서 설정을 바꾸지 않는다.

## 출처 재검토

- P1 Li, Wu, Yu (2019): [저자 공개 원문](https://mae.ucf.edu/dazhongwu/wp-content/uploads/2019/06/Prediction-of-Material-Removal-Rate-for-Chemical-Mechanical-Planarization-Using-Decision-Tree-Based-Ensemble-Learning.pdf). p.2는 base learner의 k-fold CV를 설명하고 p.4 Table 2는 학습 데이터 예측을 meta 입력으로 사용하는 의사코드를 제시한다. p.5의 네 이상치 제외, p.13 Appendix 35개 특징·100 trees는 유지한다.
- P2 Di, Jia, Lee (2017): [원문](https://papers.phmsociety.org/index.php/ijphm/article/view/2641). pp.3–4는 Euclidean 사용량 이웃·최근 MRR lag·무작위 Monte Carlo CV·오차 가중식을 설명한다. 사용량 정규화, metrology 지연, 네 이상치 제거, OLS 수치 허용오차는 명시하지 않는다.
- P3 Li et al. (2018): [원문](https://www.atlantis-press.com/proceedings/iceea-18/25894228). p.3 Figure III의 압력 범례는 CENTER_AIR_BAG_PRESSURE이며 주 연마는 압력/슬러리가 안정한 구간, 종료 구간은 slurry A 증가로 구별한다. CPP는 간격 500 초과로 구분되고 같은 CPP는 일관된 설정을 갖는다고 설명한다. Table III의 최종 11/6개 특징을 유지한다.
- 2026-09-18에 출판사/저자 페이지와 공개 코드 검색을 확인했지만 이번 검색에서 사용할 수 있는 저자 구현을 확보하지 못했다. 논문만으로 미기재 설정을 사실로 확정하지 않는다.

## 데이터·선정·평가

- 이번 목적은 원논문 비교이므로 **official 분할만** 사용한다. Train=1,981, Validation=424, Test=424. 기존 source 파일 SHA-256을 검사한다. v1의 그룹 분할·서비스 모델은 수정하지 않는다.
- P1은 명시된 Stage A 이상치 4건을 제외한다. P2/P3는 1,981건 전체와 같은 네 건 제외를 별도 후보로 비교한다. 제외 후보가 선택되어도 이것이 저자의 원래 정책으로 확인됐다고 표시하지 않는다.
- 모든 후보와 구현·특징 캐시 해시는 `prepare` 때 고정한다. Test 입력과 Test 정답 파일을 분리한다. `train`의 설정 선택 단계는 Train/Validation만 읽는다. 전체 선택을 저장한 뒤 Test 입력으로 예측하며 정답은 `evaluate`에서만 읽는다.
- 이미 v1에서 본 Test이며 그 결과로 가설을 세웠으므로 **새 독립 평가가 아니다**. 공개 성능 숫자를 목표 손실로 맞추거나 Test로 선택하지 않는다.
- P1 CART/ELM은 각 Stage별 Validation MSE, 동률이면 MAE와 후보 ID로 선정한다. P2는 전체 Validation Integrated MSE, P3는 전체 Validation RF_CPP MSE로 한 설정을 고른다. 기존 control도 후보에 포함한다. Test 악화도 그대로 보고한다.
- 기존과 동일한 seed 20260917. P1 선택은 seed 0에서 끝내고, 선택한 설정을 고정한 채 seed+0…19의 20회 변동성을 보고한다. 주 성능표는 seed 0이며 20회 평균이나 최선 seed로 교체하지 않는다.

## P1: 스태킹의 두 해석과 미기재 meta 설정

RF/GBT/ERT의 35개 특징과 명시된 100-tree 설정은 v1을 유지한다. 같은 Train에서 5-fold OOF 예측을 생성한다. 세 가지 모드를 비교한다.

1. `oof_refit`: OOF로 meta 학습, 전체 Train으로 재적합한 base로 예측. v1 방식.
2. `oof_fold_average`: 같은 OOF로 meta 학습, 5개 fold base의 평균으로 예측. k-fold 뒤 추론 방식의 대안이며 원문 미기재.
3. `table2_in_sample`: Table 2의 문자적 해석대로 전체 Train base의 학습 예측으로 meta를 적합. base에 대해서는 재대입 입력이며 과적합 위험이 있는 해석이다. Test/Validation 정답은 meta 학습에 쓰지 않는다.

각 모드에 CART min_samples_leaf={1,5,10}, max_depth={None,3}; ELM sigmoid hidden={10,50,100}, pseudoinverse rcond={1e-8,1e-5}를 비교한다. 총 36개 meta 후보/Stage(각 family 18개)이다. 이는 저자 설정의 복원이 아니라 미기재 설정의 제한된 Validation 선택이다. base의 test 성능을 바꾸기 위한 새로운 특징 탐색은 하지 않는다.

## P2: 순차 대조군 6개

| ID | 네 이상치 제외 | usage 거리 | lag 시점 | OLS |
|---|---|---|---|---|
| control | 예 | 표준화 | 이전 종료 | 기존 |
| all_rows | 아니오 | 표준화 | 이전 종료 | 기존 |
| raw_usage | 아니오 | 원래 값의 Euclidean | 이전 종료 | 기존 |
| prior_start | 아니오 | 원래 값의 Euclidean | 이전 시작 | 기존 |
| stable_ols | 아니오 | 원래 값의 Euclidean | 이전 시작 | SVD 절단 rcond=1e-6 |
| stable_ols_clean | 예 | 원래 값의 Euclidean | 이전 시작 | SVD 절단 rcond=1e-6 |

첫 다섯 행은 한 항목씩 바꾸는 누적 대조이며 마지막 두 행으로 동일 구성에서 이상치 효과를 비교한다. lag/neighbor는 각 학습 fold의 라이브러리만 사용하고 동일 wafer는 제외한다. `prior_start`는 metrology 가용 시점이 불명확한 사후 분석 대안이다. 아직 끝나지 않은 run의 정답을 실시간으로 얻을 수 있다고 주장하지 않는다. 이웃의 모든 시각을 과거로 제한하지 않는 기존 조건도 유지한다.

세 조건별 20회 Monte Carlo CV, v1의 feature voting·SVR·bagged trees·가중식은 고정한다. OLS 절단은 선형 종속/거의 종속된 특징으로 생기는 수치 불안정성을 다루는 보완이다. 특히 작은 singular value를 제거한 회귀이므로 원문 OLS의 정확한 해와 같은 것으로 표시하지 않는다. SVD 절단 기준은 Validation을 보기 전에 고정한다.

## P3: 연마 구간·CPP·RF 대조군 7개

| ID | 네 이상치 제외 | phase | CPP | RF |
|---|---|---|---|---|
| control | 예 | 기존 | machine/route, 전체 종료 간격 | 기존 |
| all_rows | 아니오 | 기존 | 기존 | 기존 |
| figure3_phase | 아니오 | Figure III 근사 | 기존 | 기존 |
| recipe_cpp_end | 아니오 | Figure III 근사 | machine/route/Stage, primary 종료 간격 | 기존 |
| recipe_cpp_start | 아니오 | Figure III 근사 | machine/route/Stage, 시작 간격 | 기존 |
| recipe_cpp_clean | 예 | Figure III 근사 | 위와 같음 | 기존 |
| random_subspace | 예 | Figure III 근사 | 위와 같음 | 500 trees, mtry=floor(p/3), min_leaf=5 |

- Figure III 근사: primary chamber에서 center pressure가 양수 90% 분위값의 90% 이상이고 slurry A가 그 후보 구간 양수 중앙값의 1.2배 이하이며 wafer 또는 stage가 회전하는 구간 중 가장 긴 연속 구간. 이 수치 임계값은 **그림에서 복원한 정확한 저자 값이 아닌 고정 가정**이다.
- phase가 2행 미만이면 primary 전체를 쓰고 fallback 횟수를 공개한다. pressure 적분은 center pressure를 사용한다. 기존 chamber pressure 적분과 실제 물리량·단위가 같다고 주장하지 않는다.
- CPP는 500을 유지하며 Stage를 recipe 구분에 추가한다. endpoint 두 해석을 비교한다. 미라벨 전체 입력 시간 문맥을 사용하므로 transductive 설정이다. 논문의 CPP 개수 1,267을 만들기 위해 경계값이나 데이터를 억지로 맞추지 않는다.
- RF 대안은 bootstrap과 무작위 특징 부분집합을 사용하는 일반적인 회귀 forest 설정이다. 원문은 tree/mtry/leaf 값을 미기재했으며 이 대안을 저자의 실제 설정으로 부르지 않는다. 모든 base RF/CPP 보정은 Train에서만 적합한다.

## 기록과 재현 범위

모든 Validation 후보, 실패·악화, 선택 근거, 선택 모델, seed별 예측, Stage별 MSE/RMSE/MAE/R²/RE 및 두 S-score 해석을 보존한다. S-score가 부동소수 범위를 넘으면 빈 값과 overflow 표시를 쓰며 값을 잘라 낮추지 않는다. 원문 수치 차이·CPP 개수 차이·미구현 GA/DBN·원문 설정 부재는 계속 명시한다.

```powershell
python -m cmp_ml.reconstruction prepare --run-dir runs/my_reconstruction --original-root /path/to/CMP1 --external-root /path/to/phm2016_external
python -m cmp_ml.reconstruction train --run-dir runs/my_reconstruction
python -m cmp_ml.reconstruction evaluate --run-dir runs/my_reconstruction
```

원본 특징·시계열은 로컬에만 둔다. 새 실행만 허용하며 코드가 고정 해시와 다르면 재개하지 않는다. 후보 모델과 P1 반복 예측의 로컬 체크포인트는 해시 검사 후 재사용한다. 선택된 모델만 공개 결과에 보존한다.
