# VOLUME 2: CORE EVM JSON-RPC COMPLETE METHOD REFERENCE
*Comprehensive Parameter-by-Parameter & Specification Manual (2026 Live Audit)*

---

## 1. Specification Standards & Formatting Rules

All EVM JSON-RPC requests follow the Ethereum JSON-RPC specification (EIP-1474) and JSON-RPC 2.0 protocol over HTTPS (`POST /v2/{apiKey}`) or Smart WebSockets (`WSS /v2/{apiKey}`).

### Standard JSON-RPC 2.0 Envelope
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "<METHOD_NAME>",
  "params": [...]
}
```

### Standard Value Encoding Rules:
- **Quantities (Integers, Numbers, Balances, Gas, Nonces)**: Must be hex-encoded strings with leading `"0x"`, lowercase, with no leading zeroes (e.g. `0x10` for 16, `0x0` for 0, NOT `0x010`).
- **Data (Addresses, Hashes, Bytecode, Call Data)**: Must be hex-encoded strings with leading `"0x"`, lowercase or checksummed, with even number of hex characters (e.g. 20-byte address = 40 hex chars + `"0x"`).
- **Block Tags**: Accept either explicit block numbers (`"0x12a4b5"`), 32-byte block hashes (`"0x3847..."`), or standard tags:
  - `"latest"`: The latest canonical block imported by the node.
  - `"earliest"`: The genesis block (`0x0`).
  - `"pending"`: State including pending mempool transactions.
  - `"safe"`: Predetermined consensus checkpoint unlikely to be reorganized.
  - `"finalized"`: Block permanently finalized by consensus (irreversible without slash).

---

## 2. Exhaustive Method Reference Catalog

---

### Method: `eth_blockNumber`
- **Description**: Returns the number of the most recent block on the canonical chain.
- **Compute Units**: 10 CU | **Throughput**: 10 CU
- **Parameters**: None (`[]`).
- **Request Example**:
  ```json
  {"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
  ```
- **Response Result**: Hex string representing the current block number (e.g. `"0x13d8e57"` = 20,811,351).

---

### Method: `eth_getBalance`
- **Description**: Returns the balance of the account of given address in wei.
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**:
  1. `address` (DATA, 20 Bytes): Address to check balance of.
  2. `blockTag` (QUANTITY|TAG): Integer block number or `"latest"`, `"earliest"`, `"pending"`, `"safe"`, `"finalized"`.
- **Request Example**:
  ```json
  {"jsonrpc":"2.0","method":"eth_getBalance","params":["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "latest"],"id":1}
  ```
- **Response Result**: Hex string integer of the current balance in wei (e.g. `"0x1bc16d674ec80000"` = 2.0 ETH).

---

### Method: `eth_getTransactionCount`
- **Description**: Returns the number of transactions sent from an address (account nonce).
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**:
  1. `address` (DATA, 20 Bytes): Address to query.
  2. `blockTag` (QUANTITY|TAG): Block number or tag.
- **Response Result**: Hex integer representing the account's next transaction nonce.

---

### Method: `eth_getCode`
- **Description**: Returns code at a given address (smart contract bytecode). Returns `"0x"` for Externally Owned Accounts (EOAs).
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**:
  1. `address` (DATA, 20 Bytes): Contract address.
  2. `blockTag` (QUANTITY|TAG): Block tag.
- **Response Result**: Hex string of EVM runtime bytecode.

---

### Method: `eth_getStorageAt`
- **Description**: Returns the value from a storage position at a given address.
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**:
  1. `address` (DATA, 20 Bytes): Contract address.
  2. `position` (QUANTITY): Storage slot index (hex string).
  3. `blockTag` (QUANTITY|TAG): Block tag.
- **Response Result**: 32-byte hex string representing the storage slot contents.

---

### Method: `eth_call`
- **Description**: Executes a new message call immediately in the EVM without creating a transaction on the block chain (read-only execution).
- **Compute Units**: 26 CU | **Throughput**: 26 CU
- **Parameters**:
  1. `transaction` (OBJECT):
     - `from` (DATA, 20 Bytes, optional): The address the transaction is sent from.
     - `to` (DATA, 20 Bytes): The contract address the transaction is directed to.
     - `gas` (QUANTITY, optional): Gas provided for transaction execution.
     - `gasPrice` (QUANTITY, optional): Gas price in wei.
     - `value` (QUANTITY, optional): Value transferred in wei.
     - `data` (DATA, optional): Hash of method signature and encoded parameters.
  2. `blockTag` (QUANTITY|TAG, optional): Block tag.
  3. `stateOverride` (OBJECT, optional): Key-value map of addresses to override balance, nonce, code, state, or stateDiff during evaluation.
- **Request Example**:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [
      {
        "to": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "data": "0x70a08231000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045"
      },
      "latest"
    ],
    "id": 1
  }
  ```
- **Response Result**: Return value of executed contract call (hex string).

---

### Method: `eth_estimateGas`
- **Description**: Generates and returns an estimate of how much gas is necessary to allow the transaction to complete.
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**:
  1. `transaction` (OBJECT): Same structure as `eth_call`.
  2. `blockTag` (QUANTITY|TAG, optional).
- **Response Result**: Hex string integer of estimated gas units.

---

### Method: `eth_gasPrice`
- **Description**: Returns the current gas price in wei (legacy transaction pricing).
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**: None (`[]`).
- **Response Result**: Hex string integer in wei (e.g. `"0x4a817c800"` = 20 gwei).

---

### Method: `eth_maxPriorityFeePerGas`
- **Description**: Returns the current max priority fee per gas (EIP-1559 tip) recommended for transaction inclusion.
- **Compute Units**: 10 CU | **Throughput**: 10 CU
- **Parameters**: None (`[]`).
- **Response Result**: Hex string integer in wei.

---

### Method: `eth_feeHistory`
- **Description**: Returns historical gas base fee, priority fee percentiles, and gas used ratios over a range of blocks (EIP-1559).
- **Compute Units**: 10 CU | **Throughput**: 10 CU
- **Parameters**:
  1. `blockCount` (QUANTITY): Number of blocks in the requested range (between 1 and 1024).
  2. `newestBlock` (QUANTITY|TAG): Highest block in requested range.
  3. `rewardPercentiles` (ARRAY of FLOATS): Percentile cutoffs for priority fees (e.g. `[25, 50, 75]`).
- **Response Result**: Object containing `oldestBlock`, `baseFeePerGas[]`, `gasUsedRatio[]`, and `reward[][]`.

---

### Method: `eth_sendRawTransaction`
- **Description**: Submits a signed transaction serialized into raw hex format for broadcasting and mining.
- **Compute Units**: 40 CU | **Throughput**: 50 CU
- **Parameters**:
  1. `signedTransactionData` (DATA): The signed transaction data in raw hex string.
- **Request Example**:
  ```json
  {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x02f87301..."],"id":1}
  ```
- **Response Result**: 32-byte transaction hash (e.g. `"0x88df01470291...""`).

---

### Method: `eth_sendRawTransactionSync`
- **Description**: Sends raw transaction and blocks synchronously until the transaction is either mined or rejected.
- **Compute Units**: 40 CU | **Throughput**: 125 CU
- **Parameters**: Same as `eth_sendRawTransaction`.
- **Response Result**: Complete transaction receipt object upon mining.

---

### Method: `eth_getTransactionByHash`
- **Description**: Returns transaction information for a given 32-byte transaction hash.
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**: `transactionHash` (DATA, 32 Bytes).
- **Response Result**: Object containing `blockHash`, `blockNumber`, `from`, `to`, `gas`, `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas`, `hash`, `input`, `nonce`, `transactionIndex`, `value`, `type` (`0x0` legacy, `0x1` EIP-2930, `0x2` EIP-1559, `0x3` EIP-4844, `0x4` EIP-7702), `v`, `r`, `s`.

---

### Method: `eth_getTransactionReceipt`
- **Description**: Returns the receipt of a transaction by transaction hash. Returns `null` if transaction is still pending.
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**: `transactionHash` (DATA, 32 Bytes).
- **Response Result**: Object containing `status` (`0x1` success, `0x0` reverted), `blockHash`, `blockNumber`, `transactionHash`, `transactionIndex`, `from`, `to`, `contractAddress`, `cumulativeGasUsed`, `gasUsed`, `effectiveGasPrice`, `logs` array, `logsBloom`, and `type`.

---

### Method: `eth_getBlockByNumber` & `eth_getBlockByHash`
- **Description**: Returns block data matching block number or 32-byte block hash.
- **Compute Units**: 20 CU | **Throughput**: 20 CU
- **Parameters**:
  1. `blockNumber` (QUANTITY|TAG) or `blockHash` (DATA, 32 Bytes).
  2. `fullTransactions` (BOOLEAN): If `true`, returns full transaction objects; if `false`, returns transaction hash strings only.
- **Response Result**: Block object containing `number`, `hash`, `parentHash`, `nonce`, `sha3Uncles`, `logsBloom`, `transactionsRoot`, `stateRoot`, `receiptsRoot`, `miner`, `difficulty`, `totalDifficulty`, `extraData`, `size`, `gasLimit`, `gasUsed`, `timestamp`, `transactions`, `uncles`, `baseFeePerGas`, `blobGasUsed`, `excessBlobGas`, and `parentBeaconBlockRoot`.

---

### Method: `eth_getBlockReceipts`
- **Description**: Returns all transaction receipts for a given block number.
- **Compute Units**: 20 CU | **Throughput**: 500 CU
- **Parameters**: `blockNumber` (QUANTITY|TAG).
- **Response Result**: Array of full transaction receipt objects.

---

### Method: `eth_getLogs`
- **Description**: Returns an array of all logs matching a given filter object.
- **Compute Units**: 60 CU | **Throughput**: 60 CU
- **Parameters**:
  1. `filter` (OBJECT):
     - `fromBlock` (QUANTITY|TAG, optional): Default `"latest"`.
     - `toBlock` (QUANTITY|TAG, optional): Default `"latest"`.
     - `address` (DATA|ARRAY of DATA, optional): Contract address or list of addresses.
     - `topics` (ARRAY of DATA, optional): Array of 32-byte data topics. Can contain `null` wildcards or nested arrays for OR conditions (`[topic0, [topic1A, topic1B], null]`).
     - `blockHash` (DATA, 32 Bytes, optional): Restricts log filter to a specific single block hash (EIP-234).
- **Limits**:
  - Max block range per single call: 2,000 blocks (on Free tier) to 100,000+ blocks (on PAYG/Enterprise).
  - Max results returned: 10,000 logs per request.

---

### Methods: `net_version`, `net_listening`, `net_peerCount`, `web3_clientVersion`, `web3_sha3`
- **Description**: Network identification and utility primitives.
- **Compute Units**: 0 CU (Static metadata).
- `net_version`: Returns the decimal network ID (e.g. `"1"` for Ethereum Mainnet, `"8453"` for Base, `"42161"` for Arbitrum).
- `web3_clientVersion`: Returns current node client version string (e.g. `"Cortex/v2026.3.0"`).
- `web3_sha3`: Computes Keccak-256 hash of given data string.
