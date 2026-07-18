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
Notice → Learn → Recall → Repair → Compose
```

A 10-to-20-minute session introduces a small pattern, requires production with
different text, repairs a mistake, mixes in an older skill, and applies the
skills to a short useful document.

### Studio

Document Makeovers ask the learner to turn an unstructured brief into a
human-readable Markdown document. Studio is most useful for advanced learners,
but it is not locked behind a self-reported level.

Level indicates which new work is available. It does not remove easier work or
trap the learner in a single activity type.

## First-visit flow

The product begins with level entry, not a marketing page, account gate, or
placement test. A fresh browser session shows the Nabi Markdown wordmark, a
short welcome, and exactly three choices:

1. `New to Markdown — start at Level 1`
2. `I know the basics`
3. `Challenge me`

One pointer click or keyboard activation opens the problem desk directly with
no intermediate page. Level 1 begins with the introduced rule visible. The two
higher entries begin in recall mode with Help closed.

The current bank contains only the H1 heading family. The choices are therefore
honest entry modes into that track, with different starting content, rather
than claims that unshipped syntax families or advanced levels exist. Entry
configuration is data so new tracks can replace the current rotated heading
sequences without restructuring the greeting or session controller.

## Course and problem-bank scope

The Build Week target is a curated 33-problem bank.

### Devpost-aligned syntax families

1. Headings and paragraphs
2. Bold and italic emphasis
3. Ordered and unordered lists
4. Blockquotes
5. Inline code
6. Horizontal rules
7. Links
8. Images and alt text

These families are based on Devpost's documented basic Markdown syntax and the
portable intersection with CommonMark and Typora. Nabi does not claim complete
Markdown, CommonMark, or GitHub Flavored Markdown coverage.

### Initial bank

- 24 single-syntax problems: three per family
- 6 mixed-syntax problems
- 3 Document Makeovers

The application can keep offering nonrecent items from the curated bank for as
long as the learner wants to practice. It does not promise infinitely unique
generation.

## State model

Nabi uses three visible outcomes.

### Fail

The requested syntax is missing or malformed, required structure is absent, or
protected prompt content was lost. `Next` remains locked.

The learner receives one smallest actionable correction. The current exercise
stays open so the learner can apply that correction instead of losing context.

### Matched

The learner used the requested Markdown skill correctly and preserved the
required content. This is a pass. `Next` unlocks immediately, and the learner
does not have to open or act on editorial review.

### Perfect

The answer is Matched, faithfully rebuilds the problem's rendered target, and
passes every other editorial check applicable to that problem. This is a more
polished pass, not a separate progression gate.

`Perfect` means "the rendered result faithfully matches the goal and all Nabi
editorial checks passed," not that the document is universally or objectively
flawless. Internal code uses explicit check results rather than a subjective
`isPerfect` judgment.

### Transition rules

```text
Check
├─ Fail → one next fix → edit the same answer → Check again
└─ Matched → Next unlocks
              ├─ no earlier failure → next skill may open
              └─ earlier failure → one transfer problem for the same skill
                                   └─ Matched → next skill opens

Matched + all editorial checks → Perfect
```

After a failed learner repairs the current problem, Nabi presents a different
prompt from the same skill family. This verifies transfer without asking the
learner to memorize and repeat the same answer. The selector must not reuse the
same problem ID or protected text for this transfer check.

A Matched-but-not-Perfect editorial habit may reappear inside a later problem.
It never revokes the earlier pass.

### Run progression and completion

A run is an explicit deterministic sequence over the currently shipped heading
content. Progress labels the learner's current run step and the number of steps
that can actually finish; it never labels the hidden bank size. A first-try
Perfect advances to the next run step and cannot complete after one problem
while the interface says `1 of 3`.

When a repaired Fail or Help-assisted recall requires transfer, the selected
different-content problem becomes the next run step. If that problem was still
ahead in the sequence, it is moved forward. If the learner was on the last
step, the transfer is appended and the visible total grows by one. A transfer
consumes the transfer obligation even if it needs repair, so transfer does not
form an infinite chain.

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

Hint is a rescue ladder, not autocomplete. The introduced rule auto-opens only
at the first step of a Level 1 run. Recall problems and both higher entries
start with Help closed; opening Help during recall creates a transfer
obligation. After a failed check, the learner can request progressively stronger
help.

1. Concept hint
2. Exact syntax recipe, such as `#` + `Space` + `Title`
3. A complete example using different text

Hints never insert text, copy the answer, or complete the exercise.

### Review after Matched

Review is optional and never opens automatically. One review action shows all
applicable refinements at once, capped at three because the documents are
short. The learner can revise toward Perfect or select Next immediately.

This separation protects the feeling of success: Matched is not presented as
another failure merely because optional polish remains.

## US English editorial profile

Perfect checks use a documented Nabi house style derived from recurring rules
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
not affect Fail, Matched, or Perfect.

## Problem contract

Each problem is immutable content with explicit grading behavior. A conceptual
TypeScript shape is:

```ts
type Problem = {
  id: string
  familyId: string
  skillIds: string[]
  difficulty: "warmup" | "mixed" | "makeover"
  prompt: string
  target?: string
  starterText: string
  protectedContent: string[]
  matchChecks: MatchCheck[]
  editorialChecks: EditorialCheck[]
  hints: [string, string, string]
  retryFamily: string
  reviewTags: string[]
}
```

Each committed problem must include fixtures for:

- one canonical passing answer;
- at least one supported alternate answer;
- missing required syntax;
- malformed required syntax;
- a Matched answer with optional refinements;
- a Perfect answer; and
- expected feedback and review IDs.

The bank is curriculum, not unvalidated content. A model-generated candidate is
not publishable until deterministic fixtures and Jiwon's editorial review pass.

## Grading engine

The grader compares explicit requirements, not the user's source string to one
canonical answer.

### Match checks

- Parse supported Markdown into an AST.
- Verify protected content is present and not materially changed.
- Verify the requested structural node and level exist.
- Verify source rules that an AST alone can hide, such as required spacing or a
  lesson-specific Devpost syntax form.
- Return the highest-priority failing check and one feedback ID.

Examples of small predicates include:

```text
preservesText
hasHeading(level)
usesRequiredSkill
hasParagraphBreak
hasList(kind, minimumItems)
hasEmphasis(kind, protectedText)
hasLink(protectedLabel)
hasImageWithAltText
```

### Editorial checks

Editorial checks run after match checks and cannot turn a Matched answer into a
Fail. They produce zero to three specific refinements and a Perfect result when
none remain.

When a problem provides a rendered target, `matches-target-exactly` compares
normalized Markdown AST semantics rather than source strings. Source-only
equivalents such as closing ATX markers, zero to three leading spaces, supported
separator whitespace, trailing whitespace, and normalized internal text
spacing remain faithful. Node kinds and document structure remain significant,
so inline emphasis, code, links, extra blocks, and duplicate headings produce a
Matched refinement instead of Perfect.

Equivalent valid Markdown remains valid. A lesson can require a particular
Devpost-style form to demonstrate a skill without claiming that another valid
form is invalid Markdown.

## Problem selection and progress

Selection is deterministic and local.

- Fail: keep the current problem until Matched.
- Repaired Fail: select a different problem from the same retry family.
- First-attempt Matched: unlock the next course skill.
- Matched without Perfect: add editorial review tags to later selection weight.
- Perfect: reduce near-term repetition for the satisfied editorial tags.
- Ongoing practice: avoid recently shown problem IDs before recycling the bank.

Progress uses a versioned `sessionStorage` document containing the selected
entry, deterministic run number and sequence, visible run-step index, completed
and recent problem IDs, pending transfer state, and the current draft. Reloading
in the same browser session restores the entry, run progress, and draft. A new
browser session starts at the greeting. The guarded volatile `Storage` fallback
keeps the current in-memory run usable when browser storage is unavailable.

The replayable-session schema is version 2. No migration from the earlier local
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
stack. Markdown source and code deliberately keep the system monospace stack;
no JetBrains Mono binary is bundled for this change.

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

- Use a native labeled textarea.
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
- Native textarea
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

- Parser normalization and protected-content rules
- Every match and editorial predicate
- Feedback-priority ordering
- Versioned session-progress validation and corruption recovery; no
  cross-session migration
- Problem selection avoids the same ID after a repaired Fail
- Transfer selection stays in the same skill family
- Review tags reappear without revoking earlier passes

### Bank-wide fixture tests

Every committed problem runs its canonical, alternate, fail, matched, and
perfect fixtures. The suite fails if a problem has incomplete coverage or if
its expected feedback ID changes unexpectedly.

### Component tests

- Check is explicit; typing alone does not grade.
- Fail keeps Next locked.
- Repaired Fail creates the transfer requirement.
- Matched unlocks Next.
- Review remains closed until requested.
- Perfect never becomes a separate mandatory gate.
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
4. Fail, Matched, and Perfect states
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

At least one named problem-bank refinement pass must use GPT-5.6 in Codex before
submission. The resulting accepted, rejected, and counterexample artifacts
must be visible in the repository or commit history and described in the build
log. No GPT-5.6 work is claimed until that pass occurs.

## Non-goals for Build Week

- Runtime AI generation or AI grading
- Accounts, authentication, database, or cloud sync
- Payments, subscriptions, pricing, or commercial experiments
- Korean or multilingual UI
- Infinite generated exercises
- Chat tutor, autocomplete, or answer insertion
- XP, lives, coins, streak penalties, ranking, or leaderboards
- Full CommonMark or GFM conformance
- Tables, footnotes, front matter, raw HTML, nested lists, or document upload
- Native apps or a mobile-specific symbol keyboard

## Risk and cut order

If time runs short, cut in this order:

1. Reduce problem count while retaining at least two retry variants per shipped
   skill family.
2. Reduce the number of mixed problems.
3. Reduce Document Makeovers to one fully tested example.
4. Simplify motion and decorative polish.
5. Remove nonessential home statistics.

Never cut explicit Check, different-content transfer after Fail, deterministic
grading, fixture coverage, Matched progression, optional Review, the working
demo URL, or truthful Build Week evidence.
