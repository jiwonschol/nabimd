# Five-Level Problem Bank Implementation Plan

> **Execution contract:** Run the stages in order. A problem is publishable
> only after real-engine fixtures, two independent reviews, and editorial
> acceptance bind to its current digests. Every batch PR uses `Refs #9`; the
> closing PR uses `Closes #9` only after the tracker proves 512+ accepted.

**Goal:** Make all five curriculum levels playable, then publish at least 512
inspected standard-Markdown problems without runtime AI or prose grading.

**Architecture:** Normalize immutable schema-v2 authoring records into a typed
runtime bank. Parse each answer once and dispatch a closed set of structural
predicates. Store generation, fixtures, reviews, and editorial decisions in
append-only batches; compile accepted records into generated per-level runtime
files and a bank-wide tracker.

**Stack:** TypeScript, React, mdast/CommonMark, Vitest, Node build scripts,
Playwright, GitHub PR checks, Vercel.

---

## Stage 0 — Preserve the approved design

**Files:**

- Add `docs/superpowers/specs/2026-07-19-five-level-problem-bank-design.md`
- Update `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md`
- Update `docs/design/level-5-agent-brief-north-star.md`
- Update `docs/build-log.md`

**Work:**

1. Record the exact five-level ladder and 512-problem target.
2. Resolve obsolete `Perfect`, protected-prose, and future-only Level 5 copy.
3. State the grammar-only grading and build-time GPT-5.6 boundaries.
4. Record the distribution and every autonomous architecture decision.

**Gate:** documentation contains one passing verdict (`Matched`), no claim that
runtime grading proves prose semantics, and the exact ladder from Issue #9.

## Stage 1 — Add schema v2 and validation

**Files:**

- Modify `src/content/types.ts`
- Add `src/content/normalizeProblem.ts`
- Modify `src/content/validateProblemBank.ts`
- Modify/add focused tests under `src/content/`

**Work:**

1. Add level, normalized `flavor: "standard"`, vocabulary profile, source batch,
   revision, curriculum version, and content-variant metadata.
2. Widen family, skill, retry, difficulty, and review types without weakening
   existing heading behavior.
3. Generalize fixture roles and allow multiple uniquely identified fixtures per
   role.
4. Validate the fixed level/profile/teaching-mode mapping, Level 5 convention,
   check shape, retry-family transfer cardinality, and global uniqueness.
5. Prove omitted and explicit standard flavor normalize identically.

**Gate:** schema/validator tests prove all five levels, invalid metadata,
duplicate IDs, malformed checks, and grammar-only metadata boundaries.

## Stage 2 — Generalize deterministic predicates

**Files:**

- Modify `src/engine/markdownAst.ts`
- Add `src/engine/evaluationContext.ts`
- Add `src/engine/sectionIndex.ts`
- Add predicate modules under `src/engine/predicates/`
- Modify `src/engine/evaluateMatch.ts`
- Modify `src/engine/evaluateEditorial.ts`
- Add focused engine tests

**Work:**

1. Parse once and index blocks, headings, sections, lists, code blocks, and
   source positions.
2. Preserve the current heading source predicates.
3. Add typed predicates for block presence/count, list shape, heading order,
   section-scoped structure, code fences, inline nodes, sequences, and explicit
   structural-completeness constraints.
4. Keep dispatch exhaustive and pure; use declaration order after priority.
5. Add metamorphic tests proving rewording, case, and spelling do not affect a
   verdict.

**Gate:** existing heading fixtures remain green and each new predicate has
passing, direct failing, nesting, boundary, and parser-collision coverage.

## Stage 3 — Canonical bank and five-level scheduling

**Files:**

- Add `src/content/problemBank.ts`
- Add generated level bank files under `src/content/generated/`
- Modify `src/content/entryChoices.ts`
- Modify session files under `src/session/` and progress files under `src/progress/`
- Modify relevant component and E2E tests

**Work:**

1. Replace heading-only runtime lookup with a canonical problem registry.
2. Expose exactly Level 1 through Level 5 entries.
3. Filter runs by exact level and flavor before deterministic rotation.
4. Keep transfers and Try another inside the same level, flavor, and retry
   family and require another content variant.
5. Record the compiled bank revision in persisted progress and reset stale runs
   safely.
6. Expose the definitive learner-facing task names: Learn the syntax, Rebuild
   real documents, Write for people, Write a development spec, and Write an
   agent work order.
7. Schedule Levels 1–4 as four chosen-level problems plus two next-level
   challenges. Level 5 schedules up to six unique at-level problems without
   duplication when the accepted bank is smaller.
8. Start Hint open for chosen-level work and closed for challenges while
   keeping it manually available without penalty. Only a failed Check creates
   different-content remediation.
9. Apply the centralized weighted single-syntax family policy at Levels 1–2,
   while preferring composite Level 2 rebuilds as they become available.
10. Route Levels 1–2 through rendered targets and Levels 3–5 through briefs,
    preserving the same deterministic structural grader and keyboard-only
    completion.

**Gate:** selection tests prove the 4+2 boundary, no adjacent scheduled
single-syntax family, bounded weighting, no cross-level remediation, truthful
Level 5 degradation, all five entries start, and changed bank revisions cannot
corrupt active schedules.

## Stage 4 — Replace the monolithic pipeline with batch evidence

**Files:**

- Add batch tooling under `scripts/problem-bank/`
- Add catalogs, vocabulary rubric, batch folders, and tracker under
  `curriculum/problem-bank/`
- Update package scripts and pipeline tests

**Work:**

1. Preserve v1 artifacts as legacy evidence; do not silently promote blocked
   candidates.
2. Normalize immutable batches and bind prompt, raw, candidate, problem,
   fixture, engine, transcript, review, editorial, batch, and bank digests.
3. Verify every fixture through `evaluateProblem`.
4. Require distinct digest-current reviewer and run IDs, with any negative
   review blocking acceptance.
5. Require separate editorial decisions for US-English vocabulary level fit,
   ambiguity, duplication, licensing, flavor, and runtime-AI boundaries.
6. Compile exactly the accepted current set and generate per-level/per-family
   tracker counts.

**Gate:** pipeline tests prove stale digest rejection, disagreement blocking,
publish-set equality, tracker determinism, and no fixture payload in the learner
bundle.

## Stage 5 — Milestone 1: every level playable

**Files:**

- Add the first schema-v2 batch directories
- Regenerate runtime bank and tracker
- Add fixtures and browser journeys for all levels

**Work:**

1. Requalify existing headings rather than carrying old approvals across the
   schema digest change.
2. Publish at least three inspected problems per level and at least two content
   variants in every active retry family.
3. Use structural-slot problems for Levels 3–5.
4. Run two isolated verification passes and a separate editorial pass.

**Gate:** tracker reports every level playable; unit, bank, build, and one
keyboard-only browser journey per level pass.

## Stage 6 — Scale the inspected bank to 512+

**Target distribution:**

- Level 1: 128
- Level 2: 128
- Level 3: 96
- Level 4: 80
- Level 5: 80

**Batch loop:**

1. Generate a bounded surplus from a frozen GPT-5.6 prompt.
2. Normalize and remove duplicates or policy violations.
3. Author canonical, reworded, case/spelling, missing, malformed, direct-check,
   nesting, and optional-review fixtures.
4. Run fixtures against the real engine and freeze the manifest.
5. Run two independent verification tasks without exposing peer results.
6. Run a separate editorial inspection.
7. Accept only unanimous digest-current candidates.
8. Compile runtime projections and tracker.
9. Run the bank-wide gate, `npm run check`, and browser coverage.
10. Open and review one coherent batch PR with `Refs #9`; merge serially.

**Gate:** tracker proves at least 512 accepted, every level meets its floor, all
content is `standard`, every accepted problem has current evidence, and all
bank-wide fixtures are green.

## Stage 7 — Closing verification and delivery

**Work:**

1. Run all unit, pipeline, bank, build, and E2E checks from a clean branch.
2. Run local CodeRabbit and address valid findings.
3. Request GitHub reviews, resolve threads, and merge the closing PR carrying
   `Closes #9`.
4. Sync local main, deploy the merged revision, and run production keyboard and
   long-Level-5 layout QA at 1280×800.
5. Update the build log, README/Devpost evidence, and problem-bank tracker with
   truthful counts and review provenance.

**Stop conditions:** use only the closed list in Issue #9. Hold the blocked item,
finish independent work, and open a draft PR with evidence.
