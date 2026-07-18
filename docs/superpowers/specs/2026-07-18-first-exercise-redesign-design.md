# Nabi Markdown First-Exercise Redesign

**Date:** 2026-07-18  
**Status:** Pending written-spec review  
**Scope:** Replace the first shipped H1 exercise content and presentation while
preserving the verified deterministic learning loop.

## Why this redesign exists

The heading vertical slice proved grading, transfer, persistence, and browser
delivery, but Jiwon's first hands-on review found that the lesson still looked
like a generic Markdown editor. `Project notes` appeared in the instruction,
rendered target, prefilled source, and live preview. A one-line exercise then
occupied document-sized surfaces without making the learner's action obvious.

The redesign makes the product read as a learning interaction:

1. see a finished rendered reference;
2. recall or inspect the syntax needed to reproduce it;
3. write source in a real Markdown-oriented editor; and
4. make the live rendering converge on the reference.

## Decisions already made by Jiwon

- Use concise, natural US educational copy.
- Replace project-document labels with short, concrete content drawn from
  familiar categories such as fruit, weather, and learning tools.
- Start the source editor empty; a placeholder is not learner content.
- Teach a new syntax rule visibly at Level 1, then hide it by default from
  Level 2 onward so later exercises test recall.
- Treat Goal as the finished rendered document, not a prose restatement of the
  instruction.
- Give Goal enough room for a moderately structured Level 3 document even when
  Level 1 leaves intentional whitespace.
- Place Goal and Help side by side with matching label, top, and bottom grid
  lines. Help opens downward, never sideways.
- Give Goal and Live preview the same paper texture, border, padding, and
  rendering typography because a correct preview should visually match Goal.
- Keep Your Markdown and Live preview side by side at equal height on desktop;
  allow the shared work height to grow for later document exercises.
- Make the left pane feel like a source editor through a caret, gutter,
  filename context, monospace typography, and optional invisible-character
  marks.
- Record developer feedback in clear English for an outside reviewer or Build
  Week judge, without pretending it was originally spoken in English.

## Selected visual direction

Three initial layouts were compared:

1. a left-to-right Goal → source → preview transformation row;
2. a lesson column beside a workbench; and
3. a centered focus lesson above the workbench.

Jiwon selected the centered focus direction. Iterations C2 through C6 then
established the final hierarchy:

```text
Header and progress
Instruction
┌──────────────────────── Goal ────────────────────────┬──── Help ────┐
│ shared rendered-document surface                    │ fixed column │
│ sized from a moderate Level 3 reference             │ opens down   │
└─────────────────────────────────────────────────────┴──────────────┘
┌──────────────── Your Markdown ──────────────────────┬─ Live preview ┐
│ Markdown source editor                              │ same surface  │
│ editor-height variable                              │ same height   │
└─────────────────────────────────────────────────────┴───────────────┘
Status, Hint/Review action, and Check/Next
```

The Goal is the dominant lesson object. The Help column uses the same fixed
height as Goal on desktop so both columns end on one grid line. Opening Help
reveals content vertically inside that frame and does not change either column's
width. On mobile, the layout stacks and Help returns to content height rather
than preserving empty desktop space.

## Content and educational copy

The first H1 bank becomes:

| Problem ID | Category | Rendered Goal | Initial source |
|---|---|---|---|
| `heading-apple` | fruit | `# Apple` | empty |
| `heading-rainy-day` | weather | `# Rainy day` | empty |
| `heading-study-tools` | learning | `# Study tools` | empty |

The instruction is:

> Rebuild the heading below in Markdown.

This sentence is action-first, avoids an implied project document, and lets
the rendered Goal carry the literal content. Problem IDs, protected content,
fixtures, transfer selection, and tests change together. Old persisted
content-specific IDs fail the existing valid-ID check and safely return to the
new first problem.

## Level and Help behavior

The problem contract gains an explicit teaching mode and syntax tokens:

```ts
teachingMode: "introduce" | "recall"
syntaxTokens: readonly string[]
```

- The first H1 problem is `introduce`. Its Help frame begins open and displays
  the new rule as compact syntax tokens.
- Later H1 problems are `recall`. Their Help frame begins fully closed. The
  closed summary contains only the word `Hint` and a disclosure indicator—no
  hash, spacing clue, answer text, or other punctuation from the solution.
- Opening Help reveals downward within the fixed frame. The first reveal is
  concise syntax, not prose and never an inserted answer.
- Existing progressive coaching remains available after Fail. Further
  user-requested hints can reveal the spacing pattern and then an unrelated
  example, but they stay in the same Help frame and never edit source.
- Matched still passes. Its optional Review reuses the Help column with a
  Review variant and opens only when requested.
- Perfect still passes without a Review requirement.

This preserves the earlier learning decision: first exposure teaches, later
exposure tests recall, failure unlocks coaching, and the app never autocorrects.

## Shared rendered-document surface

Goal and Live preview use one `RenderedDocument` component. Props may change
the accessible label and small toolbar text, but not the paper treatment or
Markdown typography.

Both variants share:

- the same border and white background;
- the same toolbar height;
- the same document padding;
- the same Markdown element styles;
- the same minimum content height for the current difficulty; and
- safe `react-markdown` behavior with raw HTML disabled and learner media
  blocked.

The desktop height variable is based on the Level 3 reference rather than the
shortest Level 1 answer. Short goals use whitespace; moderately structured
documents do not force a redesign. Goal may be wider than Help, but their label
baselines, frame tops, and frame bottoms must align exactly.

The Level 3 document used to validate this geometry is a visual and browser-test
fixture, not a new learner-facing problem in this milestone.

## Markdown source editor

Three implementation approaches were considered:

1. **Native textarea with decorative chrome.** Lowest dependency cost, but it
   cannot accurately render optional whitespace marks inside editable text.
2. **A mirrored textarea overlay.** Can draw spaces, but introduces fragile
   font, wrapping, selection, scrolling, and accessibility synchronization.
3. **A monochrome CodeMirror 6 editor.** Adds focused dependencies but provides
   a real caret, line gutter, document model, accessible keyboard editing, and
   decoration support for invisible characters.

Use option 3. The editor remains visually restrained:

- no colored syntax highlighting;
- no minimap, autocomplete, command palette, or IDE navigation;
- a small `answer.md` context label;
- line numbers and native editor caret;
- a `¶ Invisibles` toggle; and
- source changes sent through the existing session `edit` action.

When Invisibles is on, ordinary spaces appear as faint centered dots and tabs
as faint arrows. The marks are decorations only: they never enter the source,
clipboard, evaluation input, or saved draft. Microsoft Word documents spaces
as dots and tabs as arrows; Apple Pages calls the category “invisibles” and
allows their colour to be adjusted. Nabi follows the convention while reducing
contrast so marks read as editor annotations rather than Markdown syntax.

The toggle is session UI state for this milestone and does not need persistence.

## Responsive behavior

Desktop and wide tablet:

- Goal and Help share one aligned grid row.
- Goal receives the flexible width; Help has a stable narrow width.
- Source editor and Live preview share a second 1:1 grid row.
- Source and preview heights are equal.
- Opening Help does not change horizontal geometry.

Small screens:

- Instruction, Goal, Help, source, preview, and status stack in that order.
- Help is content-height when collapsed or open.
- Source and preview remain individually usable without horizontal scrolling.
- The editor retains a minimum touch target and keyboard-safe viewport.

## Behavior preserved from the vertical slice

- Grading occurs only on explicit Check or the keyboard shortcut.
- Fail blocks Next and permits user-requested coaching.
- A repaired failure routes to a different prompt in the same syntax family.
- Matched and Perfect both pass.
- Review remains optional and user-requested.
- Progress and drafts remain local.
- Evaluation remains deterministic, local, and inspectable.
- No runtime model, API, authentication, database, or learner-media request is
  introduced.

## Testing and acceptance criteria

Content and grading:

- Each renamed H1 problem retains the six required fixture classes.
- The three categories and protected strings validate.
- Every initial draft is empty.
- Transfer after a repaired failure uses different concrete content.

Teaching and Help:

- The first `introduce` problem exposes the rule on first render.
- A `recall` problem starts with Hint closed and no answer punctuation visible
  to sighted or assistive-technology users.
- Opening Hint grows content downward and does not change Goal or Help width.
- Progressive Hint and optional Review still obey the existing state gates.

Surfaces and editor:

- Goal and Live preview are instances of the same rendered-document component.
- At the desktop reference viewport, Goal and Help frame tops and bottoms align
  within one CSS pixel.
- Source and preview heights align within one CSS pixel.
- Level 1 leaves intentional Goal whitespace; a moderate Level 3 fixture fits
  without changing the component hierarchy.
- The editor has an accessible Markdown label and full keyboard input.
- Toggling Invisibles changes only decorations; the draft string, persisted
  source, evaluation, and preview remain unchanged.

Browser paths:

- empty start → Level 1 rule → Perfect → completion;
- Fail → downward Hint → repair → different-content recall transfer;
- Matched → optional Review → Next;
- desktop geometry assertions for Goal/Help and editor/preview;
- mobile stacking without horizontal overflow; and
- no runtime API or learner-media request.

## Delivery sequence

1. Commit the reviewed design and the English developer-feedback log.
2. Write a test-first implementation plan.
3. Implement content, teaching-mode state, shared rendered surface, Help frame,
   CodeMirror editor, and responsive layout.
4. Run typecheck, unit/component tests, production build, local E2E, and public
   deployment E2E.
5. Re-read all PR review threads after the implementation push, address every
   still-valid actionable finding, and repeat verification.
6. Push the final review fixes, wait for GitHub CI and automated review, deploy
   production, and verify the public alias.

## Non-goals for this milestone

- expanding the full Level 3 problem bank;
- accounts, cloud sync, analytics, payments, or localization;
- runtime AI generation or grading;
- syntax-color themes or a general-purpose Markdown IDE; and
- changing the accepted Fail/Matched/Perfect progression.
