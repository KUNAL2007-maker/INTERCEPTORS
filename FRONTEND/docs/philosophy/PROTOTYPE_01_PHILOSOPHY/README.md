# Prototype 01 — Philosophy

**The design philosophy, algorithm decisions, and datastore architecture for the SIH 2026
Crypto Fraud Attribution System — as documentation, not code.**

This folder is the *why* behind the build: the beliefs the code must obey, the decisions
those beliefs produced, and the stack that serves them. It is grounded in the finalized,
reconciled algorithm in [`../claude revised algo/`](../claude%20revised%20algo/) and in the
team's `RESEARCH/SET*` blueprints (Hafiz = Source of Truth).

---

## Read in this order

| # | Document | What it answers |
| :-- | :-- | :-- |
| 1 | **[01_PHILOSOPHY.md](01_PHILOSOPHY.md)** | *What do we believe?* Mission, court-admissibility-first, the 5 design principles, Leads-vs-Evidence, confidence-as-a-gate, the reconciliation ethos, and the explicit anti-goals. The constitution. |
| 2 | **[02_ALGORITHM_DECISIONS.md](02_ALGORITHM_DECISIONS.md)** | *What did we decide, and why?* The 5 critical corrections, the 7-step pipeline decisions (D1–D16), dual-taint FIFO/Haircut, the four legal instruments, confidence gating, and the citations still banned as unverified. |
| 3 | **[03_STACK_AND_DATA_ARCHITECTURE.md](03_STACK_AND_DATA_ARCHITECTURE.md)** | *Where does the data live?* Postgres = system of record, Neo4j = graph projection, Redis = scale layer. Responsibility split, Redis roles ranked, court-integrity invariant, scalability tiers, jury defense. |
| 4 | **[04_AI_ML_DOCTRINE.md](04_AI_ML_DOCTRINE.md)** | *Where does AI fit?* The advisory risk layer — deterministic typology detectors + a gradient-boosted suspicion score (Neo4j GDS + XGBoost, optional GNN), trained on public labelled data with a temporal split, kept strictly as a lead. |

---

## The four ideas that define this system

1. **Court-admissibility first.** We build *evidence*, not a dashboard. Everything is
   subordinate to Section 63 BSA — recomputable, hash-anchored, human-certified.
   *(01 §2)*
2. **Leads vs. Evidence.** A heuristic firing is a *lead*; evidence is a lead plus a
   confidence tier, an error rate, and a hash. Freezes draw only from evidence, and a
   human with legal authority signs. *(01 §4, 02 D14)*
3. **Redis holds no evidence.** Postgres is the only system of record; Neo4j and Redis are
   rebuildable. Pull Redis's plug and the dossier is unchanged — that's what makes the
   scale layer court-safe. *(03 §1, §7)*
4. **AI ranks, it never rules.** The AI/ML layer scores *where to look first* and tags the
   *shape* of the crime — advisory leads only. A model output never becomes evidence and
   never freezes money. *(04)*

---

## Relationship to the rest of the repo

- **[`../claude revised algo/FINAL_ALGORITHM.md`](../claude%20revised%20algo/FINAL_ALGORITHM.md)**
  — the full implementable spec. *Build from that; decide and defend from here.*
- **[`../claude revised algo/RECONCILIATION_REPORT.md`](../claude%20revised%20algo/RECONCILIATION_REPORT.md)**
  — the evidence trail for every correction referenced in `02`.
- **`RESEARCH/SET 1–10`** — the authoritative blueprints all logic is grounded in.
- **`Prototype_01/` (code)** — the implementation. This philosophy set is the standard it is
  held to; where the code diverges, `03 §6` records the honest gap.

---

*Authored under the Architectural Authority Protocol: Hafiz is the primary Source of Truth
for forensic logic, APIs, valuation, VASP heuristics, and evidence models.*
