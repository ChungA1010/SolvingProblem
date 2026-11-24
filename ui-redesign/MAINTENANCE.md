# 유지보수 안내

이 폴더(`ui-redesign/`)는 CMP Lab 웹사이트다. 이 문서는 **어디에 무엇이 있는지, 고친 뒤 무엇을 돌려야 하는지**만 적는다. 폴더를 누가 맡는지와 폴더 사이의 약속은 [README.md](README.md)에, 화면과 계산을 왜 그렇게 만들었는지는 [문서 지도](#문서-지도)의 각 문서에 있다.

## 사이트 구성

사이트의 뿌리는 이 폴더다. `index.html`이 첫 화면이고, 부분마다 폴더가 하나씩 있다.

| 화면 | 파일 | 상태 |
|---|---|---|
| 모드 선택(홈) | `index.html`, `home/home.css`, `home/home.js`, `home/media/` | 공개 |
| CMP 팩토리(게임) | `factory/game.html`과 그 폴더의 JS·CSS, `factory/cmp-scene.js`, `factory/media/`, `factory/models/` | 공개 |
| 학습 실험실(3D 연마 장비) | `lab-3d/lab-3d.html`과 그 폴더 | 공개 |
| 8대 공정 실험실 | `process-lab/process-lab.html`과 그 폴더 | 공개 (실험판. 홈 화면 위쪽의 탭) |
| 예전 학습 실험실 워크스페이스, MRR 예측, 실험 기록, 학습 가이드, 5회 MRR 도전 | `index.html`의 안쪽 화면(`#lab`, `#prediction` 등). 스크립트는 `factory/`에 있다(`app.js`, `workbench.js`, `mrr-state.js` 등) | 숨김 |
| 장비 시뮬레이터(PHM 재생) | `lab-sim/lab-sim.html`과 그 폴더 | 숨김 |

숨긴 화면은 지우지 않았다. 들어가는 단추와 링크에 `hidden data-parked` 두 속성을 붙여 가렸고, 주소로는 여전히 열린다. 목록과 되살리는 법은 [LAB-3D.md](lab-3d/LAB-3D.md#홈-화면에서-숨겨-둔-것)에 있다.

학습 실험실은 게임과 코드를 나눠 쓰지 않는다. 홈 화면은 실험실의 파일을 불러 쓰지 않는다(2026-11-24에 산화막 색 눈금을 뺐다). 8대 공정 실험실은 학습 실험실의 스타일(`lab-3d/lab-3d.css`)과 막 색 계산(`process-model.js`의 `filmColor`)을 같이 쓰고, 금속배선의 평탄화에서는 학습 실험실의 3D 장면(`lab-3d/scene.js`)과 계산 모델(`process-model.js`) 전체를 불러 쓴다. 학습 실험실의 이 파일들을 고치면 8대 공정 실험실도 확인한다(`check-browser process-cmp`). 어느 폴더가 어느 폴더의 파일을 불러 써도 되는지는 `tools/site-files.cjs`에 적혀 있고 `tests/site-layout.test.cjs`가 지킨다.

## 폴더

| 위치 | 내용 |
|---|---|
| `index.html`, `home/` | 모드 선택 화면과 그 화면만 쓰는 파일 |
| `game.html` | 게임의 옛 주소를 `factory/game.html`로 넘기는 화면 |
| `factory/`, `lab-3d/`, `process-lab/`, `lab-sim/` | 부분마다 한 폴더. 폴더 바로 아래와 `media/`, `models/`는 사이트 그대로이고, 그 안의 `src/`(번들 원본), `tests/`(단위 테스트), `tools/`(그 부분의 도구), `docs/`(기록), `model-source/`(Blender 원본)는 사이트에 올라가지 않는다 |
| `shared/` | 여러 화면이 같이 불러 쓰는 것: `styles.css`(Tailwind 출력)와 그 원본 `src/input.css`, 글꼴, three.js 라이선스 글 |
| `tools/` | 사이트 전체의 빌드, 그림 만들기, 검사, 내보내기 스크립트. `site-files.cjs`가 부분과 화면의 목록, 사이트에 올라가는 파일을 정한다 |
| `tests/` | 사이트 전체에 걸친 테스트: 번들이 원본과 맞는지, 폴더 사이의 약속 |
| `standalone/` | 한 파일 빌드가 나오는 곳. git에 올리지 않는다 |
| `site/` | 올릴 파일만 모은 폴더(`export-site`). git에 올리지 않는다 |
| `evidence/` | 브라우저 검사가 남기는 스크린샷. git에 올리지 않는다 |

미리보기 서버(`server.mjs`)는 이 폴더를 그대로 내보낸다. 손으로 쓴 파일과 만들어진 파일이 섞여 있다(아래 표).

### 만들어지는 파일

아래 파일은 손으로 고치지 않는다. 원본을 고치고 다시 만든다. 사이트가 빌드 없이 열리도록 만들어진 결과도 git에 올린다(`standalone/`, `site/`만 예외).

| 파일 | 원본 | 다시 만들기 |
|---|---|---|
| `lab-3d/scene.js`, `lab-3d/scene.build.json` | `lab-3d/src/lab-3d-scene.js` | `node tools/build-scenes.mjs lab-3d` |
| `process-lab/scene.js`, `process-lab/scene.build.json` | `process-lab/src/*.js` | `node tools/build-scenes.mjs process-lab` |
| `factory/cmp-scene.js` | `factory/src/cmp-scene.js`와 그 옆의 모듈, `factory/models/*.glb` | `npm run build:scene` |
| `shared/styles.css` | `shared/src/input.css`와 HTML에 쓴 Tailwind 클래스 | `npm run build` |
| `factory/models/` | `factory/model-source/`의 Blender 파일 | Blender에서 `factory/tools/export_cmp_model.py`, `factory/tools/export-workshop-models.py` ([factory/model-source/README.md](factory/model-source/README.md)) |
| `factory/media/workshop-catalog/`, `factory/media/shipper/` | Blender 스크립트 | `factory/` 폴더에서 `blender --background --python tools/build-shop-assets.py`, `tools/build-delivery-shipper.py` |
| `home/media/factory.webp` | 게임 그림 세 장(`factory/media/counter-art/`) | `python tools/build-home-art.py` (Pillow 필요) |
| `home/media/lab.webp` | 실제 3D 장비 화면 | `node tools/render-lab-still.mjs` |
| `lab-sim/state-model-v2.json` | 저장소 루트의 `tools/lab_sim/` | [LAB-SIM.md](lab-sim/LAB-SIM.md) |
| `standalone/CMP-Lab.html` | 사이트 전체 | `node tools/build-standalone.mjs` |
| `site/` | 사이트 전체 | `node tools/export-site.mjs` |

나머지 사이트 파일(HTML, 화면별 JS와 CSS)은 손으로 쓴 원본이다. `home/home.css`와 `lab-3d/lab-3d.css`는 Tailwind를 거치지 않는 보통 CSS다. npm이 없는 PC에서는 `shared/styles.css`를 다시 만들 수 없으므로, 그런 PC에서 스타일을 더할 때는 Tailwind 클래스를 새로 쓰지 말고 이 두 파일처럼 CSS 파일에 쓴다.

## 명령

`ui-redesign` 폴더에서 돌린다. Node 22 이상이 필요하다(24에서 확인했다). 브라우저 검사와 그림 찍기에는 Chrome이나 Edge가 필요하다.

```sh
node --test "*/tests/*.test.cjs" "tests/*.test.cjs"   # 단위 테스트 전부. 1초쯤 걸린다 (따옴표째로 쓴다)
node --test "lab-3d/tests/*.test.cjs"                 # 한 부분만: factory, lab-3d, process-lab, lab-sim
node tools/check-browser.mjs       # 브라우저 검사 전부. 오래 걸린다
node tools/check-browser.mjs home  # 일부만. 이름: home, game, lab-hover, lab-operate, lab-panels, lab-lot, process-route, process-<공정>, standalone ("lab", "process"처럼 앞부분만 써도 된다)
node tools/build-scenes.mjs        # 3D 번들 다시 만들기. 이름(lab-3d, process-lab)을 주면 그것만
node tools/build-standalone.mjs    # 사이트 전체를 한 파일로: standalone/CMP-Lab.html
node tools/export-site.mjs         # 올릴 파일만 site/ 폴더에 모으기
node server.mjs                    # 미리보기: http://127.0.0.1:8510/
```

npm이 있으면 `npm test`, `npm run check:browser`, `npm run build:lab3d`, `npm run build:process-lab`, `npm run standalone`, `npm run export`, `npm run preview`가 같은 일을 한다. npm이 꼭 필요한 것은 Tailwind(`build`)를 다시 만들 때뿐이다. 그때는 `npm ci`를 먼저 한다.

npm이 없는 PC에서 `build-scenes`를 쓰려면, npm 패키지 `@esbuild/<운영체제>-<CPU>`와 `three`를 받아 `~/.cache/cmp-lab-build/` 아래에 `esbuild/esbuild`(Windows는 `esbuild.exe`)와 `node_modules/three/`로 풀어 둔다. 버전이 `package.json`에 적힌 것과 다르면 빌드가 멈추고 아무것도 쓰지 않는다. 게임의 3D 번들도 같은 esbuild로 다시 만들 수 있다. `NODE_PATH`를 그 `node_modules`로 두고 `package.json`의 `build:scene`에 적힌 명령을 그대로 돌리면 git에 있는 `factory/cmp-scene.js`와 한 바이트도 다르지 않게 나온다(2026-11-20 확인).

## 고친 뒤에 할 일

| 고친 곳 | 할 일 |
|---|---|
| 어디든 | 단위 테스트 |
| `lab-3d/src/lab-3d-scene.js` (3D 장면, 끌기 조작) | `build-scenes lab-3d` → 단위 테스트 → `check-browser lab`. 장비 모양이 달라졌으면 `render-lab-still`로 홈 그림도 다시 찍는다 |
| `lab-3d/` (화면, 계산) | 단위 테스트 → `check-browser lab`. `lab-3d.css`, `process-model.js`, `scene.js`를 고쳤으면 `check-browser process`도 (특히 `process-cmp`) |
| `process-lab/src/` (8대 공정 실험실의 3D) | `build-scenes process-lab` → 단위 테스트 → `check-browser process` |
| `process-lab/` (화면, 공정 흐름, 계산) | 단위 테스트 → `check-browser process` |
| 홈 화면(`index.html`, `home/`) | `check-browser home` |
| 게임(`factory/`) | [factory/README.md](factory/README.md)의 개발 및 검증. 파일을 더하거나 옮겼으면 `check-browser game`. 파일 이름을 바꾸거나 지웠으면 단위 테스트가 `index.html`과 `lab-sim/lab-sim.html`의 어긋난 줄을 알려 준다 |
| 파일을 옮기거나 폴더를 더했다 | 단위 테스트(`tests/site-layout.test.cjs`). 부분이나 화면이 늘면 `tools/site-files.cjs`에 올린다 |
| 사이트를 파일로 내보낼 때 | `build-standalone` → `check-browser standalone` → `standalone/CMP-Lab.html` 하나를 전달 |
| 사이트를 올릴 때 | `export-site` → `site/` 폴더를 올린다 |

3D 장면의 원본을 고치고 번들을 다시 만들지 않으면 단위 테스트(`tests/scene-bundles.test.cjs`)가 실패한다. 번들과 `scene.build.json`은 원본과 같은 커밋에 넣는다.

### 학습 실험실을 고칠 때

- **부품을 더하거나 뺀다.** 장면(`lab-3d/src/lab-3d-scene.js`의 `register(...)`)과 부품 카드(`lab-3d/app.js`의 `PARTS`) 양쪽에 같은 이름으로 있어야 한다. 어긋나면 `check-browser lab-hover`가 알려 준다.
- **장비 상태 모델을 다시 학습했다.** `lab-sim/state-model-v2.json`의 숫자가 바뀌면 `lab-3d/tool-model.js`의 `MODEL`에 같은 숫자를 옮겨 적는다. 옮기지 않으면 `tests/tool-model.test.cjs`가 실패한다. 손으로 푼 기대값이 든 `lab-3d/tests/lab-3d-tool.test.cjs`도 새 숫자로 다시 푼다.
- **계산을 바꾼다.** `lab-3d/process-model.js`를 고친다. 화면과 무관한 계산이고 `lab-3d/tests/lab-3d-process.test.cjs`가 지킨다. 식의 근거를 적은 [LAB-3D.md](lab-3d/LAB-3D.md#계산)의 표도 함께 고친다.
- **검사용 연결 고리.** `lab-3d/app.js`는 `window.Lab3DDebug`를 남긴다. 브라우저 검사와 홈 그림 찍기가 이것으로 상태를 읽고 장면의 좌표를 얻는다. 여기의 이름을 바꾸면 `tools/check-browser.mjs`와 `tools/render-lab-still.mjs`도 고친다.

### 8대 공정 실험실을 고칠 때

공정에 장비를 붙이는 순서, 표준 조건의 값, 계산의 출처는 [PROCESS-LAB.md](process-lab/PROCESS-LAB.md)에 있다. 검사용 연결 고리는 `window.ProcessLabDebug`(`process-lab/app.js`)다. 계산에 쓰는 상수를 바꿀 때는 출처를 함께 적고, 손으로 계산한 기준값을 테스트에 넣는다.

## 브라우저 검사

`tools/check-browser.mjs`는 헤드리스 브라우저에서 실제 마우스와 키보드 입력으로 화면을 써 보고 결과를 비교한다. 검사마다 스크립트 오류가 없는지, 인터넷으로 나가는 요청이 없는지도 본다.

| 검사 | 보는 것 |
|---|---|
| `home` | 두 모드만 보이고 숨긴 항목은 보이지 않는지, 그림, 그림 아래에 이름·한 줄·단추만 있는지와 맨 위의 CMP 설명 한 줄, 창 크기 다섯 가지(너비 400~1920 px)에서 넘침과 정렬, 키보드 초점, 안쪽 화면을 주소로 열었을 때의 틀, 그림을 눌러 실험실로 가기 |
| `game` | 게임 화면이 제 폴더에서 열리는지: 3D 번들, `shared/`의 스타일과 글꼴, 그림, 스크립트가 주소를 만들어 부르는 손님 그림이 모두 오는지, 모드 선택과 학습 실험실로 가는 링크, 옛 주소(`game.html`)가 넘겨 주는지. 게임의 진행 자체는 보지 않는다(게임 쪽 테스트와 플레이 기록이 본다) |
| `lab-hover` | 장면의 부품과 카드가 일대일인지, 창 크기 두 가지에서 부품마다 제 카드가 뜨고 사라지는지 |
| `lab-operate` | 웨이퍼 장착, 플래튼, 스핀들, 밸브, 구역 조절기, 컨디셔너, 가압, 휠, 연마, 헤드 올리기, 계측까지 부품을 끌어서 한 장을 처리하기. 끄는 동안의 값 표시, 장비 화면 확대, 비상 정지 |
| `lab-panels` | 웨이퍼 두 장을 처리하는 동안 공정 계기 띠와 계측 리포트가 제때 열리고 닫히는지, 3D 화면이 자리를 비켜 주는지, 그래프·요인·49점 지도의 마우스 올림 값, 기록 탭 |
| `lab-lot` | 로트 다섯 장을 끝까지 돌리기: 컨디셔너를 계속 쓰면 패드 수명이 로트 안에서 끝나 경보가 뜨는지, 패드를 바꾼 뒤의 로트 시간, 로트 결과 화면과 안내, 다음 로트, 계측하지 않고 넘긴 웨이퍼 |
| `process-route` | 첫 화면, 공정을 눌러 바로 시작해 공정 기록까지, 앞 공정을 같은 웨이퍼로 다시 하기 (장비 없이 표준 조건으로) |
| `process-flow` | 같은 흐름을 장비를 켠 채로: 누르면 장비가 열리는지, 이 공정 다시, 표준 조건으로 넘기기, 앞 공정으로 돌아가기 |
| `process-<공정>` | 그 공정의 장비: 부품 카드, 실제 마우스 입력으로 한 판을 끝까지 조작해 계측하고 다음 공정으로 넘기기. 지금은 `process-crystal`, `process-oxidation`, `process-photo`, `process-etch`, `process-implant`, `process-plating`, `process-cmp`, `process-eds`, `process-bond` ([PROCESS-LAB.md](process-lab/PROCESS-LAB.md)) |
| `process-all` | 웨이퍼 한 장을 여덟 장비로 처음부터 끝까지 (마우스 대신 각 장비의 조작 함수로). 장비 사이의 넘겨주기 |
| `standalone` | 네트워크를 끊고 한 파일을 열어 홈, 실험실, 게임, 8대 공정 실험실 사이를 오가기. 파일 안에 PHM 재생 데이터가 없는지 |

- 3D는 소프트웨어로 그려서 초당 3프레임쯤 나온다. 동작은 확인하지만 속도와 손맛은 확인하지 못한다. 그것은 실제 그래픽 카드에서 사람이 봐야 한다.
- 스크린샷은 `evidence/browser-check/`에 남는다. 실패한 줄 아래에는 그때의 값이 찍힌다.
- 검사는 느린 화면에 맞춰 기다리는 시간을 잡아 두었다. 검사가 도는 동안 PC가 다른 무거운 일을 하면 시간이 어긋나 실패할 수 있다. 그럴 때는 실패한 검사만 다시 돌려 본다.
- 브라우저를 찾지 못하면 환경 변수 `BROWSER`에 Chrome이나 Edge 실행 파일의 경로를 준다.
- 다른 곳에 만든 한 파일은 `node tools/check-browser.mjs standalone --file <파일>`로 검사한다.
- 내보낸 폴더는 `node tools/check-browser.mjs home game lab-hover --site site`처럼 `--site <폴더>`를 붙여 검사한다. 화면을 그 폴더에서 연다.
- 웨이퍼가 합격인지는 검사하지 않는다. 끌어 준 양에 따라 달라지기 때문이다. 판정 계산은 단위 테스트가 본다.

## 자동 검사

GitHub에 올리면(push, pull request) 두 가지가 돈다.

| 이름 | 파일 | 하는 일 |
|---|---|---|
| Integrity tests | `.github/workflows/tests.yml` | 저장소 루트의 Python 테스트 |
| Web tests | `.github/workflows/web-tests.yml` | 이 폴더의 단위 테스트 전부 |

브라우저 검사는 자동으로 돌지 않는다. 고친 사람이 직접 돌린다.

## 건드리면 안 되는 것

- **PHM에서 나온 데이터.** `lab-sim/data/`(재생 데이터)와 `standalone/`은 git에 올리지 않는다(`.gitignore`). 작업하던 PC의 이 폴더를 통째로 어딘가에 올리면 재생 데이터와 한 파일 빌드가 함께 올라간다. 공개 배포는 `export-site`가 만든 `site/` 폴더로만 한다. 이 도구는 재생 데이터를 넣지 않는다. `build-standalone.mjs --all`로 만든 파일에도 재생 데이터가 들어간다. 그 파일은 밖으로 내보내지 않는다(`check-browser standalone`이 실패로 알려 준다).
- **저장소 루트의 `runs/`, `artifacts/`.** 끝난 실험의 고정된 결과다. 바이트 단위로 해시를 맞춰 두었으므로 내용도 줄바꿈도 바꾸지 않는다(`.gitattributes`).
- **숨겨 둔 화면.** 다시 쓸 수 있게 남겨 둔 것이다. 지우지 않는다.
- **줄바꿈.** 저장소는 LF로 통일되어 있다(`.gitattributes`). 편집기가 CRLF로 저장해도 커밋할 때 LF로 바뀐다.

## 문서 지도

| 문서 | 내용 | 기준 시점 |
|---|---|---|
| [README.md](README.md) | 폴더와 담당, 폴더 사이의 약속, 실행, 2026-11-20에 옮긴 자리 | 현재 |
| [factory/README.md](factory/README.md) | 게임 소개, 실행, 규칙, 게임 쪽 개발 절차 | 2026-11-12 (게임 v45), 경로만 2026-11-20 |
| [lab-3d/LAB-3D.md](lab-3d/LAB-3D.md) | 학습 실험실과 홈 화면. 화면 동작, 조작, 계산 모델과 근거, 숨겨 둔 것 | 현재 |
| [process-lab/PROCESS-LAB.md](process-lab/PROCESS-LAB.md) | 8대 공정 실험실. 화면, 만드는 것, 여덟 장비의 조작과 계산·출처, 표준 조건의 가정값, 장비를 붙이는 법 | 현재 (실험판) |
| [lab-sim/LAB-SIM.md](lab-sim/LAB-SIM.md) | 숨겨 둔 장비 시뮬레이터(PHM 재생, 상태 모델) | 숨긴 상태 그대로 |
| [factory/docs/MODEL_CONNECTION.md](factory/docs/MODEL_CONNECTION.md), [CMP_REQUIREMENTS_REVIEW.md](factory/docs/CMP_REQUIREMENTS_REVIEW.md) | 숨겨 둔 MRR 예측 화면의 API 연결과 요구사항 점검 | 2026-11-02 기록 |
| [factory/docs/GAME-FLOW-QA.md](factory/docs/GAME-FLOW-QA.md), [WORKBENCH-FLOW-QA.md](factory/docs/WORKBENCH-FLOW-QA.md), [WORKSHOP-MODELS-QA.md](factory/docs/WORKSHOP-MODELS-QA.md) | 게임 QA 기록. 글 안의 `dist/…`는 지금의 `factory/…`다 | 2026-11-06 ~ 11-12 기록 |
| [factory/model-source/README.md](factory/model-source/README.md) | Blender 모델 제작 | |

## 알려진 빈틈

- 실제 그래픽 카드에서의 속도, Firefox와 Safari, 휴대폰에서는 확인하지 않았다.
- 게임 3D 번들(`factory/cmp-scene.js`)에는 원본과 맞는지 지켜 주는 테스트가 없다. 학습 실험실과 8대 공정 실험실의 번들에만 있다. 2026-11-20에 폴더를 옮긴 뒤 다시 만들어 git의 것과 같은지는 손으로 확인했다.
- `shared/styles.css`는 npm이 없는 PC에서 다시 만들지 못해, 폴더를 옮긴 뒤의 Tailwind 빌드(`npm run build`)는 돌려 보지 못했다. 입력 파일의 경로(`shared/src/input.css`의 `@source` 두 줄)와 `package.json`의 명령만 새 자리에 맞췄다. 게임의 Blender 스크립트(`factory/tools/*.py`)도 경로만 고쳤고 Blender로 돌려 보지 않았다.
- 같은 일을 하는 코드가 두 벌인 곳이 있다. 3D 공통부(조명, 부품 집기, 시점)가 `lab-3d/src/lab-3d-scene.js` 안과 `process-lab/src/process-lab-scene.js`에 따로 있고, 부품 카드와 계기를 그리는 코드가 `lab-3d/app.js`와 `process-lab/app.js`에 따로 있다. 8대 공정 실험실에 장비가 하나 더 생길 때 합친다.
- 8대 공정 실험실은 공정마다 장비가 하나씩이다(금속배선만 둘). 그 공정 안의 나머지 일은 가정한 값으로 지나가고, 계산의 근거가 약한 곳(패키징, EDS의 상수들)은 [PROCESS-LAB.md](process-lab/PROCESS-LAB.md)에 적혀 있다.
- 쓰이는 곳을 찾지 못한 게임 파일이 있다: `factory/decor-art.js`, `factory/equipment-art.js`, `factory/media/shipper/fosb-*.png`, `factory/media/customer-*-figure.svg`. 합쳐서 약 1.7 MB다. 지우지 않았다.
- 공개 사이트(저장소 README 맨 위의 주소)에는 학습 실험실(3D)과 새 홈 화면이 올라가 있지 않다(2026-11-19 확인). 다시 올릴 때는 주소가 바뀐다: 게임은 `/game`에서 `/factory/game.html`로 가고, 옛 주소는 `game.html`이 넘겨 준다.
- 저장소 루트의 Python 테스트는 pytest가 있어야 돈다. pytest가 없는 PC에서는 GitHub의 Integrity tests 결과로 확인한다.
