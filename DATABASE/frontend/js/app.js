// Main UI Application Controller

let currentUser = null;
let currentCases = [];

async function initApp() {
  const userData = await fetchCurrentUser();
  currentUser = userData.user;

  // Update Header Elements
  document.getElementById('header-user-name').innerText = currentUser.name;
  document.getElementById('header-role-badge').innerText = currentUser.role_name;
  document.getElementById('header-scope-text').innerText = currentUser.workspace_id 
    ? `Workspace #${currentUser.workspace_id}` 
    : 'Global Scope';

  document.getElementById('investigator-name').innerText = currentUser.name;

  // Enforce UI Permission States
  applyPermissionRules(currentUser);

  // Load Active Cases
  await refreshCases();
}

async function switchPersona(roleName) {
  const res = await switchRoleAPI(roleName);
  showToast(`Persona switched to: ${res.user.name} (${res.user.role_name})`);
  await initApp();
}

async function refreshCases() {
  const data = await fetchCasesAPI();
  currentCases = data.cases;
  renderCaseTables();
}

function renderCaseTables() {
  const victimContainer = document.getElementById('victim-cases-container');
  const investigatorContainer = document.getElementById('investigator-cases-container');
  const victimCount = document.getElementById('victim-case-count');

  if (victimCount) victimCount.innerText = `${currentCases.length} Complaints`;

  const html = currentCases.map(c => `
    <div class="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
      <div class="flex justify-between items-start">
        <div>
          <span class="font-bold text-sm text-slate-800">${c.case_number}</span>
          <span class="ml-2 text-xs text-slate-500 font-mono">${c.blockchain_network}</span>
        </div>
        <span class="px-2.5 py-1 text-[10px] font-bold rounded-full font-mono ${getStatusClass(c.status)}">
          ${c.status}
        </span>
      </div>
      <div class="text-xs text-slate-600">
        <p><strong>Suspect Wallet:</strong> <code class="bg-white px-1.5 py-0.5 rounded border font-mono text-slate-800">${c.suspect_wallet_address}</code></p>
        <p><strong>Fraud Type:</strong> ${c.crime_type} | <strong>Loss:</strong> ₹${parseFloat(c.loss_amount_inr || 0).toLocaleString('en-IN')}</p>
      </div>
    </div>
  `).join('');

  if (victimContainer) victimContainer.innerHTML = html || '<p class="text-xs text-slate-400">No complaints found in your victim scope.</p>';
  if (investigatorContainer) investigatorContainer.innerHTML = html || '<p class="text-xs text-slate-400">No active cases in this workspace.</p>';
}

function getStatusClass(status) {
  switch (status) {
    case 'PENDING_TRACING': return 'badge-status-pending';
    case 'TRACED': return 'badge-status-traced';
    case 'FREEZE_DRAFTED': return 'badge-status-drafted';
    case 'FREEZE_APPROVED': return 'badge-status-approved';
    default: return 'bg-slate-200 text-slate-700';
  }
}

async function handleAddComplaint() {
  const wallet = prompt('Enter suspect cryptocurrency wallet address:', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  if (!wallet) return;

  const res = await submitFraudComplaintAPI({
    suspect_wallet_address: wallet,
    blockchain_network: 'Ethereum',
    loss_amount_inr: 450000,
    crime_type: 'Task-Based Crypto Fraud'
  });

  if (res.case) {
    showToast(`Complaint registered! Case #: ${res.case.case_number}`);
    refreshCases();
  } else {
    showToast(res.message || res.error, true);
  }
}

async function handleRunTrace() {
  if (currentCases.length === 0) return alert('No active case available.');
  const res = await runWalletTraceAPI(currentCases[0].id);

  if (res.trace) {
    showToast(`Attribution Complete! Identified VASP: ${res.trace.detected_vasp} (Risk Score: ${res.trace.risk_score}/100)`);
    refreshCases();
  } else {
    showToast(res.message || res.error, true);
  }
}

async function handleDraftFreeze() {
  if (currentCases.length === 0) return alert('No active case available.');
  const res = await draftFreezeRequestAPI(currentCases[0].id, 'Urgent asset preservation under Sec 94 BNSS');

  if (res.freezeNotice) {
    showToast('Freeze notice drafted under Sec 94 BNSS');
    refreshCases();
  } else {
    showToast(res.message || res.error, true);
  }
}

async function handleApproveAndAnchor() {
  const res = await approveAndAnchorAPI(1);
  if (res.anchor) {
    showToast(`APPROVED & ANCHORED! Smart Contract Tx: ${res.anchor.smart_contract_tx_hash.substring(0, 18)}...`);
    refreshCases();
  } else {
    showToast(res.message || res.error, true);
  }
}

async function handleCreateWorkspace() {
  const res = await createWorkspaceAPI({
    name: 'Karnataka Cyber Taskforce',
    state: 'Karnataka',
    jurisdiction_code: 'KA-CYBER-03'
  });

  if (res.workspace) {
    showToast(`New State Workspace Created: ${res.workspace.name}`);
  } else {
    showToast(res.message || res.error, true);
  }
}

async function handleLockdown() {
  const res = await triggerLockdownAPI();
  showToast(res.message, true);
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.remove('border-blue-600', 'text-blue-600');
    btn.classList.add('border-transparent');
  });
  document.getElementById(`tab-${tabId}`).classList.add('border-blue-600', 'text-blue-600');
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const toastIcon = document.getElementById('toast-icon');

  toastMsg.innerText = msg;
  toastIcon.className = isError ? 'fa-solid fa-triangle-exclamation text-rose-400' : 'fa-solid fa-circle-check text-emerald-400';

  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4500);
}

window.onload = initApp;
