from __future__ import annotations

import base64
import hashlib
import json
import sqlite3
import uuid
from contextlib import closing, contextmanager
from pathlib import Path

from .common import utcnow
from .runtime import InferenceError


def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(",",":"),allow_nan=False)
def digest(value):return hashlib.sha256(canonical(value).encode()).hexdigest()


class Store:
    def __init__(self,path:Path):
        self.path=path;path.parent.mkdir(parents=True,exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS predictions(id TEXT PRIMARY KEY,created_at TEXT NOT NULL,payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS experiments(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,name TEXT NOT NULL,stage TEXT NOT NULL,prediction_id TEXT NOT NULL,
                    fingerprint TEXT NOT NULL,payload TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS experiment_fingerprint ON experiments(fingerprint);
                CREATE TABLE IF NOT EXISTS idempotency(key TEXT PRIMARY KEY,request_hash TEXT NOT NULL,
                    response TEXT NOT NULL,created_at TEXT NOT NULL);
            """)

    @contextmanager
    def connect(self):
        db=sqlite3.connect(self.path,timeout=1)
        db.row_factory=sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def add_prediction(self,payload):
        identifier="pred_"+uuid.uuid4().hex
        payload={**payload,"prediction_id":identifier,"created_at":utcnow()}
        with self.connect() as db:
            db.execute("INSERT INTO predictions VALUES(?,?,?)",(identifier,payload["created_at"],canonical(payload)))
        return payload

    def save(self,body,key):
        request_hash=digest(body)
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            prior=db.execute("SELECT * FROM idempotency WHERE key=?",(key,)).fetchone()
            if prior:
                if prior["request_hash"]!=request_hash:raise InferenceError("IDEMPOTENCY_CONFLICT","같은 키로 다른 저장 요청을 보냈습니다.",409)
                return json.loads(prior["response"])
            row=db.execute("SELECT payload FROM predictions WHERE id=?",(body["prediction_id"],)).fetchone()
            if not row:raise InferenceError("PREDICTION_NOT_FOUND","저장할 예측이 없습니다.",404)
            prediction=json.loads(row[0])
            fingerprint=digest({"name":body["name"],"notes":body["notes"],"prediction_id":body["prediction_id"]})
            duplicate=db.execute("SELECT id FROM experiments WHERE fingerprint=?",(fingerprint,)).fetchone()
            if duplicate and not body["force"]:
                raise InferenceError("DUPLICATE_EXPERIMENT","동일한 실험이 이미 저장되어 있습니다: "+duplicate[0],409)
            detail={"id":"exp_"+uuid.uuid4().hex,"created_at":utcnow(),"name":body["name"],"notes":body["notes"],
                    "stage":prediction.get("stage",prediction.get("dataset","")),"prediction":prediction,
                    "duplicate_of":duplicate[0] if duplicate else None}
            db.execute("INSERT INTO experiments(id,created_at,name,stage,prediction_id,fingerprint,payload) VALUES(?,?,?,?,?,?,?)",
                       (detail["id"],detail["created_at"],detail["name"],detail["stage"],body["prediction_id"],fingerprint,canonical(detail)))
            db.execute("INSERT INTO idempotency VALUES(?,?,?,?)",(key,request_hash,canonical(detail),detail["created_at"]))
            return detail

    def detail(self,identifier):
        with self.connect() as db:row=db.execute("SELECT payload FROM experiments WHERE id=?",(identifier,)).fetchone()
        if not row:raise InferenceError("EXPERIMENT_NOT_FOUND","실험을 찾을 수 없습니다.",404)
        return json.loads(row[0])

    def list(self,limit=20,cursor=None,stage=None):
        after=2**63-1
        if cursor:
            try:
                data=json.loads(base64.urlsafe_b64decode(cursor))
                if data["stage"]!=stage or not isinstance(data["seq"],int):raise ValueError()
                after=data["seq"]
            except Exception as e:raise InferenceError("INVALID_CURSOR","목록 커서 또는 필터가 일치하지 않습니다.") from e
        sql="SELECT seq,id,created_at,name,stage FROM experiments WHERE seq<?"
        args=[after]
        if stage:sql+=" AND stage=?";args.append(stage)
        sql+=" ORDER BY seq DESC LIMIT ?";args.append(limit+1)
        with self.connect() as db:rows=db.execute(sql,args).fetchall()
        more=len(rows)>limit;rows=rows[:limit]
        token=base64.urlsafe_b64encode(canonical({"seq":rows[-1]["seq"],"stage":stage}).encode()).decode() if more else None
        return {"items":[{k:r[k] for k in ["id","created_at","name","stage"]} for r in rows],"has_more":more,"next_cursor":token,"limit":limit}

    def delete(self,identifier):
        with self.connect() as db:
            count=db.execute("DELETE FROM experiments WHERE id=?",(identifier,)).rowcount
        if not count:raise InferenceError("EXPERIMENT_NOT_FOUND","실험을 찾을 수 없습니다.",404)

    def backup(self,path):
        if path.exists():raise FileExistsError("Backup target exists")
        with self.connect() as source,closing(sqlite3.connect(path)) as target:
            source.backup(target)
            if target.execute("PRAGMA integrity_check").fetchone()[0]!="ok":raise ValueError("Backup integrity failed")
