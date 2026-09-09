# Prototype 01 — Stack & Data Architecture

> **What this document is.** The datastore philosophy: **Postgres + Neo4j + Redis**, who
> owns what, and *why* each exists. Grounded in a code-verified analysis of the finalized
> algorithm, `RESEARCH/SET 6/8/3/7/10`, and the existing prototype wiring.
>
> Governed by [`01_PHILOSOPHY.md`](01_PHILOSOPHY.md) (esp. §2 court-admissibility, §7
> anti-goals) and serves the decisions in [`02_ALGORITHM_DECISIONS.md`](02_ALGORITHM_DECISIONS.md).

---

## 1. One principle governs the whole stack

**The system of record is Postgres. Neo4j is a rebuildable analytical projection. Redis is
a rebuildable accelerator.** Every court-relevant fact is durable *and* recomputable in
Postgres; the other two stores exist to make that fact fast to reach, never to hold it
alone.

This is polyglot persistence with a hard, court-driven invariant:

> ### The court-integrity invariant
> **Redis holds no evidence.** Every Redis datum is rebuildable from Postgres or from
> re-querying the chain. A `FLUSHALL`, a `maxmemory` eviction, or a cold restart can
> **never** touch admissibility, **never** disarm a tripwire, and **never** corrupt a
> freeze number. If losing a key could change a dossier, that key does not live in Redis.

That invariant is not a limitation — it is the feature that lets us defend the architecture
in court (see §7).

```
                       ┌─────────────────────────────────────────────┐
   chain (Alchemy /    │  REDIS  — ephemeral accelerator & coordinator │
   TronGrid / RPC) ───►│  cache · rate-limit · pub/sub · locks         │  (rebuildable)
                       └───────────────┬─────────────────────────────┘
                                       │ every datum rebuildable from ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │  POSTGRES  — SYSTEM OF RECORD (ACID, WAL-durable, court-admissible)          │
   │  case records · FIFO taint ledger · 63 BSA hash-chain · raw RPC capture +    │
   │  SHA-256 · cited valuations + decimals · statutes · watch-set · auth audit   │
   └───────────────┬───────────────────────────────────────────────────────────┘
                   │ raw capture + hashes reconstruct ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │  NEO4J  — durable graph & designated cache-first trace store                 │
   │  address/tx/VASP nodes + TRANSFERRED edges · shortestPath VASP attribution · │
   │  clustering · centrality (T-1) · re-serve trails at ZERO RPC                 │
   └───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Who owns what

### Postgres owns — the system of record
- **All case data:** victim reports, suspect addresses, investigation state, VASP
  attribution verdicts, the finality-gated webhook processing state machine.
- **The FIFO master taint-lot ledger** — the freeze-quantum source (`FINAL §8.1`).
  ACID, replayable to the exact numbers printed in the dossier.
- **The SHA-256 Section 63 BSA hash-chain / audit ledger** — append-only, WAL-durable,
  the integrity backbone of admissibility.
- **The immutable raw JSON-RPC capture store** + 64-char content hashes + finalized-block
  anchor + query-completeness log, so Neo4j and every valuation are independently
  reproducible in court.
- **Court-cited valuations** (historical crime-block candle for FIR loss; spot for BNSS
  seizure) **and the load-bearing token decimals** — persisted with source + timestamp,
  never a TTL'd cache value.
- **The four statutory instruments** (BNSS 94/107/106/503) and confidence-tier decisions.
- **The durable job queue** (`SELECT … FOR UPDATE SKIP LOCKED`, enqueued in the same txn as
  the case row; `LISTEN/NOTIFY` for wakeups).
- **Authoritative webhook idempotency** (`UNIQUE(delivery_id/feed_hash)` + `ON CONFLICT DO
  NOTHING`).
- **The indefinitely-armed dormant-wallet tripwire watch-set** (case-linked, with poll
  cursors and alert rows).
- **Auth / RBAC-ABAC:** 8-persona users, PBKDF2 credentials, server-side sessions with jti
  revocation, login lockout audit.
- **The constants / ground-truth registry** (Tornado pools+router, VASP hot wallets,
  `KNOWN_INFRA`, USDT/USDC contracts+decimals, statute maps, γ/λ/Δt_skew/d_max) with a
  build-time CI cross-check — the single source of truth from `01_PHILOSOPHY §P5`.
- **A durable scheduler** (`due_at` + `SKIP LOCKED` poller) for Golden-Hour and all
  time-triggered actions.
- **The offline/batch ML feature + label store** (the `SET 8` validated features) — the
  durable source that would feed any Redis online-feature cache.

### Neo4j owns — the graph and the designated zero-RPC cache
- **The durable multi-hop trace graph** (address/tx/VASP nodes + `TRANSFERRED` edges with
  taint fractions) and the spec's **designated cache-first layer**: re-serve repeat trails
  at **zero RPC** via `node.last_crawled_block` / `crawl_complete` (`FINAL §10`).
- **Idempotent ingestion** via a uniqueness constraint on `(tx_hash, log_index)` + `MERGE` —
  restart-proof, court-safe dedup.
- **`shortestPath` / variable-length VASP attribution** and gas-anchor linkage — avoiding
  the `O(d^k)` relational-join blowup and the supernode problem that break deep-hop SQL.
- **Address clustering / entity resolution** (co-spend/CIOH, deposit reuse, change
  detection, gas-parent syndicate grouping — `SET 3`) and `H4′` anonymity-set counting.
- **Batch topological centrality** (betweenness/closeness/harmonic) on a T-1 cadence
  (`SET 8`), materialized out to the optional Redis feature cache.
- **The AI/ML graph compute (Neo4j GDS):** Louvain/Leiden syndicate clustering, FastRP /
  node2vec embeddings, and node-classification pipelines run here — the graph-native half of
  the advisory risk layer. See [`04_AI_ML_DOCTRINE.md`](04_AI_ML_DOCTRINE.md).
- **Subgraph extraction** feeding the Cytoscape Crime Canvas.
- **Framing constraint:** Neo4j is a **rebuildable projection** over the Postgres
  raw-capture + hash ledger — it must be reconstructable from Postgres. It is *not* the
  legal system of record either.

### Redis owns — nothing durable; only the accelerator/coordinator layer
See §3. Everything Redis holds is a rebuildable cache, counter, or transient bus.

---

## 3. Redis roles, ranked (with the Postgres/Neo4j alternative for each)

Ranked by how load-bearing Redis genuinely is. **"Priority" is relative to a scaled,
multi-worker production deployment** — see §5 for when each actually switches on.

| # | Redis role | Priority | Why Redis (at scale) | The non-Redis home |
|---|---|---|---|---|
| 1 | **Provider response cache** — 60s spot price + immutable finalized data (decimals, `eth_getCode`, historical candles, finalized tx/receipt) keyed by `(chain, contract/tx/block)` | **must-have** | Unanimous win. Hot, high-read, TTL-native, fully re-derivable, zero court value. Today each worker holds a private dict cache → N workers multiply Alchemy CU burn and return *inconsistent* per-block valuations. Shared cache collapses ~100–300 ms India→US round-trips to sub-ms and unifies valuations fleet-wide. | Postgres UNLOGGED table (fallback tier). **But the *cited* decimals/price must ALSO persist durably in Postgres with provenance — the cache is never the citation.** |
| 2 | **Distributed token-bucket rate-limiter** + `Retry-After` cooldown over the shared Alchemy/TronGrid quota | **must-have** | The strongest consensus and the *only genuinely Redis-shaped* case. One API key = one global quota; a per-process limiter over-runs it and triggers 429s mid-trace. Needs atomic cross-process `INCR/EXPIRE` or a Lua bucket. Mandated by `FINAL §10` + `SET 6`. | A Postgres counter row under `FOR UPDATE` becomes a hot-row lock — it *becomes* the throttle it was meant to protect. **Wrong tool.** |
| 3 | **Trace-subgraph memoization + singleflight coalescing** (two concurrent traces don't both crawl the same window) | high-value | Memoizes assembled traces; coalesces duplicate concurrent fetches to save CU. | Neo4j **is** the durable trace cache (`last_crawled_block`); coalescing = `pg_try_advisory_lock` on the query hash. Redis is a latency nicety. |
| 4 | **Pub/Sub fan-out** for the live SSE "4 AI Detectives" progress terminal | high-value | Once the web tier is >1 instance, a worker's event must reach the node holding the investigator's SSE socket. Keeps high-rate UI chatter out of the WAL. | Postgres `LISTEN/NOTIFY` (<8 KB) at low instance count; in-process at single instance. **Never persisted as evidence.** |
| 5 | **JWT revocation denylist + login lockout counters** | high-value | The only stateful parts of otherwise-stateless JWT auth; TTL self-cleans at token expiry. | **Already correct in Postgres** (server-side sessions + per-request liveness + lockout). Redis here is pure latency; the *audit* stays in Postgres regardless. |
| 6 | Webhook HMAC replay-nonce / idempotency fast-reject | nice-to-have | `SETNX`+TTL is a fast front-line reject on the hot path. | **Authoritative dedup is Postgres `UNIQUE` + `ON CONFLICT`** (already built). Redis alone would silently reprocess on eviction → duplicate evidence rows. |
| 7 | Dormant-wallet tripwire *membership* cache (O(1) "do we watch this address?") | nice-to-have | Fast membership on the webhook path. | **Authoritative watch-set is durable in Postgres.** Redis holds only a rebuildable projection — its loss must never disarm a tripwire. |
| 8 | VASP-label / entity hot-lookup + ML online-feature serving | nice-to-have | Online-feature-store pattern for millions of membership checks + T-1 centrality vectors. | Postgres/Neo4j hold the authoritative, auditable labels; Neo4j computes centrality. Only relevant *once entity-resolution/GNN exists* — neither is built yet. |
| 9 | Distributed lock / node-claim lease | nice-to-have | `SETNX PX` lease auto-releases on worker death. | **For anything touching evidence:** `pg_try_advisory_lock` + Neo4j `MERGE` (idempotent, can't desync). Redlock is *not* a correctness guarantee (Kleppmann) — never guard evidence writes with it. |
| — | **Golden-Hour countdown via Redis TTL/keyspace-expiry** | **skip** | `FINAL §10` replaced the time-only `P_freeze(t)` curve with a computed location-conditional urgency *state*. A best-effort TTL lost on restart is unacceptable for a freeze deadline. | Persist incident timestamp + urgency state in Postgres; derive countdown client-side; fire from a durable `due_at` + `SKIP LOCKED` poller. |
| — | **Shared priority-frontier ZSET** for traversal | **skip** | Multi-hop tracing is inherently *sequential, per-trace*; the frontier lives for seconds inside one worker. A shared ZSET invents coordination the algorithm doesn't need. | In-process heap + set. Checkpoint to Postgres only if crash-resumable traces are ever wanted. |
| — | **Redis Streams as the durable event log** | **skip** | `SET 6` needs a Kafka-shaped durable, replayable, re-org-capable log. Redis Streams is memory-bound with weak replay. | The canonical "As-of-Block-N" master table in Postgres is the durable authority; promote to **Kafka** at national scale, not Redis. |

---

## 4. Never Redis-only — the court-critical anti-patterns

These must **never** be sourced from Redis as authoritative. Each is a way a cache eviction
would silently corrupt a case:

- **The 63 BSA hash-chain / audit ledger** — an evicting cache cannot anchor a chain of
  custody.
- **The FIFO taint-lot ledger** — a lost lot silently corrupts the restitution numbers.
- **Case records & VASP verdicts** — durable in Postgres; never read from Redis as truth.
- **Raw JSON-RPC bytes + SHA-256 hashes** — the reproducibility root for court.
- **Court-cited valuations + token decimals** — value+source+timestamp in Postgres; only
  the *live 60s spot price* gets a Redis TTL.
- **Webhook idempotency authority** — Postgres `UNIQUE`; a lost Redis nonce reprocesses into
  duplicate evidence.
- **The dormant-wallet tripwire arming** — a `FLUSHALL`/eviction/restart would silently
  disarm court-ordered monitoring and lose the freeze window.
- **The `(tx_hash, log_index)` ingestion dedup** — belongs to the Neo4j/Postgres uniqueness
  constraint.
- **Golden-Hour deadline firing** — durable scheduler, never a Redis TTL.
- **Distributed locks guarding evidence writes** — Neo4j `MERGE` + Postgres advisory locks,
  never Redlock.
- **Security audit events** (revocations, lockouts, who-viewed-which-case) — durable in
  Postgres; Redis may hold only the fast operational counter.

---

## 5. The scalability story — where Redis switches on

This is the honest framing of *"we need Redis in production to show scalability."* **It's
true — and the reason it's defensible is that our correctness does not depend on it.**
Redis is our **horizontal-scale layer**: it earns its place exactly as we add workers and
instances, which is precisely what a national deployment requires.

| Tier | Deployment | Stack | Redis role |
|---|---|---|---|
| **0 — Demo** | Single node, one (threaded) worker | Postgres + Neo4j | **None.** One in-process bucket governs the whole API key; one process holds the cache; SSE is in-process. Correctness is complete here. |
| **1 — Multi-worker** | One node, N Gunicorn workers | + **Redis** | **Rate-limiter + shared price/decimals cache** become load-bearing: N private buckets would over-run the one Alchemy quota, and N private caches would N-multiply CU burn and diverge valuations. |
| **2 — Multi-instance** | Several API nodes behind a balancer | + Redis **Pub/Sub** | Cross-instance fan-out for the live detective terminal (a worker's event must reach the node holding the SSE socket). |
| **3 — National scale** | High ingestion throughput | + Redis broker / **Kafka** | A Redis job broker if `SKIP LOCKED` is outgrown; **Kafka** (not Redis) as the durable, re-org-capable event log. |

> **The scalability narrative in one breath:** *"Postgres and Neo4j give us a correct,
> court-admissible system on a single node. Redis is the layer we add to scale
> horizontally — the shared rate-limiter and cache that let N workers share one exchange
> API quota without over-running it, and the pub/sub bus that lets many API nodes drive one
> live investigation view. We designed it so Redis accelerates, never authors — so scaling
> out never risks the evidence."*

**Minimal-stack verdict (from the grounded analysis):** Redis is *not strictly necessary
for a correct v1* — the entire court pipeline ships on Postgres + Neo4j. It becomes
*justified, not required*, under two unanimous pressures: (1) a shared provider cache the
moment you run >1 worker, and (2) a distributed token-bucket the moment N processes share
one API key.

---

## 6. Implementation status (honest gap)

Verified against the current code — what's built, what isn't:

- ✅ **Correct in Postgres already:** server-side sessions + jti revocation + per-request
  liveness + login lockout; webhook idempotency via `feed_hash UNIQUE`. These confirm the
  "Redis-optional" roles need no Redis.
- ⚠️ **The two real Redis wins are unbuilt:** there is **no rate limiter / 429 / backoff /
  token-bucket anywhere** (concurrency will exhaust the Alchemy quota); the price cache is a
  **per-process module-level dict** in every stack (multiplies calls, diverges valuations
  under multi-worker).
- ⚠️ **The durable async path is unbuilt:** the `job_queue` table exists but is
  **enqueue-only** — no consumer, no `SKIP LOCKED`, no `LISTEN/NOTIFY` — so "async analysis"
  never actually runs.
- ⚠️ **The durable graph is under-built:** the newer prototype dropped Neo4j for a
  relational table + Python BFS; the older one uses in-memory dicts wiped each trace. The
  designated zero-RPC cache-first store that would make a Redis subgraph cache *secondary*
  doesn't exist yet.
- ⚠️ **Redis is not even a declared dependency yet.**

**Priority order to close the gap (correctness first, then scale):**
1. Build the **Postgres `SKIP LOCKED` queue consumer** so async traces run at all.
2. Build the **in-process rate-limiter** (correctness on one worker).
3. Add the **shared Redis rate-limiter + price cache** *before any multi-worker deploy*
   (quota safety + valuation consistency).
4. Build the **durable Neo4j graph** so repeat trails re-serve at zero RPC.

---

## 7. Jury defense — the polyglot-persistence one-liners

- **"Why three databases?"** — *"Each does exactly one job. Postgres is the court's system
  of record — ACID, WAL-durable, tamper-evident. Neo4j is the graph brain — it answers
  'shortest path to a known exchange' in one query where SQL would join itself to death.
  Redis is the scale layer — a shared cache and rate-limiter for when we run many workers.
  Only Postgres holds evidence."*
- **"What if Redis goes down / is wiped?"** — *"Nothing in a dossier changes. Every Redis
  value is rebuildable from Postgres or by re-querying the chain. We can prove it: pull the
  plug on Redis and re-run the trace — same verdict, same freeze number, same hash."*
- **"Isn't Redis overkill for a demo?"** — *"For the single-node demo, yes — and that's the
  point. Correctness needs only Postgres + Neo4j. Redis is what makes it scale to national
  volume without over-running one exchange's API quota. We show it because production is
  multi-worker."*
- **"Where's the evidence integrity?"** — *"The Section 63 BSA hash-chain and the FIFO taint
  ledger are append-only in Postgres. An evicting cache can't anchor a chain of custody, so
  by design it never tries."*

---

*Grounded in a code-verified 6-agent analysis of `FINAL_ALGORITHM.md`, `RESEARCH/SET
6/8/3/7/10`, and the current prototype wiring. Full detail:
[`claude revised algo/FINAL_ALGORITHM.md §10`](../claude%20revised%20algo/FINAL_ALGORITHM.md).*
