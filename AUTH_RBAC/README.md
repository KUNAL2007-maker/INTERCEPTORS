# AUTH_RBAC — 7-Role Dual Access Control System

> **Smart India Hackathon 2026** · Problem Statement: Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics.

This folder contains the **complete, self-contained Access Control Engine (RBAC + ABAC)**, including the interactive 7-persona frontend dashboard, Express API backend, middleware guards, role definitions, and automated test suite.

---

## 📁 Complete Folder Structure

```
AUTH_RBAC/
├── README.md                 # Master documentation & setup guide
├── package.json              # Server dependencies & test scripts
├── server.js                 # Standalone Express API & static server (port 5000)
├── index.js                  # Canonical entrypoint exporting all roles & middlewares
├── roles.js                  # 7 roles, scopes, metadata, permissions, and permission matrix
├── test.js                   # Automated unit test suite (23/23 passing)
├── middleware/
│   ├── rbac.js               # Role-Based Access Control route guard middleware
│   └── abac.js               # Attribute-Based Access Control scope filter (Victim, Workspace, VASP)
└── frontend/
    ├── index.html            # Complete Interactive 7-Persona Dashboard
    ├── css/
    │   └── custom.css        # Theme styles & badge states
    └── js/
        ├── rbac-ui.js        # Declarative UI button permission enforcer
        ├── api.js            # API client with zero-config offline fallback
        └── app.js            # Controller, event handlers, and security audit log
```

---

## 🚀 How to Run Locally

### Option 1: Run via Node.js Server (Recommended)
From the repository root:
```bash
cd AUTH_RBAC
npm install       # (PowerShell users: npm.cmd install)
node server.js    # Or: npm start
```
Open your browser at:
👉 **[http://localhost:5000](http://localhost:5000)**

### Option 2: Zero-Install Instant Preview
Open [`AUTH_RBAC/frontend/index.html`](frontend/index.html) directly in Google Chrome, Microsoft Edge, or Firefox. The built-in client-side simulation automatically enforces permissions and ABAC scope isolation without needing any server or dependencies.

### Option 3: Run the Automated Verification Tests
```bash
node test.js
```
Runs 23 automated test assertions covering permissions, role restrictions, and ABAC case filters across all 7 personas.

---

## 👥 7 System Personas & Access Control Specification

| # | Persona | Role Code | Scope Boundary | Key Capabilities & Allowed Actions |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Victim / Complainant** | `VICTIM` | **Strictly own submitted case file** | `File Fraud Report`, `Upload Tx Hashes`, `Track Complaint Status`, `View Court Summary` |
| **2** | **Normal Investigator** | `NORMAL_INVESTIGATOR` | **Assigned cases within State/Unit Workspace** | `Run Wallet Graph Visualizer`, `Identify Suspect VASP`, `Draft Evidence Report`, `Draft Sec 94 BNSS Notice` |
| **3** | **Senior Investigator** | `SENIOR_INVESTIGATOR` | **Workspace-wide case oversight & legal approvals** | *All Normal powers* + `Advanced Cross-Chain Trace`, `Approve Sec 94 BNSS Order`, `Anchor On-Chain Hash` |
| **4** | **Workspace Admin** | `WORKSPACE_ADMIN` | **Full admin over regional Cyber Cell (SP/DCP)** | `Manage Police Accounts`, `Assign / Reassign Cases`, `Review Unit Workload & Metrics` |
| **5** | **Super Admin** | `SUPER_ADMIN` | **Platform-wide nationwide management (I4C / MHA)** | `Create State Workspace`, `Monitor National Trends`, `Configure Global Alchemy Keys`, `Emergency Lockdown` |
| **6** | **Exchange Nodal Officer** | `EXCHANGE_NODAL_OFFICER` | **Tied strictly to assigned exchange (VASP)** | `View Incoming Freeze Notices`, `Confirm Account Freeze`, `Submit Requested KYC Dossier` |
| **7** | **Auditor / Judicial** | `AUDITOR` | **Read-only verification (0 write permissions)** | `Compare PDF Hash vs Blockchain`, `Verify Court Evidence (Sec 65B BSA)` |

---

## 🔐 Security Principles Implemented

1. **Declarative DOM Permission Checking (`rbac-ui.js`)**:
   Buttons specify required permissions directly in markup (`data-permission="..."`, `data-is-write="true"`). The UI engine automatically disables unauthorized buttons, injects lock icons (`🔒`), and displays exact rejection rationale in tooltips.
2. **Dual-Layer Defense**:
   Even if a user inspects elements or attempts API calls directly, the backend Express middlewares (`rbac.js`, `abac.js`) return strict `403 Forbidden` status codes with violation details.
3. **Tamper-Evident Security Audit Stream**:
   Every persona switch, permission grant, and restricted access attempt is logged with client-side and server-side timestamps.
