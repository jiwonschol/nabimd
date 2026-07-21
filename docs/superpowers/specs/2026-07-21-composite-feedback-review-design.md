# Composite-problem feedback and Review

**Date:** 2026-07-21

**Status:** Time-boxed design approved by Jiwon on 2026-07-21

## Deadline decision

Nabi has about eighteen hours remaining before its Build Week submission.
This fix must repair misleading feedback without introducing a new feedback
authoring system or migrating the problem bank.

The implementation is time-boxed to approximately three hours, with four
hours as the stop-and-report boundary.

## Problem

The evaluator stops at the first failed check. Level 3–5 exercises contain
several required Markdown structures, so one answer may contain several
independent errors.

If a Goal requires `**Owner:**` and the learner writes `# Owner:`, the current
system reports an earlier document-outline failure. Review emphasizes the
rendered H1, while Hint begins with generic `#` guidance. The learner should
instead see every failed requirement, including the required bold syntax.

## Required behavior

### Check

- Evaluate every match check for the current answer.
- Return every failed check in one failed evaluation.
- Keep the existing top-level `feedbackId` and `message` fields, derived from
  the first failure, so existing session and verdict consumers continue to
  work.
- Keep the two verdicts: Try again and Matched.
- Continue grading Markdown grammar only. Do not grade prose, capitalization,
  spelling, punctuation, or exact wording.

### Review

- A failed Check replaces Preview with Review and opens Review immediately.
- Review lists every failed requirement vertically inside its existing
  internally scrolling page.
- Each item shows:
  - the beginner-facing Markdown or structure name;
  - the existing authored failure message; and
  - a literal required Markdown example when the failed check has one.
- Structure-only checks may show the failure message without inventing a
  source example.
- Use the authored check order after existing priority sorting. Do not attempt
  learner-source or Goal-position alignment in this deadline fix.
- Remove only exact duplicate correction entries. Do not attempt causal
  deduplication between different checks.
- Do not render the learner's entire failed document as the correction. Source
  marks such as `**` must remain visible.
- A long Review is acceptable and scrolls inside the right page. The fixed
  book frame and tabs do not move.

### Review persistence

- Selecting Write returns focus to the editor.
- Editing does not erase the last failed Review.
- Review and failed Hint continue to describe the last checked submission
  until the learner checks again.
- A failed recheck replaces the old failures with the new complete list.
- A Matched recheck clears failed Review data. Preview returns unless the
  existing optional Matched editorial Review is present.
- Next, Try another, home, Exit, a new problem, and a new run clear stale
  failed Review data through their existing session transitions.

### Hint

- Before a failed Check, Hint continues to show the full syntax set authored
  for the current problem.
- After a failed Check, Hint shows all and only correction cues derived from
  the failed checks.
- Hint never teaches an unrelated mark merely because the learner typed it.
- Exact duplicate syntax cues may be collapsed.
- The existing progressive hint control may remain, but its visible syntax
  cues must stay scoped to the current failed checks.

## Correction cues

Add one exhaustive presentation helper that maps existing check data to
beginner-facing cues. It does not modify problem records.

Required mappings include:

- bold emphasis: `**Important**`;
- italic emphasis: `*Note*`;
- H1: `# Title`;
- H2 and deeper headings: the required number of `#` marks plus a space;
- blockquote: `> Note`;
- bullet list: `- Item`;
- numbered list: `1. Step`;
- inline code: `` `command` ``;
- link: `[Label](https://example.com)`;
- fenced code: a short complete fenced example; and
- thematic break: `---`.

Whole-document sequence, hierarchy, count, and limit checks use their authored
failure message and may omit a source cue.

The helper derives cues only from `MatchCheck.kind` and its existing fields,
such as inline type, heading depth, or ordered-list state. It must be
TypeScript-exhaustive so a future check kind cannot silently lose Review help.

## Evaluation shape

A failed evaluation adds a `failures` collection while retaining compatibility
fields:

```ts
type MatchFailureItem = {
  feedbackId: string
  message: string
  check: MatchCheck
}

type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
  failures: readonly MatchFailureItem[]
}
```

Matched evaluation and optional editorial `reviewItems` keep their current
shape and behavior.

## Component boundaries

- `evaluateMatch` collects all failed checks.
- A focused correction-cue helper converts failed checks into display data.
- Session state preserves the latest evaluation while an evaluated answer is
  edited; `phase` still prevents Next until a fresh Matched Check.
- `AnswerPanel` renders all failed corrections and uses the same corrections
  to scope post-failure Hint.
- The problem bank, selection logic, retry scheduling, Summary model, and
  Markdown parser are unchanged.

## Verification

Automated regression tests must prove:

1. multiple failed checks are returned together;
2. existing compatibility `feedbackId` and `message` remain deterministic;
3. a composite bold requirement answered with `#` includes a bold correction
   and literal `**Important**` cue;
4. several independent syntax failures all appear in Review;
5. structure-only failures render without a fabricated syntax example;
6. failed Hint shows only cues associated with current failures;
7. Review remains available after returning to Write and editing;
8. a recheck replaces the correction list;
9. Matched restores Preview or the existing optional Matched Review and enables
   Next; and
10. existing keyboard, focus, verdict, retry, transfer, and grammar-only
    contracts remain intact.

Browser verification covers one Level 1 failure and the reproduced Level 3
`# Owner:` failure at 1280 x 800. It verifies Review scrolling, Write/Review
round-tripping, failed Hint contents, recheck, Matched/Next, and console errors.

Run the complete repository check, perform one code review, address that
review once, then merge and deploy.

## Explicitly deferred

- Learner-source excerpts and exact error highlighting.
- Goal-slot or source-position metadata.
- AST alignment between Goal and learner answer.
- Causal grouping of different checks caused by one edit.
- Manual changes or metadata migration across problem-bank records.
- New Review layout concepts, routes, columns, modals, or visual redesign.
- Runtime AI, external APIs, live correction, or prose comparison.
