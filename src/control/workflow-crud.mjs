import { HARNESS_STATUS_VALUES } from "../domain/constants.mjs";
import {
  addUnique,
  ensureMapAt,
  ensureSeq,
  loadConfig,
  readMapString,
  removeValue,
  requireMapAt,
  requireYamlMap,
  uniqueValues,
  writeCheckedConfig
} from "./config-write.mjs";
import { ensureCallableWorkflowSkill } from "./skill-crud.mjs";

export async function addHarness(options) {
  if (options.harness === undefined) {
    throw new Error("addHarness requires a harness name");
  }
  const { document, originalText } = await loadConfig(options.configPath);
  const harnesses = ensureMapAt(document, ["harnesses"], "harnesses");
  if (harnesses.get(options.harness, true) !== undefined) {
    throw new Error(`Harness already exists: ${options.harness}`);
  }
  const status = options.status ?? "configured";
  validateHarnessStatus(status);
  harnesses.set(options.harness, document.createNode({
    status,
    workflows: [],
    commands: options.commands ?? []
  }));
  return await writeCheckedConfig(document, originalText, options, `Added harness ${options.harness}`);
}

export async function addWorkflow(options) {
  if (options.workflow === undefined) {
    throw new Error("addWorkflow requires a workflow name");
  }
  if (options.harness === undefined) {
    throw new Error("addWorkflow requires a harness name");
  }
  const { document, originalText } = await loadConfig(options.configPath);
  const workflows = ensureMapAt(document, ["workflows"], "workflows");
  const harnesses = ensureMapAt(document, ["harnesses"], "harnesses");
  if (workflows.get(options.workflow, true) !== undefined) {
    throw new Error(`Workflow already exists: ${options.workflow}`);
  }
  const skillIds = uniqueValues(options.skills ?? []);
  const activeSkills = [];
  const validateUses = [];
  for (const skillId of skillIds) {
    const skill = requireConfigSkill(document, skillId);
    ensureCallableWorkflowSkill(skillId, skill);
    if (readMapString(skill, "status", "vendor") === "candidate" && readMapString(skill, "invocation", "manual-only") === "manual-only") {
      skill.set("status", "active");
    }
    activeSkills.push(skillId);
    validateUses.push({ skillId, workflow: options.workflow });
  }

  const harness = harnesses.get(options.harness, true);
  if (harness === undefined) {
    if (options.requireExistingHarness === true) {
      throw new Error(`Unknown harness: ${options.harness}`);
    }
    const harnessStatus = options.harnessStatus ?? "configured";
    validateHarnessStatus(harnessStatus);
    harnesses.set(options.harness, document.createNode({
      status: harnessStatus,
      workflows: [options.workflow],
      commands: []
    }));
  } else {
    addUnique(ensureSeq(requireYamlMap(harness, `harnesses.${options.harness}`), "workflows", document), options.workflow);
  }

  workflows.set(options.workflow, document.createNode({
    harness: options.harness,
    active_skills: activeSkills,
    blocked_skills: []
  }));

  return await writeCheckedConfig(
    document,
    originalText,
    { ...options, validateUses },
    `Added workflow ${options.workflow}`
  );
}

function requireConfigSkill(document, skillId) {
  const skills = requireMapAt(document, ["skills"], "skills");
  const skill = skills.get(skillId, true);
  if (skill === undefined) {
    throw new Error(`Unknown skill: ${skillId}`);
  }
  return requireYamlMap(skill, `skills.${skillId}`);
}

function validateHarnessStatus(status) {
  if (!HARNESS_STATUS_VALUES.has(status)) {
    throw new Error(`Unsupported harness status: ${status}`);
  }
}
