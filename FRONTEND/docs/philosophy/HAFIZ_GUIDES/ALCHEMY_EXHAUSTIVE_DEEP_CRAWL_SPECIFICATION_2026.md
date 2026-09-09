# Alchemy Exhaustive Deep-Crawl Technical Specification & API Handbook (2026)
*Verified Live Data directly from [Alchemy Dashboard](https://dashboard.alchemy.com/) & [Official Documentation](https://www.alchemy.com/docs)*

---

## 1. Complete API Families: Parameter Signatures, Types, Payloads & Error Behaviors

### A. Data APIs Suite

#### 1. `alchemy_getTokenBalances`
- **HTTP Method**: POST `/v2/{apiKey}` | **Compute Units**: 20 CU
- **Parameters**:
  - `address` (string, required): 20-byte hex address (`^0x[0-9a-fA-F]{40}$`).
  - `tokenSpec` (enum or array, optional): `"erc20"`, `"NATIVE_TOKEN"`, or array of contract addresses (max 1,500).
  - `options` (object, optional):
    - `pageKey` (string): Pagination cursor.
    - `maxCount` (integer): Max token balances returned per call (default: 100, max: 100).
- **Request Body**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "alchemy_getTokenBalances",
    "params": [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
      {"maxCount": 100}
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "tokenBalances": [
        {
          "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "tokenBalance": "0x0000000000000000000000000000000000000000000000000000000005f5e100",
          "error": null
        }
      ],
      "pageKey": null
    }
  }
  ```
- **Edge Cases & Errors**: Exactly one of `tokenBalance` or `error` is non-null per item. If contract doesn't implement ERC-20 `balanceOf`, `error` returns reason string and `tokenBalance` is null.

#### 2. `alchemy_getTokenMetadata`
- **HTTP Method**: POST `/v2/{apiKey}` | **Compute Units**: 10 CU
- **Parameters**: `contractAddress` (string, required): 20-byte hex contract address.
- **Response Body**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "logo": "https://static.alchemyapi.io/images/assets/3408.png"
    }
  }
  ```

#### 3. `alchemy_getTokenAllowance`
- **HTTP Method**: POST `/v2/{apiKey}` | **Compute Units**: 20 CU
- **Parameters**: Object with `contract` (string, req), `owner` (string, req), and `spender` (string, req).
- **Response Body**: Returns decimal string of allowance (e.g. `"1000000000"`).

#### 4. `alchemy_getAssetTransfers`
- **HTTP Method**: POST `/v2/{apiKey}` | **Compute Units**: 120 CU
- **Parameters**:
  - `fromBlock` (string, optional): Hex block number or tag (`"latest"`, `"earliest"`). Default: `"0x0"`.
  - `toBlock` (string, optional): Hex block number or tag. Default: `"latest"`.
  - `fromAddress` (string, optional): 20-byte sender address.
  - `toAddress` (string, optional): 20-byte recipient address.
  - `contractAddresses` (string[], optional): Array of token/NFT contract addresses.
  - `excludeZeroValue` (boolean, optional): Exclude 0-value transfers. Default: `true`.
  - `maxCount` (integer, optional): Max records per page (up to 1,000). Default: `1000`.
  - `category` (string[], required): `["external", "internal", "erc20", "erc721", "erc1155", "specialnft"]`. *(Note: internal transfers supported on Ethereum Mainnet, Polygon Mainnet, and Base Mainnet)*.
  - `order` (enum, optional): `"asc"` or `"desc"`. Default: `"asc"`.
  - `withMetadata` (boolean, optional): Returns `blockTimestamp`. Default: `false`.
  - `pageKey` (string, optional): Cursor UUID for next page.
- **Response Body**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "transfers": [
        {
          "blockNum": "0x12a4b5",
          "uniqueId": "0x3847...:external",
          "hash": "0x3847...",
          "from": "0xef43...",
          "to": "0x5c43...",
          "value": 1.5,
          "erc721TokenId": null,
          "erc1155Metadata": null,
          "tokenId": null,
          "asset": "ETH",
          "category": "external",
          "rawContract": { "value": "0x14d1120d7b160000", "address": null, "decimal": "0x12" },
          "metadata": { "blockTimestamp": "2026-03-01T12:00:00.000Z" }
        }
      ],
      "pageKey": "00000000-0000-0000-0000-000000000000"
    }
  }
  ```

#### 5. `alchemy_getTransactionReceipts` (Utility API)
- **HTTP Method**: POST `/v2/{apiKey}` | **Compute Units**: 250 CU
- **Parameters**: Object with `blockNumber` (hex string) OR `blockHash` (32-byte hex string).
- **Response Body**: Complete array of all EIP-2718 transaction receipts for the entire block in a single call, eliminating hundreds of individual `eth_getTransactionReceipt` calls.

#### 6. Transaction Simulation APIs
- **`alchemy_simulateAssetChanges`** (2,500 CU):
  - Parameters: `transaction` object (`from`, `to`, `data`, `value`, `gas`, `gasPrice`, `maxFeePerGas`).
  - Response: `changes` array detailing `assetType` (`NATIVE`, `ERC20`, `ERC721`, `ERC1155`), `changeType` (`TRANSFER`, `APPROVE`), `from`, `to`, `rawAmount`, `amount`, `contractAddress`, `decimals`, `symbol`, `logo`, and `gasUsed`.
- **`alchemy_simulateExecution`** (2,500 CU):
  - Parameters: `format` (`"FLAT"` or `"NESTED"`), `transaction` object, `blockTag` (`"latest"`, `"safe"`, `"finalized"`).
  - Response: Full call stack execution tree, internal call traces with decoded inputs/outputs via Etherscan ABI registry, emitted logs, gas consumed per sub-call, and explicit `revertReason`.
- **Bundled Simulations**: `alchemy_simulateAssetChangesBundle` (4,500 CU) & `alchemy_simulateExecutionBundle` (4,500 CU) simulate sequential execution of up to 10 dependent transactions atomically.

---

### B. NFT API v3 Suite (REST)

- **Base URL**: `https://{network}.g.alchemy.com/nft/v3/{apiKey}/`
- **Core Endpoints**:
  1. `getNFTsForOwner`:
     - Query: `owner` (address/ENS, req), `contractAddresses[]` (up to 45), `withMetadata` (bool), `orderBy` (`transferTime`), `excludeFilters[]` (`SPAM`, `AIRDROPS`), `includeFilters[]`, `spamConfidenceLevel` (`VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`), `tokenUriTimeoutInMs`, `pageKey`, `pageSize` (max 100).
     - Response: `ownedNfts` array with normalized metadata, token URI, cached CDN image URLs (`cachedUrl`, `thumbnailUrl`, `pngUrl`), floor prices, and `collection` info.
  2. `getNFTMetadata`:
     - Query: `contractAddress`, `tokenId`, `tokenType` (`ERC721`, `ERC1155`), `refreshCache` (bool), `tokenUriTimeoutInMs`.
  3. `getContractMetadata` & `getContractMetadataBatch`: Returns contract deployer address, deployment block number, collection name, symbol, total supply, OpenSea metadata, and verification status.
  4. `isSpamContract`: Boolean check with classification reasons (fake events, copycat collection).
  5. `getFloorPrice`: Aggregated real-time floor price across OpenSea, LooksRare, and Blur in ETH/USD.

---

### C. Smart WebSockets & Streaming Subscriptions

- **Connection URL**: `wss://{network}.g.alchemy.com/v2/{apiKey}`
- **Subscription Methods**:
  1. `alchemy_pendingTransactions`:
     - Emits pending transactions from mempool matching filters: `fromAddress` (array), `toAddress` (array), `hashesOnly` (bool).
  2. `alchemy_minedTransactions`:
     - Emits transactions as soon as mined. Filter by `addresses` (`from`, `to`), `includeRemoved` (re-org indicator), `hashesOnly`.
  3. `monadNewHeads` & `monadLogs`:
     - Fires speculative execution blocks and logs as soon as a block is Proposed in Monad's parallel consensus, reducing latency by hundreds of milliseconds.
  4. Solana Subscription RPCs:
     - `accountSubscribe`: Lamport and account data changes.
     - `programSubscribe`: All accounts owned by a program.
     - `logsSubscribe`: Log messages filtered by mentions or signatures.
     - `signatureSubscribe`: Finality/confirmation of signature.

---

### D. Solana Yellowstone gRPC, DAS v2 & Photon ZK

#### 1. Yellowstone gRPC Protocol
- **Endpoint**: High-performance HTTP/2 gRPC endpoint.
- **`SubscribeRequest` Proto Structure**:
  ```protobuf
  message SubscribeRequest {
      map<string, SubscribeRequestFilterAccounts> accounts = 1;
      map<string, SubscribeRequestFilterSlots> slots = 2;
      map<string, SubscribeRequestFilterTransactions> transactions = 3;
      map<string, SubscribeRequestFilterTransactions> transactions_status = 10;
      map<string, SubscribeRequestFilterBlocks> blocks = 4;
      map<string, SubscribeRequestFilterBlocksMeta> blocks_meta = 5;
      map<string, SubscribeRequestFilterEntry> entry = 8;
      optional CommitmentLevel commitment = 6;
      repeated SubscribeRequestAccountsDataSlice accounts_data_slice = 7;
      optional SubscribeRequestPing ping = 9;
      optional uint64 from_slot = 11; // Historical Replay cursor
  }
  ```
- **Historical Replay**: Specify `from_slot` to backfill missing slots over gRPC without standard JSON-RPC slot lag.
- **Unary Methods**: `GetBlockHeight`, `GetLatestBlockhash`, `GetSlot`, `GetVersion`, `IsBlockhashValid`, `Ping`, `SubscribeReplayInfo`.

#### 2. Solana DAS API v2
- `getAsset_v2`, `getAssetBatch_v2`: Resolves regular SPL tokens, NFTs, and Bubblegum compressed NFTs (cNFTs) up to 1,000 items in a single request.
- `getAssetProof_v2`, `getAssetProofBatch_v2`: Retrieves cryptographic Merkle inclusion proofs required for onchain cNFT transfers and burns.
- `searchAssets_v2`: Rich query filters (`ownerAddress`, `tokenType`, `grouping`, `creator`).

#### 3. Photon ZK Compression APIs (26 Methods)
- Zero-knowledge state compression indexing: `getCompressedAccount`, `getCompressedAccountProof`, `getCompressedAccountsByOwner`, `getCompressedBalance`, `getValidityProof`, `getValidityProofV2` (1,200 CU).

---

## 2. Account Abstraction (ERC-4337, EIP-7702) & Wallets Architecture

### A. Bundler: EntryPoint v0.6 vs EntryPoint v0.7 / v0.8 Specifications

Alchemy's Bundler (`eth_sendUserOperation`, `eth_estimateUserOperationGas`) dynamically adapts to EntryPoint v0.6 (`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`) and EntryPoint v0.7 / v0.8 (`0x0000000071727De22E5E9d8BAf0edAc6f37da032`):

| Schema Field | EntryPoint v0.6 Structure | EntryPoint v0.7 / v0.8 Structure |
| :--- | :--- | :--- |
| **Account Creation** | `initCode` (combined factory address + calldata) | Split into `factory` (address) and `factoryData` (hex) |
| **Paymaster Fields** | `paymasterAndData` (packed hex containing address, verificationGasLimit, postOpGasLimit, and payload) | Split into `paymaster` (address), `paymasterVerificationGasLimit` (hex), `paymasterPostOpGasLimit` (hex), and `paymasterData` (hex) |
| **Gas Fields** | `callGasLimit`, `verificationGasLimit`, `preVerificationGas`, `maxFeePerGas`, `maxPriorityFeePerGas` | Same names with strict 128-bit integer packing in UserOp struct |
| **EIP-7702 Tuple** | Supported via optional `eip7702Auth` object | Native `eip7702Auth` object (`chainId`, `nonce`, `address`, `yParity`, `r`, `s`) |

- **`eth_estimateUserOperationGas` Response**:
  Returns exact required limits: `preVerificationGas`, `verificationGasLimit`, `callGasLimit`, plus `validAfter` and `validUntil` timestamps.

### B. Gas Manager & Sponsorship APIs
- **`alchemy_requestGasAndPaymasterAndData`** (Recommended, 1,250 CU): Single-call gas sponsorship. Automatically computes gas estimates, checks Gas Manager policy limits, signs with Alchemy's Paymaster key, and returns valid paymaster fields.
- **`pm_getPaymasterStubData`** (250 CU): Returns dummy paymaster signatures for preliminary gas estimation without policy consumption.
- **`pm_getPaymasterData`** (1,000 CU): Returns production signed paymaster data for final UserOp submission.
- **ERC-20 Gas Payments (`alchemy_requestPaymasterTokenQuote`)**:
  Allows users to pay gas in ERC-20 tokens (e.g. USDC). The Gas Manager locks an exchange rate quote, deducts USDC via `transferFrom` in `postOp`, and sponsors the native chain gas on the user's behalf.

### C. Smart Account Implementations
1. **Modular Account V2 (ERC-6900)**:
   - 97,764 gas deployment runtime (over 84% cheaper than ZeroDev Kernel v3 and 195% cheaper than Safe).
   - Audited by ChainLight and Quantstamp.
   - ERC-6900 plug-and-play module architecture supporting WebAuthn/passkey validation, session key plugins, spend limit plugins, and time-lock executors.
2. **Light Account & Multi-Owner Light Account**:
   - `LightAccount` v1.1.0 (EP v0.6) and v2.0.0 (EP v0.7).
   - `MultiOwnerLightAccount`: Multiple ECDSA/SCA owners with quorum recovery.
3. **Session Key Permissions Structure**:
   - `native-token-transfer`: Strict cumulative hex transfer allowance.
   - `erc20-token-transfer`: Scoped to token address and hex allowance limit.
   - `gas-limit`: Maximum gas spend authorized for the session.
   - `contract-access`: Whitelists all functions on a specific contract.
   - `functions-on-contract`: Whitelists specific 4-byte function selectors on a specific contract (`address`, `functions: ["0xddf252ad"]`).
   - `account-functions`: Scoped to smart account administration selectors.
   - `root`: Unrestricted administrative key.

---

## 3. Build with AI: The 2026 Autonomous Agent Stack

### A. Alchemy Agent Wallets
- Dedicated EVM & Solana wallet container designed specifically for autonomous AI agents.
- **Security Boundary**: The AI agent operates through the CLI or SDK using an ephemeral **Session Signer**. The agent **never possesses or reads the wallet's private key**.
- Developers approve sessions, configure lifetime expiries (e.g. 1 hour, 24 hours), set spend limits, and revoke sessions instantly from `https://dashboard.alchemy.com/products/agent-wallet`.

### B. Alchemy CLI (`@alchemy/cli@latest`) Syntax & Flags
Terminal execution engine designed for Claude Code, Cursor, and automated scripts:
- **Authentication**:
  - `alchemy auth`: Interactive browser login.
  - `alchemy auth login --device-code`: Headless OAuth flow for remote servers / docker containers.
- **Onchain Queries & Actions**:
  - `alchemy evm data balance <address|ens>`
  - `alchemy evm data tokens balances <address>`
  - `alchemy evm data nfts <address>`
  - `alchemy evm send --to <addr> --value <eth> --signer session`
  - `alchemy evm swap quote --from <USDC> --to <ETH> --amount <val>`
  - `alchemy evm swap execute --quote <id>`
- **Non-Interactive Agent Mode**:
  `alchemy --json --no-interactive agent-prompt` outputs complete machine-readable CLI schemas and tool manifests for AI system prompts.

### C. x402 Protocol Payments (`alchemy x402`)
The official implementation of the open web3 micro-payment standard:
1. **Flow**:
   - Agent requests API: `alchemy x402 request https://api.service.com/resource --max-payment 0.01`
   - Server returns HTTP `402 Payment Required` with quote headers (price, network, accepted scheme).
   - CLI decodes quote, validates that price ≤ `--max-payment`, signs an EIP-3009 / Permit2 or Circle Gateway batch authorization with the Agent Wallet session, retries the HTTP request, and returns the paid resource.
2. **Flags**:
   - `--estimate`: Decodes quote and eligible payment paths for free without signing or spending.
   - `--max-payment <usdc>`: Enforces strict spend cap. Required for non-interactive payment.
   - `--scheme <gateway|exact|any>`: Selects Circle Gateway batched nanopayments or direct onchain settlement.
3. **Receipt JSON Object**:
   Returns `paid: true`, `scheme`, `gateway`, `network`, `amountUSDC`, `payTo`, `payer`, `transaction`, and `settled: true`.

### D. Alchemy MCP Server (`https://mcp.alchemy.com/mcp`)
Exposes **168 Native Tools** via Model Context Protocol:
- **Admin (8 tools)**: App management, API key rotation, allowlist configuration.
- **RPC (132 tools)**: Direct JSON-RPC execution across 81 blockchains.
- **Data (28 tools)**: Token prices, NFT metadata, portfolio balances, transfers, and simulations.

---

## 4. Complete Dashboard Capabilities & Operational Controls

### A. App Metrics & Health Monitoring
Accessible at `dashboard.alchemy.com/apps/{appId}/metrics`:
- **Real-Time Metrics**: Total requests (24h), average CU/s, success rate %, median latency (ms), invalid request counts, throughput-limited requests (HTTP 429).
- **Protocol Breakdown**: Separate event charts for HTTPS, WebSockets, Webhooks, and gRPC.
- **Method Breakdown**: Real-time traffic share per RPC method.

### B. Interactive Sandbox & Method Composer
- Live JSON-RPC invocation console supporting EVM, Solana, and UTXO.
- Schema auto-completion, parameter validation, and multi-language snippet generation (cURL, JavaScript, Python, Go, Java, C#).
- Native testing interface for EIP-7702 tuples and UserOperation v0.6 / v0.7 structures.

### C. Mempool Visualizer
- Real-time global view of pending transactions across supported mainnets.
- Filter by status, network, gas price threshold, and sender/recipient addresses.

### D. Security Controls (`/security`)
1. **Contract Address Allowlist**:
   - Restricts read operations (`eth_call`, `eth_getCode`, `eth_getLogs`, `eth_getStorageAt`) strictly to approved contract addresses.
2. **Domain / CORS Allowlist**:
   - Validates incoming `Origin` and `Referer` headers to prevent frontend API key theft.
3. **IP Allowlist**:
   - Restricts backend server queries to designated IPv4/IPv6 addresses or CIDR subnets. Calls from unauthorized IPs fail with code `32600` and cost **0 CUs**.
4. **JWT Authentication**:
   - Enforces cryptographic request signing. Developers import RSA (RS256) or ECDSA (ES256) public keys. Requests must include an `Authorization: Bearer <jwt>` header signed by the corresponding private key.

### E. Alerts Engine (`/settings/alerts`)
- Custom webhook and email notifications for:
  - Daily or hourly CU consumption spikes.
  - High error rates (percentage of 4xx/5xx responses over 5m/15m/1h windows).
  - Webhook delivery failures.
  - Gas Manager balance thresholds.

### F. Gas Manager Policies (`/gas-sponsorship`)
- Configures paymaster sponsorship rules:
  - Monthly budget limit and daily spend cap in USD.
  - Max spend per UserOperation.
  - Rate limiting per sender wallet address.
  - Whitelist of destination smart contract addresses.
  - Fee caps (maximum base fee and priority fee allowed before rejecting sponsorship).
