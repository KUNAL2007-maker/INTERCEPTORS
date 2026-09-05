// RBAC & ABAC UI Permission Enforcer for SIH Demo

function applyPermissionRules(user) {
  const isSenior = ['SENIOR_INVESTIGATOR', 'SUPER_ADMIN'].includes(user.role_name);
  const isSuperAdmin = user.role_name === 'SUPER_ADMIN';

  // 1. Senior Only Evidence Anchoring Button
  const approveBtn = document.getElementById('btn-approve-anchor');
  if (approveBtn) {
    if (!isSenior) {
      approveBtn.disabled = true;
      approveBtn.classList.add('opacity-50', 'cursor-not-allowed');
      approveBtn.title = 'Access Denied: Requires SENIOR_INVESTIGATOR role';
    } else {
      approveBtn.disabled = false;
      approveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      approveBtn.title = '';
    }
  }

  // 2. Super Admin Only Control Buttons
  ['btn-create-workspace', 'btn-manage-keys', 'btn-lockdown'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (!isSuperAdmin) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.title = 'Access Denied: Requires SUPER_ADMIN role';
      } else {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.title = '';
      }
    }
  });
}
