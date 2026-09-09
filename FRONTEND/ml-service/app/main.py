"""FastAPI entrypoint — GET /health and POST /analyze.

Called server-to-server by the Next.js /api/graph route (src/lib/ml-service.ts)
when ML_SERVICE_URL is set; the route degrades to its in-memory TypeScript engine
whenever this service is unreachable, so CORS is unnecessary.

Pipeline per request:  build adjacency  ->  GDS (Neo4j if configured, else
NetworkX)  ->  18-feature extraction  ->  XGBoost fraud probability  ->  A* path
victim->VASP. The heuristic Factors A–G and the final blended score are computed
by the TypeScript route on the features we return, reusing the app's existing
scoreFactorsAtoG / blendRiskScore (single source of truth for the score).
"""

from __future__ import annotations

from typing import Dict, Optional, Tuple

from fastapi import FastAPI

from . import config, model, neo4j_gds
from .astar import astar_path_to_vasp
from .features import FEATURE_NAMES, compute_gds, extract_features, feature_vector
from .graphcore import Adjacency, build_adjacency
from .schemas import AnalyzeRequest, AnalyzeResponse

app = FastAPI(title="CryptoTrace ML sidecar", version="0.1.0")


def _gds_with_source(adj: Adjacency) -> Tuple[Dict[str, Dict[str, float]], str]:
    """Prefer Neo4j GDS when configured and reachable; fall back to NetworkX."""
    if config.neo4j_available():
        neo = neo4j_gds.compute_gds_neo4j(adj)
        if neo is not None:
            return neo, "neo4j-gds"
    return compute_gds(adj), "networkx"


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "service": "cryptotrace-ml-sidecar",
        "version": app.version,
        "xgboost_loaded": model.model_loaded(),
        "model_kind": "synthetic-demo" if model.model_loaded() else "none",
        "neo4j_available": config.neo4j_available(),
        "gds_available": True,  # NetworkX is always available
        "featureNames": FEATURE_NAMES,
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    adj = build_adjacency(req.nodes, req.transfers)
    gds, gds_source = _gds_with_source(adj)

    rows = []
    feats_by_addr = []
    for node in req.nodes:
        feats = extract_features(adj, node.address, gds)
        feats_by_addr.append((node.address, feats))
        rows.append(feature_vector(feats))

    fraud_scores = model.predict_fraud(rows)
    model_loaded = model.model_loaded()

    per_wallet = [
        {"address": addr, "features": feats, "fraud_probability": fraud}
        for (addr, feats), fraud in zip(feats_by_addr, fraud_scores)
    ]

    astar: Optional[dict] = astar_path_to_vasp(adj, req.seed)

    return AnalyzeResponse(
        perWallet=per_wallet,
        astarPathToVasp=astar,
        gdsSource=gds_source,
        mlSource="python-xgboost" if model_loaded else "features-only",
        modelKind="synthetic-demo" if model_loaded else "none",
        featureNames=FEATURE_NAMES,
    )
