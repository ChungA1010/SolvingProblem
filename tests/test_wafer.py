import io
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
import torch

from cmp_ml.wafer_data import WaferUnpickler,encode_map,image_group
from cmp_ml.wafer_model import WaferCNN,spatial_features
from cmp_ml.wafer_train import metrics,threshold_search


def test_ternary_transform_preserves_occupancy_and_rejects_unknown():
    raw=np.ones((31,47),dtype=np.uint8);raw[10:20,10:20]=2
    image=encode_map(raw)
    assert image.shape==(2,64,64) and image.dtype==np.uint8
    assert np.all(image[1]<=image[0]) and image[1].sum()>0
    for bad in [np.zeros((3,3)),np.full((3,3),3),np.full((3,3),np.nan),np.array([["1","2"],["0","1"]])]:
        with pytest.raises(ValueError):encode_map(bad)


def test_orbit_groups_all_augmented_inputs_and_no_label_features():
    raw=np.ones((52,52),dtype=np.uint8);raw[1:3,7:15]=2
    x=encode_map(raw);expected=image_group(x)
    for k in range(4):
        a=np.rot90(x,k,axes=(-2,-1))
        assert image_group(a)==expected==image_group(a[...,::-1])
    assert spatial_features(x[None]).shape==(1,136)


def test_untrusted_pickle_constructor_is_rejected():
    with pytest.raises(pickle.UnpicklingError):WaferUnpickler(io.BytesIO(pickle.dumps(Path("example")))).load()


def test_rare_labels_thresholds_and_metrics():
    y=np.array([[0,0],[1,0],[0,1],[1,1]])
    p=np.array([[.1,.2],[.3,.2],[.1,.8],[.3,.8]])
    thresholds=threshold_search(y,p)
    assert metrics(y,p,"mixedwm38",thresholds)["macro_f1"]==1
    assert metrics(y,p,"mixedwm38",thresholds)["accuracy"]==1


def test_cpu_checkpoint_shape_and_repeatability():
    torch.set_num_threads(2);torch.manual_seed(1)
    model=WaferCNN(8).eval();x=torch.zeros(2,2,64,64)
    with torch.inference_mode():
        a=model(x);b=model(x)
    assert a.shape==(2,8) and torch.equal(a,b)


@pytest.fixture(scope="module")
def serving_models():
    from cmp_ml.api import Classifiers
    return Classifiers(Path(__file__).resolve().parents[1])


@pytest.mark.parametrize("dataset",["wm811k","mixedwm38"])
def test_exported_models_serve_numeric_maps(serving_models,dataset):
    from cmp_ml.api import WaferInput
    x=np.ones((52,52),dtype=int);x[10:20,10:20]=2
    request=WaferInput(dataset=dataset,width=52,height=52,pixels=x.ravel().tolist())
    a=serving_models.predict(request);b=serving_models.predict(request)
    assert a==b
    assert len(a["scores"])==(9 if dataset=="wm811k" else 8)
    assert all(0<=row["score"]<=1 for row in a["scores"])
    if dataset=="wm811k":assert sum(row["score"] for row in a["scores"])==pytest.approx(1.,abs=1e-6)


def test_wafer_serving_shape_and_pixel_validation(serving_models):
    from cmp_ml.api import WaferInput
    from cmp_ml.runtime import InferenceError
    from pydantic import ValidationError
    with pytest.raises(ValidationError):WaferInput(dataset="wm811k",width=2,height=2,pixels=[0,1,2,3])
    with pytest.raises(ValidationError):WaferInput(dataset="wm811k",width=2,height=2,pixels=[0,1,2,True])
    with pytest.raises(InferenceError):serving_models.predict(WaferInput(dataset="wm811k",width=3,height=3,pixels=[0,1,2,1]))
    with pytest.raises(InferenceError):serving_models.predict(WaferInput(dataset="mixedwm38",width=2,height=2,pixels=[0,1,2,1]))
