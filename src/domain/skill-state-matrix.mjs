/**
 * Status/invocation state matrix for skill lifecycle.
 *
 * SkillBoard allows 14 statuses and 7 invocations, but only a subset
 * of the 98 combinations is meaningful. This module makes the allowed
 * combinations explicit and provides helpers for policy checks.
 */

/**
 * Allowed status -> invocation combinations.
 * A status maps to one or more valid invocations.
 * Any combination not listed here is rejected by policy.
 */
export const SKILL_STATE_MATRIX = {
  discovered: ["manual-only", "blocked"],
  quarantined: ["blocked"],
  vendor: ["manual-only"],
  candidate: ["manual-only", "router-only", "workflow-auto"],
  active: ["manual-only", "router-only", "workflow-auto", "global-auto"],
  "active-manual": ["manual-only"],
  "active-router": ["router-only"],
  "active-auto": ["workflow-auto"],
  canonical: ["workflow-auto", "global-auto"],
  blocked: ["blocked"],
  deprecated: ["blocked", "deprecated"],
  archived: ["blocked", "deprecated"],
  removed: ["blocked", "deprecated"]
};

/**
 * Statuses that exist only for backward compatibility or external import.
 * They are still accepted but produce a warning because their semantics
 * overlap with explicit invocation values.
 */
export const LEGACY_STATUSES = new Set([
  "active-manual",
  "active-router",
  "active-auto",
  "archived",
  "removed"
]);

/**
 * Statuses that imply a skill is no longer selectable in any workflow.
 */
export const TERMINAL_STATUSES = new Set(["blocked", "deprecated", "archived", "removed"]);

/**
 * Return true if the given status/invocation combination is allowed.
 */
export function isValidSkillState(status, invocation) {
  const allowed = SKILL_STATE_MATRIX[status];
  if (allowed === undefined) {
    return false;
  }
  return allowed.includes(invocation);
}

/**
 * Return a diagnostic message if the combination is disallowed, otherwise null.
 */
export function validateSkillState(status, invocation, skillId = "") {
  if (!isValidSkillState(status, invocation)) {
    const allowed = SKILL_STATE_MATRIX[status] ?? [];
    const prefix = skillId ? `Skill ${skillId}` : "Skill";
    if (allowed.length === 0) {
      return `${prefix} has unsupported status: ${status}.`;
    }
    return `${prefix} with status ${status} must use one of: ${allowed.join(", ")}; got ${invocation}.`;
  }
  if (LEGACY_STATUSES.has(status)) {
    const prefix = skillId ? `Skill ${skillId}` : "Skill";
    return {
      severity: "warning",
      message: `${prefix} uses legacy status ${status}; prefer status "active" with an explicit invocation.`
    };
  }
  return null;
}
