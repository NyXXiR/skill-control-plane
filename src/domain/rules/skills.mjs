import {
  LEGACY_STATUSES,
  TERMINAL_STATUSES,
  validateSkillState
} from "../skill-state-matrix.mjs";

export const skillRules = [
  {
    id: "SKILL-STATUS-001",
    check(ctx) {
      const diagnostics = [];
      for (const skill of ctx.skills) {
        diagnostics.push(...validateStatusInvocation(skill));
      }
      return diagnostics;
    }
  },
  {
    id: "SKILL-SCOPE-001",
    check(ctx) {
      const diagnostics = [];
      for (const skill of ctx.skills) {
        if (ctx.defaults.requireExplicitWorkflow && skill.invocation === "workflow-auto" && !ctx.workflowScopedSkillIds.has(skill.id)) {
          diagnostics.push(`Skill ${skill.id} uses workflow-auto but is not scoped to any workflow.`);
        }
      }
      return diagnostics;
    }
  },
  {
    id: "SKILL-GLOBAL-001",
    check(ctx) {
      const diagnostics = [];
      for (const skill of ctx.skills) {
        if (skill.invocation !== "global-auto") {
          continue;
        }
        diagnostics.push({
          severity: "warning",
          message: `Skill ${skill.id} is global-auto; prefer workflow-auto or router-only.`
        });
        if (skill.exposure !== "global-meta") {
          diagnostics.push(`Skill ${skill.id} uses global-auto but is not exposure: global-meta.`);
        }
      }
      return diagnostics;
    }
  },
  {
    id: "SKILL-REF-001",
    check(ctx) {
      const diagnostics = [];
      for (const skill of ctx.skills) {
        if (skill.replacedBy !== undefined && !ctx.skillsById.has(skill.replacedBy)) {
          diagnostics.push(`Skill ${skill.id} replaced_by points to undeclared skill: ${skill.replacedBy}`);
        }
        for (const capabilityName of skill.canonicalFor) {
          const capability = ctx.capabilitiesByName.get(capabilityName);
          if (capability === undefined) {
            diagnostics.push(`Skill ${skill.id} canonical_for references undeclared capability: ${capabilityName}`);
          } else if (capability.canonical !== skill.id) {
            diagnostics.push(`Skill ${skill.id} claims canonical_for ${capabilityName} but capability canonical is ${capability.canonical || "none"}.`);
          }
        }
        for (const skillId of skill.conflictsWith) {
          if (!ctx.skillsById.has(skillId)) {
            diagnostics.push(`Skill ${skill.id} conflicts_with undeclared skill: ${skillId}`);
          }
        }
      }
      return diagnostics;
    }
  },
  {
    id: "SKILL-OWNER-001",
    check(ctx) {
      const diagnostics = [];
      for (const skill of ctx.skills) {
        if (skill.ownerInstallUnit !== undefined && !ctx.installUnitsById.has(skill.ownerInstallUnit)) {
          diagnostics.push(`Skill ${skill.id} owner_install_unit points to undeclared install unit: ${skill.ownerInstallUnit}`);
        }
        if (skill.exposure === "unit-managed" && skill.ownerInstallUnit === undefined) {
          diagnostics.push(`Skill ${skill.id} is unit-managed but does not declare owner_install_unit.`);
        }
        const owner = skill.ownerInstallUnit === undefined ? undefined : ctx.installUnitsById.get(skill.ownerInstallUnit);
        if (owner !== undefined && !owner.components.skills.includes(skill.id)) {
          diagnostics.push(`Skill ${skill.id} declares owner_install_unit ${owner.id} but is not listed in its component skills.`);
        }
      }
      return diagnostics;
    }
  }
];

function validateStatusInvocation(skill) {
  const diagnostics = [];
  const result = validateSkillState(skill.status, skill.invocation, skill.id);
  if (result !== null) {
    diagnostics.push(result);
  }
  if (["active", "canonical"].includes(skill.status) && TERMINAL_STATUSES.has(skill.invocation)) {
    diagnostics.push(`Active skill ${skill.id} cannot use invocation: ${skill.invocation}.`);
  }
  return diagnostics;
}
