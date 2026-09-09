# VOLUME 10: ROLLUPS-AS-A-SERVICE (RaaS) SYSTEM DESIGN BLUEPRINT
*Deploying Production Layer 2 and Layer 3 Custom Blockchains (2026 Live Audit)*

---

## 1. The Modular Rollup Architecture

Monolithic blockchains attempt to perform all four core functions on a single layer:
1. **Execution**: Processing state updates and running smart contract bytecode.
2. **Settlement**: Resolving disputes and finalizing fraud/validity proofs.
3. **Consensus**: Ordering transactions and establishing canonical history.
4. **Data Availability (DA)**: Ensuring transaction data is publicly accessible for verification.

Modular blockchains decouple these functions. **Rollups** execute transactions off-chain at high speed and post compressed transaction data or mathematical validity proofs back to Layer 1 for settlement and data availability.

**Alchemy Rollups** provides a turnkey platform to deploy, scale, and manage custom Layer 2 and Layer 3 blockchains without managing node hardware, sequencers, or cross-chain bridge contracts.

---

## 2. Supported Rollup Frameworks

```
┌─────────────────────────────────────────────────────────────┐
│                    ALCHEMY ROLLUPS (RaaS)                   │
├───────────────┬────────────────┬───────────────┬────────────┤
│   OP STACK    │ ARBITRUM ORBIT │  POLYGON CDK  │  ZK STACK  │
│ (Optimism L2) │  (Nitro L2/L3) │ (AggLayer ZK) │ (Hyperchain│
└───────┬───────┴────────┬───────┴───────┬───────┴─────┬──────┘
        │                │               │             │
        ▼                ▼               ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│              HOSTED CORE ROLLUP INFRASTRUCTURE              │
│   • Fault-Tolerant High-Availability Sequencer Nodes        │
│   • Multi-Region Public & Dedicated RPC Node Fleets         │
│   • Canonical L1 ◄► L2 Native Bridge Contracts & Frontends  │
│   • Hosted Visual Block Explorer (Blockscout / Routescan)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Posts Calldata / Proofs
┌─────────────────────────────────────────────────────────────┐
│                MODULAR DATA AVAILABILITY (DA)               │
│   • Ethereum L1 (Max Security)                              │
│   • Celestia DA (Low Cost Blob Stream)                      │
│   • EigenDA (Ethereum Restaked Security)                    │
│   • Arbitrum AnyTrust DAC (Sub-Cent Gaming/Social Fees)     │
└─────────────────────────────────────────────────────────────┘
```

### 1. OP Stack (Optimism Bedrock Architecture)
- **Execution**: `op-geth` (full EVM equivalence).
- **Consensus & Derivation**: `op-node`.
- **Superchain Interoperability**: Seamless cross-chain communication and shared governance across the Optimism Superchain ecosystem (Base, OP Mainnet, Soneium, Unichain, World Chain).

### 2. Arbitrum Orbit
- **Execution**: Arbitrum Nitro WASM-based execution engine.
- **Rollup Mode vs. AnyTrust Mode**:
  - *Rollup Mode*: Posts all transaction data directly to Ethereum Layer 1, inheriting maximum security.
  - *AnyTrust Mode*: Replaces L1 calldata with a **Data Availability Committee (DAC)**, reducing transaction fees to fractions of a cent—ideal for gaming and social applications.

### 3. Polygon CDK (Chain Development Kit)
- **Execution**: Zero-knowledge zkEVM architecture.
- **Interoperability**: Connects to Polygon's **AggLayer** for shared, instant cross-chain liquidity and atomic transactions across all connected CDK chains.

### 4. ZK Stack (Matter Labs / ZKsync)
- **Execution**: ZK-Rollup hyperchains with native account abstraction and ultra-fast ZK prover integration.

---

## 3. Bundled RaaS Operational Components

When deploying an Alchemy Rollup, the following services are automatically provisioned:
1. **Sequencer Hosting**: Automated state commitment with high-availability standby failover sequencers.
2. **RPC Fleet**: Auto-scaling public RPC endpoints with built-in DDoS protection, rate limiting, and CORS allowlists.
3. **Canonical Cross-Chain Bridges**: Deployed L1 and L2 smart contract bridges with a hosted web UI for user deposits and withdrawals.
4. **Block Explorer**: Fully indexed block explorer providing real-time transaction tracking, address balances, and verified contract interactions.
5. **Data Availability (DA) Integration**: Automated posting of blob transactions to Ethereum L1 (EIP-4844), Celestia, or EigenDA.
