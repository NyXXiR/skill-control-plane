import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { loadWorkspace } from "../src/index.mjs";

const execFileAsync = promisify(execFile);

const BIN = join(process.cwd(), "bin", "skillboard.mjs");

async function makeInitializedProject() {
  const root = await mkdtemp(join(tmpdir(), "skillboard-ux-test-"));
  await execFileAsync(process.execPath, [BIN, "init", "--dir", root, "--no-scan-installed"]);
  return {
    root,
    configPath: join(root, "skillboard.config.yaml"),
    skillsRoot: join(root, "skills"),
    async cleanup() {
      await rm(root, { recursive: true, force: true });
    }
  };
}

test("missing SKILL.md frontmatter explains what frontmatter should look like", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillboard-frontmatter-test-"));
  try {
    const configPath = join(root, "skillboard.config.yaml");
    const skillsRoot = join(root, "skills");
    const badSkill = join(skillsRoot, "bad");
    await mkdir(badSkill, { recursive: true });
    await writeFile(join(badSkill, "SKILL.md"), "# Bad Skill\n", "utf8");
    await writeFile(
      configPath,
      `version: 1\nskills:\n  bad:\n    path: bad\n    status: candidate\n    invocation: manual-only\n    exposure: exported\n`,
      "utf8"
    );

    await assert.rejects(
      () => loadWorkspace({ configPath, skillsRoot }),
      (error) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.match(message, /missing YAML frontmatter/);
        assert.match(message, /name:/);
        assert.match(message, /description:/);
        assert.match(message, /docs\/user-flow\.md/);
        return true;
      }
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("add workflow without --harness suggests available harnesses", async () => {
  const project = await makeInitializedProject();
  try {
    await execFileAsync(process.execPath, [BIN, "add", "harness", "codex", "--config", project.configPath, "--skills", project.skillsRoot]);
    const { stderr } = await execFileAsync(process.execPath, [BIN, "add", "workflow", "daily", "--config", project.configPath, "--skills", project.skillsRoot]).catch((error) => error);

    assert.match(stderr, /--harness is required/);
    assert.match(stderr, /Available harnesses: codex/);
    assert.doesNotMatch(stderr, /Usage: skillboard add workflow.*--config.*--skills/);
  } finally {
    await project.cleanup();
  }
});

test("add workflow without --harness suggests adding a harness when none exist", async () => {
  const project = await makeInitializedProject();
  try {
    const { stderr } = await execFileAsync(process.execPath, [BIN, "add", "workflow", "daily", "--config", project.configPath, "--skills", project.skillsRoot]).catch((error) => error);

    assert.match(stderr, /--harness is required/);
    assert.match(stderr, /No harnesses are configured yet/);
  } finally {
    await project.cleanup();
  }
});

test("doctor --summary prints compact status", async () => {
  const project = await makeInitializedProject();
  try {
    const summary = await execFileAsync(process.execPath, [BIN, "doctor", "--summary", "--dir", project.root]);
    const full = await execFileAsync(process.execPath, [BIN, "doctor", "--dir", project.root]);

    assert.match(summary.stdout, /SkillBoard doctor:/);
    assert.match(summary.stdout, /Workspace:/);
    assert.match(summary.stdout, /Source audit:/);
    assert.match(summary.stdout, /Policy:/);
    assert.ok(summary.stdout.split("\n").length < full.stdout.split("\n").length, "summary should be shorter than full output");
  } finally {
    await project.cleanup();
  }
});

test("commands default --skills to skills/ in cwd", async () => {
  const project = await makeInitializedProject();
  try {
    const check = await execFileAsync(process.execPath, [BIN, "check", "--config", "skillboard.config.yaml"], { cwd: project.root });
    assert.match(check.stdout, /Policy check passed/);

    const list = await execFileAsync(process.execPath, [BIN, "list", "skills", "--config", "skillboard.config.yaml"], { cwd: project.root });
    assert.match(list.stdout, /skills:/);
  } finally {
    await project.cleanup();
  }
});
