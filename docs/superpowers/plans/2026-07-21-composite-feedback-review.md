# Composite Feedback Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** When a learner fails a composite Markdown exercise, show every failed Markdown requirement in Review and scope Hint to those same failures, while preserving the failed Review until the learner checks again.

**Architecture:** Extend the existing evaluator result with the sorted failed checks, then pass those checks through one exhaustive presentation helper. Keep grading predicates, problem-bank data, retry scheduling, and the Summary model unchanged. Review and Hint consume the same presentation model so they cannot disagree about the required syntax.

**Tech Stack:** TypeScript 7, React 19, Vitest, Testing Library, Vite, Playwright.

---

### Task 1: Collect every failed match check

**Files:**
- Modify: `src/engine/types.ts`
- Modify: `src/engine/evaluateMatch.ts`
- Modify: `src/engine/evaluateProblem.test.ts`

**Step 1: Write the failing evaluator test**

Add a focused composite problem test which supplies checks in declaration order but assigns different priorities. Assert that `feedbackId` and `message` still mirror the first sorted failure, while `failures` contains every failed check in priority/declaration order:

```ts
expect(result).toMatchObject({
  status: "fail",
  feedbackId: "required-title",
  message: "Add one document title.",
  failures: [
    { feedbackId: "required-title", message: "Add one document title." },
    { feedbackId: "required-owner", message: "Make Owner bold." },
  ],
})
```

Run `npm test -- src/engine/evaluateProblem.test.ts` and confirm it fails because `failures` is absent.

**Step 2: Add the failure collection types**

```ts
import type { MatchCheck } from "../content/types"

export type MatchFailureItem = {
  feedbackId: string
  message: string
  check: MatchCheck
}

export type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
  failures: readonly MatchFailureItem[]
}
```

**Step 3: Collect all failures after the existing stable sort**

```ts
const failures = checksByPriority
  .filter(({ check }) => !checkPasses(check, context))
  .map(({ check }) => ({
    feedbackId: check.id,
    message: check.feedback,
    check,
  }))

const firstFailure = failures[0]
if (!firstFailure) return null

return {
  status: "fail",
  feedbackId: firstFailure.feedbackId,
  message: firstFailure.message,
  failures,
}
```

Update only exact legacy assertions that intentionally compare the entire failure object; retain assertions for the compatibility fields.

**Step 4: Run focused tests**

Run `npm test -- src/engine/evaluateProblem.test.ts src/engine/emphasisPredicates.test.ts src/engine/structuralPredicates.test.ts` and confirm all pass.

**Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/evaluateMatch.ts src/engine/evaluateProblem.test.ts src/engine/*Predicates.test.ts
git commit -m "fix: collect every failed Markdown requirement"
```

### Task 2: Build one exhaustive correction-presentation helper

**Files:**
- Create: `src/feedback/correctionCues.ts`
- Create: `src/feedback/correctionCues.test.ts`

**Step 1: Write failing table tests**

Cover every `MatchCheck.kind`, including field-sensitive output for heading depth, ordered versus unordered lists, inline kinds, fenced code, and structure-only checks. Expected examples include:

```ts
expect(correctionCue(strongFailure)).toMatchObject({
  label: "Bold text",
  example: "**Important**",
})
expect(correctionCue(h2Failure)).toMatchObject({
  label: "Level 2 heading",
  example: "## Section",
})
expect(correctionCue(sequenceFailure)).toMatchObject({
  label: "Document order",
  example: null,
})
```

Also test stable exact-deduplication across repeated label/message/example triples.

Run `npm test -- src/feedback/correctionCues.test.ts` and confirm the missing module failure.

**Step 2: Implement the presentation model and exhaustive switch**

```ts
export type CorrectionCue = {
  id: string
  label: string
  message: string
  example: string | null
}

export function correctionCue(failure: MatchFailureItem): CorrectionCue {
  const { check } = failure
  switch (check.kind) {
    // all current MatchCheck variants; examples are literal Markdown source
  }
}

export function correctionCues(
  failures: readonly MatchFailureItem[],
): readonly CorrectionCue[] {
  const seen = new Set<string>()
  return failures.map(correctionCue).filter((cue) => {
    const key = `${cue.label}\u0000${cue.message}\u0000${cue.example ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```

Use an `assertNever` default so a future check kind cannot silently lack learner-facing feedback.

**Step 3: Run helper tests and typecheck**

Run `npm test -- src/feedback/correctionCues.test.ts` and `npm run typecheck`.

**Step 4: Commit**

```bash
git add src/feedback/correctionCues.ts src/feedback/correctionCues.test.ts
git commit -m "feat: describe failed Markdown requirements"
```

### Task 3: Render all corrections in Review and failure-scoped Hint

**Files:**
- Modify: `src/components/AnswerPanel.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/App.test.tsx`

**Step 1: Replace outdated UI assertions with failing behavior tests**

Add tests proving:

```ts
expect(within(review).getByText("Bold text")).toBeVisible()
expect(within(review).getByText("**Important**")).toBeVisible()
expect(review.querySelectorAll(".answer-review__correction")).toHaveLength(2)
expect(review.querySelector(".rendered-document__body")).toBeNull()
```

For Hint after a failed check, assert all and only failed correction examples are present; the unrelated problem-wide `# Title` cue must not appear when only bold is missing. Preserve existing pre-check Hint assertions for the full syntax set.

Run `npm test -- src/App.test.tsx` and confirm the new assertions fail.

**Step 2: Make Review consume correction cues**

For failed evaluations, replace the rendered target/draft comparison with a vertical correction list:

```tsx
const corrections = failed ? correctionCues(evaluation.failures) : []

<span>{`${corrections.length} ${corrections.length === 1 ? "thing" : "things"} to fix`}</span>
<ol className="answer-review__corrections">
  {corrections.map((cue) => (
    <li className="answer-review__correction" key={`${cue.id}-${cue.label}`}>
      <h4>{cue.label}</h4>
      <p>{cue.message}</p>
      {cue.example ? <code>{cue.example}</code> : null}
    </li>
  ))}
</ol>
```

Keep the existing optional matched editorial Review branch unchanged.

**Step 3: Scope failed Hint to the same cues**

Before failure, keep `sourceExamples(problem)` and the authored teaching copy. After failure, derive the sequence exclusively from `correctionCues(evaluation.failures)`. Render structure-only messages even when no literal example is available. Do not show unrelated generic problem hints after failure.

**Step 4: Add restrained scroll styling**

Make the Review/Hint body scroll internally. Keep one simple bordered correction row per failure, literal examples in the source font, and no new page-level chrome.

**Step 5: Run focused UI tests**

Run `npm test -- src/App.test.tsx` and confirm all pass.

**Step 6: Commit**

```bash
git add src/components/AnswerPanel.tsx src/styles/global.css src/App.test.tsx
git commit -m "fix: align Review and Hint with failed syntax"
```

### Task 4: Preserve failed feedback while the learner edits

**Files:**
- Modify: `src/session/learningSession.ts`
- Modify: `src/session/learningSession.test.ts`

**Step 1: Write the failing reducer test**

After a failed Check, dispatch `edited` and assert:

```ts
expect(edited.phase).toBe("editing")
expect(edited.evaluation).toBe(failed.evaluation)
expect(canAdvance(edited)).toBe(false)
```

Also assert a subsequent `checked` event replaces the old failure, and a matching check clears it by replacing it with the matched evaluation.

Run `npm test -- src/session/learningSession.test.ts` and confirm the persistence assertion fails.

**Step 2: Preserve only failed evaluation on edit**

Replace the unconditional clear with `evaluation: session.evaluation?.status === "fail" ? session.evaluation : null`. The existing `phase: "editing"` keeps Next disabled; clearing a prior Matched evaluation also prevents the top bar from showing a stale Next control, while replacement/navigation transitions continue to clear feedback.

**Step 3: Run session and App tests**

Run `npm test -- src/session/learningSession.test.ts src/session/useLearningSession.test.tsx src/App.test.tsx`.

**Step 4: Commit**

```bash
git add src/session/learningSession.ts src/session/learningSession.test.ts src/App.test.tsx
git commit -m "fix: keep failed Review visible while editing"
```

### Task 5: Full verification, one review, merge, and deploy

**Files:**
- Modify only if verification or the single review finds a concrete defect.

**Step 1: Run the full repository gate**

Run `npm run check`.

**Step 2: Run browser regression at 1280x800**

On the deployed/local preview, reproduce the Level 3 composite Owner failure with `# Owner:` in place of `**Owner:**`. Verify:

- Review lists every failed requirement once and shows literal Markdown marks.
- Hint lists those same failures and no unrelated syntax.
- Write remains editable; Review persists during edits.
- Recheck replaces the list; a correct answer reaches Matched.
- A Level 1 failure still gives one clear correction.
- No console errors; page chrome remains fixed at 1280x800.

**Step 3: Request exactly one independent code review**

Review the complete branch diff once. Fix actionable findings once, rerun focused tests and `npm run check`, and do not start another review cycle.

**Step 4: Publish, merge, and deploy**

Push the branch, open a PR referencing issue #78 as future work (not closing it), merge after the single review and green checks, synchronize `main`, and verify the production deployment and primary browser regression.
