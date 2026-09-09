# VOLUME 1: CORTEX ENGINE & DISTRIBUTED INFRASTRUCTURE ARCHITECTURE
*Exhaustive Technical Architectural Specification (2026 Live Audit)*

---

## 1. The Fundamental Problem of Blockchain Node Infrastructure

Blockchain full nodes (such as `geth`, `nethermind`, `besu`, `erigon`, `reth`, `solana-validator`, `bitcoind`) were designed from first principles to solve a specific distributed systems challenge: **peer-to-peer, Byzantine fault-tolerant consensus across untrusted participants**. 

However, running a production web3 application (such as Uniswap, OpenSea, Metamask, or institutional crypto-forensic tracing engines) introduces completely orthogonal operational requirements:
1. **High Concurrent Read Concurrency**: Tens of thousands of read requests per second across varying block ranges, historical states, and contract balances.
2. **Sub-50ms Response Latencies**: Instantaneous responses required for interactive frontend UX and algorithmic execution.
3. **High-Availability (HA) with Zero Downtime**: Node software upgrades, database re-indexing, block reorg handling, and memory leaks must not disrupt active user sessions.
4. **Consistency Across Dynamic State**: In an active blockchain, new blocks arrive every few seconds or sub-seconds (12s on Ethereum, 400ms on Solana, sub-100ms on MegaETH/Monad). Standard load-balancing across independent node instances causes severe consistency bugs where Request A hits Node 1 at block `N`, and Request B immediately hits Node 2 at block `N-1`, causing transactions to appear "missing" or balances to oscillate.

Alchemy addresses these fundamental limits not by simply running a fleet of off-the-shelf nodes behind HAProxy or NGINX, but through **Cortex**, a proprietary distributed virtualization and execution platform sitting between the client edge and underlying blockchain consensus engines.

---

## 2. Cortex Architectural Decomposition

Cortex is composed of four primary subsystems operating in lockstep:

```
[ Incoming Client Request (HTTPS / WSS / gRPC) ]
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   EDGE & SECURITY GATEWAY                   │
│   • TLS Termination & HTTP/2 / HTTP/3 Multiplexing          │
│   • CORS & Origin Validation                                │
│   • IP / CIDR Firewall Filtering                            │
│   • Cryptographic JWT RSA/ECDSA Verification                │
│   • Token-Bucket Rate Limiter & Compute Unit (CU) Counter   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 CORTEX ROUTING & DISPATCH ENGINE            │
│   • AST Method Parser & Semantic Classifier                 │
│   • Static Read Bypass (eth_chainId, net_version)           │
│   • Heavy Execution Isolation (eth_call, eth_estimateGas)   │
│   • Range Query Partitioning (eth_getLogs)                  │
│   • Trace & VM Debugging Router (debug_*, trace_*)          │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  CONSENSUS-AWARE DISPATCHER  │ │  DISTRIBUTED MEMORY CACHE    │
│  • Real-Time Block Tracker   │ │  • Finalized State Cache     │
│  • Canonical Hash Registry   │ │  • Head-of-Chain Microcache  │
│  • Reorg Depth Monitor       │ │  • Decoded Log Index Cache   │
│  • Quarantined Fleet Manager │ │  • Transaction Receipt Cache │
└──────────────┬───────────────┘ └──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                  GLOBAL NODE FLEETS & CLUSTERS              │
│   ┌───────────────────────┐   ┌──────────────────────────┐  │
│   │ Specialized Read Fleet│   │ Heavy Trace/Debug Fleet  │  │
│   └───────────────────────┘   └──────────────────────────┘  │
│   ┌───────────────────────┐   ┌──────────────────────────┐  │
│   │ Dedicated RPC Clusters│   │ Private MEV Builder Pool │  │
│   └───────────────────────┘   └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Semantic Request Classification & AST Parsing

When a JSON-RPC payload arrives at Cortex, it does not treat the body as an opaque string. The **AST Method Parser** unpacks the JSON-RPC request and categorizes it into one of four execution classes:

### Class 1: Static Metadata (Zero-Node Invocations)
- **Methods**: `eth_chainId`, `net_version`, `net_listening`, `net_peerCount`, `eth_protocolVersion`.
- **Handling**: These values are immutable for a given network. Cortex intercepts these requests directly at the edge memory layer without querying backend blockchain nodes.
- **Latency**: Sub-2ms.
- **Compute Unit Cost**: 0 CUs (5 throughput CU).

### Class 2: Head-of-Chain State Queries (Consensus-Aware)
- **Methods**: `eth_blockNumber`, `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`, `eth_call`.
- **Handling**: These methods evaluate the latest state of an address or smart contract. Cortex inspects the block tag (`"latest"`, `"safe"`, `"finalized"`, or an explicit hex block number `0x...`).
  - If `"finalized"` or historical: Routed to the historical cache or read-optimized node replicas.
  - If `"latest"`: Dispatched strictly to nodes whose local imported block height is $\ge$ the globally established canonical block height, preventing regressions.

### Class 3: Range & Filter Scanning (I/O Bound)
- **Methods**: `eth_getLogs`, `eth_getFilterLogs`.
- **Handling**: Scanning millions of logs across large block ranges causes severe disk I/O bottlenecks in standard node clients (e.g. leveldb / mdbx scanning). Cortex splits large block ranges into parallel chunked queries, executes them concurrently across dedicated log-indexing microservices, merges the result sets, deduplicates potential overlaps, and returns a unified array.

### Class 4: Full EVM Traces & State Replays (CPU Bound)
- **Methods**: `debug_traceTransaction`, `debug_traceBlockByNumber`, `trace_callMany`, `trace_filter`.
- **Handling**: Execution tracing requires re-executing transactions inside an instrumented EVM sandbox opcode by opcode. Cortex isolates these requests onto **Specialized Trace Clusters** equipped with multi-threaded high-clock-speed CPUs and large memory allocations, ensuring standard RPC traffic is never starved of resources.

---

## 4. Consensus-Aware Routing & Reorg Management

A primary failure mode of naive multi-node load balancing is the **Block Oscillating Phenomenon**:

```
Client Request 1: eth_blockNumber ─────────► Hits Node A (Block 20,000,001) ──► Returns 20,000,001
Client Request 2: eth_getBlockByNumber ────► Hits Node B (Block 20,000,000) ──► ERROR: Block Not Found!
```

### The Canonical Block Height Matrix
To prevent this, Cortex maintains an in-memory **Canonical Block Matrix** updated via WebSocket peer streams from all nodes in every region:
1. Every node instance continuously emits block headers as they are mined or received via gossip.
2. Cortex maintains a distributed sliding window of block hashes and parents up to a depth of 64 blocks (standard finality threshold).
3. If Node B lags behind the consensus height by more than 1 block, Cortex dynamically updates its routing table to exclude Node B from `"latest"` block queries until its local chain catches up.

### Deep Chain Reorganizations (Reorg Handling)
When a block reorganization occurs onchain (common on high-speed chains like Polygon PoS, Arbitrum, or Base during high latency):
1. Cortex detects that a previously served block hash is no longer on the canonical chain.
2. Cortex immediately issues micro-cache invalidation events across all edge regions for the affected block height.
3. If a client is streaming via **Smart WebSockets** (`alchemy_minedTransactions`), Cortex emits a special `includeRemoved: true` event notification, notifying the client application that a previously mined transaction has been decoupled from the canonical chain.

---

## 5. Multi-Tier Distributed Caching Topology

Cortex implements a three-tier hierarchical caching architecture:

| Cache Tier | Storage Layer | Scope & Retention | Eviction Strategy |
| :--- | :--- | :--- | :--- |
| **L1: Edge Microcache** | Local In-Memory RAM (NGINX/Edge Worker) | Fast-moving head-of-chain state (`eth_blockNumber`, latest gas prices) | Time-To-Live (TTL): 50ms – 500ms |
| **L2: Regional Distributed Cache** | High-throughput Redis / Key-Value Memory Grid | Address balances, contract bytecodes, transaction receipts | LRU with invalidation on new block events |
| **L3: Persistent Canonical Store** | Distributed Flash Storage & Columnar Datastores | Finalized historical blocks (older than 64 blocks), historical logs, transaction receipts | Immutable; permanent retention |

Because historical blocks and transaction receipts on finalized chains can never change, Cortex caches 100% of historical receipts and block headers. This eliminates over 85% of redundant disk queries to underlying node databases.

---

## 6. Private Mempools & MEV Protection Architecture

### The Frontrunning & Sandwich Problem
On public blockchains, pending transactions reside in the public mempool (`txpool`). Predatory MEV (Maximal Extractable Value) searcher bots monitor the gossip network. When they spot a user submitting a large decentralized exchange (DEX) swap:
1. The searcher bot submits a buy transaction with a higher gas fee to be mined immediately before the user's transaction (**Frontrun**).
2. The user's transaction executes at an inflated price, pushing the token price higher.
3. The searcher bot immediately submits a sell transaction mined directly after (**Backrun**), pocketing risk-free profit at the victim's expense.

```
Public Mempool (Gossip Network):
[ Bot Frontrun Buy (Gas: 50 gwei) ] ──► [ User Swap (Gas: 40 gwei) ] ──► [ Bot Backrun Sell (Gas: 50 gwei) ]
```

### Alchemy's MEV Protection Pipeline
When a developer or wallet integrates Alchemy with MEV Protection enabled:
1. `eth_sendRawTransaction` bypasses the public P2P gossip mempool entirely.
2. Cortex packages the transaction into an encrypted private bundle.
3. The bundle is streamed via private RPC channels directly to trusted block builders (e.g. Flashbots, Builder0x69, BeaverBuild, Titan Builder).
4. Block builders include the bundle directly into the block without exposing it to the public mempool before mining.
5. **Revert Protection**: If market conditions change and the user's transaction would revert, block builders automatically exclude the transaction from the block, saving the user 100% of the gas fee that would have been burned on a reverted transaction.

---

## 7. Core RPC vs. Dedicated RPC Clusters

Alchemy operates two distinct operational tiers for blockchain connectivity:

### 1. Core RPC (Elastic Multi-Tenant)
- **Target Audience**: Startups, production dApps, general web3 applications.
- **Topology**: Shared multi-tenant node clusters distributed across global availability zones.
- **Elastic Auto-Scaling**: Handles unexpected 100x traffic spikes automatically without provisioning lead time.
- **Throughput Limit**: Base limit of 300 CUPS on Free, 10,000 CUPS on Pay As You Go, with dynamic bursting.
- **SLA**: 99.99% uptime guarantee.

### 2. Dedicated RPC Clusters (Single-Tenant Bare Metal)
- **Target Audience**: High-frequency trading (HFT) funds, enterprise exchanges, institutional custody providers, large Layer 2 sequencers.
- **Topology**: Dedicated physical servers provisioned exclusively for a single client organization.
- **Hardware Isolation**: Zero noisy-neighbor effects; 100% reserved CPU, RAM, and NVMe disk throughput.
- **Custom Client Configurations**: Custom node implementations (e.g. specialized Reth, Erigon archive, custom internal tracing flags).
- **Sub-5ms Latency**: Nodes can be provisioned in exact cloud availability zones (e.g. AWS `us-east-1`, Google Cloud `us-central1`) directly adjacent to client trading servers.
- **SLA**: 99.999% custom enterprise SLA with 24/7 dedicated engineering support channels.
