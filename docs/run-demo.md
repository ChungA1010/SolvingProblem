# 로컬 CMP 데모 실행

## 이 PC에서 실행

저장소 루트의 `start-demo.cmd`를 더블클릭하거나 PowerShell에서 다음을 실행합니다.

```powershell
.\tools\start-demo.ps1
```

API는 `http://127.0.0.1:8765`에서 실행합니다. 서버가 이미 준비돼 있으면 재사용하며, 새 서버는 창을 띄우지 않습니다. Unity 데모가 열리면 다음을 사용할 수 있습니다.

1. **제거율 실험:** Stage A/B와 4개 시나리오를 선택하고 관측 지수 5개를 변경합니다. 모델별 예측, anchor 대비 차이, 입력 분포 검사 결과를 확인합니다. 90% 경험적 구간은 선택해서 표시합니다.
2. **웨이퍼 분류:** WM-811K 단일 분류 또는 MixedWM38 복합 분류를 선택합니다. 합성 예제 맵을 클릭해 불량/정상 die를 편집하고 분류합니다. 예제 맵은 정확도 검증용 원본 이미지가 아닙니다.
3. **실험 기록:** 예측 결과를 저장하고 목록·JSON 내보내기를 사용합니다. 저장소는 `data/app/experiments.sqlite3`이며 Git에 포함하지 않습니다. 기본 UI 목록은 최근 50개입니다. 전체 페이지 조회·상세·삭제·CSV·비교는 API로도 제공합니다.

API만 실행하려면 `.\tools\start-demo.ps1 -ApiOnly`를 사용합니다. API 문서는 [로컬 Swagger](http://127.0.0.1:8765/docs)에 있습니다. 서버는 로컬 전용이며 외부 공개 배포, 로그인, HTTPS 서버를 구성한 상태가 아닙니다.

## 새 PC

Python 3.12와 Git을 설치하고 아래 브랜치를 내려받습니다. Git 대신 [브랜치 ZIP](https://github.com/ChungA1010/SolvingProblem/archive/refs/heads/feat/cmp-virtual-lab.zip)을 내려받아 압축을 풀어도 됩니다.

```powershell
git clone --branch feat/cmp-virtual-lab --single-branch https://github.com/ChungA1010/SolvingProblem.git
cd SolvingProblem
```

[v0.2.0 Release](https://github.com/ChungA1010/SolvingProblem/releases/tag/v0.2.0)의 `CMP-Virtual-Lab-Windows-v0.2.0.zip`을 `builds/CmpDemo/`에 압축 해제합니다. 결과 경로는 `builds/CmpDemo/CmpDemo.exe`여야 합니다. 모델과 API 코드는 저장소에 들어 있으므로 실행 파일 ZIP과 저장소가 모두 필요합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-demo.ps1 -Setup
```

설치 스크립트는 공식 PyTorch CPU 패키지와 고정된 서비스 의존성을 설치합니다. 최초 설치에는 네트워크가 필요합니다. 추론에는 GPU나 원본 학습 데이터가 필요하지 않습니다. 학습을 다시 수행하려면 GPU용 PyTorch와 로컬 원본 데이터가 별도로 필요합니다.

## Unity 프로젝트 열기·빌드

Unity Hub에서 `unity/CmpDemo`를 추가하고 **Unity 6000.3.21f1**로 엽니다. `Assets/Scenes/CmpDemo.unity`가 기본 장면입니다. 해당 Editor와 Windows Build Support가 설치되어 있어야 합니다.

```powershell
& 'C:/Program Files/Unity/Hub/Editor/6000.3.21f1/Editor/Unity.exe' `
  -batchmode -nographics -quit -projectPath "$PWD/unity/CmpDemo" `
  -buildTarget StandaloneWindows64 -executeMethod CmpBuild.Build `
  -logFile "$PWD/unity-build.log"
```

`Assets/CmpLab/CmpApiClient.cs`에는 다른 Unity 프로젝트에서 재사용할 수 있는 HTTP 클라이언트와 DTO가 있습니다. JSON의 null을 Unity JsonUtility가 빈 객체로 만들 수 있어 응답 status로 data/error를 정리합니다. 실패 시 입력을 유지하고, Stage 변경 시 수정 중인 값을 버릴지 확인합니다.

## 실제 데이터 요청

제거율 시계열은 `POST /api/v1/predictions/trace`에 원본 25개 컬럼의 행 배열을 전달합니다. 한 요청에는 같은 장비·웨이퍼·Stage의 시계열만 넣습니다. 식별자와 시간은 특징 정리용이며 모델 설명 변수로 직접 넣지 않습니다. 허용되지 않은 Chamber와 학습 분포 밖 입력은 차단합니다.

웨이퍼 맵은 `POST /api/v1/wafer-predictions`로 전송합니다. `pixels`는 행 우선 순서이며 0=빈 영역, 1=정상 die, 2=불량 die입니다. MixedWM38은 검증된 원본 크기 52×52만 허용합니다. 숫자 대신 문자열, NaN/Inf, 3 등의 미정의 값은 거부합니다.

```python
import httpx
import numpy as np

grid = np.load("my_wafer.npy", allow_pickle=False)
if grid.ndim != 2 or not np.isin(grid, [0, 1, 2]).all():
    raise ValueError("A 2-D grid of 0, 1, 2 is required")
payload = {
    "dataset": "wm811k",
    "height": int(grid.shape[0]), "width": int(grid.shape[1]),
    "pixels": grid.astype(int).ravel().tolist(),
}
response = httpx.post("http://127.0.0.1:8765/api/v1/wafer-predictions", json=payload)
print(response.status_code, response.json())
```

저장은 `POST /api/v1/experiments`에 name, prediction_id, notes, force를 넣고 `Idempotency-Key` 헤더를 전달합니다. 같은 키·같은 body는 기존 결과를 반환하며 다른 body는 409입니다. 기록 삭제는 `DELETE /api/v1/experiments/{id}?confirm=true`입니다. 멱등 키는 현재 버전에서 24시간 이상, 자동 만료 없이 보존하며 삭제된 실험의 이전 멱등 응답도 기록으로 남습니다.

## 설계·해석 차이

첨부 v0.4.0은 Streamlit 기반 초안입니다. 이번 요청에 따라 HTTP API와 Unity 데모로 구현했습니다. `research_demo`는 해당 문서의 `advanced_mode` 승인이나 제조 배포 승인을 뜻하지 않습니다. 기존 PHM 모델의 검증 선정 결과를 유지하며, 뒤늦은 Test 재선정으로 릴리스 모드를 만들지 않았습니다.

시나리오는 Train 표본에서 선택한 전체 특징 anchor를 사용합니다. 변경한 관측 변수에 대해 mean/min/max/first/last를 같은 delta만큼 이동하고, AUC는 실제 관측 시간 합계에 delta를 곱해 이동합니다. std/range/slope, zero_ratio, 상태·사용량·Chamber는 anchor 값을 유지합니다. 따라서 수정된 결과는 요약 특징의 가상 이동이며 모든 원시 시계열을 복원한 것이 아닙니다. 새 원시 시계열은 학습 때와 같은 `describe_trace`로 직접 계산합니다.

OOD 기준과 변수 범위는 Train만으로 생성합니다. k=10 최근접 평균 거리, Train leave-one-out q95/q99와 변수 관측 경계를 사용합니다. 이것이 새 공장, 새 장비, 임의 웨이퍼 맵에 대한 안전·정확도 보증은 아닙니다. 분류 점수는 보정된 확률이 아닙니다. PHM 구간 coverage는 기존 외부 평가에서 85–95% QA 범위를 벗어나므로 재보정 완료로 표시하지 않습니다. 새 독립 데이터 없이 기존 Test에 맞춰 구간을 줄이지 않았습니다.
