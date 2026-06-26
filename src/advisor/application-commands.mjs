import {
  command,
  workflowResolved
} from "./action-core.mjs";

export function withApplicationCommands(actions, { paths, workflow }) {
  return actions.map((action) => {
    return {
      ...action,
      application: applicationCommand(action, paths, workflow)
    };
  });
}

function applicationCommand(action, paths, workflow) {
  const blockedReason = applicationBlockedReason(action, workflow);
  if (blockedReason !== null) {
    return {
      preview: null,
      apply: null,
      blocked_reason: blockedReason
    };
  }

  const base = [
    "skillboard", "apply-action", action.id,
    ...workflowArgs(workflow),
    "--dir", paths.root,
    "--config", paths.configPath,
    "--skills", paths.skillsRoot,
    "--json"
  ];
  return {
    preview: command([...base, "--dry-run"]),
    apply: command([...base, "--yes", ...destructiveArgs(action)]),
    blocked_reason: null
  };
}

function applicationBlockedReason(action, workflow) {
  if (action.blocked_reason !== null) {
    return action.blocked_reason;
  }
  if (action.apply === null) {
    return "Action cannot be applied directly.";
  }
  if (!workflowResolved(workflow)) {
    return workflow.blocked_reason ?? "Select a workflow before applying action cards.";
  }
  return null;
}

function workflowArgs(workflow) {
  return workflowResolved(workflow) ? ["--workflow", workflow.selected] : [];
}

function destructiveArgs(action) {
  return action.kind === "reset-cleanup" ? ["--allow-destructive"] : [];
}
