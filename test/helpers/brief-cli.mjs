import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export async function runCli(args) {
  try {
    const result = await execFileAsync(process.execPath, [join(repoRoot, "bin/skillboard.mjs"), ...args], {
      cwd: repoRoot
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

export async function withInitializedEmptyProject(run) {
  const root = await mkdtemp(join(tmpdir(), "skillboard-brief-empty-cli-"));
  try {
    const initResult = await runCli(["init", "--dir", root, "--no-scan-installed"]);
    assert.equal(initResult.code, 0);
    return await run({
      root,
      configPath: join(root, "skillboard.config.yaml"),
      skillsRoot: join(root, "skills")
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

export function sectionBetween(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  assert.notEqual(start, -1, `missing section ${startHeading}`);
  const contentStart = start + startHeading.length;
  const end = text.indexOf(endHeading, contentStart);
  assert.notEqual(end, -1, `missing section ${endHeading}`);
  return text.slice(contentStart, end);
}

export function assertNoApplyCommands(value) {
  if (value === null || typeof value !== "object") {
    return;
  }
  if (Object.hasOwn(value, "apply")) {
    assert.equal(value.apply, null);
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const entry of child) {
        assertNoApplyCommands(entry);
      }
    } else {
      assertNoApplyCommands(child);
    }
  }
}
