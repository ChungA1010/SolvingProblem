# 논문별 PHM 2016 CMP baseline

세 논문을 **따로 실행 가능한 3개 baseline 묶음, 총 13개 모델**로 제공한다. 각 묶음은 특징 처리, 학습 함수, 저장 모델, 평가 지표, 설정과 가정을 연결한다. 우리 모델과 비교하기 위한 선행연구 baseline이며 원저자의 코드나 성능 수치를 완전히 재현했다는 뜻은 아니다.

후속 **[원문 조건 차이 검증 v2](../runs/phm_cmp_reconstruction_v2/REPORT.md)**에서는 학습을 새로 수행해 스태킹·이력·CPP 등의 차이를 검증했다. [후보 설정과 실행법](../docs/paper-reconstruction-v2.md)은 별도이며, 아래 v1 baseline의 설정·모델·결과를 덮어쓰지 않는다.

| 묶음 | 논문 | 모델 수 | 실행 구성 | 기존 학습 모델 재평가 |
|---|---|---:|---|---|
| [P1](p1/README.md) | Decision Tree-Based Ensemble Learning (2019) | 5 | Stage A/B별 35개 특징, RF/GBT/ERT, CART/ELM 스태킹 | [보고서](../runs/phm_cmp_baselines_v1/p1/REPORT.md) |
| [P2](p2/README.md) | Enhanced Virtual Metrology (2017) | 6 | Cond1/2/3별 125개 특징 후보, 과거/이웃 제거율, 가중 통합 | [보고서](../runs/phm_cmp_baselines_v1/p2/REPORT.md) |
| [P3](p3/README.md) | Assessment of Physics-Based and Data-Driven Models (2018) | 2 | chamber 456/123별 11/6개 특징, RF와 CPP 보정 | [보고서](../runs/phm_cmp_baselines_v1/p3/REPORT.md) |

학습된 14개 모델 묶음 파일은 기존 `runs/phm_cmp_papers_v1/models/`에 있다. P1의 두 Stage, P2의 세 조건, P3의 두 경로를 official/grouped 두 분할에 각각 학습한 수이다. 각 파일 안에 해당 논문의 여러 예측 모델이 들어 있다. 논문별 `models.json`에서 파일 위치와 SHA-256을 확인한다. 불필요한 모델 복사본을 만들지 않으므로 공유할 때는 저장소 전체를 복제한다.

## 설치와 데이터 없이 확인

저장소 최상위에서 Python 3.12 환경을 활성화한 후 실행한다. 이 baseline에는 Unity·GPU·PyTorch가 필요하지 않다.

```powershell
python -m pip install -r requirements.lock.txt
python -m pip install -e . --no-deps
python -m cmp_ml.baselines list
python -m cmp_ml.baselines verify --baseline-dir runs/phm_cmp_baselines_v1/p1
python -m cmp_ml.baselines verify --baseline-dir runs/phm_cmp_baselines_v1/p2
python -m cmp_ml.baselines verify --baseline-dir runs/phm_cmp_baselines_v1/p3
```

`verify`는 공개된 결과·코드 스냅샷·학습 모델의 해시를 검사하며 원본 데이터가 필요 없다. 예측을 다시 계산하는 작업은 아래 `evaluate`이다.

## 원본 데이터 준비

학습·재평가에는 PHM 시계열과 별도 제거율 정답으로 만든 **로컬 특징 캐시**가 필요하다. 원본 데이터와 전체 특징 캐시는 Git에 올리지 않는다. 입력 구조는 다음과 같다.

```text
CMP1/
  CMP-training-removalrate.csv
  CMP-data/training/CMP-training-000.csv ... CMP-training-184.csv
phm2016_external/
  validation/CMP-validation-000.csv ... CMP-validation-184.csv
  test/CMP-test-000.csv ... CMP-test-184.csv
  labels/CMP-validation-removalrate.csv
  labels/CMP-test-removalrate.csv
```

원본 확보 경로와 버전은 [기존 출처 기록](../runs/phm_cmp_external_v1/REPORT.md), 실제 바이트 버전은 [파일 해시](../runs/phm_cmp_papers_v1/sources.json)를 참조한다. 새 PC에서는 공유된 v1 그룹 분할을 사용해 입력을 한 번 준비한다. 아래 `/path/to/...` 두 경로를 실제 로컬 경로로 바꾼다. `runs/my_paper_inputs`와 대응 캐시는 새 폴더여야 한다.

```powershell
python -m cmp_ml.paper_benchmark prepare --original-root /path/to/CMP1 --external-root /path/to/phm2016_external --source-run runs/phm_cmp_v1 --run-dir runs/my_paper_inputs
```

이 명령은 세 논문에서 사용할 입력만 준비하며 모델을 학습하지 않는다. 캐시는 `.cache/paper_benchmark/my_paper_inputs/features.csv.gz`에 생성된다. 기존 모델 재평가에는 공개 실행의 특징 해시와 일치해야 한다. 값·정렬·버전이 다르면 검사가 중단되므로 해시를 고쳐 우회하지 말고 데이터 버전과 환경을 확인한다.

## 각 논문만 재학습

```powershell
python -m cmp_ml.baselines train --paper p1 --source-run runs/my_paper_inputs --output-dir runs/my_p1_baseline
python -m cmp_ml.baselines train --paper p2 --source-run runs/my_paper_inputs --output-dir runs/my_p2_baseline
python -m cmp_ml.baselines train --paper p3 --source-run runs/my_paper_inputs --output-dir runs/my_p3_baseline
```

기본값은 official과 grouped 두 분할이며 `--track official` 또는 `--track grouped`로 하나만 실행할 수 있다. 이미 입력 캐시가 있는 작업 PC에서는 `--source-run runs/phm_cmp_papers_v1`을 사용해도 된다. P1은 seed 20260917부터 20회 반복하며 seed 0의 Stage별 모델만 저장한다. P2는 조건마다 20회 Monte Carlo CV를 수행한다. P3는 경로별 RF를 학습한다. 각 논문은 원문이 명시한 부분과 [공개한 가정](../docs/paper-reproduction.md)을 고정해 사용한다. JSON은 설정 명세이며 임의 하이퍼파라미터 탐색 인터페이스가 아니다.

출력에는 `models/`, `models.json`, `predictions.csv.gz`, `metrics.csv`, `REPORT.md`, 코드 스냅샷, 환경·해시 기록이 저장된다. P1은 20회 반복 지표, P2는 CV·특징 선택 기록을 추가로 남긴다. 실행 중단 시에도 기존 출력 폴더를 덮어쓰지 않는다. 새 폴더로 다시 실행한다. 원래 통합 실행기의 체크포인트 재개 기능과는 별도이다.

## 이미 학습한 모델 재평가

```powershell
python -m cmp_ml.baselines evaluate --paper p1 --output-dir runs/my_p1_recheck
python -m cmp_ml.baselines evaluate --paper p2 --output-dir runs/my_p2_recheck
python -m cmp_ml.baselines evaluate --paper p3 --output-dir runs/my_p3_recheck
```

새 PC에서 위 준비 명령으로 캐시를 만든 경우 각 명령에 `--feature-cache .cache/paper_benchmark/my_paper_inputs/features.csv.gz`를 덧붙인다. `evaluate`는 학습하지 않고 기존 모델을 해시 검사 후 로딩하여 Validation/Test 예측을 재계산한다. 기존에 고정한 예측과 최대 절대 차이 `1e-8` 이내인지 검사하고 논문별 전체·Stage별 지표를 출력한다. P1의 20회 반복 통계는 기존에 기록한 반복 예측에서 계산하며, seed 0 이외의 모델을 다시 로딩했다고 표시하지 않는다.

## 모델로 예측

```powershell
python -m cmp_ml.baselines predict --baseline-dir runs/phm_cmp_baselines_v1/p2 --track grouped --features data/query_features.csv --output data/p2_predictions.csv
```

입력은 원시 센서 한 행이 아니라 전처리한 wafer-stage 특징표이다. `sample_id`, `STAGE`와 해당 논문의 특징·경로 메타데이터가 필요하다. 특징 이름은 [대응표](../runs/phm_cmp_papers_v1/feature_catalog.csv)에 있다. P2의 lag/neighbor는 저장된 학습 라이브러리에서 생성하므로 입력에 정답을 제공할 필요가 없다. P3의 CPP ID는 학습 시 사용한 CPP 문맥과 일치해야 한다. 임의로 새 ID를 붙여 현재 결과와 같은 성능을 보장할 수 없다. 입력에 `AVG_REMOVAL_RATE`나 `truth`가 있어도 예측기에 전달하지 않는다.

## 해석과 미구현 범위

- 같은 track 안의 모든 baseline에 같은 분할과 네 극단 Train 표본 제외를 적용했다. 이 제외는 P1 조건이며 P2/P3에는 추가 가정이다.
- official에는 서로 다른 Stage에서 Train과 동일한 wafer가 존재한다. grouped는 wafer/file 연결 그룹을 분리한다. 어느 쪽도 새 공장·미래 시점의 독립 Test가 아니다.
- 모든 baseline을 비교군으로 유지한다. 이 구성 작업에서 Test를 보고 새 승자를 선정하거나 기존 API/Unity의 모델을 교체하지 않았다.
- P1의 R²는 표준 정의를 사용하고, 원문 식/표가 불일치하는 S-score는 두 해석을 분리한다. MSE/RMSE를 정확도 %로 바꾸지 않는다.
- P1 전체 특징 탐색, P2 DBN, P3 GA 탐색·앙상블 NN 등은 구현 범위 밖이다. 논문별 README와 `baseline.json`에 명시했다.
- 이 세 논문의 baseline과 기존 Physics+ML 후보 전체를 동일한 조건으로 재학습한 최종 성능 비교는 별도 작업이다.
