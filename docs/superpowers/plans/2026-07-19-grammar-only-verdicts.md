# Grammar-only Verdicts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace exact-copy grading and the Perfect tier with one syntax-only passing verdict, Matched.

**Architecture:** The match engine will detect the requested Markdown node and source form without comparing its prose. Editorial evaluation remains a separate, non-blocking structural review. Session and UI code consume the resulting two-state `fail | matched` evaluation union.

**Tech Stack:** React 19, TypeScript, unified/remark mdast, Vitest, Testing Library

## Global Constraints

- Never rewrite learner input.
- Never grade capitalization, spelling, punctuation, or wording.
- `Try again` and `Matched` are the only user-visible verdicts.
- Do not weaken source-form checks: malformed spacing, wrong heading level, nested headings, Setext, and raw HTML remain failures for a hash-H1 exercise.

---

### Task 1: Pin syntax-only grading

**Files:**
- Modify: `src/engine/evaluateProblem.test.ts`
- Modify: `src/content/problemFixtures.ts`
- Modify: `src/content/types.ts`
- Modify: `src/content/headingProblems.test.ts`

**Interfaces:**
- Consumes: `evaluateProblem(problem, source)`
- Produces: fixtures whose status is only `fail | matched`

- [ ] Add failing cases proving `# apple`, `# aple`, and `# Banana` are Matched and preserve their source.
- [ ] Change all successful fixture expectations from Perfect to Matched and remove exact-target review expectations.
- [ ] Run `npm test -- src/engine/evaluateProblem.test.ts src/content/headingProblems.test.ts` and verify failures mention Perfect, capitalization, protected text, or exact-target review.

### Task 2: Make the engine grade Markdown only

**Files:**
- Modify: `src/content/types.ts`
- Modify: `src/content/headingProblems.ts`
- Modify: `src/engine/evaluateMatch.ts`
- Modify: `src/engine/evaluateProblem.ts`
- Modify: `src/engine/evaluateEditorial.ts`
- Modify: `src/engine/types.ts`

**Interfaces:**
- Produces: `Evaluation = MatchFailure | { status: "matched"; reviewItems: readonly ReviewItem[] }`
- Preserves: `evaluateProblem(problem, source): Evaluation`

- [ ] Remove capitalization and protected-text match checks from problem construction and types.
- [ ] Make hash-H1 matching depend on level, source form, and AST placement, not heading text.
- [ ] Remove exact-target editorial comparison; retain structural `single-h1` review.
- [ ] Return Matched for every successful evaluation.
- [ ] Run the focused engine tests and verify they pass.

### Task 3: Update session, UI, validation, and docs

**Files:**
- Modify: `src/session/learningSession.test.ts`
- Modify: `src/components/StatusBar.tsx`
- Modify: `src/components/StatusBar.test.tsx`
- Modify: `src/content/validateProblemBank.ts`
- Modify: `docs/nabimd-decisions-2026-07-18.md`
- Modify: `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md`
- Modify: `docs/design/heading-mvp-visual-contract.md`
- Modify: `docs/submission-checklist.md`
- Modify: `docs/build-log.md`

**Interfaces:**
- Consumes: two-state `Evaluation`
- Produces: UI copy and bank validation with no Perfect tier

- [ ] Update tests first so a Matched pass focuses Next and opens optional Review when structural review items exist.
- [ ] Remove all Perfect branches and copy from runtime code and active source-of-truth docs.
- [ ] Add a dated Build Week decision entry explaining why copy fidelity was rejected.
- [ ] Run `npm test -- --run`, `npm run lint`, and `npm run build`.
- [ ] Commit the independently reviewable grading change.

## Self-review

- Spec coverage: two verdicts, source preservation, prose-neutral grading,
  source-form failures, and editorial-only structural review are covered.
- Placeholder scan: no TBD/TODO/implement-later instructions remain.
- Type consistency: fixtures, engine, session, UI, and validation share
  `fail | matched`.

