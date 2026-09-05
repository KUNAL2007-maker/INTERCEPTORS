// Main Frontend Controller for SIH 2026 Crypto Fraud Attribution System

let currentUser = null;
let currentCases = [];

// Initialize Application
async function initApp() {
  const userData = await fetchCurrentUser();
  currentUser = userData.user;

  // Header Elements
  const headerName = document.getElementById('header-user-name');
  if (headerName) headerName.innerText = currentUser.name;

  // Apply RBAC Rules to all buttons
  applyPermissionRules(currentUser);

  // Load Cases
  await refreshCases();
}

async function switchPersona(roleName) {
  const res = await switchRoleAPI(roleName);
  if (res && res.user) {
    currentUser = res.user;
    showToast(`Active persona switched: ${res.user.name} (${res.user.role_name})`);
    logSecurityAudit(`Persona switched to ${res.user.name} [${res.user.role_name}].`);
  }
  await initApp();
}

async function refreshCases() {
  const data = await fetchCasesAPI();
  currentCases = data.cases || [];
  renderCaseList();
}

function renderCaseList() {
  const container = document.getElementById('case-list-container');
  const countBadge = document.getElementById('case-count-badge');
  if (countBadge) countBadge.innerText = `${currentCases.length} Case${currentCases.length === 1 ? '' : 's'}`;

  if (!container) return;

  if (currentCases.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 bg-slate-50 border border-dashed rounded-xl">
        <i class="fa-solid fa-folder-open text-2xl mb-2 text-slate-300"></i>
        <p class="text-xs">No cases found in current ABAC scope (${currentUser ? currentUser.role_name : ''}).</p>
      </div>
    `;
    return;
  }

  container.innerHTML = currentCases.map(c => `
    <div class="border border-slate-200 rounded-xl p-4 bg-white hover:border-blue-400 transition shadow-xs space-y-2">
      <div class="flex justify-between items-start">
        <div>
          <span class="font-bold text-sm text-slate-800">${c.case_number}</span>
          <span class="ml-2 text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">${c.blockchain_network}</span>
        </div>
        <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full font-mono ${getStatusClass(c.status)}">
          ${c.status}
        </span>
      </div>
      <div class="text-xs text-slate-600 space-y-1">
        <p><strong>Suspect Wallet:</strong> <code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">${c.suspect_wallet_address}</code></p>
        <p><strong>Target VASP:</strong> <span class="text-blue-600 font-medium">${c.target_vasp || 'Binance'}</span> | <strong>Loss:</strong> ₹${parseFloat(c.loss_amount_inr || 0).toLocaleString('en-IN')}</p>
        <p><strong>Crime Type:</strong> ${c.crime_type || 'Crypto Investment Fraud'}</p>
      </div>
    </div>
  `).join('');
}

function getStatusClass(status) {
  switch (status) {
    case 'PENDING_TRACING': return 'bg-amber-100 text-amber-800 border border-amber-300';
    case 'TRACED': return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'FREEZE_DRAFTED': return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
    case 'FREEZE_APPROVED': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    default: return 'bg-slate-200 text-slate-700';
  }
}

// ----------------------------------------------------------------------------
// 1. VICTIM ACTIONS
// ----------------------------------------------------------------------------
async function handleFileComplaint() {
  const wallet = prompt('Victim Ingestion: Enter suspect cryptocurrency wallet address:', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  if (!wallet) return;

  const res = await submitFraudComplaintAPI({
    suspect_wallet_address: wallet,
    blockchain_network: 'Ethereum',
    loss_amount_inr: 450000,
    crime_type: 'Task-Based Crypto Fraud'
  });

  if (res.case) {
    showToast(`Complaint registered! Case #: ${res.case.case_number}`);
    logSecurityAudit(`Victim filed complaint: ${res.case.case_number} for wallet ${wallet}`);
    await refreshCases();
  } else {
    showToast(res.message || res.error, true);
  }
}

async function handleUploadTxHash() {
  const tx = prompt('Enter stolen transaction hash to attach to evidence dossier:', '0x992b4510cf2e3a1...fa31');
  if (!tx) return;

  const res = await uploadTxHashAPI(tx);
  showToast(res.message);
  logSecurityAudit(`Victim uploaded transaction hash: ${tx}`);
}

async function handleTrackComplaintStatus() {
  await refreshCases();
  showToast(`Complaint status refreshed: ${currentCases.length} case(s) loaded.`);
}

async function handleViewCourtSummary() {
  alert('COURT-READY EVIDENCE DOSSIER SUMMARY\n\nCase: MH-CYBER-2026-0842\nStatute: Section 65B Bharatiya Sakshya Adhiniyam (BSA)\nComplainant: Rajesh Verma\nSuspect Wallet: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F\nTerminal VASP: Binance International\nStatus: Tamper-Evident Hash Verified');
  logSecurityAudit('Viewed court-ready case summary dossier.');
}

// ----------------------------------------------------------------------------
// 2. NORMAL INVESTIGATOR ACTIONS
// ----------------------------------------------------------------------------
async function handleRunWalletGraph() {
  const res = await runWalletTraceAPI(1);
  showToast(res.message);
  logSecurityAudit('Ran multi-hop blockchain graph visualizer. Identified terminal VASP: Binance.');
  await refreshCases();
}

async function handleIdentifySuspectVASP() {
  alert('AUTOMATED VASP ATTRIBUTION RESULT:\n\n• Identified Entity: Binance International\n• Hot Wallet Sweep Heuristic: Match (Confidence: 99.4%)\n• Deposit Sweep Target: 0x32Be343B94f860124dC4fEe278FDCBD38C102D88\n• Layering Hops: 3 Intermediary Burner Wallets');
  logSecurityAudit('Performed VASP deposit address sweep attribution.');
}

async function handleDraftEvidenceReport() {
  alert('FORENSIC EVIDENCE REPORT DRAFTED:\n\n• Case ID: MH-CYBER-2026-0842\n• Crime Schema: Task-based Fraud Ingestion\n• Multi-Hop Chain: Ethereum -> Mixer Intermediary -> Binance Deposit Hot Wallet\n• Readiness: Section 65B Compliant');
  logSecurityAudit('Drafted initial cyber crime forensic investigation report.');
}

async function handleDraftFreezeRequest() {
  const res = await draftFreezeRequestAPI(1, 'Urgent asset preservation under Sec 94 BNSS / 91 CrPC');
  showToast(res.message);
  logSecurityAudit('Drafted statutory freeze order under Sec 94 BNSS for Binance Legal Desk.');
  await refreshCases();
}

// ----------------------------------------------------------------------------
// 3. SENIOR INVESTIGATOR ACTIONS
// ----------------------------------------------------------------------------
async function handleCrossChainTrace() {
  const res = await crossChainTraceAPI();
  showToast(res.message);
  logSecurityAudit('Executed cross-chain forensic bridge analysis (Ethereum -> Polygon -> TRON).');
}

async function handleApproveAndAnchor() {
  const res = await approveAndAnchorAPI();
  showToast(res.message);
  logSecurityAudit('Senior Officer approved Sec 94 BNSS Notice and anchored SHA-256 evidence on-chain!');
  await refreshCases();
}

// ----------------------------------------------------------------------------
// 4. WORKSPACE ADMIN (SP / DCP) ACTIONS
// ----------------------------------------------------------------------------
async function handleManagePoliceAccounts() {
  const res = await managePoliceAccountsAPI();
  showToast(res.message);
  logSecurityAudit('Workspace Admin updated police team personnel accounts.');
}

async function handleAssignCase() {
  const res = await assignCaseAPI();
  showToast(res.message);
  logSecurityAudit('Workspace Admin dispatched case to Sub-Inspector Patil.');
}

async function handleReviewUnitWorkload() {
  const res = await reviewWorkloadAPI();
  alert(`POLICE UNIT WORKLOAD & PERFORMANCE METRICS:\n\n${res.message}`);
  logSecurityAudit('Reviewed district unit performance and clearance metrics.');
}

// ----------------------------------------------------------------------------
// 5. SUPER ADMIN (I4C / MHA) ACTIONS
// ----------------------------------------------------------------------------
async function handleCreateStateWorkspace() {
  const name = prompt('Enter State / Regional Cyber Hub Name:', 'Karnataka Cyber Taskforce');
  if (!name) return;
  const res = await createWorkspaceAPI({ name, state: 'Karnataka', jurisdiction_code: 'KA-CYBER-03' });
  showToast(res.message);
  logSecurityAudit(`Super Admin provisioned new state workspace: ${name}`);
}

async function handleMonitorTrends() {
  const res = await monitorTrendsAPI();
  alert(`NATIONAL CYBERCRIME FRAUD INTELLIGENCE (I4C):\n\n${res.message}`);
  logSecurityAudit('Accessed national cross-border crypto fraud intelligence.');
}

async function handleConfigureKeys() {
  const res = await configureKeysAPI();
  showToast(res.message);
  logSecurityAudit('Super Admin configured global Alchemy RPC and NCRP bridge keys.');
}

async function handleEmergencyLockdown() {
  if (!confirm('CAUTION: Are you sure you want to trigger an EMERGENCY PLATFORM LOCKDOWN?')) return;
  const res = await triggerLockdownAPI();
  showToast(res.message, true);
  logSecurityAudit('EMERGENCY PLATFORM LOCKDOWN TRIGGERED BY SUPER ADMIN.');
}

// ----------------------------------------------------------------------------
// 6. EXCHANGE NODAL OFFICER ACTIONS
// ----------------------------------------------------------------------------
async function handleConfirmExchangeFreeze() {
  const res = await confirmExchangeFreezeAPI();
  showToast(res.message);
  logSecurityAudit('Exchange Officer confirmed account freeze (UID-88319204, 5,340 USDT).');
}

async function handleSubmitKycDossier() {
  const res = await uploadKycAPI();
  showToast(res.message);
  logSecurityAudit('Exchange Officer uploaded verified KYC package for police investigation.');
}

// ----------------------------------------------------------------------------
// 7. AUDITOR & JUDICIAL ACTIONS (READ-ONLY)
// ----------------------------------------------------------------------------
async function handleComparePdfHash() {
  const res = await verifyHashAPI();
  alert(`COURT EVIDENCE INTEGRITY AUDIT:\n\nStatus: ${res.status}\nDocument: ${res.document}\nSHA-256 Hash: ${res.sha256_hash}\nSmart Contract Block: ${res.smart_contract_block}\nResult: ${res.tamper_status}`);
  logSecurityAudit('Judicial Auditor verified SHA-256 evidence hash against on-chain smart contract timestamp.');
}

async function handleVerifyEvidenceIntegrity() {
  showToast('Evidence integrity confirmed: 100% Tamper-evident match on blockchain.');
  logSecurityAudit('Judicial verification completed with zero tampering.');
}

// ----------------------------------------------------------------------------
// UI HELPERS (Toast & Tabs)
// ----------------------------------------------------------------------------
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const msgElem = document.getElementById('toast-msg');
  const icon = document.getElementById('toast-icon');

  if (!toast || !msgElem) return;

  msgElem.innerText = message;
  toast.className = `fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-2xl text-xs flex items-center space-x-2 border transition-all z-50 ${
    isError 
      ? 'bg-rose-950 text-rose-200 border-rose-700' 
      : 'bg-slate-900 text-emerald-300 border-emerald-500/50'
  }`;

  if (icon) {
    icon.className = isError 
      ? 'fa-solid fa-circle-exclamation text-rose-400' 
      : 'fa-solid fa-circle-check text-emerald-400';
  }

  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'text-blue-400');
    btn.classList.add('border-transparent', 'text-slate-400');
  });

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.remove('hidden');

  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-slate-400');
    activeBtn.classList.add('border-blue-500', 'text-blue-400');
  }
}

// Start application on page load
window.addEventListener('DOMContentLoaded', initApp);
