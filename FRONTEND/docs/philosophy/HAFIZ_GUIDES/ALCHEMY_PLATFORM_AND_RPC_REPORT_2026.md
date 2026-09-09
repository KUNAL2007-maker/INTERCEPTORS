# Alchemy Complete Platform & Ecosystem Intelligence Report (2026 Live Audit)
*Verified Live Data directly from [Alchemy Dashboard](https://dashboard.alchemy.com/) & [Official Documentation](https://www.alchemy.com/docs)*

---

## 1. Executive Summary & Platform Overview

Alchemy has expanded from an Ethereum RPC node provider into the industry's premier multi-chain web3 developer platform, powered by **Cortex** (Alchemy's intelligent blockchain engine). As of 2026, Alchemy provides:

- **155 RPC Endpoints across 81+ Blockchains**: Covering EVM, SVM (Solana), UTXO (Bitcoin, Dogecoin, Litecoin, BCH), Move (Aptos, Sui), TVM (Tron), Cosmos/Wasm (Injective), and emerging modular execution environments (Hyperliquid HyperEVM, Monad, MegaETH, Berachain).
- **Multi-Protocol Connectivity**: Standard HTTPS JSON-RPC, Smart WebSockets, low-latency gRPC streaming (Yellowstone gRPC for Solana, Sui gRPC, Tron gRPC, Aptos gRPC), and real-time Webhooks.
- **AI-First Infrastructure ("Build with AI")**: The new **Agent Wallets**, **@alchemy/cli**, **Alchemy MCP Server** (168 native tools across 100+ chains), **Agent Skills**, and **x402 protocol payments** (enabling autonomous AI coding agents to pay for APIs with USDC without exposing private keys).
- **Account Abstraction (ERC-4337 & EIP-7702)**: Production Bundler (EntryPoint v0.6 & v0.7/v0.8), Gas Manager with granular sponsorship policies, Modular Account V2 (ERC-6900), Light Accounts, and session keys.
- **Rollups-as-a-Service (RaaS)**: Turnkey deployment for custom Layer 2 and Layer 3 rollups (OP Stack, Arbitrum Orbit, Polygon CDK, ZK Stack) with sequencer hosting, RPC, native bridges, and explorers out-of-the-box.

---

## 2. Complete Network & Node RPC Catalog

### Platform Totals:
* **81 Unique Blockchains**
* **155 Public RPC Endpoints** (Mainnets, Testnets, Devnets, Beacon Chains)

### Exhaustive Directory of Supported Networks & Endpoints

| Blockchain | Slug Prefix | Network Tiers Supported | Specialized Architecture & APIs | Support Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Ethereum** | `eth` | Mainnet, Sepolia, Hoodi, Mainnet Beacon, Sepolia Beacon, Hoodi Beacon | EVM L1, Beacon Chain HTTP API (48 methods), Trace API, Debug API, Smart WebSockets, MEV Protection | Core & Enhanced |
| **Solana** | `solana` | Mainnet, Devnet | SVM, Yellowstone gRPC, DAS API v2, Photon ZK-Compression, AccountsDB Historical Archive | Core & Data |
| **Base** | `base` | Mainnet, Sepolia | OP Stack L2 by Coinbase, internal transfers, full Trace/Debug | Core & Enhanced |
| **Arbitrum One** | `arb` | Mainnet, Sepolia | Nitro architecture, Arbitrum Trace API (8 specialized methods) | Core & Enhanced |
| **OP Mainnet** | `opt` | Mainnet, Sepolia | Optimism Bedrock EVM, OP-specific methods | Core & Enhanced |
| **Polygon PoS** | `polygon` / `matic` | Mainnet, Amoy | EVM sidechain, Polygon-specific RPC methods | Core & Enhanced |
| **ZKsync Era** | `zksync` | Mainnet, Sepolia | ZK rollup, native AA & paymaster execution | Core & Enhanced |
| **Linea** | `linea` | Mainnet, Sepolia | ConsenSys zkEVM, Linea-specific methods | Core & Enhanced |
| **Scroll** | `scroll` | Mainnet | Native zkEVM Layer 2 | Core & Enhanced |
| **Berachain** | `berachain` | Mainnet, Bepolia | EVM L1 powered by Proof of Liquidity (PoL) | Core & Enhanced |
| **Avalanche** | `avax` | Mainnet (C-Chain), Fuji, P-Chain | EVM C-Chain + 26 Avalanche P-Chain standard methods | Core & Enhanced |
| **Monad** | `monad` | Mainnet, Testnet | Parallelized EVM L1, `monadNewHeads`, `monadLogs` speculative event subscriptions | Core & Enhanced |
| **Hyperliquid** | `hyperliquid` | Mainnet, Testnet | HyperEVM RPC, HyperCore gRPC, Peering, Clearinghouse states, L2 Orderbook diff snapshots | Core & Data |
| **MegaETH** | `megaeth` | Mainnet, Testnet | Real-time sub-millisecond EVM rollup | Core & Data |
| **Sonic** | `sonic` | Mainnet, Testnet | Fantom's next-gen 10k+ TPS EVM upgrade | Core & Data |
| **Soneium** | `soneium` | Mainnet, Minato | Sony Block Solutions OP Stack L2 | Core & Enhanced |
| **Unichain** | `unichain` | Mainnet, Sepolia | Uniswap Labs DeFi-optimized OP Stack L2 | Core & Enhanced |
| **Abstract** | `abstract` | Mainnet, Testnet | Consumer ZK Stack L2 (Igloo / Pudgy Penguins) | Core & Enhanced |
| **Shape** | `shape` | Mainnet, Sepolia | Creator rollup with gasback rebates | Core & Enhanced |
| **ApeChain** | `apechain` | Mainnet, Curtis | Arbitrum Orbit L3 for ApeCoin ecosystem | Core & Enhanced |
| **World Chain** | `worldchain` | Mainnet, Sepolia | OP Stack L2 for World ID / Proof of Human | Core & Enhanced |
| **Robinhood Chain** | `robinhood` | Mainnet, Testnet | Institutional Layer 2 rollup | Core & Enhanced |
| **Ink** | `ink` | Mainnet, Sepolia | Kraken OP Stack Superchain L2 | Core & Enhanced |
| **Celo** | `celo` | Mainnet, Sepolia | Regenerative EVM OP Stack L2 | Core & Enhanced |
| **Blast** | `blast` | Mainnet, Sepolia | Native yield EVM L2 | Core & Enhanced |
| **BNB Smart Chain** | `bnb` | Mainnet, Testnet | Binance EVM L1 | Core & Data |
| **opBNB** | `opbnb` | Mainnet, Testnet | High-speed OP Stack L2 for BNB Chain | Core & Data |
| **Mantle** | `mantle` | Mainnet, Sepolia | Modular EVM rollup with EigenDA | Core & Data |
| **Zora** | `zora` | Mainnet, Sepolia | NFT & creator OP Stack L2 | Core & Enhanced |
| **Starknet** | `starknet` | Mainnet, Sepolia | Cairo ZK-Rollup (35 JSON-RPC methods) | Core & Data |
| **Sei** | `sei` | Mainnet, Testnet | Parallelized EVM L1 | Core & Data |
| **Sui** | `sui` | Mainnet, Testnet | Move-based L1, 51 RPC + 27 gRPC methods | Core & Data |
| **Aptos** | `aptos` | Mainnet, Testnet | Move L1, 28 REST + Aptos gRPC methods | Core & Data |
| **Tron** | `tron` | Mainnet, Testnet | TVM, 89 HTTP + 194 gRPC + 30 Solidity methods | Core & Data |
| **Bitcoin** | `bitcoin` | Mainnet, Testnet, Signet, Testnet4 | UTXO L1, 37 JSON-RPC + 35 Indexer REST + 13 UTXO REST methods | Core & Data |
| **Dogecoin** | `dogecoin` | Mainnet | Scrypt UTXO network | Core & Data |
| **Bitcoin Cash** | `bitcoincash` | Mainnet, Testnet | UTXO fork network | Core & Data |
| **Litecoin** | `litecoin` | Mainnet, Testnet | Scrypt UTXO network | Core & Data |
| **Stellar** | `stellar` | Mainnet, Testnet | Soroban smart contracts, 59 standard methods, Address Activity Webhooks | Core & Enhanced |
| **Citrea** | `citrea` | Mainnet, Testnet | Bitcoin ZK-rollup (18 Citrea-specific methods) | Core & Data |
| **DATA Network (Story)** | `story` | Mainnet, Aeneid | Intellectual Property blockchain | Core & Data |
| **Humanity Protocol** | `humanity` | Mainnet, Testnet | Palm-biometric identity blockchain | Core & Data |
| **Tempo** | `tempo` | Mainnet, Moderato | High-speed payment/settlement network | Core & Data |
| **Galactica** | `galactica` | Mainnet, Cassiopeia | Zero-knowledge identity & compliance L1 | Core & Data |
| **Lens Network** | `lens` | Mainnet, Sepolia | Social graph ZK Stack L2 | Core & Data |
| **World Mobile Chain** | `worldmobilechain` | Mainnet, Testnet | Decentralized telecommunications network | Core & Data |
| **Frax (Fraxtal)** | `frax` | Mainnet, Sepolia | Modular EVM rollup | Core & Data |
| **Gensyn** | `gensyn` | Mainnet, Testnet | Decentralized AI compute network | Core & Data |
| **Injective** | `injective` | Mainnet, Testnet | Cosmos-based DeFi L1 | Core & Data |
| **Flow EVM** | `flow` | Mainnet, Testnet | Cadence + EVM equivalence | Core & Data |
| **Kaia** | `kaia` | Mainnet, Testnet | Unified Klaytn + Finschia ecosystem | Core & Data |
| **Gnosis Chain** | `gnosis` | Mainnet, Chiado | Community EVM L1 | Core & Data |
| **Ronin** | `ronin` | Mainnet, Saigon | Gaming EVM L1 (Sky Mavis) | Core & Data |
| **BOB (Build on Bitcoin)** | `bob` | Mainnet, Sepolia | Hybrid Bitcoin L2 rollup | Core & Data |
| **Rootstock (RSK)** | `rootstock` | Mainnet, Testnet | Bitcoin merge-mined EVM | Core & Data |
| **CelestiaBridge** | `celestiabridge` | Mainnet, Mocha | DA bridge integration (30 RPC methods) | Core & Data |
| **Boba Network** | `boba` | Mainnet, Sepolia | Hybrid compute EVM rollup | Core & Data |
| **X Layer** | `xlayer` | Mainnet, Testnet | OKX ZK-Rollup (Polygon CDK) | Core & Data |
| **Superseed** | `superseed` | Mainnet, Sepolia | Repayment-focused OP Stack rollup | Core & Data |
| **Rise** | `rise` | Mainnet, Testnet | Gigagas parallel execution rollup | Core & Data |
| **Mode** | `mode` | Mainnet, Sepolia | OP Stack Superchain DeFi L2 | Core & Data |
| **Katana** | `katana` | Mainnet, Bokuto | High performance EVM | Core & Data |
| **Arc** | `arc` | Testnet | Next-gen infrastructure testnet | Core & Data |
| **Alpen** | `alpen` | Testnet | Bitcoin rollup infrastructure | Core & Data |
| **Jovay** | `jovay` | Mainnet, Testnet | High performance L1/L2 | Core & Data |
| **Pharos** | `pharos` | Mainnet, Atlantic | Real-world asset blockchain | Core & Data |
| **Edge** | `edge` | Mainnet, Testnet | Edge computing blockchain | Core & Data |
| **Moonbeam** | `moonbeam` | Mainnet | Polkadot EVM parachain | Core & Data |
| **Metis** | `metis` | Mainnet | Decentralized sequencer EVM rollup | Core & Data |
| **Cronos** | `cronos` | Mainnet, Testnet | Cosmos EVM blockchain | Core & Data |
| **XMTP** | `xmtp` | Ropsten | Decentralized messaging layer | Core & Data |
| **ADI** | `adi` | Mainnet, Testnet AB | Financial infrastructure chain | Core & Data |
| **CrossFi** | `crossfi` | Mainnet, Testnet | Banking/crypto bridge chain | Core & Enhanced |
| **Stable** | `stable` | Mainnet, Testnet | Stablecoin-optimized network | Core & Data |
| **Plasma** | `plasma` | Mainnet, Testnet | High throughput payments | Core & Data |
| **Mythos** | `mythos` | Mainnet | Web3 gaming ecosystem | Core & Data |
| **Astar** | `astar` | Mainnet | Polkadot/EVM interoperability | Core & Data |
| **ZetaChain** | `zetachain` | Mainnet, Testnet | Omnichain smart contracts | Core & Data |
| **Anime** | `anime` | Mainnet, Sepolia | Media and entertainment EVM network | Core & Enhanced |
| **Settlus** | `settlus` | Mainnet, Sepolia | Metaverse/settlement blockchain | Core & Enhanced |

### CRITICAL: Official Sunsets & Deprecations (Combatting Outdated Data)
Many web sources still list deprecated networks. Alchemy has officially **sunset or replaced** the following:
* **Arbitrum Nova** (Sunset)
* **Botanix** (Sunset)
* **Clankermon** (Sunset)
* **Degen Chain** (Sunset)
* **Fantom Opera** (Deprecated/sunset, replaced by Sonic)
* **Geist** (Sunset)
* **Lumia** (Sunset)
* **Polygon zkEVM** (Sunset)
* **Tea** (Sunset)
* **Alchemy Subgraphs** (Sunset, migrated to Goldsky)

---

## 3. Core Node RPC Architectures & Specialized APIs

### 1. Core RPC vs. Dedicated RPC
* **Core RPC**: Multi-tenant elastic routing across global node fleets with 99.99% uptime, auto-failover, and built-in **MEV Protection** (private routing via Flashbots / mev-boost to prevent frontrunning and sandwiching).
* **Dedicated RPC & Dedicated Clusters**: Single-tenant isolated clusters, dedicated compute hardware, 100% throughput isolation, custom geolocations, custom indexing configurations, and enterprise SLAs.

### 2. Execution Tracing & Debugging APIs
* **Trace API (OpenEthereum standard)**: `trace_transaction`, `trace_block`, `trace_filter`, `trace_call`. Provides deep execution call-trees, internal contract calls, value transfers, gas consumption per opcode, and contract creation traces.
* **Debug API (Geth standard)**: `debug_traceBlockByHash`, `debug_traceBlockByNumber`, `debug_traceCall`, `debug_traceCallMany` (nested trace bundles with state overrides), `debug_traceTransaction`, `debug_getRawBlock`, `debug_getRawHeader`, `debug_getRawReceipts`.
* **Arbitrum Trace API**: 8 specialized Nitro trace methods.
* **Ethereum Beacon Chain HTTP API**: 48 methods for validator duties, consensus state, and epoch sync.

### 3. Solana (SVM) High-Performance Stack
* **Yellowstone gRPC**: Ultra-low-latency binary streaming directly from Solana Geyser plugins:
  * Subscriptions: Slots, Transactions (with complex account/program filters), Accounts, and Blocks.
  * Historical Replay: Fast backfilling of missing historical slots without querying JSON-RPC.
* **AccountsDB Infrastructure**: Optimized indexed storage allowing fast queries of account states.
* **Solana Account Archive**: Historical state queries at any historical slot via `getAccountInfo` cursors (`lastUpdateBeforeSlot`, `firstUpdateAfterSlot`).
* **DAS API v2 (Digital Asset Standard)**: Complete compressed NFT and SPL token indexing (`getAsset_v2`, `getAssetBatch_v2`, `getAssetProof_v2`, `getAssetsByOwner_v2`, `searchAssets_v2`).
* **Photon APIs**: Native support for Solana ZK Compression.

### 4. Hyperliquid HyperCore Architecture
* **HyperEVM RPC**: Full EVM JSON-RPC methods.
* **HyperCore gRPC & Peering**: Low-latency direct binary streaming of validator consensus and orderbook updates.
* **HyperCore REST APIs**: Direct access to Clearinghouse state, Spot clearinghouse, L2 orderbook diff snapshots (`get-l-2-book-diff-snapshot`), open orders, user fills, non-funding ledger updates, and liquidatable accounts.

### 5. Bitcoin & UTXO Multi-Layer Stack
* **Standard JSON-RPC**: 37 Bitcoin Core methods.
* **Indexer REST API**: 35 methods for address UTXOs, mempool transactions, script analysis, and block stats.
* **UTXO REST API**: 13 low-overhead REST endpoints for Bitcoin, Dogecoin, Bitcoin Cash, and Litecoin.

---

## 4. Advanced Data APIs & Services

Alchemy abstracts complex blockchain data ingestion into fast, cached, multi-chain endpoints:

1. **Portfolio API**: Single unified query returning total wallet holdings: native balances, ERC-20 token balances, and NFTs across EVM and Solana.
2. **Token API**:
   * `alchemy_getTokenBalances`: Instant ERC-20 balances for any wallet.
   * `alchemy_getTokenMetadata`: Token name, symbol, decimals, logo URL.
   * `alchemy_getTokenAllowance`: Direct allowance checks.
3. **Prices API**: Spot and historical prices by contract address or symbol.
4. **Transfers API**:
   * `alchemy_getAssetTransfers`: Complete transfer history for any address (external, internal calls, ERC-20, ERC-721, ERC-1155) without running custom indexers or heavy `eth_getLogs` loops.
5. **Utility API**:
   * `alchemy_getTransactionReceipts`: Returns all transaction receipts in a block by hash or number in one network round-trip.
6. **NFT API v3**:
   * Ownership, metadata, batch queries, contract metadata, collection floor prices (aggregating OpenSea, Blur, LooksRare), spam detection (`isSpamContract`, `reportSpamAddress`), and cache invalidation (`refreshNFTMetadata`).
7. **Transaction Simulation API**:
   * `alchemy_simulateAssetChanges`: Previews exact balance and NFT transfers before signing.
   * `alchemy_simulateExecution`: Detects reverts, parses logs, and calculates exact gas consumption.
   * Bundled simulation support (`alchemy_simulateAssetChangesBundle`).
8. **Smart WebSockets**:
   * Native event streaming (`newHeads`, `logs`), Alchemy pending transactions (`alchemy_pendingTransactions`), mined transactions (`alchemy_minedTransactions`), and high-speed speculative events (`monadNewHeads`, `monadLogs`).

---

## 5. Webhooks & Real-Time Notification Engine

Alchemy Webhooks deliver instantaneous HTTP push notifications for onchain events:
1. **Address Activity Webhook**: Triggers on native token, ERC-20, ERC-721, or ERC-1155 transfers to or from watched addresses.
2. **NFT Activity Webhook**: Triggers on transfers, mints, and burns for tracked NFT contracts.
3. **Stellar Address Activity Webhook**: Triggers on native XLM and classic asset transfers.
4. **Custom GraphQL Webhooks**:
   * Write custom GraphQL queries to filter any event, log topic, transaction property, or marketplace trade.
   * Support for dynamic GraphQL variables (`createCustomWebhookVariable`, `updateCustomWebhookVariable`).

---

## 6. Wallets, Account Abstraction & EIP-7702

Alchemy provides a complete, modern smart wallet stack:
1. **Bundler API**:
   * Supports both **EntryPoint v0.6** and **EntryPoint v0.7 / v0.8**.
   * `eth_sendUserOperation`, `eth_estimateUserOperationGas`, `eth_getUserOperationByHash`, `eth_getUserOperationReceipt`, `eth_supportedEntryPoints`.
2. **Gas Manager / Sponsorship**:
   * Gasless transactions via Paymasters.
   * Configurable sponsorship policies: spending limits, user caps, contract allowlists, and expiry dates.
   * Pay gas with ERC-20 tokens (e.g. USDC).
   * Gas sponsorship is free on testnets; 8% admin fee on PAYG mainnets.
3. **EIP-7702 Native Support**: Dynamic delegation of EOAs to smart account bytecode, allowing EOAs to execute batched transactions and leverage paymasters without creating contract accounts.
4. **Smart Account Contracts**:
   * Modular Account V2 (ERC-6900).
   * Light Account & Multi-Owner Light Account.
   * Session Keys: Ephemeral scoped delegation keys with spend caps and time bounds.
5. **Signer Integrations**: First-class support for Privy, Turnkey, Openfort, standard EOAs, and custom viem/wagmi signers.

---

## 7. Build with AI: The 2026 AI Developer Stack

1. **Alchemy Agent Wallets**:
   * Dedicated onchain EVM & Solana wallets for AI coding agents.
   * Agents transact via the Alchemy CLI without accessing or exposing raw private keys.
   * Dashboard-level session approval, spend limits, and instant revocation.
2. **Alchemy CLI (`@alchemy/cli`)**:
   * Terminal client for humans and agents (Claude Code, Cursor, Codex).
   * Real-time onchain querying, balance checks, transaction sending, and session management.
3. **Alchemy MCP Server (`https://mcp.alchemy.com/mcp`)**:
   * Direct Model Context Protocol connection exposing **168 tools** across 100+ chains with OAuth authentication.
4. **Agent Skills**: Pre-built prompt & code modules that train AI coding assistants on exact Alchemy endpoints, schemas, and best practices.
5. **x402 Protocol & Autonomous Payments**:
   * Enables AI agents to automatically decode HTTP 402 "Payment Required" errors and pay APIs in USDC on EVM networks with pre-set spend caps.
6. **Wallet Auth for APIs (SIWE)**:
   * Authenticate API requests using Sign-In With Ethereum and pay-as-you-go USDC streaming instead of static API keys.

---

## 8. Rollups-as-a-Service (Alchemy Rollups)
Turnkey Layer 2 and Layer 3 deployment in minutes:
* **Frameworks**: OP Stack, Arbitrum Orbit, Polygon CDK, ZK Stack.
* **Infrastructure**: Sequencer hosting, high-availability RPC, native cross-chain bridges, block explorers, and DA integrations (Ethereum L1, Celestia, EigenDA, Arbitrum AnyTrust).

---

## 9. Alchemy Dashboard Capabilities (What Can Be Done in App)

Inside `https://dashboard.alchemy.com/`, developers have complete operational control:
1. **App Management**: Create apps, configure chains, manage API keys, toggle between Core and Dedicated RPC.
2. **Interactive Sandbox**: In-browser API composer for all standard JSON-RPC, Enhanced APIs, EIP-7702, and UserOperation v0.6/v0.7 requests.
3. **Mempool Visualizer**: Live real-time stream of pending transactions across all chains.
4. **Request Logs**: Real-time HTTP log inspector showing request payloads, status codes (200, 429, 500), execution duration (latency in ms), and client IPs.
5. **Security Controls**:
   * Contract address allowlists (`eth_call`, `eth_getCode`, `eth_getLogs`, `eth_getStorageAt`).
   * Domain / CORS allowlists (HTTP Referer).
   * IP / CIDR allowlists.
   * JWT Public Key Authentication (cryptographic signature verification).
6. **Real-Time Alerts**: Automated notifications for CU spikes, error rate spikes, webhook delivery failures, and gas manager balance limits.
7. **Gas Sponsorship Policies**: Paymaster management, funding, and rule creation.
8. **Agent Wallet Dashboard**: View agent balances, monitor AI agent activity, and approve/revoke CLI sessions.
9. **Usage & Analytics**: Granular CU metrics per method, per network, and per protocol (HTTPS, WebSockets, Webhooks, gRPC).
10. **Team & Access Control**: RBAC roles (Admin, Member, Viewer).

---

## 10. Pricing & Compute Units (CUs) Structure

| Feature / Metric | Free Tier (Developer) | Pay As You Go (PAYG) | Enterprise |
| :--- | :--- | :--- | :--- |
| **Monthly Subscription** | $0 | $0 | Custom |
| **Included Compute Units** | **30,000,000 CUs/month** | Pay per usage | Custom volume pool |
| **CU Rate (0 - 300M CUs)** | N/A | **$0.45 / million CUs** | Custom discounted rates |
| **CU Rate (300M+ CUs)** | N/A | **$0.40 / million CUs** | Custom discounted rates |
| **Peak Throughput** | 300 CUPS | 10,000 CUPS | Unlimited custom |
| **Apps Limit** | 5 apps | 30 apps | Unlimited |
| **Webhooks Limit** | 5 webhooks | 100 webhooks | 500+ webhooks |
| **Debug / Trace APIs** | Not included | Included | Included |
| **Gas Manager Admin Fee** | Free on testnets | 8% on sponsored gas | Custom negotiated |
| **UTXO Addon** | N/A | Flat monthly fee | Included |

- **Compute Unit Concept**: Weighted resource measurement based on actual node compute cost (e.g. `eth_blockNumber` = 10 CUs, `eth_call` = 26 CUs, `eth_getLogs` = 75 CUs). Platform average across all methods is ~27 CUs/request.
