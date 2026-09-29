"""Check the running HTTP replay against every canonical research configuration."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--port',type=int,default=8767)
    p.add_argument('--output',type=Path,default=Path('runs/measurement_demo_v1/http-verification.json'))
    args=p.parse_args()
    root=Path(__file__).resolve().parents[1]
    run=root/'runs/phm_cmp_measurement_cycles_v1'
    completion=json.loads((run/'completion.json').read_text(encoding='utf-8'))
    for name,digest in completion['hashes'].items():
        assert hashlib.sha256((run/name).read_bytes()).hexdigest()==digest,name
    def call(path,method='GET',body=None):
        data=None if body is None else json.dumps(body).encode()
        request=Request(f'http://127.0.0.1:{args.port}/api/v2/'+path,data=data,method=method,
                        headers={'Content-Type':'application/json'})
        with urlopen(request,timeout=30) as response:return json.load(response)
    cases=[r for r in csv.DictReader((run/'metrics.csv').open(encoding='utf-8',newline=''))
           if r['canonical']=='True' and r['subgroup']=='all']
    counts=list(csv.DictReader((run/'measurement_counts.csv').open(encoding='utf-8',newline='')))
    max_difference=0.;evaluations=0;checked=[]
    for case in cases:
        config={'scenario_id':'fold_'+case['fold'],'period':int(case['period']),
                'delay':int(case['delay']),'mode':case['mode'],'alpha':.4}
        s=call('state-sessions','POST',config)['data'];path='state-sessions/'+s['session_id']
        initial_revision=s['revision'];first=True
        while not s['finished']:
            if not first:assert s['retrospective_metrics'] is None
            s=call(path+'/advance','POST',{'expected_revision':s['revision'],'count':73})['data']
            assert all(r['truth'] is None and r['error'] is None for r in s['rows'] if not r['measured'])
            if first:
                try:
                    call(path+'/advance','POST',{'expected_revision':initial_revision,'count':1})
                    raise AssertionError('Duplicate revision accepted')
                except HTTPError as e:assert e.code==409
                first=False
        for metric in ('mae','rmse'):
            difference=abs(s['retrospective_metrics'][metric]-float(case[metric]))
            assert difference<1e-10,(config,metric,difference)
            max_difference=max(max_difference,difference)
        expected=next(c for c in counts if all(c[k]==case[k] for k in ('fold','period','delay','mode','offset')))
        assert s['measurements_requested']==int(expected['requested'])
        assert s['measurements_released']==int(expected['released'])
        assert s['initial_measurements']==int(expected['initial_measurements'])
        assert call(path+'/export')==s
        evaluations+=s['total']
        checked.append({**config,'n':s['total'],'mae':s['retrospective_metrics']['mae'],
                        'requested':s['measurements_requested'],'released':s['measurements_released']})
        call(path,'DELETE')
    report={'status':'passed','configuration_count':len(checked),'evaluation_count':evaluations,
            'max_metric_difference':max_difference,'redaction_all_steps':True,
            'stale_revision_rejected_all_cases':True,'export_matches_snapshot':True,
            'research_hashes_checked':len(completion['hashes']),'cases':checked}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='cases'}))


if __name__=='__main__':main()
