# Heading MVP Visual Contract

**Status:** Approved direction consolidated on 2026-07-18

**Reference:** `docs/design/nabi-heading-mvp-concept.png`

This reference consolidates Jiwon's selected `Editorial Desk` direction B and
`Side Coach` direction A. It is an implementation reference, not evidence that
the application already exists.

## Surface and container model

- One full-height editorial work surface, not a marketing page.
- A thin header rule separates the wordmark and compact progress from the work.
- The main desk is open whitespace with horizontal rules, not stacked cards.
- Prompt and rendered target occupy the upper stage.
- The native Markdown textarea and learner preview occupy the lower stage.
- The requested Side Coach is a right rail separated by one vertical rule.
- At `860px` and below, the same coach becomes a bottom sheet.
- The status/action bar anchors the bottom of the work surface.

## Color and typography lock

| Role | Value |
|---|---|
| Ink | `#111111` |
| Paper | `#ffffff` |
| Canvas | `#f5f5f2` |
| Muted ink | `#5f5f5a` |
| Rule | `#d7d7d2` |
| UI family | system sans until the selected font license is verified |
| Editorial display | system serif |
| Source editor | system monospace |

There are no gradients, glass effects, syntax colors, decorative shadows,
mascots, badges, pills, XP, confetti, or card grids.

## Allowed first-viewport copy

- `Nabi Markdown`
- `Headings · 1 of 3`
- `Make a document title`
- `Turn Project notes into the document's main heading.`
- `Project notes`
- `Your Markdown`
- `Live preview`
- `Try again: Add one space after the hash symbol.`
- `Hint`
- `Check again`
- `Turn the line into the document's main heading.`
- `1 / 3`

Matched, Review, transfer, and completion states may replace the status
and coach copy defined by the approved application spec. They must not introduce
marketing slogans or unrelated navigation.

## Components and variants

- `EditorialDesk`: editing, try-again, matched, and complete variants.
- `MarkdownPreview`: target and learner-preview variants.
- `StatusBar`: one live message, one primary action, and at most one contextual
  secondary coaching action.
- `SideCoach`: hint and review variants with the same container anatomy.
- `ProgressTrack`: three thin segments; active is ink, remaining segments are
  rules.
- Close icon: two one-pixel diagonal strokes in a 44px button. No icon library
  is needed for this single glyph.

## Interaction contract

- Check is explicit; preview changes do not display correctness.
- Hint appears only after `Try again` and never edits source.
- Review appears only after Matched and never blocks Next.
- The primary button changes from `Check` to `Check again` to `Next`.
- Focus rings use ink at a visible two-pixel minimum.
- Motion is limited to the coach entrance and remains under 220ms; reduced
  motion disables it.

## Responsive continuation

- Desktop reference viewport: `1440 × 1024`.
- Desktop coach width: approximately 25% of the viewport, with the desk retaining
  enough width for a 70-character source line.
- At `860px`, stack the target and editor without horizontal scrolling.
- At `390 × 844`, the bottom sheet uses a maximum height and keeps the current
  editor/status reachable.
- At 200% zoom, no primary content clips horizontally.

## Fidelity checks

Final review compares the browser screenshot and reference for:

1. first-viewport copy and order;
2. open editorial container rather than cards;
3. true-white work surface and monochrome palette;
4. type hierarchy across wordmark, target, source, labels, and controls;
5. right-rail and mobile-sheet coach placement;
6. thin-rule rhythm and whitespace;
7. explicit Check/Hint interaction states;
8. absence of unapproved decorative UI.
