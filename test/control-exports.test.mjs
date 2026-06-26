import assert from "node:assert/strict";
import { test } from "node:test";

const EXPECTED_EXPORTS = [
  "activateSkill",
  "addHarness",
  "addSkill",
  "addWorkflow",
  "auditSources",
  "blockSkill",
  "canUseSkill",
  "classifySkillSource",
  "classifySkillTrust",
  "explainSkill",
  "installGuardHook",
  "listHarnesses",
  "listInstallUnits",
  "listSkills",
  "listWorkflows",
  "planGuardHookInstall",
  "preferSkill",
  "quarantineSkill",
  "removeSkill"
];

test("control.mjs exposes the expected public API", async () => {
  const control = await import("../src/control.mjs");

  for (const name of EXPECTED_EXPORTS) {
    assert.ok(name in control, `Expected export ${name} is missing`);
    assert.equal(typeof control[name], "function", `Export ${name} should be a function`);
  }
});

test("index.mjs exposes the expected control-derived public API", async () => {
  const index = await import("../src/index.mjs");
  const expected = [
    "activateSkill",
    "addHarness",
    "addSkill",
    "addWorkflow",
    "auditSources",
    "blockSkill",
    "canUseSkill",
    "explainSkill",
    "installGuardHook",
    "listHarnesses",
    "listInstallUnits",
    "listSkills",
    "listWorkflows",
    "preferSkill",
    "quarantineSkill",
    "removeSkill"
  ];

  for (const name of expected) {
    assert.ok(name in index, `Expected index export ${name} is missing`);
  }
});
