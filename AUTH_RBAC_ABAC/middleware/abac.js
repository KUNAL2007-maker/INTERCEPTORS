/**
 * Attribute-Based Access Control (ABAC) Middleware & Helpers
 * Integrates directly with the ABAC Policy Engine
 */

const { evaluateABAC, systemEnvironment } = require('../abac-engine');
const { ROLES } = require('../roles');

/**
 * Filter an array of cases in memory based on fine-grained ABAC policy evaluations.
 * @param {object} currentUser 
 * @param {Array} cases 
 * @returns {Array}
 */
function filterCasesByScope(currentUser, cases = []) {
  if (!currentUser) return [];

  return cases.filter(caseRecord => {
    const decision = evaluateABAC(currentUser, caseRecord, 'VIEW_CASE');
    return decision.allowed;
  });
}

/**
 * Express Route Middleware for Fine-Grained ABAC Evaluation
 * @param {string} action - The action being attempted (e.g. 'APPROVE_FREEZE', 'VIEW_CASE')
 * @param {Function} [getResource] - Optional callback (req) => resourceObject
 */
function requireABAC(action, getResource) {
  return (req, res, next) => {
    const currentUser = req.user || req.app.get('currentUser');
    const memoryDB = req.app.get('memoryDB');
    
    let resource = null;
    if (getResource) {
      resource = getResource(req, memoryDB);
    } else if (req.body && req.body.case_id && memoryDB && memoryDB.cases) {
      resource = memoryDB.cases.find(c => c.id === parseInt(req.body.case_id));
    }

    const decision = evaluateABAC(currentUser, resource, action);
    if (!decision.allowed) {
      return res.status(403).json({
        error: 'Access Denied (ABAC Policy Restriction)',
        policyId: decision.policyId,
        policyName: decision.policyName,
        message: decision.reason,
        context: decision.evaluatedContext
      });
    }

    req.abacDecision = decision;
    next();
  };
}

module.exports = {
  filterCasesByScope,
  requireABAC,
  evaluateABAC,
  systemEnvironment
};
