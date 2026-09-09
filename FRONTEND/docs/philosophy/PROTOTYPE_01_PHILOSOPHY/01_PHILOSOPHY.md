# Prototype 01 — Design Philosophy

> **What this document is.** The *constitution* the code obeys. Not a spec, not an API
> reference — the small set of non-negotiable beliefs that decide every downstream
> tradeoff. When two implementations both "work," this document is the tiebreaker.
>
> **What it draws on.** The finalized, reconciled algorithm in
> [`claude revised algo/FINAL_ALGORITHM.md`](../claude%20revised%20algo/FINAL_ALGORITHM.md)
> (the *what* and *how*), the evidence trail in
> [`claude revised algo/RECONCILIATION_REPORT.md`](../claude%20revised%20algo/RECONCILIATION_REPORT.md)
> (the *why*), and the stack decisions in
> [`03_STACK_AND_DATA_ARCHITECTURE.md`](03_STACK_AND_DATA_ARCHITECTURE.md).
>
> **Companions.** [`02_ALGORITHM_DECISIONS.md`](02_ALGORITHM_DECISIONS.md) is the decision
> log; this file is the worldview those decisions serve.

---

## 1. Mission, in one sentence

**Turn a victim's suspect wallet address into a court-admissible attribution of the
receiving Exchange / VASP — fast enough to freeze the money — without ever falsely
implicating an innocent citizen.**

Every word in that sentence is load-bearing:

| Phrase | What it forces on the design |
| :-- | :-- |
| *victim's suspect address* | We start from one hostile-supplied string. It may be wrong, a typo, or an innocent party. Trust nothing until verified on-chain. |
| *court-admissible* | The output is **evidence**, not a dashboard. Section 63 BSA (formerly 65B IEA) governs everything. |
| *attribution of the … VASP* | The deliverable is not "here is a scary graph" — it is "these funds landed at *this named exchange*, on *this deposit address*, at *this block*." |
| *fast enough to freeze* | The Golden Hour is real. Latency is a forensic property, not an ops metric. |
| *without … an innocent citizen* | False attribution is a **worse** failure than no attribution. Asymmetric cost governs every threshold. |

---

## 2. The prime directive — court-admissibility first

We are not building a threat-intelligence product that happens to be usable in court. We
are building **evidence** that happens to have a nice UI.

That inversion has hard consequences the code must honor:

1. **Recomputability.** Every number in a dossier must be re-derivable from raw on-chain
   data + a stated procedure. If a defense expert cannot reproduce it, it does not go in
   the dossier. This is why taint uses **FIFO** (deterministic, tie-broken, court-ledger)
   and not Poison (see §7).
2. **Chain of custody.** Raw RPC/REST responses are hashed (SHA-256) at ingestion and the
   hash travels with the claim. The Section 63 schedule names the *device, process, and
   responsible official*.
3. **Finality gating.** A lead can be provisional. A **frozen asset order cannot.** The
   pipeline physically separates the two (see §4).
4. **Named certificates.** A machine does not certify evidence. A person does — under
   Section 63(4) BSA. The system produces the artifact; a human signs it.

> **One-liner for the jury:** *"We don't ask the court to trust our software. We give the
> court the raw blockchain data, the exact procedure, and the hash — and invite them to
> recompute it themselves."*

---

## 3. The five design principles

These are lifted verbatim from `FINAL_ALGORITHM.md §0` because they are the spine of the
whole system.

### P1 — Never assert what you cannot recompute
A heuristic firing is a **lead**. Evidence is a lead **plus** a confidence tier, a stated
error rate, and a hash of the raw data it rests on. The UI may show leads; the dossier
carries only evidence. See §5.

### P2 — Honesty in naming
We call algorithms what they are. The traversal is **Greedy Best-First** (or a true
**bidirectional A\***), never "A\*" as marketing. A gas-funding link is a **40–75%
heuristic**, never "mathematical certainty." Overclaiming is the fastest way to lose a
case — one refuted overclaim discredits every honest finding beside it.

### P3 — Innocent-protection is the default
When confidence is low, the system's default action is **DO NOT FREEZE** and **DO NOT
NAME**. A missed exchange is recoverable next hop. A wrongly frozen citizen's account is a
headline and a lawsuit. The thresholds are deliberately asymmetric.

### P4 — A freeze is court-gated
The software **never** freezes anything. It **prepares the instrument** (a BNSS
94 / 107 / 106 / 503 draft) that a competent authority reviews and signs. The gap between
"the system flagged it" and "funds were frozen" is a human with legal authority — always.

### P5 — Single source of truth for constants
Decimals, denominations, decay factors (γ, λ), skew tolerances, ground-truth addresses —
all live in one registry (`FINAL_ALGORITHM.md §1 / §11`). A magic number scattered across
files is how the USDT-decimals bug happened (a 10¹²× error, see §7). One table, cited
everywhere.

---

## 4. Leads vs. Evidence — the load-bearing distinction

This is the single most important idea in the system. Confusing the two is how forensic
software gets thrown out of court.

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│  LEAD (investigative)       │         │  EVIDENCE (court)                 │
│  ─────────────────────      │         │  ──────────────────────────       │
│  • a heuristic fired        │  ──►     │  • lead + confidence tier         │
│  • shown in the UI          │  gate    │  • + stated error rate            │
│  • guides the next hop      │  (P1)    │  • + SHA-256 of raw source data   │
│  • may be wrong, that's OK  │          │  • + named human certificate      │
│  • NEVER freezes anything   │          │  • THIS is what enters a dossier  │
└─────────────────────────────┘         └──────────────────────────────────┘
```

A hit on the VASP-sweep heuristic is a **lead** ("these funds probably went to a CoinDCX
deposit address"). It becomes **evidence** only after it clears the confidence gate, the
error rate is stated, and the raw sweep transaction is hashed. The **freeze instrument**
(P4) draws only from the evidence column — never from a raw lead.

**Design test:** for any value the system displays, ask *"which column is this in, and does
the UI make that obvious?"* If a lead is styled to look like a proven fact, that is a bug —
regardless of whether the code is correct.

---

## 5. Confidence is a first-class output, not a footnote

The system emits a **three-tier confidence** with every attribution, and the tier changes
what the system is *allowed to do*:

| Tier | Meaning | System is allowed to… |
| :-- | :-- | :-- |
| **High** | Multiple independent heuristics agree; destination is a verified VASP address; taint path is clean. | Draft a freeze/production instrument for human review. |
| **Medium** | Single strong heuristic, or verified address but noisy path. | Present as a lead; recommend a **next hop** or corroboration; **name cautiously**. |
| **Low** | Weak / conflicting signals; unverified address. | **DO NOT FREEZE. DO NOT NAME.** Surface for analyst judgment only. |

The mixer path adds a hard override: the **MUST-HALT rule**. When funds enter a privacy
protocol (Tornado, Railgun), the system **must not** draw a deterministic
mixer→withdrawer arrow. It halts, states the passive-adversary limit, and offers
statistical context only. No confidence tier can override MUST-HALT.

---

## 6. Challenge, don't summarize — the reconciliation ethos

This system was not assembled by trusting the draft. The working algorithm (`algo.md`) was
put through a **14-agent read-then-adversarially-verify pass** against the team's own
authoritative sources (`RESEARCH/SET 1–10`, the Alchemy Encyclopedia, `HAFIZ_DIARY.md`),
plus independent on-chain and legal checks. Every claim was made to defend itself.

The result: **5 critical fixes** (each of which would fail in court or produce a wrong
number), a dozen method-integrity corrections, and an explicit list of what survived as
**validated-robust**. Three citations that could not be sourced are **flagged as
unverified** and banned from dossiers until sourced.

That ethos is permanent, not a one-time cleanup:

> **Any claim that cannot be traced to a source (`RESEARCH/SET*`, an on-chain tx, or a
> statute) does not enter a dossier.** Plausibility is not evidence. A confident-sounding
> statistic with no citation is a liability, not an asset.

The full trail lives in `RECONCILIATION_REPORT.md`. It exists so that any correction can be
*defended to the jury*, not just asserted.

---

## 7. What we explicitly refuse to do — the anti-goals

A philosophy is defined as much by its refusals. Prototype 01 will **not**:

- **Use Poison taint.** It marks an entire downstream set as 100% tainted on contact —
  non-recomputable in any way a court accepts, and it defames innocent counterparties. We
  use **FIFO** for the court ledger and **Haircut** only as a UI risk meter. (`FINAL §8`)
- **Auto-freeze.** No code path freezes an asset. The system drafts; a human with legal
  authority disposes. (P4)
- **Treat an OFAC listing as sole legal basis.** Post *Van Loon v. Treasury* (Tornado Cash
  delisting, 2025-03-21), an OFAC entry is context, not authority under Indian law. Freeze
  authority comes from **BNSS**, court-gated. (`RECONCILIATION §B`)
- **Ship fabricated or mislabeled statistics.** The "82% within 24h," the Railgun stats
  mislabeled as Tornado — removed. If we cannot cite it, we do not state it. (§6)
- **Value tokens by symbol or with a hardcoded divisor.** Identity is by **contract
  address**; amount is by **per-contract decimals**. Symbols are spoofable; a wrong divisor
  is a 10¹²× error in a seizure order. (`FINAL §4`, §7's USDT bug)
- **Store court evidence in an evictable cache.** Redis holds *no* evidence. Anything a
  court relies on lives in Postgres, durably. Eviction can never touch admissibility.
  (See [`03_STACK_AND_DATA_ARCHITECTURE.md`](03_STACK_AND_DATA_ARCHITECTURE.md).)
- **Treat an AI/ML score as evidence or a freeze basis.** A model output — tree, GNN, or
  otherwise — is a **lead** that ranks where to look and tags the crime's shape. It never
  enters the evidence column and never gates a freeze on its own.
  (See [`04_AI_ML_DOCTRINE.md`](04_AI_ML_DOCTRINE.md).)
- **Ship fabricated or untested ML metrics.** No accuracy/precision/recall figure appears in
  a deck or dossier unless it came from *our* evaluation on a **temporal** split. The draft
  playbook's unsourced GNN numbers are removed until measured. (Extends §6; see `04`.)

---

## 8. Grounding & authority

- **Hafiz is the Source of Truth** for forensic mechanics, live RPC/REST APIs, dual
  valuation, VASP heuristics, and evidence models. Other members' workspaces are structural
  references. This philosophy set is the Source-of-Truth statement of *why*.
- **Research first.** Logic is grounded in the ten `RESEARCH/SET*` blueprints. When the
  draft and a blueprint disagreed, the blueprint (or an independent check) won — and the
  reconciliation report records it.
- **Legal review is not optional.** BNSS / BSA / IT Act citations reflect the post-2024
  renumbering and are the *reconciled* positions. A qualified legal reviewer signs off
  before anything is filed. The software's job is to make that review fast and grounded —
  not to replace it.

---

## 9. How to read the rest of this set

1. **This file** — the beliefs.
2. [`02_ALGORITHM_DECISIONS.md`](02_ALGORITHM_DECISIONS.md) — the decisions those beliefs
   produced, as a decision log (each: *decision → rationale → what it corrects*).
3. [`03_STACK_AND_DATA_ARCHITECTURE.md`](03_STACK_AND_DATA_ARCHITECTURE.md) — the
   Postgres + Redis + Neo4j split, and why each datastore exists.
4. [`04_AI_ML_DOCTRINE.md`](04_AI_ML_DOCTRINE.md) — the advisory AI/ML risk layer: how a
   learned model ranks leads and tags typologies without ever becoming evidence.
5. [`claude revised algo/FINAL_ALGORITHM.md`](../claude%20revised%20algo/FINAL_ALGORITHM.md)
   — the full implementable specification. Build from that.
