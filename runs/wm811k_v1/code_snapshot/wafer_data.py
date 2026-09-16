"""Validated, dataset-independent image transform and frozen wafer splits."""
from __future__ import annotations

import argparse
import builtins
import hashlib
import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from sklearn.model_selection import StratifiedGroupKFold

from .common import sha256, utcnow, write_json

SEED = 20260916
SIZE = 64
LABELS = ["Center", "Donut", "Edge-Loc", "Edge-Ring", "Loc", "Near-full", "Scratch", "Random"]
WM_LABELS = ["none", *LABELS]


class WaferUnpickler(pickle.Unpickler):
    """Only the ten constructors actually present in the legacy dataset.

    Do not use this as a general upload reader. The exact source SHA is checked
    before loading. Runtime input accepts numeric JSON, never pickle.
    """
    def find_class(self, module, name):
        from pandas.core.indexes.base import _new_Index
        from pandas.core.internals.managers import BlockManager
        allowed = {
            ("__builtin__", "slice"): builtins.slice,
            ("numpy", "dtype"): np.dtype, ("numpy", "ndarray"): np.ndarray,
            ("numpy.core.multiarray", "_reconstruct"): np._core.multiarray._reconstruct,
            ("numpy.core.multiarray", "scalar"): np._core.multiarray.scalar,
            ("pandas.core.frame", "DataFrame"): pd.DataFrame,
            ("pandas.core.internals", "BlockManager"): BlockManager,
            ("pandas.indexes.base", "Index"): pd.Index,
            ("pandas.indexes.base", "_new_Index"): _new_Index,
            ("pandas.indexes.range", "RangeIndex"): pd.RangeIndex,
        }
        if (module, name) not in allowed:
            raise pickle.UnpicklingError(f"Forbidden constructor: {module}.{name}")
        return allowed[module, name]


def load_wm(path: Path):
    if sha256(path) != "1d04fccb3dd3176b276878b926b20fead7e077c5751e4d353ea9741a5e7b5c65":
        raise ValueError("Unreviewed WM pickle: source hash does not match")
    with path.open("rb") as stream:
        return WaferUnpickler(stream, encoding="latin1").load()


def scalar_label(value):
    values = np.asarray(value).reshape(-1)
    if len(values) == 0:
        return ""
    if len(values) != 1:
        raise ValueError("Ambiguous nested label")
    value = values[0]
    return value.decode() if isinstance(value, bytes) else str(value)


def encode_map(value) -> np.ndarray:
    a = np.asarray(value)
    if a.ndim != 2 or min(a.shape) < 2 or max(a.shape) > 1024:
        raise ValueError("wafer map must be a 2-D grid with sides 2..1024")
    if a.dtype.kind not in "iuf" or not np.isfinite(a).all() or not np.isin(a, [0, 1, 2]).all():
        raise ValueError("wafer map pixels must be numeric 0, 1 or 2")
    if not (a > 0).any():
        raise ValueError("wafer map has no valid dies")
    height, width = a.shape
    scale = SIZE / max(height, width)
    h, w = max(1, round(height * scale)), max(1, round(width * scale))
    out = np.zeros((2, SIZE, SIZE), dtype=np.uint8)
    for c, mask in enumerate([a > 0, a == 2]):
        resized = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).resize((w, h), Image.Resampling.BOX))
        out[c, (SIZE-h)//2:(SIZE-h)//2+h, (SIZE-w)//2:(SIZE-w)//2+w] = resized
    return out


def image_group(image):
    """Hash the model input up to the same D4 symmetries used in augmentation."""
    variants = []
    for k in range(4):
        rotated = np.rot90(image, k, axes=(-2, -1))
        variants.extend([rotated.tobytes(), rotated[..., ::-1].tobytes()])
    return hashlib.sha256(min(variants)).hexdigest()


def assign_splits(manifest, dataset):
    m = manifest.copy()
    m["split"] = "excluded"
    m["reason"] = ""
    conflict = m.groupby("image_group").label_key.nunique()
    bad = set(conflict[conflict > 1].index)
    m.loc[m.image_group.isin(bad), "reason"] = "conflicting_labels_for_same_transformed_map"
    if dataset == "wm811k":
        test = m.original_split.eq("Test") & m.reason.eq("")
        m.loc[test, "split"] = "test"
        test_lots = set(m.loc[test, "lot"])
        pool = m.original_split.eq("Training") & m.reason.eq("")
        overlap = pool & m.lot.isin(test_lots)
        m.loc[overlap, "reason"] = "lot_present_in_official_test"
        pool &= ~overlap
        groups = m.loc[pool, "lot"]
    else:
        pool = m.reason.eq("")
        groups = m.loc[pool, "image_group"]
    subset = m.loc[pool]
    folds = StratifiedGroupKFold(n_splits=10, shuffle=True, random_state=SEED)
    for fold, (_, held) in enumerate(folds.split(subset, subset.label_key, groups)):
        if dataset == "wm811k":
            split = "validation" if fold in [0, 1] else "calibration" if fold == 2 else "train"
        else:
            split = "test" if fold in [0, 1] else "validation" if fold == 2 else "calibration" if fold == 3 else "train"
        m.loc[subset.index[held], "split"] = split
    # Preserve the original test; remove colliding images from earlier phases.
    # Whole lots remain disjoint. Mixed already groups the exact input orbits.
    seen = set()
    for split in ["test", "calibration", "validation", "train"]:
        mask = m.split.eq(split)
        collision = mask & m.image_group.isin(seen)
        m.loc[collision, "split"] = "excluded"
        m.loc[collision, "reason"] = "image_or_symmetry_present_in_later_split"
        seen.update(m.loc[mask, "image_group"])
    used = m[m.split.ne("excluded")]
    if (used.groupby("image_group").split.nunique() > 1).any():
        raise AssertionError("Image leakage")
    if dataset == "wm811k" and (used.groupby("lot").split.nunique() > 1).any():
        raise AssertionError("Lot leakage")
    expected = set(used.label_key)
    for split in ["train", "validation", "calibration", "test"]:
        if set(used.loc[used.split.eq(split), "label_key"]) != expected:
            raise ValueError(f"Missing classes in {split}; inspect data, no row-split fallback")
    return m


def prepare(dataset, data_dir, run_dir):
    run_dir.mkdir(parents=True, exist_ok=True)
    if (run_dir / "protocol.json").exists():
        raise FileExistsError("Frozen run already exists")
    folder = data_dir / dataset
    provenance = json.loads((folder / "provenance.json").read_text())
    for item in provenance["files"]:
        if sha256(folder / item["name"]) != item["sha256"]:
            raise ValueError("Raw source changed")
    excluded, records, images, targets = [], [], [], []
    if dataset == "wm811k":
        frame = load_wm(folder / "LSWMD.pkl")
        if frame.shape != (811457, 6):
            raise ValueError("Unexpected WM shape")
        labels = frame.failureType.map(scalar_label)
        unlabeled = int(labels.eq("").sum())
        original_counts = labels.value_counts().to_dict()
        rows = ((int(i), row.waferMap, labels.loc[i], str(row.lotName), scalar_label(row.trianTestLabel), int(row.waferIndex))
                for i, row in frame.loc[labels.ne("")].iterrows())
    else:
        with np.load(folder / "Wafer_Map_Datasets.npz", allow_pickle=False) as z:
            x, y = z["arr_0"], z["arr_1"]
        if x.shape != (38015, 52, 52) or y.shape != (38015, 8) or not np.isin(y, [0, 1]).all():
            raise ValueError("Unexpected Mixed schema")
        # Verify corrected C7/C9 mapping against the supplied Description.pdf.
        expected_ranges = [(12000,13000,0),(24000,25000,1),(25000,26000,2),(26000,27000,3),
                           (32000,33000,4),(34866,35015,5),(37015,38015,6),(33000,33866,7)]
        for start, end, column in expected_ranges:
            expected = np.eye(8, dtype=int)[column]
            if not (y[start:end] == expected).all():
                raise ValueError("Mixed label ordering differs from corrected author documentation")
        unlabeled = 0
        original_counts = {str(k):int(v) for k,v in zip(*np.unique(y.sum(axis=1),return_counts=True))}
        rows = ((i, image, label, "", "", -1) for i, (image, label) in enumerate(zip(x, y)))
    for source_id, image, label, lot, original_split, wafer_index in rows:
        try:
            encoded = encode_map(image)
        except ValueError as e:
            excluded.append({"source_id":source_id,"reason":str(e)})
            continue
        if dataset == "wm811k":
            if label not in WM_LABELS or original_split not in ["Training", "Test"]:
                raise ValueError("Unexpected WM label/split")
            target = WM_LABELS.index(label)
            label_key = label
        else:
            target = label.astype(np.uint8)
            label_key = "".join(map(str, target))
        records.append({"source_id":source_id,"array_index":len(images),"label_key":label_key,
                        "lot":lot,"wafer_index":wafer_index,"original_split":original_split,
                        "height":image.shape[0],"width":image.shape[1],"image_group":image_group(encoded)})
        images.append(encoded)
        targets.append(target)
        if len(images) % 20000 == 0:
            print(dataset,"encoded",len(images),flush=True)
    m = assign_splits(pd.DataFrame(records), dataset)
    cache = folder / "prepared_v1.npz"
    if cache.exists():
        raise FileExistsError("Prepared dataset cache already exists")
    np.savez_compressed(cache, x=np.stack(images), y=np.asarray(targets), source_id=m.source_id.to_numpy())
    m.to_csv(run_dir / "split_manifest.csv.gz", index=False)
    pd.DataFrame(excluded, columns=["source_id", "reason"]).to_csv(run_dir / "invalid_images.csv",index=False)
    write_json(run_dir / "source_provenance.json", provenance)
    counts = pd.crosstab(m.label_key, m.split).to_dict()
    audit = {"created_at":utcnow(), "dataset":dataset,"original_counts":original_counts,
             "unlabeled_excluded":unlabeled,"invalid_images":len(excluded),"valid_images":len(m),
             "split_counts":m.split.value_counts().to_dict(),"class_counts":counts,
             "exclusion_reasons":m.loc[m.split.eq("excluded"),"reason"].value_counts().to_dict(),
             "unique_image_groups":int(m.image_group.nunique()),"image_groups_disjoint":True,
             "lot_disjoint":True if dataset=="wm811k" else None,
             "synthetic_parent_provenance_available":False if dataset=="mixedwm38" else None,
             "prepared_sha256":sha256(cache),"manifest_sha256":sha256(run_dir/"split_manifest.csv.gz")}
    write_json(run_dir / "data_audit.json", audit)
    protocol = {"created_at":utcnow(),"dataset":dataset,"seed":SEED,"input_size":SIZE,
                "label_names":WM_LABELS if dataset=="wm811k" else LABELS,
                "input_channels":["valid_die_occupancy","failed_die_occupancy"],
                "resize":"aspect-preserving BOX resampling and centered zero padding, uint8/255",
                "split":"WM original Test retained, shared lots excluded from development; remaining lots 10-fold stratified group allocation 70/20/10. Mixed input D4 orbits grouped, allocation 60/10/10/20.",
                "duplicates":"Conflicting orbit labels excluded. Same input or D4 symmetry cannot cross splits. Priority Test > Calibration > Validation > Train.",
                "invalid_pixels":"Reject images with pixels outside 0,1,2; never relabel 3.",
                "training":{"model":"WaferCNN_v1","epochs":40,"patience":10,"minimum_epochs":12,
                            "batch_size":256,"optimizer":"AdamW","learning_rate":0.001,"weight_decay":0.0001,
                            "schedule":"cosine to 0.00001 over 40 epochs","augmentation":"D4 during Train only",
                            "loss":"WM square-root inverse-frequency weighted CE; Mixed BCE positive weights capped at 30"},
                "selection":"Validation macro F1 at default decision threshold; earlier epoch wins ties",
                "mixed_thresholds":"After checkpoint selection, each label threshold maximizes validation F1 over 0.15..0.85 by 0.05, closest to 0.5 wins ties",
                "calibration":"Independent Calibration split reports probability reliability; does not refit weights or decisions",
                "test":"Evaluate once after weight and decision hashes are frozen; no test-based tuning",
                "baselines":["Train prior / majority","Logistic regression on fixed spatial occupancy"],
                "limitations":["No causal connection to PHM process data","Mixed GAN parent/lot IDs unavailable; exact symmetry grouping cannot prove independent synthetic families","WM filtered original Test is not a full standard benchmark score"],
                "manifest_sha256":audit["manifest_sha256"],"prepared_sha256":audit["prepared_sha256"]}
    write_json(run_dir / "protocol.json",protocol)
    print(json.dumps(audit,ensure_ascii=False,indent=2),flush=True)


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("dataset",choices=["wm811k","mixedwm38"])
    parser.add_argument("--data-dir",type=Path,default=Path("data/wafer"))
    parser.add_argument("--run-dir",type=Path,required=True)
    a=parser.parse_args()
    prepare(a.dataset,a.data_dir,a.run_dir)
