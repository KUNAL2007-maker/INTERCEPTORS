# Alchemy Deep Crawl Technical Specification & Exhaustive API Reference (2026)
*Verified Live Data from [dashboard.alchemy.com](https://dashboard.alchemy.com/) and [alchemy.com/docs](https://www.alchemy.com/docs)*

---

## 1. Exhaustive Specialized API Method Catalogs

### A. Ethereum Beacon Chain HTTP API (48 Standard Endpoints — 20 CU each)
1. `/eth/v1/beacon/blinded_blocks/{block_id}`
2. `/eth/v1/beacon/blinded_blocks/{slot}`
3. `/eth/v1/beacon/blob_sidecars/{block_id}`
4. `/eth/v1/beacon/blobs/{block_id}`
5. `/eth/v1/beacon/blocks/{block_id}/root`
6. `/eth/v1/beacon/genesis`
7. `/eth/v1/beacon/headers`
8. `/eth/v1/beacon/headers/{block_id}`
9. `/eth/v1/beacon/pool/voluntary_exits`
10. `/eth/v1/beacon/rewards/attestations/{epoch}`
11. `/eth/v1/beacon/rewards/blocks/{block_id}`
12. `/eth/v1/beacon/rewards/sync_committee/{block_id}`
13. `/eth/v1/beacon/states/{state_id}/committees`
14. `/eth/v1/beacon/states/{state_id}/finality_checkpoints`
15. `/eth/v1/beacon/states/{state_id}/fork`
16. `/eth/v1/beacon/states/{state_id}/pending_consolidations`
17. `/eth/v1/beacon/states/{state_id}/pending_deposits`
18. `/eth/v1/beacon/states/{state_id}/pending_partial_withdrawals`
19. `/eth/v1/beacon/states/{state_id}/proposer_lookahead`
20. `/eth/v1/beacon/states/{state_id}/randao`
21. `/eth/v1/beacon/states/{state_id}/root`
22. `/eth/v1/beacon/states/{state_id}/sync_committees`
23. `/eth/v1/beacon/states/{state_id}/validator_balances`
24. `/eth/v1/beacon/states/{state_id}/validator_identities`
25. `/eth/v1/beacon/states/{state_id}/validators`
26. `/eth/v1/beacon/states/{state_id}/validators/{validator_id}`
27. `/eth/v1/config/deposit_contract`
28. `/eth/v1/config/fork_schedule`
29. `/eth/v1/config/spec`
30. `/eth/v1/debug/beacon/data_column_sidecars/{block_id}`
31. `/eth/v1/debug/fork_choice`
32. `/eth/v1/node/identity`
33. `/eth/v1/node/peer_count`
34. `/eth/v1/node/peers`
35. `/eth/v1/node/syncing`
36. `/eth/v1/node/version`
37. `/eth/v1/validator/attestation_data`
38. `/eth/v1/validator/contribution_and_proofs`
39. `/eth/v1/validator/duties/attester/{epoch}`
40. `/eth/v1/validator/duties/proposer/{epoch}`
41. `/eth/v1/validator/duties/sync/{epoch}`
42. `/eth/v1/validator/sync_committee_contribution`
43. `/eth/v2/beacon/blocks/{block_id}`
44. `/eth/v2/beacon/blocks/{block_id}/attestations`
45. `/eth/v2/beacon/pool/attestations`
46. `/eth/v2/debug/beacon/states/{state_id}`
47. `/eth/v2/validator/aggregate_attestation`
48. `/eth/v3/validator/blocks/{slot}`

---

### B. Trace & Debug APIs

#### 1. OpenEthereum Trace API (9 Methods)
- `trace_block` (20 CU)
- `trace_get` (20 CU)
- `trace_call` (40 CU)
- `trace_filter` (40 CU)
- `trace_rawTransaction` (40 CU)
- `trace_transaction` (40 CU)
- `trace_callMany` (80 CU, Peak Throughput: 3,000 CU)
- `trace_replayBlockTransactions` (80 CU, Peak Throughput: 3,000 CU)
- `trace_replayTransaction` (80 CU, Peak Throughput: 3,000 CU)

#### 2. Arbitrum Nitro Trace API (8 Methods)
- `arbtrace_block` (20 CU, Throughput: 1,000 CU)
- `arbtrace_get` (20 CU, Throughput: 1,000 CU)
- `arbtrace_call` (40 CU, Throughput: 1,000 CU)
- `arbtrace_filter` (40 CU, Throughput: 1,000 CU)
- `arbtrace_transaction` (40 CU)
- `arbtrace_callMany` (80 CU, Throughput: 1,000 CU)
- `arbtrace_replayBlockTransactions` (80 CU, Throughput: 3,000 CU)
- `arbtrace_replayTransaction` (80 CU, Throughput: 3,000 CU)

#### 3. Geth Debug API (16 Methods — 40 CU each, Throughput: 1,000 CU)
- `debug_dbAncient`
- `debug_dbAncients`
- `debug_dbGet`
- `debug_executionWitness`
- `debug_executionWitnessByHash`
- `debug_getBadBlocks`
- `debug_getRawBlock`
- `debug_getRawHeader`
- `debug_getRawReceipts`
- `debug_getTrieFlushInterval`
- `debug_storageRangeAt`
- `debug_traceBlockByHash`
- `debug_traceBlockByNumber`
- `debug_traceCall`
- `debug_traceCallMany`
- `debug_traceTransaction`

---

### C. Citrea Specific Methods (18 Methods — 20 CU each)
Bitcoin ZK-Rollup execution primitives:
1. `citrea_getL2StatusHeightsByL1Height`
2. `citrea_getLastCommittedL2Height`
3. `citrea_getLastProvenL2Height`
4. `citrea_sendRawDepositTransaction`
5. `citrea_syncStatus`
6. `eth_estimateDiffSize`
7. `ledger_getHeadL2Block`
8. `ledger_getHeadL2BlockHeight`
9. `ledger_getL2BlockByHash`
10. `ledger_getL2BlockByNumber`
11. `ledger_getL2BlockRange`
12. `ledger_getL2GenesisStateRoot`
13. `ledger_getLastScannedL1Height`
14. `ledger_getLastVerifiedBatchProof`
15. `ledger_getSequencerCommitmentByIndex`
16. `ledger_getSequencerCommitmentsOnSlotByHash`
17. `ledger_getSequencerCommitmentsOnSlotByNumber`
18. `ledger_getVerifiedBatchProofsBySlotHeight`

---

### D. Avalanche P-Chain Methods (26 Methods — 20 CU each)
Platform Chain consensus, subnet, and staking methods:
1. `platform.getAllValidatorsAt`
2. `platform.getBalance`
3. `platform.getBlockchains`
4. `platform.getBlockchainStatus`
5. `platform.getCurrentSupply`
6. `platform.getCurrentValidators`
7. `platform.getFeeConfig`
8. `platform.getFeeState`
9. `platform.getHeight`
10. `platform.getMinStake`
11. `platform.getRewardUTXOs`
12. `platform.getStake`
13. `platform.getStakingAssetID`
14. `platform.getSubnets`
15. `platform.getTimestamp`
16. `platform.getTotalStake`
17. `platform.getTx`
18. `platform.getTxStatus`
19. `platform.getUTXOs`
20. `platform.getValidatorFeeConfig`
21. `platform.getValidatorFeeState`
22. `platform.getValidatorsAt`
23. `platform.issueTx`
24. `platform.sampleValidators`
25. `platform.validatedBy`
26. `platform.validates`

---

### E. Solana Yellowstone gRPC, DAS v2 & Photon ZK

#### 1. Yellowstone gRPC Subscriptions & Protocol Structure
- **Streaming Pricing**: \$75 / 1 TB binary data streamed.
- **Subscription Topics (`SubscribeRequest`)**:
  - `accounts`: Filtered by account pubkeys, owners, and data slices.
  - `slots`: Slot progression, processed, confirmed, finalized.
  - `transactions`: High-speed transaction streaming filtered by vote/non-vote, account inclusion, and error status.
  - `transactions_status`: Real-time status notifications for signatures.
  - `blocks`: Full block streams with transactions, rewards, and block time.
  - `blocks_meta`: Lightweight block headers and metadata.
  - `entry`: Low-level Proof-of-History (PoH) entries between transactions and blocks.
- **Unary Methods (10 CU each)**:
  - `geyser.Geyser/GetBlockHeight`
  - `geyser.Geyser/GetLatestBlockhash`
  - `geyser.Geyser/GetSlot`
  - `geyser.Geyser/GetVersion`
  - `geyser.Geyser/IsBlockhashValid`
  - `geyser.Geyser/Ping`
  - `geyser.Geyser/SubscribeReplayInfo`

#### 2. Solana DAS API v2 (12 Methods)
- Standard Queries (160 CU, Throughput: 200 CU):
  - `getAsset_v2`, `getAssetProof_v2`, `getNftEditions_v2`, `getSignaturesForAsset_v2`, `getTokenAccounts_v2`
- Batch & Filter Queries (480 CU, Throughput: 200 CU):
  - `getAssetBatch_v2`, `getAssetProofBatch_v2`, `getAssetsByAuthority_v2`, `getAssetsByCreator_v2`, `getAssetsByGroup_v2`, `getAssetsByOwner_v2`, `searchAssets_v2`

#### 3. Solana Photon APIs (ZK Compression — 26 Methods)
- Standard queries (120 CU, Throughput: 100 CU): `getCompressedAccount`, `getCompressedAccountProof`, `getCompressedAccountsByOwner`, `getCompressedBalance`, `getCompressedBalanceByOwner`, `getCompressedMintTokenHolders`, `getCompressedTokenAccountBalance`, `getCompressedTokenAccountsByDelegate`, `getCompressedTokenAccountsByOwner`, `getCompressedTokenBalancesByOwner`, `getCompressedTokenBalancesByOwnerV2`, `getCompressionSignaturesForAccount`, `getCompressionSignaturesForAddress`, `getCompressionSignaturesForOwner`, `getCompressionSignaturesForTokenOwner`, `getIndexerHealth`, `getIndexerSlot`, `getLatestCompressionSignatures`, `getLatestNonVotingSignatures`, `getMultipleCompressedAccountProofs`, `getMultipleCompressedAccounts`, `getMultipleNewAddressProofs`, `getMultipleNewAddressProofsV2`, `getTransactionWithCompressionInfo`.
- Cryptographic validity proofs (1200 CU, Throughput: 500 CU): `getValidityProof`, `getValidityProofV2`.

---

### F. Hyperliquid HyperCore Architecture
- **HyperEVM JSON-RPC (20 CU each)**: `eth_bigBlockGasPrice`, `eth_getBlockReceiptsWithSystemTx`, `eth_getSystemTxsByBlockHash`, `eth_getSystemTxsByBlockNumber`, `eth_usingBigBlocks`.
- **HyperCore gRPC**: `StreamBlocks` (block-level streaming), validator peering.
- **HyperCore REST APIs**: `get-info`, `get-user-fills`, `get-user-fills-by-time`, `get-clearinghouse-state`, `get-historical-orders`, `get-portfolio-state`, `get-extra-agents`, `get-l-2-book-diff-snapshot`, `dex-abstraction-state`, `liquidatable-accounts`, `spot-clearinghouse-state`, `subaccounts`, `web-data-2`, `frontend-open-orders`, `open-orders`, `user-funding`, `non-funding-ledger-updates`.
- **HyperCore WebSockets**: Streams for `userNonFundingLedgerUpdates`, `allUserNonFundingLedgerUpdates`, `funding rates`, `l2Book`, `l2BookDiff`, `bbo`, `l4BookUpdates`, `tpslUpdates`, `userFills`.

---

### G. Bitcoin & UTXO Multi-Layer Stack

#### 1. Standard Bitcoin JSON-RPC (37 Methods — 10 CU each)
`createrawtransaction`, `decoderawtransaction`, `decodescript`, `estimatesmartfee`, `getbestblockhash`, `getblock`, `getblockchaininfo`, `getblockcount`, `getblockfilter`, `getblockhash`, `getblockheader`, `getblockstats`, `getblocktemplate`, `getchaintips`, `getchaintxstats`, `getconnectioncount`, `getdifficulty`, `getindexinfo`, `getmemoryinfo`, `getmempoolancestors`, `getmempooldescendants`, `getmempoolentry`, `getmempoolinfo`, `getnetworkhashps`, `getnetworkinfo`, `getrawmempool`, `getrawtransaction`, `gettxout`, `gettxoutproof`, `gettxoutsetinfo`, `sendrawtransaction`, `submitblock`, `submitheader`, `submitpackage`, `testmempoolaccept`, `validateaddress`, `verifymessage`.

#### 2. Bitcoin Indexer REST API (35 Endpoints — 20 CU each)
`/address-prefix/{prefix}`, `/address/{address}`, `/address/{address}/txs`, `/address/{address}/txs/chain/{last_seen_txid}`, `/address/{address}/txs/mempool`, `/address/{address}/utxo`, `/block-height/{height}`, `/block/{hash}`, `/block/{hash}/header`, `/block/{hash}/raw`, `/block/{hash}/status`, `/block/{hash}/txid/{index}`, `/block/{hash}/txids`, `/block/{hash}/txs/{start_index}`, `/blocks/{start_height}`, `/blocks/tip/hash`, `/blocks/tip/height`, `/fee-estimates`, `/mempool`, `/mempool/recent`, `/mempool/txids`, `/scripthash/{hash}`, `/scripthash/{hash}/txs`, `/scripthash/{hash}/txs/chain/{last_seen_txid}`, `/scripthash/{hash}/txs/mempool`, `/scripthash/{hash}/utxo`, `/tx/{txid}`, `/tx/{txid}/hex`, `/tx/{txid}/merkle-proof`, `/tx/{txid}/merkleblock-proof`, `/tx/{txid}/outspend/{vout}`, `/tx/{txid}/outspends`, `/tx/{txid}/raw`, `/tx/{txid}/status`, `/txs/package`.

#### 3. UTXO REST API (13 Endpoints — 20 CU each)
Applicable across Bitcoin, Dogecoin, Bitcoin Cash, and Litecoin:  
`/api/v2/address/{address}`, `/api/v2/balance/{address}`, `/api/v2/balancehistory/{address}`, `/api/v2/block-index/{block_height}`, `/api/v2/block/{block}`, `/api/v2/sendtx`, `/api/v2/sendtx/{hex}`, `/api/v2/tickers`, `/api/v2/tickers-list`, `/api/v2/tx-specific/{txid}`, `/api/v2/tx/{txid}`, `/api/v2/utxo/{descriptor}`, `/api/v2/xpub/{xpub}`.

---

### H. Tron (TVM) & Sui (Move)
- **Tron**: 89 Standard HTTP methods (20 CU), 30 Solidity HTTP methods (20 CU), and 194 `tron-grpc` methods (20 CU each).
- **Sui**: 51 Standard JSON-RPC methods (20 CU), 21 Sui gRPC Unary methods (20 CU), and Sui gRPC binary streaming (\$75 / 1 TB).

---

## 2. Comprehensive Compute Unit (CU) Weight Table & Charging Logic

### Core EVM JSON-RPC:
- **0 CUs**: `eth_chainId`, `eth_protocolVersion`, `eth_syncing`, `net_listening`, `net_peerCount`, `net_version` (5 Throughput CU).
- **10 CUs**: `eth_blockNumber`, `eth_accounts`, `eth_baseFee`, `eth_blobBaseFee`, `eth_createAccessList`, `eth_feeHistory`, `eth_maxPriorityFeePerGas`, `eth_subscribe`, `eth_unsubscribe`, `eth_getAssetBalance`, `eth_getChainConfig`.
- **20 CUs**: `eth_getBalance`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_getCode`, `eth_getStorageAt`, `eth_estimateGas`, `eth_gasPrice`, `eth_getTransactionCount`, `eth_getProof`, `eth_getBlockReceipts` (500 Throughput CU), `eth_getTransactionReceiptsByBlock` (1,500 Throughput CU).
- **26 CUs**: `eth_call`.
- **40 CUs**: `eth_sendRawTransaction` (50 Throughput CU), `eth_sendRawTransactionSync` (125 Throughput CU), `eth_simulateV1`, `realtime_sendRawTransaction`, `eth_callBundle`.
- **60 CUs**: `eth_getLogs`, `eth_getFilterLogs`, `eth_getAccountInfo`.
- **500 CUs**: `txpool_content`.

### Data APIs:
- **Token API**: `alchemy_getTokenMetadata` (10 CU), `alchemy_getTokenAllowance` (20 CU), `alchemy_getTokenBalances` (20 CU).
- **Prices API**: `tokens/by-address`, `tokens/by-symbol`, `tokens/historical` (40 CU each).
- **Transfers API**: `alchemy_getAssetTransfers` (120 CU).
- **Utility API**: `alchemy_getTransactionReceipts` (250 CU).
- **Portfolio API**: `assets/tokens/balances/by-address` (200 CU), `assets/tokens/by-address` (360 CU), `assets/nfts/contracts/by-address` (600 CU), `assets/nfts/by-address` (1,000 CU), `transactions/history/by-address` (1,000 CU).
- **Transaction Simulation**: `alchemy_simulateAssetChanges` (2,500 CU), `alchemy_simulateExecution` (2,500 CU), `alchemy_simulateAssetChangesBundle` (4,500 CU), `alchemy_simulateExecutionBundle` (4,500 CU).
- **Bundler & Paymaster**: `eth_estimateUserOperationGas` (500 CU), `eth_sendUserOperation` (1,000 CU), `pm_getPaymasterData` (1,000 CU), `alchemy_requestGasAndPaymasterAndData` (1,250 CU), `alchemy_simulateUserOperationAssetChanges` (2,500 CU).

### Error Code CU Charging Policy:
- **0 CUs Charged (Free)**:
  - Unrecognized or non-existent method calls.
  - HTTP `429 Too Many Requests`.
  - HTTP `403 Forbidden`.
  - JSON-RPC error `32600: IP Address not on whitelist`.
  - JSON-RPC error `32600: App is inactive`.
  - JSON-RPC error `32600: Unspecified origin not on whitelist`.
- **Standard Endpoint CUs Charged**: Any `4xx` or `5xx` error resulting from valid method invocation with invalid parameters (e.g. invalid target contract on `eth_call`).

---

## 3. Developer Tooling Catalog: SDKs, CLI, & MCP Server

### A. SDKs & Libraries:
1. **`alchemy-sdk` (TypeScript/JavaScript)**: Official multi-chain wrapper with automatic retries, WebSocket reconnection lifecycle management, Token, Transfers, and NFT APIs.
2. **Account Abstraction SDK Suite**:
   - `@alchemy/aa-core`: Low-level ERC-4337 smart account and bundler client.
   - `@alchemy/aa-alchemy`: Plugins connecting smart accounts to Alchemy Bundler & Gas Manager.
   - `@alchemy/aa-alchemy/react`: React hooks and Wagmi-compatible state management for smart accounts and session keys.
3. **Python SDK**: Web3.py middleware and HTTP client for Alchemy Enhanced APIs.

### B. Alchemy CLI (`@alchemy/cli`):
Terminal client built for developers and autonomous AI agents (Claude Code, Cursor, Codex).
- `alchemy auth`: Browser OAuth or headless `--device-code` flow for remote AI servers.
- `alchemy app list | select | create`: Manage apps and switch active keys.
- `alchemy evm data balance <address>`: Native balance check (supports ENS).
- `alchemy evm data tokens balances <address>`: Complete ERC-20 portfolio query.
- `alchemy evm data nfts <address>`: NFT ownership list.
- `alchemy evm data price symbol <SYM>`: Spot price inquiry.
- `alchemy evm tx <hash>`: Transaction receipt and payload inspection.
- `alchemy evm block <number|latest>`: Block header and transaction count.
- `alchemy evm rpc <method> '<params>'`: Direct raw JSON-RPC invocations.
- `alchemy evm contract read | call`: Smart contract reads and writes.
- `alchemy evm send`: Native currency transfer execution.
- `alchemy evm swap quote | execute`: Built-in DEX swap quotes and execution.
- `alchemy evm approve`: ERC-20 token allowance approvals.
- `alchemy solana network list | account | tokens`: Solana CLI commands.
- `alchemy wallet connect | disconnect | status`: Agent wallet session management.
- `alchemy x402`: Autonomous payment handling (decode quotes, pay USDC, generate receipts).
- `alchemy webhook list | create | update | delete`: Full terminal webhook management.

### C. Alchemy MCP Server (`https://mcp.alchemy.com/mcp`):
- Connects directly to AI agents via **Model Context Protocol (MCP)** using OAuth authentication.
- Exposes **168 Native Tools** across 100+ chains:
  - **Admin Tools (8 tools)**: App creation, API key rotation, allowlist management.
  - **RPC Onchain JSON-RPC (132 tools)**: Direct execution across EVM, Solana, and UTXO.
  - **Data REST APIs (28 tools)**: Portfolio, token metadata, historical transfers, floor prices, and simulations.

---

## 4. Granular Dashboard Configuration Details

### A. Security Allowlists:
1. **Contract Address Allowlist**:
   - Strictly limits read operations to specified contract addresses.
   - Restricts four specific read methods: `eth_call`, `eth_getCode`, `eth_getLogs`, `eth_getStorageAt`.
2. **Domain / CORS Allowlist**:
   - Restricts API key usage to specific frontends by validating `Origin` and `Referer` headers. Wildcards supported (e.g. `*.mydapp.com`).
3. **IP Allowlist**:
   - Restricts backend server requests to specific IPv4 / IPv6 addresses or CIDR blocks (e.g. `192.168.1.0/24`). Requests from non-whitelisted IPs receive error `32600` and consume **0 CUs**.
4. **JWT Authentication**:
   - Enables server-to-server request signing. Developers import RSA (`RS256`) or ECDSA (`ES256`) public keys in the dashboard; requests without a valid signed JWT header are rejected.

### B. Real-Time Alerts:
- **CU Spikes**: Triggered when hourly or daily compute unit consumption exceeds a custom threshold (e.g. 80% of monthly quota).
- **Error Rates**: Alerts triggered when 4xx or 5xx responses exceed a set percentage over a rolling window.
- **Webhook Delivery Failures**: Instant notifications if destination webhooks fail consecutive delivery attempts.
- **Gas Manager Balances**: Low-balance warnings when Paymaster deposits drop below a designated dollar amount.

### C. Webhooks & GraphQL Filters:
- **Types**: Address Activity, NFT Activity, Stellar Address Activity, Custom GraphQL Webhooks.
- **GraphQL Schema Filters**:
  - `BlockFilterCriteria`: Filter by block hash, block number range.
  - `BlockTransactionsFilterCriteria`: Filter by `from` addresses, `to` addresses, transaction status, gas used.
  - `BlockLogsFilterCriteria`: Filter by emitter address and 4 event topics (`topics: [topic0, topic1, topic2, topic3]`).
  - `BlockCallTracesFilterCriteria`: Filter internal smart contract debug traces (`callTracerTraces`) by internal `from` and `to` parties.
- **Delivery & Retry Policy**:
  - Dispatched with cryptographic signature headers (`x-alchemy-signature`) using HMAC-SHA256.
  - Delivery failures (non-2xx responses or timeouts) trigger automatic retries using exponential backoff with jitter over a **24-hour retry window**.

### D. Gas Manager & Paymaster Policy Configuration:
- **Spending Limits**: Configure overall monthly budget, daily spend limits, and max spend per UserOperation (in USD).
- **Sender Rules**: Limit how many sponsored transactions an individual wallet address can submit per hour/day.
- **Contract Allowlists**: Enforce that paymaster sponsorship is only granted if the UserOperation executes calls against specific whitelisted smart contracts.
- **Gas Price Caps**: Protect against gas spikes by defining maximum allowed base fee and priority fee values.
- **ERC-20 Gas Payment**: Configure smart accounts to pay gas using ERC-20 tokens (e.g. USDC) with automated exchange rate quotes (`alchemy_requestPaymasterTokenQuote`).
