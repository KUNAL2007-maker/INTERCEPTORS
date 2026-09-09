# Prototype 01 — AI/ML Doctrine

> **What this document is.** The doctrine for the system's **AI/ML risk layer**: what it is,
> what algorithms it uses, how it is trained, and — most importantly — the hard line it may
> never cross. It exists because the Problem Statement explicitly asks for *AI/ML-assisted
> risk detection* and *automated pattern recognition for fraud typologies*, and the honest
> position is that the finalized algorithm barely touches ML today (see §8).
>
> **What it draws on.** `RESEARCH/SET 8` (the ML blueprint — GBM/LightGBM scoring, GAE-GCN,
> cost-sensitive thresholds, the I1–I6 topological indicators, Louvain + temporal split),
> the public **Elliptic** labelled Bitcoin dataset, and Hafiz's real on-chain cases.
>
> **Governed by** [`01_PHILOSOPHY.md`](01_PHILOSOPHY.md) (esp. §4 Leads-vs-Evidence, §5
> confidence-as-a-gate, §7 anti-goals). Serves the decisions in
> [`02_ALGORITHM_DECISIONS.md`](02_ALGORITHM_DECISIONS.md) (new **Part H**, D17–D19) and runs
> on the datastores in [`03_STACK_AND_DATA_ARCHITECTURE.md`](03_STACK_AND_DATA_ARCHITECTURE.md).

---

## 1. The gap this closes — stated honestly

The Problem Statement asks for two AI capabilities we do not yet have:

1. **AI/ML-assisted risk detection** — a learned "how suspicious is this wallet" signal.
2. **Automated pattern recognition for fraud typologies** — naming the *shape* of the crime
   (peel chain, rapid dispersal, collector/sink mixing, proxy).

Today the system scores **near-zero** on both: the only "typology" logic is a stub
(`peel = len(transfers) >= 3`), attribution leans on a hand-maintained address registry, and
there is **no trained model anywhere** (§8). A competing SIH entry won with a GNN. This
doctrine closes the gap **without** betraying the court-admissibility prime directive.

> The move is not "bolt on a neural net to look modern." It is: add a learned layer that
> makes an investigator **faster and better-directed**, while keeping every court-facing
> claim exactly as recomputable and human-certified as before.

---

## 2. The prime directive extension — AI ranks, it never rules

Everything in [`01 §4`](01_PHILOSOPHY.md) (Leads vs. Evidence) applies to the AI layer with
**no exception**. A model output is a **lead** — the strongest kind of "look here first" — and
it stays in the lead column forever.

```
┌──────────────────────────────┐        ┌──────────────────────────────────┐
│  AI/ML OUTPUT  (a LEAD)      │        │  EVIDENCE (court)                 │
│  ─────────────────────       │        │  ──────────────────────────       │
│  • a suspicion score 0–100   │  ──►   │  • a verified VASP address        │
│  • a typology tag            │  gate  │  • a deterministic trace + hash   │
│  • a syndicate cluster       │  (P1)  │  • a stated error rate            │
│  • ranks where to look       │  never │  • a named human certificate      │
│  • MAY be wrong — that's OK  │  auto  │  • THIS enters a dossier          │
│  • NEVER freezes anything    │        │  • a model score NEVER appears    │
└──────────────────────────────┘        └──────────────────────────────────┘
```

Anchored to the principles:

- **P1 (never assert what you cannot recompute).** A gradient-boosted score is not exactly
  recomputable by a defense expert without the trained model — therefore it is a lead, never
  a dossier number.
- **P3 (innocent-protection default).** A high score raises *attention*, never *action*. It
  cannot name a VASP or gate a freeze by itself.
- **P4 (a freeze is court-gated).** The AI drafts nothing and freezes nothing. The gap
  between "the model flagged it" and "funds were frozen" is still a human with legal
  authority — always.

---

## 3. The two-layer design

We split the AI layer into a **rules half** (explainable, court-quotable) and a **learned
half** (fast, learns new tricks). Both are advisory.

### Layer A — Deterministic typology detectors (closes "pattern recognition")

Each fraud typology is a graph shape detected by a stated rule, then **tagged**. These are
the `SET 8` I1–I6 topological indicators, mapped to Hafiz's real cases:

| Tag | Shape (plain) | Rule (simplified) | Real case |
| :-- | :-- | :-- | :-- |
| `RAPID_DISPERSAL` | fills up, drains in minutes | `out/in ≈ 1` AND `drain_time < Δ` | `0x1f52…` Binance cashout sweep |
| `PEEL_CHAIN` | A→B→C→D, each keeps a sliver | chain ≥ 3, each hop forwards ~90–99% | classic launder trail |
| `SCATTER_GATHER` | splits to many, recombines (= mixing) | fan-out ≥ N then fan-in of ~equal value | Tornado-style |
| `COLLECTOR_SINK` | many victims → one → swept to a hot wallet | fan-in ≥ N, then single sweep to a VASP | `0xb40d…` CoinDCX deposit box |
| `GAS_UMBILICAL` | one parent funds gas for many burners | one funder → many first-tx wallets | `0x0429…` sweeper-bot fuel drop |
| `MIXER_TOUCH` | interacts with a known privacy pool | address ∈ verified pool registry | `0x81e6…` Tornado 0.1 ETH pool |

These are **deterministic and quotable** — exactly the kind of "pattern recognition" a jury
can follow. They are the honest replacement for the `len(transfers) >= 3` stub.

### Layer B — The advisory suspicion score (closes "risk detection")

A gradient-boosted tree model (**XGBoost / LightGBM**) turns each wallet into one **0–100
suspicion score** from features we *already compute* during a trace, plus the Layer-A tags.

**Illustrative worked example — `0x1f52…` (the Binance cashout sweep):**

```
features:  out_in_ratio=0.996  drain_time_sec=312  unique_senders=18
           unique_receivers=1  touched_mixer=0  hops_to_vasp=2
           wallet_age_sec=900  gas_funded_by_flagged=1  RAPID_DISPERSAL=1

SUSPICION SCORE: 88 / 100   →  LEAD BADGE "High — look here first"
why (SHAP):  drained in 5 min +26 · near-total pass-through +21 ·
             RAPID_DISPERSAL match +18 · funded by flagged burner +12 ·
             15-min-old wallet +7                              (advisory only)
```

A normal exchange-user wallet scores ~6/100 (slow, holds funds, many receivers, old, no
umbilical). **Every point carries a SHAP reason** — no unexplained numbers.

---

## 4. The tools — which "kitchen" runs which recipe

Neo4j and PyTorch are **tools/frameworks**, not algorithms. The recommended split:

| Tool | Role in our system | Why |
| :-- | :-- | :-- |
| **Neo4j GDS** (already in our stack) | Louvain/Leiden **syndicate clustering**; FastRP / node2vec **graph embeddings**; node-classification pipelines | Runs *inside the graph DB we already operate* — near-zero new infra. Clustering also delivers the "visual syndicate grouping" backlog item. |
| **XGBoost / LightGBM** | the **primary advisory score** (Layer B) | Best-in-class on tabular fraud data, trains on a laptop, and is **explainable via SHAP** — court-safe. `SET 8` reports GBM at high ROC-AUC. |
| **PyTorch (+ PyTorch Geometric)** | *optional* GraphSAGE/GAT **GNN** demo overlay | The deep-learning showpiece (a GNN won an SIH entry). Kept optional because it is a black box, needs more compute, and — per the published **Elliptic** benchmark — a plain Random Forest (F1 ≈ 0.80) **beat** a vanilla GCN (F1 ≈ 0.42). |

**Why tree-model-first, GNN-optional:** explainability is a court asset and the fancy model
is not guaranteed to win on this data. We always keep the tree baseline; the GNN is a cherry,
never the core. `SET 8`'s GAE-GCN figures are graph-native upgrades to *demonstrate*, not the
freeze engine.

```
 Neo4j GDS ─ Louvain → syndicate clusters
           └ FastRP/node2vec → graph-shape features ┐
                                                     ├─► XGBoost ─► 0–100 score + SHAP  (LEAD)
 trace features (drain time, ratios, mixer/bridge) ──┘
                                                     └─(optional)─► PyG GraphSAGE/GAT (demo)
 ❌ none of this freezes money · ✅ human + deterministic evidence = the freeze basis
```

---

## 5. Training doctrine

**Is this "AI training" like ChatGPT?** In spirit yes (learn from examples), in scale **no** —
it is classic ML on a table of numbers:

| | ChatGPT-style | **Our training** |
| :-- | :-- | :-- |
| Data | the whole internet | one labelled wallet table |
| Hardware | thousands of GPUs | a laptop |
| Time · cost | months · millions | minutes · ~free |

**The pipeline (train once, use many):**

1. **Labels.** Use the free public **Elliptic** dataset (~203k Bitcoin nodes, licit / illicit
   / unknown) as ground truth — we do not hand-label. Extend later with *our own*
   confirmed-case labels.
2. **Features.** Turn each wallet into a row of numbers computed from data we already pull
   (Alchemy/TronGrid) + the Layer-A tags + Neo4j GDS embeddings. This is the `SET 8`
   validated-feature store (durable in Postgres — see `03 §Postgres owns`).
3. **Split by time, never at random.** Train on older wallets, test on newer. `SET 8` is
   explicit: a random split is *optimistic by construction*. Temporal split is the honest
   number.
4. **Train** XGBoost on the training rows — it learns its own rulebook in minutes.
5. **Evaluate** on the held-out *future* wallets; report **precision / recall / ROC-AUC** from
   *this* run. Tune the decision threshold **cost-sensitively** (`SET 8` τ*) — a false freeze
   costs far more than a missed lead (P3).
6. **Explain** every score with **SHAP** (§3). Save the model as one artifact.
7. **Retrain on drift only** — when new laundering tricks appear, drop in fresh labels and
   retrain (minutes). Not continuous, not heavy.

---

## 6. How the AI score touches confidence (the guardrails)

The three-tier confidence gate (`01 §5`, `02 D14`) governs behavior. The AI score is **one
input signal** to that gate, with hard limits:

| The AI score **MAY** | The AI score **MAY NOT** |
| :-- | :-- |
| reorder/prioritize which leads an analyst sees first | alone establish the **High** tier |
| surface a wallet for analyst review | alone **name** a VASP |
| contribute as one corroborating signal toward **Medium** | alone gate a **freeze** instrument |
| tag typology and cluster syndicates | override the **MUST-HALT** mixer rule (`02 D8`) |

Reaching **High** (the only tier that may draft a freeze instrument for human review) still
requires the deterministic conditions: a **verified VASP address** + independent heuristics +
a clean taint path. A model score can point the way there; it can never *be* the way.

---

## 7. AI-specific anti-goals

Extends `01 §7`. The AI layer will **not**:

- **Present a model score as evidence or a freeze basis.** Tree, GNN, or otherwise — it is a
  lead. It never enters the evidence column. (P1, §2)
- **Ship fabricated or untested metrics.** No accuracy figure appears in a deck or dossier
  unless it came from *our* temporal-split evaluation. The draft jury playbook's unsourced
  GNN numbers (≈98% / ≈94%) are **removed** until measured. (Extends `01 §6`, `02 C2`.)
- **Report a random-split score as if it were real.** Random split inflates results; only the
  temporal number is honest (`SET 8`, §5).
- **Leak labels or the future into training.** No feature may encode information unavailable
  at the wallet's action time. (Recomputability, P1.)
- **Let a black box de-anonymize a mixer.** MUST-HALT (`02 D8`) is absolute; no score
  overrides it.

---

## 8. Implementation status (honest gap)

Verified against the current code — nothing here is built yet, and the doctrine says so:

- ⚠️ **No trained model exists.** No feature pipeline, no Elliptic ingestion, no XGBoost, no
  SHAP, no GDS ML calls.
- ⚠️ **Typology detection is a stub** (`peel = len(transfers) >= 3`) — Layer A is unbuilt.
- ⚠️ **Attribution is registry-gated**, not learned — a hand-maintained address list, not
  deposit-address clustering.
- ⚠️ **The old jury playbook cited fabricated GNN metrics** — these must be deleted, not
  demoed (§7, `02 D19`).

**Priority order to close the gap (explainable-first, court-safe throughout):**
1. Build **Layer A** deterministic detectors (`SET 8` I1–I6) — replaces the peel stub, needs
   no training, immediately court-quotable.
2. Build the **Postgres feature+label store** and ingest **Elliptic**.
3. Train the **XGBoost** advisory score + **SHAP**; report temporal-split numbers.
4. Add **Neo4j GDS** Louvain clusters + embeddings (syndicate grouping + graph features).
5. *Optional:* a **PyTorch Geometric** GNN demo overlay — clearly labelled advisory.

---

## 9. Jury defense — the AI/ML one-liners

- **"Does your system use AI?"** — *"Yes — a learned model ranks which wallets to investigate
  first and names the laundering pattern. But it's a lead, not evidence. We freeze money on a
  verified address and a deterministic, hashed trace that a defense expert can recompute —
  never on an AI score."*
- **"Why not a fancy deep-learning GNN as the core?"** — *"Because on the standard public
  benchmark a plain tree model beat a vanilla GNN, and the tree model explains every point of
  its score. For evidence we want explainable and recomputable. We keep a GNN as an optional
  upgrade, not the foundation."*
- **"How do we know your accuracy claims are real?"** — *"Every number comes from a
  time-split evaluation — train on the past, test on the future — on a public labelled
  dataset. We removed the earlier unsourced figures. If we can't measure it, we don't
  claim it."*
- **"Could the AI freeze an innocent person's account?"** — *"No. The model can raise
  attention; it cannot take action. Naming a VASP and drafting a freeze both require verified
  on-chain facts and a human signature. The AI never touches that path."*

---

*Grounded in `RESEARCH/SET 8`, the public Elliptic dataset, and Hafiz's on-chain cases
(`0x1f52…`, `0x81e6…`, `0xb40d…`/`0x0429…`). Governed by [`01_PHILOSOPHY.md`](01_PHILOSOPHY.md);
decisions in [`02_ALGORITHM_DECISIONS.md`](02_ALGORITHM_DECISIONS.md) Part H; runs on the
stores in [`03_STACK_AND_DATA_ARCHITECTURE.md`](03_STACK_AND_DATA_ARCHITECTURE.md).*
