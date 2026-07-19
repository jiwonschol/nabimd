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
