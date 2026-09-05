// Attribute-Based Access Control (ABAC) Helper

function filterCasesByScope(currentUser, cases = []) {
  if (!currentUser) return [];

  // Super Admin & Auditor have nationwide access
  if (currentUser.role_name === 'SUPER_ADMIN' || currentUser.role_name === 'AUDITOR') {
    return cases;
  }

  // Victim: Strictly restricted to their own submitted cases
  if (currentUser.role_name === 'VICTIM') {
    return cases.filter(c => c.victim_id === currentUser.id);
  }

  // Exchange Officer: Strictly restricted to cases involving their assigned VASP
  if (currentUser.role_name === 'EXCHANGE_NODAL_OFFICER') {
    return cases.filter(c => c.vasp_id === currentUser.vasp_id || c.target_vasp === currentUser.vasp_name);
  }

  // Police Investigators & Workspace Admins: Scoped to their assigned workspace
  return cases.filter(c => c.workspace_id === currentUser.workspace_id);
}

module.exports = { filterCasesByScope };
