# Nabi Markdown Application Design

**Status:** Written spec approved by Jiwon on 2026-07-18

**Scope:** OpenAI Build Week application experience, learning model, grading,
problem bank, architecture, verification, and submission evidence

## Objective

Build a polished, English-first Markdown practice web application for the
Education track of OpenAI Build Week. A learner should be able to start a real
exercise within seconds, type Markdown from memory, receive help only after an
explicit check, and continue practicing until the syntax becomes natural.

Nabi is not trying to make text easier for a machine to parse. Modern models
already tolerate unstructured input. Nabi teaches people to create source and
rendered documents that other people can scan, understand, and trust.

> AI can read the mess. People should not have to.

## Product thesis

Nabi Markdown is for people whose writing process or Markdown document is
visible to other people: instructors sharing a screen, consultants presenting
a brief, developers publishing a README, creators teaching an AI workflow, and
team members handing structured notes to one another.

The primary behavior is public or collaborative writing, not a particular job
title. The first release uses US English and US digital-document conventions.
Korean and other languages come after Build Week.

## Build Week constraints

- Build with Codex in one primary thread.
- Use GPT-5.6 meaningfully in the documented curriculum-production workflow.
- Do not add a runtime AI dependency to the learner experience.
- Keep the deployed application free to test without an account.
- Keep all submission text, code, tests, README claims, and video claims true.
- Submit the primary-thread `/feedback` Session ID through Devpost after the
  majority of core functionality is complete.
- Maintain a dated [build log](../../build-log.md) for consequential conflicts,
  Codex contributions, Jiwon's decisions, and verification evidence.

The Official Rules do not explicitly require a runtime API call. They do
require meaningful Codex and GPT-5.6 use and a specific explanation in the
repository and video. A general statement that the app was "made with AI" is
not sufficient evidence.

## Learning system

Nabi combines three activity types instead of choosing only one.

### Warm-up

A 30-to-60-second problem practices one syntax skill. Warm-ups remain available
at every level. An experienced learner may still choose an easy problem for
recall, confidence, or a quick session.

### Path

The main course uses an editorial-apprenticeship rhythm:

```text
Notice → Learn → Recall → Repair → Rebuild
```

A 10-to-20-minute session introduces a small pattern, requires production with
different text, repairs a mistake, mixes in an older skill, and applies the
skills to a short useful document.

### Studio

Document Makeovers give the learner a fixed rendered Goal and the same prose
with Markdown marks removed. The learner restores a human-readable Markdown
document without inventing, transcribing, or reorganizing its words. Studio is
most useful for advanced learners, but it is not locked behind a self-reported
level.

Level indicates which new work is available. It does not remove easier work or
trap the learner in a single activity type.

## First-visit flow

The product begins with level entry, not a marketing page, account gate, or
placement test. A fresh browser session shows the Nabi Markdown wordmark, a
short welcome, and exactly five level choices matching the definitive
curriculum ladder.

One pointer click or keyboard activation opens the problem desk directly with
no intermediate page. The first four problems belong to the selected level and
begin with Hint open. The final two are next-level challenges and begin with
Hint closed. Hint remains manually available in either role.

## Course and problem-bank scope

The definitive Issue #9 design is
[`2026-07-19-five-level-problem-bank-design.md`](./2026-07-19-five-level-problem-bank-design.md).
The Build Week target is at least 500 inspected problems across all five levels;
the first planned complete distribution contains 512. The runtime publishes
only candidates that the deterministic engine can grade and that clear the
digest-bound fixture, independent-review, and editorial gates. Quantity never
overrides those gates.

### Devpost-aligned syntax families

1. Headings and paragraphs
2. Bold and italic emphasis
3. Ordered and unordered lists
4. Blockquotes
5. Inline code
6. Horizontal rules
7. Links
8. Images and alt text
9. Fenced code blocks

These families are based on Devpost's documented basic Markdown syntax and the
portable intersection with CommonMark and Typora. Fenced code blocks extend the
first basic set with a CommonMark-compatible form that Devpost supports. Nabi
does not claim complete Markdown, CommonMark, or GitHub Flavored Markdown
coverage.

### Current curriculum shape

- The deterministic runtime bank contains 344 inspected problems split
  136/148/30/20/10 across Levels 1–5. The accepted Level 4–5 records retain
  their historical development-spec and work-order metadata until a separately
  reviewed replacement batch applies the corrected curriculum ladder.
- Accepted batches remain immutable and digest-bound. Runtime scheduling may
  reclassify how those records are presented, but it does not rewrite their
  accepted evidence.
- Level 2 currently uses accepted single-syntax records as a transitional
  fallback. The scheduler prefers composite rebuild problems as soon as Issue
  #9 publishes enough of them.

The application can keep offering nonrecent items from the curated bank for as
long as the learner wants to practice. It does not promise infinitely unique
generation.

## State model

Nabi uses two visible outcomes.

### Fail

The requested syntax is missing or malformed, or the required Markdown
structure is absent. The interface labels this outcome `Try again`, and `Next`
remains locked.

The learner receives one smallest actionable correction. The current exercise
stays open so the learner can apply that correction instead of losing context.

### Matched

The learner used the requested Markdown skill correctly. This is the only pass
state. `Next` unlocks immediately, and optional Markdown-structure review never
creates another grade. Capitalization, spelling, punctuation, and prose wording
are not compared with the Goal.

### Transition rules

```text
Check
├─ Fail → one next fix → edit the same answer → Check again
└─ Matched → Next unlocks
              ├─ no earlier failure → next skill may open
              └─ earlier failure → one transfer problem for the same skill
                                   └─ Matched → next skill opens

```

After a failed learner repairs the current problem, Nabi presents a different
prompt from the same skill family. This verifies transfer without asking the
learner to memorize and repeat the same answer. The selector must not reuse the
same problem ID or example text for this transfer check.

### Run progression and completion

A run is an explicit deterministic sequence over the currently shipped bank.
Progress labels the learner's current run step and the number of steps that can
actually finish; it never labels the hidden bank size or a policy maximum that
the available unique content cannot satisfy. A first-try Matched advances to
the next scheduled step.

A scheduled Level 1–4 turn contains six problems: four at the chosen level,
followed by two next-level challenges. Level 5 has no higher challenge level,
so it schedules six unique Level 5 problems from the ten currently published
work orders without repeating content merely to display six.

Only an actual failed Check creates remediation. After repair, a
different-content problem from the same skill family becomes the next run
step. This repair is outside the six scheduled score slots. The six-marker rail
holds its scheduled position while a separate Repair practice label shows the
truthful expanded queue position and total, such as `Exercise 2 of 7`. It
consumes the obligation even if it also needs repair, so remediation cannot
form an infinite chain. Opening Hint never creates remediation.

The elapsed clock starts when the learner chooses a level, is reconstructed
from the persisted epoch timestamp after a reload, and freezes at completion.
The completion screen shows the scheduled score, frozen time, encouraging copy,
and authored syntax reminders for any scheduled slots that received a failed
Check. Remediation cannot deduct the same scheduled score slot twice.

Completion offers three actions:

- `Practice again` keeps the selected entry, increments its deterministic run
  number, clears drafts, and rotates to different starting content.
- `Start over` clears the current run and restarts the selected entry at its
  original deterministic sequence.
- `Change level` clears the run and returns to the greeting.

## Check, Hint, and Review

There is no live correction or grading while the learner types. Rendering may
update as a visual preview where the exercise calls for it, but correctness is
evaluated only after `Check` or `Cmd/Ctrl + Enter`.

### Hint before Matched

Hint is a rescue ladder, not autocomplete. It starts open for the four
chosen-level problems and closed for the two next-level challenges. The learner
can close or reopen it at any time. Merely using Hint never creates a transfer
obligation or changes the grade. After a failed check, repeated requests reveal
progressively stronger help.

1. Concept hint
2. Exact syntax recipe, such as `#` + `Space` + `Title`
3. A complete example using different text

Hints never insert text, copy the answer, or complete the exercise.

### Review after Matched

Review is optional and never opens automatically. One review action shows all
applicable Markdown-structure refinements at once, capped at three because the
documents are short. The learner can revise or select Next immediately.

This separation protects the feeling of success: Matched is not presented as
another failure merely because optional polish remains.

## US English editorial profile

Editorial checks use a documented Nabi house style derived from recurring rules
in US federal plain-language guidance and the GitHub, Google, and Microsoft
documentation style guides.

Applicable checks include:

- Put the main point before supporting detail.
- Use one clear document title.
- Keep heading levels in logical order without skipping levels.
- Use sentence case for English headings.
- Use descriptive headings that help a reader scan.
- Keep one main idea per short paragraph.
- Use a list for parallel or sequential items when the problem calls for one.
- Use numbered lists for meaningful order and bullets otherwise.
- Keep list items grammatically parallel when a fixture defines that pattern.
- Use emphasis sparingly and consistently.
- Use one list-marker convention consistently within a short document.
- Use descriptive link text and meaningful image alt text where applicable.

Nabi is not a spelling checker, grammar checker, or general prose-quality
judge. Subjective qualities that cannot be defended by the problem contract do
not affect Try again or Matched.

## Problem contract

Each problem is immutable content with explicit grading behavior. A conceptual
TypeScript shape is:

```ts
type Problem = {
  id: string
  familyId: string
  skillIds: string[]
  difficulty: "warmup" | "mixed" | "makeover"
  teachingMode: "introduce" | "recall"
  teaching: {
    concept: string
    howTo: string
    example: string
  }
  prompt: string
  target?: string
  starterText: string
  protectedContent: string[] // legacy metadata; never a learner-match operand
  matchChecks: MatchCheck[]
  editorialChecks: EditorialCheck[]
  hints: [string, string, string]
  retryFamily: string
  reviewTags: string[]
}
```

`protectedContent` remains in the conceptual shape because accepted records and
validators still carry it. D9–D10 supersede its original exact-prose purpose:
new advanced records keep it empty, and no current match predicate may require
those words, their case, spelling, punctuation, or labels.

### Runtime starter text

Every level is a reproduction exercise with a fixed rendered Goal. Its answer
sheet opens with the Goal's learner-visible prose, blank lines, and line breaks
already present. The runtime projection derives this `starterText` by parsing
`target` and removing Markdown structure: heading and list markers, emphasis
delimiters, link destinations, blockquote markers, thematic breaks, and code
fences. Visible text, code content, and image alt text remain. A saved session
draft always takes precedence over the derived starter.

Starter text is a teaching aid, never a grading operand: the grammar-only
evaluator still accepts different prose. The derivation happens at the
runtime-projection boundary so accepted problem-bank artifacts and their
review-bound digests remain immutable. Current `main` hydrates Levels 1–2 only;
the separately reviewed Practice change extends this approved contract and its
tests to Levels 3–5.

Each committed problem must include fixtures for:

- one canonical passing answer;
- at least one supported alternate answer;
- missing required syntax;
- malformed required syntax;
- a Matched answer with optional refinements;
- expected feedback and review IDs.

The bank is curriculum, not unvalidated content. A model-generated candidate is
not publishable until its normalized content digest is current, deterministic
fixtures pass through the real engine, two independent digest-bound reviewers
agree, and the editorial queue records an explicit acceptance tied to the same
fixture-result digest. Any failure blocks publication. Unsupported candidates
stay visible as `engine-family-not-supported` but never enter the runtime bank.

## Grading engine

The grader compares explicit requirements, not the user's source string to one
canonical answer.

### Match checks

- Parse supported Markdown into an AST.
- Verify the requested structural node and level exist.
- Verify source rules that an AST alone can hide, such as required spacing or a
  lesson-specific Devpost syntax form.
- Return the highest-priority failing check and one feedback ID.

Examples of small predicates include:

```text
hasHeading(level)
usesRequiredSkill
hasParagraphBreak
hasList(kind, minimumItems)
hasEmphasis(kind, minimumCount)
hasLink(minimumCount)
hasImageWithAltText
```

### Editorial checks

Editorial checks run after match checks and cannot turn a Matched answer into
Try again. They produce zero to three specific Markdown-structure refinements
without changing the verdict. They do not compare the learner's prose with the
Goal, including case, spelling, punctuation, or wording.

Equivalent valid Markdown remains valid. A lesson can require a particular
Devpost-style form to demonstrate a skill without claiming that another valid
form is invalid Markdown.

## Problem selection and progress

Selection is deterministic and local.

- Try again: keep the current problem until Matched.
- Repaired Try again: select a different problem from the same retry family.
- First-attempt Matched: unlock the next course skill.
- Matched with editorial review: add structural review tags to later selection
  weight.
- Ongoing practice: avoid recently shown problem IDs before recycling the bank.

Progress uses a versioned `sessionStorage` document containing the selected
entry, deterministic run number and sequence, visible and scheduled run-step
indices, completed and recent problem IDs, failed scheduled slots and problem
IDs, start/completion timestamps, pending transfer state, and the current draft.
Reloading in the same browser session restores the entry, timer, run progress,
and draft. A new browser session starts at the greeting. The guarded volatile
`Storage` fallback keeps the current in-memory run usable when browser storage
is unavailable.

The replayable-session schema is version 5. No migration from an earlier local
schema is required because persistence is intentionally session-scoped. No
account, database, cloud sync, or personal profile is part of Build Week.

## Visual design

The visual direction is calm, monochrome, editorial, and keyboard-first.

### Editorial Desk

- Header: Nabi wordmark, compact progress, current problem count
- Learning stage: instruction, an aligned Goal/Help row, and an aligned
  Markdown-source/Live-preview row
- Footer: status and one primary action
- At desktop widths, the shell fits one viewport and longer Goal, Help, source,
  and preview content scrolls inside its panel. At mobile widths, the same
  semantic order returns to natural document flow.
- No syntax coloring, gradient, glass effect, confetti, mascot, or card grid

The first version uses an ink, paper, and warm-gray palette. Source Serif 4
Regular and Semibold are bundled under the SIL Open Font License 1.1 for
wordmark, reading, Goal, preview, and status text. Controls keep the system sans
stack. Markdown source and code use the self-hosted JetBrains Mono files and
their committed SIL Open Font License; the interface does not depend on a
system-installed monospace font or a third-party font CDN.

The approved butterfly/nib raster source is distributed as metadata-stripped,
square PNG derivatives sized for their actual surfaces: 128px for the visible
wordmark and 64px for the favicon. The full 1254px working source is not shipped
to browsers. At 360px and below, header gutters and spacing compact while the
visible Nabi Markdown name and readable problem progress both remain present.

### Help panel

- Desktop: Help stays aligned beside Goal and reveals its content downward
  within the panel.
- Small screens: Help stays in document flow between Goal and the editor.
- Hint and Review use the same container but different content contracts.
- Help opens only by explicit user action except for a level's first
  introduction, and never edits the source.

At 780 pixels or below, Goal, Help, source, and preview stack in that order and
keep a full-width layout without horizontal scrolling.

## Accessibility

- Use an accessible labeled CodeMirror 6 source editor with a native editing
  caret and keyboard semantics.
- Keep a logical Tab order.
- Run Check with `Cmd/Ctrl + Enter` as well as a visible button.
- Provide a visible focus ring at least 2 pixels wide.
- Keep pointer targets at least 44 by 44 pixels where practical.
- Announce result changes through a polite live region.
- Describe symbols by name in instructional prose.
- Meet WCAG AA contrast.
- Support 200% zoom without horizontal page overflow.
- Remove nonessential motion when `prefers-reduced-motion` is enabled.
- Keep motion under 220 milliseconds.

## Technical architecture

### Stack

- TypeScript
- React
- Vite
- CodeMirror 6
- unified/remark/mdast-compatible parsing with raw HTML disabled
- Small CSS token file and focused component styles
- `sessionStorage` with a versioned schema and guarded volatile fallback
- Vitest and Testing Library
- Playwright for the first full learning path
- Static Vercel deployment

### Boundaries

```text
src/content        skill catalog, problems, fixtures, copy
src/engine         parsing, source checks, match checks, editorial checks
src/selection      retry, transfer, review-weight, and recent-item selection
src/progress       versioned local persistence and recovery
src/components     Editorial Desk, editor, status, Help panel, progress
src/pages          first problem, home, learning session
tests/fixtures     bank-wide grading contracts
```

Engine and selection modules are pure functions. React consumes their outputs
but does not own grading logic. A component should not need to know how a
heading predicate works, and a predicate should not depend on browser state.

## Error handling

- Empty input is checkable and returns a concrete starting action.
- Unsupported syntax returns a support-boundary message instead of a generic
  wrong answer.
- Any user Markdown must be safe to parse and render without raw HTML execution.
- Invalid problem data fails automated validation before deployment.
- A corrupt or incompatible session progress record recovers to a valid default
  and never prevents the first problem from loading.
- The learner path has no network or runtime model dependency.
- Clipboard failure on a future copy action produces an explicit manual-copy
  fallback rather than reporting false success.

## Testing strategy

### Unit tests

- Parser normalization and requested-structure rules
- Every match and editorial predicate
- Feedback-priority ordering
- Versioned session-progress validation and corruption recovery; no
  cross-session migration
- Problem selection avoids the same ID after a repaired Fail
- Transfer selection stays in the same skill family
- Review tags reappear without revoking earlier passes

### Bank-wide fixture tests

Every committed problem runs its canonical, alternate, fail, and matched
fixtures. The suite fails if a problem has incomplete coverage or if
its expected feedback ID changes unexpectedly.

### Component tests

- Check is explicit; typing alone does not grade.
- Fail keeps Next locked.
- Repaired Fail creates the transfer requirement.
- Matched unlocks Next.
- Review remains closed until requested.
- No third verdict tier appears.
- Help never changes editor content.
- Completion exposes all three replay actions; hook tests verify each reset
  contract and deterministic replay content.

### Browser tests

- Complete the heading MVP with a first-attempt pass.
- Fail, repair, and pass a different transfer problem.
- Open Hint after failure and Review after Matched.
- Refresh and restore the current draft and progression.
- Start a new browser context at the greeting and restore a selected entry only
  within the same browser session.
- Complete the critical path with keyboard controls.
- Verify the deployed build in a clean browser context.

## Delivery sequence

### Vertical MVP

Build one complete heading family before expanding the bank:

1. Three heading problems
2. Problem schema and fixture harness
3. Check and grading engine
4. Try again and Matched states
5. Repair and transfer flow
6. Hint and Review Side Coach
7. Versioned session progress
8. Minimal Editorial Desk
9. Unit, component, and browser proof
10. First static deployment

### Expansion

After the heading MVP passes, add the remaining predicates and the 33-problem
bank. Problem-bank growth must not precede a stable schema and fixture harness.

### Polish

Only after the full path works, refine typography, responsive behavior, motion,
accessibility, copy, visual rhythm, and submission assets.

## Build Week evidence plan

The evidence stack has distinct roles:

```text
/feedback Session ID   official primary-thread identifier
README                 short judge-facing summary
docs/build-log.md       curated conflicts, decisions, and evidence
pull requests/commits  dated raw history
tests and live demo    proof that claims are real
```

The strongest current product conflict is the rejection of live correction.
Codex initially proposed a quiet live coach. Jiwon rejected it because automatic
correction helps someone operate an editor but does not develop recall. That
decision produced explicit Check, progressive Hint, and the transfer problem.

GPT-5.6 in Codex is used in the documented problem-bank production loop for
generation, real-engine counterexample verification, and independent editorial
inspection. Accepted, rejected, and counterexample artifacts remain visible in
the repository or commit history and are described in the build log. The
learner application remains deterministic and makes no runtime AI call.

## Non-goals for Build Week

- Runtime AI generation or AI grading
- Accounts, authentication, database, or cloud sync
- Payments, subscriptions, pricing, or commercial experiments
- Korean or multilingual UI
- Infinite generated exercises
- Chat tutor, autocomplete, or answer insertion
- XP, lives, coins, streak penalties, named leaderboards, or personal rankings;
  the completion screen only exposes an anonymous standing-client seam and an
  honest collecting-data placeholder until separate backend work is approved
- Full CommonMark or GFM conformance
- Tables, footnotes, front matter, raw HTML, or document upload. Nested lists
  are already supported structural practice; they are not introduced as an
  exclusive Level 5 skill.
- Native apps or a mobile-specific symbol keyboard

## Risk and cut order

If time runs short, cut in this order:

1. Reduce a pending batch rather than publishing an unvetted problem; the
   Issue #9 completion claim remains blocked until at least 500 pass inspection.
2. Reduce the number of mixed problems.
3. Reduce Document Makeovers to one fully tested example.
4. Simplify motion and decorative polish.
5. Remove nonessential home statistics.

Never cut explicit Check, different-content transfer after Fail, deterministic
grading, fixture coverage, Matched progression, optional Review, the working
demo URL, or truthful Build Week evidence.
