-- Seed Data for Real-Time Crypto Fraud Attribution System

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'VICTIM', 'Citizen affected by crypto fraud or hacking'),
(2, 'NORMAL_INVESTIGATOR', 'Field cyber officer conducting initial case tracing'),
(3, 'SENIOR_INVESTIGATOR', 'Unit lead with legal approval and evidence anchoring authority'),
(4, 'WORKSPACE_ADMIN', 'Police Unit Lead (SP/DCP) managing unit accounts and workload'),
(5, 'SUPER_ADMIN', 'National Nodal Authority (I4C/MHA) managing nationwide settings'),
(6, 'EXCHANGE_NODAL_OFFICER', 'VASP compliance officer receiving freeze notices'),
(7, 'AUDITOR', 'Judges, public prosecutors, or auditors with read-only verification access');

-- 2. Permissions
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

-- 3. Role Permissions Mapping
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2),
(2, 3), (2, 5), (2, 6),
(3, 3), (3, 5), (3, 6), (3, 7), (3, 8),
(4, 3), (4, 9),
(5, 4), (5, 9), (5, 10),
(6, 11),
(7, 4), (7, 12);

-- 4. Workspaces
INSERT INTO workspaces (id, name, state, jurisdiction_code) VALUES
(1, 'Maharashtra Cyber Unit', 'Maharashtra', 'MH-CYBER-01'),
(2, 'Delhi Police Cyber Hub', 'Delhi', 'DL-CYBER-02'),
(3, 'National Central Hub (I4C)', 'Central', 'IN-I4C-00');

-- 5. VASPs
INSERT INTO vasps (id, name, code, contact_email) VALUES
(1, 'Binance International', 'BINANCE', 'compliance@binance.com'),
(2, 'WazirX India', 'WAZIRX', 'legal@wazirx.com'),
(3, 'CoinDCX', 'COINDCX', 'nodal@coindcx.com');

-- 6. Sample Users
INSERT INTO users (id, name, email, role_id, workspace_id, vasp_id, badge_number) VALUES
(1, 'Central Nodal Officer (I4C)', 'admin@i4c.gov.in', 5, 3, NULL, 'SUPER-ADMIN-01'),
(2, 'Officer Sharma (MH Cyber)', 'senior.sharma@mhcyber.gov.in', 3, 1, NULL, 'MH-POLICE-884'),
(3, 'Sub-Inspector Patil', 'officer.patil@mhcyber.gov.in', 2, 1, NULL, 'MH-POLICE-102'),
(4, 'SP Deshmukh (MH Unit Lead)', 'sp.deshmukh@mhcyber.gov.in', 4, 1, NULL, 'MH-POLICE-001'),
(5, 'Rajesh Verma (Victim)', 'victim.verma@gmail.com', 1, NULL, NULL, NULL),
(6, 'Binance Compliance Lead', 'legal@binance.com', 6, NULL, 1, 'BINANCE-COMP-99'),
(7, 'Justice K. S. Rao', 'judge.rao@ecourts.gov.in', 7, NULL, NULL, 'JUD-MH-2026');

-- 7. Sample Case
INSERT INTO cases (id, case_number, victim_id, workspace_id, assigned_investigator_id, suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, status) VALUES
(1, 'MH-CYBER-2026-0842', 5, 1, 3, '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'Ethereum', 450000.00, 'Task-based Investment Scam', 'PENDING_TRACING');
