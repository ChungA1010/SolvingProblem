"""Fetch CSV data only from a pinned, public PHM 2016 mirror.

No code from the mirror is executed. Answer downloads require frozen predictions.
Raw data stays in the Git-ignored data directory.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from cmp_ml.common import read_json, sha256, utcnow, write_json

REPO = "akangel0307/PHM-Data-Challenge"
COMMIT = "00d443e3f57379e3ad3d12c15a0738282b8210e5"
BASE = "data/2016 PHM Data Challenge/"
MAIN = BASE + "2016 PHM DATA CHALLENGE CMP DATA SET/"
VALIDATION = BASE + "2016 PHM DATA CHALLENGE CMP VALIDATION DATA SET/"
ANSWERS = BASE + "PHM16TestValidationAnswers/PHM16TestValidationAnswers/"


def fetch(url):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "CMP-ML-reproducibility-audit"})
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read(20 * 1024 * 1024)
        except OSError:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def blob_hash(content):
    return hashlib.sha1(f"blob {len(content)}\0".encode() + content).hexdigest()


def make_index(data_dir, run_dir, original):
    if (data_dir / "source_index.json").exists():
        raise FileExistsError("Source index already exists")
    tree = json.loads(fetch(f"https://api.github.com/repos/{REPO}/git/trees/{COMMIT}?recursive=1"))
    if tree.get("truncated"):
        raise ValueError("Incomplete source tree")
    entries = {e["path"]: e for e in tree["tree"] if e["type"] == "blob"}
    files, training_checks = [], []
    for split, prefix in [("training", MAIN + "CMP-data/training/"), ("test", MAIN + "CMP-data/test/"),
                          ("validation", VALIDATION + "validation/")]:
        expected = [prefix + f"CMP-{split}-{i:03d}.csv" for i in range(185)]
        for path in expected:
            item = entries[path]
            record = {"source_path": path, "local_path": f"{split}/{Path(path).name}",
                      "git_blob_sha1": item["sha"], "bytes": item["size"], "kind": split}
            if split == "training":
                local = original / "CMP-data" / "training" / Path(path).name
                content = local.read_bytes()
                exact = blob_hash(content) == item["sha"]
                normalized = blob_hash(content.replace(b"\r\n", b"\n")) == item["sha"]
                training_checks.append({"file": local.name, "local_sha256": sha256(local),
                                        "mirror_blob_sha1": item["sha"], "exact_match": exact,
                                        "lf_normalized_match": normalized})
            else:
                files.append(record)
    for split, canonical in [("test", MAIN), ("validation", VALIDATION)]:
        path = ANSWERS + f"orig_CMP-{split}-removalrate.csv"
        item = entries[path]
        if item["sha"] != entries[canonical + f"CMP-{split}-removalrate.csv"]["sha"]:
            raise ValueError("Answer archive and mirror working labels disagree")
        files.append({"source_path": path, "local_path": f"labels/CMP-{split}-removalrate.csv",
                      "git_blob_sha1": item["sha"], "bytes": item["size"], "kind": "labels"})
    training_label = original / "CMP-training-removalrate.csv"
    content = training_label.read_bytes()
    expected = entries[MAIN + training_label.name]["sha"]
    training_checks.append({"file": training_label.name, "local_sha256": sha256(training_label),
                            "mirror_blob_sha1": expected, "exact_match": blob_hash(content) == expected,
                            "lf_normalized_match": blob_hash(content.replace(b"\r\n", b"\n")) == expected})
    audit = {"recorded_at": utcnow(), "repository": REPO, "commit": COMMIT,
             "mirror_url": f"https://github.com/{REPO}/tree/{COMMIT}",
             "official_url": "https://phmsociety.org/conference/annual-conference-of-the-phm-society/annual-conference-of-the-prognostics-and-health-management-society-2016/phm-data-challenge-4/",
             "provenance_limit": "Community mirror of official partitions. No independently available official answer checksum.",
             "files": files, "training_identity_checks": training_checks,
             "all_training_match": all(c["exact_match"] or c["lf_normalized_match"] for c in training_checks)}
    write_json(data_dir / "source_index.json", audit)
    write_json(run_dir / "acquisition_index.json", audit)
    print(f"Indexed {len(files)} external files. Prior training identity: "
          f"{sum(c['exact_match'] for c in training_checks)}/{len(training_checks)} exact, "
          f"{sum(c['exact_match'] or c['lf_normalized_match'] for c in training_checks)}/{len(training_checks)} allowing LF normalization.", flush=True)
    if not audit["all_training_match"]:
        raise ValueError("Training copy identity needs review before accepting this mirror")


def download(data_dir, run_dir, kind):
    index = read_json(data_dir / "source_index.json")
    if not index["all_training_match"]:
        raise ValueError("Unverified training copy identity")
    if kind == "labels":
        frozen = read_json(run_dir / "prediction_freeze.json")
        if frozen["status"] != "predictions_frozen" or sha256(run_dir / "predictions.csv") != frozen["predictions_sha256"]:
            raise ValueError("Predictions must be frozen before downloading answers")
    chosen = [f for f in index["files"] if (f["kind"] == "labels") == (kind == "labels")]
    def one(item):
        relative = item["local_path"]
        if not re.fullmatch(r"(?:test|validation)/CMP-(?:test|validation)-\d{3}\.csv|labels/CMP-(?:test|validation)-removalrate\.csv", relative):
            raise ValueError("Unexpected dataset path")
        destination = data_dir / relative
        url = f"https://raw.githubusercontent.com/{REPO}/{COMMIT}/" + urllib.parse.quote(item["source_path"], safe="/")
        content = destination.read_bytes() if destination.exists() else fetch(url)
        if len(content) != item["bytes"] or blob_hash(content) != item["git_blob_sha1"]:
            raise ValueError(f"Source byte/hash mismatch: {relative}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            destination.write_bytes(content)
        return {**item, "url": url, "sha256": sha256(destination)}
    completed = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        for future in as_completed([pool.submit(one, f) for f in chosen]):
            completed.append(future.result())
            if len(completed) % 40 == 0 or len(completed) == len(chosen):
                print(f"Verified {kind}: {len(completed)}/{len(chosen)}", flush=True)
    write_json(run_dir / f"downloaded_{kind}.json", {"completed_at": utcnow(), "commit": COMMIT,
               "files": sorted(completed, key=lambda f: f["local_path"])})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["index", "traces", "labels"])
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--original-root", type=Path)
    args = parser.parse_args()
    if args.action == "index":
        if args.original_root is None:
            parser.error("index needs --original-root")
        make_index(args.data_dir, args.run_dir, args.original_root)
    else:
        download(args.data_dir, args.run_dir, args.action)
