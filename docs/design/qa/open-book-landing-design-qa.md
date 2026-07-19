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
