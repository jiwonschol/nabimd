# Design QA — Unified open-book spread

- Source visual truth: `docs/design/open-book-greeting-shared-spine-reference.png`
- Practice source: `docs/design/practice-open-book-level5-hint-reference.png`
- Landing implementation: `docs/design/qa/unified-book-spread-landing-1280x800.png`
- Practice implementation: `docs/design/qa/unified-book-spread-practice-1280x800.png`
- Page-turn midpoint: `docs/design/qa/unified-book-spread-turn-midpoint-1280x800.png`
- Landing comparison: `docs/design/qa/unified-book-spread-landing-comparison.png`
- Practice comparison: `docs/design/qa/unified-book-spread-practice-comparison.png`
- Focused fold comparison: `docs/design/qa/unified-book-spread-fold-focused-comparison.png`
- Viewport: `1280 × 800`
- States: fresh Landing, Level 5 page-turn midpoint, settled Level 5 Practice

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the production fold is intentionally lighter than the approved source.
  This follows the latest direction that the crease should blend into the
  paper instead of reading as a detached dark strip.

## Required fidelity surfaces

- Typography: the implementation preserves `Source Serif 4` for the editorial
  pages and `JetBrains Mono` for Markdown source. The hierarchy and wrapping
  remain consistent with the approved screens.
- Spacing and layout: Landing, Practice, and Summary use the same 50:50 spread.
  The fixed top bar and panel frames do not move at `1280 × 800`.
- Color: one warm off-white surface spans both pages. No black or white backing
  layer interrupts the paper at the center.
- Image quality and asset fidelity: both sheets, their paper texture, the
  stitched fold, and its tonal falloff are one `1280 × 800` raster asset,
  `public/images/nabi-open-book-spread.png`. There is no separate spine DOM
  element or center-shadow construction.
- Copy and content: the production problem-bank content differs from the static
  visual reference as expected; UI labels and curriculum hierarchy are intact.

## Interaction verification

- The static spread remains fixed during the greeting-to-Practice transition.
- Only the chosen right-hand page leaf runs the page-turn animation.
- The receiving Practice shell has no scale, opacity, or brightness animation.
- After the turn, the editor receives focus and both writing sheets scroll
  internally.
- Browser console warnings/errors: 0.

## Comparison history

1. The previous restoration used a separately positioned `BookSpine` image.
   Its coordinate system detached the fold from the paper and made it appear
   to move during the transition. This was a P1 architecture mismatch.
2. The first unified-asset pass left the Landing shell transparent because a
   later `.open-book-shell` shorthand erased the parent background. The
   midpoint comparison exposed content bleeding through the turning page.
3. The transparent shorthand and receiving-screen animation were removed.
   Fresh full-view and focused comparisons now show a motionless continuous
   spread, a lighter integrated fold, and motion confined to the page leaf.

final result: passed
