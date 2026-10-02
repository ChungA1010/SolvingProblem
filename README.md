\# Di et al. (2017) CMP MRR Baseline Reproduction



PHM 2016 CMP 데이터를 이용해 Di et al. (2017)의  

MRR(Material Removal Rate) 예측 방법을 재현하고 검증한 baseline입니다.



이 브랜치의 목적은 논문의 수치를 완전히 동일하게 복제하는 것이 아니라,  

이후 개발할 CMP MRR 예측 모델과 비교할 수 있는 기준 모델을 고정하는 것입니다.



\## Branch



`baseline/1-di2017-final`



Related issue: #1



\## Included



\### Baseline / reproduction code



\- `src/models/reproduce\_di2017.py`

&#x20; - Di et al. (2017) 재현 실험의 핵심 코드

&#x20; - Persistent, KNN, Linear Regression, SVR, Tree Bagging 등의 비교 모델 구성



\- `src/models/di2017\_baseline.py`

&#x20; - 프로젝트에서 비교 기준으로 사용할 Di2017 baseline 구현



\### Audit / validation code



\- `src/models/di2017\_final\_audit.py`

&#x20; - 최종 재현 검증 수행



\- `src/models/audit\_di2017\_features.py`

&#x20; - 논문의 feature 구성 및 선택 방식 검증



\- `src/models/diagnose\_di2017\_chronology.py`

&#x20; - wafer chronology 및 lag 정의 진단



\- `scripts/verify\_reproduction.py`

&#x20; - 재현 결과 확인용 보조 스크립트



\## Dataset



본 저장소에는 대용량 PHM 2016 원본 센서 데이터가 포함되지 않습니다.



데이터 관련 설명과 라이선스는 다음 위치에 있습니다.



\- `Dataset/CMP1/README.md`

\- `Dataset/CMP1/LICENSE.txt`



원본 센서 데이터와 생성 데이터는 `.gitignore`에서 제외합니다.



\## Installation



Python 환경에서 필요한 패키지를 설치합니다.



```bash

pip install -r requirements.txt

```



\## Reproduction



재현 코드와 final audit 코드의 실행 옵션은 다음 명령으로 확인할 수 있습니다.



```bash

python -m src.models.reproduce\_di2017 --help

python -m src.models.di2017\_final\_audit --help

```



실제 재현을 수행할 때는 PHM 2016 CMP1 원본 데이터가 로컬 환경의 지정된 위치에 준비되어 있어야 합니다.



\## Final audit results



최종 재현 검증 결과는 다음 위치에 있습니다.



```text

results/di2017\_final\_audit/

```



주요 결과 파일은 다음과 같습니다.



\- `final\_summary\_vs\_paper.csv`

&#x20; - 논문 결과와 최종 재현 결과 비교



\- `final\_metrics\_by\_condition.csv`

&#x20; - 조건별 최종 성능



\- `cv\_fold\_metrics.csv`

&#x20; - cross-validation fold별 평가 결과



\- `cv\_predictions.csv`

&#x20; - cross-validation 예측 결과



\- `feature\_selection\_audit.csv`

&#x20; - feature selection 검증 결과



\- `cv\_lag\_semantics\_comparison.csv`

&#x20; - lag 정의 방식에 따른 결과 비교



\- `lag\_coverage.csv`

&#x20; - 과거 MRR lag 사용 가능 범위 점검



\- `polishing\_segment\_audit.csv`

&#x20; - polishing segment 정의 검증



\- `polishing\_segment\_sensitivity\_metrics.csv`

&#x20; - polishing segment 정의 변화에 대한 민감도 분석



\- `preprocessed\_alignment.csv`

&#x20; - 전처리 데이터와 재현 데이터의 정렬 검증



\- `preprocessed\_chronology\_diagnostics.csv`

&#x20; - 전처리 데이터 chronology 진단



\- `reproduction\_assumptions.csv`

&#x20; - 논문 재현 과정에서 사용한 가정 정리



\- `selection\_mode\_comparison.csv`

&#x20; - feature selection 방식 비교



\- `run\_info.json`

&#x20; - 최종 audit 실행 정보



보다 자세한 검증 내용은 다음 문서를 참고합니다.



```text

results/di2017\_final\_audit/README.md

```



\## Reproduction status



논문에 공개된 정보만으로는 일부 세부 조건을 완전히 복원할 수 없어  

논문의 최종 수치와 정확히 동일한 결과에는 도달하지 못했습니다.



재현 과정에서는 다음 항목을 중점적으로 검증했습니다.



\- wafer chronology

\- 과거 MRR lag 정의

\- missing wafer의 영향

\- feature 구성 및 selection 방식

\- polishing segment 정의

\- cross-validation 조건

\- 논문 결과와 구현 결과의 차이



따라서 본 구현은 \*\*exact paper reproduction\*\*이라기보다,  

이후 프로젝트에서 개발할 모델과 비교하기 위한 \*\*comparison baseline\*\*으로 사용합니다.



\## Repository policy



이번 baseline 브랜치에는 재현 및 검증에 필요한 코드와 최종 audit 결과만 포함합니다.



다음 항목은 저장소에 포함하지 않습니다.



\- PHM 2016 대용량 원본 센서 데이터

\- 생성된 processed dataset

\- 모델 checkpoint

\- smoke test 결과

\- chronology debug 및 중간 실험 결과

\- 본 baseline과 직접 관련 없는 RL / world model 코드



이를 통해 baseline 자체를 독립적으로 보존하고,  

이후 새로운 MRR 예측 모델과 명확하게 비교할 수 있도록 구성했습니다.



\## Next step



이 baseline을 기준점으로 고정한 뒤 새로운 CMP MRR 예측 모델을 개발합니다.



새 모델은 가능한 한 동일한 데이터 및 평가 조건에서 baseline과 비교하고,  

최종적으로 교육용 CMP 시뮬레이터의 MRR 예측 모델로 연결하는 것을 목표로 합니다.

