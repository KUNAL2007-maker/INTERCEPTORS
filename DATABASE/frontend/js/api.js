// API Helper Module for SIH Team Members

const API_BASE = '/api';

async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/current-user`);
  return res.json();
}

async function switchRoleAPI(roleName) {
  const res = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleName })
  });
  return res.json();
}

async function fetchCasesAPI() {
  const res = await fetch(`${API_BASE}/cases`);
  return res.json();
}

async function submitFraudComplaintAPI(data) {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function runWalletTraceAPI(caseId) {
  const res = await fetch(`${API_BASE}/trace/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId })
  });
  return res.json();
}

async function draftFreezeRequestAPI(caseId, reason) {
  const res = await fetch(`${API_BASE}/freeze/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, freeze_reason: reason })
  });
  return res.json();
}

async function approveAndAnchorAPI(freezeRequestId) {
  const res = await fetch(`${API_BASE}/freeze/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ freeze_request_id: freezeRequestId })
  });
  return res.json();
}

async function createWorkspaceAPI(data) {
  const res = await fetch(`${API_BASE}/workspaces/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function triggerLockdownAPI() {
  const res = await fetch(`${API_BASE}/admin/lockdown`, { method: 'POST' });
  return res.json();
}
