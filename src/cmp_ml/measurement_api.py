"""Local, redacted replay sessions. Historical truth never comes from the client."""
import json
import hashlib
from pathlib import Path
from threading import RLock
from typing import Annotated,Literal
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel,ConfigDict,Field,field_validator
from .measurement_replay import Replay,ReplayOptions
from .runtime import InferenceError


class Config(BaseModel):
    model_config=ConfigDict(extra='forbid',strict=True,allow_inf_nan=False)


class CreateReplay(Config):
    scenario_id:str
    period:Literal[1,5,10]=1
    delay:Literal[0,5]=0
    mode:Literal['separate','shared']='separate'
    alpha:Annotated[float,Field(ge=.05,le=1,allow_inf_nan=False)]=.4

    @field_validator('period','delay',mode='before')
    @classmethod
    def strict_count(cls,value):
        if type(value) is not int:raise ValueError('An integer count is required.')
        return value


class AdvanceReplay(Config):
    expected_revision:Annotated[int,Field(ge=0)]
    count:Annotated[int,Field(ge=1,le=100)]=1


class ResetReplay(Config):
    expected_revision:Annotated[int,Field(ge=0)]


class ReplaySessions:
    def __init__(self,root):
        self.root=Path(root);self.lock=RLock();self.sessions={};self.fixture=None

    def load(self):
        if self.fixture is not None:return self.fixture
        folder=self.root/'runs/phm_cmp_measurement_cycles_v1'
        if not (folder/'completion.json').exists():
            raise InferenceError('REPLAY_NOT_READY','측정 실험 자료가 준비되지 않았습니다.',503)
        complete=json.loads((folder/'completion.json').read_text(encoding='utf-8'))
        data=(folder/'replay_fixture.json').read_bytes()
        if hashlib.sha256(data).hexdigest()!=complete['hashes']['replay_fixture.json']:
            raise InferenceError('REPLAY_HASH_MISMATCH','측정 실험 자료의 버전이 일치하지 않습니다.',503)
        self.fixture=json.loads(data)
        return self.fixture

    def describe(self):
        f=self.load()
        return {'version':f['version'],'items':[{'scenario_id':c['scenario_id'],'label':c['label'],
            'total':len(c['query_ids'])} for c in f['cases']],
            'notice':'장비 상태는 실제 기록 시기로 선택합니다. 측정 주기와 공개 지연은 별도 조건입니다.'}

    def create(self,body):
        with self.lock:
            if len(self.sessions)>=32:raise InferenceError('SESSION_LIMIT','열린 세션을 닫고 다시 시작하세요.',429)
            f=self.load();case=next((c for c in f['cases'] if c['scenario_id']==body.scenario_id),None)
            if case is None:raise InferenceError('UNKNOWN_SCENARIO','실험 시기를 선택하세요.',422)
            options=ReplayOptions(body.period,body.delay,body.mode,body.alpha)
            sid='replay_'+uuid.uuid4().hex
            replay=Replay(f['records'],case['train_ids'],case['query_ids'],options)
            self.sessions[sid]={'replay':replay,'case':case,'revision':0,'config':body.model_dump()}
            return self.snapshot(sid)

    def get(self,sid):
        if sid not in self.sessions:raise InferenceError('SESSION_NOT_FOUND','세션이 없습니다. 새 실험을 시작하세요.',404)
        return self.sessions[sid]

    def snapshot(self,sid):
        session=self.get(sid)
        return {**session['replay'].snapshot(),'session_id':sid,'revision':session['revision'],
            'config':session['config'],'scenario_label':session['case']['label'],
            'model_version':'measurement-replay-v1','persistence':'server_memory'}

    def change(self,sid,revision,count=None):
        with self.lock:
            s=self.get(sid)
            if revision!=s['revision']:raise InferenceError('STATE_CONFLICT','다른 요청으로 상태가 바뀌었습니다. 최신 상태를 다시 읽으세요.',409)
            if count is None:
                r=s['replay'];c=s['case']
                s['replay']=Replay(self.load()['records'],c['train_ids'],c['query_ids'],r.options)
            else:s['replay'].advance(count)
            s['revision']+=1
            return self.snapshot(sid)


def install_replay_routes(app,root,envelope):
    service=ReplaySessions(root);app.state.replays=service
    def result(request,data):
        r=envelope(request,data);r['api_version']='2.0';return r

    @app.get('/api/v2/state-scenarios')
    def scenarios(request:Request):
        with service.lock:return result(request,service.describe())

    @app.post('/api/v2/state-sessions')
    def create(body:CreateReplay,request:Request):return result(request,service.create(body))

    @app.get('/api/v2/state-sessions/{sid}')
    def snapshot(sid:str,request:Request):
        with service.lock:return result(request,service.snapshot(sid))

    @app.post('/api/v2/state-sessions/{sid}/advance')
    def advance(sid:str,body:AdvanceReplay,request:Request):
        return result(request,service.change(sid,body.expected_revision,body.count))

    @app.post('/api/v2/state-sessions/{sid}/reset')
    def reset(sid:str,body:ResetReplay,request:Request):
        return result(request,service.change(sid,body.expected_revision))

    @app.get('/api/v2/state-sessions/{sid}/export')
    def export(sid:str):
        with service.lock:
            return JSONResponse(service.snapshot(sid),headers={'Content-Disposition':f'attachment; filename="{sid}.json"'})

    @app.delete('/api/v2/state-sessions/{sid}')
    def delete(sid:str,request:Request):
        with service.lock:
            service.get(sid);del service.sessions[sid]
        return result(request,{'closed':True})
