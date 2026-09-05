// Attribute/Scope-Based Access Control (ABAC) Helper

function filterCasesByScope(user, casesList) {
  if (user.role_name === 'SUPER_ADMIN' || user.role_name === 'AUDITOR') {
    return casesList; // Global Scope
  }
  if (user.role_name === 'VICTIM') {
    return casesList.filter(c => c.victim_id === user.id); // Strict Victim Ownership Scope
  }
  if (['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN'].includes(user.role_name)) {
    return casesList.filter(c => c.workspace_id === user.workspace_id); // Workspace Scope
  }
  return [];
}

module.exports = { filterCasesByScope };
