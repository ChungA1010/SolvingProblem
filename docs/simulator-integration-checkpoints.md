# 교육용 Ridge와 Unity 연결 체크포인트

브랜치 `feat/4-simulator-core-codex`, 기준 커밋 `64d3f23`. CP01~CP10의 Issue #4 코어 다음 작업입니다. 모델 저장, 실제 데이터 replay 검증, Unity 연결을 사용자가 요청하여 순서대로 진행합니다. 각 커밋에 관련 이슈 번호를 기록합니다.

| 단계 | 결과 | 상태 |
|---|---|---|
| CP11 (#2, #4) | 고정 Ridge 교육용 export, 원 pipeline/portable/core 일치, 측정 주기·지연 replay | 완료 |
| CP12 (#4) | artifact 체크섬을 확인하는 로컬 HTTP API, 입력·오류 계약과 실행 도구 | 완료 |
| CP13 (#4) | CMP 전용 Unity 프로젝트·Windows 빌드·실제 HTTP 통합 시험 | 완료 |
| CP14 (#2, #4) | 독립 자료 노출 감사·평가 절차·중복/시각/채점 검증 | 준비 완료, 실제 새 자료 대기 |

CP14의 [독립 최종 검증 기록](independent-final-validation.md): fold 5와 기존 PHM
test·validation 모두 이미 확인한 자료입니다. 새 독립 성능 점수는 아직 없으며,
수집 이후 실제 timestamp를 사용한 고정 모델 평가 절차를 추가했습니다.

## CP11: 교육용 모델과 실제 PHM replay

[모델](../artifacts/education-ridge-v1/model.json), [재현 보고서](../artifacts/education-ridge-v1/report.json), [측정 민감도](../artifacts/education-ridge-v1/measurement_summary.csv)를 확인하세요. 원본 전처리 표는 Git에 올리지 않습니다. 파일의 SHA256과 집계 결과만 기록하며, 로컬 `predictions.csv`도 제외합니다.

학습 정책은 실행 전에 고정했습니다: Ridge α=1.0, 입력 `recipe + prev_mrr + state_ewm`, EWMA α=0.4. 각 개발 fold의 이전 fold에서만 적합하고, **교육용 저장 모델은 fold 1~4의 A456/B456 1,286행으로 학습한 한 모델**입니다. fold 5는 이미 확인한 개발 구간입니다. 전체 5개 fold refit, 하이퍼파라미터 탐색, production 선언을 하지 않습니다. 비교용 다른 fold의 모델은 저장·자동 선택하지 않습니다.

학습된 OneHotEncoder, median imputer, StandardScaler, Ridge의 수치를 JSON으로 내보냈습니다. 이는 실제 PHM 학습 파라미터이며 pickle 실행이나 runtime sklearn 설치 없이 사용합니다. 서비스 요청에서 결측 이력을 중앙값으로 채우는 기능은 없습니다. 이미 학습된 imputer 통계는 전처리 출처를 기록하기 위해 보존합니다.

전처리 1,977행에서 A456/B456 평가 1,286행을 사용합니다. 원 fitted pipeline과 portable 및 history 기반 core의 최대 예측 차이는 `1.4210854715202004e-14`, N=0 상태 차이는 `0`입니다. 기존 benchmark도 소수 셋째 자리까지 재현했습니다.

| 모델 | 기존 문서 MAE | 이번 replay MAE |
|---|---:|---:|
| Recipe Mean | 7.167 | 7.167237 |
| Persistence | 2.980 | 2.980179 |
| EWMA | 2.747 | 2.746926 |
| Ridge | 2.690 | 2.690006 |

### 측정 횟수와 추가 지연을 분리한 실험

같은 recipe의 관측 웨이퍼 k장마다 한 장을 측정합니다. 측정 cadence는 fold 경계에서 초기화하지 않습니다. 추가 지연 N은 측정한 웨이퍼 다음에 **추가 same-recipe N장**이 지난 뒤 값을 받는 조건입니다. N=0 학습 계수는 모든 조건에서 고정하며, sensitivity용 재학습은 없습니다. 각 조건은 같은 평가 1,286행을 사용합니다.

| 측정 주기 | 평가 구간 측정 선택 수 | 추가 지연 0 MAE | 추가 지연 1 MAE | 추가 지연 2 MAE |
|---|---:|---:|---:|---:|
| 매 1장 | 1,286 | 2.690006 | 3.152937 | 3.473936 |
| 매 5장 | 258 | 3.441299 | 3.714289 | 3.924268 |
| 매 10장 | 128 | 3.949417 | 4.155216 | 4.344295 |

추가 지연이 없을 때 매 5장은 측정 선택 수 약 79.9% 감소, MAE 약 27.9% 증가입니다. 매 10장은 약 90.0% 감소, MAE 약 46.8% 증가입니다. 측정 선택 수는 평가 구간의 계획 횟수이며, prediction 이전에 사용 가능한 이력 수 또는 실제 계측기 기록 수가 아닙니다. 모든 조건의 recipe별·fold별 집계도 파일에 있습니다.

**실제 측정 완료 시각은 PHM 자료에 없습니다.** 기존 ordinal N=0 조건을 서비스 timestamp 계약에 연결하기 위해 합성 UTC ordering clock을 사용했습니다. PHM 센서 시각을 측정 완료 시각으로 바꾸지 않았으며, 이 합성 시각을 실제 계측 이력으로 주장하지 않습니다. 현재/미래 라벨은 해당 request의 ledger에 미리 넣지 않습니다.

기존 지연 감사는 각 N에서 다시 적합한 모델이고, 이번 sensitivity는 N=0 계수를 고정한 입력 변화 실험입니다. N=1·2 수치가 기존 표와 다른 이유는 이 차이입니다. 오류 감소나 독립 최종 성능 달성을 주장하지 않습니다.

### 재현

Python 3.12와 `requirements-simulator-ridge.txt`의 고정 환경에서 저장소 루트 실행:

```powershell
python -m src.models.export_simulator_ridge --wafer-table C:/path/to/wafer_table.csv --output artifacts/education-ridge-reproduction
```

이 명령만 명시적으로 offline fit합니다. 기존 `education-ridge-v1`을 덮어쓰지 않고 새 출력 경로가 필요합니다. source table hash는 `cf22df23300d170133ce252b7d936c57fae6a18b55a43c4bf56ba0c83a4bd9d5`입니다. 기존 학습 코드, Di2017 동결 baseline과 기존 결과는 수정하지 않습니다.

## 완료 범위의 구분

교육용 모델 저장은 독립 최종 모델 선정과 다릅니다. Issue #2의 동일 조건 Di2017 비교, 독립 미래 데이터 검증, `kp_model.py`/`fit_kp.py`의 동일 조건 비교는 여전히 남습니다. 압력 correction은 전부 0이며, 물리 단위와 목표 제거량이 검증되지 않아 polishing time은 null입니다. GitHub 이슈 본문·체크박스·댓글·close 상태는 이 작업에서 수정하지 않습니다.

## CP12: 로컬 예측 API

Python 3.10 이상에서 제삼자 패키지 없이 실행할 수 있습니다. Ridge 학습은 위의 offline export 명령에서만 실행되며 API import·startup·request에서 학습 모듈을 불러오거나 fit하지 않습니다. artifact는 실행자가 명시적으로 지정하고 SHA256을 확인하여 한 번 로드합니다.

```powershell
powershell -ExecutionPolicy Bypass -File tools/start-simulator-api.ps1 -PythonExecutable python -Port 8765
```

- `GET /api/v1/health`: 모델 버전·artifact SHA256·교육용 상태·독립 시험 부재.
- `GET /api/v1/scenarios`: 지원되는 다섯 recipe/scenario 조합.
- `POST /api/v1/predictions`: [요청 예제](../examples/simulator_request.json)의 history 계약을 사용. `application/json` 필요.

127.0.0.1에만 bind합니다. 최대 JSON 요청은 1 MiB입니다. 입력 JSON 오류는 HTTP 400, 지원하지 않는 scenario·부족한 history 등 domain 오류는 422입니다. 응답에는 기존 core의 오류/경고와 `EDUCATIONAL_DEVELOPMENT_MODEL` 경고가 있습니다. raw pressure·직접 입력한 prev/state·외부 delta를 거부합니다. 요청마다 history 원장을 제공하는 stateless API이며 서버가 측정값을 자동 생성하지 않습니다.

```powershell
$payload = Get-Content -LiteralPath examples/simulator_request.json -Raw -Encoding UTF8
Invoke-RestMethod -Uri http://127.0.0.1:8765/api/v1/predictions -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
```

이 예제의 history는 합성이지만 predictor는 실제 PHM 학습 Ridge입니다. 최초 예측 MRR은 약 `72.996356`이며 물리 단위는 미확정입니다. CP10의 테스트 stub 값 71과 구분합니다. 시간은 계속 null입니다.

전체 Python 검증은 **234 passed, 0 failures/errors/skips**입니다. artifact를 포함한 CP11 검증 225개에 실제 HTTP endpoint 검증 9개를 추가했습니다. 전처리·학습 환경은 Python 3.12.14, 추론 API는 표준 라이브러리만 사용합니다.

## CP13: CMP 전용 Unity 데모

프로젝트는 `unity/CmpSimulatorDemo`, 검증한 Editor는 Unity **6000.3.21f1**입니다. 기존 게임 프로젝트나 이전 CMP 데모를 변경하지 않고 이 브랜치 안에 별도 프로젝트를 만들었습니다.

학생 화면에서 다음을 사용할 수 있습니다.

- A456/B456 recipe와 지원되는 관측 pressure scenario 선택.
- 합성 초기 이력이라는 표시와 실제 PHM 학습 Ridge의 MRR·근거·경고 확인.
- 측정한 MRR 추가 후 다음 웨이퍼 예측. prev/state는 직접 입력하지 않습니다.
- 외부 요청 JSON 파일 불러오기. JSON은 그대로 API로 보내며 금지 필드를 조용히 제거하지 않습니다. 외부 요청 mode에서는 원 execution ID를 보존하며, 새 측정 추가는 합성 데모 mode에서만 지원합니다.
- 보정 비활성, 독립 검증 부재, 단위 미확정과 시간 계산 비활성 표시.

시나리오 변경은 장비 setpoint 조작이 아니며 correction=0이므로 MRR 변화 효과를 만들지 않습니다. 초기 이력은 60·80의 합성 예시입니다. 실제 모델의 첫 예측은 `72.99635621438893`, 측정 MRR 78을 추가한 다음 예측은 `74.58501897244084`였습니다. 이 두 수치를 PHM 정확도나 측정 실험 MAE로 해석하지 않습니다.

### 빌드와 실행

Unity에서 프로젝트를 열거나 PowerShell에서 다음 명령으로 Windows player를 생성합니다. 설치 경로는 본인의 Editor 위치로 변경하세요.

```powershell
New-Item -ItemType Directory -Path builds -Force | Out-Null
& 'C:/Program Files/Unity/Hub/Editor/6000.3.21f1/Editor/Unity.exe' -batchmode -nographics -quit -projectPath "$PWD/unity/CmpSimulatorDemo" -executeMethod CmpSimulatorBuild.Build -logFile "$PWD/builds/unity-build.log"
```

Editor에서 테스트할 때는 API를 별도 실행한 뒤 `Assets/Scenes/CmpSimulator.unity`를 열어 Play합니다. 빌드된 player는 다음으로 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File tools/start-simulator-demo.ps1 -PythonExecutable python -Port 8765
```

이 실행 도구는 model SHA256이 맞는 API를 확인하고 Unity 창을 엽니다. API가 없으면 시작하고, 데모가 종료되면 이 도구가 시작한 API만 종료합니다. CP14에서 `.gitattributes`의 model 설정을 `-text`로 수정하여 원래 고정 파일의 CRLF를 포함한 바이트를 그대로 보존했습니다. Git 정규화로 달라졌던 repository blob도 원래 파일 바이트로 맞춰 모든 checkout에서 기록된 checksum을 사용합니다. 학습 계수는 동일합니다.

### 자동 검증과 공유

Windows 빌드가 성공했고 Unity player에서 실제 HTTP health·5개 scenario·Ridge prediction·측정 후 예측 변화·unsupported scenario/empty history 오류를 검증했습니다. API는 **Python `-S`(site packages 비활성)**로 실행하여 제삼자 패키지 없이 연결됨을 확인했습니다. 이는 headless 통합 시험이며 수동 클릭·화면 렌더 검증은 포함하지 않습니다. [빌드 기록](../verification/simulator-integration-v1/unity-build.json), [Unity smoke 결과](../verification/simulator-integration-v1/unity-smoke.json), [API 모델 정보](../verification/simulator-integration-v1/api-health.json)를 보세요.

별도 로컬 실행 ZIP도 만들 수 있습니다. Windows player, portable JSON model, 표준 라이브러리 API와 실행 도구를 포함하며 raw PHM 표는 포함하지 않습니다. ZIP과 Windows 빌드의 바이너리는 Git에 넣지 않고 source·집계·검증 기록을 공유합니다.

```powershell
python tools/package-simulator-demo.py --output builds/CMP-Ridge-Unity-Demo-v1.zip
```

이번 로컬 공유 ZIP은 `CMP-Ridge-Unity-Demo-v1.zip`(33,069,775 bytes)입니다. 새 폴더에 풀어 model checksum·archive CRC와 패키지 안의 Unity/표준 라이브러리 API 통합 시험을 다시 확인했습니다. [패키지 확인](../verification/simulator-integration-v1/package-checks.json), [압축 해제본 smoke 결과](../verification/simulator-integration-v1/package-unity-smoke.json)를 보세요. 빌드 파일은 실행에 필요하며 GitHub source만 받은 친구는 직접 빌드하거나 이 ZIP을 별도로 받아야 합니다.

## 이후 필요한 데이터

실제 완료 timestamp를 포함한 새 미래 평가 자료가 있어야 독립 최종 성능을 확인할 수 있습니다. 압력 setpoint·target removal·물리 MRR 단위와 별도의 correction 검증이 확보되기 전까지 현재 정책을 유지합니다. 이 작업으로 Issue #2의 모든 연구 비교나 Issue #3의 수치 보정을 완료했다고 표시하지 않습니다.
