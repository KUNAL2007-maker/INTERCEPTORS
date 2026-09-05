-- Real-Time Crypto Fraud Attribution System - PostgreSQL Schema & Seed Data

-- Drop existing tables if re-initialization is needed
DROP TABLE IF EXISTS evidence_anchors CASCADE;
DROP TABLE IF EXISTS freeze_requests CASCADE;
DROP TABLE IF EXISTS wallet_traces CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vasps CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 2. Permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Role Permissions Join
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Workspaces (Regional / State Cyber Cells)
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    state VARCHAR(50) NOT NULL,
    jurisdiction_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. VASPs (Cryptocurrency Exchanges)
CREATE TABLE vasps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'pbkdf2_dummy_hash',
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    workspace_id INT REFERENCES workspaces(id) ON DELETE SET NULL, -- NULL for Super Admin / Victims / Exchange Officers
    vasp_id INT REFERENCES vasps(id) ON DELETE SET NULL,           -- Only populated for EXCHANGE_NODAL_OFFICER
    badge_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cases (Complaints / Investigations)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    victim_id INT REFERENCES users(id) ON DELETE RESTRICT,
    workspace_id INT REFERENCES workspaces(id) ON DELETE RESTRICT,
    assigned_investigator_id INT REFERENCES users(id) ON DELETE SET NULL,
    suspect_wallet_address VARCHAR(128) NOT NULL,
    blockchain_network VARCHAR(30) DEFAULT 'Ethereum',
    loss_amount_inr NUMERIC(12, 2),
    crime_type VARCHAR(50) NOT NULL, -- e.g., 'Investment Scam', 'Ransomware', 'Sextortion', 'Phishing'
    status VARCHAR(30) DEFAULT 'PENDING_TRACING', -- 'PENDING_TRACING', 'TRACED', 'FREEZE_DRAFTED', 'FREEZE_APPROVED', 'NOTICE_SENT', 'FROZEN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Wallet Traces (Blockchain Graph Attribution Results)
CREATE TABLE wallet_traces (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    input_wallet VARCHAR(128) NOT NULL,
    detected_vasp_id INT REFERENCES vasps(id) ON DELETE SET NULL,
    layering_depth INT DEFAULT 1,
    risk_score INT CHECK (risk_score BETWEEN 0 AND 100),
    risk_category VARCHAR(20) DEFAULT 'HIGH', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    trace_data_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Freeze Requests (Sec 94 BNSS / 91 CrPC Statutory Freeze Orders)
CREATE TABLE freeze_requests (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    vasp_id INT REFERENCES vasps(id) ON DELETE RESTRICT,
    drafted_by INT REFERENCES users(id) ON DELETE RESTRICT,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL, -- Requires SENIOR_INVESTIGATOR
    bnss_section VARCHAR(50) DEFAULT 'Sec 94 BNSS / 91 CrPC',
    freeze_reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'DRAFTED', -- 'DRAFTED', 'APPROVED', 'SENT_TO_EXCHANGE', 'FROZEN', 'REJECTED'
    response_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Evidence Anchors (Blockchain Smart Contract Proofs)
CREATE TABLE evidence_anchors (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    pdf_hash VARCHAR(64) NOT NULL, -- SHA-256 Hash of court-ready evidence report
    smart_contract_tx_hash VARCHAR(66) NOT NULL,
    anchored_by INT REFERENCES users(id) ON DELETE RESTRICT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED DATA FOR TESTING & EVALUATION
-- ============================================================================

-- Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'VICTIM', 'Citizen affected by crypto fraud or hacking'),
(2, 'NORMAL_INVESTIGATOR', 'Field cyber officer conducting initial case tracing'),
(3, 'SENIOR_INVESTIGATOR', 'Unit lead/forensic specialist with approval and evidence anchoring authority'),
(4, 'WORKSPACE_ADMIN', 'Police Unit Lead (SP/DCP) managing unit accounts and assignments'),
(5, 'SUPER_ADMIN', 'National Nodal Authority (I4C/MHA) managing nationwide settings'),
(6, 'EXCHANGE_NODAL_OFFICER', 'VASP compliance officer receiving freeze notices'),
(7, 'AUDITOR', 'Judges, public prosecutors, or auditors with read-only verification access');

-- Permissions
INSERT INTO permissions (id, code, description) VALUES
(1, 'case:create', 'Create new fraud complaint'),
(2, 'case:view_own', 'View own submitted complaints'),
(3, 'case:view_workspace', 'View cases within assigned workspace'),
(4, 'case:view_all', 'View all cases across jurisdictions'),
(5, 'trace:run', 'Execute wallet graph analytics and tracing'),
(6, 'freeze:draft', 'Draft legal freeze notice under Sec 94 BNSS'),
(7, 'freeze:approve', 'Approve freeze notice for transmission'),
(8, 'evidence:anchor', 'Anchor evidence PDF SHA-256 hash to blockchain'),
(9, 'workspace:manage', 'Manage police unit accounts and case assignments'),
(10, 'global:manage', 'Create new state workspaces and system settings'),
(11, 'freeze:respond', 'Exchange nodal officer confirmation/freeze execution'),
(12, 'audit:verify', 'Read-only verification of evidence hashes');

-- Role Permissions Mapping
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Victim
(1, 1), (1, 2),
-- Normal Investigator
(2, 3), (2, 5), (2, 6),
-- Senior Investigator
(3, 3), (3, 5), (3, 6), (3, 7), (3, 8),
-- Workspace Admin
(4, 3), (4, 9),
-- Super Admin
(5, 4), (5, 9), (5, 10),
-- Exchange Nodal Officer
(6, 11),
-- Auditor
(7, 4), (7, 12);

-- Workspaces
INSERT INTO workspaces (id, name, state, jurisdiction_code) VALUES
(1, 'Maharashtra Cyber Unit', 'Maharashtra', 'MH-CYBER-01'),
(2, 'Delhi Police Cyber Hub', 'Delhi', 'DL-CYBER-02'),
(3, 'National Central Hub (I4C)', 'Central', 'IN-I4C-00');

-- VASPs
INSERT INTO vasps (id, name, code, contact_email) VALUES
(1, 'Binance International', 'BINANCE', 'compliance@binance.com'),
(2, 'WazirX India', 'WAZIRX', 'legal@wazirx.com'),
(3, 'CoinDCX', 'COINDCX', 'nodal@coindcx.com');

-- Sample Users
INSERT INTO users (id, name, email, role_id, workspace_id, vasp_id, badge_number) VALUES
(1, 'Central Nodal Officer (I4C)', 'admin@i4c.gov.in', 5, 3, NULL, 'SUPER-ADMIN-01'),
(2, 'Officer Sharma (MH Cyber)', 'senior.sharma@mhcyber.gov.in', 3, 1, NULL, 'MH-POLICE-884'),
(3, 'Sub-Inspector Patil', 'officer.patil@mhcyber.gov.in', 2, 1, NULL, 'MH-POLICE-102'),
(4, 'SP Deshmukh (MH Unit Lead)', 'sp.deshmukh@mhcyber.gov.in', 4, 1, NULL, 'MH-POLICE-001'),
(5, 'Rajesh Verma (Victim)', 'victim.verma@gmail.com', 1, NULL, NULL, NULL),
(6, 'Binance Compliance Lead', 'legal@binance.com', 6, NULL, 1, 'BINANCE-COMP-99'),
(7, 'Justice K. S. Rao', 'judge.rao@ecourts.gov.in', 7, NULL, NULL, 'JUD-MH-2026');

-- Sample Case
INSERT INTO cases (id, case_number, victim_id, workspace_id, assigned_investigator_id, suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, status) VALUES
(1, 'MH-CYBER-2026-0842', 5, 1, 3, '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'Ethereum', 450000.00, 'Task-based Investment Scam', 'PENDING_TRACING');

-- Sample Wallet Trace Result
INSERT INTO wallet_traces (id, case_id, input_wallet, detected_vasp_id, layering_depth, risk_score, risk_category, trace_data_json) VALUES
(1, 1, '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 1, 3, 92, 'CRITICAL', '{
  "hops": [
    {"hop": 1, "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", "type": "Victim Deposit Wallet"},
    {"hop": 2, "address": "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", "type": "Intermediary Layering Wallet"},
    {"hop": 3, "address": "0x28C6c06298d514Db089934071355E5743bf21d60", "type": "Binance Deposit Hot Wallet", "vasp": "Binance International"}
  ]
}');
