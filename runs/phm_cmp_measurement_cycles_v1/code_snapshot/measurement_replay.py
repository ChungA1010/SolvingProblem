"""Deterministic, event-gated measurement replay shared by research and the UI."""
from __future__ import annotations

from dataclasses import dataclass
import math


@dataclass(frozen=True)
class ReplayOptions:
    period: int = 1
    delay: int = 0
    mode: str = 'separate'
    alpha: float = .4
    offset: int | None = None

    def __post_init__(self):
        if self.period not in (1,5,10) or self.delay not in (0,5):raise ValueError('Invalid measurement schedule')
        if self.mode not in ('separate','shared'):raise ValueError('Invalid tracking mode')
        if not math.isfinite(self.alpha) or not .05<=self.alpha<=1.:raise ValueError('alpha must be in [0.05, 1]')
        if self.offset is not None and not 0<=self.offset<self.period:raise ValueError('Invalid phase offset')


class Replay:
    def __init__(self, records, train_ids, query_ids, options:ReplayOptions):
        self.options=options
        self.records={r['sample_id']:dict(r) for r in records}
        self.queries=sorted((self.records[i] for i in query_ids),key=lambda r:(r['start'],r['sample_id']))
        if not self.queries:raise ValueError('No replay observations')
        cutoff=self.queries[0]['start']
        train=[self.records[i] for i in train_ids]
        if any(r['end']>=cutoff for r in train):raise ValueError('Training crosses evaluation time')
        if set(r['wafer_id'] for r in train)&set(r['wafer_id'] for r in self.queries):
            raise ValueError('Training/evaluation wafer overlap')
        phase=options.period-1 if options.offset is None else options.offset
        allowed=set(train_ids)|set(query_ids)
        self.events=[]
        self.release={}
        self.selected=set()
        for r in self.records.values():
            if r['table']!='ch4':raise ValueError('Replay supports A456/B456 on ch4 only')
            when=r['release5'] if options.delay else r['end']
            if r['ordinal']%options.period==phase:
                self.selected.add(r['sample_id'])
                if r['sample_id'] in allowed and when is not None:
                    self.release[r['sample_id']]=float(when)
                    self.events.append((float(when),r['sample_id']))
        self.events.sort()
        initial=[r for r in train if self.release.get(r['sample_id'],math.inf)<cutoff]
        self.means={}
        for recipe in ('A456','B456'):
            values=[r['mrr'] for r in initial if r['recipe']==recipe]
            if not values:raise ValueError('No measured training baseline for '+recipe)
            self.means[recipe]=sum(values)/len(values)
        self.initial_measurements=len(initial)
        self.cursor=0;self.event_cursor=0;self.clock=cutoff
        self.numerators={};self.denominators={};self.counts={};self.latest={}
        self.published=set();self.rows=[]
        self._publish(cutoff)

    def _publish(self,clock):
        while self.event_cursor<len(self.events) and self.events[self.event_cursor][0]<clock:
            when,sid=self.events[self.event_cursor];self.event_cursor+=1
            if sid in self.published:raise AssertionError('Duplicate measurement event')
            self.published.add(sid);r=self.records[sid]
            group='ch4' if self.options.mode=='shared' else r['recipe']
            value=r['mrr']/self.means[r['recipe']]
            decay=1-self.options.alpha
            self.numerators[group]=decay*self.numerators.get(group,0.)+value
            self.denominators[group]=decay*self.denominators.get(group,0.)+1.
            self.counts[group]=self.counts.get(group,0)+1
            self.latest[group]=when
        self.clock=clock

    def advance(self,count=1):
        for _ in range(min(count,len(self.queries)-self.cursor)):
            r=self.queries[self.cursor];self._publish(r['start'])
            group='ch4' if self.options.mode=='shared' else r['recipe']
            state=self.numerators.get(group,0.)/self.denominators[group] if self.denominators.get(group,0)>0 else 1.
            prediction=self.means[r['recipe']]*state
            self.rows.append({'sample_id':r['sample_id'],'wafer_id':r['wafer_id'],'stage':r['stage'],
                'recipe':r['recipe'],'start':r['start'],'end':r['end'],'prediction':prediction,
                'reference_mrr':self.means[r['recipe']],'time_ratio':self.means[r['recipe']]/prediction,
                'observed_count':self.counts.get(group,0),
                'state_age_seconds':r['start']-self.latest[group] if group in self.latest else None,
                'last_available_at':self.latest.get(group),'measurement_selected':r['sample_id'] in self.selected,
                'u_pad':r['u_pad'],'u_dresser':r['u_dresser'],'gap_s':r.get('gap_s'),
                'p_main':r.get('p_main'),'truth':r['mrr']})
            self.cursor+=1
        if self.cursor<len(self.queries):
            # Move to the next prediction boundary, never into that future process.
            self._publish(self.queries[self.cursor]['start'])
        else:
            self._publish(max(r['end'] for r in self.queries)+.001)
        return self.snapshot()

    @staticmethod
    def errors(rows):
        if not rows:return {'n':0,'mae':None,'rmse':None}
        e=[r['prediction']-r['truth'] for r in rows]
        return {'n':len(e),'mae':sum(abs(x) for x in e)/len(e),'rmse':math.sqrt(sum(x*x for x in e)/len(e))}

    def snapshot(self):
        visible=[];measured=[]
        for original in self.rows:
            row=dict(original);released=row['sample_id'] in self.published
            row['measured']=released
            row['available_at']=self.release.get(row['sample_id']) if released else None
            row['error']=row['prediction']-row['truth'] if released else None
            if released:measured.append(original)
            else:row['truth']=None
            visible.append(row)
        done=self.cursor==len(self.queries)
        return {'cursor':self.cursor,'total':len(self.queries),'finished':done,
            'initial_measurements':self.initial_measurements,
            'measurements_requested':sum(r['measurement_selected'] for r in self.rows),
            'measurements_released':len(measured),'clock':self.clock,
            'observed_metrics':self.errors(measured),
            'retrospective_metrics':self.errors(self.rows) if done else None,
            'rows':visible,'notice':'공개 측정 오차와 재생 완료 후 전체 기록의 사후 오차를 구분합니다. MRR은 상대 척도입니다.'}
