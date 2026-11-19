# 유지보수 안내

이 폴더(`ui-redesign/`)는 CMP Lab 웹사이트다. 이 문서는 **어디에 무엇이 있는지, 고친 뒤 무엇을 돌려야 하는지**만 적는다. 화면과 계산을 왜 그렇게 만들었는지는 [문서 지도](#문서-지도)의 각 문서에 있다.

## 사이트 구성

| 화면 | 파일 | 상태 |
|---|---|---|
| 모드 선택(홈) | `dist/index.html`, `dist/home.css`, `dist/home.js` | 공개 |
| CMP 팩토리(게임) | `dist/game.html`과 게임용 JS·CSS, `dist/cmp-scene.js` | 공개 |
| 학습 실험실(3D 연마 장비) | `dist/lab-3d.html`, `dist/lab-3d/` | 공개 |
| 8대 공정 실험실 | `dist/process-lab.html`, `dist/process-lab/` | 공개 (실험판. 홈 화면 위쪽의 탭) |
| 예전 학습 실험실 워크스페이스, MRR 예측, 실험 기록, 학습 가이드, 5회 MRR 도전 | `dist/index.html`의 안쪽 화면(`#lab`, `#prediction` 등) | 숨김 |
| 장비 시뮬레이터(PHM 재생) | `dist/lab-sim.html`, `dist/lab-sim/` | 숨김 |

숨긴 화면은 지우지 않았다. 들어가는 단추와 링크에 `hidden data-parked` 두 속성을 붙여 가렸고, 주소로는 여전히 열린다. 목록과 되살리는 법은 [LAB-3D.md](LAB-3D.md#홈-화면에서-숨겨-둔-것)에 있다.

학습 실험실은 게임과 코드를 나눠 쓰지 않는다. 홈 화면은 실험실의 계산 모델(`dist/lab-3d/process-model.js`)을 불러 산화막 색 눈금을 그린다. 8대 공정 실험실은 학습 실험실의 스타일(`dist/lab-3d/lab-3d.css`)과 막 색 계산(`process-model.js`의 `filmColor`)을 같이 쓴다. 이 둘을 고치면 8대 공정 실험실도 확인한다.

## 폴더

| 위치 | 내용 |
|---|---|
| `dist/` | 사이트 그대로. 미리보기 서버(`server.mjs`)가 이 폴더를 내보낸다. 손으로 쓴 파일과 만들어진 파일이 섞여 있다(아래 표) |
| `src/` | 번들로 묶이는 원본. 3D 장면 세 개(`cmp-scene.js`는 게임, `lab-3d-scene.js`는 학습 실험실, `process-lab-scene.js`와 `process-lab/`은 8대 공정 실험실)와 Tailwind 입력(`input.css`) |
| `tests/` | 단위 테스트(`*.test.cjs`)와 기준 데이터(`fixtures/`) |
| `tools/` | 빌드, 그림 만들기, 검사 스크립트 |
| `model-source/` | 게임 3D 모델의 Blender 원본 |
| `standalone/` | 한 파일 빌드가 나오는 곳. git에 올리지 않는다 |
| `evidence/` | 브라우저 검사가 남기는 스크린샷. git에 올리지 않는다 |

### 만들어지는 파일

아래 파일은 손으로 고치지 않는다. 원본을 고치고 다시 만든다. 사이트가 빌드 없이 열리도록 만들어진 결과도 git에 올린다(`standalone/`만 예외).

| 파일 | 원본 | 다시 만들기 |
|---|---|---|
| `dist/lab-3d/scene.js`, `dist/lab-3d/scene.build.json` | `src/lab-3d-scene.js` | `node tools/build-scenes.mjs lab-3d` |
| `dist/process-lab/scene.js`, `dist/process-lab/scene.build.json` | `src/process-lab-scene.js`, `src/process-lab/*.js` | `node tools/build-scenes.mjs process-lab` |
| `dist/cmp-scene.js` | `src/cmp-scene.js`와 그 옆의 모듈, `dist/models/cmp-polishing-cell.glb` | `npm run build:scene` |
| `dist/styles.css` | `src/input.css`와 HTML에 쓴 Tailwind 클래스 | `npm run build` |
| `dist/models/` | `model-source/`의 Blender 파일 | Blender에서 `tools/export_cmp_model.py`, `tools/export-workshop-models.py` ([model-source/README.md](model-source/README.md)) |
| `dist/media/workshop-catalog/`, `dist/media/shipper/` | Blender 스크립트 | `blender --background --python tools/build-shop-assets.py`, `tools/build-delivery-shipper.py` |
| `dist/media/home/factory.webp` | 게임 그림 세 장(`dist/media/counter-art/`) | `python tools/build-home-art.py` (Pillow 필요) |
| `dist/media/home/lab.webp` | 실제 3D 장비 화면 | `node tools/render-lab-still.mjs` |
| `dist/lab-sim/state-model-v2.json` | 저장소 루트의 `tools/lab_sim/` | [LAB-SIM.md](LAB-SIM.md) |
| `standalone/CMP-Lab.html` | `dist/` 전체 | `node tools/build-standalone.mjs` |

나머지 `dist/` 파일(HTML, 화면별 JS와 CSS)은 손으로 쓴 원본이다. `dist/home.css`와 `dist/lab-3d/lab-3d.css`는 Tailwind를 거치지 않는 보통 CSS다. npm이 없는 PC에서는 `styles.css`를 다시 만들 수 없으므로, 그런 PC에서 스타일을 더할 때는 Tailwind 클래스를 새로 쓰지 말고 이 두 파일처럼 CSS 파일에 쓴다.

## 명령

`ui-redesign` 폴더에서 돌린다. Node 22 이상이 필요하다(24에서 확인했다). 브라우저 검사와 그림 찍기에는 Chrome이나 Edge가 필요하다.

```sh
node --test tests/*.test.cjs       # 단위 테스트. 1초쯤 걸린다
node tools/check-browser.mjs       # 브라우저 검사 전부. 10분쯤 걸린다
node tools/check-browser.mjs home  # 일부만. 이름: home, lab-hover, lab-operate, lab-panels, process-route, process-<공정>, standalone ("lab", "process"처럼 앞부분만 써도 된다)
node tools/build-scenes.mjs        # 3D 번들 다시 만들기. 이름(lab-3d, process-lab)을 주면 그것만
node tools/build-standalone.mjs    # 사이트 전체를 한 파일로: standalone/CMP-Lab.html
node server.mjs                    # 미리보기: http://127.0.0.1:8510/
```

npm이 있으면 `npm test`, `npm run check:browser`, `npm run build:lab3d`, `npm run build:process-lab`, `npm run standalone`, `npm run preview`가 같은 일을 한다. npm이 꼭 필요한 것은 게임 3D 번들(`build:scene`)과 Tailwind(`build`)를 다시 만들 때뿐이다. 그때는 `npm ci`를 먼저 한다.

npm이 없는 PC에서 `build-scenes`를 쓰려면, npm 패키지 `@esbuild/<운영체제>-<CPU>`와 `three`를 받아 `~/.cache/cmp-lab-build/` 아래에 `esbuild/esbuild`(Windows는 `esbuild.exe`)와 `node_modules/three/`로 풀어 둔다. 버전이 `package.json`에 적힌 것과 다르면 빌드가 멈추고 아무것도 쓰지 않는다.

## 고친 뒤에 할 일

| 고친 곳 | 할 일 |
|---|---|
| 어디든 | 단위 테스트 |
| `src/lab-3d-scene.js` (3D 장면, 끌기 조작) | `build-scenes lab-3d` → 단위 테스트 → `check-browser lab`. 장비 모양이 달라졌으면 `render-lab-still`로 홈 그림도 다시 찍는다 |
| `dist/lab-3d/` (화면, 계산) | 단위 테스트 → `check-browser lab`. `lab-3d.css`나 `process-model.js`를 고쳤으면 `check-browser process`도 |
| `src/process-lab-scene.js`, `src/process-lab/` (8대 공정 실험실의 3D) | `build-scenes process-lab` → 단위 테스트 → `check-browser process` |
| `dist/process-lab/` (화면, 공정 흐름, 계산) | 단위 테스트 → `check-browser process` |
| 홈 화면(`dist/index.html`, `home.css`, `home.js`) | `check-browser home` |
| 게임 | [README.md](README.md)의 개발 및 검증 |
| 사이트를 파일로 내보낼 때 | `build-standalone` → `check-browser standalone` → `standalone/CMP-Lab.html` 하나를 전달 |

3D 장면의 원본을 고치고 번들을 다시 만들지 않으면 단위 테스트(`tests/scene-bundles.test.cjs`)가 실패한다. 번들과 `scene.build.json`은 원본과 같은 커밋에 넣는다.

### 학습 실험실을 고칠 때

- **부품을 더하거나 뺀다.** 장면(`src/lab-3d-scene.js`의 `register(...)`)과 부품 카드(`dist/lab-3d/app.js`의 `PARTS`) 양쪽에 같은 이름으로 있어야 한다. 어긋나면 `check-browser lab-hover`가 알려 준다.
- **계산을 바꾼다.** `dist/lab-3d/process-model.js`를 고친다. 화면과 무관한 계산이고 `tests/lab-3d-process.test.cjs`가 지킨다. 식의 근거를 적은 [LAB-3D.md](LAB-3D.md#계산)의 표도 함께 고친다.
- **검사용 연결 고리.** `dist/lab-3d/app.js`는 `window.Lab3DDebug`를 남긴다. 브라우저 검사와 홈 그림 찍기가 이것으로 상태를 읽고 장면의 좌표를 얻는다. 여기의 이름을 바꾸면 `tools/check-browser.mjs`와 `tools/render-lab-still.mjs`도 고친다.

### 8대 공정 실험실을 고칠 때

공정에 장비를 붙이는 순서, 표준 조건의 값, 계산의 출처는 [PROCESS-LAB.md](PROCESS-LAB.md)에 있다. 검사용 연결 고리는 `window.ProcessLabDebug`(`dist/process-lab/app.js`)다. 계산에 쓰는 상수를 바꿀 때는 출처를 함께 적고, 손으로 계산한 기준값을 테스트에 넣는다.

## 브라우저 검사

`tools/check-browser.mjs`는 헤드리스 브라우저에서 실제 마우스와 키보드 입력으로 화면을 써 보고 결과를 비교한다. 검사마다 스크립트 오류가 없는지, 인터넷으로 나가는 요청이 없는지도 본다.

| 검사 | 보는 것 |
|---|---|
| `home` | 두 모드만 보이고 숨긴 항목은 보이지 않는지, 그림과 색 눈금, 창 크기 다섯 가지(너비 400~1920 px)에서 넘침과 정렬, 키보드 초점, 안쪽 화면을 주소로 열었을 때의 틀, 그림을 눌러 실험실로 가기 |
| `lab-hover` | 장면의 부품과 카드가 일대일인지, 창 크기 두 가지에서 부품마다 제 카드가 뜨고 사라지는지 |
| `lab-operate` | 웨이퍼 장착, 플래튼, 스핀들, 밸브, 구역 조절기, 컨디셔너, 가압, 휠, 연마, 헤드 올리기, 계측까지 부품을 끌어서 한 장을 처리하기. 끄는 동안의 값 표시, 장비 화면 확대, 비상 정지 |
| `lab-panels` | 웨이퍼 두 장을 처리하는 동안 공정 계기 띠와 계측 리포트가 제때 열리고 닫히는지, 3D 화면이 자리를 비켜 주는지, 그래프·요인·49점 지도의 마우스 올림 값, 기록 탭 |
| `process-route` | 여덟 공정이 순서대로 보이는지, 중간 공정에서 시작해 공정 기록까지 가는지 (장비 없이 표준 조건으로) |
| `process-<공정>` | 그 공정의 장비: 부품 카드, 실제 마우스 입력으로 한 판을 끝까지 조작해 계측하고 다음 공정으로 넘기기. 지금은 `process-crystal`, `process-oxidation`, `process-photo`, `process-etch`, `process-implant`, `process-plating`, `process-eds`, `process-bond` ([PROCESS-LAB.md](PROCESS-LAB.md)) |
| `standalone` | 네트워크를 끊고 한 파일을 열어 홈, 실험실, 게임, 8대 공정 실험실 사이를 오가기. 파일 안에 PHM 재생 데이터가 없는지 |

- 3D는 소프트웨어로 그려서 초당 3프레임쯤 나온다. 동작은 확인하지만 속도와 손맛은 확인하지 못한다. 그것은 실제 그래픽 카드에서 사람이 봐야 한다.
- 스크린샷은 `evidence/browser-check/`에 남는다. 실패한 줄 아래에는 그때의 값이 찍힌다.
- 검사는 느린 화면에 맞춰 기다리는 시간을 잡아 두었다. 검사가 도는 동안 PC가 다른 무거운 일을 하면 시간이 어긋나 실패할 수 있다. 그럴 때는 실패한 검사만 다시 돌려 본다.
- 브라우저를 찾지 못하면 환경 변수 `BROWSER`에 Chrome이나 Edge 실행 파일의 경로를 준다.
- 다른 곳에 만든 한 파일은 `node tools/check-browser.mjs standalone --file <파일>`로 검사한다.
- 웨이퍼가 합격인지는 검사하지 않는다. 끌어 준 양에 따라 달라지기 때문이다. 판정 계산은 단위 테스트가 본다.

## 자동 검사

GitHub에 올리면(push, pull request) 두 가지가 돈다.

| 이름 | 파일 | 하는 일 |
|---|---|---|
| Integrity tests | `.github/workflows/tests.yml` | 저장소 루트의 Python 테스트 |
| Web tests | `.github/workflows/web-tests.yml` | 이 폴더의 단위 테스트 |

브라우저 검사는 자동으로 돌지 않는다. 고친 사람이 직접 돌린다.

## 건드리면 안 되는 것

- **PHM에서 나온 데이터.** `dist/lab-sim/data/`(재생 데이터)와 `standalone/`은 git에 올리지 않는다(`.gitignore`). 작업하던 PC의 `dist/` 폴더를 통째로 어딘가에 올리면 재생 데이터가 함께 올라가므로, 공개 배포는 git에 있는 파일로만 한다. `build-standalone.mjs --all`로 만든 파일에도 재생 데이터가 들어간다. 그 파일은 밖으로 내보내지 않는다(`check-browser standalone`이 실패로 알려 준다).
- **저장소 루트의 `runs/`, `artifacts/`.** 끝난 실험의 고정된 결과다. 바이트 단위로 해시를 맞춰 두었으므로 내용도 줄바꿈도 바꾸지 않는다(`.gitattributes`).
- **숨겨 둔 화면.** 다시 쓸 수 있게 남겨 둔 것이다. 지우지 않는다.
- **줄바꿈.** 저장소는 LF로 통일되어 있다(`.gitattributes`). 편집기가 CRLF로 저장해도 커밋할 때 LF로 바뀐다.

## 문서 지도

| 문서 | 내용 | 기준 시점 |
|---|---|---|
| [README.md](README.md) | 게임 소개, 실행, 규칙, 게임 쪽 개발 절차 | 2026-11-12 (게임 v45) |
| [LAB-3D.md](LAB-3D.md) | 학습 실험실과 홈 화면. 화면 동작, 조작, 계산 모델과 근거, 숨겨 둔 것 | 현재 |
| [PROCESS-LAB.md](PROCESS-LAB.md) | 8대 공정 실험실. 화면, 만드는 것, 여덟 장비의 조작과 계산·출처, 표준 조건의 가정값, 장비를 붙이는 법 | 현재 (실험판) |
| [LAB-SIM.md](LAB-SIM.md) | 숨겨 둔 장비 시뮬레이터(PHM 재생, 상태 모델) | 숨긴 상태 그대로 |
| [MODEL_CONNECTION.md](MODEL_CONNECTION.md), [CMP_REQUIREMENTS_REVIEW.md](CMP_REQUIREMENTS_REVIEW.md) | 숨겨 둔 MRR 예측 화면의 API 연결과 요구사항 점검 | 2026-11-02 기록 |
| [GAME-FLOW-QA.md](GAME-FLOW-QA.md), [WORKBENCH-FLOW-QA.md](WORKBENCH-FLOW-QA.md), [WORKSHOP-MODELS-QA.md](WORKSHOP-MODELS-QA.md) | 게임 QA 기록 | 2026-11-06 ~ 11-12 기록 |
| [model-source/README.md](model-source/README.md) | Blender 모델 제작 | |

## 알려진 빈틈

- 실제 그래픽 카드에서의 속도, Firefox와 Safari, 휴대폰에서는 확인하지 않았다.
- 게임 3D 번들(`dist/cmp-scene.js`)에는 원본과 맞는지 지켜 주는 테스트가 없다. 학습 실험실과 8대 공정 실험실의 번들에만 있다.
- 같은 일을 하는 코드가 두 벌인 곳이 있다. 3D 공통부(조명, 부품 집기, 시점)가 `src/lab-3d-scene.js` 안과 `src/process-lab-scene.js`에 따로 있고, 부품 카드와 계기를 그리는 코드가 `dist/lab-3d/app.js`와 `dist/process-lab/app.js`에 따로 있다. 8대 공정 실험실에 장비가 하나 더 생길 때 합친다.
- 8대 공정 실험실은 공정마다 장비가 하나씩이다. 그 공정 안의 나머지 일은 가정한 값으로 지나가고, 계산의 근거가 약한 곳(패키징, EDS의 상수들)은 [PROCESS-LAB.md](PROCESS-LAB.md)에 적혀 있다.
- 쓰이는 곳을 찾지 못한 게임 파일이 있다: `dist/decor-art.js`, `dist/equipment-art.js`, `dist/media/shipper/fosb-*.png`, `dist/media/customer-*-figure.svg`. 합쳐서 약 1.7 MB다. 지우지 않았다.
- 공개 사이트(README.md 맨 위의 주소)에는 학습 실험실(3D)과 새 홈 화면이 올라가 있지 않다(2026-11-19 확인).
- 저장소 루트의 Python 테스트는 pytest가 있어야 돈다. pytest가 없는 PC에서는 GitHub의 Integrity tests 결과로 확인한다.
