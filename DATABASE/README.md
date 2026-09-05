# Real-Time Crypto Fraud Attribution System (SIH 2026 Prototype)

> **SIH Problem Statement:** Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics.

This repository is organized into modular folders (`frontend/`, `backend/`, `db/`) to make it easy for team members to understand, modify, and present during SIH hackathon evaluations.

---

## 📁 Repository Structure

```
DATABASE/
├── README.md                      # SIH Team Guide & Setup Instructions
├── db/
│   ├── schema.sql                 # PostgreSQL DDL Table Schemas & Constraints
│   ├── seed.sql                   # Default seed data for all 7 roles, workspaces, & VASPs
│   └── connect.js                 # PostgreSQL Pool connection client
├── backend/
│   ├── package.json               # Backend Node.js Express configuration
│   ├── server.js                  # Main Express Server entry point
│   ├── middleware/
│   │   ├── rbac.js                # Role-Based Access Control middleware
│   │   └── abac.js                # Scope-Based (Attribute) access filter helper
│   └── routes/
│       ├── authRoutes.js          # User Identity & Quick Switcher API
│       ├── caseRoutes.js          # Complaint filing & Case scope retrieval
│       ├── traceRoutes.js         # Automated Blockchain Tracing API
│       ├── freezeRoutes.js        # Sec 94 BNSS Legal Freeze Orders API
│       └── adminRoutes.js         # Super Admin Workspace & Lockdown API
└── frontend/
    ├── index.html                 # Main Web Application Page
    ├── css/
    │   └── custom.css             # UI Styles & Custom Theme
    └── js/
        ├── api.js                 # Clean API Client calls for backend
        ├── rbac-ui.js             # UI Permission Enforcer (Disables/enables buttons by role)
        └── app.js                 # Main UI Controller & Event Handlers
```

---

## 🔐 Dual Access Control Security Model

### 1. Role-Based Access Control (RBAC)
Determines **WHAT ACTIONS** a user can perform.
- **Victim:** Can file complaints & view status.
- **Normal Investigator:** Can run wallet graph visualizer & draft freeze notices.
- **Senior Investigator:** All Normal powers + **Approve Freeze Orders** & **Anchor Evidence Hashes** on-chain.
- **Workspace Admin (SP/DCP):** Manages police team accounts & unit workload.
- **Super Admin (I4C):** Creates new state workspaces & triggers emergency platform lockdown.
- **Exchange Officer:** Confirms account freeze & uploads KYC data.
- **Auditor:** Read-only evidence hash verification.

### 2. Attribute/Scope-Based Access Control (ABAC)
Determines **WHICH DATA** a user can see.
- **Victims:** Restricted strictly to `case.victim_id == user.id`.
- **Investigators:** Restricted to `case.workspace_id == user.workspace_id`.
- **Super Admin:** Global nationwide access across all workspaces.

---

## 🚀 Quick Setup for Team Mates

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```
*Server will start on `http://localhost:5000`.*

### 2. Setup PostgreSQL Database
```bash
# Create database in PostgreSQL
createdb -U postgres crypto_attribution

# Load tables & seed data
psql -U postgres -d crypto_attribution -f db/schema.sql
psql -U postgres -d crypto_attribution -f db/seed.sql
```

### 3. Open Frontend in Browser
Simply open **`frontend/index.html`** in your browser (or visit `http://localhost:5000`).
Use the **Quick Persona Switcher** at the top of the page to switch roles live!
