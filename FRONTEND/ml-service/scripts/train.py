"""Train the XGBoost fraud model on synthetic labelled laundering graphs.

Parity by construction: every training graph is built from the SAME schemas the
sidecar receives and run through the SAME feature extractor (app.features) used
at inference, so the training distribution IS what the model sees live. Labels
are ground-truth roles from the generator (launderer-controlled wallet = 1;
victim, verified VASP, and ordinary wallets = 0), NOT the heuristic score — the
heuristic and the model stay independent so blending them adds information.

Run from the ml-service/ directory:

    python scripts/train.py

Writes models/xgb_model.json (committed so fraud % works out of the box). The
model is a DEMONSTRATION model trained on synthetic data — surfaced as
model_kind="synthetic-demo" in /health and labelled as such in the UI. To retrain
on real labelled data, replace the generators below with your loader that yields
(nodes, transfers, labels) and keep everything else identical.
"""

from __future__ import annotations

import os
import random
import sys
from typing import Dict, List, Tuple

import numpy as np

# Make `import app...` work whether run as `python scripts/train.py` or `-m`.
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

import xgboost as xgb  # noqa: E402
from sklearn.metrics import average_precision_score, roc_auc_score  # noqa: E402
from sklearn.model_selection import train_test_split  # noqa: E402

from app.features import compute_gds, extract_features, feature_vector  # noqa: E402
from app.graphcore import build_adjacency  # noqa: E402
from app.schemas import VaspAttribution, WalletNodeIn, WalletTransferIn  # noqa: E402

MODEL_OUT = os.path.join(_ROOT, "models", "xgb_model.json")
_BASE_TS = 1_700_000_000_000  # arbitrary ms epoch anchor


class _AddrGen:
    """Deterministic unique, valid lowercase EVM addresses (0x + 40 hex)."""

    def __init__(self) -> None:
        self._i = 0

    def next(self) -> str:
        self._i += 1
        return "0x" + f"{self._i:040x}"


def _node(addr: str, layer: str, balance: float = 0.0, vasp: VaspAttribution | None = None) -> WalletNodeIn:
    return WalletNodeIn(address=addr, chain="ETHEREUM", balance_usd=balance, layer_type=layer, vasp_attribution=vasp)


def _xfer(frm: str, to: str, usd: float, ts_ms: float) -> WalletTransferIn:
    return WalletTransferIn(from_address=frm, to_address=to, chain="ETHEREUM", value_usd=usd, timestamp=ts_ms)


def gen_illicit(rng: random.Random, ag: _AddrGen) -> Tuple[list, list, Dict[str, int]]:
    """victim -> collector -> mules -> peel -> (mixer?) -> deposit -> VASP.

    Laundering wallets move funds fast (30–110s gaps => velocity 1.0), sweep
    almost everything onward (=> depletion, low retention), and some route through
    a shared mixer (=> hops_to_mixer). Labelled 1. Victim + verified VASP => 0."""
    nodes: list = []
    transfers: list = []
    labels: Dict[str, int] = {}
    t0 = _BASE_TS + rng.randint(0, 5_000_000)

    victim = ag.next()
    collector = ag.next()
    vasp_addr = ag.next()
    vasp = VaspAttribution(vasp_name="Demo Exchange", is_verified=True, is_mixer=False, compliance_email="le@demo.exchange")

    principal = float(rng.randint(40_000, 600_000))
    nodes.append(_node(victim, "VICTIM_SOURCE", balance=0.0))
    labels[victim] = 0
    nodes.append(_node(collector, "COLLECTOR", balance=0.0))
    labels[collector] = 1
    nodes.append(_node(vasp_addr, "EXCHANGE", balance=principal, vasp=vasp))
    labels[vasp_addr] = 0

    # victim funds the collector.
    transfers.append(_xfer(victim, collector, principal, t0))

    use_mixer = rng.random() < 0.6
    mixer_addr = None
    if use_mixer:
        mixer_addr = ag.next()
        nodes.append(_node(mixer_addr, "MIXER", balance=0.0, vasp=VaspAttribution(vasp_name="TornadoLike", is_mixer=True)))
        labels[mixer_addr] = 1

    k = rng.randint(2, 4)
    per = principal / k
    for i in range(k):
        mule = ag.next()
        peel = ag.next()
        deposit = ag.next()
        for a, layer in ((mule, "MULE"), (peel, "PEELING_CHAIN"), (deposit, "VASP_DEPOSIT")):
            nodes.append(_node(a, layer, balance=0.0))
            labels[a] = 1

        t1 = t0 + rng.randint(30, 110) * 1000
        t2 = t1 + rng.randint(30, 110) * 1000
        t3 = t2 + rng.randint(30, 110) * 1000
        t4 = t3 + rng.randint(30, 110) * 1000

        # collector -> mule -> peel: near-total sweeps (peel keeps a sliver).
        transfers.append(_xfer(collector, mule, per * 0.99, t1))
        transfers.append(_xfer(mule, peel, per * 0.985, t2))

        if use_mixer and rng.random() < 0.7:
            transfers.append(_xfer(peel, mixer_addr, per * 0.95, t3))
            transfers.append(_xfer(mixer_addr, deposit, per * 0.93, t3 + 20_000))
        else:
            transfers.append(_xfer(peel, deposit, per * 0.95, t3))

        # deposit sweeps into the exchange.
        transfers.append(_xfer(deposit, vasp_addr, per * 0.92, t4))

    return nodes, transfers, labels


def gen_clean(rng: random.Random, ag: _AddrGen) -> Tuple[list, list, Dict[str, int]]:
    """Ordinary economic activity: a hub with customers/suppliers, slow cadence
    (hour+ gaps => low velocity), retained balances (no sweep), no mixer. All 0.

    Includes a legit slow withdrawal to a verified VASP so the model learns that
    'touches an exchange' is not itself fraud — the illicit signal is speed +
    sweep + mixer proximity + centrality, not VASP adjacency alone."""
    nodes: list = []
    transfers: list = []
    labels: Dict[str, int] = {}
    t0 = _BASE_TS + rng.randint(0, 5_000_000)
    hour = 3_600_000

    hub = ag.next()
    nodes.append(_node(hub, "MERCHANT", balance=float(rng.randint(5_000, 50_000))))
    labels[hub] = 0

    include_vasp = rng.random() < 0.5
    if include_vasp:
        vasp_addr = ag.next()
        nodes.append(
            _node(vasp_addr, "EXCHANGE", balance=0.0, vasp=VaspAttribution(vasp_name="Demo Exchange", is_verified=True, is_mixer=False, compliance_email="le@demo.exchange"))
        )
        labels[vasp_addr] = 0

    n_cust = rng.randint(3, 7)
    ts = t0
    total_in = 0.0
    for _ in range(n_cust):
        cust = ag.next()
        nodes.append(_node(cust, "P2P_USER", balance=float(rng.randint(1_000, 20_000))))
        labels[cust] = 0
        amt = float(rng.randint(200, 8_000))
        total_in += amt
        ts += rng.randint(3, 30) * hour  # slow, human cadence
        transfers.append(_xfer(cust, hub, amt, ts))

    # Hub retains most, pays a supplier / withdraws a fraction slowly.
    n_out = rng.randint(1, 3)
    for _ in range(n_out):
        dst = vasp_addr if (include_vasp and rng.random() < 0.5) else ag.next()
        if dst != (vasp_addr if include_vasp else None) and dst not in labels:
            nodes.append(_node(dst, "SUPPLIER", balance=float(rng.randint(1_000, 15_000))))
            labels[dst] = 0
        ts += rng.randint(5, 40) * hour
        transfers.append(_xfer(hub, dst, total_in * rng.uniform(0.05, 0.25), ts))

    return nodes, transfers, labels


def build_dataset(n_illicit: int, n_clean: int, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    rng = random.Random(seed)
    ag = _AddrGen()
    X: List[List[float]] = []
    y: List[int] = []

    def ingest(nodes: list, transfers: list, labels: Dict[str, int]) -> None:
        adj = build_adjacency(nodes, transfers)
        gds = compute_gds(adj)
        for node in nodes:
            feats = extract_features(adj, node.address, gds)
            X.append(feature_vector(feats))
            y.append(int(labels.get(node.address, 0)))

    for _ in range(n_illicit):
        ingest(*gen_illicit(rng, ag))
    for _ in range(n_clean):
        ingest(*gen_clean(rng, ag))

    return np.asarray(X, dtype=np.float32), np.asarray(y, dtype=np.int32)


def main() -> None:
    print("Generating synthetic labelled graphs ...")
    X, y = build_dataset(n_illicit=280, n_clean=280, seed=42)
    pos = int(y.sum())
    neg = int(len(y) - pos)
    print(f"  wallets: {len(y)}  (fraud={pos}, clean={neg})")

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    # Positional feature contract (NO feature names) — must match model.predict_fraud.
    dtrain = xgb.DMatrix(X_tr, label=y_tr)
    dtest = xgb.DMatrix(X_te, label=y_te)

    params = {
        "objective": "binary:logistic",
        "eval_metric": ["logloss", "auc"],
        "max_depth": 5,
        "eta": 0.08,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "min_child_weight": 2.0,
        "lambda": 1.0,
        "base_score": 0.5,
        "scale_pos_weight": (neg / pos) if pos else 1.0,
        "seed": 42,
    }

    print("Training XGBoost (280 rounds) ...")
    booster = xgb.train(
        params,
        dtrain,
        num_boost_round=280,
        evals=[(dtrain, "train"), (dtest, "test")],
        verbose_eval=False,
    )

    p_te = booster.predict(dtest)
    p_tr = booster.predict(dtrain)
    print(f"  train AUC={roc_auc_score(y_tr, p_tr):.4f}  test AUC={roc_auc_score(y_te, p_te):.4f}")
    print(f"  train AP ={average_precision_score(y_tr, p_tr):.4f}  test AP ={average_precision_score(y_te, p_te):.4f}")

    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    booster.save_model(MODEL_OUT)
    print(f"Saved model -> {MODEL_OUT}")


if __name__ == "__main__":
    main()
