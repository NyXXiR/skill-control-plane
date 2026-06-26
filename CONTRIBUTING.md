# Contributing to SkillBoard

SkillBoard is the policy and visibility layer above agent skill installers and marketplaces. Contributions that keep the control plane reviewable, safe-by-default, and workflow-scoped are welcome.

## Development Environment

- Node.js **20 or newer**
- npm (comes with Node.js)
- One dependency: [`yaml`](https://www.npmjs.com/package/yaml)

```bash
git clone https://github.com/NyXXiR/skillboard.git
cd skillboard
npm install
```

## Running Tests

```bash
# Syntax check + TypeScript diagnostics + full test suite
npm run check

# TypeScript diagnostics only
npm run diagnostics

# Node.js test runner only
node --test

# Focused test pattern
node --test --test-name-pattern "frontmatter" test/first-time-ux.test.mjs
```

Cross-platform CI runs on Ubuntu, macOS, and Windows with Node 20 and 22.

## Project Layout

| Path | Purpose |
|------|---------|
| `bin/skillboard.mjs` | CLI entrypoint |
| `src/cli.mjs` | Command router and text/JSON renderers |
| `src/control.mjs` | Skill/workflow/harness CRUD, `can-use`, `guard`, source classification |
| `src/workspace.mjs` | Config parsing and `SKILL.md` discovery |
| `src/doctor.mjs` | `doctor`/`status` health report |
| `src/policy.mjs`, `src/domain/rules/*.mjs` | Policy engine |
| `src/agent-inventory.mjs` | Installed agent skill scanning |
| `src/brief-cli.mjs`, `src/brief-renderer.mjs`, `src/advisor.mjs` | AI/ user brief and action cards |
| `src/impact.mjs`, `src/reconcile.mjs` | Impact and reconcile analysis |
| `src/init.mjs`, `src/uninstall.mjs`, `src/lifecycle-cli.mjs`, `src/lifecycle-content.mjs` | Bootstrap and teardown |
| `src/source-profiles.mjs`, `profiles/*.yaml` | Source profile loader and built-in profiles |
| `docs/*.md` | User and contributor docs |
| `examples/` | Runnable fixtures |
| `test/` | Tests using Node.js built-in test runner |

## Adding a Built-In Source Profile

Source profiles keep SkillBoard data-driven instead of hardcoding repository layouts. See [docs/profiles.md](docs/profiles.md) for the full authoring guide.

Short version:

1. Create `profiles/<namespace>.<repo-name>.yaml`.
2. Add the profile id to `src/source-profiles.mjs` built-in list or load it explicitly.
3. Add a test fixture under `examples/` or `test/fixtures/`.
4. Add a test in `test/source-profiles.test.mjs` or `test/multi-source-integration.test.mjs`.
5. Run `npm run check`.

## Coding Conventions

- ESM only (`"type": "module"`).
- Prefer Node.js built-ins; keep dependencies minimal.
- Write targeted tests before changing behavior when feasible.
- Keep CLI errors actionable: suggest the next command or list available values.
- Preserve backward compatibility for public CLI arguments.
- Update docs when adding or changing commands.

## Before Submitting

```bash
npm run check
git diff --check
npm pack --dry-run --json
```

Ensure new docs are listed in `package.json` `files` if they should ship with the npm package.
