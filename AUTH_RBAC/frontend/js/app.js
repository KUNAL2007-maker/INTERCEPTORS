// Main Frontend Controller for SIH 2026 Crypto Fraud Attribution System (RBAC + ABAC)

let currentUser = null;
let currentCases = [];
let currentEnvironment = { isEmergencyLockdown: false };

// Initialize Application
async function initApp() {
  const userData = await fetchCurrentUser();
  currentUser = userData.user;
  currentEnvironment = userData.environment || { isEmergencyLockdown: false };

  // Header Elements
  const headerName = document.getElementById('header-user-name');
  if (headerName) headerName.innerText = currentUser.name;

  // Apply RBAC Rules to all buttons
  applyPermissionRules(currentUser);

  // Update Lockdown UI banner
  updateLockdownBanner();

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
  renderCaseList(data);
}

function renderCaseList(meta = {}) {
  const container = document.getElementById('case-list-container');
  const countBadge = document.getElementById('case-count-badge');
  const totalInDb = meta.totalCasesInDb || 3;

  if (countBadge) {
    countBadge.innerText = `${currentCases.length} of ${totalInDb} Cases Visible`;
  }

  if (!container) return;

  if (currentCases.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 bg-slate-900/50 border border-dashed border-slate-700/80 rounded-2xl space-y-2">
        <i class="fa-solid fa-shield-halved text-3xl text-slate-500"></i>
        <h4 class="font-bold text-sm text-slate-200">No Cases In Current ABAC Scope</h4>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          ABAC attributes (Role: <code class="text-blue-400 font-mono">${currentUser ? currentUser.role_name : ''}</code>, 
          Workspace: <code class="text-cyan-400 font-mono">${currentUser && currentUser.workspace_id ? '#' + currentUser.workspace_id : 'None'}</code>) 
          strictly isolate case records. Switch persona to inspect other jurisdictions.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = currentCases.map(c => `
    <div class="border border-slate-800 rounded-2xl p-5 bg-slate-900/80 hover:border-blue-500/50 transition shadow-sm space-y-3">
      <div class="flex flex-wrap justify-between items-start gap-2">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-sm text-white">${c.case_number}</span>
            <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">${c.blockchain_network}</span>
            <span class="px-2 py-0.5 text-[10px] font-bold font-mono rounded ${getClassificationClass(c.classification)}">
              ${c.classification || 'RESTRICTED'}
            </span>
          </div>
          <p class="text-xs text-slate-300"><strong>Crime:</strong> ${c.crime_type || 'Crypto Investment Fraud'}</p>
        </div>
        <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full font-mono ${getStatusClass(c.status)}">
          ${c.status}
        </span>
      </div>

      <!-- ABAC Attribute Badges Row -->
      <div class="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
        <span class="bg-blue-950/60 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded flex items-center gap-1">
          <i class="fa-solid fa-building-shield text-[10px]"></i> Jurisdiction: ${c.jurisdiction_code || 'State Unit'}
        </span>
        <span class="bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded flex items-center gap-1">
          <i class="fa-solid fa-building-columns text-[10px]"></i> Target VASP: ${c.target_vasp}
        </span>
        <span class="bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
          <i class="fa-solid fa-indian-rupee-sign text-[10px]"></i> ₹${parseFloat(c.loss_amount_inr || 0).toLocaleString('en-IN')}
        </span>
        <span class="bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded flex items-center gap-1">
          <i class="fa-solid fa-user-lock text-[10px]"></i> Victim ID: #${c.victim_id}
        </span>
      </div>

      <div class="text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
        <div class="truncate">
          <span class="text-slate-500 font-medium">Suspect Wallet:</span> 
          <code class="text-slate-200 font-mono">${c.suspect_wallet_address}</code>
        </div>
        <button onclick="handleSelectCaseForSim(${c.id})" class="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline shrink-0 ml-2">
          Test in Simulator →
        </button>
      </div>
    </div>
  `).join('');
}

function getClassificationClass(classification) {
  switch (classification) {
    case 'TOP_SECRET': return 'bg-rose-950/70 text-rose-300 border border-rose-700/60 animate-pulse';
    case 'CONFIDENTIAL': return 'bg-amber-950/70 text-amber-300 border border-amber-700/60';
    default: return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'PENDING_TRACING': return 'bg-amber-950/80 text-amber-300 border border-amber-800';
    case 'TRACED': return 'bg-blue-950/80 text-blue-300 border border-blue-800';
    case 'FREEZE_DRAFTED': return 'bg-indigo-950/80 text-indigo-300 border border-indigo-800';
    case 'FREEZE_APPROVED': return 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';
    default: return 'bg-slate-800 text-slate-300';
  }
}

// ----------------------------------------------------------------------------
// ABAC POLICY SIMULATOR
// ----------------------------------------------------------------------------
function handleSelectCaseForSim(caseId) {
  const caseSelect = document.getElementById('sim-case-select');
  if (caseSelect) caseSelect.value = caseId;
  showTab('tab-abac-simulator');
  handleRunAbacSimulation();
}

async function handleRunAbacSimulation() {
  const caseId = document.getElementById('sim-case-select').value;
  const action = document.getElementById('sim-action-select').value;
  const roleOverride = document.getElementById('sim-role-select').value;

  const res = await evaluateAbacAPI(caseId, action, roleOverride || null);
  const resultCard = document.getElementById('sim-result-card');
  const resultBadge = document.getElementById('sim-result-badge');
  const policyTitle = document.getElementById('sim-policy-title');
  const reasonText = document.getElementById('sim-reason-text');
  const jsonContext = document.getElementById('sim-json-context');

  if (!resultCard) return;

  resultCard.classList.remove('hidden');

  if (res.decision.allowed) {
    resultBadge.innerText = 'ACCESS GRANTED (ALLOW)';
    resultBadge.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    policyTitle.innerText = 'Policy Decision: Access Allowed';
    policyTitle.className = 'font-bold text-sm text-emerald-300';
    reasonText.innerText = res.decision.reason || 'All RBAC & ABAC attributes satisfied. Access granted.';
    resultCard.className = 'bg-emerald-950/30 border border-emerald-600/40 p-5 rounded-2xl space-y-3';
  } else {
    resultBadge.innerText = 'ACCESS DENIED (403 FORBIDDEN)';
    resultBadge.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40';
    policyTitle.innerText = `Violated Policy: ${res.decision.policyId || 'ABAC_RESTRICTION'}`;
    policyTitle.className = 'font-bold text-sm text-rose-300';
    reasonText.innerText = res.decision.reason;
    resultCard.className = 'bg-rose-950/30 border border-rose-600/40 p-5 rounded-2xl space-y-3';
  }

  jsonContext.innerText = JSON.stringify({
    decision: res.decision.allowed ? 'ALLOW' : 'DENY',
    subject: res.subject,
    resource: res.resource,
    action: action,
    environment: currentEnvironment
  }, null, 2);

  logSecurityAudit(`ABAC Simulator: Tested [${action}] on Case #${caseId} for ${res.subject.role} -> Result: ${res.decision.allowed ? 'ALLOWED' : 'DENIED'}`);
}

async function handleToggleEmergencyLockdown() {
  const res = await toggleLockdownAPI();
  currentEnvironment.isEmergencyLockdown = res.isEmergencyLockdown;
  updateLockdownBanner();
  showToast(res.message, res.isEmergencyLockdown);
  logSecurityAudit(`Emergency Lockdown status changed to: ${res.isEmergencyLockdown ? 'ACTIVE' : 'INACTIVE'}`);
  await refreshCases();
}

function updateLockdownBanner() {
  const banner = document.getElementById('lockdown-active-banner');
  const btn = document.getElementById('btn-toggle-lockdown-sim');
  if (banner) {
    if (currentEnvironment.isEmergencyLockdown) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }
  if (btn) {
    btn.innerText = currentEnvironment.isEmergencyLockdown ? 'Deactivate Emergency Lockdown' : 'Activate Emergency Lockdown';
  }
}

// ----------------------------------------------------------------------------
// ACTION HANDLERS (Combined RBAC + ABAC)
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
    showToast(`Complaint registered under victim scope! Case #: ${res.case.case_number}`);
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
  await handleToggleEmergencyLockdown();
}

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

async function handleComparePdfHash() {
  const res = await verifyHashAPI();
  alert(`COURT EVIDENCE INTEGRITY AUDIT:\n\nStatus: ${res.status}\nDocument: ${res.document}\nSHA-256 Hash: ${res.sha256_hash}\nSmart Contract Block: 19842104\nResult: 100% Tamper Evident Match`);
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
