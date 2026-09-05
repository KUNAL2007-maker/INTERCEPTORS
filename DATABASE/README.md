# Real-Time Crypto Fraud Attribution System (SIH 2026 Prototype)

> **SIH Problem Statement:** Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics.

This module houses the full dual-access control engine (**RBAC + ABAC**) prototype and demonstration interface for all 7 team personas.

---

## 🚀 Quick Setup for Teammates (How to Run Locally)

Share these exact steps with any team member who has cloned the repository:

### Step 1: Pull Latest Updates from GitHub
Make sure you are up to date with the latest commits on `main`:
```bash
git pull origin main
```

### Step 2: Navigate to the `DATABASE` Directory
```bash
cd DATABASE
```

### Step 3: Install Dependencies
```bash
npm install
```
> **Windows PowerShell Note**: If you get a script execution policy error (`npm.ps1 cannot be loaded`), run:
> ```powershell
> npm.cmd install
> ```

### Step 4: Start the Server
```bash
node server.js
# Or: npm start
```
*The server will start on `http://localhost:5000`.*

### Step 5: Open in Your Browser
Open your browser and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## ⚡ Zero-Install Option (Instant Browser Preview)
If Node.js is not installed on your teammate's machine, they can simply double-click or open:
`DATABASE/frontend/index.html`
in any web browser (Chrome, Edge, Brave, Firefox). The built-in client-side mock engine will automatically simulate all 7 roles, live permission enforcement, and case scoping with zero setup.

---

## 🔐 7 Personas Dual Access Control Model

### 1. Role-Based Access Control (RBAC) — What actions you can perform:
1. **Victim / Complainant**: Files reports, uploads transaction hashes, tracks complaint status, and views court-ready summaries.
2. **Normal Investigator**: Runs wallet graph visualizer, identifies suspect VASPs, drafts evidence reports, and drafts Sec 94 BNSS freeze notices.
3. **Senior Investigator**: All Normal powers + advanced cross-chain tracing, approves statutory freeze requests under Sec 94 BNSS / 91 CrPC, and anchors SHA-256 evidence on-chain.
4. **Workspace Admin (SP/DCP)**: Manages police accounts, assigns/reassigns cases among team members, and reviews overall unit workload.
5. **Super Admin (I4C / MHA)**: Platform-wide access. Creates state workspaces, monitors national fraud trends, manages global API keys, and triggers emergency lockdowns.
6. **Exchange Nodal Officer (VASP Desk)**: Receives automated freeze notices, confirms account freezes, and submits encrypted KYC dossiers.
7. **Auditor / Judicial Representative**: Strict read-only verification portal. Compares case PDF hash against smart contract timestamp. Zero editing or execution permissions.

### 2. Attribute-Based Access Control (ABAC) — Which data you can view:
- **Victims:** Restricted strictly to `case.victim_id == user.id`.
- **Investigators & Admins:** Restricted to assigned state workspace (`Maharashtra Cyber Unit`).
- **Exchange Officers:** Restricted to cases involving their specific exchange (`Binance`).
- **Super Admin & Judicial Auditors:** Global nationwide visibility across all cases.
