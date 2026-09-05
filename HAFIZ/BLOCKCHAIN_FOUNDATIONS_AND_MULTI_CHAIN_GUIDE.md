# Blockchain Foundations & Multi-Chain Forensics Guide
**Workspace:** `HAFIZ/`  
**Project:** SIH 2026 — Real-Time Crypto Fraud Attribution System  
**Audience:** Beginners, Cyber Investigators, and SIH Teammates  

---

## 1. Executive Summary & The Beginner Mental Model

To understand blockchain forensics without prior blockchain knowledge, compare it directly to everyday Indian banking and UPI:

| Everyday Banking & UPI | Blockchain Concept | Forensic Meaning for Law Enforcement |
| :--- | :--- | :--- |
| **Bank Account Number / UPI ID** | **Wallet Address** (`0x...`) | A public 42-character alphanumeric string. Anyone can view its transactions on public ledgers. |
| **Account Balance (INR/USD)** | **Native Balance** (`ETH`, `POL`) | Base currency of that chain. Acts as digital "postage stamps" / fuel (**Gas Fees**) required to broadcast any transaction. |
| **Foreign Currency / Digital Gold** | **Tokens & Stablecoins** (`USDT`, `USDC`) | Digital currencies that live inside the wallet. Scammers favor **USDT** because it is pegged 1:1 to the US Dollar and does not lose value. |
| **Bank Passbook Entry / UTR** | **Transaction Hash** (`Tx Hash`) | A permanent, tamper-proof 64-character receipt ID. Can be verified on public explorers (e.g., Etherscan) anytime. |
| **Bank Branch / ATM / Cash Counter** | **Crypto Exchange (VASP)** | Centralized platforms (**Binance, WazirX, CoinDCX**). Criminals must eventually deposit here to convert crypto into real bank cash. |

---

## 2. Tokens vs. Native Coins & The Smart Contract Reality

### A. The Only Exception: The "Native Coin"
Every blockchain has **one** native currency hard-coded into its engine to pay for transaction computational power (**Gas**):
* **Ethereum**: `ETH`
* **Polygon**: `POL` (formerly `MATIC`)
* **Bitcoin**: `BTC`
* **Solana**: `SOL`

Native coins do not have a contract address—they are built directly into the protocol.

### B. Everything Else Is a Smart Contract (Tokens)
Literally every other digital asset—whether Tether (`USDT`), Shiba Inu (`SHIB`), or meme coins like `iPhone 15`—is a **Smart Contract** (an ERC-20 standard program running on the blockchain).

A token smart contract is essentially an **Excel spreadsheet written in code**:
1. It maintains a mapping of addresses to balances: `mapping(address => uint256) balances;`
2. When Alice transfers 50 USDT to Bob, no physical coin travels through the internet; the smart contract simply decrements Alice's row by 50 and increments Bob's row by 50.

### C. The "iPhone 15 / Random Coin" Phenomenon
Anyone can deploy a token contract in 2 minutes for under ₹100, naming it whatever they want and minting billions of units.

When looking at famous addresses (like **Vitalik Buterin's** wallet `0xd8dA6...`), you see millions of weird tokens like `iPhone 15`, `Anonymous AI`, `MUSHY`, and `Wally2.0`. Why?
* **Airdrop Marketing / Fake Endorsement**: Scammers create a token, send 3,000,000 units to Vitalik's public address without his permission, and brag on social media: *"Vitalik holds our iPhone 15 coin! Buy now!"*
* **Dusting & Phishing Attacks**: Fraudsters name a token `Claim-Free-USDT-at-ScamSite.com` to lure victims into connecting their wallets to malicious drainers.
* **Forensic Rule**: High token quantities do not equal wealth. Unless a token has verified liquidity on an exchange or decentralized pool, **its market value is ₹0.00**. Forensic investigators prioritize **real liquid assets** (`ETH`, verified `USDT`, `USDC`).

---

## 3. The Multi-Chain Universe (The Highway Analogy)

EVM networks share the same address format (`0x...`), but they are completely independent ledger systems:

| Network | Highway Analogy | Forensic Characteristic |
| :--- | :--- | :--- |
| **Ethereum Mainnet** | **Prime National Highway** | Maximum security and value, but expensive fees ($5 to $30+ gas). Whales and major hacker heists live here. |
| **Polygon PoS** | **High-Speed Metro Rail** | Built by Indian founders; sub-cent transaction fees (< ₹1). Extremely popular in India. |
| **Arbitrum & Optimism** | **Express Layer-2 Flyovers** | Rollups that settle back to Ethereum, making transactions 95% cheaper while retaining Ethereum security. |
| **Base Mainnet** | **Coinbase's Express Way** | Rapidly growing ecosystem incubated by Coinbase. Heavy retail and consumer traffic. |
| **Sepolia Testnet** | **Driving School / Sandbox** | Monopoly money testnet with zero financial value. Used for development and risk-free testing. |

### The "One Key, Multiple Rooms" Law
* **Personal Wallets (EOA)**: If you control the private key to `0x123...`, you own that exact same address across **Ethereum, Polygon, Arbitrum, Base, and Optimism**.
* **Separate Vaults**: Receiving 10 ETH on Ethereum does **not** give you funds on Polygon. They are separate rooms.
* **Investigative Superpower**: Scammers frequently reuse their personal wallet address across multiple chains. If a suspect wallet goes dormant on Ethereum, checking the same address on Polygon or Arbitrum often catches them moving funds where fees are cheaper!

---

## 4. Blockchain Data Pipes: Alchemy & The Missing Highways

Alchemy is our primary real-time EVM data pipe, but real-world fraud investigations require cross-chain coverage.

### A. What Alchemy Does
* **Balance & Token Fetching**: `eth_getBalance`, `alchemy_getTokenBalances`
* **Asset Transfer Tracing**: `alchemy_getAssetTransfers` (incoming/outgoing ETH & ERC-20 transfers)
* **Token Metadata Resolution**: Symbol, name, and decimal normalization
* **Real-Time Push Alerts**: Alchemy Notify webhooks pushing instant updates on suspect address activity

### B. The Critical Missing Highways & How We Solve Them (100% Free)

Scammers deliberately switch chains to evade EVM-only tools. Here is how we cover them:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MULTI-CHAIN FORENSIC DATA MATRIX                     │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ Blockchain        │ Importance in Indian Crime │ Solution / Provider   │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ Ethereum, Polygon,│ ⭐⭐⭐⭐⭐                   │ Alchemy API           │
│ Arbitrum, Base,OP │ Very High                  │ (Status: 200 OK)      │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ TRON              │ 🚨 EXTREME CRITICAL        │ Alchemy Tron RPC      │
│ (USDT-TRC20)      │ 70-80% of Indian scams     │ & TronGrid Backup     │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ Bitcoin           │ ⭐⭐⭐⭐                     │ Alchemy Bitcoin RPC   │
│ (BTC)             │ Ransomware / Darknet       │ & Mempool.space       │
└───────────────────┴────────────────────────────┴───────────────────────┘
```

#### 1. TRON (`USDT-TRC20`) — The Indian Cybercrime Favorite
* **Why**: Over 75% of Indian cybercrime (Telegram task frauds, fake part-time jobs, pig-butchering) uses **USDT on TRON** due to ₹80-₹120 flat transfer fees and instant Indian P2P liquidity.
* **Alchemy Status**: **Natively Supported!** Enabled on Alchemy under `https://tron-mainnet.g.alchemy.com/v2/{key}`.
* **Backup Provider**: **TronGrid API** ([trongrid.io](https://www.trongrid.io/)).

#### 2. Bitcoin (`BTC`) — The Ransomware Standard
* **Why**: Extortion, ransomware, and high-value darknet markets still rely on Bitcoin's UTXO ledger.
* **Alchemy Status**: **Natively Supported!** Enabled on Alchemy under `https://bitcoin-mainnet.g.alchemy.com/v2/{key}`.
* **Backup Provider**: **Mempool.space API** ([mempool.space](https://mempool.space/docs/api/rest)).

---

## 5. What Was Built in `D1_alchemy_monitor`

In our working prototype (`HAFIZ/D1_alchemy_monitor` running on `http://127.0.0.1:5000`):

1. **Beginner-Friendly UI Overhaul**:
   * Removed confusing jargon ("Transaction Nonce" $\rightarrow$ "Total Sent Transfers", "Native Gas Balance").
   * Added an educational 4-step reference bar at the top.
2. **5 Real-World 1-Click Presets**:
   * 👤 **Vitalik Buterin (`vitalik.eth`)**: Real individual high-activity wallet.
   * 🏦 **Binance Hot Wallet 14**: Massive centralized exchange deposit pool (VASP).
   * 🚨 **Ronin Bridge Exploiter**: \$600M theft wallet demonstrating laundering patterns.
   * 🪙 **Tether Treasury**: USDT mint and distribution engine.
   * 🌀 **Tornado Cash (Mixer)**: Privacy protocol used to break fund flow trails.
3. **Plain-English Investigator Case Assessment**:
   * An automated natural-language summary analyzing if the wallet has touched exchanges, mixers, or exploiters.
4. **"Follow the Money (Hop)" Feature**:
   * One-click breadcrumb button in the transfer table to immediately re-target and trace the recipient or sender.
5. **Direct Etherscan Verification Links**:
   * Instant `↗` explorer links for the wallet, token smart contracts, and transaction receipts.
6. **Live Webhook Wiretap Listener**:
   * Built-in `POST /webhook` server logging instant push notifications from Alchemy Notify.

---

## 6. Next Steps for SIH Winning Edge

1. **Plug in TronGrid for TRON / TRC-20 USDT**:
   * Allow officers to paste a `T...` Tron address and fetch transfer history using the same clean interface.
2. **VASP Sweep Heuristic (`RESEARCH/SET 7`)**:
   * Automatically detect when an unlabelled address transfers 99%+ of received funds within minutes to a known exchange hot wallet (Binance, WazirX, OKX).
3. **Court-Admissible Evidence Export (`RESEARCH/SET 9`)**:
   * Section 65B Indian Evidence Act compliant PDF/JSON report generation with SHA-256 hash validation for court submission.
