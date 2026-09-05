-- Real-Time Crypto Fraud Attribution System - PostgreSQL DDL Schema

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

-- 1. Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 2. Permissions Table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Role Permissions Join Table
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Workspaces Table (Regional / State Cyber Cells)
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    state VARCHAR(50) NOT NULL,
    jurisdiction_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. VASPs Table (Cryptocurrency Exchanges like Binance, WazirX)
CREATE TABLE vasps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'pbkdf2_dummy_hash',
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    workspace_id INT REFERENCES workspaces(id) ON DELETE SET NULL,
    vasp_id INT REFERENCES vasps(id) ON DELETE SET NULL,
    badge_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cases Table (Cyber Fraud Complaints & Files)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    victim_id INT REFERENCES users(id) ON DELETE RESTRICT,
    workspace_id INT REFERENCES workspaces(id) ON DELETE RESTRICT,
    assigned_investigator_id INT REFERENCES users(id) ON DELETE SET NULL,
    suspect_wallet_address VARCHAR(128) NOT NULL,
    blockchain_network VARCHAR(30) DEFAULT 'Ethereum',
    loss_amount_inr NUMERIC(12, 2),
    crime_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_TRACING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Wallet Traces Table (Blockchain Graph Attribution Results)
CREATE TABLE wallet_traces (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    input_wallet VARCHAR(128) NOT NULL,
    detected_vasp_id INT REFERENCES vasps(id) ON DELETE SET NULL,
    layering_depth INT DEFAULT 1,
    risk_score INT CHECK (risk_score BETWEEN 0 AND 100),
    risk_category VARCHAR(20) DEFAULT 'HIGH',
    trace_data_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Freeze Requests Table (Sec 94 BNSS / 91 CrPC Statutory Freeze Orders)
CREATE TABLE freeze_requests (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    vasp_id INT REFERENCES vasps(id) ON DELETE RESTRICT,
    drafted_by INT REFERENCES users(id) ON DELETE RESTRICT,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    bnss_section VARCHAR(50) DEFAULT 'Sec 94 BNSS / 91 CrPC',
    freeze_reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'DRAFTED',
    response_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Evidence Anchors Table (Blockchain Smart Contract Proofs)
CREATE TABLE evidence_anchors (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    pdf_hash VARCHAR(64) NOT NULL,
    smart_contract_tx_hash VARCHAR(66) NOT NULL,
    anchored_by INT REFERENCES users(id) ON DELETE RESTRICT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
