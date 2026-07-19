# Problem Bank Advanced Documents Batch 017 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish one append-only 12-problem Batch 017 containing exactly two Level 3 operational-impact briefs, four Level 4 integration-contract specifications, and six Level 5 agent work orders, bringing the reviewed checkpoint to 344 problems and advanced-level totals to `30/20/10` while leaving Issue #9 open.

**Architecture:** Reuse the immutable authored-batch lifecycle established by Batches 015–016: authored TypeScript and real-engine fixtures generate digest-bound artifacts, mechanical verification freezes them, two declared-independent reviewers and a separate editor inspect the same manifest, and publication compiles only unanimously accepted records. The batch extends the existing Level 3–5 document grammars with new editorial archetypes; it does not change the learner engine, selection/session behavior, the 512 closing target, or Issue #50-owned files.

**Tech Stack:** Node.js `>=22.13`, TypeScript `7.0.2`, `mdast-util-from-markdown` `2.0.3`, Vitest `4.1.10`, deterministic JSON batch tooling, GitHub PR review, Playwright `1.61.1`, and static Vercel deployment.

## Global Constraints

- Source batch ID is exactly `2026-07-20-l3-l5-advanced-documents-017`; sequence is exactly `17`.
- Add exactly 12 `standard` problems: two Level 3, four Level 4, and six Level 5.
- The published checkpoint must be exactly 344 accepted problems with level split `136/148/30/20/10`.
- Advanced family totals must become exactly `readable-human-document: 30`, `executable-development-spec: 20`, and `agent-ready-work-order: 10`.
- Issue #9 remains open. Every commit, PR, build-log entry, and issue update must describe 344 as a checkpoint and use `Refs #9`; none may say `Closes #9`, “completes Issue #9,” or “final 512 bank.”
- Keep `targetAccepted: 512`, completion floors `128/128/96/80/80`, and the 512 closing gate unchanged. Do not call the completion gate for this checkpoint.
- The lifecycle order is `generate -> verify -> inspect -> publish`. Publication must not precede both mechanical seals and the separate editorial seal.
- Grading is grammar-only. Wording, capitalization, spelling, punctuation, domain truth, heading text, and semantic quality are never match operands.
- Use only existing `block-sequence`, `block-count`, `heading-depth-order`, `list-shape`, `blockquote-shape`, `inline-presence`, `inline-code-shape`, `link-shape`, and `code-block` predicates.
- No new predicate is expected. If a required structural distinction cannot be expressed with those predicates, stop with a failing focused test and obtain a separate design decision; do not add an engine predicate inside this content batch.
- Every record has `protectedContent: []`, three progressive hints, a unique ID, unique `contentVariant`, and a target and teaching example not duplicated anywhere in the accepted bank.
- Reuse family IDs `readable-human-document`, `executable-development-spec`, and `agent-ready-work-order`; do not create parallel family taxonomy for the editorial archetypes.
- Use exactly one Level 3 retry family, one Level 4 retry family, and three Level 5 retry families with two content variants each, so every retry family satisfies schema-v2 transfer validation.
- Level 5 records use convention `{ id: "nabi-agent-work-order", version: "2026.07", reviewedOn: "2026-07-20" }` and revision `1` for these new IDs.
- Pre-review freeze contains no files under `reviews/`, no `editorial.json`, and no published `summary.generated.json`.
- Any problem, fixture, prompt, verification, engine-contract, or manifest change after inspection starts invalidates all mechanical and editorial seals and restarts inspection.
- Do not modify Issue #50-owned paths: `src/content/entryChoices.ts`, `src/selection/runComposition.ts`, `src/selection/runComposition.test.ts`, `src/session/**`, `src/progress/**`, `src/App.test.tsx`, or `tests/e2e/heading-flow.spec.ts`.
- Preserve `bank:batch:generate` as the read-only aggregate check alias. The only mutating generation command is the explicitly named Batch 017 `prepare` command.
- Do not hand-edit `curriculum/problem-bank/runtime-projections.generated.json` or `curriculum/problem-bank/tracker.generated.json`; only the sealed publisher may regenerate them.
- A Vercel production command uploads repository content to an external service. If the current external-upload policy requires approval, stop immediately before deployment, ask the user to authorize that exact upload, and continue only after approval.

---

## File Map

**Create during authoring:**

- `src/content/batches/advancedDocumentBatch017Problems.ts` — normalized Level 3–5 source records and reusable archetype builders/check factories.
- `src/content/batches/advancedDocumentBatch017Fixtures.ts` — required-role, direct-check, and adversarial real-engine fixtures.
- `src/content/batches/advancedDocumentBatch017.test.ts` — batch matrix, structural contract, transfer-family, collision, and fixture tests.
- `scripts/problem-bank/advancedDocumentBatch017Support.ts` — Batch 017 `prepare` and `publish` entry points over `batchArtifactSupport.ts`.
- `scripts/problem-bank/advancedDocumentBatch017Artifacts.gate.ts` — deterministic pre-review and publication-state gate.
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/generation-prompt.md` — exact authored-generation brief.

**Generate during prepare:**

- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/candidates.raw.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/candidates.normalized.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/fixtures.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/verification.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/engine-contract.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/review-manifest.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/prepared-summary.generated.json`

**Create during inspection/publication:**

- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/reviews/reviewer-atlas.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/reviews/reviewer-orchid.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/editorial.json`
- `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/summary.generated.json`

**Modify during implementation/publication:**

- `package.json` — named Batch 017 commands, aggregate check, and generic publish alias.
- `vitest.gate.config.ts` — include the Batch 017 artifact gate.
- `src/content/problemBank.test.ts` — include Batch 017 fixtures and assert the published checkpoint.
- `README.md` — current-bank and advanced-level snapshot only; retain the 512 target and open-issue language.
- `curriculum/problem-bank/README.md` — Batch 017 artifact/checkpoint description and current distribution.
- `docs/superpowers/specs/2026-07-19-five-level-problem-bank-design.md` — current-state checkpoint and remaining target counts; preserve its 512 closure rule.
- `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md` — current published-bank statement only; preserve future target language.
- `docs/nabimd-decisions-2026-07-18.md` — update the factual Level 5 published count from four to ten without changing the product decision.
- `docs/build-log.md` — append pre-review, review, publication, PR, merge, and deployment evidence; do not rewrite historical entries.

**Generate during publication:**

- `curriculum/problem-bank/runtime-projections.generated.json`
- `curriculum/problem-bank/tracker.generated.json`

**Explicitly unchanged:**

- `scripts/problem-bank/batchPipeline.mjs` — keep `targetAccepted: 512` and `COMPLETION_FLOORS` unchanged.
- `scripts/problem-bank/batchPipeline.test.mjs` — no checkpoint-specific completion-gate rewrite.
- `scripts/problem-bank/repositoryBankGate.gate.ts` — its append-only and projection checks already discover a new batch.
- All Issue #50-owned files listed in Global Constraints.

---

### Task 1: Define the advanced-document matrix and failing contracts

**Files:**

- Create: `src/content/batches/advancedDocumentBatch017.test.ts`
- Create: `src/content/batches/advancedDocumentBatch017Problems.ts`
- Test: `src/content/batches/advancedDocumentBatch017.test.ts`

**Interfaces:**

- Consumes: `NormalizedProblem`, `MatchCheck`, `normalizeProblem()`, `evaluateProblem()`, `validateProblemBank()`, and the existing Level 3–5 seed conventions.
- Produces: `advancedDocumentBatch017Id` and `advancedDocumentBatch017Problems: readonly NormalizedProblem[]` for fixtures and artifact tooling.

- [ ] **Step 1: Write the failing batch-matrix test**

Create a test that imports the not-yet-implemented problem array and asserts:

```ts
expect(advancedDocumentBatch017Problems).toHaveLength(12)
expect(advancedDocumentBatch017Problems.filter((problem) => problem.level === 3)).toHaveLength(2)
expect(advancedDocumentBatch017Problems.filter((problem) => problem.level === 4)).toHaveLength(4)
expect(advancedDocumentBatch017Problems.filter((problem) => problem.level === 5)).toHaveLength(6)
expect(new Set(advancedDocumentBatch017Problems.map((problem) => problem.id)).size).toBe(12)
expect(new Set(advancedDocumentBatch017Problems.map((problem) => problem.contentVariant)).size).toBe(12)
expect(advancedDocumentBatch017Problems.every((problem) => problem.flavor === "standard")).toBe(true)
expect(advancedDocumentBatch017Problems.every((problem) => problem.protectedContent.length === 0)).toBe(true)
```

Assert this exact content matrix:

| Level | Retry family | ID | Editorial archetype |
|---:|---|---|---|
| 3 | `level3-operational-impact-brief` | `l3-support-queue-impact-brief` | operational-impact brief |
| 3 | `level3-operational-impact-brief` | `l3-badge-reader-impact-brief` | operational-impact brief |
| 4 | `level4-integration-contract-spec` | `l4-support-webhook-contract-spec` | integration-contract spec |
| 4 | `level4-integration-contract-spec` | `l4-contact-import-contract-spec` | integration-contract spec |
| 4 | `level4-integration-contract-spec` | `l4-customer-digest-contract-spec` | integration-contract spec |
| 4 | `level4-integration-contract-spec` | `l4-audit-archive-contract-spec` | integration-contract spec |
| 5 | `level5-evidence-recovery-work-order` | `l5-duplicate-job-recovery-work-order` | evidence recovery |
| 5 | `level5-evidence-recovery-work-order` | `l5-search-index-recovery-work-order` | evidence recovery |
| 5 | `level5-bounded-refactor-work-order` | `l5-date-format-refactor-work-order` | bounded refactor |
| 5 | `level5-bounded-refactor-work-order` | `l5-analytics-adapter-refactor-work-order` | bounded refactor |
| 5 | `level5-coordinated-rollout-work-order` | `l5-api-contract-rollout-work-order` | coordinated rollout |
| 5 | `level5-coordinated-rollout-work-order` | `l5-notification-schema-rollout-work-order` | coordinated rollout |

Run:

```bash
npx vitest run src/content/batches/advancedDocumentBatch017.test.ts
```

Expected: FAIL because the problem module or exported records do not exist.

- [ ] **Step 2: Add grammar-boundary assertions before content**

Assert profiles and families exactly:

```ts
const expected = {
  3: { familyId: "readable-human-document", profile: "workplace-document" },
  4: { familyId: "executable-development-spec", profile: "development-spec" },
  5: { familyId: "agent-ready-work-order", profile: "agent-workflow" },
} as const
```

For every match check, reject legacy heading `text` operands and restrict `kind` to the existing predicate allowlist from Global Constraints. For every Level 5 record, assert the exact convention date and revision. Assert Level 5 targets are at least 60 lines and 1,800 source characters as authored-content quality checks; do not encode those limits as learner match checks.

- [ ] **Step 3: Implement the two Level 3 operational-impact briefs**

Use one H1, an opening paragraph, and four ordered H2 sections. The sections contain a visible blockquote observation plus a paragraph, an unordered impact list, an ordered response list, and a closing paragraph with bold ownership and a descriptive direct link. Require exactly four H2 sections and no skipped heading depth.

Use `difficulty: "makeover"`, `teachingMode: "recall"`, `familyId: "readable-human-document"`, and `retryFamily: "level3-operational-impact-brief"`. The two sources must describe distinct operational consequences and responses; their prose may establish plausible context, but no check may inspect that context.

- [ ] **Step 4: Implement the four Level 4 integration-contract specs**

Use an exact root anatomy of H1, opening paragraph, then six H2 sections containing, in order: an unordered boundary list, a dependency paragraph, a nonempty blockquote invariant, an ordered implementation list, an unordered acceptance list, and one verification code block. Require exactly six H2 sections and no skipped heading depth.

The dependency paragraph must contain at least one descriptive direct Markdown link and at least one nonempty inline-code item. Reject references and autolinks for this exercise. Require at least three nonempty items in boundary, implementation, and acceptance lists. Require the verification block to be exactly one fenced, closed, language-tagged, nonempty code block.

Use `difficulty: "makeover"`, `teachingMode: "recall"`, `familyId: "executable-development-spec"`, `retryFamily: "level4-integration-contract-spec"`, and skills covering outline, dependency reference, invariant blockquote, ordered implementation, acceptance list, and verification code.

- [ ] **Step 5: Implement the six Level 5 work orders**

Use the `nabi-agent-work-order` convention while giving the three archetypes genuinely different shapes. Evidence recovery uses ten H2 sections and three H3 recovery stages; bounded refactor uses nine H2 sections and four H3 execution stages; coordinated rollout uses eight H2 sections and three H3 rollout phases. Require one H1, no skipped hierarchy, visible stage-local tasks, explicit authority and stop contracts, and the archetype-specific verification and report structures defined by the problem checks.

Use the three exact retry families from the matrix, two distinct records per family, and keep every work order auditable rather than aspirational:

- Evidence recovery starts from a reproducible failure or drift signal, captures a stable baseline, makes only evidence-supported changes, and reports comparison evidence.
- Bounded refactor preserves a named public/runtime contract, proves the current boundary before edits, moves one responsibility at a time, and includes regression searches.
- Coordinated rollout defines compatibility, staged enablement, rollback authority, observability, and explicit stop conditions across collaborating components.

The target sources may contain concrete repository-like names and commands for realism, but the matcher checks only Markdown grammar and document shape.

- [ ] **Step 6: Add a reachable editorial-refinement path**

Give every record the `single-h1` editorial rule. Because the structural sequence does not reject an additional later H1, a `matched-with-review` fixture can add a second document title and receive the one-document-title review without weakening learner match checks.

- [ ] **Step 7: Run the matrix test to green**

```bash
npx vitest run src/content/batches/advancedDocumentBatch017.test.ts
```

Expected: PASS for record counts, IDs, families, profiles, retry-family cardinality, grammar-only checks, convention metadata, and authored Level 5 size.

- [ ] **Step 8: Commit the authored grammar unit**

```bash
git add src/content/batches/advancedDocumentBatch017Problems.ts src/content/batches/advancedDocumentBatch017.test.ts
git commit -m "feat: author advanced document batch 017"
```

Expected: one focused commit containing no fixtures, generated evidence, pipeline changes, or Issue #50 files.

---

### Task 2: Prove every grammar check with real-engine fixtures

**Files:**

- Create: `src/content/batches/advancedDocumentBatch017Fixtures.ts`
- Modify: `src/content/batches/advancedDocumentBatch017.test.ts`
- Test: `src/content/batches/advancedDocumentBatch017.test.ts`

**Interfaces:**

- Consumes: `advancedDocumentBatch017Problems`, `ProblemFixture`, `evaluateProblem()`, and `validateProblemBank()`.
- Produces: `advancedDocumentBatch017Fixtures: readonly ProblemFixture[]`, with every required role and every match check directly exercised.

- [ ] **Step 1: Write a failing required-role and direct-check test**

For every problem require all six schema-v2 roles:

```ts
const requiredRoles = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
] as const
```

Assert every match-check ID has at least one failing fixture whose `exercisesCheckId` names it, every expected Matched fixture evaluates as Matched, every failure evaluates as Try again with its intended feedback ID, and `validateProblemBank(advancedDocumentBatch017Problems, advancedDocumentBatch017Fixtures)` returns no errors.

Run:

```bash
npx vitest run src/content/batches/advancedDocumentBatch017.test.ts
```

Expected: FAIL because the fixture module does not yet exist.

- [ ] **Step 2: Add positive transfer fixtures**

For every candidate add:

- the exact authored target as `canonical`;
- a problem-specific, structurally equivalent rewrite as `different-prose`;
- a structurally equivalent case, spelling, and punctuation variation as `case-spelling-variation`; and
- a structurally valid source with one italic phrase as `matched-with-review`, expected Matched plus the restrained-emphasis review.

Do not reuse another candidate's complete target as transfer evidence. Each positive rewrite must preserve only the required Markdown anatomy, not heading labels or domain facts.

- [ ] **Step 3: Add Level 3 adversarial fixtures**

Cover missing/extra/reordered root blocks, too few or too many H2 sections, H1-to-H3 skipped depth, missing/malformed strong emphasis, strong emphasis in the wrong H2 section, ordered instead of unordered action lists, short/empty/invisible list items, extra root content, and fenced-code or raw-HTML lookalikes. Bind each failure to the exact outline, H2-count, hierarchy, emphasis, or list-shape check.

- [ ] **Step 4: Add Level 4 adversarial fixtures**

Cover missing/extra/reordered sections, missing or malformed dependency links, reference links, autolinks, image lookalikes, empty labels/destinations, missing/empty inline code, empty/nested/raw-HTML blockquotes, wrong list kinds, too few or invisible items, untagged/indented/unclosed/empty/nested verification code, and an extra verification block. Ensure each direct check fails independently while unrelated checks remain satisfiable where possible.

- [ ] **Step 5: Add Level 5 adversarial fixtures**

Cover missing/extra/reordered H2 sections, an extra H1, skipped H1-to-H3 hierarchy, fewer or more than three H3 stages, stage tasks placed outside their stage, wrong/missing/short/empty authority, task, constraint, or stop lists, untagged/indented/unclosed/empty/nested verification and report fences, and source text that only looks like code inside a paragraph or quote. Add direct failures for all three stage-list checks, not one shared proxy.

- [ ] **Step 6: Run focused engine and validator coverage**

```bash
npx vitest run \
  src/content/batches/advancedDocumentBatch017.test.ts \
  src/engine/structuralPredicates.test.ts \
  src/content/validateProblemBankV2.test.ts
```

Expected: PASS with all 12 records validated, every frozen fixture replaying through the real learner engine, every match check directly exercised, and no new predicate implementation.

- [ ] **Step 7: Commit the fixture proof**

```bash
git add src/content/batches/advancedDocumentBatch017Fixtures.ts src/content/batches/advancedDocumentBatch017.test.ts
git commit -m "test: prove advanced document batch 017"
```

---

### Task 3: Generate and verify the immutable pre-review freeze

**Files:**

- Create: `scripts/problem-bank/advancedDocumentBatch017Support.ts`
- Create: `scripts/problem-bank/advancedDocumentBatch017Artifacts.gate.ts`
- Create: `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/generation-prompt.md`
- Generate: the seven pre-review JSON artifacts listed in the File Map.
- Modify: `package.json`
- Modify: `vitest.gate.config.ts`
- Modify: `docs/build-log.md`

**Interfaces:**

- Consumes: `buildAuthoredBatchArtifacts`, `writeAuthoredBatchArtifacts`, `readCommittedAuthoredBatch`, `checkAuthoredBatchState`, `buildAuthoredBatchPublication`, and `publishAuthoredBatchArtifacts` from `scripts/problem-bank/batchArtifactSupport.ts`.
- Produces: `advancedDocumentBatch017Config`, deterministic `prepare`/`publish` entry points, a digest-bound review manifest, and the named Batch 017 npm commands.

- [ ] **Step 1: Write the failing artifact-gate expectations**

The gate must prove:

- candidate count 12 and level distribution `2/4/6`;
- exact family totals within the batch `2/4/6` and retry-family counts `2/4/2/2/2`;
- all frozen fixtures execute and every candidate regression result passes;
- manifest entries and engine-contract digests cover all 12 candidates;
- prior published total is 332 with split `136/148/28/16/4`;
- committed pre-review artifacts equal freshly computed artifacts;
- source, fixtures, engine contract, and manifest become immutable after any review/editorial evidence appears;
- state remains review-blocked with no reviews/editorial and publication fails closed;
- unanimous publication projects 344 with split `136/148/30/20/10` and advanced family totals `30/20/10`;
- tracker `targetAccepted` remains 512.

- [ ] **Step 2: Implement the support module**

Use this exact config:

```ts
export const ADVANCED_DOCUMENT_BATCH_017_ID =
  "2026-07-20-l3-l5-advanced-documents-017"

export const advancedDocumentBatch017Config = {
  batchId: ADVANCED_DOCUMENT_BATCH_017_ID,
  sequence: 17,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-20",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig
```

Expose build, write, read, check, publication-build, and publish wrappers with the same signatures as Batch 016. The CLI accepts only `prepare` or `publish`; every other argument throws the usage error.

- [ ] **Step 3: Add exact package and gate configuration**

Add:

```json
"bank:batch:advanced-document-017:prepare": "tsx scripts/problem-bank/advancedDocumentBatch017Support.ts prepare",
"bank:batch:advanced-document-017:check": "vitest run scripts/problem-bank/advancedDocumentBatch017Artifacts.gate.ts --config vitest.gate.config.ts --reporter=verbose",
"bank:batch:advanced-document-017:publish": "tsx scripts/problem-bank/advancedDocumentBatch017Support.ts publish"
```

Append the named check to `bank:batch:generate:check`, point `bank:batch:publish` to the named Batch 017 publisher, and leave `bank:batch:generate` exactly `npm run bank:batch:generate:check`. Add the Batch 017 gate path to `vitest.gate.config.ts`.

- [ ] **Step 4: Generate the pre-review artifacts**

```bash
npm run bank:batch:advanced-document-017:prepare
```

Expected: raw, normalized, fixtures, verification, engine contract, review manifest, and prepared summary are generated deterministically. No reviewer, editorial, summary, tracker, or runtime-projection publication file changes occur.

- [ ] **Step 5: Verify the frozen state**

```bash
npm run bank:batch:advanced-document-017:check
npx vitest run src/content/batches/advancedDocumentBatch017.test.ts
npm run typecheck
npm test
git diff --check
```

Expected: Batch 017, focused content, typecheck, and full unit suites pass. The Batch 017 state is `awaiting-independent-review`; the published tracker remains byte-identical at 332.

- [ ] **Step 6: Append pre-review evidence to the build log**

Record the exact source batch ID, `2/4/6` matrix, archetype choices, fixture and check counts, digest set, commands and observed results, absence of new predicates, Issue #50 non-overlap, and explicit statement: “Issue #9 remains open; this batch targets a 344-problem checkpoint.” Do not predict reviewer acceptance or publication.

- [ ] **Step 7: Commit the immutable pre-review freeze**

```bash
git add package.json vitest.gate.config.ts docs/build-log.md scripts/problem-bank/advancedDocumentBatch017Support.ts scripts/problem-bank/advancedDocumentBatch017Artifacts.gate.ts curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017
git commit -m "feat: freeze advanced document batch 017"
```

Expected: the commit contains the deterministic pre-review freeze and no inspection or publication seals.

---

### Task 4: Inspect the frozen batch independently

**Files:**

- Create: `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/reviews/reviewer-atlas.json`
- Create: `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/reviews/reviewer-orchid.json`
- Create: `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/editorial.json`
- Modify: `docs/build-log.md`

**Interfaces:**

- Consumes: the exact pre-review manifest, engine contract, candidate digests, fixture-result digests, and accepted 332-problem baseline.
- Produces: two declared-independent mechanical seals and one separate editorial seal, all bound to the same immutable manifest.

- [ ] **Step 1: Run mechanical reviewer Atlas from the frozen manifest**

Atlas must independently replay every frozen fixture, add fresh adversarial probes for exact block order, section scoping, visible/nonempty list content, link/code lookalikes, code-fence closure/tag/content, and all Level 5 stage boundaries, and check ID, variant, normalized-target, and teaching-example collisions against the published 332. Record one verdict per candidate, exact digests, declared independence, probe counts/results, findings, and stop conditions.

- [ ] **Step 2: Run mechanical reviewer Orchid independently**

Orchid must start from the same frozen inputs without copying Atlas's conclusions. Use a different probe matrix emphasizing malformed Markdown boundaries, alternative legal markers, section overflow, nested wrappers, invisible content, wrong-scope structures, and prose mutations. Record one verdict per candidate and bind the same manifest and engine digests.

- [ ] **Step 3: Compare the two mechanical results**

Require both reviewers to accept all 12 candidates and report no unresolved finding. Any disagreement, candidate rejection, digest mismatch, or uncovered direct check blocks the entire batch. Delete all inspection artifacts, repair the authored source or fixtures, rerun prepare/verify, and restart Task 4 from reviewer one.

- [ ] **Step 4: Run the separate editorial inspection**

Only after both mechanical seals are valid, inspect every rendered Goal and source for natural contemporary US English, advanced-level fit, useful and distinct workplace/engineering scenarios, believable commands without unsafe instruction, clear authority and stop boundaries, nonduplicative targets/examples, honest grammar-only teaching, and visible structural legibility. The editorial actor must differ from both mechanical reviewers and bind both review digests.

- [ ] **Step 5: Verify sealed readiness**

```bash
npm run bank:batch:advanced-document-017:check
git diff --check
```

Expected: state is `ready-to-publish`, all three seals are digest-current, and tracker/runtime projections still report 332 because publication has not run.

- [ ] **Step 6: Commit inspection evidence**

```bash
git add curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/reviews curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/editorial.json docs/build-log.md
git commit -m "review: accept advanced document batch 017"
```

---

### Task 5: Publish the 344-problem checkpoint and reconcile current-state docs

**Files:**

- Generate: `curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/summary.generated.json`
- Generate: `curriculum/problem-bank/runtime-projections.generated.json`
- Generate: `curriculum/problem-bank/tracker.generated.json`
- Modify: `src/content/problemBank.test.ts`
- Modify: `README.md`
- Modify: `curriculum/problem-bank/README.md`
- Modify: `docs/superpowers/specs/2026-07-19-five-level-problem-bank-design.md`
- Modify: `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md`
- Modify: `docs/nabimd-decisions-2026-07-18.md`
- Modify: `docs/build-log.md`

**Interfaces:**

- Consumes: the unanimous digest-bound Task 4 evidence.
- Produces: the published 344-problem runtime projection, exact checkpoint tracker, current documentation, and runtime fixture validation.

- [ ] **Step 1: Publish only through the sealed publisher**

```bash
npm run bank:batch:advanced-document-017:publish
```

Expected: summary status is `published`; generated runtime and tracker contain 344 accepted records with split `136/148/30/20/10`; advanced families are `30/20/10`; `targetAccepted` remains 512.

- [ ] **Step 2: Extend the runtime bank test**

Import `advancedDocumentBatch017Fixtures`, append them to the published fixture array passed to `validateProblemBank`, and replace only deliberate current-count assertions:

```ts
expect(tracker.acceptedTotal).toBe(344)
expect(tracker.targetAccepted).toBe(512)
expect(tracker.counts.byLevel).toEqual({
  1: 136,
  2: 148,
  3: 30,
  4: 20,
  5: 10,
})
```

Also assert `readable-human-document: 30`, `executable-development-spec: 20`, and `agent-ready-work-order: 10` through the runtime bank. Do not add scheduler assertions or modify selection/session tests.

- [ ] **Step 3: Update only current-state documentation**

Change current counts from 332 and `28/16/4` to 344 and `30/20/10`. Describe Batch 017's five archetype/retry-family matrix and its immutable review evidence. Preserve every statement that the tracker target is 512 and preserve the existing completion floors. Report their arithmetic honestly: the aggregate tracker gap is 168, while the Level 3–5 floor deficits are 66, 60, and 70; because Levels 1–2 already exceed their floors by 28 combined, satisfying every current floor would produce at least 540 accepted problems. Record that pre-existing target/floor mismatch as unresolved Issue #9 planning work rather than changing policy in this batch.

Do not rewrite historical build-log entries or previous plans. Do not present 344 as a replacement completion target. Append publication evidence with exact generated digests and exact observed commands.

- [ ] **Step 4: Run the publication and repository gates**

```bash
npm run bank:batch:advanced-document-017:check
node --test scripts/problem-bank/batchPipeline.test.mjs
npm run bank:repository:gate
npx vitest run src/content/problemBank.test.ts src/content/batches/advancedDocumentBatch017.test.ts
npm run check
npm run test:e2e
git diff --check
```

Expected: every command passes; the repository gate accepts the append-only Batch 017 and exact generated projection; full check and local Chromium journeys pass. No completion-gate claim is made.

- [ ] **Step 5: Audit the changed-path boundary**

```bash
git diff --name-only origin/main...HEAD
git status --short
```

Expected: only the files named by this plan and generated Batch 017 evidence appear. None of the Issue #50-owned paths or `scripts/problem-bank/batchPipeline.mjs` appears.

- [ ] **Step 6: Commit the published checkpoint**

```bash
git add README.md curriculum/problem-bank/README.md curriculum/problem-bank/runtime-projections.generated.json curriculum/problem-bank/tracker.generated.json curriculum/problem-bank/batches/2026-07-20-l3-l5-advanced-documents-017/summary.generated.json docs/build-log.md docs/nabimd-decisions-2026-07-18.md docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md docs/superpowers/specs/2026-07-19-five-level-problem-bank-design.md src/content/problemBank.test.ts
git commit -m "feat: publish advanced document batch 017"
```

Expected: the published commit contains exact generated projection/tracker updates and current-state documentation. The worktree is clean afterward.

---

### Task 6: Complete PR review, merge, and production proof without closing Issue #9

**Files:**

- Modify only as validated review findings require: the smallest relevant files from Tasks 1–5.
- Modify after delivery: `docs/build-log.md` if the repository records final PR/merge/deployment evidence in a follow-up commit.

**Interfaces:**

- Consumes: the fully verified published branch and exact review-manifest/summary/tracker digests.
- Produces: a reviewed merged checkpoint, a verified production deployment, and an Issue #9 progress update that leaves the issue open.

- [ ] **Step 1: Run a whole-branch correctness review before push**

Review `git diff origin/main...HEAD` for grammar-only semantics, fixture expectation truth, digest lifecycle, append-only evidence, exact counts, source/fixture collisions, documentation accuracy, forbidden paths, and accidental issue-closing language. Fix only concrete findings, rerun the affected focused tests, and then rerun `npm run check` and `npm run test:e2e`.

- [ ] **Step 2: Push and open a non-draft PR**

```bash
git push -u origin feat/problem-bank-advanced-documents-017
gh pr create --base main --head feat/problem-bank-advanced-documents-017 --title "feat: publish advanced document batch 017" --body-file /private/tmp/nabimd-batch017-pr-body.md
```

Write the PR body with `Refs #9`, never `Closes #9`. Include the exact `2/4/6` matrix, 344 and `136/148/30/20/10` checkpoint, `30/20/10` advanced family totals, five retry families, reviewer identities and digests, editorial identity/digest, exact tests, no-new-predicate decision, Issue #50 non-overlap, unchanged 512 target, and explicit statement that Issue #9 remains open.

- [ ] **Step 3: Wait for current-head remote evidence**

Wait for GitHub Verify on the latest commit. If CodeRabbit has an active heartbeat, wait for its completed review and process every actionable comment. Use independent Codex review only if CodeRabbit provides no response/heartbeat or invocation fails. Record which reviewer produced the final evidence; do not merge on stale reviews from superseded commits.

- [ ] **Step 4: Resolve findings and re-prove the branch**

For each actionable finding, reproduce it, make the smallest in-scope correction, add or adjust the focused fixture/test, invalidate and rerun batch seals if any digest-bound input changed, reply with exact evidence, and resolve the thread. Then run:

```bash
npm run check
npm run test:e2e
git diff --check
git status --short
```

Expected: all pass, no actionable unresolved threads remain, seals bind the final head, and the worktree is clean.

- [ ] **Step 5: Merge only the reviewed head**

Confirm the PR body still says `Refs #9`, GitHub Verify is green, the final-head automated review is complete, all threads are resolved, and no external policy gate is pending. Merge through the repository's normal GitHub flow, record the resulting merge commit, and fast-forward the user's main checkout only if it can be done without overwriting user-owned changes.

- [ ] **Step 6: Obtain external-upload approval when required**

Before invoking Vercel, check the active environment policy. If production deployment requires approval because it uploads the repository/build context externally, ask the user to approve the exact `npx vercel@56.3.1 --prod --yes` operation. Do not substitute an unapproved preview deployment, and do not claim deployment from local build success.

- [ ] **Step 7: Deploy and verify the exact merge commit**

After approval when required, from the exact merged main commit run:

```bash
npx vercel@56.3.1 --prod --yes
curl -I https://nabimd.vercel.app
E2E_BASE_URL=https://nabimd.vercel.app npm run test:e2e
```

Expected: Vercel reports the production deployment Ready, `https://nabimd.vercel.app` returns HTTP 200 without authentication and serves the new deployment rather than a stale alias, and every production browser journey passes. If the public alias is stale, inspect the generated deployment URL, assign that exact deployment to `nabimd.vercel.app` with Vercel's alias command, and repeat both checks.

- [ ] **Step 8: Record and report checkpoint delivery**

Append the final PR number, reviewed head, merge commit, reviewer evidence, Vercel deployment ID/URL, alias verification, and production E2E result to `docs/build-log.md` if project practice requires committed delivery evidence. Post the same compact evidence to Issue #9 as progress, explicitly saying the issue remains open with tracker target 512 and current accepted total 344. Never close the issue from the PR, CLI, or issue comment.

## Completion Conditions

- Batch 017 is an append-only published batch with exactly 12 accepted records and no rejected or blocked record.
- Published bank total is exactly 344 with split `136/148/30/20/10`.
- Advanced family totals are exactly `30/20/10`.
- The archetype matrix is exactly two operational-impact briefs, four integration-contract specs, and two each of evidence-recovery, bounded-refactor, and coordinated-rollout work orders.
- Every required fixture role and every direct match check passes through the real learner engine.
- Two independent mechanical seals and a separate editorial seal bind the exact published manifest.
- No new predicate, runtime grading change, completion-target change, or Issue #50-owned file change is present.
- Local full verification, current-head remote review, merged-commit deployment, and production E2E all have recorded evidence.
- The PR and delivery report use `Refs #9`; Issue #9 remains open.
