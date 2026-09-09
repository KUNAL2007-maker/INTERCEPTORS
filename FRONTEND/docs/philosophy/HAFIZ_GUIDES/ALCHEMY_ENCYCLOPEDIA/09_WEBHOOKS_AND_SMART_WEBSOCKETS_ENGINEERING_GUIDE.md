# VOLUME 9: WEBHOOKS & SMART WEBSOCKETS ENGINEERING GUIDE
*Real-Time Event Streaming, Push Notifications & Cryptographic Verification (2026 Live Audit)*

---

## 1. Webhooks vs. WebSockets: Architectural Comparison

Building reactive applications (such as automated crypto-fraud monitoring, deposit detection, or wallet balance updates) requires real-time notifications:

| Dimension | Alchemy Webhooks (Notify API) | Alchemy Smart WebSockets |
| :--- | :--- | :--- |
| **Delivery Model** | Push over HTTP/HTTPS POST to user server | Bidirectional persistent TCP connection |
| **Network Overhead** | Low (Server wakes up only when an event occurs) | Constant socket keep-alive & heartbeat ping/pong |
| **Persistence & Retries** | Automated 24-hour retry queue with exponential backoff | Lost if connection drops; client must handle reconnects |
| **Use Cases** | Backend database updates, alerting, transactional emails | Interactive frontend UI animations, real-time trading |

---

## 2. Webhook Event Types

### 1. Address Activity Webhook
Triggers whenever an address in your watched list sends or receives funds:
- Native currency transfers (ETH, MATIC, SOL).
- ERC-20 token transfers.
- ERC-721 and ERC-1155 NFT transfers.

### 2. NFT Activity Webhook
Triggers whenever an NFT contract emits a mint, burn, or transfer event across any address.

### 3. Stellar Address Activity Webhook
Tracks classic XLM transfers and Soroban smart contract events.

### 4. Custom GraphQL Webhooks
Allows developers to define arbitrary filtering criteria using GraphQL schemas, inspecting internal call traces, specific log topics, or value ranges.

---

## 3. Custom GraphQL Webhook Schema Filters

Custom GraphQL webhooks allow developers to write targeted event queries:

```graphql
query FilterLargeMixerDeposits {
  block {
    transactions(
      filter: {
        to: "0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b" # Tornado Cash 100 ETH Pool
        value: { gt: "0x56bc75e2d63100000" }              # > 100 ETH
      }
    ) {
      hash
      from
      to
      value
      logs {
        topics
        data
      }
    }
  }
}
```

### Supported Filter Criteria Objects:
- `BlockFilterCriteria`: `hash`, `number_gte`, `number_lte`.
- `BlockTransactionsFilterCriteria`: `from`, `to`, `status` (0 or 1), `value`, `gasUsed`.
- `BlockLogsFilterCriteria`: `address`, `topics` (matches across `topic0`, `topic1`, `topic2`, `topic3`).
- `BlockCallTracesFilterCriteria`: Internal debug call traces (`callTracerTraces`) by internal `from` and `to`.

---

## 4. Cryptographic HMAC-SHA256 Signature Verification

To protect against spoofing, Alchemy signs every outgoing webhook with an HMAC-SHA256 signature passed in the `x-alchemy-signature` HTTP header.

### Python Verification Implementation:
```python
import hmac
import hashlib

def is_valid_alchemy_webhook(raw_request_body: bytes, signature_header: str, signing_key: str) -> bool:
    """
    Validates HMAC-SHA256 signature from x-alchemy-signature header.
    raw_request_body MUST be unparsed raw bytes (not parsed JSON string).
    """
    computed = hmac.new(
        key=signing_key.encode('utf-8'),
        msg=raw_request_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(computed, signature_header)
```

### TypeScript / Node.js Implementation:
```typescript
import * as crypto from 'crypto';

export function isValidAlchemyWebhook(rawBody: string, signature: string, signingKey: string): boolean {
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(rawBody, 'utf8');
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
```

---

## 5. Webhook Delivery & Retry Policy

If a destination webhook endpoint fails to return an HTTP `2xx` response (e.g. returns 500, 502, 504, or times out after 5 seconds):
1. The event enters Alchemy’s **Automated Retry Queue**.
2. Retries are scheduled using **exponential backoff with jitter** over a rolling **24-hour window**.
3. If an endpoint fails repeatedly over 24 hours, an automated alert email is triggered and the webhook enters a quarantined state.

---

## 6. Smart WebSockets Subscriptions Reference

Alchemy enhances standard Ethereum WebSocket subscriptions with specialized high-speed filters:

### 1. `alchemy_pendingTransactions`
Streams pending transactions matching address filters before they are mined into blocks:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_subscribe",
  "params": [
    "alchemy_pendingTransactions",
    {
      "fromAddress": ["0x..."],
      "toAddress": ["0x..."],
      "hashesOnly": false
    }
  ]
}
```

### 2. `alchemy_minedTransactions`
Emits notifications as soon as a transaction is included in a block. Includes `includeRemoved: true` to notify client apps of blockchain reorganizations.

### 3. `monadNewHeads` & `monadLogs`
Fires speculative execution blocks and logs as soon as a block is Proposed in Monad's parallel consensus, reducing latency by hundreds of milliseconds.
