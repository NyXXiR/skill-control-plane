import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("README proof fixture shows raw list misses policy failure", async () => {
  const rawList = await runSkillboard([
    "list",
    "skills",
    "--config",
    "examples/skillboard.config.yaml",
    "--skills",
    "examples/skills",
    "--workflow",
    "codex-night-workflow"
  ]);
  const brief = await runSkillboard([
    "brief",
    "--config",
    "examples/skillboard.config.yaml",
    "--skills",
    "examples/skills",
    "--workflow",
    "codex-night-workflow"
  ]);

  assert.equal(rawList.code, 0);
  assert.equal(skillRows(rawList.stdout).length, 4);
  assert.match(rawList.stdout, /matt\.tdd\tactive\tworkflow-auto/);
  assert.doesNotMatch(rawList.stdout, /Policy errors/);

  assert.equal(brief.code, 1);
  assert.match(brief.stdout, /AI can use now: 0 \(0 automatic, 0 manual\)/);
  assert.match(brief.stdout, /Blocked for safety: 8/);
  assert.match(brief.stdout, /Policy errors: 2/);
  assert.match(brief.stdout, /Policy warnings: 1/);
  assert.match(brief.stdout, /Capability requirement requirement-clarification in workflow requirement-review lists fallback non-callable skill matt\.grill-with-docs/);
});

test("README proof fixture shows action cards re-resolve usable state", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillboard-readme-proof-"));
  try {
    await cp(resolve("examples/multi-source.config.yaml"), join(root, "skillboard.config.yaml"));
    await cp(resolve("examples/multi-source-skills"), join(root, "skills"), { recursive: true });
    await cp(resolve("AGENTS.md"), join(root, "AGENTS.md"));
    await cp(resolve("CLAUDE.md"), join(root, "CLAUDE.md"));

    const args = [
      "--dir",
      root,
      "--config",
      join(root, "skillboard.config.yaml"),
      "--skills",
      join(root, "skills"),
      "--workflow",
      "codex-night-workflow"
    ];
    const before = await runSkillboard(["brief", ...args, "--include-actions", "--json"]);
    const beforePayload = JSON.parse(before.stdout);
    const apply = await runSkillboard([
      "apply-action",
      "activate-skill:anthropic.docx",
      ...args,
      "--yes",
      "--json"
    ]);
    const after = await runSkillboard(["brief", ...args, "--json"]);
    const afterPayload = JSON.parse(after.stdout);

    assert.equal(before.code, 0);
    assert.equal(usableCount(beforePayload), 2);
    assert.ok(beforePayload.actions.some((action) => action.id === "activate-skill:anthropic.docx"));

    assert.equal(apply.code, 0);
    assert.equal(JSON.parse(apply.stdout).changed, true);

    assert.equal(after.code, 0);
    assert.equal(usableCount(afterPayload), 3);
    assert.deepEqual(afterPayload.skills.automatic_allowed.map((skill) => skill.id), ["matt.tdd"]);
    assert.deepEqual(afterPayload.skills.manual_allowed.map((skill) => skill.id), [
      "anthropic.docx",
      "private.tdd-work-continuity"
    ]);
    assert.equal(afterPayload.health.policy.errors.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("README links to the reproducible value proof report", async () => {
  const readme = await readFile(resolve("README.md"), "utf8");
  const proof = await readFile(resolve("docs/value-proof.md"), "utf8");

  assert.match(readme, /## Tested Value Proof/);
  assert.match(readme, /\[full reproducible proof\]\(docs\/value-proof\.md\)/);
  assert.match(readme, /## Why Not Just List `\/skills`\?/);
  assert.match(readme, /A skill list answers what is declared/);
  assert.match(readme, /SkillBoard answers what can safely run\s+now/);
  assert.match(readme, /Same fixture, different answer/);
  assert.match(readme, /A raw list says `matt\.tdd` is active/);
  assert.match(readme, /SkillBoard says the workflow has 0 usable\s+skills/);
  assert.match(readme, /Question/);
  assert.match(readme, /Raw list/);
  assert.match(readme, /SkillBoard brief/);
  assert.match(readme, /0 usable skills/);
  assert.match(readme, /8 blocked skills/);
  assert.match(readme, /Policy errors: 2/);

  assert.match(proof, /node --test test\/readme-value-proof\.test\.mjs/);
  assert.match(proof, /GitHub-reader takeaway/);
  assert.match(proof, /The raw list answers inventory questions/);
  assert.match(proof, /SkillBoard answers operational safety questions/);
  assert.match(proof, /Raw skill list/);
  assert.match(proof, /4 workflow-linked rows/);
  assert.match(proof, /matt\.tdd active workflow-auto/);
  assert.match(proof, /SkillBoard brief/);
  assert.match(proof, /0 usable skills/);
  assert.match(proof, /8 blocked skills/);
  assert.match(proof, /Policy errors: 2/);
  assert.match(proof, /Policy warnings: 1/);
  assert.match(proof, /action-card flow/);
  assert.match(proof, /usable skills: 2 -> 3/);
  assert.match(proof, /anthropic\.docx/);
});

async function runSkillboard(args) {
  try {
    const result = await execFileAsync(process.execPath, ["bin/skillboard.mjs", ...args], {
      cwd: resolve(".")
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

function skillRows(stdout) {
  return stdout.split("\n").filter((line) => line.trim().length > 0);
}

function usableCount(brief) {
  return brief.skills.automatic_allowed.length + brief.skills.manual_allowed.length;
}
