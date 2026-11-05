# CMP Lab — 팩토리 게임과 학습 실험실

**[공개 웹사이트 바로가기](https://cmp-lab-semiholic-2026.a4991698.chatgpt.site)**

압력·Wafer 회전·Stage 회전·Slurry C 유량을 조절하고 3D 연마 과정과 결과를 확인하는 교육용 웹사이트입니다. 이 폴더의 계산은 가정 기반 수식이며, 저장소의 별도 AI 연구 모델을 호출하지 않습니다.

## 주요 기능

- 교육용 팩토리: 주문 5개 × 웨이퍼 6장, 연마 시간·네 변수 설정 → 측정 판단 → 검사·납품
- 게임 내 측정비·컨디셔너 교체비·납품 정산, 별점으로 다음 주문 해제, 새로고침 복구와 검사 CSV
- 기존 목표 MRR 5회 도전은 홈 하단 링크에서 계속 이용 가능
- 학습 실험실: 조건 실험·저장 기록 리플레이 통합, 3단계 안내, 계산 근거, 기존 비교·해설·과제
- Blender 기반 실시간 3D: 회전·접촉·연마·분리, 단면 확대, 투명 헤드
- 장비의 11개 부품에 마우스를 올려 역할 확인, 클릭·터치로 설명 고정
- 브라우저별 기록 저장, 조건 불러오기, 반응형 화면과 Pretendard 폰트

## 로컬 실행

빌드된 파일이 포함되어 있어 Node.js 설치 후 별도 패키지 설치 없이 실행할 수 있습니다.

```sh
cd ui-redesign
node server.mjs
```

`http://127.0.0.1:8510`에서 확인합니다. Windows에서는 `preview-server.cmd`로 실행할 수도 있습니다. 기본 포트를 바꾸려면 `PORT` 환경 변수를 지정합니다.

## 코드 수정과 검증

```sh
cd ui-redesign
npm ci
npm run build
npm test
```

- `dist/index.html`, `dist/app.js`: 화면과 사용자 흐름
- `dist/game.html`, `game.js`, `game-model.js`, `factory.css`: 주문 게임 화면·상태 전이·가정 계산
- `dist/workbench.js`, `workbench.css`: 학습 실험실 탐색·리플레이·안내
- `dist/engine.js`, `mission-model.js`, `learning-model.js`: 계산·도전·학습 로직
- `src/input.css`: Tailwind CSS 원본 → `dist/styles.css`
- `src/cmp-scene.js`: Three.js 원본 → `dist/cmp-scene.js`
- `dist/scene-parts.js`: 부품 이름과 역할 설명
- `dist/models/`, `dist/media/`, `dist/fonts/`: 웹 실행 자산
- `model-source/`, `tools/`: 편집 가능한 Blender 원본과 생성·내보내기 스크립트
- `tests/`: 기존 96개와 게임 상태·정산·복구 테스트 6개, 총 102개

일반 JavaScript 모듈은 `dist/`에서 직접 편집합니다. CSS·Three.js 원본이나 GLB를 변경했다면 다시 빌드해야 합니다. Blender 수정 절차와 장비 재구성 범위는 [모델 안내](model-source/README.md)를 참고하세요.

## 계산과 기록의 범위

MRR은 공개한 교육용 수식으로 계산합니다. 회전·유량의 백분율은 가상 기준값이며, 6초 애니메이션은 실제 공정 시간이 아닙니다. 3D의 부품 치수·변형은 설명용 가정이며, 눌림과 층 두께는 단면에서 확대해 표시합니다.

기록은 각 브라우저의 localStorage에 저장됩니다. 로그인이나 공유 데이터베이스가 없으며, 로컬 주소의 기록은 공개 사이트로 자동 이전되지 않습니다.

게임은 별도 `cmp-factory-campaign-v1` 키에 현재 주문의 이벤트와 최고 별점을 저장합니다. 이전 주문의 상세 CSV는 납품 화면에서 내려받을 수 있습니다. 새 주문으로 이동하면 이전 상세 기록 대신 최고 별점이 유지됩니다. 기존 실험 기록 키는 변경하지 않습니다.

게임의 마모·재시작·소량 변동·허용 오차·길이 단위·비용은 `factory-v1` 학습 가정입니다. 측정 버튼은 게임 계산값을 공개하는 동작이며 실제 계측이 아닙니다. 조건 변경과 측정 여부는 학생이 판단하고, 연마 동작은 장비가 수행합니다. 새로고침이나 3D 재생으로 결과를 다시 추첨하지 않습니다.

친구 시안에 언급된 `kp_model.py` 및 `MachineState(EWMA)` 원본과 검증 결과는 제공되지 않았습니다. 따라서 해당 모델의 MAE·신뢰구간·마모 보정 성능은 구현하지 않았습니다. 전문가용 리플레이는 이 브라우저의 계산 이력을 재현하며 실제 장비 운전 데이터 리플레이가 아닙니다.

## 배포

현재 공개 사이트는 Sites에 배포되어 있습니다. `dist/`는 다른 정적 호스팅에서도 제공할 수 있습니다. 화면 전환은 URL 해시를 사용하며 별도의 백엔드 API가 필요하지 않습니다. GitHub에 푸시하는 것만으로 현재 Sites 배포가 자동 갱신되지는 않습니다.

라이선스: [Three.js · MIT](dist/THREE-LICENSE.txt), [Pretendard · SIL OFL](dist/fonts/OFL-pretendard.txt).
