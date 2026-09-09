# Prototype 01 — Algorithm Decisions

> **What this document is.** The decision log for the finalized forensic tracing algorithm.
> Each entry is: **Decision → Rationale → What it corrects** (when it replaces a weaker
> position in the working draft). It is the distilled, defensible form of
> [`claude revised algo/FINAL_ALGORITHM.md`](../claude%20revised%20algo/FINAL_ALGORITHM.md).
> Read that file to *build*; read this file to *decide* or *defend*.
>
> Governed by [`01_PHILOSOPHY.md`](01_PHILOSOPHY.md). Evidence for every correction lives in
> [`claude revised algo/RECONCILIATION_REPORT.md`](../claude%20revised%20algo/RECONCILIATION_REPORT.md).

---

## Part A — The five critical corrections (each would fail in court or return a wrong number)

These are the decisions that most matter to the jury, because in each case the draft was
*wrong*, not merely improvable.

### C1 — Correct the Tornado Cash pool address; validate all ground-truth addresses in CI
- **Decision.** Use the verified Tornado 100 ETH pool address; add a CI check that every
  hardcoded contract/pool address in the registry is validated at build time.
- **Rationale.** A wrong pool address silently misclassifies every interaction with it — a
  false negative on the exact laundering step we exist to catch.
- **Corrects.** `algo.md` L130 carried an incorrect 100 ETH pool address.

### C2 — Mixer statistics are Railgun/Umbra, mislabeled as Tornado, and partly fabricated
- **Decision.** Remove the `17.65%`, `82%`, and related figures from Tornado claims. Any
  statistic must be re-derived and cited to its actual protocol/source before use.
- **Rationale.** Presenting one protocol's stats as another's, or citing a number with no
  source, is impeachable on cross-examination and taints adjacent honest findings.
- **Corrects.** Mislabeled mixer stats throughout the draft. (See also §Part F unverified
  citations.)

### C3 — BNSS 94 is a summons to *produce*, not a *freeze*; split into four instruments
- **Decision.** Replace the single "BNSS 94 = freeze" instrument with **four correctly
  cited legal levers** (see Decision D13).
- **Rationale.** Serving the wrong instrument gets relief denied and signals the team
  doesn't understand the statute — fatal to credibility.
- **Corrects.** Draft treated BNSS 94 as a freeze order.

### C4 — Value tokens by per-contract decimals, never a hardcoded `/10**18`
- **Decision.** Amount = `raw / 10**decimals(contract)`. USDT/USDC on Ethereum are **6
  decimals**; a blanket `/10**18` understates a seizure by **10¹²×**.
- **Rationale.** A seizure order off by twelve orders of magnitude is both wrong and
  discrediting. Identity by contract address (Pillar 1), amount by decimals (Pillar 2).
- **Corrects.** Draft used `/10**18` for all tokens.

### C5 — Tether has no `freezeAccount()`; the real lever is `addBlackList()` / `destroyBlackFunds()`
- **Decision.** Model the issuer-freeze path on the functions that actually exist on the
  USDT contract, invoked via the real LEA→issuer request path. USDC uses
  `blacklist()` / `pause()`.
- **Rationale.** Citing a non-existent function makes the freeze plan inoperable and the
  dossier wrong on the mechanics.
- **Corrects.** Draft referenced `freezeAccount()`.

---

## Part B — Pipeline decisions (the 7 steps)

### D1 — Multi-chain dispatch router (EVM · TRON · Bitcoin)
- **Decision.** A front router classifies the input address by chain and dispatches to the
  right ingestion/tracing backend: **EVM** via Alchemy, **TRON/TRC-20** via TronGrid,
  **Bitcoin/UTXO** via Mempool.space.
- **Rationale.** ~**70–80% of Indian crypto fraud settles in TRC-20 USDT on TRON**, not
  Ethereum. An EVM-only tracer misses the majority of real cases. TRON's topology (peel
  chains, CEX hops) differs from EVM's (mixers, contracts) and needs its own logic.

### D2 — Asymmetric bidirectional ingestion (not full bidirectional)
- **Decision.** Trace **forward** (where did the money go) exhaustively; trace **backward**
  (where did it come from) only far enough to establish origin/gas linkage. Do not mirror
  full forward depth backward.
- **Rationale.** Full bidirectional expansion is exponential and mostly irrelevant — the
  goal is the *forward* exit VASP. Backward is needed for attribution context (gas parent,
  genesis), not for its own deep trace.

### D3 — The 4-Pillar Token Shield
- **Decision.** Establish a token's true identity and value before trusting any transfer:
  **(1)** identity by **contract address** (never symbol); **(2)** amount by **per-contract
  decimals**; **(3)** reject spoofed/airdropped look-alike tokens; **(4)** dual valuation
  (historical candle for FIR loss under IPC/BNS; live spot for the seizure order).
- **Rationale.** Symbols are trivially spoofable; decimals vary; scam airdrops mimic real
  tokens to poison a trace. Getting identity+value right is prerequisite to every number
  downstream (ties to C4).

### D4 — Traversal is Greedy Best-First, named honestly (upgradeable to bidirectional A\*)
- **Decision.** Ship **Greedy Best-First** priority-weighted search and *call it that*. Keep
  the door open to a **true bidirectional A\*** (search inward from the known VASP set with
  an admissible heuristic, `O(b^(d/2))`) when warranted.
- **Rationale (P2 — honesty in naming).** The draft's "A\*" had no `g(n)` cost term and no
  admissible `h(n)` — it was greedy best-first. Mislabeling it invites a devastating "your
  own docs call this A\*, but it isn't" on cross-examination. If we want A\*'s guarantees,
  we implement A\*'s machinery.
- **Edge weight / decay.** Priority uses the SET 2 decay model:
  `T_decay(e) = T_edge(e) · γ^d(s,v) · e^(−λ·Δt_dwell)` with **γ = 0.5** and
  **λ = ln2 / 86400 ≈ 8.02×10⁻⁶ s⁻¹** (24-hour half-life on dwell time). Single source of
  truth for both constants (P5).
- **Corrects.** "A\*" naming; undefined decay constants.

### D5 — Time, causality, genesis & gas linkage with a stated skew tolerance
- **Decision.** Enforce causal ordering (a hop cannot precede its funding); establish
  **genesis** (first funding) and **gas linkage** with an explicit block-timestamp skew
  tolerance `Δt_skew` rather than exact-equality assumptions.
- **Rationale.** Block timestamps are miner-influenced and imprecise; naive exact matching
  produces false negatives. State the tolerance so the result is recomputable (P1).

### D6 — Gas-Parent is a scored 40–75% heuristic, not "mathematical certainty," and is AA-aware
- **Decision.** Treat "address B was funded for gas by address A, therefore common control"
  as a **heuristic with a 40–75% confidence band and a stated error rate**. Exclude known
  infrastructure via a **`KNOWN_INFRA` allowlist** (relayers, ERC-4337 **paymasters**,
  faucets, exchanges' own gas dispensers). Route through **EntryPoint / UserOperation**
  awareness so a paymaster-sponsored tx isn't read as a control link.
- **Rationale (P2, P3).** Relayers and paymasters fund gas for *unrelated* users by design;
  calling that "certainty" manufactures false clusters and risks naming an innocent party.
  Account Abstraction (ERC-4337 v0.6/v0.7, EIP-7702) makes gas funding an increasingly weak
  control signal.
- **Corrects.** "Gas-Parent = mathematical certainty."

---

## Part C — Terminal checks (Step 5 — how a trace ends)

### D7 — VASP sweep detection, re-gated on the *destination* (5.1)
- **Decision.** Detect the deposit-address→hot-wallet **sweep** pattern that attributes
  funds to an exchange. Gate the **Reverse-Sweep early-exit on the destination** being a
  verified VASP hot wallet — not on the sweep shape alone.
- **Rationale.** The draft's early-exit could **truncate a genuine onward hop** that merely
  *looked* like a sweep, ending the trace prematurely. Gating on a verified VASP destination
  prevents false termination.
- **Corrects.** Reverse-Sweep truncation risk.

### D8 — Mixer / privacy-protocol handling: MUST-HALT, entropy-bounded, legally rebased (5.2)
- **Decision.**
  - Correct pool addresses (C1); handle both the **router and proxy** contracts.
  - **MUST-HALT rule:** on entry to a privacy protocol, **never** emit a deterministic
    mixer→withdrawer edge. Halt, state the **passive-adversary** limit, provide statistical
    context only.
  - Use **Shannon entropy** for anonymity-set reasoning, `A(w) = −Σ pᵢ·log₂ pᵢ`; terminate
    entropy refinement when `ΔH < 0.1 bits`.
  - Replace the vacuous "H4 knapsack" with **H4′** (a defined, bounded correlation test) —
    the original knapsack framing had no operative constraint.
  - **Legal rebase:** post *Van Loon v. Treasury* (Tornado OFAC delisting **2025-03-21**),
    an OFAC listing is **context, not authority**. Distinguish **Tornado** (fixed
    denominations) from **Railgun** (variable amounts) — they need different reasoning.
- **Rationale (P1, P5-anti-goals).** A deterministic de-anonymization arrow through a mixer
  is not supportable under a passive-adversary model and would be struck. Honest statistical
  context is admissible; a fabricated certainty is not.
- **Corrects.** Wrong address (C1); mislabeled stats (C2); stale OFAC basis; vacuous H4.

### D9 — Cross-chain correlation via deterministic keys + a TRON CEX-hop classifier (5.3)
- **Decision.** Correlate bridge legs by **protocol-native deterministic identifiers**, not
  by amount/timing guesswork:
  - **CCTP:** `DepositForBurn` nonce.
  - **Across:** `depositId + originChainId`.
  - **deBridge:** `orderId`.
  - **Stargate:** the **LayerZero packet GUID** (NOT the solver `Fill` event).
  - Normalize to the **ERC-7683** common intent schema where possible.
  - **TRON CEX-hop:** when a cross-chain move is actually a deposit-to-CEX-then-withdraw
    (off-chain hop), classify it as such — it is **not** an on-chain bridge and requires
    **Travel-Rule / IVMS-101** data from the VASP, not chain analysis.
- **Rationale.** Deterministic keys are recomputable and defensible (P1); amount/time
  heuristics across chains produce false links. Misreading a Stargate packet GUID as a
  solver Fill correlates the wrong legs.
- **Corrects.** Intent-bridge / Stargate correlation errors; missing TRON off-chain hop
  handling.

### D10 — Dormant wallets are "live-under-monitoring," not dead ends (5.4)
- **Decision.** When a trace ends at a **resting/dormant** wallet, do not close the case.
  Register the address on a **tripwire** (Alchemy webhooks for EVM; TronGrid polling for
  TRON) so any future movement re-activates the trace in real time.
- **Rationale.** Laundered funds routinely "sleep" past the initial investigation. A dormant
  terminus is a *watch state*, not a conclusion — this is where the Golden-Hour tripwire
  earns its keep operationally.

### D11 — Issuer-freeze levers modeled on functions that actually exist (7.5)
- **Decision.** Where funds sit in a **centrally-controlled stablecoin**, model the
  issuer-freeze path precisely: **USDT** → `addBlackList()` / `destroyBlackFunds()`;
  **USDC** → `blacklist()` / `pause()`; each via the real LEA→issuer legal request.
- **Rationale (C5).** This is often the *fastest* real recovery lever for stablecoins and
  must be mechanically correct to be actionable.
- **Corrects.** Non-existent `freezeAccount()`.

---

## Part D — Taint & legal output

### D12 — Dual taint model: FIFO for the court ledger, Haircut for the UI, Poison BANNED
- **Decision.**
  - **Court ledger → FIFO.** Deterministic, tie-broken, fully recomputable. Contribution of
    a tainted input to an output uses interval overlap:
    `overlap = max(0, min(b,d) − max(a,c))` over ordered value intervals.
  - **UI risk meter → Haircut.** `τ_Tx = Σ(T(u)·V(u)) / V_in` — a smooth 0–1 risk signal,
    explicitly labeled *indicative, not evidentiary*.
  - **Poison → BANNED.** Marks entire downstream sets 100% tainted on contact;
    non-recomputable and defamatory to innocent counterparties.
- **Rationale (P1).** The court needs a deterministic, defensible allocation (FIFO); analysts
  need a fast visual (Haircut); neither may be Poison. Keeping them in separate columns
  mirrors the Leads-vs-Evidence split (`01_PHILOSOPHY §4`).
- **Corrects.** FIFO was underspecified (no tie-break / procedure); Poison was still in play.

### D13 — Four correctly-cited legal instruments + the Section 63 schedule format
- **Decision.** Replace "BNSS 94 = freeze" with the right instrument per action:
  | Instrument | Post-2024 cite | Purpose | Gate |
  | :-- | :-- | :-- | :-- |
  | **Production summons** | **BNSS 94** (= old CrPC 91) | Compel a VASP to *produce* records/KYC | Police/court |
  | **Attachment / freeze** | **BNSS 107** (**new**) | *Freeze* proceeds of crime | **Court-gated** |
  | **Seizure** | **BNSS 106** (= old CrPC 102) | Seize property suspected of crime | Police, reportable |
  | **Restitution** | **BNSS 503** (= old CrPC 457) | Return property to the victim | Court |
  - Evidence certificate: **Section 63 BSA** (= old **65B IEA**); produce the statutory
    **schedule** naming device, process, and responsible official.
  - **IT Act 79(3)(b)** is a **safe-harbour / takedown** provision — **not** a freeze
    authority. Do not cite it to freeze funds.
- **Rationale (C3, P4).** Each action has exactly one correct instrument; a freeze is
  **court-gated** and cannot be dressed up as a production summons.
- **Corrects.** BNSS 94 misuse; BNSS 106/107 mislabeling; IT Act 79(3)(b) miscited.

---

## Part E — Output gating & honesty

### D14 — Three-tier confidence gates every action (High / Medium / Low)
- **Decision.** Emit High / Medium / Low with every attribution; the tier **binds behavior**:
  High → may draft a freeze instrument for human review; Medium → lead + next-hop /
  corroboration, name cautiously; **Low → DO NOT FREEZE, DO NOT NAME.** MUST-HALT (D8)
  overrides all tiers on mixer paths.
- **Rationale (P3).** Asymmetric cost of error — a false freeze is worse than a missed hop.
  (Detailed in `01_PHILOSOPHY §5`.)

### D15 — Honest operational / performance model
- **Decision.** State real latency and coverage characteristics — Golden-Hour targets, RPC
  rate limits, per-chain depth caps, and where the trace *degrades* (deep mixer sets, high
  fan-out) — rather than a single triumphant throughput number.
- **Rationale (P2).** An honest performance envelope survives scrutiny; an inflated one
  invites the "does it actually do this live?" question we can't win.

### D16 — Security & integrity hardening (from the reconciliation security review)
- **Decision.** Ban the shortcuts the draft/prototype relied on: **no `verify=False`** on TLS;
  **no hardcoded DNS**; **do not silently drop zero-value transfers** (they carry signal —
  approvals, dusting); do not depend on curated demo data; and **verify** the CoinDCX /
  WazirX VASP addresses against on-chain ground truth before trusting them.
- **Rationale (P1, court-admissibility).** Each of these is either a security hole or a
  source of a silently-wrong forensic result.

---

## Part F — Citations still flagged UNVERIFIED (do not put in a dossier)

Three claims could not be sourced during reconciliation and are **banned from dossiers**
until a real citation is attached (from `RECONCILIATION_REPORT §F`):

1. **"Huseynov et al."** — attribution could not be located.
2. **"82% within 24h"** — no source; appears fabricated (tied to C2).
3. **"65% / 60% of gas from KYC CEX"** — no source located.

> If any of these is needed for an argument, it must first be re-derived on real data or
> cited to a real publication. Plausibility is not evidence (`01_PHILOSOPHY §6`).

---

## Part G — Kept as validated-robust (survived adversarial review unchanged)

Not everything moved. These were challenged and **held** (`FINAL_ALGORITHM §13`):

- The **MUST-HALT** mixer rule.
- The **FIFO interval-overlap** formula.
- The **65B IEA ↔ 63 BSA** citation mapping.
- The **verified VASP / USDT** contract addresses (post-C1/C4 corrections).
- The **RBAC / ABAC** access-control model.
- The **Account-Abstraction scope** insight (that AA weakens gas-linkage heuristics).

---

## Part H — The AI/ML risk layer (advisory only)

Full doctrine in [`04_AI_ML_DOCTRINE.md`](04_AI_ML_DOCTRINE.md); these are the load-bearing
decisions. The layer exists to satisfy the PS's *AI/ML risk detection* and *fraud-typology
pattern recognition* asks — without letting a model output become evidence.

### D17 — Two-layer design: deterministic typology detectors + an advisory learned score
- **Decision.** Ship **Layer A** — deterministic typology detectors (`SET 8` I1–I6:
  rapid-dispersal, peel-chain, scatter-gather/mixing, collector-sink, gas-umbilical,
  mixer-touch) that *tag* the shape of the crime — and **Layer B** — a gradient-boosted
  (**XGBoost/LightGBM**) **0–100 suspicion score** with a per-point **SHAP** explanation.
- **Rationale (P2).** Layer A is explainable and court-quotable; Layer B ranks where to look.
  Together they close the AI gap while every claim stays honest.
- **Corrects.** The `peel = len(transfers) >= 3` stub and the absence of any risk model.

### D18 — AI is advisory: it ranks leads, it never rules
- **Decision.** A model output is a **lead** (`01 §4`). It **may** prioritize leads, surface a
  wallet for review, and contribute as *one* signal toward **Medium**. It **may not** alone
  reach **High**, alone name a VASP, alone gate a freeze, or override **MUST-HALT** (D8).
  Reaching High still needs a verified VASP address + independent heuristics + clean taint.
- **Rationale (P1, P3, P4).** A score is not exactly recomputable by a defense expert, so it
  never enters the evidence column; attention is not action.
- **Corrects.** Any path where a suspicion score could imply attribution or a freeze.

### D19 — Tooling + training: GDS + XGBoost primary, GNN optional, temporal split, honest metrics
- **Decision.** Run graph ML in **Neo4j GDS** (Louvain syndicate clusters, FastRP/node2vec
  embeddings, node-classification) — infra we already have; score with **XGBoost**; keep a
  **PyTorch Geometric** GNN as an *optional* demo overlay. Train on the public **Elliptic**
  labels with a **temporal** split; report only measured precision/recall/ROC-AUC; tune the
  threshold cost-sensitively (`SET 8` τ*).
- **Rationale (P2, `01 §6`).** On the published Elliptic benchmark a tree model (F1 ≈ 0.80)
  beat a vanilla GCN (F1 ≈ 0.42); explainability is a court asset. A random split is
  optimistic by construction.
- **Corrects.** The draft jury playbook's **fabricated GNN metrics (≈98% / ≈94%)** — banned
  until re-measured on our own temporal split.

---

*Full implementable detail: [`claude revised algo/FINAL_ALGORITHM.md`](../claude%20revised%20algo/FINAL_ALGORITHM.md).
Evidence for every correction: [`claude revised algo/RECONCILIATION_REPORT.md`](../claude%20revised%20algo/RECONCILIATION_REPORT.md).*
