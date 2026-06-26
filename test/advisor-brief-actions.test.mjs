import assert from "node:assert/strict";
import { test } from "node:test";
import { recommendTrustLevel } from "../src/advisor/trust-policy.mjs";
import {
  actionByKindAndTarget,
  actionsByKind,
  assertCommandObject,
  assertApplicationCommandObject,
  assertNoBareCommandStrings,
  parsedBrief,
  pathExists,
  withActionsFixture,
  withMissingProvenanceFixture
} from "./helpers/advisor-brief-actions.mjs";

test("trust recommendation blocks high-risk skill and harness bundles", () => {
  assert.equal(
    recommendTrustLevel({
      id: "risky.skill.pack",
      kind: "skill",
      source: "https://example.invalid/risky-skill",
      permissionRisk: "high",
      trustLevel: "unreviewed"
    }),
    "blocked"
  );
  assert.equal(
    recommendTrustLevel({
      id: "risky.harness.pack",
      kind: "harness",
      source: "https://example.invalid/risky-harness",
      permissionRisk: "high",
      trustLevel: "unreviewed"
    }),
    "blocked"
  );
});

test("brief actions reviewed mattpocock skill can be activated with command objects", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const action = actionByKindAndTarget(brief, "activate-skill", "matt.tdd");

    assert.ok(action);
    assert.ok(["medium", "high"].includes(action.risk));
    assert.equal(action.requires_user_confirmation, true);
    assertCommandObject(action.dry_run);
    assertCommandObject(action.apply);
    assertApplicationCommandObject(action.application.preview, action.id);
    assertApplicationCommandObject(action.application.apply, action.id);
    assert.ok(action.dry_run.argv.includes("--dry-run"));
    assert.ok(action.application.preview.argv.includes("--dry-run"));
    assert.ok(action.application.preview.argv.includes("--workflow"));
    assert.ok(action.application.preview.argv.includes("agent"));
    assert.ok(action.application.apply.argv.includes("--yes"));
    assertNoBareCommandStrings(brief.actions);
  });
});

test("brief actions unreviewed high-risk source gets block action before activation", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const blockAction = actionByKindAndTarget(brief, "block-install-unit", "omo.pack");
    const omoActivate = actionByKindAndTarget(brief, "activate-skill", "omo.runtime");

    assert.ok(brief.review_queue.some((entry) => entry.id === "install_unit:omo.pack"));
    assert.ok(blockAction);
    assert.match(blockAction.label, /Decide whether to block source omo\.pack/);
    assert.match(blockAction.reason, /one-time decision/i);
    assert.equal(blockAction.requires_user_confirmation, true);
    assertCommandObject(blockAction.dry_run);
    assertCommandObject(blockAction.apply);
    assertApplicationCommandObject(blockAction.application.preview, blockAction.id);
    assertApplicationCommandObject(blockAction.application.apply, blockAction.id);
    assert.ok(blockAction.dry_run.argv.includes("--trust-level"));
    assert.ok(blockAction.dry_run.argv.includes("blocked"));
    assert.equal(omoActivate?.apply ?? null, null);
  });
});

test("brief actions link review queue entries to recommended install-unit actions", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const expectedActionByUnit = new Map([
      ["medium.pack", "review-install-unit:medium.pack"],
      ["omo.pack", "block-install-unit:omo.pack"],
      ["runtime.low", "review-install-unit:runtime.low"],
      ["safe.pack", "trust-install-unit:safe.pack"]
    ]);
    const checkedUnits = new Set();

    for (const entry of brief.review_queue) {
      if (entry.kind !== "install_unit") {
        continue;
      }
      const unitId = entry.advanced.install_unit ?? entry.advanced.source_id;
      const expectedAction = expectedActionByUnit.get(unitId);
      if (expectedAction !== undefined) {
        checkedUnits.add(unitId);
        assert.ok(
          entry.action_ids.includes(expectedAction),
          `${entry.id} should link ${expectedAction}`
        );
      }
    }

    assert.deepEqual(checkedUnits, new Set(expectedActionByUnit.keys()));
  });
});

test("brief actions unreviewed medium-risk source gets review action", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const reviewAction = actionByKindAndTarget(brief, "review-install-unit", "medium.pack");

    assert.ok(reviewAction);
    assert.equal(reviewAction.requires_user_confirmation, true);
    assertCommandObject(reviewAction.dry_run);
    assertCommandObject(reviewAction.apply);
    assert.ok(reviewAction.dry_run.argv.includes("--trust-level"));
    assert.ok(reviewAction.dry_run.argv.includes("reviewed"));
  });
});

test("brief actions unreviewed low-risk source gets trust action", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const trustAction = actionByKindAndTarget(brief, "trust-install-unit", "safe.pack");

    assert.ok(trustAction);
    assert.equal(trustAction.requires_user_confirmation, true);
    assert.doesNotMatch(trustAction.reason, /user-controlled/i);
    assertCommandObject(trustAction.dry_run);
    assertCommandObject(trustAction.apply);
    assert.ok(trustAction.dry_run.argv.includes("--trust-level"));
    assert.ok(trustAction.dry_run.argv.includes("trusted"));
  });
});

test("brief actions low-risk runtime source gets review action", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const reviewAction = actionByKindAndTarget(brief, "review-install-unit", "runtime.low");
    const trustAction = actionByKindAndTarget(brief, "trust-install-unit", "runtime.low");

    assert.ok(reviewAction);
    assert.equal(trustAction, undefined);
    assert.equal(reviewAction.requires_user_confirmation, true);
    assertCommandObject(reviewAction.dry_run);
    assertCommandObject(reviewAction.apply);
    assert.ok(reviewAction.dry_run.argv.includes("--trust-level"));
    assert.ok(reviewAction.dry_run.argv.includes("reviewed"));
  });
});

test("brief actions ambiguous workflow removes every apply boundary", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths);

    assert.equal(brief.workflow.selected, null);
    assert.equal(brief.workflow.needs_selection, true);
    assert.ok(brief.actions.length > 0);
    for (const action of brief.actions) {
      assert.equal(action.apply, null);
      assert.equal(action.application.preview, null);
      assert.equal(action.application.apply, null);
      assert.match(action.application.blocked_reason, /workflow/i);
    }
  });
});

test("brief actions missing provenance blocks trust and activation apply commands", async () => {
  await withMissingProvenanceFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const action = actionByKindAndTarget(brief, "activate-skill", "broken.auto");

    assert.ok(action);
    assert.equal(action.apply, null);
    assert.equal(action.dry_run, null);
    assert.equal(action.application.preview, null);
    assert.equal(action.application.apply, null);
    assert.match(action.blocked_reason, /owner_install_unit|provenance/i);
    assert.equal(actionsByKind(brief, "review-install-unit").length, 0);
  });
});

test("brief actions hook install is a dry-run-backed command suggestion only", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const [action] = actionsByKind(brief, "hook-install");

    assert.ok(action);
    assertCommandObject(action.dry_run);
    assertCommandObject(action.apply);
    assertApplicationCommandObject(action.application.preview, action.id);
    assertApplicationCommandObject(action.application.apply, action.id);
    assert.ok(action.dry_run.argv.includes("hook"));
    assert.ok(action.dry_run.argv.includes("install"));
    assert.ok(action.dry_run.argv.includes("--dry-run"));
    assert.ok(action.apply.argv.includes("hook"));
    assert.ok(action.apply.argv.includes("install"));
    assert.equal(await pathExists(`${paths.root}/.skillboard/hooks/skillboard-guard-agent.sh`), false);
  });
});

test("brief actions force remove and reset cleanup require high-risk confirmation", async () => {
  await withActionsFixture(async (paths) => {
    const brief = await parsedBrief(paths, { workflow: "agent" });
    const removeAction = actionByKindAndTarget(brief, "remove-skill-force", "user.blocked");
    const [resetAction] = actionsByKind(brief, "reset-cleanup");

    for (const action of [removeAction, resetAction]) {
      assert.ok(action);
      assert.equal(action.requires_user_confirmation, true);
      assert.ok(["high", "destructive"].includes(action.risk));
      assertCommandObject(action.dry_run);
      assertApplicationCommandObject(action.application.preview, action.id);
      assertApplicationCommandObject(action.application.apply, action.id);
    }
    assert.ok(resetAction.application.apply.argv.includes("--allow-destructive"));
  });
});

test("brief actions have deterministic ids and ordering", async () => {
  await withActionsFixture(async (paths) => {
    const first = await parsedBrief(paths, { workflow: "agent" });
    const second = await parsedBrief(paths, { workflow: "agent" });

    assert.deepEqual(second.actions.map((action) => action.id), first.actions.map((action) => action.id));
    assert.equal(JSON.stringify(second.actions), JSON.stringify(first.actions));
  });
});
