"""CryptoTrace ML sidecar (SIH26183).

A FastAPI service that runs the *real* versions of the three things the Next.js
app only approximates in-memory:

  1. GDS features — PageRank, betweenness, Louvain community size and local
     clustering, computed natively with NetworkX (or Neo4j GDS when configured),
     instead of the degree/reach approximations the TypeScript fallback uses.
  2. A* (f = g + h) path-finding from the victim seed to the nearest serviceable
     VASP, with an admissible landmark heuristic (reverse-BFS min remaining hops).
  3. XGBoost fraud probability per wallet, trained on synthetic labelled graphs
     run through the SAME feature extractor used at inference (parity by
     construction).

Contract: the 18-feature vector and its order (features.FEATURE_NAMES) mirror
src/lib/graph-algorithms.ts FEATURE_NAMES exactly. The Next.js /api/graph route
calls POST /analyze when ML_SERVICE_URL is set and degrades to its in-memory
TypeScript engine when the sidecar is unreachable.
"""

__version__ = "0.1.0"
