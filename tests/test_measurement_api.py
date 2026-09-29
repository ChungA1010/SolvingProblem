import pytest
from fastapi.testclient import TestClient
from cmp_ml.api import create_app
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

@pytest.fixture(scope='module')
def client(tmp_path_factory):
    return TestClient(create_app(ROOT,tmp_path_factory.mktemp('replay')/'db.sqlite3',classifiers=False))

def create(client,**kwargs):
    response=client.post('/api/v2/state-sessions',json={'scenario_id':'fold_2',**kwargs})
    assert response.status_code==200,response.text
    return response.json()['data']

def step(client,s,count=1):
    return client.post('/api/v2/state-sessions/'+s['session_id']+'/advance',json={'expected_revision':s['revision'],'count':count})

def test_catalog_does_not_disclose_labels(client):
    data=client.get('/api/v2/state-scenarios').json()
    assert data['api_version']=='2.0' and len(data['data']['items'])==4
    assert 'mrr' not in str(data) and 'train_ids' not in str(data)

def test_redaction_revision_conflict_and_reset(client):
    s=create(client,period=10,delay=5)
    assert s['rows']==[] and s['retrospective_metrics'] is None
    updated=step(client,s,1).json()['data']
    assert updated['cursor']==1 and updated['rows'][0]['truth'] is None
    assert updated['rows'][0]['error'] is None
    conflict=step(client,s,1)
    assert conflict.status_code==409 and conflict.json()['api_version']=='2.0'
    reset=client.post('/api/v2/state-sessions/'+s['session_id']+'/reset',json={'expected_revision':updated['revision']}).json()['data']
    repeated=step(client,reset,1).json()['data']
    assert repeated['rows']==updated['rows']

def test_complete_metrics_and_export_match(client):
    s=create(client,mode='shared',period=5)
    while not s['finished']:s=step(client,s,100).json()['data']
    assert s['retrospective_metrics']['n']==314
    assert 0<s['measurements_released']<=s['measurements_requested']<314
    export=client.get('/api/v2/state-sessions/'+s['session_id']+'/export').json()
    assert export==s
    assert all(r['truth'] is None for r in s['rows'] if not r['measured'])

@pytest.mark.parametrize('extra',[{'period':2},{'delay':1},{'alpha':0.},{'mrr':100.},{'period':'5'},{'mode':'bad'},{'period':True},{'period':5.0},{'delay':False}])
def test_reject_unsupported_or_injected_fields(client,extra):
    r=client.post('/api/v2/state-sessions',json={'scenario_id':'fold_2',**extra})
    assert r.status_code==422

def test_session_isolation_and_close(client):
    a=create(client);b=create(client)
    a=step(client,a,3).json()['data']
    assert client.get('/api/v2/state-sessions/'+b['session_id']).json()['data']['cursor']==0
    assert client.delete('/api/v2/state-sessions/'+a['session_id']).status_code==200
    assert client.get('/api/v2/state-sessions/'+a['session_id']).status_code==404
