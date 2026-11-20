# CMP Lab 웹사이트

반도체 CMP 공정을 다루는 교육용 사이트다. 모드 선택 화면(`index.html`)에서 세 곳으로 들어간다: 게임인 CMP 팩토리, 3D 연마 장비를 직접 움직이는 학습 실험실, 8대 공정 실험실.

## 폴더와 담당

사이트는 부분마다 폴더가 하나다. 그 부분의 화면, 원본, 테스트, 문서가 모두 그 폴더 안에 있다. 자기 폴더 안에서만 고치면 다른 사람의 작업과 겹치지 않는다.

| 폴더 | 화면 | 담당 | 안내 문서 |
|---|---|---|---|
| `factory/` | CMP 팩토리 (게임) | KingBeomSoo | [factory/README.md](factory/README.md) |
| `lab-3d/` | 학습 실험실 (3D 연마 장비) | ChungA1010 | [lab-3d/LAB-3D.md](lab-3d/LAB-3D.md) |
| `process-lab/` | 8대 공정 실험실 | ChungA1010 | [process-lab/PROCESS-LAB.md](process-lab/PROCESS-LAB.md) |
| `lab-sim/` | 장비 시뮬레이터 (지금은 숨겨 둠) | ChungA1010 | [lab-sim/LAB-SIM.md](lab-sim/LAB-SIM.md) |

아래는 같이 쓰는 곳이다. 고치기 전에 서로 알린다.

| 위치 | 내용 |
|---|---|
| `index.html`, `home/` | 모드 선택 화면. `home/`에는 이 화면만 쓰는 스타일, 스크립트, 그림 두 장이 있다. `index.html` 안에는 숨겨 둔 예전 화면(입문 체험, 예전 실험 워크스페이스, MRR 예측)의 마크업도 남아 있다 |
| `game.html` | 게임의 옛 주소로 들어온 사람을 `factory/game.html`로 넘기는 한 줄짜리 화면 |
| `shared/` | 여러 화면이 같이 불러 쓰는 것: 기본 스타일시트 `styles.css`(Tailwind 출력, 원본은 `shared/src/input.css`), 글꼴, 라이선스 글 |
| `tools/`, `tests/` | 사이트 전체를 묶고, 검사하고, 내보내는 도구와 그 테스트 |
| `package.json`, `server.mjs`, [MAINTENANCE.md](MAINTENANCE.md), 이 문서 | 명령, 미리보기 서버, 유지보수 안내 |

### 폴더 안의 모양

부분의 폴더는 모두 같은 모양이다.

- 폴더 바로 아래와 `media/`, `models/`: 브라우저가 불러 가는 파일. 사이트에 올라간다.
- `src/`: 3D 번들의 원본. `tests/`: 단위 테스트. `tools/`: 그 부분만 쓰는 도구. `docs/`: 기록. `model-source/`: Blender 원본. 이 폴더들과 `.md` 파일은 사이트에 올라가지 않는다.

### 폴더 사이의 약속

한 부분은 자기 폴더와 `shared/`의 파일만 불러 쓴다. 다른 화면으로 가는 링크는 자유다. 지금 다른 폴더의 파일을 불러 쓰는 곳은 아래가 전부다.

| 쓰는 쪽 | 불러 쓰는 것 | 그래서 |
|---|---|---|
| 8대 공정 실험실 | `lab-3d/lab-3d.css`, `lab-3d/process-model.js`, `lab-3d/scene.js` | 학습 실험실의 이 세 파일을 고치면 8대 공정 실험실도 확인한다 (`check-browser process-cmp`) |
| 모드 선택 화면 | `lab-3d/process-model.js` (산화막 색 눈금) | |
| 모드 선택 화면의 숨긴 화면 | `factory/`의 스크립트 12개(`engine.js`, `app.js` 등), 스타일 2개, 투어 영상 | 게임 쪽에서 이 파일들의 이름을 바꾸거나 지우면 `index.html`의 해당 줄도 고친다 |
| 숨겨 둔 장비 시뮬레이터 | `factory/scene-model.js`, `scene-parts.js`, `cmp-scene.js` | 위와 같다 (`lab-sim/lab-sim.html`) |

이 약속은 `tests/site-layout.test.cjs`가 지킨다. 없는 파일을 가리키거나, 약속에 없는 폴더의 파일을 불러 쓰면 단위 테스트가 실패하고 어느 파일의 어느 줄인지 알려 준다. 약속을 바꾸려면 `tools/site-files.cjs`의 `uses`와 위 표를 함께 고친다.

## 실행

Node.js 22 이상이 있으면 된다. 패키지 설치는 필요 없다.

```sh
cd ui-redesign
node server.mjs        # http://127.0.0.1:8510/
```

| 화면 | 주소 |
|---|---|
| 모드 선택 | <http://127.0.0.1:8510/> |
| CMP 팩토리 | <http://127.0.0.1:8510/factory/game.html> |
| 학습 실험실 | <http://127.0.0.1:8510/lab-3d/lab-3d.html> |
| 8대 공정 실험실 | <http://127.0.0.1:8510/process-lab/process-lab.html> |

서버 없이 `index.html`을 더블클릭해도 열린다(`open-preview.cmd`가 같은 일을 한다).

## 고친 뒤

```sh
node --test "*/tests/*.test.cjs" "tests/*.test.cjs"    # 단위 테스트 전부. 1초쯤
node --test "factory/tests/*.test.cjs"                 # 한 부분만 (factory, lab-3d, process-lab, lab-sim)
node tools/check-browser.mjs                           # 브라우저 검사. 오래 걸린다
```

무엇을 고쳤을 때 무엇을 다시 만들고 돌려야 하는지는 [MAINTENANCE.md](MAINTENANCE.md)에 있다.

## 사이트를 내보낼 때

이 폴더에는 원본과 테스트가 화면 옆에 함께 있으므로, 폴더를 통째로 올리지 않는다.

```sh
node tools/export-site.mjs         # 올릴 파일만 site/ 폴더에 모은다
node tools/build-standalone.mjs    # 사이트 전체를 한 파일로: standalone/CMP-Lab.html
```

## 폴더를 나눈 날 (2026-11-20)

그전에는 사이트 전체가 `dist/` 한 폴더에, 원본은 `src/`에, 테스트는 `tests/`에 섞여 있었다. 내용은 바꾸지 않고 자리만 옮겼다.

| 예전 | 지금 |
|---|---|
| `dist/index.html`, `dist/home.*`, `dist/media/home/` | `index.html`, `home/` |
| `dist/game.html`과 게임 파일, `dist/media/`, `dist/models/` | `factory/` |
| 게임의 `src/*.js`, `tests/*.test.cjs`, `tools/*.py`, `model-source/`, `README.md`, QA 문서 | `factory/src/`, `factory/tests/`, `factory/tools/`, `factory/model-source/`, `factory/README.md`, `factory/docs/` |
| `dist/lab-3d.html`, `dist/lab-3d/`, `src/lab-3d-scene.js`, `LAB-3D.md` | `lab-3d/` (원본은 `lab-3d/src/`) |
| `dist/process-lab.html`, `dist/process-lab/`, `src/process-lab*`, `PROCESS-LAB.md` | `process-lab/` (원본은 `process-lab/src/`) |
| `dist/lab-sim.html`, `dist/lab-sim/`, `LAB-SIM.md` | `lab-sim/` |
| `dist/styles.css`, `dist/fonts/`, `src/input.css` | `shared/` |

옮기기 전의 자리에서 하던 작업이 있으면, 먼저 커밋한 뒤에 이 변경을 병합한다. 고치던 파일은 git이 새 자리로 따라가 합쳐 준다. 옛 자리에 새로 만든 파일은 따라오지 않으므로 손으로 새 폴더에 옮긴다.
