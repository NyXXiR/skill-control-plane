import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { withActionsFixture } from "./helpers/advisor-brief-actions.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillboardBin = join(repoRoot, "bin/skillboard.mjs");

test("apply-action rejects multiple positional action ids before mutation", async () => {
  await assertMultipleActionIdsRejected([
    "apply-action",
    "review-install-unit:medium.pack",
    "trust-install-unit:safe.pack",
    "--yes",
    "--json"
  ]);
});

test("apply-action rejects extra action ids after boolean flags before mutation", async () => {
  await assertMultipleActionIdsRejected([
    "apply-action",
    "review-install-unit:medium.pack",
    "--yes",
    "--json",
    "trust-install-unit:safe.pack"
  ]);
});

async function assertMultipleActionIdsRejected(args) {
  await withActionsFixture(async (paths) => {
    const originalConfig = await readFile(paths.configPath, "utf8");
    const result = await runSkillboard([
      ...args,
      "--workflow",
      "agent",
      "--config",
      paths.configPath,
      "--skills",
      paths.skillsRoot
    ]);
    const afterConfig = await readFile(paths.configPath, "utf8");

    assert.equal(afterConfig, originalConfig);
    assert.notEqual(result.exitCode, 0);

    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "multiple-action-ids");
    assert.match(payload.error.message, /one action/i);
  });
}

async function runSkillboard(args) {
  try {
    const result = await execFileAsync(process.execPath, [skillboardBin, ...args], {
      cwd: repoRoot
    });
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      exitCode: typeof error.code === "number" ? error.code : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? ""
    };
  }
}
