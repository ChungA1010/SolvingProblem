# 로컬 웹사이트와 상태 기반 Ridge 연결

2026-11-02, 원본 commit `fa3aea8`의 로컬 사본에 연결했다. GitHub나 Sites의
공개 사이트를 배포·변경한 것은 아니다. 기존 입문/학습 실험실은 교육용 수식이고,
`#prediction`의 데이터 기반 MRR 화면만 별도 Ridge API를 호출한다.

## 실행

웹 서버는 이 폴더에서 `node server.mjs`로 실행한다. 주소는
http://127.0.0.1:8510/#prediction 이다. 모델 서버는 원래 모델 저장소
`PHM/PHM`에서 다음 PowerShell 한 줄로 실행한다.

```powershell
.\.venv\Scripts\python.exe -m src.models.state_mrr_service --model artifacts/state-mrr-v1/model.json --port 8000 --allow-origin http://127.0.0.1:8510
```

추론 API에는 학습·튜닝이 없고 Python 표준 라이브러리만 필요하다. 로컬
venv가 없는 다른 PC에서는 준비된 Python과 모델 코드/묶음을 별도 제공해야 한다.
이 웹 저장소만 다운로드하면 Python 모델 서버까지 자동 설치되지는 않는다.
두 서버는 개발/로컬 체험용이다. 공개 배포에는 Python API 호스팅, HTTPS,
정확한 CORS origin과 프런트 API 주소 설정을 별도로 준비해야 한다. 공개
사이트가 사용자 PC의 localhost 모델을 호출하게 배포하지 않는다.

## 사용

1. 홈의 '데이터 기반 예측 열기' 또는 왼쪽 '데이터 기반 MRR'을 선택한다.
2. 현재 wafer ID, recipe, 투입시각과 과거 실측 MRR/투입/측정 완료시각을 입력한다.
3. JSON 요청 파일을 불러오거나 '가상 이력으로 체험'을 선택할 수 있다.
   가상 이력은 실제 PHM 측정이나 독립 검증이 아니며 계속 경고를 표시한다.
4. 'MRR 예측 실행'은 `/api/v1/predictions`에 실제 HTTP POST를 보낸다.
5. 결과 MRR·prev_mrr·EWMA·이력 수·모델 버전과 상태 범위 경고를 확인한다.
6. '입력·결과 JSON 저장'으로 출처/입력/응답을 다운로드한다. 입력을 바꾸면
   이전 결과와 다운로드를 무효화한다. 예측값을 실제 측정값으로 자동 누적하지 않는다.

화면 시각은 브라우저 현지 시간이며 API에는 offset을 반영한 ISO UTC를 보낸다.
같은 recipe의 전체 가용 이력 완전성은 호출자 책임이다. JSON 파일은 1 MiB
이하로 제한하며 과거 교육용 실험 기록을 실측 이력으로 변환하지 않는다.
입력/측정 데이터는 자동으로 localStorage나 DB에 저장하지 않는다.

API 주소 기본값은 http://127.0.0.1:8000 이다. 다른 개발 서버와 통합할 때는
mrr-state.js 로딩 전 `window.CMP_MRR_API_BASE`를 명시적으로 설정한다.
모델 API가 없거나 응답이 잘못되면 오류를 보여주며 교육 수식으로 대체하지 않는다.

## 계약과 제한

- 입력: `mode=expert`, `wafer_id`, `recipe`, `wafer_start_at`, `history`.
- history: `wafer_id`, `recipe`, `wafer_started_at`, `measurement_completed_at`, `mrr`.
- 지원 recipe A456/B456. A123은 이 Ridge 경로에서 지원하지 않는다.
- MRR: 원본 라벨 척도 factor 1, 물리 단위 미확인. 제거량/연마시간 숫자 출력 없음.
- N=0, Ridge alpha=1.0, EWMA alpha=0.4. pressure correction=0.
- 단변량 학습 범위 안이라는 표시는 정확도 등급·신뢰구간·joint coverage가 아니다.
- 현 모델의 미래 독립 검증은 없다. 개발 benchmark MAE 2.690과 기능 동작 시험을
  새로운 정확도 검증으로 혼동하지 않는다.

## 검증

```powershell
node --test tests/*.test.cjs
```

기존 웹 테스트 96개 + 연결 클라이언트 테스트 6개 = 102개 통과.
모델 저장소의 Python 테스트 18개는 과거 이력/모드/HTTP/교육 규칙 분리를 확인한다.
아래는 실행 중인 API와 지정한 모델 파일이 실제로 같은 결과를 주는지 확인한다.

```powershell
node tools/verify_mrr_connection.mjs "..\..\PHM\artifacts\state-mrr-v1\model.json"
```

브라우저에서는 정상 예측, 미래 측정 거부, 입력 변경 시 결과 숨김, 새 상태의
예측 변화와 1280px/390px 레이아웃을 확인했다. 이 결과만으로 공정 인과 효과,
교육 효과 또는 독립 예측 성능까지 검증된 것은 아니다. 전체 판정은
[요구사항 점검표](CMP_REQUIREMENTS_REVIEW.md)를 참고한다.
