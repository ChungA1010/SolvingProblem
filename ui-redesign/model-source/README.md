# CMP 장비 모델

## 입문 안내용 Blender 렌더

시작 안내의 ‘동작 개념도’는 `cmp-tour-studio.blend`에서 렌더링한 4초 영상입니다. 기존 장비 원본을 재사용하면서 안내 전용 카메라·조명·재질·접근/연마/분리 키프레임을 설정했습니다. 실험용 GLB, 계산 모델, 실시간 연마 애니메이션은 수정하지 않습니다.

- 제작 스크립트: `../tools/render_tour_machine.py`
- 웹 자산: `../dist/media/cmp-tour-poster.webp`, `cmp-tour-motion.webm`, `cmp-tour-motion.mp4`
- 24fps / 96프레임 / 720×562, 음성 없음. 재생 시간과 간격은 교육용 표현입니다.
- 안내의 두 번째 단계에서 한 번 재생하며, 일시정지·다시 보기·모션 축소 설정을 지원합니다. 재생은 도전 기회나 실험 기록을 변경하지 않습니다.

`ui-redesign`에서 원본을 다시 렌더링할 수 있습니다.

```text
blender --background --python tools/render_tour_machine.py -- --preview
blender --background --python tools/render_tour_machine.py -- --animation
ffmpeg -framerate 24 -i model-source/tour-frames/frame-%04d.png -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libvpx-vp9 -crf 31 -b:v 0 -row-mt 1 -an dist/media/cmp-tour-motion.webm
ffmpeg -framerate 24 -i model-source/tour-frames/frame-%04d.png -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -movflags +faststart -an dist/media/cmp-tour-motion.mp4
```

포스터 PNG는 Pillow 등으로 WebP(quality 88)로 변환합니다. 프레임은 `tour-frames/`에 저장되며 웹 실행에 필요하지 않습니다.

## 실험실 장비 원본

이 프로젝트를 위해 Blender 4.5.15 LTS에서 직접 제작한 교육용 장비입니다. EBARA F-REX300X의 공개 구성 자료를 참고해 연마부 1개를 재구성했습니다. 외부 업체 CAD나 다운로드한 유료/무료 모델은 사용하지 않았습니다. 장비 치수, 부품 구조, 재료의 시각적 특성은 설명용 가정이며 제조 도면이나 물성 데이터가 아닙니다. PHM 데이터 수집 장비를 특정한 것도 아닙니다.

## 참고 장비와 재구성 범위

- [EBARA 기술보고 237호, 신형 CMP 장비 F-REX300X](https://www.ebara.co.jp/jihou/archive/year/detail/__icsFiles/afieldfile/2021/09/22/237_10.pdf): 테이블·톱링·드레서 각각 4개, 연마·이송·세정 유닛 구성을 참고했습니다. 공개 검색 색인에서 구성 표를 확인했으며, PDF 직접 열기는 업체의 전자책 주소로 연결됩니다.
- [EBARA 공식 제품 카탈로그, 인쇄면 20쪽](https://www.ebara.com/content/dam/ebara/grand-masters/entities/en/products/precision-pump/pdf/80002E_26_7.pdf): F-REX300X의 300mm 웨이퍼, 4 테이블·4 헤드, 테이블당 헤드 하나 구성을 확인했습니다.
- [Applied Materials의 CMP 원리 설명](https://www.appliedmaterials.com/il/en/semiconductor/semiconductor-technologies/cmp.html): 헤드는 뒷면에 가압하고 앞면이 회전 패드와 접촉하는 방향을 교차 확인했습니다.

이 모델은 전체 장비 중 연마부 하나만 보여줍니다. 낮은 회전 지지 기둥과 암, 얇은 패드, 편심 헤드, 별도 컨디셔너와 슬러리 공급을 배치했습니다. 컨디셔너는 세정 컵 위 대기 위치로 표시하며 공정에 영향을 주지 않습니다. 공개 자료에서 헤드 내부 CAD·정확한 치수·축 간 거리는 확인하지 못했으므로 세부 비율은 제작자가 정한 값입니다. 패드/웨이퍼 지름 비 6.4/2.3, 지지 암 높이 등은 장비 사양으로 인용하면 안 됩니다. 실제 장비의 4개 테이블을 PHM Stage A/B에 대응시키지도 않습니다.

- 편집 원본: `cmp-polishing-cell.blend` (부품별 이름과 Bevel modifier 유지)
- 웹 모델: `../dist/models/cmp-polishing-cell.glb` (Y-up, 내장 buffer, 외부 이미지 없음)
- 원형 생성: `../tools/build_cmp_model.py`
- 편집 원본 내보내기: `../tools/export_cmp_model.py`

## Blender에서 편집한 뒤 웹에 반영

1. 원본 `.blend`를 열고 부품을 수정하여 저장합니다.
2. `ui-redesign` 폴더에서 다음 명령을 실행합니다. `blender`는 설치된 Blender 실행 파일 경로로 대체할 수 있습니다.

```text
blender --background model-source/cmp-polishing-cell.blend --python tools/export_cmp_model.py
npm run build
npm test
```

내보내기는 파일을 연 메모리에서 미리보기 위치를 초기화하고 부품을 묶어 GLB를 만듭니다. 저장된 `.blend`는 변경하지 않습니다. `build_cmp_model.py`는 원형을 다시 생성하므로 수작업 편집 후에는 실행하지 마세요.

## 애니메이션 연결 규칙

다음 Empty 이름과 역할을 유지하고, 새 부품은 해당 Empty 아래에 배치합니다. Blender 축은 Z-up이며 생성 스크립트의 Y-up 좌표는 `(x, -z, y)`로 변환됩니다.

| Empty | 역할 / 로컬 기준 |
| --- | --- |
| CmpStatic | 고정 프레임·배관·베이스·대기 중 컨디셔너 |
| CmpPadRotor | 회전 플래튼, 중심 원점 |
| CmpPadSurface | 패드, CmpPadRotor의 자식. 원본 윗면 Y=0.48, 바닥 Y=0.42 |
| CmpHeadAssembly | 회전 헤드, 원점은 웨이퍼 윗면. 웹 높이 배율 0.70 |
| CmpHeadCover | 헤드 외장, CmpHeadAssembly의 자식 |
| CmpRetainer | 속이 빈 고정 링, 원점은 연마 접촉면 |
| CmpWafer | 노치가 있는 웨이퍼, 원본 두께 0.075, 바닥 원점. 위는 Silicon_Back, 아래만 Device_Front |
| CmpFilm | 앞면 연마층, 높이 1, 바닥 원점. 아래면만 Device_Front, 웹에서 두께 조절 |
| CmpSpindle / CmpBellows | 축과 주름 커버, 높이 1, 중앙 원점. 웹에서 길이 조절 |

현재 GLB는 약 5.56 MB이며 16만 삼각형·40개 재질별 묶음 이내입니다. `npm test`에서 역할 이름, 중심이 빈 링, 접촉 기준면, 앞면 패턴이 아래쪽에만 배정되는지, 외부 리소스 의존 여부와 크기 예산을 검사합니다.

## 실시간 장비와 부품 설명

실시간 장비는 안내 영상과 같은 사선 구도, 직교 카메라, 밝은 스튜디오 조명과 재질을 사용합니다. 영상으로 대체하지 않고 기존 회전·하강·연마 애니메이션을 유지하므로 입력 조건과 재생 조작에 반응합니다. Blender 렌더와 웹 렌더의 광원 계산 차이 때문에 완전히 같은 픽셀을 출력하지는 않습니다.

마우스를 올리면 부품이 은은하게 강조되고 역할 설명이 나타납니다. 클릭 또는 터치하면 설명을 고정하고, 닫기 버튼·빈 공간 클릭·Esc로 닫습니다. 키보드 사용자는 ‘부품 역할 보기’ 목록에서도 같은 설명을 선택할 수 있습니다. 화면 회전 드래그는 부품 선택과 구분합니다. 상시 라벨은 단면 보기에서만 표시합니다.

내보내기 스크립트는 부품을 묶기 전에 정점 속성 `_CMP_PART`를 부여합니다. Three.js 로더에서는 `_cmp_part`로 읽으며, 광선과 교차한 삼각형의 ID로 원래 부품을 식별합니다. 재질별 묶음을 유지하므로 설명을 위해 그리기 호출을 늘리지 않습니다. `dist/scene-parts.js`는 헤드·웨이퍼·연마층·리테이너 링·패드·플래튼·슬러리 공급부·컨디셔너·스핀들·지지 암·베이스의 11개 설명을 공유합니다. 단면 절단면에도 웨이퍼/연마층 ID를 지정합니다.

부품 이름이나 역할을 변경할 때는 `tools/export_cmp_model.py`의 `part_id`와 설명을 함께 확인하세요. 테스트는 모든 삼각형이 하나의 유효한 부품 ID에 속하는지, 11개 부품이 모두 포함되는지 검사합니다.

## 웹 표현

GLB 바이트를 번들에 포함하므로 `file://`에서 모델을 별도로 fetch하지 않습니다. 회전·하강·분리는 기존 재생 프레임을 공유합니다. 패드 눌림은 웨이퍼 접촉 주변에만 적용하는 시각적 변형이며 접촉 해석 결과가 아닙니다. ‘접촉부 단면’은 헤드·고정 링·웨이퍼·앞면 막의 앞쪽을 잘라 보여주고 웨이퍼/막 절단면을 채웁니다. ‘헤드 투명하게 보기’는 별도로 사용할 수 있습니다.

| 표시 계수 (무차원, 실측값 아님) | 일반 보기 | 단면 보기 |
| --- | --- | --- |
| 패드 두께 / 최대 눌림 | 0.06 / 0.0015 | 0.24 / 0.10 |
| 웨이퍼 두께 | 0.018 | 0.075 |
| 시작 연마층 두께 | 0.006 | 0.15 |
| 접근 전 간격 | 0.38 | 0.38 |

단면의 패드 눌림과 각 층 두께는 서로 다른 표시 계수로 확대하므로 통일된 실측 배율이 아닙니다. 두 보기 모두 같은 제거 비율과 시점·회전값을 쓰며, 전환해도 재생·계산·저장 데이터는 변경되지 않습니다. 표면 펼침도는 아래쪽 앞면을 별도로 펼친 도식입니다.
