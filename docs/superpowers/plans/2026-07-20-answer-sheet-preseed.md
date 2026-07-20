# Answer Sheet Prose Pre-seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-fill every Level 1–2 answer sheet with the visible prose from its reproduction target while leaving Level 3–5 composition sheets blank.

**Architecture:** Add a pure mdast-based Markdown-to-prose serializer and apply it once when the accepted runtime projections are assembled. Keep accepted problem-bank artifacts immutable, make the hydrated `starterText` visible to every existing session transition, and preserve saved drafts as the higher-priority value.

**Tech Stack:** TypeScript 7, React 19, Vitest, Playwright, `mdast-util-from-markdown` 2.0.3

## Global Constraints

- Do not grade, correct, or compare learner prose.
- Do not invent reproduction targets for Levels 3–5.
- Do not change turn flow, the level model, editor key handling, or grading semantics.
- Do not rewrite accepted problem-bank batch artifacts or generated projections.
- Add no runtime dependency.

---

### Task 1: Deterministic Markdown-to-prose serializer

**Files:**
- Create: `src/content/plaintextStarter.ts`
- Create: `src/content/plaintextStarter.test.ts`

**Interfaces:**
- Consumes: a Markdown target string already accepted by the standard-flavor parser.
- Produces: `derivePlaintextStarter(target: string): string`.

- [ ] **Step 1: Write the failing serializer tests**

Cover headings, paragraphs, quotes, emphasis, links, code, flat and nested
lists, thematic breaks, Unicode spaces, zero-width characters, and excessive
blank lines. The primary expectation is:

```ts
expect(
  derivePlaintextStarter(
    "# Trip note\n\n> Pack **light**.\n\n- Map\n- [Tickets](/tickets)\n\n---\n\n~~~\nGate 4\n~~~",
  ),
).toBe("Trip note\n\nPack light.\n\nMap\nTickets\n\nGate 4")
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/content/plaintextStarter.test.ts`

Expected: FAIL because `derivePlaintextStarter` does not exist.

- [ ] **Step 3: Implement the minimal serializer**

Parse once with `fromMarkdown`, recursively serialize mdast nodes by their
visible role, then normalize line endings and invisible whitespace. Block
parents join with `\n\n`; list parents and list items join with `\n`.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/content/plaintextStarter.test.ts`

Expected: all serializer tests pass with no warnings.

### Task 2: Hydrate the published runtime bank

**Files:**
- Modify: `src/content/problemBank.ts`
- Modify: `src/content/problemBank.test.ts`
- Modify: `src/session/learningSession.test.ts`

**Interfaces:**
- Consumes: `derivePlaintextStarter(problem.target)`.
- Produces: Level 1–2 `NormalizedProblem` objects whose `starterText` is the
  derived prose; Level 3–5 objects remain authored.

- [ ] **Step 1: Write failing runtime-contract tests**

Assert representative exact seeds for heading, link, code block, thematic
break, and nested-list problems; assert every published Level 1–2 seed is
deterministic and free of forbidden invisible characters; assert every Level
3–5 seed is unchanged. Replace the obsolete whole-object equality assertion
with a comparison that proves every non-`starterText` field still equals the
generated projection.

- [ ] **Step 2: Write failing session-precedence tests**

Create sessions from hydrated Level 1, Level 2, and Level 3 problems. Assert
that reproduction levels start with the derived prose, composition starts
empty, and an existing `draftByProblemId` value wins over the seed.

- [ ] **Step 3: Verify RED**

Run: `npx vitest run src/content/problemBank.test.ts src/session/learningSession.test.ts`

Expected: FAIL because runtime problems still carry empty starter text.

- [ ] **Step 4: Add one runtime hydration boundary**

Map accepted projections in `problemBank.ts`; clone only Level 1–2 records and
set `starterText` to `derivePlaintextStarter(target)`. Do not touch source batch
objects, normalization, generated JSON, fixtures, or Levels 3–5.

- [ ] **Step 5: Verify GREEN and invariants**

Run: `npx vitest run src/content/plaintextStarter.test.ts src/content/problemBank.test.ts src/session/learningSession.test.ts`

Expected: all focused tests pass, and `validateProblemBank` still returns no
errors for the hydrated runtime bank.

### Task 3: Browser contract and Build Week record

**Files:**
- Modify: `tests/e2e/heading-flow.spec.ts`
- Modify: `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md`
- Modify: `docs/build-log.md`

**Interfaces:**
- Consumes: the hydrated runtime problem selected by the deterministic E2E seed.
- Produces: learner-visible proof and a durable rationale for the artifact
  immutability decision.

- [ ] **Step 1: Add the failing browser test**

Open Level 1 and Level 2, resolve the current problem ID from the active Write
tab, and assert the CodeMirror source text equals that problem's hydrated
`starterText`. Open Level 3 and assert the source remains empty. Toggle
Invisibles on a reproduction problem and assert it does not change the source.

- [ ] **Step 2: Verify RED before runtime hydration**

Run: `npm run test:e2e -- --grep "pre-fills reproduction"`

Expected: FAIL because the current answer sheet is blank.

- [ ] **Step 3: Update product and Build Week documentation**

Record the Level 1–2 pre-seed contract, saved-draft precedence, Levels 3–5
boundary, AST serializer, and the decision not to invalidate accepted batch
evidence.

- [ ] **Step 4: Run complete verification**

Run: `npm run check`

Expected: typecheck, every immutable batch/repository gate, all unit/component
tests, build, and bundle inspection pass.

Run: `npm run test:e2e`

Expected: all Chromium learner journeys pass.

Run: `git diff --check`

Expected: no output.

### Task 4: Review and delivery

**Files:**
- No additional product files.

**Interfaces:**
- Consumes: a clean committed branch with complete verification evidence.
- Produces: a reviewed PR carrying `Closes #39` and a synchronized `main`.

- [ ] **Step 1: Commit and push the implementation**

Commit the written spec/plan separately from the tested implementation when
the task boundaries remain reviewable; otherwise use one coherent feature
commit plus any review-fix commits.

- [ ] **Step 2: Open the PR**

List the runtime-hydration decision, Markdown serialization rules, saved-draft
precedence, immutable artifact boundary, verification commands, and
`Closes #39`.

- [ ] **Step 3: Run review gates**

Attempt CodeRabbit once. If it has a heartbeat, wait and address its findings;
if it explicitly rate-limits or fails without a heartbeat, run an independent
Codex review and record the actual reviewer evidence. Re-run focused and full
gates after every material fix.

- [ ] **Step 4: Merge and synchronize**

Merge only with no actionable findings and green gates. Fast-forward the local
`main` while preserving the user's unrelated modified and untracked files.
