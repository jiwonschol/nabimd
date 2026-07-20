---
name: authoring-nabimd-problem-banks
description: Use when adding, expanding, repairing, or reviewing Nabi Markdown problem-bank content for one or more curriculum levels.
---

# Authoring Nabi Markdown Problem Banks

Nabi teaches Markdown by typing, not workplace writing by reading. Realistic context is a thin wrapper around a Markdown shape.

**REQUIRED:** Use `superpowers:test-driven-development` while authoring and `superpowers:verification-before-completion` before handoff.

## Budgets

| Level | Shape | Goal budget | Lists |
|---|---|---:|---|
| 1 | one construct | 1–3 lines, 1–10 words | 2–3 items when needed |
| 2 | combine 2–3 constructs | 6–14 lines, 20–60 words | 2–3 items |
| 3 | readable document | at most 28 lines and 150 words | at most 3 items |
| 4 | write for work | at most 40 lines and 165 words | 2–3 items |
| 5 | write for developers | at most 40 lines and 165 words | 2–3 items |

Budgets are ceilings, never quotas. Prefer the shortest coherent miniature, and
allow Levels 4 and 5 to have the same workload: Level 5 changes the context and
syntax mix, not the reading burden. For Levels 4–5, each list item is one short
sentence, normally no more than 12 words. Every paragraph, list, quote, link,
inline-code span, and fence must create a visible Markdown decision.

Current Level 5 lessons may use inline and fenced code, blockquotes, direct and
reference links, nested lists, file paths, README fragments, bug reports, PR
descriptions, and compact agent instructions. Do not author task-list or image
lessons until their dedicated validators, fixtures, preview behavior, and
accessibility contract exist.

## Workflow

1. Read the issue and every comment, especially refinements, `Do not`, grants, and stop conditions.
2. Inspect the tracker, latest immutable batch, validators, selection reachability, worktrees, and protected paths.
3. Freeze level counts and at least two variants per retry family. Use `Refs` for checkpoints; use `Closes` only when the closing gate is met.
4. Write failing tests for counts, metadata, uniqueness, real-engine canonical matching, and the budgets above. Confirm RED.
5. Design Markdown anatomy first, then add short fictional, non-sensitive
   US-English nouns. Never republish proprietary, project-specific, personal,
   or confidential source material.
6. Grade grammar only. Never grade prose, capitalization, spelling, punctuation, heading labels, or domain truth. Keep `protectedContent: []` unless the product contract changes.
7. Generate canonical, different-prose, case/spelling, missing, malformed, and matched-with-review fixtures, plus one direct failure per match check. Replay all through `evaluateProblem`; check collisions against the batch and published bank.
8. Freeze `prepare` artifacts. Any candidate, fixture, prompt, engine contract, verification, or manifest change invalidates all seals.
9. Require two independent mechanical reviews and one editorial review. Editorial removes text that does not help the learner type Markdown.
10. Publish, update tracker-backed docs, run focused tests, full check, and browser E2E, then open a non-draft PR with actual CodeRabbit or Codex evidence.

## Reject a Goal When

- The same shape can be taught with fewer words.
- Four sibling items exist only to look professional.
- Business knowledge is required before typing.
- Realism adds prose but no Markdown decision.
- Count pressure weakens uniqueness or review evidence.

Prefer small reviewable batches. Never treat Matched as exact copying, publish stale review evidence, or claim an unfinished closing gate.
