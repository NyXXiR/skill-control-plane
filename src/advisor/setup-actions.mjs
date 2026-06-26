import { command, makeAction } from "./action-core.mjs";

export function buildSetupGuidanceActions({ paths, workflow, skills, reviewQueue, workspace }) {
  if (!isInitializedEmptyWorkspace(workflow, skills, reviewQueue, workspace)) {
    return [];
  }
  return [makeAction({
    kind: "setup-guidance",
    targetId: paths.root,
    label: "Start setup by refreshing inventory",
    reason: "This initialized project has no usable skills or workflows yet. Discover installed agent assets, then add a harness and workflow when ready.",
    risk: "low",
    dryRun: command([
      "skillboard", "inventory", "refresh",
      "--dir", paths.root,
      "--config", paths.configPath,
      "--dry-run",
      "--json"
    ]),
    apply: null,
    appliesTo: { kind: "project", id: paths.root },
    blockedReason: null,
    advanced: { root: paths.root, config_path: paths.configPath }
  })];
}

function isInitializedEmptyWorkspace(workflow, skills, reviewQueue, workspace) {
  return workflow.selected === null
    && workflow.needs_selection === false
    && workflow.unknown === false
    && arrayEmpty(workflow.candidates)
    && Object.values(skills).every(arrayEmpty)
    && arrayEmpty(reviewQueue)
    && arrayEmpty(workspace.skills)
    && arrayEmpty(workspace.workflows)
    && arrayEmpty(workspace.harnesses)
    && arrayEmpty(workspace.installUnits);
}

function arrayEmpty(value) {
  return Array.isArray(value) && value.length === 0;
}
