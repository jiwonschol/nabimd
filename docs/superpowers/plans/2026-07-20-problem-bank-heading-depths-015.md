# Problem Bank Heading Depths Batch 015 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish one independently vetted 24-problem batch that teaches ATX heading depths H2-H6 at Level 1 and meaningful H1-H3 document hierarchy at Level 2.

**Architecture:** Follow the immutable schema-v2 batch pipeline established by Batches 013-014. Author normalized problems and real-engine fixtures in focused source files, freeze generation/verification artifacts before any review, require two independent mechanical seals plus a separate editorial seal, then publish only the unanimously accepted records into generated runtime projections.

**Tech Stack:** TypeScript, React content models, unified/remark Markdown AST, Vitest, Node batch tooling, generated JSON evidence, GitHub PR review.

## Global Constraints

- Exactly 24 `standard` problems: 12 Level 1 and 12 Level 2.
- Level 1 teaches one ATX heading depth at a time; Level 2 rebuilds a complete visible target that combines several syntaxes.
- Grading is structural and grammar-only. Wording, capitalization, spelling, punctuation, and semantic truth are never pass/fail operands.
- Do not switch any grading to exact-string matching.
- Do not change existing verdict semantics. This batch adds no new predicate and uses existing heading, block-sequence, heading-depth-order, list, and blockquote checks.
- Do not add runtime AI calls or any runtime network dependency.
- Do not add GFM content, flavor UI, HTML lessons, images, tables, task lists, strikethrough, autolinks, or footnotes.
- Do not crawl third-party sites for vocabulary. Use generated everyday US-English vocabulary and manually inspect it.
- Do not edit Issue #50-owned paths: `src/content/entryChoices.ts`, `src/selection/runComposition.ts`, `src/selection/runComposition.test.ts`, `src/session/**`, `src/progress/**`, `tests/e2e/heading-flow.spec.ts`, or `src/App.test.tsx`.
- Source batch ID is exactly `2026-07-20-l1-heading-depth-l2-sectioned-documents-015`.
- Pre-review freeze must not contain reviewer JSON, `editorial.json`, or a published `summary.generated.json`.
- After review starts, any candidate, fixture, engine-contract, or manifest change invalidates all reviewer and editorial seals and requires a complete rerun.
- Expected accepted-bank total after publication is 320 with level split `136/136/28/16/4`.

---

### Task 1: Author and freeze the pre-review batch

**Files:**
- Create: `src/content/batches/headingDepthBatch015Problems.ts`
- Create: `src/content/batches/headingDepthBatch015Fixtures.ts`
- Create: `src/content/batches/headingDepthBatch015.test.ts`
- Create: `scripts/problem-bank/headingDepthBatch015Support.ts`
- Create: `scripts/problem-bank/headingDepthBatch015Artifacts.gate.ts`
- Create: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/generation-prompt.md`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/candidates.raw.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/candidates.normalized.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/fixtures.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/verification.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/engine-contract.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/review-manifest.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/prepared-summary.generated.json`
- Modify: `package.json`
- Modify: `vitest.gate.config.ts`
- Modify: `docs/build-log.md`
- Test: `src/content/batches/headingDepthBatch015.test.ts`
- Test: `scripts/problem-bank/headingDepthBatch015Artifacts.gate.ts`

**Interfaces:**
- Consumes: `NormalizedProblem`, existing `heading-spacing`, `hash-heading-style`, `has-heading`, `block-sequence`, `heading-depth-order`, `list-shape`, and `blockquote-shape` checks.
- Produces: `headingDepthBatch015Problems`, `headingDepthBatch015Fixtures`, deterministic pre-review artifacts, and the npm commands `bank:batch:heading-depth-015:prepare`, `bank:batch:heading-depth-015:check`, `bank:batch:heading-depth-015:publish`.

- [ ] **Step 1: Write the failing batch-shape and grammar-contract tests**

The test must assert:

```ts
expect(headingDepthBatch015Problems).toHaveLength(24)
expect(headingDepthBatch015Problems.filter((problem) => problem.level === 1)).toHaveLength(12)
expect(headingDepthBatch015Problems.filter((problem) => problem.level === 2)).toHaveLength(12)
expect(new Set(headingDepthBatch015Problems.map((problem) => problem.id)).size).toBe(24)
expect(new Set(headingDepthBatch015Problems.map((problem) => problem.contentVariant)).size).toBe(24)
```

For Level 1 assert the exact depth distribution `{2: 3, 3: 3, 4: 2, 5: 2, 6: 2}`, `teachingMode === "introduce"`, `vocabulary.profile === "everyday"`, one heading-only exact block sequence, and ATX-specific spacing/style checks at the declared depth.

For Level 2 assert exactly four problems in each retry family:

```ts
const expectedRetryFamilies = new Map([
  ["level-2-sectioned-process", 4],
  ["level-2-sectioned-checklist", 4],
  ["level-2-sectioned-message", 4],
])
```

Assert `teachingMode === "recall"`, `vocabulary.profile === "everyday-recall"`, no learner-facing title contains `recall`, and every record has an exact block sequence plus `heading-depth-order` with `allowSkippedDepths: false`.

Run:

```bash
npx vitest run src/content/batches/headingDepthBatch015.test.ts
```

Expected: FAIL because the Batch 015 modules do not exist.

- [ ] **Step 2: Author the 12 Level 1 problems**

Use exactly this matrix; the teaching example must never equal any Goal target:

| ID | Depth | Goal | Teaching example | Domain |
|---|---:|---|---|---|
| `l1-heading-depth-snack-ideas` | 2 | `## Snack ideas` | `## Paper stars` | `everyday-food` |
| `l1-heading-depth-pool-pass` | 2 | `## Pool pass` | `## Morning bell` | `everyday-outdoors` |
| `l1-heading-depth-yard-sale` | 2 | `## Yard sale` | `## Warm cookies` | `neighborhood` |
| `l1-heading-depth-bus-stop` | 3 | `### Bus stop` | `### Blue pencil` | `local-travel` |
| `l1-heading-depth-tea-break` | 3 | `### Tea break` | `### Shoe box` | `daily-routine` |
| `l1-heading-depth-bring-along` | 3 | `### Bring along` | `### After dinner` | `daily-planning` |
| `l1-heading-depth-map-key` | 4 | `#### Map key` | `#### Lemon slices` | `navigation` |
| `l1-heading-depth-pet-bowl` | 4 | `#### Pet bowl` | `#### Garden gate` | `pet-care` |
| `l1-heading-depth-movie-seat` | 5 | `##### Movie seat` | `##### Orange cup` | `leisure` |
| `l1-heading-depth-clean-shelf` | 5 | `##### Clean shelf` | `##### Paper plane` | `home-care` |
| `l1-heading-depth-lost-mitten` | 6 | `###### Lost mitten` | `###### Green bowl` | `clothing` |
| `l1-heading-depth-dog-leash` | 6 | `###### Dog leash` | `###### Blue blanket` | `pet-care` |

Each record must use `familyId: "headings"`, `skillIds: ["heading-h1"]` so the existing scheduler classifies it as the heading family without touching Issue #50, `difficulty: "warmup"`, and `retryFamily: "level-1-heading-depth"`. `syntaxTokens` must show the exact hash run and a following space.

The three structural checks are:

```ts
{ kind: "heading-spacing", level: depth, text: undefined }
{ kind: "hash-heading-style", level: depth, text: undefined }
{ kind: "block-sequence", scope: { kind: "document" }, exact: true, sequence: [{ block: "heading", depth }] }
```

Give each check a unique ID, priority, and plain feedback. The instructional sentence is: `Start the line with exactly N hash marks, then a space.` H2 lessons may mention that this exercise uses the hash form; do not imply Setext is invalid Markdown generally.

- [ ] **Step 3: Author the 12 Level 2 rebuilds**

Use exactly these scenario IDs and exact block anatomy:

```ts
const level2Inputs = [
  { id: "l2-sectioned-process-car-wash", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"] },
  { id: "l2-sectioned-process-blanket-fort", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"] },
  { id: "l2-sectioned-process-bird-feeder", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"] },
  { id: "l2-sectioned-process-sort-mail", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"] },
  { id: "l2-sectioned-checklist-pool-day", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"] },
  { id: "l2-sectioned-checklist-indoor-art", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"] },
  { id: "l2-sectioned-checklist-bake-sale", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"] },
  { id: "l2-sectioned-checklist-bike-repair", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"] },
  { id: "l2-sectioned-message-lost-and-found", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"] },
  { id: "l2-sectioned-message-book-swap", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"] },
  { id: "l2-sectioned-message-bus-stop", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"] },
  { id: "l2-sectioned-message-school-play", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"] },
] as const
```

Targets must be short, useful rendered documents with distinct US-English wording. Process documents have at least three nonempty ordered steps. Checklist documents have at least two nonempty bullet items. Message documents have a nonempty blockquote after the H3. The match checks must enforce only the exact block sequence, no skipped heading depths, and the relevant list/blockquote shape. They must not read title or body strings.

Use `familyId: "rebuild-sectioned-documents"`; `skillIds` enumerate the shown syntax (`heading-h1`, the existing list or blockquote skill); `difficulty: "mixed"`; retry families are the three exact keys above. Learner-facing prompt: `Rebuild the rendered document as Markdown. Your wording may differ, but keep the same Markdown shape.`

- [ ] **Step 4: Build adversarial fixtures against the real engine**

Every problem requires canonical, different-prose, and case/spelling-variation fixtures that Match. L1 must additionally cover wrong depth, missing space, extra block, escaped hashes, fenced-code lookalike, nested heading, and Setext H2 where applicable. L2 must additionally cover missing heading, wrong depth, skipped hierarchy, wrong order, missing paragraph, wrong list kind, too few/nonempty list items, empty/missing quote, and extra block under the exact sequence.

Fixture expectations must name the check they exercise. Different-prose and case/spelling fixtures must use fresh text derived from that specific problem, not one shared unrelated sentence.

Run:

```bash
npx vitest run src/content/batches/headingDepthBatch015.test.ts src/engine/structuralPredicates.test.ts src/content/validateProblemBankV2.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement deterministic prepare/check/publish tooling**

Use the immutable Batch 014 lifecycle but bind every constant to Batch 015. The support module must:

- materialize the exact 24 problems and their fixtures;
- validate them with `validateProblemBank`;
- run every fixture through the real learner engine;
- bind raw, normalized, fixture, verification, engine-contract, and prompt digests into one review manifest;
- reject regeneration after reviewer evidence exists;
- report prepublication total 296;
- publish only after two declared-independent reviewer verdict sets and one separate editorial verdict set unanimously accept all 24;
- generate tracker/runtime projections deterministically to 320 accepted problems.

Add package scripts with these exact names:

```json
"bank:batch:heading-depth-015:prepare": "tsx scripts/problem-bank/headingDepthBatch015Support.ts prepare",
"bank:batch:heading-depth-015:check": "vitest run scripts/problem-bank/headingDepthBatch015Artifacts.gate.ts --config vitest.gate.config.ts --reporter=verbose",
"bank:batch:heading-depth-015:publish": "tsx scripts/problem-bank/headingDepthBatch015Support.ts publish"
```

Append `npm run bank:batch:heading-depth-015:check` to `bank:batch:generate:check`.

- [ ] **Step 6: Freeze the pre-review evidence and verify**

Run:

```bash
npm run bank:batch:heading-depth-015:prepare
npm run bank:batch:heading-depth-015:check
npm test
npm run typecheck
git diff --check
```

Expected: all Batch 015 mechanical gates pass; the whole unit suite and typecheck pass; repository publication gate may fail only because editorial evidence is intentionally absent. The pre-review tracker/runtime projection files must remain byte-identical to main.

Record in `docs/build-log.md`: why heading depth was chosen over indented code, paragraphs/line breaks, and images; the Issue #50 non-overlap decision; candidate and fixture counts; exact commands; all frozen digests; and any rejected pre-freeze draft.

- [ ] **Step 7: Commit the pre-review freeze**

```bash
git add docs/superpowers/plans/2026-07-20-problem-bank-heading-depths-015.md docs/build-log.md package.json vitest.gate.config.ts src/content/batches/headingDepthBatch015Problems.ts src/content/batches/headingDepthBatch015Fixtures.ts src/content/batches/headingDepthBatch015.test.ts scripts/problem-bank/headingDepthBatch015Support.ts scripts/problem-bank/headingDepthBatch015Artifacts.gate.ts curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015
git commit -m "feat: freeze heading depth problem bank batch 015"
```

### Task 2: Independently review, publish, and prepare the PR

**Files:**
- Create: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/reviews/reviewer-atlas.json`
- Create: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/reviews/reviewer-orchid.json`
- Create: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/editorial.json`
- Generate: `curriculum/problem-bank/batches/2026-07-20-l1-heading-depth-l2-sectioned-documents-015/summary.generated.json`
- Modify generated: `curriculum/problem-bank/runtime-projections.generated.json`
- Modify generated: `curriculum/problem-bank/tracker.generated.json`
- Modify: `README.md`
- Modify: `curriculum/problem-bank/README.md`
- Modify: `docs/build-log.md`
- Modify: `docs/superpowers/specs/2026-07-19-five-level-problem-bank-design.md`
- Modify tests only where published totals are deliberately asserted: `src/content/problemBank.test.ts`

**Interfaces:**
- Consumes: the immutable Task 1 review manifest and exact engine contract.
- Produces: two independent mechanical seals, one separate editorial seal, the published 320-problem runtime bank, and a PR carrying `Refs #9`.

- [ ] **Step 1: Run two independent mechanical reviewers in parallel**

Each reviewer must execute every frozen fixture through the real engine, add fresh adversarial probes, prove all 24 IDs have one verdict, report zero collisions with the published 296, and bind its identity plus the exact manifest and engine digests. Reviewer identities and probe sets must differ.

- [ ] **Step 2: Run the separate editorial review only after both mechanical seals exist**

Editorial must inspect all 24 rendered Goals and source targets for natural US English, level fit, hierarchy quality, distinct scenarios, useful L2 documents, vocabulary progression, teaching-example collisions, and hidden prose grading. Any rejection invalidates publication; rewrite the source, delete all three seals, regenerate, and restart Task 2.

- [ ] **Step 3: Publish and verify the accepted bank**

```bash
npm run bank:batch:heading-depth-015:publish
npm run check
npm run test:e2e
git diff --check
```

Expected: tracker total 320 with split `136/136/28/16/4`, every batch/repository gate passes, full unit suite passes, production build and fixture-exclusion check pass, and Chromium E2E passes.

- [ ] **Step 4: Commit and open the reviewed PR**

```bash
git add README.md curriculum/problem-bank docs package.json scripts src vitest.gate.config.ts
git commit -m "feat: publish heading depth problem bank batch 015"
git push -u origin feat/problem-bank-heading-depths-015
gh pr create --base main --head feat/problem-bank-heading-depths-015 --title "feat: publish problem bank batch 015" --body-file /private/tmp/nabimd-batch015-pr-body.md
```

The PR body must include `Refs #9`, all unforeseen decisions, exact counts/digests/tests, rejected drafts, reviewer identities, and the deliberate non-overlap with #50. It must not say `Closes #9` because 320 is below the final target.
