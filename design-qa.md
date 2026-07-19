# Design QA — CBT Editorial Desk

- source: `docs/design/qa/cbt-reference-1586x992.png`
- implementation: `docs/design/qa/cbt-implementation-matched-1586x992.jpg`
- combined comparison: `docs/design/qa/cbt-comparison-1586x992.png`
- viewport: `1586 × 992`
- state: Matched, Hint closed, Next focused, lower-level answer in Preview

## Full-view comparison

The reference and implementation were joined side by side at their native,
identical viewport. The comparison verifies the fixed single top bar, absence
of a bottom bar, equal Goal/answer frames, thin monochrome rules, top-right Hint
and Next controls, and the viewport-centered pale-green Matched notice.

The reference uses a long Level 5 work order and a structural Review while the
current runtime problem is a Level 1 H1. That content-density difference is
intentional: Issue #9 owns the expanded bank. It does not change the layout
contract. An independent 80-line source check verifies the long-document
scrolling behavior in the implemented frame.

No focused crop was needed after the full-view comparison because the remaining
differences were content density rather than a local component mismatch. The
center notice and top-bar controls are fully visible at native resolution in
the combined image. Failure Review received separate captures at
`docs/design/qa/cbt-implementation-try-again-1586x992.jpg` and
`docs/design/qa/cbt-implementation-review-1586x992.jpg`.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the selected reference shows long Level 5 content and a Goal-header Hint
  label; the implementation uses current Level 1 content and keeps the only
  interactive Hint control in the fixed top bar. This follows the approved
  fixed-chrome contract and avoids duplicate controls.

## Comparison history

1. The first implementation capture was accidentally taken at the browser's
   default `1280 × 720`; it was rejected as non-comparable.
2. The browser viewport was explicitly set to `1586 × 992`, the same Matched
   state was recaptured, and the two native-size images were combined.
3. The native comparison found no P0, P1, or P2 visual issue. No design-fix
   iteration was required.

## Primary interactions tested

- Level 1 entry opens Write with editor focus.
- Hint closes vertically without changing the 50:50 panel widths.
- Lowercase source passes on Markdown structure and preserves its casing.
- A malformed heading opens Review with beginner-facing labels.
- Try another changes content without advancing the progress position.
- The Nabi Markdown wordmark returns to the level chooser.
- An 80-line answer scrolls inside CodeMirror while the document stays fixed.
- Automated Chromium coverage proves keyboard-only greeting-to-completion,
  Check → focused Next → Space/Enter → focused editor, and Alt+1/Alt+2 tabs.

## Browser evidence

- Goal and answer panels: `772 × 880` pixels each.
- Document: `scrollHeight 992`, `clientHeight 992`, `scrollWidth 1586`,
  `clientWidth 1586`.
- Long editor: `scrollHeight 2582`, `clientHeight 782`.
- Console warnings/errors: 0.

final result: passed

---

## Open-book landing gutter follow-up

- source visual truth: `/Users/jiwon/.codex/generated_images/019f7290-4f9c-7c01-beaa-bc106cbdd874/exec-77213ddc-8590-4645-87ee-7468a85d1799.png`
- implementation screenshot: `/private/tmp/nabimd-realistic-gutter-1280x720.png`
- full-view comparison: `/private/tmp/nabimd-realistic-gutter-comparison.png`
- focused region comparison: `/private/tmp/nabimd-gutter-focused-comparison.png`
- viewport: `1280 x 720`
- state: fresh landing; Level 1 page-turn midpoint also checked

The earlier one-sided shadow read as a dividing line. Symmetrical inset page
shadows and a fine center spine now reproduce the source's visible book gutter
without changing the page composition, typography, color tokens, imagery, or
copy. A focused center crop confirms the narrow seam and soft tonal falloff.
The compact `760 x 720` layout removes the spine and shadows when the pages
stack. The Level 1 turn completed with editor focus and no console warnings or
errors.

Findings: P0 none; P1 none; P2 none. The slightly wider tonal falloff is an
intentional P3 adaptation for laptop displays.

Comparison history: the original border-like treatment was the P2 finding;
the revised same-viewport capture and focused crop show the corrected bound-book
cue. No actionable P0, P1, or P2 differences remain.

final result: passed
