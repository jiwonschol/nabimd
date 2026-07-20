# Design QA — Unified open-book spread

- Source visual truth: `docs/design/open-book-greeting-shared-spine-reference.png`
- Practice source: `docs/design/practice-open-book-level5-hint-reference.png`
- Landing implementation: `docs/design/qa/unified-book-spread-landing-1280x800.png`
- Practice implementation: `docs/design/qa/unified-book-spread-practice-1280x800.png`
- Page-turn midpoint: `docs/design/qa/unified-book-spread-turn-midpoint-1280x800.png`
- Landing comparison: `docs/design/qa/unified-book-spread-landing-comparison.png`
- Practice comparison: `docs/design/qa/unified-book-spread-practice-comparison.png`
- Focused fold comparison: `docs/design/qa/unified-book-spread-fold-focused-comparison.png`
- Word-processor reference: `docs/design/qa/practice-wordprocessor-reference-1280x800.png`
- Word-processor implementation: `docs/design/qa/practice-wordprocessor-1280x800.png`
- Word-processor comparison: `docs/design/qa/practice-wordprocessor-comparison.png`
- Viewport: `1280 × 800`
- States: fresh Landing, Level 5 page-turn midpoint, settled Level 5 Practice

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the production fold is intentionally lighter than the approved source.
  This follows the latest direction that the crease should blend into the
  paper instead of reading as a detached dark strip.
- P3: the source mock contains a black horizontal bar beneath the top chrome.
  The implementation intentionally omits it after the approved direction that
  the open-book pages themselves provide the boundary.

## Required fidelity surfaces

- Typography: Goal and Answer use the same self-hosted `Source Serif 4`,
  including their line-number gutters. They are read-only and editable modes
  of one writing processor, so mode changes cannot alter font metrics. The
  system sans remains limited to interface chrome; `JetBrains Mono` is reserved
  for code-only surfaces outside this processor.
- Spacing and layout: Landing, Practice, and Summary use the same 50:50 spread.
  The fixed top bar and panel frames do not move at `1280 × 800`.
- Practice document system: Goal and Answer begin at the same `y=221` baseline
  at `1280 × 800`. Both use 40px rows whose number, rule, content, and scroll
  position share one document coordinate system.
- Color: one warm off-white surface spans both pages. No black or white backing
  layer interrupts the paper at the center.
- Image quality and asset fidelity: both sheets, their paper texture, the
  stitched fold, and its tonal falloff are one `1280 × 800` raster asset,
  `public/images/nabi-open-book-spread.webp` (4.8 KB). There is no separate
  spine DOM element or center-shadow construction.
- Copy and content: the production problem-bank content differs from the static
  visual reference as expected; UI labels and curriculum hierarchy are intact.

## Interaction verification

- The static spread remains fixed during the greeting-to-Practice transition.
- Only the chosen right-hand page leaf runs the page-turn animation.
- The receiving Practice shell has no scale, opacity, or brightness animation.
- After the turn, the editor receives focus and both writing sheets scroll
  internally.
- Practice is not itself an editor. Goal and Answer are the same
  `WritingProcessor` in read-only and edit modes. Each instance owns exactly
  one document scroller, one row-number layer, and one content layer; embedded
  CodeMirror does not create a second scroll owner.
- Goal `PageDown` moves only the Goal document. Answer line numbers, row rules,
  Markdown, tab marks, and return marks move together during editor scrolling.
- `Alt+1/2/3`, Tab, Shift+Tab, and Check are scoped to the focused Answer
  editor. A typed `?` remains Markdown and does not open Hint.
- Scrollbar tracks and corners are transparent. Long Goal code wraps instead
  of creating a horizontal scrollbar.
- At `760 × 800`, the active transition overlay computes to a transparent
  background while the receiving Practice shell uses the neutral paper tile.
- At `1800 × 1000`, Landing and Practice both compute to a `1536px` outer
  width, so the fixed spread and moving leaf share identical geometry.
- Browser console warnings/errors: 0.
- Full repository gate: `npm run check` passed with 55 test files and 9,942
  tests, followed by the production build and bundle verification.
- Four independent read-only audits covered editor architecture, visual
  fidelity, responsive keyboard behavior, and cross-screen regressions. All
  blocking findings were resolved before handoff.

## Comparison history

1. The previous restoration used a separately positioned `BookSpine` image.
   Its coordinate system detached the fold from the paper and made it appear
   to move during the transition. This was a P1 architecture mismatch.
2. The first unified-asset pass left the Landing shell transparent because a
   later `.open-book-shell` shorthand erased the parent background. The
   midpoint comparison exposed content bleeding through the turning page.
3. The receiving Practice spread now stays visible beneath the transition.
   The old left page is a temporary opaque paper surface, while only the
   opaque right leaf crosses the fixed fold.
4. Stacked layouts replace the spread raster with the neutral paper texture,
   so a vertical book fold is never stretched into a mobile interface.
5. The first Practice repair still gave Preview two scroll owners. The outer
   Preview wrapper now clips while the nested rendered document is the sole
   scroll owner, with a regression test for that contract.
6. The earlier editor split Goal and Answer into separate document systems.
   Both now use the same `WritingProcessor`: Source Serif 4, row numbers, rules,
   content inset, and scrolling are shared code, with read-only/editability as
   the only mode difference. No ruled PNG or repeating background remains.
7. Rendered Level 2 headings keep their authored blank row after the heading,
   and nested lists suppress DOM-only spacing and parent return marks. The Goal
   therefore keeps the same visible row sequence as the prewritten answer.

final result: passed
