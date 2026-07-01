export function workflowConflictEntries(workspace, workflow) {
  const selectable = workflowSelectableSkillIds(workflow);
  const blocked = new Set(workflow.blockedSkills);
  const active = new Set(selectable.filter((skillId) => !blocked.has(skillId)));
  const entries = [];
  const seen = new Set();

  for (const skillId of active) {
    const skill = workspace.skills.find((candidate) => candidate.id === skillId);
    for (const conflictingSkill of skill?.conflictsWith ?? []) {
      if (!active.has(conflictingSkill)) {
        continue;
      }
      const key = [skillId, conflictingSkill].sort().join("\0");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      entries.push({
        workflow: workflow.name,
        skill: skillId,
        conflictingSkill
      });
    }
  }

  return entries.sort((left, right) =>
    left.workflow.localeCompare(right.workflow)
      || left.skill.localeCompare(right.skill)
      || left.conflictingSkill.localeCompare(right.conflictingSkill)
  );
}

export function workflowConflictEntriesForSkill(workspace, workflow, skillId) {
  return workflowConflictEntries(workspace, workflow).filter((entry) =>
    entry.skill === skillId || entry.conflictingSkill === skillId
  );
}

export function conflictingSkillIds(workspace, skillId) {
  const direct = workspace.skills.find((skill) => skill.id === skillId)?.conflictsWith ?? [];
  const reverse = workspace.skills
    .filter((skill) => skill.conflictsWith.includes(skillId))
    .map((skill) => skill.id);
  return uniqueStrings([...direct, ...reverse]).sort((left, right) => left.localeCompare(right));
}

export function activeConflictEntriesForSkill(workspace, skillId) {
  return workspace.workflows
    .flatMap((workflow) => workflowConflictEntriesForSkill(workspace, workflow, skillId))
    .sort((left, right) =>
      left.workflow.localeCompare(right.workflow)
        || left.skill.localeCompare(right.skill)
        || left.conflictingSkill.localeCompare(right.conflictingSkill)
    );
}

function workflowSelectableSkillIds(workflow) {
  return uniqueStrings([
    ...workflow.activeSkills,
    ...workflow.requiredCapabilities.flatMap((capability) => [
      capability.preferred,
      ...capability.fallback
    ])
  ]);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}
