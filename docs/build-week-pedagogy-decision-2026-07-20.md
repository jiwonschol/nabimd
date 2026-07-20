# Build Week Pedagogy Decision — Practice, Not a Mastery System

**Date:** 2026-07-20

**Status:** Product direction accepted

**Context:** OpenAI Build Week, Education track

## The unresolved problem

Nabi Markdown had a working learning loop, a vetted problem bank, and a clear
grading boundary, but one product question remained unresolved:

> How much learning machinery should a deliberately simple Markdown practice
> app contain?

Markdown is easy to understand and difficult to use without thinking. Learning
science therefore points naturally toward retrieval practice, scaffold fading,
spacing, and repeated recall. Codex initially followed that evidence to a
coherent but heavier proposal: retain a local skill history, remember weak
syntax families across visits, schedule spaced review, and distinguish
supported answers from stable recall.

The proposal was educationally defensible and wrong for Nabi.

Jiwon identified the product cost that the research framing had obscured. Nabi
should feel like opening a book for ten quiet minutes, not sitting down for a
managed course. Accounts, streaks, daily obligations, placement tests, mastery
gates, and a persistent learner profile would make the product more complete as
a learning system while making it less inviting as Nabi.

This was the hardest product question in the project because both directions
were reasonable. The answer required deciding what Nabi is willing not to be.

## What we examined

The decision combined three forms of evidence:

1. A learning-science review of retrieval practice, worked examples, scaffold
   fading, feedback, interleaving, and successive relearning.
2. A read-only four-lens audit of the repository plus a first-time production
   playthrough, preserved in
   [`nabimd-pedagogy-review-2026-07-19.md`](../nabimd-pedagogy-review-2026-07-19.md).
3. The product owner's lived constraint: Nabi must remain a zero-friction,
   no-account place where a person can type for a few minutes and leave without
   creating another obligation.

The audit found that the lightweight parts were already the strongest parts of
the application:

- one click from the open-book landing page into a focused exercise;
- prose-first completion problems at Levels 1–2;
- explicit Check instead of live correction;
- two verdicts, `Try again` and `Matched`;
- penalty-free Hint and a different-content repair after a failed Check;
- no lives, XP, streak, signup, or permanent red marks; and
- a fixed CBT frame that requires no interface tutorial.

It also found that the largest teaching defect was not the absence of a mastery
engine. Level 3–5 briefs sometimes graded structures that the learner could not
derive from the visible question, and their feedback referred to an invisible
`Goal`. A more sophisticated scheduler would not repair that breach of trust.

## The decision

Nabi is a **drop-in Markdown practice room**, not a mastery-management system.

For the Build Week product:

- progress remains browser-session scoped;
- Nabi does not remember skill weakness across visits;
- there is no account, streak, daily goal, placement test, or level gate;
- all five levels remain directly selectable;
- every level must be self-contained enough to attempt on a fresh visit;
- the six-problem turn remains the predictable session unit for now;
- support may fade inside a turn, but there is no cross-visit mastery vector;
- a failed Check may trigger one different-content repair of the same Markdown
  skill, without punishment; and
- Summary describes the syntax used and the small number of patterns worth
  revisiting, rather than presenting a transcript of mistakes.

The user-facing promise is deliberately smaller than guaranteed mastery:

> Open a page. Type for ten minutes. Leave Markdown feeling a little more
> natural.

## What this changes

The five levels keep their existing names, but they are not treated as a gated
school ladder. Levels 1–2 describe learning modes; Levels 3–5 describe useful
document contexts. A new visitor may start anywhere.

That freedom makes transparent questions non-negotiable. Every structure that
can cause `Try again` must be discoverable from the visible instruction or an
available Hint. The later D14–D17 correction supersedes the partially built
skeleton and blank-composition proposal recorded during this review: every
level now has one fixed rendered Goal, and the answer starts with the same
learner-visible prose and line breaks with Markdown marks removed. The learner
restores structure rather than inventing or transcribing a document. Level 5
uses the same contract for short developer-facing examples; a complete
work-order convention is historical reference material, not a learner
prerequisite.

The current interleaved Level 1 selection and six-slot progress rail stay in
place for the Build Week version. Challenge selection must stop introducing
unseen prerequisites, and upper-level documents must remain short enough that
the turn still feels casual. Real play time, not document realism, determines
whether the high-level turn count changes later.

The completion data model is also retained: failures are aggregated by syntax
family rather than replayed as a list of wrong answers. The visual hierarchy
will change. Completion, one concrete strength, one pattern to revisit, and the
next practice action come first. Score and elapsed time are secondary. A
percentile or anonymous standing is outside this no-pressure version.

## Work created by the decision

The accepted follow-up is intentionally split by responsibility:

1. [Repair the Level 3–5 teaching contract](https://github.com/jiwonschol/nabimd/issues/59):
   a fixed visible Goal, Goal-derived starter prose, prerequisite-safe
   challenges, and precise beginner-facing hint copy. This wording reflects
   the later D14–D17 resolution; the original bridge proposal above is retained
   only as decision history.
2. [Bring Practice into the open-book visual world](https://github.com/jiwonschol/nabimd/issues/60)
   without weakening the proven CBT interaction contract.
3. [Redesign Summary as a calm closing page](https://github.com/jiwonschol/nabimd/issues/61):
   acknowledge completion, name what worked, surface only the syntax worth
   revisiting, and offer one obvious next action.

These are separate issues and PRs because content trust, exercise chrome, and
completion information hierarchy fail in different ways and require different
verification.

## How Codex contributed

Codex did more than implement a chosen answer. It:

- reconstructed the current curriculum and session contracts from the repo;
- researched relevant learning-science evidence;
- compared the evidence with real learning-product interaction patterns;
- proposed the stronger long-term mastery model;
- read the adversarial pedagogy audit and reconciled its measured findings with
  Jiwon's objection; and
- converted the resolved tension into product principles and bounded follow-up
  work.

Jiwon made the decisive product call: educational completeness was not allowed
to erase the comfort, anonymity, and small commitment that make Nabi worth
opening. The final direction emerged from the disagreement, not from pretending
there had never been one.

## What we learned

Learning science can identify effective mechanisms without deciding the right
amount of product. The difficult design work is choosing which mechanisms serve
the experience and which would quietly replace it.

For Nabi, explicit production, completion problems, precise feedback, and one
near-transfer retry improve the ten-minute visit. Persistent mastery tracking
would redefine the visit. The first group belongs in the product; the second
does not.
