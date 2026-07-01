# SkillBoard Product Readiness Handoff

- Date: 2026-06-30
- From: Codex
- To: Hermes
- Repo: `/home/nyxxir/skillboard`
- Status: paused for handoff, not product-complete

## Hermes Update — 2026-07-01 Cross-OS Commit/Push Prep

The user explicitly asked Hermes to check that macOS/Ubuntu/Windows should not fail, then commit and push the product-readiness batch.

- Plan:
  `.agent-work/20260701-061031-skillboard-cross-os-commit-push/PLAN.md`
- Pre-push evidence artifacts:
  `.agent-work/20260701-061031-skillboard-cross-os-commit-push/pre-push-verification-summary.json`
  `.agent-work/20260701-061031-skillboard-cross-os-commit-push/npm-ci.log`
  `.agent-work/20260701-061031-skillboard-cross-os-commit-push/npm-run-check-after-npm-ci.log`
  `.agent-work/20260701-061031-skillboard-cross-os-commit-push/package-lifecycle-smoke-after-npm-ci.log`
- GitHub Actions matrix inspected:
  `.github/workflows/check.yml` runs `ubuntu-latest`, `macos-latest`, and `windows-latest` over Node 20/22 with `npm ci`, `npm run check`, and `node .github/scripts/ci-package-lifecycle-smoke.mjs`.
- Local CI-entrypoint checks passed before staging:
  - `npm ci` passed.
  - `npm run check` passed with 285 tests.
  - `node .github/scripts/ci-package-lifecycle-smoke.mjs` passed.
  - `git diff --check` passed.
  - `npm pack --dry-run --json` confirmed required runtime/docs are included and internal `.agent-work/*`, `docs/plan/hermes/*`, and `test/*` are excluded from the npm package.
  - Static/secret scan found no real findings. One naive `token` hit was manually reviewed as `const matchedToken = canonicalRouteToken(token);`, a route-scoring variable rather than a secret.
- Status:
  pre-push checks are green. Actual macOS/Windows proof requires the GitHub Actions run after push; Hermes should monitor the pushed commit and fix any matrix failure before claiming final completion.

## Hermes Update — 2026-06-30 Packed Runtime QA

Hermes ran one more product-readiness QA pass focused on the packed/public runtime path:

- Plan:
  `.agent-work/20260630-165651-skillboard-packed-runtime-qa/PLAN.md`
- QA artifacts:
  `.agent-work/20260630-165651-skillboard-packed-runtime-qa/packed-runtime-qa-summary.json`
  `.agent-work/20260630-165651-skillboard-packed-runtime-qa/packed-runtime-qa.log`
  `.agent-work/20260630-165651-skillboard-packed-runtime-qa/verification-summary.json`
- Completion log:
  `/home/nyxxir/.agents/work-log/hermes/2026-06-30-skillboard-packed-runtime-qa.md`
- Purpose:
  verify that the current dirty product-readiness worktree still works when
  packed and invoked like a public user would run it, not only from source-tree
  tests.
- Result:
  packed tarball fresh-project QA passed with no product code changes needed.
  The test used `npx --yes --package <tarball> skillboard ...` and exercised
  `help`, `init --no-scan-installed`, generated `AGENTS.md`/`CLAUDE.md`,
  `doctor --summary`, `status --json`, workflow-scoped
  `brief --intent --json --include-actions`, `guard use`, `route`,
  `apply-action --dry-run --json`, and a no-match clarification path.
- Package evidence:
  `npm pack --dry-run --json` reported `agent-skillboard@0.1.2`, `108` entries,
  unpacked size `584187`, with public runtime/docs included and `.agent-work/*`,
  `docs/plan/hermes/*`, and `test/*` excluded.
- Verification observed by Hermes:
  - Packed runtime QA script passed:
    `node .agent-work/20260630-165651-skillboard-packed-runtime-qa/packed-runtime-qa.mjs`.
  - Focused public-surface tests passed:
    `node --test test/lifecycle-cli.test.mjs test/first-time-ux.test.mjs test/ecosystem-docs.test.mjs test/brief-cli.test.mjs test/package.test.mjs`
    with 63 passing tests.
  - Package lifecycle smoke passed:
    `node .github/scripts/ci-package-lifecycle-smoke.mjs`.
  - Full check passed:
    `npm run check` with 285 passing tests.
  - Whitespace: `git diff --check` passed.
  - Added-line secret/static scan found 0 findings.
  - Direct trailing-whitespace scan on focus artifacts/files found 0 findings.
  - Independent no-edit QA retry reported no runtime blockers; its only
    should-fix was to update PLAN/handoff traceability, now done.
- Status:
  this QA pass is verified. The broader product-readiness batch is still not
  committed or pushed. Do not stage, commit, or push unless the user explicitly
  asks.

## Hermes Update — 2026-06-30 Continuation

Hermes continued the broader product-readiness goal after the synthetic routing QA slice:

- Plan:
  `.agent-work/20260630-151450-skillboard-product-readiness-continuation/PLAN.md`
- Completion log:
  `/home/nyxxir/.agents/work-log/hermes/2026-06-30-skillboard-product-readiness-continuation.md`
- Purpose:
  audit remaining install/first-run/docs/package friction and close the highest-value
  blocker with TDD.
- Result:
  init/quickstart surfaces now consistently stay on the no-prompt explicit
  package/binary form, including `_npx` runtime output and GitHub package specs:
  `npx --yes --package <packageSpec> skillboard ...`.
- Hermes bridge docs were tightened so agent guidance uses workflow-scoped
  `brief`, `brief --intent`, `brief --include-actions`, and workflow-scoped
  `apply-action` command examples.
- Public quickstart docs now explain that if `init` prints no workflow, users or
  agents should use the unscoped `brief` command printed by `init` instead.
- Main files touched in this Hermes continuation slice:
  - `src/lifecycle-cli.mjs`
  - `test/first-time-ux.test.mjs`
  - `test/lifecycle-cli.test.mjs`
  - `test/ecosystem-docs.test.mjs`
  - `README.md`
  - `docs/install.md`
  - `docs/reference.md`
  - `.agent-work/20260630-151450-skillboard-product-readiness-continuation/PLAN.md`
  - `docs/plan/hermes/20260630-skillboard-product-readiness-handoff.md`
- Verification observed by Hermes:
  - Focused lifecycle/docs tests passed, including final
    `node --test test/lifecycle-cli.test.mjs test/first-time-ux.test.mjs test/ecosystem-docs.test.mjs`
    with 31 passing tests.
  - Full check: `npm run check` passed 285 tests.
  - Whitespace: `git diff --check` passed.
  - Package lifecycle smoke: `node .github/scripts/ci-package-lifecycle-smoke.mjs` passed.
  - Added-line secret/static scan found 0 findings.
  - Direct trailing-whitespace scan on focus files found 0 findings.
  - `npm pack --dry-run --json` confirmed public runtime/docs are included and
    internal `.agent-work/*` plus `docs/plan/hermes/*` are excluded.
  - Independent no-edit review reported no blockers and no should-fix items.
- Status:
  this slice is verified. The broader product-readiness batch is still not
  committed or pushed. Do not stage, commit, or push unless the user explicitly
  asks.

## Hermes Update — 2026-06-30 Synthetic Routing QA

Hermes completed the next small product-readiness slice after this handoff:

- Plan:
  `.agent-work/20260630-092828-skillboard-synthetic-routing-qa/PLAN.md`
- Completion log:
  `/home/nyxxir/.agents/work-log/hermes/2026-06-30-skillboard-synthetic-routing-qa.md`
- Purpose:
  validate AI-facing `route`/`brief`/`guard` behavior in a synthetic project with
  overlapping local skills, a denied preferred external skill, and allowed local
  fallback candidates.
- Result:
  synthetic QA found a real tie-breaker bug where a mixed implementation +
  handoff request could pick `handoff-continuity` instead of
  `test-first-implementation`. A focused RED test was added, then `src/route.mjs`
  was fixed so capability candidates also score their bound skill metadata before
  falling back to deterministic ordering.
- Main files touched in the Hermes slice:
  - `src/route.mjs`
  - `test/cli.test.mjs`
  - `.agent-work/20260630-092828-skillboard-synthetic-routing-qa/PLAN.md`
  - `docs/plan/hermes/20260630-skillboard-product-readiness-handoff.md`
- Verification observed by Hermes:
  - Route-focused tests: `node --test --test-name-pattern "cli route" test/cli.test.mjs`
    passed 7 tests.
  - Brief CLI tests: `node --test test/brief-cli.test.mjs` passed 23 tests.
  - Full check: `npm run check` passed 284 tests.
  - Whitespace: `git diff --check` passed.
- Status:
  this slice is verified, but the broader product-readiness goal is still not
  product-complete. Do not commit or push unless the user explicitly asks.

## Latest Stop Point

Codex stopped because the user explicitly said to stop for the day and leave a
document for Hermes to continue from.

Do not treat the product-readiness goal as complete. The worktree is dirty and
contains multiple completed product-readiness slices that have not been committed
in this session.

Most recent completed slice:

- Plan:
  `.agent-work/20260630-090455-skillboard-no-prompt-quickstart/PLAN.md`
- Purpose:
  make the README/install primary quick start no-prompt by default, using
  `npx --yes --package agent-skillboard skillboard ...` instead of the
  prompt-prone `npx agent-skillboard ...` shorthand.
- Main files touched in that slice:
  - `README.md`
  - `docs/install.md`
  - `test/ecosystem-docs.test.mjs`
  - `test/readme-value-proof.test.mjs`
- Verification observed by Codex:
  - Red state first:
    `node --test test/ecosystem-docs.test.mjs test/readme-value-proof.test.mjs`
    failed because README still led with `npx agent-skillboard ...`.
  - Focused green:
    `node --test test/ecosystem-docs.test.mjs test/readme-value-proof.test.mjs`
    passed 22 tests.
  - Manual public-surface QA:
    packed the current repo to `agent-skillboard-0.1.2.tgz`, then used
    `npx --yes --package <tarball> skillboard ...` in a temp project.
    `init`, generated bridge, `doctor --summary`, `brief --workflow`, and
    `brief --intent ... --json` worked; routing selected `user.test-first`.
  - Full check:
    `npm run check` passed with 283 tests.
  - Whitespace:
    `git diff --check` passed.

The shared completion log for this last slice was intentionally not written
because the user asked to stop and leave a handoff document. This handoff is the
resume artifact.

## User Goal

Bring SkillBoard to a product-ready state where:

- users can install and start using it easily;
- AI agents can keep the user's normal workflow moving without repeated
  permission prompts;
- SkillBoard gives effective skill suggestions from user intent;
- the product demonstrates clear practical value when many skills are present.

Important UX decision from the user:

- Do not ask the user for permission every time an allowed skill is useful.
- The AI should run/check SkillBoard automatically, then disclose usage clearly
  at the start and end of the task.
- Current exact disclosure templates are:
  - `I will use <skill-id> for this request.`
  - `I used <skill-id> for this request.`

## Current Direction

SkillBoard is being positioned less as a CLI the human constantly operates and
more as a control surface that the AI reads and uses on the user's behalf.

The important loop is:

1. User makes a normal request.
2. AI asks SkillBoard which skill fits the request.
3. AI runs the guard automatically.
4. If allowed, AI uses the skill and discloses start/end usage.
5. If no good match exists, AI asks one clarifying question instead of guessing.

## Completed Product Slices

The following slices were completed before or during this handoff cycle:

- `skillboard-known-command-help-safety`
  - Known command help is read-only/non-mutating.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-known-command-help-safety.md`
- `skillboard-general-disclosure-contract`
  - Added generic `assistant_guidance.guard.allowed_use`.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-general-disclosure-contract.md`
- `skillboard-exact-disclosure-phrases`
  - Added exact start/finish disclosure templates.
  - `brief --intent` and `route` render "Say before/after".
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-exact-disclosure-phrases.md`
- `skillboard-readme-exact-disclosure-example`
  - README first screen shows a low-friction allowed-skill turn.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-readme-exact-disclosure-example.md`
- `skillboard-route-value-proof`
  - Added executable README-facing proof for route selection, fallback,
    guard-allowed state, exact disclosure, and no-match clarification.
  - Added `docs/routing.md`.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-route-value-proof.md`
- `skillboard-init-bridge-routing`
  - Updated generated bridge instructions and dogfooding `AGENTS.md` /
    `CLAUDE.md` so agents learn `brief --intent <request>`,
    `assistant_guidance.route`, `recommended_skill`, `fallback_skills`,
    `guard_command`, exact disclosure, and no-match clarification.
  - Updated `docs/install.md` Hermes prompt bridge.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-init-bridge-routing.md`
- `skillboard-init-intent-next`
  - `init` output now shows a workflow-scoped task-routing example when a
    workflow exists.
  - No-workflow init stays compact.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-init-intent-next.md`
- `skillboard-route-candidate-clarity`
  - Added `route_candidates` so selected fallbacks, denied preferred skills,
    and guard decisions are visible without overloading `fallback_skills`.
  - Docs and bridge guidance now tell agents to inspect `route_candidates`.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-route-candidate-clarity.md`
- `skillboard-install-surface-hardening`
  - Npm package files now include public docs while excluding internal
    `docs/plan/*` handoff/planning artifacts.
  - Bridge docs and generated lifecycle content mention `route_candidates`.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-install-surface-hardening.md`
- `skillboard-package-metadata-positioning`
  - Package description now says:
    `Let AI agents pick and use allowed skills in each workflow.`
  - Added npm discovery keywords: `agent-skills`, `skill-routing`, `workflow`.
  - Log: `/home/nyxxir/artifacts/logs/2026-06-30-codex-skillboard-package-metadata-positioning.md`
- `skillboard-no-prompt-quickstart`
  - README/install primary quick start now uses the no-prompt explicit
    package/binary spelling:
    `npx --yes --package agent-skillboard skillboard ...`.
  - Focused docs tests, packed no-prompt manual QA, full `npm run check`, and
    `git diff --check` passed.
  - No separate completion log was written; see the latest stop point above.
- `skillboard-synthetic-routing-qa`
  - Synthetic QA covered overlapping local skills plus denied-preferred /
    allowed-fallback policy behavior.
  - Fixed route tie-breaking so capability matches also use bound skill metadata;
    mixed implementation + handoff requests now select the implementation/test
    skill rather than the handoff skill.
  - Focused route tests, brief CLI tests, full `npm run check`, and
    `git diff --check` passed.
  - Log: `/home/nyxxir/.agents/work-log/hermes/2026-06-30-skillboard-synthetic-routing-qa.md`
- `skillboard-product-readiness-continuation`
  - Continued product-readiness after the synthetic routing QA slice.
  - Fixed `_npx` runtime next-command copy so registry/GitHub package specs use
    no-prompt `npx --yes --package <packageSpec> skillboard ...` spelling.
  - Tightened Hermes bridge and public quickstart docs around workflow-scoped
    `brief`, `brief --intent`, `--include-actions`, workflow-scoped
    `apply-action`, and no-workflow fallback copy.
  - Focused lifecycle/docs tests, full `npm run check`, `git diff --check`,
    package lifecycle smoke, static/secret scan, pack dry-run summary, and
    independent no-edit review passed.
  - Log: `/home/nyxxir/.agents/work-log/hermes/2026-06-30-skillboard-product-readiness-continuation.md`
- `skillboard-packed-runtime-qa`
  - Ran an additional packed/public runtime QA pass from a fresh temp project.
  - Verified no-prompt `npx --yes --package <tarball> skillboard ...` through
    `help`, `init`, generated bridge files, `doctor`, `status`, workflow-scoped
    `brief --intent --include-actions`, `guard`, `route`, `apply-action --dry-run`,
    and no-match clarification.
  - Focused public-surface tests passed 63 tests; package lifecycle smoke passed;
    full `npm run check` passed 285 tests; `git diff --check`, secret/static scan,
    direct whitespace scan, and independent no-edit QA review passed.
  - Log: `/home/nyxxir/.agents/work-log/hermes/2026-06-30-skillboard-packed-runtime-qa.md`

## Current State To Inspect First

Start by inspecting the worktree and the most recent plans:

```bash
git status --short --branch --untracked-files=all
sed -n '1,260p' .agent-work/20260630-165651-skillboard-packed-runtime-qa/PLAN.md
sed -n '1,260p' .agent-work/20260630-151450-skillboard-product-readiness-continuation/PLAN.md
sed -n '1,220p' .agent-work/20260630-092828-skillboard-synthetic-routing-qa/PLAN.md
sed -n '1,220p' .agent-work/20260630-090455-skillboard-no-prompt-quickstart/PLAN.md
git diff -- src/lifecycle-cli.mjs src/route.mjs src/conflicts.mjs test/first-time-ux.test.mjs test/lifecycle-cli.test.mjs test/ecosystem-docs.test.mjs test/brief-cli.test.mjs test/package.test.mjs README.md docs/install.md docs/reference.md docs/routing.md docs/plan/hermes/20260630-skillboard-product-readiness-handoff.md
```

If you want to re-check the latest packed runtime QA pass before continuing:

```bash
node .agent-work/20260630-165651-skillboard-packed-runtime-qa/packed-runtime-qa.mjs
node --test test/lifecycle-cli.test.mjs test/first-time-ux.test.mjs test/ecosystem-docs.test.mjs test/brief-cli.test.mjs test/package.test.mjs
node .github/scripts/ci-package-lifecycle-smoke.mjs
npm run check
git diff --check
```

If you want to re-check the previous Hermes continuation slice before continuing:

```bash
node --test test/lifecycle-cli.test.mjs test/first-time-ux.test.mjs test/ecosystem-docs.test.mjs
npm run check
git diff --check
node .github/scripts/ci-package-lifecycle-smoke.mjs
```

If you want to re-check the prior synthetic routing QA slice:

```bash
node --test --test-name-pattern "cli route" test/cli.test.mjs
node --test test/brief-cli.test.mjs
npm run check
git diff --check
```

If you want to re-check the prior no-prompt quickstart slice:

```bash
node --test test/ecosystem-docs.test.mjs test/readme-value-proof.test.mjs
npm run check
git diff --check
```

Manual QA script shape used by Codex for the prior no-prompt quickstart slice:

```bash
tmp=$(mktemp -d /tmp/skillboard-npx-quickstart-XXXXXX)
npm pack --json --pack-destination "$tmp"
# Then run the packed tarball through:
# npx --yes --package "$tmp/agent-skillboard-0.1.2.tgz" skillboard init
# npx --yes --package "$tmp/agent-skillboard-0.1.2.tgz" skillboard doctor --summary
# npx --yes --package "$tmp/agent-skillboard-0.1.2.tgz" skillboard brief --workflow <workflow>
rm -rf "$tmp"
```

Do not commit or push unless the user explicitly asks.

## Next Product Work After This Slice

Recommended next areas, in order:

1. Review the full dirty diff and decide whether to stage/commit a coherent
   product-readiness batch when the user asks.
2. If continuing product QA instead of staging, run another small synthetic or
   packed-package slice focused on remaining first-run friction.
3. Tighten README/install copy only if the first-run flow still feels too long
   after the no-prompt quick start and routing/fallback checks.
4. Consider whether dependency/conflict modeling needs another product slice or
   whether the current runtime conflict checks are enough for this release.

Keep changes small. The user explicitly wanted a handoff document here rather
than more broad implementation in this session.
