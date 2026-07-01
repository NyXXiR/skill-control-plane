# SkillBoard AI Routing & Response Quality Enhancement Plan

## Background

The original intent behind SkillBoard is to solve a problem that appears as the
number of agent skills grows:

> The AI becomes confused about which skill to use in a given context, response
> quality degrades, and implicit dependency conflicts or overlapping skill
> scopes become hard to manage.

SkillBoard already addresses this with deny-by-default policies,
workflow-scoped activation, capability-based preferences, and install-unit
provenance tracking. Those mechanisms are strong at *controlling* what can be
used. This plan proposes three reinforcements so SkillBoard also becomes strong
at *recommending* what should be used and at making dependency conflicts
explicit.

## Current gaps

| Concern | Current state | Desired state |
|---|---|---|
| Right skill for the right task | Capability mapping exists, but the AI must already know which capability matches the user intent. | SkillBoard exposes a surface that maps natural-language intent to a capability and then to a skill. |
| Dependency conflicts | `conflicts_with` exists in the schema, but it is not surfaced as a first-class decision in briefs or impact reports. | Conflicts and requirements are visible in briefs, impact analysis, and guard decisions. |
| Product messaging | README and docs emphasize safety, control, and audit. | Messaging also emphasizes response quality, correct skill selection, and reducing AI confusion. |

## Proposed enhancements

### 1. Capability router command

Add a read-only command that turns a user request into a recommended skill
without invoking it:

```bash
skillboard route "write tests before implementation" \
  --workflow codex-night-workflow \
  --config skillboard.config.yaml \
  --skills skills \
  --json
```

Expected JSON output shape:

```jsonc
{
  "intent": "write tests before implementation",
  "matched_capability": "test-first-implementation",
  "confidence": "high",
  "recommended_skill": "matt.tdd",
  "fallback_skills": ["meerkat.test-first-implementation"],
  "workflow": "codex-night-workflow",
  "guard_command": "skillboard guard use matt.tdd --workflow codex-night-workflow ..."
}
```

Design notes:

- The router should use declared capabilities, workflow bindings, and skill
  metadata (category, invocation mode, owner trust) rather than embedding
  semantic understanding of skill bodies.
- It is a recommendation, not an invocation. The final boundary remains
  `skillboard guard use ...`.
- If no capability matches, the router returns `"matched_capability": null` and
  a list of possibly relevant skills so the AI can ask the user for
  clarification.

### 2. First-class dependency and conflict model

Extend the skill schema so dependencies and conflicts are explicit and
actionable.

```yaml
skills:
  matt.tdd:
    path: tdd
    status: active
    invocation: workflow-auto
    exposure: exported
    owner_install_unit: github.mattpocock.skills
    requires:
      - capability: test-runner
      - skill: matt.test-helpers
    conflicts_with:
      - skill: meerkat.no-tests-please
        reason: opposite testing philosophy
```

Behavior:

- `brief` surfaces missing requirements as policy errors or workflow-scoped
  warnings.
- `impact disable <skill-id>` reports downstream skills that depend on the
  disabled skill.
- `guard use` rejects a skill when a conflict is active in the same workflow or
  when a required capability/skill is missing.
- `reconcile` suggests candidate skills that satisfy an unmet requirement.

This makes SkillBoard useful for the "dependency conflict" scenario: a user can
see *why* two skills cannot coexist and what would break if one were removed.

### 3. Message pivot toward quality and correct selection

Update the top-level product narrative so safety is framed as a means to an
end: better skill selection and higher response quality.

Suggested README opening pivot:

```markdown
# SkillBoard

Help your AI pick the right skill for the right task—and stop the wrong skill
from degrading the response.

Start with normal requests:

- "Which skill should you use to write tests first?"
- "Can you make `anthropic.docx` available for this workflow?"
- "Why can't you use `matt.grill-me` here?"
```

The existing safety and audit content stays, but it follows the quality story
rather than leading it.

## Implementation phases

### Phase 1: Capability router prototype

- Add `skillboard route` CLI command.
- Match intent strings against capability names, aliases, and skill categories.
- Return structured JSON with confidence and guard command hint.
- Add tests covering no-match, single-match, and fallback cases.

### Phase 2: Dependency and conflict schema

- Add `requires` and `conflicts_with` fields to skill schema.
- Update policy validation to enforce dependency/conflict rules.
- Surface conflicts in `brief`, `impact disable`, and `guard use` output.
- Add impact propagation for required skills/capabilities.

### Phase 3: Messaging and documentation

- Pivot README and `docs/policy-model.md` opening to quality/correct-selection
  framing.
- Add a `docs/routing.md` guide for the capability router.
- Update `docs/value-proof.md` with a Case 4: router picks the right skill and
  rejects a conflicting one.

## Acceptance criteria

- `skillboard route` returns a machine-readable recommendation for at least the
  built-in example fixtures.
- Activating a skill with an unmet requirement produces a clear policy error in
  `brief`.
- `guard use` denies a skill when a declared conflict is active in the same
  workflow.
- README and docs explain SkillBoard as a tool for correct skill selection, not
  only as a policy gate.
- All new behavior is covered by tests; full suite remains green.

## Relation to existing work

This plan builds on top of the `assistant_guidance` work in
`src/advisor/guidance.mjs`. The router output can be embedded inside
`assistant_guidance.recommended_next_step` when the guidance status is `ready`,
so an AI reading the brief gets both permission state and selection guidance in
one JSON payload.
