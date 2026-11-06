# CMP Lab — 입문 체험과 학습 실험실

**[공개 웹사이트 바로가기](https://cmp-lab-semiholic-2026.a4991698.chatgpt.site)**

압력·Wafer 회전·Stage 회전·Slurry C 유량을 조절하고 3D 연마 과정과 결과를 확인하는 교육용 웹사이트입니다. 입문 체험과 학습 실험실의 계산은 가정 기반 수식입니다. 이 로컬 사본에는 별도 Python Ridge API를 호출하는 '데이터 기반 MRR' 화면을 추가했습니다. 연결·실행 범위는 [모델 연결 안내](MODEL_CONNECTION.md)를 참고하세요. 공개 사이트에 자동 반영되지는 않습니다.

## 주요 기능

- 입문 체험: 시작 안내 → 조건 선택 → 시뮬레이터 → 결과 확인
- 목표 MRR에 접근하는 5회 도전, 오차 비교와 시도 기록
- 학습 실험실: 조건별 계산, 실험 비교·해설, 학습 과제
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
- `dist/engine.js`, `mission-model.js`, `learning-model.js`: 계산·도전·학습 로직
- `src/input.css`: Tailwind CSS 원본 → `dist/styles.css`
- `src/cmp-scene.js`: Three.js 원본 → `dist/cmp-scene.js`
- `dist/scene-parts.js`: 부품 이름과 역할 설명
- `dist/models/`, `dist/media/`, `dist/fonts/`: 웹 실행 자산
- `model-source/`, `tools/`: 편집 가능한 Blender 원본과 생성·내보내기 스크립트
- `tests/`: Node.js 기본 테스트 러너로 실행하는 96개 테스트

일반 JavaScript 모듈은 `dist/`에서 직접 편집합니다. CSS·Three.js 원본이나 GLB를 변경했다면 다시 빌드해야 합니다. Blender 수정 절차와 장비 재구성 범위는 [모델 안내](model-source/README.md)를 참고하세요.

## 계산과 기록의 범위

MRR은 공개한 교육용 수식으로 계산합니다. 회전·유량의 백분율은 가상 기준값이며, 6초 애니메이션은 실제 공정 시간이 아닙니다. 3D의 부품 치수·변형은 설명용 가정이며, 눌림과 층 두께는 단면에서 확대해 표시합니다.

기록은 각 브라우저의 localStorage에 저장됩니다. 로그인이나 공유 데이터베이스가 없으며, 로컬 주소의 기록은 공개 사이트로 자동 이전되지 않습니다.

## 배포

현재 공개 사이트는 Sites에 배포되어 있습니다. `dist/`는 다른 정적 호스팅에서도 제공할 수 있습니다. 화면 전환은 URL 해시를 사용하며 별도의 백엔드 API가 필요하지 않습니다. GitHub에 푸시하는 것만으로 현재 Sites 배포가 자동 갱신되지는 않습니다.

라이선스: [Three.js · MIT](dist/THREE-LICENSE.txt), [Pretendard · SIL OFL](dist/fonts/OFL-pretendard.txt).
