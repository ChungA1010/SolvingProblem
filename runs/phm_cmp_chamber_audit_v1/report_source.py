"""Complete the target-free chamber audit with group checks and a raw-trace figure."""
from pathlib import Path
import json
import argparse

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from cmp_ml.common import read_json, write_json, sha256
from cmp_ml.chamber_audit import ROOT, SIGNALS, KEY


def report(run, raw_root):
    if (run/'README.md').exists():
        raise FileExistsError('Completed reports are immutable; use a new run')
    protocol=read_json(run/'protocol.json')
    for name,digest in read_json(run/'artifact_manifest.json').items():
        assert sha256(run/name)==digest, name
    summary=read_json(run/'summary.json')
    b=pd.read_csv(run/'blocks.csv.gz')
    b=b[b.strong].copy()
    if b.empty:
        raise ValueError('No strong match; a figure is not appropriate for this result')
    meta=pd.read_csv(run/'segments.csv.gz').set_index('segment')
    manifest_path=ROOT/'runs/phm_cmp_papers_v1/manifest.csv'
    manifest=pd.read_csv(manifest_path)
    manifest=manifest[manifest.cohort.eq('training')].set_index('sample_id')
    qg=b.q_sample.map(manifest.group_id)
    pg=b.p_sample.map(manifest.group_id)
    assert qg.notna().all() and pg.notna().all()
    shared=b.apply(lambda r:bool(set(r.q_source_files.split(';'))&set(r.p_source_files.split(';'))),axis=1)
    group_checks={'manifest_sha256':sha256(manifest_path),'strong_blocks':len(b),
        'same_file_group_blocks':int(qg.eq(pg).sum()),'different_file_group_blocks':int(qg.ne(pg).sum()),
        'shared_raw_file_blocks':int(shared.sum()),
        'scope':'Original Train wafer/file groups only; no official Validation/Test signal audit or inner-CV leakage conclusion.'}
    write_json(run/'group_checks.json',group_checks)

    # A normal-length, same-Stage example with one observed preceding own primary segment.
    # The deterministic illustration selection is descriptive, not an evaluation subset.
    eligible=b[b.same_stage & b.rows.between(40,200)].copy()
    eligible=eligible[eligible.q_segment.map(meta.own_primary_candidates).eq(1)]
    eligible['median_diff']=(eligible.rows-eligible.rows.median()).abs()
    r=eligible.sort_values(['median_diff','q_segment','p_segment'],kind='stable').iloc[0]
    paths=sorted(set(r.q_source_files.split(';'))|set(r.p_source_files.split(';')))
    chunks=[]
    for name in paths:
        path=raw_root/name
        assert sha256(path)==protocol['sources_expected'][name]
        chunks.append(pd.read_csv(path))
    raw=pd.concat(chunks,ignore_index=True).drop_duplicates(KEY+SIGNALS)
    raw=raw.loc[~raw.duplicated(KEY,keep=False)].sort_values(KEY,kind='stable')
    q=raw[raw.WAFER_ID.eq(r.q_wafer)&raw.STAGE.eq(r.q_stage)&raw.CHAMBER.eq(r.q_chamber)&raw.TIMESTAMP.between(r.q_start,r.q_end)]
    p=raw[raw.WAFER_ID.eq(r.p_wafer)&raw.STAGE.eq(r.p_stage)&raw.CHAMBER.eq(4 if int(r.route)==456 else 1)&raw.TIMESTAMP.between(r.p_start,r.p_end)]
    assert len(q)==len(p)==r.rows
    assert np.array_equal(q.TIMESTAMP.to_numpy(),p.TIMESTAMP.to_numpy())
    assert np.array_equal(q[SIGNALS].to_numpy(),p[SIGNALS].to_numpy())
    own=meta[meta.sample_id.eq(r.q_sample)&meta.primary&meta.start.eq(r.q_own_primary_start)].iloc[0]
    ref=meta.loc[r.p_segment]
    t0=own.start
    plt.rcParams.update({'font.family':'Malgun Gothic','axes.unicode_minus':False,'font.size':10})
    fig,ax=plt.subplots(3,1,figsize=(11,8),gridspec_kw={'height_ratios':[1.2,1,1]},constrained_layout=True)
    fig.suptitle('다른 웨이퍼의 두 챔버에 같은 시각·같은 센서값이 기록됨',fontsize=15,fontweight='bold')
    labels=['대상 웨이퍼의 앞선 주 연마','대상 웨이퍼의 후속 챔버 6','다른 웨이퍼의 주 연마 챔버 4']
    for y,(a,z,color) in enumerate([(own.start,own.end,'#94a3b8'),(r.q_start,r.q_end,'#2563eb'),(ref.start,ref.end,'#f97316')]):
        ax[0].broken_barh([(a-t0,z-a)],(y-.23,.46),facecolors=color)
    ax[0].axvspan(r.q_start-t0,r.q_end-t0,color='#16a34a',alpha=.12,label=f'19개 신호가 연속 {int(r.rows)}행 일치')
    ax[0].set_yticks(range(3),labels); ax[0].invert_yaxis();ax[0].set_xlabel('대상 주 연마 시작 이후 시간 (원본 timestamp 단위)')
    ax[0].legend(loc='upper right',fontsize=9)
    for axis,col,name in zip(ax[1:],['CENTER_AIR_BAG_PRESSURE','SLURRY_FLOW_LINE_A'],['중앙 압력','슬러리 A 유량']):
        t=q.TIMESTAMP.to_numpy()-r.q_start
        axis.plot(t,q[col].to_numpy(),color='#2563eb',linewidth=3,label='대상 후속 챔버')
        axis.plot(t,p[col].to_numpy(),color='#f97316',linewidth=1.5,linestyle='--',label='다른 웨이퍼 주 연마')
        axis.set_ylabel(name+' (공개 데이터 척도)');axis.set_xlabel('일치 구간 시작 이후 시간 (원본 timestamp 단위)')
        axis.grid(alpha=.2);axis.legend(loc='upper right',fontsize=9)
    ax[0].set_title(f'Train / {paths[0]} / Stage {r.q_stage} / 대상 {int(r.q_wafer)} / 상대 {int(r.p_wafer)}',fontsize=10)
    fig.savefig(run/'simultaneous_example.png',dpi=160)
    plt.close(fig)
    write_json(run/'illustration.json',{'selection':'Same Stage, 40-200 matching rows, one prior own primary segment; closest length to eligible median, tie by segment IDs.',
        'query_sample':r.q_sample,'reference_sample':r.p_sample,'q_segment':int(r.q_segment),'p_segment':int(r.p_segment),
        'verified_raw_rows':len(q),'all_19_signals_exact':True,'identical_timestamps':True,
        'row_fingerprints_sha256':__import__('hashlib').sha256(q[SIGNALS].to_numpy(float).tobytes()).hexdigest(),
        'raw_source_files':paths,'no_removal_rate_values_used':True})
    Path(run/'report_source.py').write_bytes(Path(__file__).read_bytes())
    rows=[]
    for c in summary['rows_by_condition']:
        rows.append(f"| {c['STAGE']} / {c['route']} | {c['secondary_rows']:,} | {c['any_strong_rows']:,} | {100*c['any_strong_rows']/c['secondary_rows']:.2f}% |")
    content=f'''# Train 챔버 신호 출처 점검

**후속 챔버와 다른 웨이퍼의 주 연마 챔버에 동일 시각·동일 센서 신호가 반복 기록되는 현상을 확인했다.**
강한 일치는 {summary['strong_blocks']:,}개 구간, 후속 챔버를 가진 {summary['sample_counts']['strong_any_blocks']:,}개 wafer-stage에서 발견됐다.
이 일치는 모두 상대 웨이퍼의 주 연마가 더 늦게 시작해 대상 후속 공정과 시간상 겹치는 경우였다.
이번 기준에서 같은 Stage의 **이전** 웨이퍼 주 연마와 지연 복사로 일치한 강한 구간은 0개다.
따라서 논문 3의 이전 웨이퍼 복사라는 설명을 우리 Train에서 그대로 확인했다고 결론 내리지 않는다.

## 확인 범위와 결과

- Train 원본 185개 파일, {summary['raw_rows']:,}행, wafer-stage {summary['samples']:,}개를 모두 조사했다. 학습 시 제외했던 4개 표본도 이번 신호 조사에는 포함했다.
- 제거율 파일, 공식 Validation/Test 입력·정답을 읽지 않았다. 모델 재학습과 성능 비교는 수행하지 않았다.
- 동일 키·동일 센서의 중복 {summary['exact_duplicate_records']:,}행을 한 번만 셌다. 같은 키인데 센서값이 다른 {summary['conflicting_keys']:,}개 timestamp 키의 {summary['conflicting_unique_rows']:,}개 고유 행은 평균하지 않고 검사에서 제외했다. 그 경계에서 연속 구간을 끊었다. 기존 학습 데이터는 수정하지 않았다.
- 정리 후 후속 챔버 {summary['secondary_rows']:,}행 중 {summary['strong_covered_secondary_rows']:,}행({100*summary['strong_covered_secondary_rows']/summary['secondary_rows']:.2f}%)이 강한 일치 구간에 속한다. 분모는 검사 가능한 후속 챔버 행이다.
- wafer-stage 기준 {summary['sample_counts']['strong_any_blocks']:,}/{summary['samples']:,}개({100*summary['sample_counts']['strong_any_blocks']/summary['samples']:.2f}%)에서 관찰했다. 나머지가 독립 신호라는 뜻은 아니다. Train에 대응하는 웨이퍼가 없거나, 구간이 짧거나, 신호 변화가 부족하면 이 기준으로 확인하지 못한다.

| Stage / route | 검사 후속 챔버 행 | 강한 일치에 포함된 행 | 해당 비율 |
|---|---:|---:|---:|
{chr(10).join(rows)}

같은 Stage의 더 늦게 시작한 상대와 일치한 대상은 690개, 다른 Stage의 상대와 일치한 대상은 49개다. 한 대상이 두 범주에 포함돼 합계는 738개다.
하나의 행이 여러 후보 구간에 속할 수 있어, 행 비율은 구간 길이 합계가 아닌 중복 제거한 행 집합으로 계산했다.

## 판정 기준과 검증

19개 센서가 **모두 정확히 같은 값**이며 timestamp 이동량이 일정하고, 양쪽에서 10행 이상 연속인 구간을 찾았다.
관측 간격 60 초과와 충돌 timestamp에서는 구간을 끊었다. 원본 timestamp 단위이며 실제 초 단위라고 보장하지 않는다.
사용량을 제외한 센서 두 개 이상에서 각각 서로 다른 값 세 개 이상이 나타나야 강한 일치로 분류했다.
일정한 설정값이나 사용량 증가만 같아서는 강한 근거가 되지 않는다. 기준은 제거율을 보지 않고 고정한 검사 규칙이며 논문 저자의 판정식이나 통계적 유의성 기준은 아니다.

해시는 후보 검색에만 썼고 {summary['verified_exact_row_pairs']:,}개 후보 행 쌍에서 19개 값을 직접 대조했다.
10행 이상인 {summary['blocks_min_10_rows']:,}개 구간 모두를 탐지용 행 쌍 테이블 없이 원래 신호 배열의 구간으로 다시 확인했다.
이 중 강한 기준을 충족한 {summary['strong_blocks']:,}개는 모두 시간 이동량 0이었다.
같은 시각의 반복 기록은 확실하지만, 어떤 물리 센서의 값을 어느 웨이퍼에 귀속해야 하는지 또는 소프트웨어가 어떤 방향으로 복사했는지는 이 검사만으로 알 수 없다.

![같은 시각에 중복 기록된 센서 구간](simultaneous_example.png)

위 그림은 길이가 보통인 같은 Stage 사례를 규칙으로 골랐다. 원본 파일을 다시 읽어 {int(r.rows)}행·19개 신호와 timestamp의 완전 일치를 확인했다.
그림의 두 신호 곡선은 값이 같아 겹친다. 자세한 선정 규칙과 원본 파일은 [illustration.json](illustration.json)에 있다.

## 기존 검증 분할에 미치는 의미

강한 일치 {len(b):,}개 구간 모두 같은 원본 파일을 공유하며 기존 wafer/file 연결 그룹도 같다.
따라서 **그룹을 온전히 분리하는 기존 바깥 검증에서는 이번에 발견한 Train 내부 일치 쌍이 양쪽 그룹으로 갈라지지 않는다.**
wafer만 나누는 내부 CV나 공식 Train/Validation/Test 사이의 기록 중복은 이번 조사로 확인하지 않았다.
이 결과를 전체 파이프라인에 누수가 없다는 증명으로 해석하지 않는다. [그룹 확인](group_checks.json).

## 오차 감소 실험에 대한 판단

이 결과는 후속 챔버 통계가 현재 웨이퍼 자체의 연마만 표현하지 않을 수 있다는 근거다.
공유 장비 센서가 여러 웨이퍼 행에 기록됐을 가능성도 있어, 원인과 기록 구조를 구분해야 한다.
다른 웨이퍼의 동시 공정 상태가 예측에 유용할 수도 있으므로 해당 입력을 무조건 삭제하면 성능이 좋아진다고 말할 수 없다.

다음 제한된 비교는 **기존 P2 전체 특징 vs secondary 특징 제외**가 적절하다.
같은 표본·분할·이력 정책·모델 설정·특징 선택/가중치 계산 절차를 유지하고, 입력 변경에 따른 재학습 효과를 비교한다.
동시 공정 문맥으로 따로 표현하는 후보는 그 다음에 추가한다. 이전 웨이퍼로 재배정하는 후보는 이번 근거로 정당화되지 않는다.
선택은 Train 내부에서 하고, 바깥 그룹·시간순 결과와 기존 공식 참고 평가를 구분한다. 현재까지 오차가 줄었다는 신규 결과는 없다.

## 재현과 산출물

```powershell
python -m cmp_ml.chamber_audit --run-dir runs/my_chamber_audit
python tools/report_chamber_audit.py --run-dir runs/my_chamber_audit
python -m pytest tests/test_chamber_audit.py -q
```

기존 캐시를 재사용하지 않고 원시 Train 공정 파일을 읽으며, 185개 파일의 해시를 기존 실험 출처와 확인한다.
이미 존재하는 run 폴더는 덮어쓰지 않는다. 데이터 원본은 저장소에 포함하지 않는다.

- [고정 검사 기준·입력 해시](protocol.json), [요약](summary.json), [직접 값 재검증](verification.json)
- [전체 연속 일치 구간](blocks.csv.gz), [개별 챔버 구간](segments.csv.gz), [wafer-stage별 집계](samples.csv)
- [조건별 행 집계](condition_summary.csv), [동일 timestamp 충돌 키](conflicting_keys.csv), [긴 사례 목록](examples.csv)
- [분석 소스 스냅샷](audit_source.py), [그림·보고서 소스 스냅샷](report_source.py), [파일 무결성 목록](artifact_manifest.json)
- [이 검사를 시작한 논문 검토](../../docs/paper-guided-next-experiments.md)

검사 결과는 기록 일치에 대한 기술적 분석이며 물리적 인과관계, 라벨 오류, 모델 정확도 개선의 증명이 아니다.
'''
    (run/'README.md').write_text(content,encoding='utf-8')
    write_json(run/'artifact_manifest.json',{p.name:sha256(p) for p in sorted(run.iterdir()) if p.name!='artifact_manifest.json'})
    print(json.dumps(group_checks,ensure_ascii=False))


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_chamber_audit_v1')
    p.add_argument('--raw-root',type=Path,default=ROOT.parent/'.tmp_phm_review/PHM/Dataset/CMP1/CMP-data/training')
    a=p.parse_args();report(a.run_dir.resolve(),a.raw_root.resolve())
