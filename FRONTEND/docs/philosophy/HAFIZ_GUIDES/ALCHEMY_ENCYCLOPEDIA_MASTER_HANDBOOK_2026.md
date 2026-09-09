# THE DEFINITIVE ALCHEMY ENCYCLOPEDIA & ARCHITECTURAL HANDBOOK (2026 EDITION)
*Verified Live Data directly from [Alchemy Dashboard](https://dashboard.alchemy.com/) & [Official Documentation](https://www.alchemy.com/docs)*

---

## VOLUME I: DEEP ARCHITECTURE & ENGINE INTERNALS (CORTEX)

### 1.1 The Cortex Intelligent Blockchain Engine
Raw blockchain full nodes (Geth, Nethermind, Erigon, Besu) are designed for peer-to-peer Byzantine fault-tolerant consensus, not for serving high-concurrency, low-latency API traffic. Alchemy’s proprietary **Cortex** engine operates as a distributed virtualization and execution platform sitting between incoming JSON-RPC traffic and global node fleets:

1. **Intelligent Request Routing**:
   - Inspects incoming method semantics in flight.
   - Read-only static queries (`eth_blockNumber`, `eth_chainId`), heavy range queries (`eth_getLogs`), state executions (`eth_call`), and heavy VM traces (`debug_traceCallMany`) are bifurcated to specialized, dedicated node clusters optimized for those specific memory and CPU access patterns.
2. **Consensus-Aware Load Balancing**:
   - Traditional L4/L7 load balancers round-robin requests blindly.
   - Cortex continuously tracks canonical block heights, block hashes, and reorg depths across all nodes in real time.
   - If a client queries `eth_getBlockByNumber` for the latest block, Cortex guarantees dispatch to a node that has already imported that canonical block hash, eliminating false "block not found" errors.
3. **Multi-Tier Distributed In-Memory Caching**:
   - Finalized immutable blocks, receipts, and historic logs are permanently cached across globally distributed memory caches.
   - Head-of-chain blocks are cached with millisecond invalidation triggers, reducing node disk I/O pressure by over 90%.
4. **Auto-Healing & Fleet Quarantining**:
   - Nodes exhibiting latency degradation, peer isolation, or memory leaks are automatically drained from active rotation without dropping client connections.

### 1.2 MEV Protection & Private Mempools
- In public mempools, standard `eth_sendRawTransaction` broadcasts transactions to peer-to-peer gossip networks, exposing users to sandwich attacks and predatory frontrunning.
- Alchemy's built-in **MEV Protection** automatically routes raw EVM transactions directly to trusted block builders (Flashbots / `mev-boost` builders).
- **Core Benefits**:
  - Zero frontrunning and sandwich risk.
  - Zero gas costs on failed or reverting transactions (builders drop failing transactions rather than mining them).
  - Configurable fallback rules if private builders do not include the transaction within a targeted block window.

### 1.3 Core RPC vs. Dedicated Hardware Clusters
- **Core RPC (Elastic Multi-Tenant)**: Distributed across North America, Europe, and Asia. Auto-scales for sudden 100x traffic spikes with 99.99% uptime SLAs.
- **Dedicated Clusters (Single-Tenant Bare Metal)**: Physically isolated server clusters provisioned exclusively for an enterprise. Guarantees 100% throughput isolation, zero noisy-neighbor interference, custom node configurations (custom Erigon/Reth indexing), and geographic co-location for high-frequency trading (HFT) with sub-5ms latency.

---

## VOLUME II: COMPLETE ACCOUNT ABSTRACTION & SMART ACCOUNTS ENCYCLOPEDIA

### 2.1 The Complete ERC-4337 Lifecycle
1. **UserOp Construction**: Client builds UserOperation struct with anti-replay `nonce`, `callData`, gas limits, and gas prices.
2. **Gas Estimation**: Client calls `eth_estimateUserOperationGas`. Alchemy Rundler dry-runs verification and execution loops against EntryPoint, returning required limits: `preVerificationGas`, `verificationGasLimit`, `callGasLimit`, plus `validAfter` and `validUntil` timestamps.
3. **Paymaster Sponsorship**: Client invokes `alchemy_requestGasAndPaymasterAndData`. Gas Manager evaluates policy rules (spend caps, allowlists), signs with Alchemy's Paymaster key, and injects paymaster fields.
4. **Signing**: User signs the UserOp hash via ECDSA, WebAuthn Passkey (P-256), or Session Key.
5. **Rundler Ingestion & Simulation**: UserOp is submitted via `eth_sendUserOperation`. Rundler executes strict ERC-7562 validation (no unauthorized storage access during verification, deposit sufficiency check).
6. **Mempool & Onchain Execution**: Rundler batches valid UserOps into a canonical transaction calling `EntryPoint.handleOps(ops, beneficiary)`.

### 2.2 EntryPoint v0.6 vs. v0.7 / v0.8 Specifications
- **Account Creation**: EP v0.6 uses packed `initCode`. EP v0.7 separates into `factory` (address) and `factoryData` (bytes).
- **Paymaster Fields**: EP v0.6 uses packed `paymasterAndData`. EP v0.7 normalizes into `paymaster`, `paymasterVerificationGasLimit`, `paymasterPostOpGasLimit`, and `paymasterData`.
- **Gas Packing**: EP v0.7 enforces 128-bit integer gas packing and standardized revert error codes (`AA2x` for account verification, `AA3x` for paymaster validation).

### 2.3 Modular Account V2 (ERC-6900) & Session Keys
- **Ultra-Lean Runtime**: 97,764 gas deployment runtime (84.6% cheaper than ZeroDev Kernel v3; 195.8% cheaper than Safe). Audited by ChainLight and Quantstamp.
- **ERC-6900 Module System**: Pluggable Validation plugins (Passkeys, Session Keys, Multisig), Execution plugins, and Pre/Post Hooks (spending limits, time locks).
- **Session Keys Permissions**:
  - `native-token-transfer`: Scoped to transfer limit in wei.
  - `erc20-token-transfer`: Scoped to ERC-20 contract address and cumulative token limit.
  - `gas-limit`: Maximum gas spend authorized.
  - `contract-access`: Whitelists all functions on a target contract.
  - `functions-on-contract`: Scoped to 4-byte function selectors on a target contract.
  - `account-functions`: Grants access to manage account modules.
  - `root`: Unrestricted administrative access.

### 2.4 Native EIP-7702 Delegation Workflow
- Allows traditional EOAs to temporarily delegate execution to smart contract bytecode (such as Modular Account V2).
- EOA signs `eip7702Auth` tuple (`chainId`, `nonce`, `address`, `yParity`, `r`, `s`).
- Bundler accepts tuple directly inside `eth_sendUserOperation`. The EOA retains its standard address and private key while unlocking transaction batching, paymaster gas sponsorship, and session keys.

---

## VOLUME III: SOLANA HIGH-PERFORMANCE ARCHITECTURE (YELLOWSTONE, DAS v2, PHOTON)

### 3.1 Yellowstone gRPC & The Geyser Protocol
- **Binary Streaming Protocol**: Bypasses HTTP JSON-RPC and WebSockets. Streams raw validator state updates over HTTP/2 using gRPC binary Protocol Buffers directly from Solana validator Geyser plugins.
- **Multi-Topic `SubscribeRequest`**: Concurrently streams `accounts`, `slots`, `transactions` (with account inclusion/exclusion filters), `blocks`, `blocks_meta`, and `entry` (PoH units).
- **Performance**: 100–300ms faster than WebSocket subscriptions.
- **Historical Replay**: Specify `from_slot` in `SubscribeRequest` to immediately backfill missed blocks following connection drops.
- **Unary Methods (10 CU)**: `GetBlockHeight`, `GetLatestBlockhash`, `GetSlot`, `GetVersion`, `IsBlockhashValid`, `Ping`, `SubscribeReplayInfo`.

### 3.2 Solana AccountsDB Historical Archiving
- Standard nodes only retain recent account slots.
- Alchemy’s AccountsDB infrastructure enables deep historical queries via `getAccountInfo` cursors (`slot`, `lastUpdateBeforeSlot`, `firstUpdateAfterSlot`).

### 3.3 Solana DAS API v2 & Photon ZK Compression
- **DAS API v2**: Fast indexing for compressed NFTs (Bubblegum protocol) and regular tokens (`getAsset_v2`, `getAssetBatch_v2` up to 1,000 items, `getAssetProof_v2` for onchain Merkle proofs, `searchAssets_v2`).
- **Photon ZK Compression (26 Methods)**: Indexes state trees for Light Protocol ZK compression, slashing state rent by up to 99.9%. Includes `getValidityProof` (1,200 CU) for onchain verification.

---

## VOLUME IV: ROLLUPS-AS-A-SERVICE (RaaS) INFRASTRUCTURE BLUEPRINT

### 4.1 Turnkey Layer 2 & Layer 3 Architecture
- **OP Stack (Optimism Bedrock)**: EVM equivalence, native cross-chain messaging within the Optimism Superchain.
- **Arbitrum Orbit**: Custom L2/L3 rollups settling to Ethereum or Arbitrum One. Offers Rollup mode (L1 calldata) or AnyTrust mode (Data Availability Committee - DAC for sub-cent fees).
- **Polygon CDK**: ZK-rollup architecture connecting to the AggLayer for shared cross-chain liquidity.
- **ZK Stack**: Hyperchains with native account abstraction and ultra-fast ZK proofs.

### 4.2 Turnkey Bundled Components
- High-availability Sequencer with automated state commitment.
- Multi-region Core RPC fleets and dedicated node clusters.
- Canonical cross-chain bridge contracts and hosted bridge frontends.
- Visual block explorer.
- Modular Data Availability (DA): Ethereum L1 calldata, Celestia DA, EigenDA, Arbitrum AnyTrust.

---

## VOLUME V: COMPREHENSIVE DEVELOPER MANUALS & CODE GUIDES

### 5.1 Production TypeScript Setup (`alchemy-sdk` & `@alchemy/aa-alchemy`)
```typescript
import { Alchemy, Network } from 'alchemy-sdk';
import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy';
import { LocalAccountSigner } from '@alchemy/aa-core';
import { sepolia } from 'viem/chains';

const alchemy = new Alchemy({
  apiKey: 'YOUR_API_KEY',
  network: Network.ETH_SEPOLIA,
});

async function main() {
  // 1. Query token balances across wallets
  const balances = await alchemy.core.getTokenBalances('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  console.log('Balances:', balances);

  // 2. Initialize gas-sponsored Modular Smart Account
  const signer = LocalAccountSigner.privateKeyToAccountSigner('0x...');
  const client = await createModularAccountAlchemyClient({
    apiKey: 'YOUR_API_KEY',
    chain: sepolia,
    signer,
    gasManagerConfig: { policyId: 'YOUR_GAS_POLICY_ID' },
  });

  // 3. Dispatch sponsored UserOperation
  const { hash } = await client.sendUserOperation({
    uo: {
      target: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      data: '0x...',
      value: 0n,
    },
  });
  console.log('Sponsored UserOp dispatched:', hash);
}
```

### 5.2 Python Data APIs & HMAC Webhook Verification
```python
import requests
import hmac
import hashlib

def verify_alchemy_webhook(raw_payload: bytes, signature_header: str, signing_key: str) -> bool:
    """
    Validates HMAC-SHA256 signature on incoming Alchemy Webhooks
    """
    computed = hmac.new(signing_key.encode('utf-8'), raw_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, signature_header)

def fetch_asset_transfers(api_key: str, address: str):
    url = f"https://eth-mainnet.g.alchemy.com/v2/{api_key}"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "alchemy_getAssetTransfers",
        "params": [{
            "fromBlock": "0x0",
            "toBlock": "latest",
            "fromAddress": address,
            "category": ["external", "internal", "erc20"],
            "maxCount": 100
        }]
    }
    response = requests.post(url, json=payload).json()
    return response.get("result", {}).get("transfers", [])
```

---

## VOLUME VI: THE AI DEVELOPER STACK (2026)

### 6.1 Agent Wallets Architecture & Security Model
- **Zero Key Exposure**: Autonomous AI agents operate through `@alchemy/cli` or SDKs via ephemeral **Session Signers**. Agents never read, store, or transmit private keys.
- **Approval & Isolation**: Developers approve agent sessions in the browser (`dashboard.alchemy.com/products/agent-wallet`), configure lifetime expiries (e.g. 1h, 24h), and set maximum USDC spend caps.
- **Instant Revocation**: Sessions can be revoked instantly from the dashboard or via `alchemy wallet disconnect`.

### 6.2 The x402 Protocol & Autonomous HTTP Micro-Payments
- Enables AI agents to pay for web APIs in USDC over HTTP.
- **Execution Flow**:
  1. Agent sends request: `alchemy x402 request https://api.service.com/data --max-payment 0.05`
  2. Server returns HTTP `402 Payment Required` with quote headers (price, network, accepted scheme).
  3. CLI decodes quote, validates against `--max-payment`, signs an EIP-3009 or Circle Gateway payment with the Agent Wallet session, retries the HTTP request, and returns the paid resource with a receipt.
- **Flags**: `--estimate` (free quote decoding), `--max-payment <usdc>`, `--scheme <gateway|exact|any>`, `--signer session`.

### 6.3 Alchemy MCP Server (`https://mcp.alchemy.com/mcp`)
Exposes **168 Tools** via the Model Context Protocol:
- **Admin (8 tools)**: App management, key rotation, allowlists.
- **RPC (132 tools)**: Direct JSON-RPC execution across 81 blockchains.
- **Data (28 tools)**: Token balances, NFT ownership, floor prices, simulations, historical transfers.

---

## VOLUME VII: ENTERPRISE SECURITY, RATE LIMITING & BILLING OPERATIONS

### 7.1 Defense-in-Depth Security Settings
1. **Contract Allowlist**: Restricts `eth_call`, `eth_getCode`, `eth_getLogs`, `eth_getStorageAt` strictly to authorized contract addresses.
2. **Domain / CORS Allowlist**: Validates `Origin` and `Referer` headers.
3. **IP Allowlist**: Restricts traffic to IPv4/IPv6 CIDR blocks. Unauthorized requests receive code `32600` and consume **0 CUs**.
4. **JWT Authentication**: Enforces cryptographic request signing with RS256/ES256 public keys.

### 7.2 Throughput, CUPS Bursting & Optimization
- **Limits**: 300 CUPS (Free), 10,000 CUPS (PAYG), Unlimited (Enterprise).
- **Elastic Bursting**: Allows applications to burst above base limits during surges.
- **Error 429 Handling**: Exponential backoff with jitter. Requests failing with 429 consume **0 CUs**.
- **Gzip Compression**: Adding `Accept-Encoding: gzip` accelerates requests >100KB by ~75%.
