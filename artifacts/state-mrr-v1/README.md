# State Ridge v1 — 교육·개발용 모델 묶음

`model.json`은 저장된 Ridge 계수와 전처리 파라미터다. `report.json`은
fold 2~5 chronological development benchmark의 집계 결과다. 원본 센서나
wafer별 측정 기록은 이 묶음에 포함하지 않는다.

- recipe + prev_mrr + state_ewm; Ridge alpha=1.0, EWMA alpha=0.4.
- 저장된 모델의 학습 자료: fold 1~4 A456/B456, 1,286행. A123 제외.
- benchmark는 각 평가 fold 직전까지의 자료로 별도로 fit한 모델들의 평가다.
  전체 weighted MAE=2.690006, unweighted MAE=2.687930.
- 2.690은 저장된 단일 모델의 독립 test 점수가 아니다. fold 5도 개발에 이미 사용했다.
- PHM에는 측정 완료 시각이 없어 N=0은 가정이다. 실제 서비스 입력은 완료 시각을 검사한다.
- raw label scale: VERIFIED, factor 1. physical MRR unit: UNIT_UNVERIFIED.
- target removal: NOT_AVAILABLE_IN_PHM_CMP1. t_polish unit: seconds.
- polishing time numerical output: disabled. 압력 보정도 비활성.
- `training_support`는 학습 상태의 recipe별 단변량 min/max다. 이 범위 안이라고
  새로운 상태 조합이 검증됐거나 신뢰구간이 확보됐다는 의미는 아니다.
- source_sha256와 sklearn_version은 재현성 추적용이며 배포/독립 검증 인증이 아니다.

재생성 및 실행 방법: [모델 사용법](../../docs/state_mrr_usage.md),
[웹 연결과 두 모드 설계](../../docs/state_mrr_web_contract.md).
