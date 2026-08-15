# Card-first Practice design

**Date:** 2026-07-25  
**Status:** Approved interaction and Summary direction; implemented.
Amended 2026-08-01: the practice surface is the open book's two-leaf spread
(adopted Codex comp 1, merged as #138), not the single centered card this
document originally specified. Amended 2026-08-15: the spread's height follows
the problem's content (#139).
**Product:** Nabi Markdown

## Decision

Nabi Markdown Practice becomes a card-first syntax drill with exactly six
problems per turn.

The learner no longer edits a full document or compares two full word-processor
pages while practicing. Each step presents one local Markdown transformation:
a direct instruction, a small rendered context, locked prose, and input slots
for Markdown marks only. A problem may require several Markdown forms at once;
those forms remain separate input groups on one card. The completed results
remain hidden until the six-problem turn is finished.

This keeps the product focused on its actual promise: make Markdown syntax
familiar through short, accurate keystroke practice.

## Why the current model must change

The split Goal/Write workspace gives advanced documents room, but it makes the
basic task harder to understand:

- Levels 1 and 2 rarely contain enough content to justify two full pages.
- The learner's attention is split between the Goal, document, card, tabs, and
  Hint.
- The current Hint leaves the input surface, even though help is needed at the
  exact mark being typed.
- A wrong answer clears the marks but gives only a generic correction unless
  the learner navigates elsewhere.
- The full book spread does not translate naturally to mobile.

The problem is not insufficient copy. The primary interaction surface is
wrong. Nabi should be a syntax card that builds documents, not a document
editor with a syntax card floating over it.

## Product principles

1. **Teach the mark, not document editing.**
2. **One visual center and one keyboard owner.**
3. **Say exactly which Markdown operation is required.**
4. **Reveal exact help without penalty or shame.**
5. **Difficulty comes from combinations, not vague instructions.**
6. **Use the same interaction at every level and viewport.**
7. **Show the finished document only after the practice turn.**
8. **Every turn contains six problems, so elapsed time remains comparable.**

## Practice surface

Practice fills the two leaves of Nabi's open book, with the fold between
reading and writing. The left leaf is what you read — the instruction and the
rendered local context. The right leaf is what you write — the entry line, the
Hint and Enter actions, and the inline Hint disclosure. On a phone the two
leaves stack in the same order and read as one continuous page.

The spread is only as tall as the problem it carries: its height follows the
content instead of the viewport. Zero unused paper below either leaf is the
visual goal; the measurable bound the e2e guard enforces is that unused height
stays at or below 25% of each leaf.
The height is never a fixed pixel value — the writing leaf can still grow when
the hint side tab from the adopted spread comp (accepted 2026-08-01, not yet
implemented) arrives, and a long problem scrolls inside the shell.

The old two-page Goal/Write document workspace, Write/Preview/Hint tabs, full
document scrollers, and full-page line-number gutters remain out of the
practice surface. The two leaves are not that workspace: each carries card
content, never a full editable document.

The global session chrome remains available:

- Nabi Markdown / Exit
- selected level
- six-problem turn progress
- elapsed time
- sound
- change problem

The spread is the only primary content region.

### Card order

The exercise keeps one reading order across the spread:

1. direct instruction (reading leaf)
2. rendered local context (reading leaf)
3. locked prose with Markdown input slots (writing leaf)
4. inline Hint disclosure (writing leaf)

The previous/next mark controls are header chrome beside the instruction on
the reading leaf — rendered before the local context in the DOM — and sit
outside this exercise reading order.

Labels such as `Instruction` and `Goal` are omitted. The content already
communicates those roles.

`Step 1 of 6` is the only learner-facing progress label. Internal syntax
segments never introduce a second `Mark x of y` counter.

## Instruction contract

Instructions name the required Markdown operation directly. They do not
describe the interface and do not ask the learner to infer the syntax family
from the rendered output.

Only the syntax term receives semantic emphasis with `<strong>`.

Examples:

- Type the Markdown mark for a **block quote**.
- Type the Markdown marks for a **level 2 heading**.
- Type the Markdown mark and space for a **bullet item**.
- Wrap this phrase in the Markdown marks for **bold text**.

Do not use generic copy such as:

- Match the rendered Goal.
- Rebuild this shape.
- Add the right marks.

Underlining is not used for the syntax term because it can be mistaken for a
link, an input blank, or Setext syntax.

The instruction remains direct at every level. Levels 3–5 become harder by
combining more syntax groups in realistic document structures, not by hiding
what each group asks for.

## Rendered local context

The card shows only the current rendered block plus enough neighboring content
to establish its place in the document.

Default context:

- current rendered block
- up to one meaningful block before it
- up to one meaningful block after it
- normally two or three visible rows in total

The current block receives a restrained optical focus:

- stable font size and weight
- authentic rendered heading depth and indentation
- a quiet paper tint or short edge marker
- no magnification

The surrounding rows are slightly quieter but remain readable. Optical focus
must never change Markdown semantics: an H2 cannot look like an H1 merely
because it is active.

If a checkpoint is understandable with one row, the context may contain only
that row. It must never grow into a miniature full-document editor.

## Syntax input

The prose is locked. The learner supplies only the Markdown marks and required
spaces. One problem may expose several semantic input groups on the same card.

- One visible box represents one expected typed character.
- Spaces use the existing visible-space convention.
- Every accepted alternative in one checkpoint must use the same locked-prose
  anchors and slot count. Alternatives that require a different placement or
  number of slots are separate checkpoints.
- Focus begins in the first open box.
- Completing a box moves focus to the next box.
- Backspace from an empty box moves to the previous box.
- Enter submits the current syntax attempt.
- IME composition Enter never submits accidentally.
- No caret can enter the locked prose.
- No document editor or hidden free-text textarea receives the keystrokes.

When a problem requires more than one syntax group:

- each group keeps its own boxes and accepted alternatives
- a quiet `/` separates adjacent input groups
- `/` is instructional punctuation and is never typed
- focus moves through the groups in source order
- one Enter submits the complete problem
- a line may combine syntax families, such as block quote plus bold, without
  collapsing their answers into one opaque string

Example:

```text
[ > ][ Space ] / [ * ][ * ] Important deadline [ * ][ * ]
```

The first group is the block-quote prefix. The second and third groups are the
opening and closing bold delimiters. All three are graded together, while Hint
describes and demonstrates each group separately.

The box group is the only keyboard owner for exercise input. Mouse users may
focus any box, but cannot edit the prose.

## Correct-answer flow

When every submitted group matches an accepted pattern:

1. The syntax groups are stored in the completed problem result.
2. The local rendered context updates.
3. A short Matched feedback beat plays.
4. The next problem loads automatically.
5. Focus moves to its first box.

The completed result is not opened between problems. After the sixth problem,
the turn moves to Summary using the already-approved page-turn rhythm.

## Wrong-answer flow

When a non-empty submission is not accepted:

1. Record one miss for every incorrect syntax group in the current attempt.
2. Play the Try again feedback.
3. Clear every syntax box in the problem.
4. Expand the exact Hint automatically.
5. Return focus to the first box.
6. Keep the Hint open while the learner types again.

The learner is never sent to another tab, page, review panel, or editor.

An empty Enter does not count as a miss. It opens the exact Hint, leaves the
boxes empty, and returns focus to the first box.

## Manual Hint flow

Hint is available before an error and carries no penalty.

Opening it manually:

1. clears all partially typed marks for the current problem
2. focuses the first input box
3. expands the Hint below the input row
4. keeps the input row visible and usable

Hint can be closed, but closing it is never required before typing or
submitting. The Hint button and `?` key toggle it, while focus remains owned by
the syntax input.

## Hint content

Hint is deliberately close to the answer. Nabi trains accurate repetition; it
does not reward withholding information. In a compound problem, it shows every
required group in source order with the same `/` boundaries used by the input.

Each accepted syntax form is shown as:

1. visual key sequence
2. required spaces
3. one complete source example

Example:

```text
[ > ] [ Space ]
> Keep rollback steps visible.
```

Keycaps represent the characters the learner must produce, not physical
keyboard chords such as `Shift + .`. This keeps the instruction correct across
keyboard layouts and languages.

### Equivalent syntax policy

All standard alternatives accepted by the exercise are shown and graded
equally. Hint does not label one as preferred.

Examples:

- italic: `*text*` and `_text_`
- bullet item: `- `, `* `, and `+ `
- fenced code: backtick and tilde fences
- thematic break: `---`, `***`, and `___`

The Hint renders each alternative as its own complete row. It never combines
alternatives into an unreadable pattern.

Semantically related forms with different structures remain separate
exercises. For example, ATX and Setext headings are both headings, but they
require different placement and should not be collapsed into one slot shape.

Hint keycaps are examples, not autofill buttons. The learner must still type
the marks.

## Problem history

The learner may revisit accepted problems within the current six-problem turn.

- Previous is available after at least one problem has been accepted.
- Next is available only when the learner has moved back from the frontier.
- Revisiting never exposes unvisited answers.
- Editing an accepted problem rebuilds its stored result deterministically.
- Returning to the frontier restores the first empty problem card.

Mouse/browser Back and Forward mirror this problem history while an internal
previous or next problem exists. Back at the first problem and Forward
at the frontier remain disabled within Practice rather than leaving the
session. These controls must not consume normal text-editing keys.

## Level behavior

The interaction does not change by level.

### Level 1

- one syntax family at a time
- short familiar prose
- normally one rendered context row
- exact direct instruction
- one input group in most problems

### Level 2

- short blocks
- repeated or paired marks
- limited combinations
- one or two input groups

### Level 3

- compact human-readable documents
- two or more syntax families may share one problem
- local context normally includes neighboring rows

### Levels 4–5

- realistic workplace and developer structures
- several syntax groups may be required on one card
- difficulty increases through composition, not through additional problems
- short local context on every card

Advanced levels must not reintroduce full-document transcription.

## Responsive behavior

Mobile and desktop use the same card and state machine.

### Desktop

- the exercise spans both leaves of the open book: reading left, writing right
- each leaf keeps a bounded reading width and generous paper margin
- the spread's height follows the problem's content, top-anchored like the
  landing book, so opening Hint grows the book downward without moving the
  entry line
- no split Goal/Write document columns — the leaves carry card content only
- no full-document scroll region during practice

### Mobile

- card fills the available width with safe page margins
- instruction, local context, input, and Hint remain in that order
- input boxes wrap only between semantic groups, never through locked prose
- Hint alternatives stack vertically
- session chrome condenses without hiding Exit or progress

The mobile design is not a reduced document editor. It is the native form of
the card-first interaction.

## Turn completion and Summary

The six completed problem results are stored throughout the turn but remain
hidden during Practice. After the sixth problem, Summary becomes a
**Teacher's return**: the learner receives one finished page with restrained
handwritten correction marks rather than a transcript or dashboard.

### Left page: the work

- renders the six completed results together on one readable page
- preserves the real Markdown hierarchy and the existing paper typography
- contains no explanatory cards or congratulatory paragraphs
- marks only syntax groups the learner missed before correcting
- uses a thin muted-red underline or short margin stroke
- adds a small handwritten-style number beside every marked location
- never changes heading size, indentation, or other Markdown semantics to
  create emphasis

The correction color is never the only signal. Every red mark has a visible
number that maps to the same numbered note on the right page.

### Right page: the teacher's note

- begins with one short completion line such as `Well done.`
- lists only the syntax groups that caused a miss
- uses the same numbers as the left-page marks
- names the syntax family directly
- shows the exact expected key sequence, including required spaces
- limits each explanation to one short sentence
- ends with quiet `Change level` and `Practice again` actions

Score and elapsed time remain, but move to a low-emphasis footer. Decorative
sprigs, generic strength paragraphs, family summaries without a recorded miss,
and a separate `Completed pages` dialog are removed.

When the turn has no misses, the left page remains completely clean and the
right page shows only a brief clean-page acknowledgement. Red decoration is
never added merely for atmosphere.

The existing ink-reveal motion is retained in a quieter sequence: the document
is already present, then correction strokes draw in, then the matching teacher
notes appear. Reduced-motion mode reveals everything without drawing effects.

## Architecture boundaries

The problem bank remains the content source. It is hidden from the learner, not
removed from the product.

Each problem continues to provide:

- target Markdown
- starter/locked prose
- structural grading rules
- teaching metadata

The guided layer derives syntax checkpoints and projects them into one compound
card per problem. The presentation layer consumes that card and owns no grading
policy.

Recommended conceptual boundaries:

- **checkpoint derivation:** target and starter to local syntax tasks
- **problem projection:** one or more syntax checkpoints to one compound card
- **accepted-pattern policy:** every standard answer for one checkpoint
- **instruction model:** prefix, emphasized syntax term, suffix
- **context projection:** rendered neighboring blocks for the current task
- **practice state machine:** six fixed problems, hint-open, retry, matched,
  complete
- **mistake ledger:** problem, syntax group, submitted value, expected forms
- **result accumulator:** deterministic six-result Summary page
- **card presentation:** focus, slots, Hint, history, accessibility

These units must be independently testable. Rendering must not decide what is
correct, and grading must not depend on card layout.

## Accessibility

- The emphasized syntax term uses semantic `<strong>`.
- Every input group has a meaningful accessible name.
- Visual keycaps expose readable text to assistive technology.
- Retry and Matched feedback use a polite live region.
- Wrong-answer and Hint transitions announce the available correction once.
- Focus movement is deterministic and tested.
- Disabled history controls expose their disabled state.
- Reduced-motion preferences remove decorative transitions without changing
  timing or focus.
- Color is never the only active, retry, or completion indicator.

## Persistence

Current problem, accepted marks, frontier position, revisited alternatives,
misses, and completed document source must survive supported session restore.
Hint-open state and partial incorrect input do not need long-term persistence;
restoring a normal checkpoint returns to empty boxes with Hint closed. Restoring
a recorded retry returns to empty boxes with the exact Hint open.

Legacy full-document drafts must migrate without destroying a completed
session. If they cannot be mapped losslessly to checkpoint progress, preserve
completion and regenerate the canonical review-only document.

## Verification contract

### Unit

- every published problem derives one lossless card with one or more syntax
  groups
- every run contains exactly six cards
- every accepted alternative appears in Hint data
- every Hint alternative is accepted by grading
- structurally different forms remain separate exercises
- completed syntax groups rebuild the exact accepted problem result
- a compound card never merges unrelated syntax families into one answer
- context projection never changes rendered Markdown semantics

### Component

- only syntax boxes accept exercise keystrokes
- manual Hint clears partial input and focuses the first box
- wrong Enter opens exact Hint automatically
- Hint remains open during retry input
- correct input advances and restores focus
- compound input groups expose `/` boundaries without accepting `/` as input
- equivalent forms are listed separately and accepted
- locked prose cannot be edited

### Browser

- keyboard-only completion at Levels 1–5
- pointer-only Hint, history, and submission flow
- wrong answer to exact-Hint retry flow
- alternative syntax flows such as both italic delimiters
- problem history back/forward behavior
- exactly six problems at every level
- Teacher's return Summary with numbered correction mapping
- responsive checks at narrow mobile, tablet, 1280×800, and wide desktop
- no page or horizontal overflow

### Visual

- syntax term is the only bold portion of the instruction
- no `Goal` or `Instruction` labels
- rendered context preserves authentic heading and list hierarchy
- the active row receives focus without magnification
- Hint expansion does not move input off screen
- Summary correction strokes do not alter rendered Markdown hierarchy

## Superseded behavior

This design intentionally replaces:

- split full-page Goal and Write practice
- Write/Preview/Hint tabs as the primary workflow
- editing or prefilling a full document during Practice
- generic retry copy without the exact local correction
- Hint navigation away from the input surface
- hiding the completed work behind a secondary viewer

The existing problem bank, structure-only grading, two verdicts, repair
bookkeeping, sounds, session progress, and no-pressure policy remain.

## Out of scope

- the future free-entry “hard code” mode
- rewriting problem prose merely to manufacture difficulty
- AI-generated grading or hints
- accounts, streaks, lives, XP, or social comparison
- changing the landing-page level chooser
- changing the book identity outside the Practice surface
