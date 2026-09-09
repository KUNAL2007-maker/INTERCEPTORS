# CryptoTrace ML sidecar

A small **FastAPI** service that runs the *real* versions of three things the
Next.js app otherwise only approximates in-memory:

1. **GDS features** — PageRank, betweenness centrality, Louvain community size and
   local clustering coefficient, computed natively with **NetworkX** (or **Neo4j
   GDS** when configured). The TypeScript fallback in `src/lib/graph-algorithms.ts`
   fakes these four with degree/reach approximations and hardcoded zeros; here
   they are genuine.
2. **A\*** (`f = g + h`) path-finding from the victim seed to the nearest
   *serviceable* VASP, with an **admissible landmark heuristic** (reverse
   multi-source BFS = minimum remaining hops). Unit edge cost ⇒ the heuristic is
   admissible **and** consistent ⇒ the path is provably optimal.
3. **XGBoost** fraud probability per wallet — a native gradient-boosted model,
   surfaced as `fraud_probability` on a 0–100 scale.

The flow the stakeholder asked for, end to end:

```
Blockchain trace ─▶ (Neo4j) ─▶ GDS features ─▶ XGBoost ─▶ fraud probability ─▶ alert
                                    ▲                ▲
                                 NetworkX        native XGBoost
                              (default, no        (models/xgb_model.json)
                               Neo4j needed)
```

## Design contract (parity)

The 18-feature vector and its **order** (`app/features.py` → `FEATURE_NAMES`)
mirror `FEATURE_NAMES` in `src/lib/graph-algorithms.ts` exactly. Fourteen features
reproduce the TypeScript formulas byte-for-byte; the four GDS features are the
real upgrade. `hops_to_sanctioned` and `gas_parent_syndicate_size` stay at the
prototype defaults (no detector populates them). Address canonicalisation matches
`canon()`: EVM `0x…` lowercased, TRON/BTC left case-sensitive.

The sidecar returns **features + fraud_probability + the A\* path**. The Next.js
`/api/graph` route computes the Factors A–G heuristic and the final blended score
on those features, reusing the app's own `scoreFactorsAtoG` / `blendRiskScore` —
one source of truth for the score.

## Honesty (state this to the jury)

- The shipped model is a **demonstration model trained on synthetic data**
  (`model_kind: "synthetic-demo"` in `/health`, labelled in the UI). Retrain on
  real labelled data via `scripts/train.py` (swap the generators for your loader).
- **A\*** is the genuine `f = g + h` path-finder over the built graph. The
  *discovery* walk (which wallets to fetch from providers) stays honest best-first
  BFS in `src/lib/blockchain.ts` — A\* can't run there because the VASP location
  isn't known until discovered.

## Run

```bash
cd ml-service
python -m venv .venv && . .venv/Scripts/activate    # Windows; use bin/activate on *nix
pip install -r requirements.txt

# (Re)train + commit the model — already committed, only needed to refresh it:
python scripts/train.py

# Serve:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then point the Next.js app at it:

```bash
# FRONTEND/.env.local
ML_SERVICE_URL=http://127.0.0.1:8000
```

Restart Next.js. With the sidecar up you get real GDS + XGBoost + A\*; with it
down (or `ML_SERVICE_URL` unset) the app degrades cleanly to today's in-memory
heuristic. Nothing breaks either way.

## Endpoints

- `GET /health` → `{ ok, xgboost_loaded, model_kind, neo4j_available, gds_available, featureNames }`
- `POST /analyze` → body `{ nodes: WalletNode[], transfers: WalletTransfer[], seed }`,
  returns `{ perWallet:[{address, features, fraud_probability}], astarPathToVasp, gdsSource, mlSource, modelKind, featureNames }`.

## Optional: Neo4j GDS

Set `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` (see `.env.example`) and install a
Neo4j server with the **Graph Data Science** plugin. The service will project each
trace and stream real `gds.pageRank / betweenness / louvain /
localClusteringCoefficient`; on **any** error it falls back to NetworkX. The
victim→VASP path stays our A\* — `gds.shortestPath.astar` is geospatial-only.

## Tests

```bash
cd ml-service && python -m pytest -q
```

Covers feature parity (hand-computed graph), A\* optimality + heuristic
consistency (random graphs), and model ranking (mule ≫ ordinary wallet).

## Deployment (Render)

Runs as its own always-on **private** service alongside Next.js — see the
`render.yaml` Blueprint at the repository root (`../../render.yaml`). Render
allows persistent processes, so uvicorn stays up and the web service calls it
over the private network (no public URL, no serverless timeout).
