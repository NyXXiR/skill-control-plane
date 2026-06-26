# Source Profiles

SkillBoard imports skill repositories through **source profiles**. A profile is a YAML file that tells SkillBoard how to find `SKILL.md` files in a source tree and how to classify the skills it finds, without writing repository-specific code.

## Why Profiles Exist

Agent skill repositories come in many layouts:

- `skills/<category>/<skill>/SKILL.md`
- `<skill>/SKILL.md`
- deprecated or in-progress folders with special rules
- namespaces such as `matt.tdd` or `anthropic.requirement-intake`

Instead of hardcoding `if (repo === "mattpocock/skills")` branches, SkillBoard reads a declarative profile. The same importer code works for every source.

## Profile Location

Built-in profiles ship with the CLI under `profiles/`:

- `profiles/mattpocock-skills.yaml`
- `profiles/anthropics-skills.yaml`
- `profiles/oh-my-openagent.yaml`
- `profiles/wshobson-agents.yaml`
- `profiles/voltagent-awesome-agent-skills.yaml`

Project-specific profiles can live under `.skillboard/profiles/`:

```bash
skillboard import --profile .skillboard/profiles/my-team.yaml --source-root /path/to/repo
```

## Profile YAML Structure

```yaml
id: github.mattpocock.skills
source: mattpocock/skills
kind: marketplace
namespace: matt
target_path_prefix: matt
scope: user-global
default_status: vendor
default_invocation: manual-only
default_exposure: exported
default_category: uncategorized
category_path_segment: 1
skill_paths:
  - "skills/**/SKILL.md"
  - "*/SKILL.md"
path_rules:
  - pattern: "skills/deprecated/**/SKILL.md"
    status: deprecated
    invocation: deprecated
    category: deprecated
  - pattern: "skills/in-progress/**/SKILL.md"
    status: candidate
    category: in-progress
provided_components:
  - skills
permission_risk: medium
rollback: reinstall
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique install-unit id used in `skillboard.config.yaml`. |
| `source` | no | Human-readable source identifier, e.g. `owner/repo` or install command. |
| `kind` | yes | One of the install-unit kinds: `skill`, `plugin`, `marketplace`, `harness`, `mcp-server`, `hook`, `agent`, `lsp`. |
| `namespace` | no | Prefix added to every generated skill id. Empty means use the bare slug. |
| `target_path_prefix` | no | Prefix added to every generated skill `path`. |
| `scope` | no | Install scope: `user-global`, `project`, `local`, `admin`. |
| `default_status` | no | Default skill `status`: `discovered`, `vendor`, `candidate`, `active`, `quarantined`, `blocked`, `deprecated`, etc. |
| `default_invocation` | no | Default `invocation`: `manual-only`, `router-only`, `workflow-auto`, `blocked`, `deprecated`. `global-auto` is downgraded to `blocked`. |
| `default_exposure` | no | Default `exposure`: `exported`, `global-meta`, `unit-managed`, `private`. |
| `default_category` | no | Fallback category when no path rule or segment applies. |
| `category_path_segment` | no | Reads a path segment from the matched `SKILL.md` path as category. `skills/engineering/tdd/SKILL.md` with segment `1` becomes `engineering`. |
| `skill_paths` | yes | Glob patterns that identify `SKILL.md` files to import. |
| `path_rules` | no | First-match overrides for paths such as `deprecated/**` or `in-progress/**`. |
| `provided_components` | no | Components supplied by the install unit: `skills`, `commands`, `hooks`, `mcp_servers`. |
| `permission_risk` | no | `low`, `medium`, `high`. |
| `rollback` | no | Rollback strategy hint. |

## How to Add a Built-In Profile

1. **Create `profiles/<short-name>.yaml`.**

   Pick a short, descriptive file name. The `id` field should be a stable dotted identifier.

2. **Choose defaults that keep imported skills inactive.**

   New external skills should default to `vendor` or `candidate` with `manual-only` or `router-only` invocation. Do not use `global-auto` for external repositories.

3. **Add `path_rules` for repository conventions.**

   If the repo has `deprecated/`, `in-progress/`, or `archive/` folders, override status and invocation there.

4. **Test the profile against a real or fixture source.**

   ```bash
   skillboard import \
     --profile github.myorg.skills \
     --source-root /path/to/myorg-skills \
     --out .skillboard/reports/myorg-import.yaml
   ```

   Review the emitted fragment before merging.

5. **Add an integration test.**

   Put a minimal fixture under `test/fixtures/` or `examples/` and add a test in `test/source-profiles.test.mjs` or `test/multi-source-integration.test.mjs`.

6. **Update `package.json` `files` if needed.**

   Profiles are already included via `"files": [..., "profiles", ...]`.

## Example Walkthrough

Given this repository layout:

```
myorg-skills/
  engineering/
    tdd/
      SKILL.md
    review/
      SKILL.md
  deprecated/
    old-linter/
      SKILL.md
```

and this profile:

```yaml
id: github.myorg.skills
source: myorg/skills
kind: marketplace
namespace: myorg
target_path_prefix: myorg
scope: user-global
default_status: vendor
default_invocation: manual-only
default_exposure: exported
category_path_segment: 0
skill_paths:
  - "**/SKILL.md"
path_rules:
  - pattern: "deprecated/**/SKILL.md"
    status: deprecated
    invocation: deprecated
    category: deprecated
provided_components:
  - skills
permission_risk: medium
```

SkillBoard produces:

- `myorg.tdd` → path `myorg/tdd`, category `engineering`, status `vendor`, invocation `manual-only`
- `myorg.review` → path `myorg/review`, category `engineering`
- `myorg.old-linter` → path `myorg/old-linter`, category `deprecated`, status `deprecated`, invocation `deprecated`

## When to Use a Detector Instead

Profiles cover most repository layouts. If a source mutates config files, exposes components only through command output, or requires parsing a non-YAML manifest, use `skillboard inventory detect` or write a small detector. See [adapters.md](adapters.md) for the adapter/detector model.
