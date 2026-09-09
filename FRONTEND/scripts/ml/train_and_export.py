#!/usr/bin/env python3
"""
train_and_export.py — CryptoTrace wallet-risk model: train + export to ONNX.

WHY THIS FILE IS DURABLE
------------------------
The Node/TypeScript runtime (src/lib/ml/risk-model-onnx.ts) is a throwaway
bridge: it only exists to run these artifacts from the Next.js server until the
app is ported to a Python backend. THIS script and the artifacts it emits are
the durable half — they survive that migration unchanged. Two forward intents
are baked in on purpose:

  1. Retrain on a real dataset.  Replace generate_synthetic_dataset() with
     load_real_dataset() (a stub is provided) once labelled, real-world wallet
     data exists. Nothing else changes: the feature contract, the scaler, and
     the ONNX export are identical.
  2. Port the whole app to Python later.  When that happens this trainer stays;
     only the .ts wrapper is deleted, and the models are consumed directly by
     the Python service.

THE INFERENCE CONTRACT (must match src/lib/graph-algorithms.ts + risk-model-onnx.ts)
------------------------------------------------------------------------------
  * 18 features, in the EXACT order of FEATURE_NAMES below (index 0..17). The TS
    side sends featureVector(features) in this order; a reorder here silently
    corrupts every prediction.
  * The TS side STANDARDISES each vector as (x - mean) / scale using scaler.json
    BEFORE calling the model. Therefore the models must be trained on SCALED
    features, and scaler.json must carry sklearn StandardScaler's mean_ / scale_.
  * Input tensor name: "float_input", dtype float32, shape [None, 18].
  * ZipMap DISABLED, so each model's probability output is a plain float tensor
    of shape [N, 2]; column 1 is P(illicit). The TS loader reads column 1.
  * Ensemble blend ml_score = 0.6 * P_xgb + 0.4 * P_gb (in [0,1]) * 100. The
    blend happens on the TS side; here we only need each model to emit a
    calibrated positive-class probability.

ARTIFACTS WRITTEN (to FRONTEND/src/lib/ml/):
  * risk_model_xgb.onnx
  * risk_model_gb.onnx
  * scaler.json

USAGE
-----
  pip install numpy scikit-learn xgboost skl2onnx onnxmltools onnx onnxruntime
  python scripts/ml/train_and_export.py                 # synthetic (placeholder)
  python scripts/ml/train_and_export.py --real data.csv # once you have real data

The app runs fully WITHOUT these artifacts — the model is an analytical overlay
on top of the always-present Factors A-G heuristic. Absent artifacts => the
route scores on the heuristic alone. So running this is optional, not required.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# ── Feature order — MUST mirror FEATURE_NAMES in src/lib/graph-algorithms.ts ──
FEATURE_NAMES = [
    "in_degree",                 # 0  inbound transfer count
    "out_degree",                # 1  outbound transfer count
    "degree_ratio",              # 2  out_degree / (in_degree + 1)
    "total_inflow_usd",          # 3  summed USD received
    "total_outflow_usd",         # 4  summed USD sent
    "volume_retention_ratio",    # 5  (in - out) / in, clamped [0,1]; ~0 == full sweep
    "avg_tx_interval_seconds",   # 6  mean gap between a wallet's transfers
    "velocity_burst_score",      # 7  banded from the interval; <120s == 1.0
    "hops_to_mixer",             # 8  undirected shortest path to a mixer, 0 == none
    "hops_to_sanctioned",        # 9  shortest path to an OFAC/sanctioned node
    "hops_to_vasp",              # 10 directed shortest path to a serviceable exchange
    "balance_depletion_rate",    # 11 1.0 when the balance was wiped out
    "gas_parent_syndicate_size", # 12 sister wallets funded by a shared gas parent
    "unique_counterparties",     # 13 distinct interacting addresses
    "pagerank_score",            # 14 degree-weighted centrality approximation, [0,1]
    "betweenness_centrality",    # 15 bridge-node centrality
    "community_size",            # 16 size of the wallet's local cluster
    "local_clustering_coeff",    # 17 triangle density around the wallet
]
N_FEATURES = len(FEATURE_NAMES)
assert N_FEATURES == 18, "The inference contract is fixed at 18 features."

# The four features the graph layer never populates at inference (see
# UNPOPULATED_DEFAULTS in graph-algorithms.ts). Held at these constants at
# inference time, so training data that varies them wildly teaches the model a
# signal it will never actually receive. We keep them near their defaults.
INFERENCE_DEFAULTS = {
    "hops_to_sanctioned": 0.0,
    "gas_parent_syndicate_size": 1.0,
    "betweenness_centrality": 0.0,
    "local_clustering_coeff": 0.0,
}

TARGET_DIR = Path(__file__).resolve().parents[2] / "src" / "lib" / "ml"


# ── Data ──────────────────────────────────────────────────────────────────────
def generate_synthetic_dataset(n_samples: int = 4000, seed: int = 42):
    """A PLACEHOLDER dataset with class-correlated structure.

    This is a stand-in so the export pipeline is runnable and the emitted model
    is valid. It is NOT real-world data and should not be presented as trained
    on real cases. Replace with load_real_dataset() for anything court-facing.

    Illicit wallets (label 1) tend to: sweep funds out (low retention, high
    depletion), sit close to a mixer, move in fast bursts, fan out to many fresh
    counterparties. Clean wallets (label 0) are the mirror image. Gaussian noise
    keeps the classes from being trivially separable.
    """
    import numpy as np

    rng = np.random.default_rng(seed)
    n_illicit = n_samples // 2
    n_clean = n_samples - n_illicit

    def clip(a, lo, hi):
        return np.clip(a, lo, hi)

    def block(n, illicit: bool):
        cols = {}
        if illicit:
            cols["in_degree"] = clip(rng.normal(8, 4, n), 1, 60)
            cols["out_degree"] = clip(rng.normal(14, 6, n), 1, 80)
            cols["total_inflow_usd"] = clip(rng.lognormal(11, 1.2, n), 0, None)
            cols["volume_retention_ratio"] = clip(rng.normal(0.06, 0.06, n), 0, 1)
            cols["avg_tx_interval_seconds"] = clip(rng.normal(90, 60, n), 1, None)
            cols["velocity_burst_score"] = clip(rng.normal(0.85, 0.15, n), 0, 1)
            cols["hops_to_mixer"] = rng.choice([1, 1, 2, 3], size=n).astype(float)
            cols["hops_to_vasp"] = rng.choice([1, 2, 2, 3], size=n).astype(float)
            cols["balance_depletion_rate"] = clip(rng.normal(0.9, 0.12, n), 0, 1)
            cols["unique_counterparties"] = clip(rng.normal(18, 8, n), 1, None)
            cols["pagerank_score"] = clip(rng.normal(0.55, 0.2, n), 0, 1)
            cols["community_size"] = clip(rng.normal(9, 4, n), 1, None)
        else:
            cols["in_degree"] = clip(rng.normal(6, 3, n), 1, 40)
            cols["out_degree"] = clip(rng.normal(5, 3, n), 1, 40)
            cols["total_inflow_usd"] = clip(rng.lognormal(9.5, 1.0, n), 0, None)
            cols["volume_retention_ratio"] = clip(rng.normal(0.55, 0.2, n), 0, 1)
            cols["avg_tx_interval_seconds"] = clip(rng.normal(90000, 60000, n), 1, None)
            cols["velocity_burst_score"] = clip(rng.normal(0.15, 0.12, n), 0, 1)
            cols["hops_to_mixer"] = rng.choice([0, 0, 0, 4, 5], size=n).astype(float)
            cols["hops_to_vasp"] = rng.choice([1, 2, 3, 4], size=n).astype(float)
            cols["balance_depletion_rate"] = clip(rng.normal(0.25, 0.2, n), 0, 1)
            cols["unique_counterparties"] = clip(rng.normal(7, 4, n), 1, None)
            cols["pagerank_score"] = clip(rng.normal(0.25, 0.15, n), 0, 1)
            cols["community_size"] = clip(rng.normal(4, 2, n), 1, None)

        # degree_ratio derives from the two degree columns, as in the TS extractor.
        cols["degree_ratio"] = cols["out_degree"] / (cols["in_degree"] + 1.0)

        # Features the graph layer never populates at inference: hold at defaults
        # (+ negligible jitter so StandardScaler.scale_ is never exactly zero).
        for name, val in INFERENCE_DEFAULTS.items():
            cols[name] = np.full(n, val) + rng.normal(0, 1e-6, n)

        return np.column_stack([cols[name] for name in FEATURE_NAMES])

    x_illicit = block(n_illicit, True)
    x_clean = block(n_clean, False)
    x = np.vstack([x_illicit, x_clean]).astype("float64")
    y = np.concatenate([np.ones(n_illicit), np.zeros(n_clean)]).astype("int64")

    # Shuffle so the split is not class-ordered.
    idx = rng.permutation(len(y))
    return x[idx], y[idx]


def load_real_dataset(path: str):
    """Load a real, labelled dataset from CSV.

    Expected columns: the 18 FEATURE_NAMES plus a `label` column (1 = illicit,
    0 = clean). This is the intended replacement for the synthetic generator —
    wire it to your real-world data when you have it.
    """
    import numpy as np

    try:
        import pandas as pd
    except ImportError:
        sys.exit("Reading a real dataset needs pandas: pip install pandas")

    df = pd.read_csv(path)
    missing = [c for c in FEATURE_NAMES + ["label"] if c not in df.columns]
    if missing:
        sys.exit(f"Dataset {path} is missing required columns: {missing}")
    x = df[FEATURE_NAMES].to_numpy(dtype="float64")
    y = df["label"].to_numpy(dtype="int64")
    return x, y


# ── Train + export ──────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description="Train and export the wallet-risk ensemble to ONNX.")
    ap.add_argument("--real", metavar="CSV", help="Path to a real labelled dataset (else synthetic).")
    ap.add_argument("--samples", type=int, default=4000, help="Synthetic sample count (default 4000).")
    ap.add_argument("--seed", type=int, default=42, help="RNG seed for reproducibility.")
    ap.add_argument("--out", default=str(TARGET_DIR), help="Output dir for artifacts.")
    args = ap.parse_args()

    try:
        import numpy as np
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler
        from sklearn.metrics import roc_auc_score, accuracy_score
    except ImportError as e:
        sys.exit(f"Missing a core dependency ({e.name}). "
                 f"pip install numpy scikit-learn xgboost skl2onnx onnxmltools onnx onnxruntime")

    try:
        from xgboost import XGBClassifier
    except ImportError:
        sys.exit("xgboost is required: pip install xgboost")

    # ONNX conversion stack. XGBoost needs its converter registered with skl2onnx.
    try:
        from skl2onnx import convert_sklearn, update_registered_converter
        from skl2onnx.common.data_types import FloatTensorType
        from skl2onnx.common.shape_calculator import calculate_linear_classifier_output_shapes
        from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
        import onnx
    except ImportError as e:
        sys.exit(f"Missing an ONNX-export dependency ({e.name}). "
                 f"pip install skl2onnx onnxmltools onnx")

    # 1) Data
    if args.real:
        x, y = load_real_dataset(args.real)
        print(f"[data] real dataset: {x.shape[0]} rows, {x.shape[1]} features")
    else:
        x, y = generate_synthetic_dataset(args.samples, args.seed)
        print(f"[data] SYNTHETIC placeholder: {x.shape[0]} rows "
              f"({int(y.sum())} illicit / {int((1 - y).sum())} clean). "
              f"Replace with --real for court-facing use.")

    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.2, random_state=args.seed, stratify=y)

    # 2) Scale. The TS side reproduces exactly this transform from scaler.json,
    #    so the models MUST see scaled features both here and at inference.
    scaler = StandardScaler().fit(x_tr)
    x_tr_s = scaler.transform(x_tr).astype("float32")
    x_te_s = scaler.transform(x_te).astype("float32")

    # 3) Train on SCALED features.
    xgb = XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.08,
        subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
        random_state=args.seed, n_jobs=-1,
    ).fit(x_tr_s, y_tr)

    gb = GradientBoostingClassifier(
        n_estimators=250, max_depth=3, learning_rate=0.1,
        subsample=0.9, random_state=args.seed,
    ).fit(x_tr_s, y_tr)

    # Report — sanity, not a court metric (synthetic data unless --real).
    for name, m in (("xgb", xgb), ("gb", gb)):
        p = m.predict_proba(x_te_s)[:, 1]
        print(f"[eval] {name}: AUC={roc_auc_score(y_te, p):.3f} "
              f"ACC={accuracy_score(y_te, (p >= 0.5).astype(int)):.3f}")

    # 4) Register XGBoost's converter with skl2onnx, then convert BOTH models
    #    with a shared input name and ZipMap OFF (probabilities as a float tensor).
    update_registered_converter(
        XGBClassifier, "XGBoostXGBClassifier",
        calculate_linear_classifier_output_shapes, convert_xgboost,
        options={"nocl": [True, False], "zipmap": [True, False, "columns"]},
    )
    initial_types = [("float_input", FloatTensorType([None, N_FEATURES]))]

    onx_xgb = convert_sklearn(
        xgb, initial_types=initial_types, target_opset=13,
        options={id(xgb): {"zipmap": False}},
    )
    onx_gb = convert_sklearn(
        gb, initial_types=initial_types, target_opset=13,
        options={id(gb): {"zipmap": False}},
    )

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    xgb_path = out / "risk_model_xgb.onnx"
    gb_path = out / "risk_model_gb.onnx"
    scaler_path = out / "scaler.json"

    with open(xgb_path, "wb") as f:
        f.write(onx_xgb.SerializeToString())
    with open(gb_path, "wb") as f:
        f.write(onx_gb.SerializeToString())
    with open(scaler_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "mean": scaler.mean_.astype(float).tolist(),
                "scale": scaler.scale_.astype(float).tolist(),
                "feature_names": FEATURE_NAMES,
            },
            f, indent=2,
        )

    print(f"[write] {xgb_path}")
    print(f"[write] {gb_path}")
    print(f"[write] {scaler_path}")

    # 5) Faithfulness check: reload via onnxruntime and confirm the ONNX
    #    probabilities match sklearn/xgboost on the (already-scaled) test set.
    #    This is exactly the path the TS wrapper takes, so a pass here means the
    #    Node runtime will read the same numbers.
    try:
        import onnxruntime as ort
    except ImportError:
        print("[verify] onnxruntime not installed — skipping the reload check "
              "(pip install onnxruntime to enable it).")
        return 0

    def onnx_pos_prob(path: Path, xs: "np.ndarray") -> "np.ndarray":
        sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
        in_name = sess.get_inputs()[0].name
        outs = sess.get_outputs()
        prob_name = next((o.name for o in outs if "prob" in o.name.lower()), outs[-1].name)
        res = sess.run([prob_name], {in_name: xs.astype("float32")})[0]
        arr = np.asarray(res)
        return arr[:, 1] if arr.ndim == 2 and arr.shape[1] == 2 else arr.ravel()

    sample = x_te_s[:200]
    for name, model, path in (("xgb", xgb, xgb_path), ("gb", gb, gb_path)):
        ref = model.predict_proba(sample)[:, 1]
        got = onnx_pos_prob(path, sample)
        max_diff = float(np.max(np.abs(ref - got))) if len(got) == len(ref) else float("nan")
        status = "OK" if max_diff < 1e-3 else "MISMATCH"
        print(f"[verify] {name}: max|onnx - sklearn| = {max_diff:.2e}  [{status}]")

    print("\nDone. The Node runtime (risk-model-onnx.ts) will pick these up on next start.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
