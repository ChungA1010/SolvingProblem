from __future__ import annotations

import numpy as np
import torch
from torch import nn


class WaferCNN(nn.Module):
    """Small two-channel spatial CNN; the head retains the wafer layout."""
    def __init__(self, outputs):
        super().__init__()
        layers=[]
        previous=2
        for channels in [24,48,96]:
            layers.extend([nn.Conv2d(previous,channels,3,padding=1,bias=False),nn.BatchNorm2d(channels),nn.ReLU(),
                           nn.Conv2d(channels,channels,3,padding=1,bias=False),nn.BatchNorm2d(channels),nn.ReLU(),nn.MaxPool2d(2)])
            previous=channels
        self.features=nn.Sequential(*layers,nn.AvgPool2d(2))
        self.head=nn.Sequential(nn.Flatten(),nn.Linear(96*4*4,192),nn.ReLU(),nn.Dropout(0.25),nn.Linear(192,outputs))

    def forward(self,x):
        return self.head(self.features(x))


def spatial_features(x):
    a=np.asarray(x,dtype=np.float32)/255
    pooled=a.reshape(len(a),2,8,8,8,8).mean(axis=(3,5)).reshape(len(a),-1)
    yy,xx=np.mgrid[-1:1:64j,-1:1:64j]
    radius=np.hypot(yy,xx)
    radial=[]
    for lo,hi in zip(np.linspace(0,1.45,9)[:-1],np.linspace(0,1.45,9)[1:]):
        mask=(radius>=lo)&(radius<hi)
        valid=a[:,0,mask].sum(axis=1)
        radial.append(a[:,1,mask].sum(axis=1)/np.maximum(valid,1e-6))
    return np.column_stack([pooled,*radial])


@torch.inference_mode()
def logits_for(model,x,device="cpu",batch_size=512):
    model.eval()
    values=[]
    for start in range(0,len(x),batch_size):
        batch=torch.from_numpy(np.asarray(x[start:start+batch_size])).to(device=device,dtype=torch.float32)/255
        values.append(model(batch).cpu().numpy())
    return np.concatenate(values)
