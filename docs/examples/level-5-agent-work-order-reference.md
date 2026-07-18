# Level 5 Reference: An Agent-Ready Work Order

**Status:** Future curriculum reference; not a current Nabi exercise

**Scenario:** Fictional repository and services

**Provenance:** Adapted from the anatomy of a real work order supplied by
Jiwon. Project names, paths, incidents, vendors, credentials, and operational
details have been removed or replaced.

This example shows the document shape Nabi ultimately wants learners to produce.
It is intentionally taller than it is wide. The goal is not to memorize this
template, but to understand how mission, evidence, authority, execution, and
verification fit together in a document that both a coding agent and a human
reviewer can follow.

---

# Work Order: Restore Shared Release Context

## Mission

Implement the approved shared release-context architecture in the `Harbor Notes`
monorepo. Replace the discarded in-memory prototype with the database-backed
design described in ADR-014. Preserve one request path, one source-of-truth
order, and the existing public API contract.

The required outcome is a tested implementation, repository documentation, and
a final report that lets a maintainer verify every stage without reconstructing
the work from commit history.

## Background and prior failure

An earlier prototype was removed after review found four defects:

1. tests were made green by copying assertion language into production prompts;
2. one logical request was split into multiple agent calls;
3. a production fallback could expose invented warning data; and
4. the change log described verification that had not occurred.

A later in-memory cache proposal was also rejected because process restarts
could erase context and create inconsistent results between instances. ADR-014
now requires scheduled database refreshes and a read-only request path.

Do not salvage the rejected runtime design. Reuse only artifacts explicitly
listed in the recovery stage below.

## Required reading and authority order

Read these sources from beginning to end before editing code:

1. `AGENTS.md` — repository-wide working rules;
2. `docs/decisions/014-shared-release-context.md` — approved architecture;
3. `docs/policies/release-safety.md` — safety and fallback rules;
4. `docs/plans/shared-release-context.md` — staged execution contract;
5. `apps/api/src/db/` — current schema and migration conventions; and
6. `infra/scheduler.toml` — infrastructure-as-code pattern.

If two sources conflict, apply this precedence:

```text
AGENTS.md -> safety policy -> ADR -> implementation plan -> existing code
```

Do not silently choose a convenient interpretation. Use the stop conditions.

## Comprehension gate

Before changing files, report one sentence for each point:

1. How many agent calls may one release request make?
2. What does the production data adapter return when credentials are absent?
3. Which source owns the displayed warning state?
4. What event invalidates the persisted context?
5. When may the user request path contact the upstream provider directly?
6. Where is the schedule defined?
7. Which checks prove the implementation did not restore the rejected design?

If any answer disagrees with the required reading, stop and ask the owner to
resolve the conflict.

## Execution contract

Complete the stages in order. After each stage, run the focused test and type
check, then create one descriptive commit. Continue automatically unless a stop
condition applies.

### Stage 0 — Isolate and recover

- Create a new branch from the verified default branch.
- Preserve the discarded prototype as a patch outside the worktree.
- Recover only the coordinate utility, approved ADR, implementation plan, and
  this work order.
- Prove the default branch builds before new implementation begins.

Expected commit:

```text
chore: recover approved release-context artifacts
```

### Stage 1 — Define the context boundary

- Add the typed shared-context contract.
- Keep raw provider data outside the public response type.
- Add unit tests for required, optional, and unavailable fields.

### Stage 2 — Make the provider safe

- Return `null` when production credentials are absent.
- Never call a mock provider in production.
- Preserve upstream error details in internal logs without exposing secrets.

### Stage 3 — Add persisted storage

- Add the schema and migration using the repository's migration generator.
- Update the migration journal in the same commit.
- Add a uniqueness constraint that makes scheduled writes idempotent.

### Stage 4 — Add the scheduled refresh

- Implement one idempotent refresh handler.
- Declare its schedule in `infra/scheduler.toml`.
- Keep time-zone conversion explicit and tested.
- Do not create a dashboard-only schedule.

### Stage 5 — Replace the user request path

- Read the latest usable database row.
- Permit one named, measured upstream fetch only for a never-seen location.
- Keep every other upstream call out of the user request path.

### Stage 6 — Preserve the single-call policy

- Assemble the complete context before invoking the agent.
- Make one agent request that returns the complete response contract.
- Do not restore card-specific or follow-up calls.

### Stage 7 — Add safety presentation

- Derive the warning banner only from verified context fields.
- Show an unavailable state when verified data is absent.
- Never synthesize a warning to make the interface look complete.

### Stage 8 — Invalidate on evidence

- Invalidate cached context only when the defined release event changes.
- Add tests for unchanged, changed, and missing event values.

### Stage 9 — Connect the client contract

- Map the existing API response into the client context.
- Preserve loading, unavailable, and stale states.
- Do not add a second client-side source of truth.

### Stage 10 — Integrate the interface

- Replace prototype fields with the shared context.
- Keep existing accessibility labels and offline behavior.
- Add a journey test for unavailable provider data.

### Stage 11 — Run integrated verification

- Run all server and client type checks.
- Run all unit, integration, and journey tests.
- Run the regression searches below.
- Review the full diff against every hard constraint.

## Hard constraints

Reject the result if any item is violated, even when tests pass:

1. One release request makes one agent call.
2. No card or follow-up makes a separate agent call.
3. Production prompts contain no copied test assertions.
4. Production never reads mock provider data.
5. Provider failure returns an unavailable value, never invented content.
6. The normal user request path reads the database, not the upstream provider.
7. Schedules are committed as infrastructure code.
8. Tests prove behavior; production code is not shaped to recognize fixtures.
9. Repository policies and approved decisions are not weakened to fit the patch.

## Stop conditions

Stop work and report evidence when:

- the comprehension gate conflicts with an authority source;
- the verified default branch is already broken;
- an implementation stage conflicts with `AGENTS.md` or the safety policy;
- the installed SDK cannot express the approved response contract;
- a real upstream response contradicts the ADR's data assumptions;
- the deployment platform cannot represent the committed schedule;
- migration history cannot be reconciled safely; or
- progress requires violating a hard constraint or gaining new authority.

Do not use a stop condition for ordinary implementation difficulty. Investigate
within the authorized scope first.

## Verification contract

Run after every server stage:

```bash
npm run typecheck --workspace apps/api
npm test --workspace apps/api
```

Run at integration:

```bash
npm run typecheck
npm test
npm run test:e2e
```

Regression guards:

```bash
# Old split-call names must not return.
rg "primaryAgentCall|followUpAgentCall" apps/api/src

# Production prompts must not contain test-bypass language.
rg "make the test pass|expected assertion" apps/api/src

# The user request path may reference the named emergency fetch at most once.
rg "fetchUpstreamContext" apps/api/src/routes
```

Required operating guards:

- production + missing provider credential -> `null`;
- production + mock-provider access -> rejected;
- repeated scheduled refresh -> one consistent stored result; and
- unavailable verified warning data -> no invented banner.

## Commit contract

- One commit per completed stage.
- Use `feat(release-context): stage N - <outcome>` after Stage 0.
- Do not add generated co-author signatures.
- Do not mix formatting-only changes with behavior changes.
- Do not push a stage whose focused checks fail.

## Final report

Use this structure:

```markdown
## Shared Release Context Implementation Report

**Branch:** <branch>
**Commits:** <count>
**Representative commit:** <hash and subject>

### Stage outcomes
- Stage 0: <evidence>
- Stage 1: <evidence>
- ...
- Stage 11: <evidence>

### Verification
- API typecheck: pass/fail
- API tests: count and result
- Client typecheck: pass/fail
- Client tests: count and result
- Browser journeys: count and result
- Regression guards: observed counts

### Hard-constraint audit
- Constraint 1: satisfied/not satisfied + evidence
- ...
- Constraint 9: satisfied/not satisfied + evidence

### Operational effects
- Migration behavior
- Schedule deployment
- Required owner-managed environment values

### Decisions still requiring the owner
- <only unresolved authority questions>
```

## Repository conventions

- Use the repository's existing language and comment style.
- Follow generated migration and lockfile workflows; do not hand-edit their
  internals without an explicit repository rule.
- Keep credentials out of source, fixtures, logs, and screenshots.
- Prefer focused searches and package-scoped checks during stages, then run the
  full gate before completion.
- Record observed failures truthfully. Never convert an intended future check
  into a claim that verification already passed.

---

## Why this is a Level 5 reference

The work order does not merely request code. It establishes authority order,
tests comprehension, grants bounded autonomy, forbids attractive shortcuts,
defines when autonomy must stop, and specifies proof. A future Nabi exercise
can grade much of this structure deterministically while using Review to help a
learner make the source easier for another person to scan.
