# Common Module: Auth & RBAC (Role & Attribute-Based Access Control)

This directory is the **shared collaborative workspace** for authentication, authorization, and access control across the SIH 2026 Crypto Fraud Attribution System.

---

## 🏛️ Access Control Architecture Overview

The system uses a **Dual-Layer Security Model**:
1. **Role-Based Access Control (RBAC)**: Enforces *what actions/endpoints* an identity can invoke.
2. **Attribute-Based Access Control (ABAC)**: Enforces *which case data/workspaces* an identity can view or mutate (e.g., multi-tenancy, LEA jurisdiction boundaries, victim privacy).

---

## 👥 System Personas & Permission Matrix

| Role Name | Scope / Jurisdiction | Key Capabilities & Permissions |
| :--- | :--- | :--- |
| `SUPER_ADMIN` (I4C / MHA) | Nationwide (All Workspaces) | Platform emergency lockdown, state workspace creation, global telemetry & audit logs. |
| `WORKSPACE_ADMIN` (SP / DCP) | District / State Unit | Team officer onboarding, officer credential management, local workload dispatch. |
| `SENIOR_INVESTIGATOR` | Assigned Unit Workspace | All investigator capabilities + **Approve Sec 94 BNSS Freeze Notices** + anchor evidence on-chain. |
| `INVESTIGATOR` (IO / Inspector) | Assigned Unit Workspace | Intake wallet addresses, run automated multi-hop tracing, draft freeze notices, view graph trails. |
| `EXCHANGE_OFFICER` (VASP Desk) | Specific Exchange Portal | Receive Section 91 CrPC / Section 94 BNSS notices, acknowledge freeze status, securely upload KYC. |
| `AUDITOR` | Nationwide (Read-Only) | Section 65B hash verification, tamper-evident audit log review, compliance inspection. |
| `VICTIM` (Complainant) | Self Only (`case.victim_id == user.id`) | File initial fraud complaint, track investigation status & restitution progress. |

---

## 📁 Recommended Structure

```
AUTH_RBAC/
├── README.md               # This specification & integration guide
├── roles.js                # Canonical role names, hierarchy, and permissions
├── middleware/
│   ├── rbac.js             # Express / API route RBAC guard
│   └── abac.js             # Case & workspace scoping filter
└── utils/
    └── tokens.js           # JWT / Session token generation and validation helpers
```

---

## 🔄 Collaboration Workflow

* **Pull Before**: Always run `git pull origin main` (or `git fetch origin && git status`) before making changes.
* **Push After**: When a feature or schema enhancement is verified, stage, commit, and run `git push origin main`.
