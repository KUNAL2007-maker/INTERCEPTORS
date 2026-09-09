# VOLUME 6: DATA APIS & ENHANCED SERVICES ENCYCLOPEDIA
*Deep Technical Reference for Alchemy's Indexed Data Engines (2026 Live Audit)*

---

## 1. The Need for Enhanced Data Indexing

Raw blockchain nodes only store raw transaction bytecodes and account storage roots. Answering simple user questions—such as "What tokens does this wallet hold?", "What is the historical transfer history of this address?", or "What is the floor price of this NFT collection?"—requires scanning millions of historic blocks and executing hundreds of thousands of contract queries.

Alchemy’s **Enhanced Data APIs** run continuous ingestion and indexing pipelines that pre-compute and normalize onchain data across EVM and non-EVM chains, serving complex multi-hop queries in sub-50ms.

---

## 2. Token API Suite

### `alchemy_getTokenBalances` (20 CU)
- **Description**: Returns all ERC-20 token balances for a given wallet address in one network request.
- **Parameters**:
  - `address` (DATA, 20 Bytes, required): Wallet address.
  - `tokenSpec` (ARRAY|ENUM, optional): Specific contract addresses or `"erc20"`, `"NATIVE_TOKEN"`.
  - `options` (OBJECT, optional): `pageKey` (pagination cursor), `maxCount` (up to 100).
- **Return Object**:
  Array of `tokenBalances` containing `contractAddress`, hex `tokenBalance`, and `error` (non-null if contract call reverted).

### `alchemy_getTokenMetadata` (10 CU)
- **Description**: Returns token name, symbol, decimals, and high-resolution logo URI.
- **Parameters**: `contractAddress` (DATA, 20 Bytes).
- **Return Object**: `{ name: "USD Coin", symbol: "USDC", decimals: 6, logo: "https://..." }`.

### `alchemy_getTokenAllowance` (20 CU)
- **Description**: Checks current approved spending limit granted to a third-party spender.
- **Parameters**: `{ contract: "0x...", owner: "0x...", spender: "0x..." }`.
- **Return Object**: Decimal string of allowance.

---

## 3. Prices API

- **Base URL**: `https://api.g.alchemy.com/prices/v1/{apiKey}/`
- **Compute Units**: 40 CU per request
- **Endpoints**:
  - `GET /tokens/by-address?network=eth-mainnet&address=0x...`: Spot price in USD by contract address.
  - `GET /tokens/by-symbol?symbols=ETH,USDC,SOL`: Spot prices by symbol ticker.
  - `GET /tokens/historical`: Historical pricing charts with configurable time intervals (1h, 1d, 1w).

---

## 4. Transfers API (`alchemy_getAssetTransfers`)

- **Compute Units**: 120 CU per call
- **Description**: Returns complete paginated transaction and transfer history for any address across all asset categories.
- **Parameters**:
  - `fromBlock` / `toBlock`: Block range (default: `"0x0"` to `"latest"`).
  - `fromAddress` / `toAddress`: Filter by sender or recipient.
  - `contractAddresses`: Filter by specific token or NFT contracts.
  - `category`: `["external", "internal", "erc20", "erc721", "erc1155", "specialnft"]`. *(Internal transfers available on Ethereum, Polygon, and Base)*.
  - `order`: `"asc"` or `"desc"`.
  - `withMetadata`: Includes `blockTimestamp`.
  - `maxCount`: Max items per page (up to 1,000).
  - `pageKey`: Pagination UUID.
- **Return Schema**:
  ```json
  {
    "transfers": [
      {
        "blockNum": "0x12a4b5",
        "uniqueId": "0x3847...:external",
        "hash": "0x3847...",
        "from": "0xef43...",
        "to": "0x5c43...",
        "value": 1.5,
        "asset": "ETH",
        "category": "external",
        "rawContract": { "value": "0x14d1120d7b160000", "address": null, "decimal": "0x12" },
        "metadata": { "blockTimestamp": "2026-03-01T12:00:00.000Z" }
      }
    ],
    "pageKey": "00000000-0000-0000-0000-000000000000"
  }
  ```

---

## 5. Portfolio API

- **Base URL**: `https://api.g.alchemy.com/portfolio/v1/{apiKey}/`
- **Compute Units**: 200 – 1,000 CU
- **Description**: Unified wallet holding overview aggregating native currency, all ERC-20 tokens, and NFT collections across EVM and Solana:
  - `GET /assets/tokens/balances/by-address`: Native and token balances (200 CU).
  - `GET /assets/tokens/by-address`: Token holdings with current USD market values (360 CU).
  - `GET /assets/nfts/contracts/by-address`: NFT contracts owned by wallet (600 CU).
  - `GET /assets/nfts/by-address`: Complete NFT collection items (1,000 CU).

---

## 6. Utility API (`alchemy_getTransactionReceipts`)

- **Compute Units**: 250 CU
- **Description**: Fetches all transaction receipts for an entire block in a single round-trip by `blockNumber` or `blockHash`. Reduces network round-trips by over 99% compared to issuing individual `eth_getTransactionReceipt` calls.

---

## 7. Transaction Simulation API Suite

Prevents transaction reverts and phishing drainer attacks before signing.

### `alchemy_simulateAssetChanges` (2,500 CU)
- **Parameters**: `transaction` object (`from`, `to`, `data`, `value`, `gas`, `gasPrice`).
- **Response**: Details incoming and outgoing asset transfers:
  - `assetType`: `"NATIVE"`, `"ERC20"`, `"ERC721"`, `"ERC1155"`.
  - `changeType`: `"TRANSFER"` or `"APPROVE"`.
  - `from` and `to` addresses.
  - `amount`, `symbol`, `decimals`, `logo`.
  - `gasUsed`: Exact simulated gas consumption.

### `alchemy_simulateExecution` (2,500 CU)
- **Parameters**: `transaction` object, `format` (`"FLAT"` or `"NESTED"`), `blockTag`.
- **Response**: Full call-trace tree with decoded inputs and outputs via verified contract ABIs, emitted event logs, and explicit `revertReason` if the transaction would fail.

### Atomic Bundle Simulations (4,500 CU)
- `alchemy_simulateAssetChangesBundle` & `alchemy_simulateExecutionBundle`: Simulates atomic execution of up to 10 dependent transactions in sequential order.

---

## 8. NFT API v3 Suite (REST)

- **Base URL**: `https://{network}.g.alchemy.com/nft/v3/{apiKey}/`
- **Core Methods**:
  1. `getNFTsForOwner`: Returns all NFTs owned by an address with normalized metadata, cached CDN images, floor prices, and collection info.
  2. `getNFTMetadata`: Returns metadata for a specific token ID with cache refresh option (`refreshCache: true`).
  3. `getContractMetadata` & `getContractMetadataBatch`: Collection creator, deployment block, total supply, OpenSea verification status.
  4. `isSpamContract`: Algorithmic spam detection (fake events, copycat phishing collections).
  5. `getFloorPrice`: Real-time floor prices aggregating OpenSea, LooksRare, and Blur.
