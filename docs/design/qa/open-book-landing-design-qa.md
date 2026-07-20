# Open-book landing design QA

## Evidence

- Reference: `/Users/jiwon/.codex/generated_images/019f7290-4f9c-7c01-beaa-bc106cbdd874/exec-77213ddc-8590-4645-87ee-7468a85d1799.png`
- Implementation: `/private/tmp/nabimd-landing-1280x720.jpg`
- Full comparison: `/private/tmp/nabimd-design-qa-full.png`
- Focused chapter comparison: `/private/tmp/nabimd-design-qa-right.png`
- Motion midpoint: `/private/tmp/nabimd-page-turn-1280x720.jpg`
- Destination: `/private/tmp/nabimd-practice-1280x720.jpg`
- Viewport: 1280 x 720, device pixel ratio 2
- State: fresh landing, then Level 5 selection and completed handoff

The portrait-oriented reference was fit by height on an off-white 1280 x 720
canvas before comparison. The implementation capture used the same canvas.

## Comparison

### Full view

The implementation preserves the selected reference's defining composition:
an equal two-page spread, quiet paper tone, restrained serif hierarchy, a large
editorial promise on the left, and a ruled five-chapter index on the right. It
uses the production wordmark and the real curriculum labels rather than the
mock labels. Spacing remains intentionally more open on the implementation so
all five production choices stay readable and clickable at 1280 x 720.

### Focused chapter index

The focused comparison confirms equivalent heading hierarchy, five horizontal
chapter rows, low-contrast metadata, and right-edge arrows. All five rows fit
without internal overflow (`scrollHeight` equals `clientHeight`, 369 px) at the
QA viewport. The production labels are longer than the reference labels, so
the implementation uses a wider text column and smaller metadata while keeping
the same visual rhythm.

## Iteration history

1. The first implementation matched the spread but left a native scrollbar at
   1280 x 720 and clipped the fifth chapter.
2. Row minimum height and vertical padding were tuned against browser geometry
   until all five chapters fit exactly without sacrificing the 44 px target.
3. The transition initially covered the incoming practice sheet with an opaque
   overlay. Making the transition shell transparent let the next page appear
   underneath the turning leaf.
4. The receiving sheet is now `inert` during the 720 ms turn. At the midpoint
   focus is on `BODY`; after the overlay leaves, focus moves to `Your Markdown`.

## Result

passed

No P1 or P2 visual differences remain. The reference texture is intentionally
not reproduced as a raster overlay; the production surface uses the existing
paper tokens and typography so it remains crisp, fast, and consistent with the
test workspace.

## Realistic gutter follow-up

- Implementation: `/private/tmp/nabimd-realistic-gutter-1280x720.png`
- Full comparison: `/private/tmp/nabimd-realistic-gutter-comparison.png`
- Focused gutter comparison: `/private/tmp/nabimd-gutter-focused-comparison.png`
- Motion midpoint: `/private/tmp/nabimd-realistic-gutter-turn-midpoint-1280x720.png`
- Compact layout: `/private/tmp/nabimd-realistic-gutter-mobile-760x720.png`
- Viewport: 1280 x 720 desktop; 760 x 720 compact

The original implementation used one border and a very shallow one-sided
shadow, which read as a divider rather than a bound book. The follow-up adds a
narrow spine plus symmetrical inset shadows, so both sheets appear to fall
into the center gutter. The focused comparison confirms the same visual cue as
the source: a fine center seam surrounded by soft tonal falloff.

The gutter remains visible while the selected page turns, with the destination
sheet appearing beneath it. At the compact breakpoint the two sheets stack,
so the spine and inset shadows are removed and the existing horizontal rule
continues to separate the sections.

### Follow-up findings

- P0: none.
- P1: none.
- P2: none.
- P3: the implementation uses a slightly wider, smoother tonal falloff than
  the source image so the book cue survives on ordinary laptop displays.

### Follow-up browser evidence

- Desktop shell: 1280 x 720 with no document overflow.
- Desktop sheet shadows: equal 22 px horizontal offsets and 28 px blur on
  opposite sides of the gutter.
- Compact sheet shadows: none; chapter left border: 0 px.
- Page-turn destination: editor focused after the 720 ms handoff.
- Console warnings/errors: 0.

final result: passed

## Previous book-design restoration (historical)

This section supersedes the earlier Practice and Summary visual assessment.
The approved raster references are the source of truth; the production UI is
not allowed to reinterpret the binding, writing sheets, paper color, or page
transition as generic CSS shadows.

### Sources and implementation evidence

- Practice source: `docs/design/practice-open-book-level5-hint-reference.png`
- Practice implementation: `docs/design/qa/restore-practice-hint-1280x800.png`
- Practice comparison: `docs/design/qa/restore-practice-comparison.png`
- Practice focused comparison: `docs/design/qa/restore-practice-focus-comparison.png`
- Page-turn source: `docs/design/landing-practice-turn-midpoint-motion-reference.png`
- Page-turn implementation: `docs/design/qa/restore-page-turn-midpoint-1280x800.png`
- Page-turn comparison: `docs/design/qa/restore-page-turn-comparison.png`
- Summary source: `docs/design/qa/summary-source-1280x720.png`
- Summary implementation: `docs/design/qa/restore-summary-1280x800.png`
- Summary comparison: `docs/design/qa/restore-summary-comparison.png`
- Summary focused comparison: `docs/design/qa/restore-summary-focus-comparison.png`
- Viewport: 1280 x 800

The Practice evidence uses Level 5 with the Hint sheet open. The transition
evidence captures the midpoint between the landing spread and Practice. The
Summary evidence uses a completed run with one syntax family to revisit.

### Required surfaces

- Typography: `Source Serif 4` is loaded for editorial headings and
  `JetBrains Mono` is loaded for Markdown source. Browser-computed font loading
  was confirmed for both families.
- Layout: Practice remains a fixed 50:50 spread beneath fixed chrome. Long
  documents scroll inside their page, not the browser window.
- Color: landing, Practice chrome, writing sheets, and Summary share the same
  extracted paper surface and warm-white tone.
- Assets: the binding, paper grain, writing rules, bookmark, and summary sprig
  are real source-extracted assets. The central binding is not CSS shadow art.
- Copy and content: runtime exercise and review content may differ from the
  reference mock. Repeated labels and explanatory chrome remain removed.

### Comparison history

1. The previously shipped implementation was blocked at P1. It used a generic
   center shadow, a flat white editor, no aligned writing rules, and no visible
   physical binding. Summary inherited the same incomplete shell.
2. The restoration introduced the approved paper, stitched spine, ruled Goal
   and answer sheets, summary ornaments, and shared header surface. The first
   transition capture still left a translucent sliver at the midpoint.
3. The turning leaf became opaque and broad enough to cross the spine, the
   receiving page gained its light-on transition, and Level 5 Hint examples
   were expanded to match the approved vertical answer-key rhythm.

### Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the animated leaf uses a browser-safe planar curl rather than reproducing
  every irregular edge of the raster motion mock. Summary wording follows the
  actual missed syntax family instead of the mock's sample content.

final result: passed

## Unified spread correction (latest authoritative result)

This correction supersedes the separate stitched-spine implementation above.
The physical book is now one image: both page surfaces, the paper texture, and
the center fold are inseparable pixels in
`public/images/nabi-open-book-spread.png`. `BookSpine` no longer exists in the
component tree, and no center shadow is constructed in CSS.

- Landing comparison: `docs/design/qa/unified-book-spread-landing-comparison.png`
- Practice comparison: `docs/design/qa/unified-book-spread-practice-comparison.png`
- Focused fold comparison: `docs/design/qa/unified-book-spread-fold-focused-comparison.png`
- Page-turn midpoint: `docs/design/qa/unified-book-spread-turn-midpoint-1280x800.png`
- Viewport: `1280 × 800`

The latest midpoint capture confirms that the open-book image remains fixed.
Only the selected page leaf moves; the receiving Practice shell no longer
scales, fades, or changes brightness. The fold is intentionally lighter than
the earlier reference so it blends into the warm paper instead of reading as a
detached vertical object.

final result: passed
