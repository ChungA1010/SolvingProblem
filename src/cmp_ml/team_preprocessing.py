"""Independent reconstruction and train-only calibration of the team CSV."""
from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from zipfile import ZipFile
import numpy as np
import pandas as pd

KEY = ['wafer_id', 'stage']
RAW_KEY = ['WAFER_ID', 'STAGE']
SIGNALS = {'MAIN_OUTER_AIR_BAG_PRESSURE':'p_main', 'CENTER_AIR_BAG_PRESSURE':'p_center',
    'EDGE_AIR_BAG_PRESSURE':'p_edge', 'RIPPLE_AIR_BAG_PRESSURE':'p_ripple',
    'RETAINER_RING_PRESSURE':'p_retainer', 'PRESSURIZED_CHAMBER_PRESSURE':'p_chamber',
    'SLURRY_FLOW_LINE_A':'slurry_a', 'SLURRY_FLOW_LINE_B':'slurry_b', 'SLURRY_FLOW_LINE_C':'slurry_c'}
USAGES = {'USAGE_OF_DRESSER':'u_dresser', 'USAGE_OF_POLISHING_TABLE':'u_pad',
    'USAGE_OF_DRESSER_TABLE':'u_dresser_table', 'USAGE_OF_MEMBRANE':'u_membrane',
    'USAGE_OF_BACKING_FILM':'u_backing_film', 'USAGE_OF_PRESSURIZED_SHEET':'u_pressurized_sheet'}
CONDITIONS = ['p_main','p_center','p_edge','p_ripple','p_retainer','p_chamber',
    'slurry_a','slurry_c','u_dresser','u_pad','u_dresser_table','u_membrane',
    'gap_s','after_gap','after_gap_confirmed','extra_dressing','dresser_excess',
    'hidden_wafers_est','pad_replaced','dresser_replaced']


def read_archive(path):
    with ZipFile(path) as archive:
        frame = pd.read_csv(BytesIO(archive.read('preprocessed/wafer_table.csv')))
        catalog = pd.read_csv(BytesIO(archive.read('preprocessed/columns.csv')))
    assert frame.shape == (1977,47) and not frame.duplicated(KEY).any()
    assert set(frame) == set(catalog.column)
    allowed = set(catalog.loc[catalog.input_allowed.eq('Y'),'column']) - {'stage','recipe'}
    assert allowed == set(CONDITIONS)
    return frame.sort_values('t_start').reset_index(drop=True), catalog


def reconstruct_physical(raw, labels):
    """Reproduce row-local physical summaries without learning cross-wafer statistics."""
    raw = raw.drop(columns=['FILE'],errors='ignore').copy()
    for c in raw.columns.difference(['STAGE']): raw[c]=pd.to_numeric(raw[c],errors='raise')
    raw = raw.drop_duplicates()
    duplicates = raw.duplicated(RAW_KEY+['TIMESTAMP'],keep=False)
    conflicts = raw.loc[duplicates].groupby(RAW_KEY+['TIMESTAMP']).CHAMBER.nunique()
    audit = {'deduplicated_raw_rows':len(raw),'conflicting_rows':int(duplicates.sum()),
             'cross_chamber_timestamp_conflicts':int((conflicts>1).sum())}
    # Source keeps first timestamp. Verify no primary row can be removed in favor of
    # a different chamber before using this compatibility rule.
    collision_keys=conflicts[conflicts>1].reset_index()[RAW_KEY+['TIMESTAMP']]
    affected=raw.merge(collision_keys,on=RAW_KEY+['TIMESTAMP'])
    audit['cross_chamber_primary_rows']=int(affected.CHAMBER.isin([1,4]).sum())
    if audit['cross_chamber_primary_rows']:
        raise ValueError('Cross-chamber primary conflicts require source reconciliation')
    raw = raw.drop_duplicates(RAW_KEY+['TIMESTAMP'],keep='first')
    raw['recipe'] = np.where(raw.groupby(RAW_KEY).CHAMBER.transform('min')<=3,'A123',raw.STAGE+'456')
    pol = raw[raw.CHAMBER.isin([1,4])].sort_values(RAW_KEY+['TIMESTAMP']).copy()
    # Shift inside each wafer-stage; never integrate across wafer boundaries.
    pol['dt'] = (pol.groupby(RAW_KEY).TIMESTAMP.shift(-1)-pol.TIMESTAMP).clip(0,10).fillna(0)
    def plateau(x):
        high=x[x>0.5*x.max()]
        return high.median() if len(high) and x.max()>0 else np.nan
    pressure='MAIN_OUTER_AIR_BAG_PRESSURE'; slurry='SLURRY_FLOW_LINE_C'
    pp=pol.groupby(RAW_KEY)[pressure].transform(plateau)
    on=(pol[pressure]-pp).abs()<=.02*pp
    qq=pol[RAW_KEY].join(pol[slurry].where(on)).groupby(RAW_KEY)[slurry].transform('median')
    active=pol[on & (pol[slurry]>.5*qq)]
    means=active[list(SIGNALS)].mul(active.dt,axis=0).groupby([active.WAFER_ID,active.STAGE]).sum()
    means=means.div(active.groupby(RAW_KEY).dt.sum(),axis=0).rename(columns=SIGNALS)
    g=pol.groupby(RAW_KEY)
    base=pd.DataFrame({'recipe':g.recipe.first(),'t_start':g.TIMESTAMP.min(),'t_end':g.TIMESTAMP.max()})
    base=base.join(g[list(USAGES)].first().rename(columns=USAGES)).join(means)
    base['t_polish']=active.groupby(RAW_KEY).dt.sum()
    base=base.reset_index().merge(labels,on=RAW_KEY,validate='one_to_one')
    base=base.rename(columns={'WAFER_ID':'wafer_id','STAGE':'stage','AVG_REMOVAL_RATE':'mrr'})
    audit.update({'primary_rows':len(pol),'full_rows':len(base),'removed_extreme_rows':int((base.mrr>1000).sum())})
    base=base[base.mrr<=1000].copy()
    base['table']=np.where(base.recipe.eq('A123'),'ch1','ch4')
    return base.sort_values('t_start').reset_index(drop=True),audit


@dataclass
class FoldPreprocessor:
    steps: dict
    medians: dict

    @classmethod
    def fit(cls, train):
        steps={}
        for table,d in train.sort_values('t_start').groupby('table'):
            dp,dd=d.u_pad.diff(),d.u_dresser.diff()
            gap=d.t_start-d.t_end.shift()
            near=gap.le(300)&dp.gt(0)
            p=float(dp[near].median()); q=float(dd[near&dd.ge(0)].median())
            if not np.isfinite(p) or p<=0 or not np.isfinite(q):
                raise ValueError(f'No training-only usage calibration for {table}')
            steps[table]={'pad_step':p,'dresser_step':q,'pairs':int(near.sum())}
        medians={r:{k:float(v) for k,v in d[['p_main','slurry_c','t_polish','t_rinse']].median().items()}
                 for r,d in train.groupby('recipe')}
        return cls(steps,medians)

    def transform(self, frame):
        """Known process covariates may stream in; coefficients stay frozen."""
        out=frame.sort_values('t_start').copy()
        # Reject accidental reuse of supplied target-derived fields.
        out=out.drop(columns=['prev_mrr','prev_wafers_back'],errors='ignore')
        for table,d in out.groupby('table',sort=False):
            gap=d.t_start-d.t_end.shift(); dp=d.u_pad.diff(); dd=d.u_dresser.diff()
            p=self.steps[table]['pad_step']; q=self.steps[table]['dresser_step']
            ok=dp.ge(0)&dd.ge(0)
            hidden=((dp/p).round()-1).clip(lower=0).where(ok)
            excess=(dd-(hidden+1)*q).where(ok)
            vals={'gap_s':gap,'hidden_wafers_est':hidden,'dresser_excess':excess,
                'pad_replaced':dp.lt(-5).astype(int),'dresser_replaced':dd.lt(-5).astype(int),
                'after_gap':gap.gt(500).astype(int),
                'after_gap_confirmed':(gap.gt(500)&hidden.eq(0)).astype(int),
                'extra_dressing':excess.gt(.5).astype(int)}
            for name,value in vals.items(): out.loc[d.index,name]=value
        for recipe,d in out.groupby('recipe',sort=False):
            med=self.medians[recipe]
            out.loc[d.index,'flag_pressure_shift']=(abs(d.p_main/med['p_main']-1)>.015).astype(int)
            out.loc[d.index,'flag_slurry_odd']=(abs(d.slurry_c/med['slurry_c']-1)>.05).astype(int)
            out.loc[d.index,'flag_short_polish']=(d.t_polish<.6*med['t_polish']).astype(int)
            out.loc[d.index,'flag_long_rinse']=(d.t_rinse>3*med['t_rinse']).astype(int)
        return out
