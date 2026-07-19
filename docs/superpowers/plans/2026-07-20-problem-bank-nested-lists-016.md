# Problem Bank Nested Lists Batch 016 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task by task.

**Goal:** Publish one independently vetted 12-problem Level 2 batch that teaches learners to rebuild useful documents containing exactly one nested list.

**Architecture:** Reuse the immutable schema-v2 lifecycle from Batch 015. Author normalized problems and real-engine fixtures, freeze every generated input before review, require two independent mechanical seals plus a separate editorial seal, and publish only unanimous records. This batch uses only existing structural predicates and does not change runtime verdict semantics or Issue #50-owned selection/session files.

**Tech Stack:** TypeScript, Markdown AST structural predicates, Vitest, Node batch tooling, immutable JSON evidence, GitHub PR review.

## Global Constraints

- Exactly 12 `standard` Level 2 problems in three retry families of four.
- Every problem is a complete visible-target rebuild, not a syntax lecture disguised as Level 2.
- Grading is structural only. Wording, capitalization, spelling, punctuation, and semantic truth are never pass/fail operands.
- Require exactly one top-level list containing exactly one descendant list by combining an exact root block sequence with recursive list count `min: 2, max: 2`.
- Top-level list order may be required; descendant marker kind is deliberately marker-agnostic because the current engine does not constrain it independently.
- Do not switch to exact-string matching, change existing verdict semantics, add runtime AI/network calls, add GFM, or crawl vocabulary.
- Do not touch Issue #50-owned paths: `src/content/entryChoices.ts`, `src/selection/runComposition.ts`, `src/selection/runComposition.test.ts`, `src/session/**`, `src/progress/**`, `src/App.test.tsx`, or `tests/e2e/heading-flow.spec.ts`.
- Do not publish the preferred paragraph-separation family in this batch: Level 1 cannot schedule it without the forbidden taxonomy paths.
- Source batch ID is exactly `2026-07-20-l2-nested-list-documents-016`.
- Pre-review freeze contains no reviewer JSON, `editorial.json`, or published `summary.generated.json`.
- Any material source/fixture/contract/manifest edit after review starts invalidates every seal and restarts review.
- Expected published total is 332 with split `136/148/28/16/4`.

---

### Task 1: Author and freeze the pre-review batch

**Create:**

- `src/content/batches/nestedListBatch016Problems.ts`
- `src/content/batches/nestedListBatch016Fixtures.ts`
- `src/content/batches/nestedListBatch016.test.ts`
- `scripts/problem-bank/nestedListBatch016Support.ts`
- `scripts/problem-bank/nestedListBatch016Artifacts.gate.ts`
- `curriculum/problem-bank/batches/2026-07-20-l2-nested-list-documents-016/generation-prompt.md`
- generated pre-review artifacts under that immutable batch directory

**Modify:** `package.json`, `vitest.gate.config.ts`, `docs/build-log.md`.

- [ ] **Step 1: Write failing shape and reachability tests**

Assert 12 unique IDs/variants, Level 2 only, `everyday-recall`, `teachingMode: "recall"`, three retry families with four variants each, multi-skill classification so Level 2 treats them as composite rebuilds, and no learner-facing use of the legacy word `recall`.

The three families are:

1. `level-2-nested-checklist`: exact root `H1 > paragraph > unordered list`.
2. `level-2-nested-outline`: exact root `H1 > H2 > paragraph > unordered list`.
3. `level-2-nested-steps`: exact root `H1 > paragraph > ordered list`.

Each problem must have:

```ts
{
  kind: "block-sequence",
  scope: { kind: "document" },
  exact: true,
  sequence: /* family root anatomy */,
}
{
  kind: "list-shape",
  scope: { kind: "document" },
  ordered: /* family root order */,
  minItems: 2,
  requireNonemptyItems: true,
}
{
  kind: "block-count",
  scope: { kind: "document" },
  block: "list",
  recursive: true,
  min: 2,
  max: 2,
}
```

Run the focused test and confirm RED because the modules do not exist.

- [ ] **Step 2: Author 12 distinct US-English rebuilds**

Use four genuinely different everyday scenarios per family. Suitable domains include a picnic bag, school supplies, a closet shelf, a grocery basket, a small garden, a reading plan, a weekend route, a pet-care routine, a laundry routine, a simple meal, a craft table, and a room reset. Do not reuse a target, teaching example, or content variant from the accepted bank.

Targets must demonstrate one nested list and exactly the declared root anatomy. Keep documents short enough for Level 2 and useful enough to look like real notes. Teaching copy must say “nest one list inside another”; it must not promise that the child marker has to match the parent marker.

Use `familyId: "rebuild-nested-list-documents"`, `difficulty: "mixed"`, at least two existing skill IDs so `getSyntaxFamily()` returns null and Level 2 composite selection reaches the batch, and `protectedContent: []`.

- [ ] **Step 3: Build adversarial real-engine fixtures**

Every problem must include canonical, different-prose, and capitalization/spelling-variation Matched fixtures plus:

- valid alternative indentation: Matched;
- alternative list markers: Matched;
- mixed child marker: Matched, explicitly freezing the marker-agnostic contract;
- flat list/no descendant: Try again on nested-list count;
- insufficient indentation: Try again;
- two sibling root lists or a third list depth: Try again;
- missing list, wrong root order, too few root items, and extra root block: Try again on the intended check;
- fenced/indented-code list lookalikes and blockquote-only nested lists: Try again.

Run focused content, structural-predicate, and schema-v2 validation tests. Add cross-bank collision assertions for IDs, targets, teaching examples, and content variants.

- [ ] **Step 4: Implement deterministic prepare/check/publish tooling**

Copy the proven authored-batch lifecycle, binding every constant to sequence 16 and this exact source batch. Add:

```json
"bank:batch:nested-list-016:prepare": "tsx scripts/problem-bank/nestedListBatch016Support.ts prepare",
"bank:batch:nested-list-016:check": "vitest run scripts/problem-bank/nestedListBatch016Artifacts.gate.ts --config vitest.gate.config.ts --reporter=verbose",
"bank:batch:nested-list-016:publish": "tsx scripts/problem-bank/nestedListBatch016Support.ts publish"
```

Move the generic `bank:batch:generate` and `bank:batch:publish` aliases to Batch 016 and append the Batch 016 check to the aggregate check chain.

The gate must prove all fixtures execute through the real learner engine, prepublication remains 320, two declared-independent reviewers and a separate editor are required, regeneration locks after evidence appears, and unanimous publication produces exactly 332 accepted problems.

- [ ] **Step 5: Freeze and verify**

Run prepare, Batch 016 gate, focused tests, full unit suite, typecheck, and `git diff --check`. Record the scope decision, paragraph blocker, source references, counts, fixture total, exact commands, and digests in `docs/build-log.md`.

- [ ] **Step 6: Commit the immutable pre-review freeze**

Commit only the plan, authored content/fixtures/tests, support/gate, package/gate config changes, build-log entry, and pre-review artifacts. Confirm no reviewer/editorial/published aggregate files exist.

### Task 2: Independently inspect, publish, and open the PR

- [ ] **Step 1: Run two independent mechanical reviewers in parallel**

Each reviewer independently replays every frozen fixture with the real engine, adds a distinct adversarial probe set, verifies all 12 verdicts and no accepted-bank collisions, and binds its identity to the exact manifest and engine digests.

- [ ] **Step 2: Run a separate editorial inspection**

Inspect all rendered Goals and sources for natural contemporary US English, Level 2 fit, useful document shape, correct visual nesting, varied vocabulary/scenarios, honest marker-agnostic teaching, and absence of hidden prose grading. Any rejection deletes all seals, repairs source, regenerates everything, and restarts Task 2.

- [ ] **Step 3: Publish and update aggregate evidence/docs**

Generate `summary.generated.json`, runtime projections, tracker, README/problem-bank README/spec/build-log counts, and only deliberate count assertions. Tracker must be 332 with split `136/148/28/16/4` and family `rebuild-nested-list-documents: 12`.

Correct stale curriculum documentation only when it is directly evidenced by this batch; preserve the technical `teachingMode: "recall"` compatibility value.

- [ ] **Step 4: Full verification and independent final review**

Run `npm run check`, local Chromium E2E, targeted publication tests, typecheck, `git diff --check`, and a whole-branch review. Re-run all affected verification after every correction.

- [ ] **Step 5: PR, review loop, merge, production proof**

Push and open a non-draft PR with `Refs #9` (never `Closes #9`). Enumerate the paragraph deferral, marker-agnostic child decision, 12-problem batch size, all rejected drafts, reviewer identities/digests, counts, and exact tests. Wait for an active CodeRabbit review; use independent Codex fallback only for no response/invocation failure/rate limit. Resolve every actionable thread, rerun verification, merge only with green checks and no unresolved threads, verify the exact merge, deploy the exact merge commit, run production E2E, and post delivery evidence to Issue #9.
