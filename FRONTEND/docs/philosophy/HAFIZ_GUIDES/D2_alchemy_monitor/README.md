# D2 Draft — Crypto Fraud Attribution Monitor (Investigator Edition)
*Smart India Hackathon (SIH) — Real-Time VASP Attribution for Indian Law Enforcement*

Built directly upon the **2026 Alchemy Technical Encyclopedia**, this upgraded monitoring system translates complex blockchain data into plain-English case assessments, live Indian Rupee (₹ INR) loss quantum, automated exchange sweep detection, and 1-click legal asset freezing notices.

---

## 🌟 Key Upgrades in Draft 2 (vs. Draft 1)

1. **Automated VASP Sweep Detection (Solving Core PS)**:
   - When a suspect wallet is queried, the system automatically inspects subsequent outgoing transfers.
   - If funds were swept into a centralized exchange (Binance, WazirX, OKX, CoinDCX, Coinbase), the system alerts the investigator and identifies the receiving exchange infrastructure.
2. **Live Fiat Valuations (₹ INR & $ USD)**:
   - Powered by Alchemy Prices API and live conversion rates.
   - Calculates the exact Indian Rupee loss quantum required for filing an FIR and issuing court notices.
3. **1-Click Section 91 Cr.P.C. / Section 94 BNSS Freezing Order Generator**:
   - Auto-populates a formal statutory notice with verified onchain transaction hashes, wallet addresses, and loss amounts, pre-addressed to the target exchange compliance desk (e.g. `compliance@binance.com`, `legal@wazirx.com`).
4. **Expanded Multi-Chain Registry**:
   - Added high-volume fraud ecosystems: **BNB Smart Chain (BSC)**, **Polygon PoS**, **Avalanche C-Chain**, alongside Ethereum, Base, and Arbitrum.
5. **Cryptographic HMAC-SHA256 Webhook Verification**:
   - Webhook tripwires authenticate the `x-alchemy-signature` header to eliminate spoofed alerts.
6. **Plain-English Threat Assessment**:
   - Classifies suspect wallets into **CRITICAL** (Exploiters/Scams), **HIGH** (Mixers/Obfuscation), **ACTIONABLE** (Exchange Sweep), **MEDIUM** (Direct Touchpoint), or **LOW**.

---

## 🚀 Quickstart & Launch

### 1. Launch the Server:
```powershell
python a:\SIH\HAFIZ\D2_alchemy_monitor\app.py
```
*The server will start at `http://127.0.0.1:5001`.*

### 2. Open in Browser:
Navigate to `http://127.0.0.1:5001`.

### 3. Test Scenarios (1-Click Buttons):
- **🏦 Binance Deposit Sweep Hub** (`0x28c6c06298d514db089934071355e5743bf21d60`):
  Flashes the **Actionable VASP Alert Banner** and lets you generate an immediate Binance freezing notice!
- **🚨 Ronin Bridge Exploiter** (`0x098b716b8aaf21512996dc57eb0615e2383e2f96`):
  Flashes the **Critical Threat Alert** (Lazarus Group).
- **🌀 Tornado Cash** (`0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc`):
  Flags active mixer obfuscation protocols.
- **👤 vitalik.eth** (`0xd8da6bf26964af9d7eed9e03e53415d37aa96045`):
  Demonstrates multi-token portfolio valuations in USD and INR.
