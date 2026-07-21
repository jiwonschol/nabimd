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
- Practice document system: Goal and Answer begin at the same document baseline
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
- Full repository gate: `npm run check` passed with 56 test files and 9,942
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
8. The current Draft shortens the desktop top strip from 140px to 108px and
   the page headers from 74px to 64px. The unexplained Goal bullseye is replaced
   by the real learner instruction aligned to the document text. This visible
   revision is verified locally but remains pending product-owner approval.
9. Level 3–5 now receive deterministic prewritten prose just like Levels 1–2.
   The learner keeps authored words, blank lines, and line breaks and supplies
   only Markdown structure. Level 5 Write, Preview, Hint, Matched, Try again,
   focused Next, and editor-focus restoration were exercised in the in-app
   browser at 1280 × 800.

final result: automated checks passed; visual approval pending

---

# Design QA — Landing motto hierarchy

- Approved visual truth: `docs/design/qa/landing-motto-approved.png`
- Final implementation: `docs/design/qa/landing-motto-implementation-1280x720.png`
- Full comparison: `docs/design/qa/landing-motto-comparison-1280x720.png`
- Focused chapter comparison: `docs/design/qa/landing-motto-chapters-comparison.png`
- Responsive evidence: committed browser regressions in
  `tests/e2e/heading-flow.spec.ts`
- Viewports: `1280 × 720`, `768 × 1024`, `390 × 700`, `812 × 375`
- State: fresh Landing

## Findings

- P0: none.
- P1: none.
- P2: none after the short-landscape regression was fixed.
- P3: the production paper seam and row dividers remain slightly quieter than
  the static reference. The difference does not alter hierarchy or behavior.

## Fidelity and interaction verification

- The left page contains only the Nabi wordmark and the approved four-line
  motto. `Markdown is easy.` leads the hierarchy in Source Serif 4.
- The right page contains only the chapter instruction and five level rows.
  Level labels use JetBrains Mono; chapter titles use Source Serif 4.
- The five-level meta line, method strip, row numbers, descriptions, and
  supporting sentence are absent by design.
- The open-book surface, center seam, and existing page-turn interaction are
  preserved.
- Level 3 opened from the desktop viewport and Level 5 opened from the short
  landscape viewport; the Practice editor received focus in both flows.
- At `390 × 700`, the spread stacks without horizontal overflow and all five
  level choices remain reachable.
- At `812 × 375`, the left page no longer creates an unfocusable nested scroll
  region. A browser regression test enforces the contract and reaches Level 5.
- At `768 × 1024`, the two-page layout scales its type and insets without
  crossing the center seam or creating horizontal page overflow.
- Browser console warnings/errors: 0 during visual inspection.

## Comparison history

1. The first pass retained too much explanatory copy and made the chapter
   instruction compete with the product motto.
2. The hierarchy pass removed nonessential text, restored five simple rows,
   and separated the display serif from the functional mono labels.
3. Side-by-side inspection corrected the right-page scale, outer inset, row
   rhythm, and title truncation.
4. Independent review found one inaccessible short-landscape overflow region;
   the final responsive rule makes the left page fit without its own scrollbar.

final result: passed
