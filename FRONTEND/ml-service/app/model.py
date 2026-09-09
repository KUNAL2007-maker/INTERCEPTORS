"""XGBoost fraud model — native load + predict.

No ONNX, no scaler (trees are scale-invariant). The model is trained by
scripts/train.py on synthetic labelled graphs run through THIS package's feature
extractor, so the training distribution is, by construction, what the model sees
at inference. Loaded once, lazily, and cached. When the model file is absent the
service still returns features + A* (fraud_probability = null) — nothing breaks.

Feature ordering is positional: train.py builds DMatrix rows in FEATURE_NAMES
order with NO feature names, and we predict the same way, so the column contract
is index-based and cannot silently drift on a name mismatch.
"""

from __future__ import annotations

import os
from typing import List, Optional

import numpy as np
import xgboost as xgb

from . import config

_booster: Optional[xgb.Booster] = None
_load_attempted = False


def load_model() -> Optional[xgb.Booster]:
    """Load and cache the committed booster. Returns None if the file is missing
    or unreadable (the caller then reports fraud_probability = null)."""
    global _booster, _load_attempted
    if _load_attempted:
        return _booster
    _load_attempted = True
    path = config.model_path()
    if not os.path.exists(path):
        return None
    try:
        b = xgb.Booster()
        b.load_model(path)
        _booster = b
    except Exception:
        _booster = None
    return _booster


def model_loaded() -> bool:
    return load_model() is not None


def predict_fraud(rows: List[List[float]]) -> List[Optional[float]]:
    """Map 18-float feature rows (FEATURE_NAMES order) to fraud probabilities on
    a 0–100 scale. Returns a list of None (same length) when no model is loaded."""
    booster = load_model()
    if booster is None or not rows:
        return [None] * len(rows)
    try:
        matrix = xgb.DMatrix(np.asarray(rows, dtype=np.float32))
        probs = booster.predict(matrix)
        return [float(p) * 100.0 for p in probs]
    except Exception:
        return [None] * len(rows)
