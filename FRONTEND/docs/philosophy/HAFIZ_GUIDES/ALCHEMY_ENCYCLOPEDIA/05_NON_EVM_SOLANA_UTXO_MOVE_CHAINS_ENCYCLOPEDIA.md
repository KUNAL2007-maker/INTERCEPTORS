# VOLUME 5: NON-EVM, SOLANA, UTXO & MOVE CHAINS ENCYCLOPEDIA
*Comprehensive Architecture & Complete API Reference across Non-EVM Environments (2026 Live Audit)*

---

## 1. Solana (SVM) High-Performance Architecture

Solana departs fundamentally from EVM execution: transactions execute concurrently across independent account memory slots using the **Sealevel** runtime, with state stored in memory-mapped accounts rather than Merkle Patricia Tries.

### 1.1 Yellowstone gRPC Streaming Protocol
Standard Solana JSON-RPC and WebSockets experience 200–500ms latency lags due to JSON serialization overhead. Alchemy provides direct **Yellowstone gRPC** access:
- **Transport**: Binary Protocol Buffers over HTTP/2 streaming directly from validator **Geyser** plugins.
- **Pricing**: $75 / 1 TB binary data streamed.
- **`SubscribeRequest` Protos**:
  - `accounts`: Filtered by account public key, owner program ID, or data slices (e.g. tracking specific SPL token vaults).
  - `slots`: Real-time slot progression (`processed`, `confirmed`, `finalized`).
  - `transactions`: High-speed transaction feed with vote/non-vote filters and account inclusion rules.
  - `blocks` & `blocks_meta`: Lightweight block headers or full block streams including rewards and block times.
  - `entry`: Proof-of-History (PoH) tick and entry streams.
- **Historical Replay**: The `from_slot` cursor allows instant backfilling of missed slots without issuing hundreds of `getBlock` JSON-RPC calls.

### 1.2 Solana DAS API v2 (Digital Asset Standard)
Indexes standard SPL tokens, legacy Metaplex NFTs, and Bubblegum compressed NFTs (cNFTs):
- `getAsset_v2` (160 CU): Resolves complete asset metadata by asset ID.
- `getAssetBatch_v2` (480 CU): Resolves up to 1,000 assets concurrently.
- `getAssetProof_v2` (160 CU): Retrieves concurrent Merkle tree inclusion proofs required for onchain cNFT transfers and burns.
- `getAssetsByOwner_v2` (480 CU): Paginated listing of all assets owned by a wallet.
- `searchAssets_v2` (480 CU): Multi-parameter search filtered by creator, collection grouping, or token type.

### 1.3 Photon ZK Compression APIs (26 Methods)
Light Protocol ZK Compression stores compressed accounts in onchain state trees, slashing Solana state rent by up to 99.9%:
- `getCompressedAccount`, `getCompressedBalance`, `getCompressedTokenAccountsByOwner`.
- `getValidityProof` & `getValidityProofV2` (1,200 CU): Generates cryptographic zero-knowledge validity proofs for updating compressed state onchain.

---

## 2. Hyperliquid HyperCore Architecture

Hyperliquid combines a custom L1 consensus engine (HyperCore) with a native EVM execution layer (HyperEVM).

### 2.1 HyperEVM JSON-RPC (20 CU each)
- `eth_bigBlockGasPrice`: Queries gas pricing for Hyperliquid's high-capacity big blocks.
- `eth_getBlockReceiptsWithSystemTx`: Returns transaction receipts including internal consensus system transactions.
- `eth_getSystemTxsByBlockHash` & `eth_getSystemTxsByBlockNumber`: Inspects validator consensus transactions.
- `eth_usingBigBlocks`: Checks if the network is currently executing in big-block mode.

### 2.2 HyperCore REST & gRPC APIs
- `get-info`: Core exchange parameters and asset indices.
- `get-clearinghouse-state` & `spot-clearinghouse-state`: Margin balances, collateral, open positions, and account leverage.
- `get-l-2-book-diff-snapshot`: Sub-millisecond snapshot of L2 orderbook price levels and bids/asks.
- `get-user-fills` & `get-user-fills-by-time`: Historical trade execution fills per wallet address.
- `liquidatable-accounts`: Real-time stream of accounts approaching maintenance margin liquidation thresholds.

---

## 3. Bitcoin & UTXO Multi-Layer Stack

Applicable to **Bitcoin (Mainnet, Testnet, Signet, Testnet4), Dogecoin, Bitcoin Cash, and Litecoin**.

### 3.1 Standard Bitcoin JSON-RPC (37 Methods — 10 CU each)
Provides standard Bitcoin Core node methods:
`getblockchaininfo`, `getbestblockhash`, `getblock`, `getblockhash`, `getblockheader`, `getrawtransaction`, `decoderawtransaction`, `createrawtransaction`, `sendrawtransaction`, `estimatesmartfee`, `getmempoolinfo`, `getrawmempool`, `testmempoolaccept`, `validateaddress`, `verifymessage`.

### 3.2 Bitcoin Indexer REST API (35 Endpoints — 20 CU each)
Enables instant wallet address indexing without scanning the entire UTXO set:
- `/address/{address}/utxo`: Returns all unspent transaction outputs (UTXOs) for an address.
- `/address/{address}/txs`: Paginated transaction history.
- `/block/{hash}/txs`: Lists all transactions inside a block.
- `/fee-estimates`: Recommended fee rates (sat/vB) for high, medium, and low priority.
- `/tx/{txid}/outspends`: Checks which outputs of a transaction have been spent by subsequent transactions.

### 3.3 UTXO REST API (13 Endpoints — 20 CU each)
Low-overhead endpoints for Bitcoin, Doge, BCH, and Litecoin:
- `/api/v2/address/{address}`: Unified balance and transaction count.
- `/api/v2/utxo/{descriptor}`: UTXO discovery via output descriptors.
- `/api/v2/xpub/{xpub}`: Complete balance and derived address discovery for hierarchical deterministic (HD) master public keys.

---

## 4. Move, TVM & Other Specialized L1s

### 4.1 Sui (Move L1)
- **Standard JSON-RPC (51 Methods — 20 CU)**: Object-centric state model (`sui_getObject`, `sui_getNormalizedMoveFunction`, `sui_executeTransactionBlock`).
- **Sui gRPC (21 Methods — 20 CU)**: Unary method invocations and high-speed binary state streaming ($75 / 1 TB).

### 4.2 Aptos (Move L1)
- **Standard REST API (28 Methods — 20 CU)**: Account resources, ledger info, block events, and transaction simulations.
- **Aptos gRPC**: Stream transactions directly from Aptos indexer nodes.

### 4.3 Tron (TVM)
- **89 Standard HTTP Methods (20 CU)**: `wallet/getaccount`, `wallet/createtransaction`, `wallet/broadcasttransaction`.
- **194 `tron-grpc` Methods (20 CU)**: High-speed binary communication with Tron nodes.
- **30 Solidity HTTP Methods (20 CU)**: Querying historical and finalized block states.

### 4.4 Citrea (Bitcoin ZK-Rollup — 18 Methods — 20 CU each)
Bitcoin-native execution rollup methods:
`citrea_getL2StatusHeightsByL1Height`, `citrea_getLastCommittedL2Height`, `citrea_getLastProvenL2Height`, `citrea_sendRawDepositTransaction`, `ledger_getHeadL2Block`, `ledger_getL2BlockRange`, `ledger_getLastVerifiedBatchProof`.

### 4.5 Avalanche P-Chain (Platform API — 26 Methods — 20 CU each)
Coordinates validators, subnets, and staking:
`platform.getAllValidatorsAt`, `platform.getCurrentSupply`, `platform.getCurrentValidators`, `platform.getRewardUTXOs`, `platform.getStake`, `platform.getSubnets`, `platform.sampleValidators`, `platform.validates`.
