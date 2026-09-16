"""Acquire the public dataset copies linked by their authors; never execute data."""
from __future__ import annotations

import argparse
import hashlib
import json
import time
import urllib.request
import zipfile
from pathlib import Path

SOURCES = {
    "wm811k": ("qingyi/wm811k-wafer-map", {"LSWMD.pkl": 2095505977}),
    "mixedwm38": ("co1d7era/mixedtype-wafer-defect-datasets", {
        "Wafer_Map_Datasets.npz": 412387226, "Description.pdf": 1008893}),
}


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def fetch(dataset, root):
    ref, expected = SOURCES[dataset]
    folder = root / dataset
    folder.mkdir(parents=True, exist_ok=True)
    if (folder / "provenance.json").exists():
        info = json.loads((folder / "provenance.json").read_text())
        for item in info["files"]:
            if digest(folder / item["name"]) != item["sha256"]:
                raise ValueError("Downloaded data changed")
        print(dataset, "already verified", flush=True)
        return
    url = f"https://www.kaggle.com/api/v1/datasets/download/{ref}"
    archive = folder / "source.zip"
    if not archive.exists():
        tmp = folder / "source.zip.part"
        count = 0
        last = time.monotonic()
        request = urllib.request.Request(url, headers={"User-Agent": "cmp-virtual-lab-research/0.2"})
        with urllib.request.urlopen(request, timeout=60) as response, tmp.open("wb") as out:
            while block := response.read(1024 * 1024):
                count += len(block)
                if count > 4_000_000_000:
                    raise ValueError("Unexpected archive size")
                out.write(block)
                if time.monotonic() - last > 10:
                    print(dataset, "downloaded MB", round(count / 1e6, 1), flush=True)
                    last = time.monotonic()
        tmp.replace(archive)
    files = []
    with zipfile.ZipFile(archive) as z:
        if set(z.namelist()) != set(expected):
            raise ValueError(f"Unexpected archive members: {z.namelist()}")
        for name, size in expected.items():
            if z.getinfo(name).file_size != size:
                raise ValueError(f"Dataset version/size changed: {name}")
            path = folder / name
            if not path.exists():
                with z.open(name) as source, path.open("xb") as out:
                    while block := source.read(1024 * 1024):
                        out.write(block)
            if path.stat().st_size != size:
                raise ValueError("Incomplete extraction")
            files.append({"name": name, "bytes": size, "sha256": digest(path)})
    info = {"dataset": dataset, "source_url": url,
            "author_reference": "https://github.com/Junliangwangdhu/WaferMap" if dataset == "mixedwm38" else "https://mirlab.org/dataSet/public/",
            "retrieved_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "archive_sha256": digest(archive), "files": files,
            "license_note": "Original dataset terms apply; raw data is local only and is not republished."}
    (folder / "provenance.json").write_text(json.dumps(info, indent=2), encoding="utf-8")
    print(json.dumps(info, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", choices=SOURCES)
    parser.add_argument("--data-dir", type=Path, default=Path("data/wafer"))
    args = parser.parse_args()
    fetch(args.dataset, args.data_dir)
