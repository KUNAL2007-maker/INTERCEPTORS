# VOLUME 11: DASHBOARD, SECURITY CONTROLS & COMPUTE UNIT (CU) PRICING MANUAL
*Complete Operational Manual for Alchemy Dashboard & Enterprise Operations (2026 Live Audit)*

---

## 1. Dashboard Submodules Walkthrough (`dashboard.alchemy.com`)

The Alchemy Dashboard is the central control plane for managing apps, security, billing, and real-time operations.

```
┌─────────────────────────────────────────────────────────────┐
│                 ALCHEMY DASHBOARD STRUCTURE                 │
├──────────────────┬──────────────────┬───────────────────────┤
│ APP MANAGEMENT   │ MONITORING & OPS │ SECURITY & POLICIES   │
│ • Apps Overview  │ • Request Logs   │ • Allowlists (CORS/IP)│
│ • API Key Vault  │ • Mempool View   │ • JWT RSA/ECDSA Keys  │
│ • Chain Routing  │ • Alerts Engine  │ • Gas Manager Policies│
│ • Sandbox        │ • Analytics / CUs│ • Agent Wallet Admin  │
└──────────────────┴──────────────────┴───────────────────────┘
```

---

## 2. Granular Security Allowlists: Defense-in-Depth

API keys exposed in public client frontends (such as dApps, mobile apps, or browser extensions) can be extracted by malicious actors. Alchemy provides a 4-layer defense-in-depth security suite:

### 1. Contract Address Allowlist
- **Mechanism**: Hard-restricts read operations strictly to specified smart contract addresses.
- **Affected Methods**:
  - `eth_call`
  - `eth_getCode`
  - `eth_getLogs`
  - `eth_getStorageAt`
- **Result**: Any attempt to query unapproved contracts or drain compute units with scanning scripts is immediately rejected.

### 2. Domain / CORS / Referer Allowlist
- **Mechanism**: Validates incoming `Origin` and `Referer` HTTP headers against configured domain patterns.
- **Wildcard Support**: `https://*.mydapp.com`, `https://mydapp.com`.
- **Enforcement**: Browsers enforce that malicious sites cannot invoke your API key from third-party origins.

### 3. IP / CIDR Block Allowlist
- **Mechanism**: Restricts backend server queries strictly to designated IPv4 / IPv6 addresses or CIDR blocks (e.g. `52.14.82.0/24`).
- **Error Behavior**: Requests originating from non-whitelisted IPs receive JSON-RPC error `32600: IP Address not on whitelist`.
- **Zero CU Cost Guarantee**: Rejections due to IP allowlists consume **0 Compute Units**, protecting applications against denial-of-wallet attacks.

### 4. Cryptographic JWT Authentication
- **Mechanism**: Enables cryptographically signed server-to-server requests without transmitting raw API secrets over the wire.
- **Setup**: Developers generate an RSA (RS256) or ECDSA (ES256) keypair, import the public key into the Alchemy Dashboard, and keep the private key secure on their backend.
- **Request Format**: The backend signs a short-lived JWT token (expiring in 60s) and passes it in the `Authorization: Bearer <token>` header. Alchemy verifies the signature against the registered public key.

---

## 3. Real-Time Operational Monitoring

### 1. Request Logs Inspector (`/logs`)
- Live real-time inspection of incoming requests.
- **Granular Query Filters**:
  - Filter by HTTP Status Code (`200 OK`, `429 Too Many Requests`, `400 Bad Request`, `500 Error`).
  - Filter by RPC Method (`eth_call`, `eth_getLogs`, `alchemy_getAssetTransfers`).
  - Filter by Client IP Address.
  - Filter by Response Latency (`> 100ms`, `> 500ms`, `> 1000ms`).
- **Inspectable Attributes**: Request headers, JSON-RPC payload parameters, response payload, latency in milliseconds, and CUs consumed.

### 2. Mempool Visualizer (`/mempool`)
- Live streaming graphical view of pending transactions circulating in the global mempool before block confirmation.
- Useful for monitoring gas price spikes, pending liquidation attempts, and DEX arbitrage bot activity.

### 3. Alerts Engine (`/settings/alerts`)
- Configures webhook and email notifications for operational incidents:
  - **Compute Unit Spikes**: Alert when hourly or daily CU consumption exceeds a threshold (e.g. 80% of monthly allocation).
  - **Error Rate Spikes**: Alert when 4xx or 5xx error percentages exceed 5% over rolling 5-minute or 1-hour windows.
  - **Webhook Delivery Failures**: Alert when consecutive delivery attempts to your webhook server fail.
  - **Gas Manager Low Balance**: Alert when Paymaster deposit falls below a designated threshold (e.g. < $100).

---

## 4. Compute Unit (CU) Billing & Cost Schedule

Unlike legacy infrastructure providers that charge a flat fee per request—unfairly overcharging simple queries while subsidizing heavy database scans—Alchemy weights each request by the actual computational, memory, and disk I/O cost incurred by node fleets:

### Comprehensive Method Cost Schedule

| RPC Method / API | Compute Units (CUs) | Throughput CU Limit | Category |
| :--- | :--- | :--- | :--- |
| `eth_chainId`, `net_version`, `eth_syncing` | **0 CU** | 5 CU | Free Metadata |
| `eth_blockNumber`, `eth_accounts`, `eth_subscribe` | **10 CU** | 10 CU | Lightweight Read |
| `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode` | **20 CU** | 20 CU | State Query |
| `eth_call` | **26 CU** | 26 CU | EVM Execution |
| `eth_sendRawTransaction` | **40 CU** | 50 CU | State Write |
| `eth_getLogs` | **60 CU** | 60 CU | Log Scanning |
| `trace_block`, `trace_get` | **20 CU** | 20 CU | Execution Trace |
| `trace_call`, `trace_transaction`, `debug_traceTransaction`| **40 CU** | 40 CU – 1,000 CU | Deep VM Trace |
| `trace_callMany`, `trace_replayBlockTransactions` | **80 CU** | 3,000 CU | Bulk VM Trace |
| `alchemy_getTokenMetadata` | **10 CU** | 10 CU | Enhanced Data |
| `alchemy_getTokenBalances`, `alchemy_getTokenAllowance` | **20 CU** | 20 CU | Enhanced Data |
| `Prices API` (spot and historical) | **40 CU** | 40 CU | Enhanced Data |
| `alchemy_getAssetTransfers` | **120 CU** | 120 CU | Enhanced Data |
| `alchemy_getTransactionReceipts` | **250 CU** | 250 CU | Enhanced Data |
| `Portfolio API` | **200 – 1,000 CU** | 200 – 1,000 CU | Aggregated Data |
| `alchemy_simulateAssetChanges` | **2,500 CU** | 2,500 CU | Simulation |
| `eth_estimateUserOperationGas` | **500 CU** | 500 CU | Account Abstraction |
| `eth_sendUserOperation` | **1,000 CU** | 1,000 CU | Account Abstraction |
| `alchemy_requestGasAndPaymasterAndData` | **1,250 CU** | 1,250 CU | Account Abstraction |

### Error Billing Rules
- **0 CUs Charged (Free)**:
  - Non-existent or typo method names.
  - HTTP `429 Too Many Requests`.
  - HTTP `403 Forbidden`.
  - Whitelist rejection errors (`JSON-RPC 32600`).
- **Standard CUs Charged**:
  - Invocations of valid methods where parameters are invalid or execution reverts in the EVM (e.g. invalid contract address in `eth_call`).
