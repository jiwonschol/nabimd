# 001 — Write the Why copy at reading pace

- **Status**: DONE
- **Commit**: cd6065d
- **Severity**: MEDIUM
- **Category**: Easing & duration; Accessibility
- **Estimated scope**: 3 files, roughly 150 lines

## Problem

The landing page's Why surface reveals an entire reason in less than one
second and begins removing the first reason after only 2.2 seconds. The reader
therefore sees a fast card swap instead of a sentence being written and held
long enough to read.

```ts
// src/components/WhyMarkdown.tsx:37 — current
const PASSES = [
  { enterMs: 640, travel: 12, holdMs: 2200, gapMs: 900 },
  { enterMs: 780, travel: 9, holdMs: 3000, gapMs: 1200 },
  { enterMs: 920, travel: 6, holdMs: 3800, gapMs: 1600 },
]
```

```ts
// src/components/WhyMarkdown.tsx:103 — current
node.animate(
  [
    { opacity: 0, transform: `translateY(${frame.travel}px)` },
    { opacity: 1, transform: "translateY(0)" },
  ],
  { duration: frame.enterMs, easing: ENTER_EASING, fill: "forwards" },
)
```

## Target

- Keep the approved copy, typography, book layout, shuffled order, three-pass
  sequence, and terminal resting reason.
- Reveal visible glyphs sequentially every **32ms**. Each glyph enters over
  **96ms** with `cubic-bezier(0.22, 0.72, 0.2, 1)` and opacity `0 → 1`.
- Insert a **240ms** pause between the lead and support lines.
- Reserve the complete reason's layout from the first frame so words and line
  breaks do not move while glyphs appear. Keep words as wrapping units rather
  than making every character a line-break opportunity.
- Begin the reading hold only after the final glyph has completed its 96ms
  entrance. Hold the fully visible reason for **4500ms**.
- Exit the complete reason over **220ms**, then leave a **160ms** quiet gap
  before starting the next reason.
- Keep the existing **1400ms** initial onset.
- For `prefers-reduced-motion: reduce` or an environment without reliable
  animation, show the existing complete static list immediately. Do not make a
  reduced-motion reader wait through staged characters.
- The visual glyph spans must be ignored by assistive technology; each reason
  keeps one complete accessible label so screen readers do not announce
  character mutations.

## Repo conventions to follow

- Motion and responsive styling remain in `src/styles/global.css`.
- The existing Why surface is exclusively scoped under `.open-book-why*` at
  `src/styles/global.css:2475`; do not alter the surrounding landing layout.
- Reduced motion already resolves to `.open-book-why--static` in
  `src/components/WhyMarkdown.tsx:47-64`; preserve that legible fallback.
- The product's editorial reveal at `src/styles/global.css:2136` establishes a
  restrained ink-like personality. Reuse its easing, but use opacity only here
  so Source Serif glyphs never shift or clip. Do not add a blinking typewriter
  caret or handwriting font.

## Steps

1. In `src/components/WhyMarkdown.test.tsx`, add fake-timer RED tests that
   prove glyphs receive sequential delays, the active reason cannot begin
   exiting until final-glyph completion plus 4500ms, the next reason begins
   only after exit plus gap, and reduced motion shows complete plain copy.
2. In `src/components/WhyMarkdown.tsx`, replace the whole-card WAAPI entrance
   scheduler with deterministic active/exiting phase state. Export the timing
   constants and a pure reveal-duration helper for precise tests.
3. Render animated lead/support copy as word-preserving wrappers containing
   glyph spans with stable delay indices. Keep full accessible reason labels;
   do not create an ARIA live region.
4. In `src/styles/global.css`, add the scoped character ink keyframes and
   parent exit transition. Animate opacity only; do not use translation,
   width, or clip-path.
5. Keep all unrelated landing, Practice, Summary, problem-bank, and page-turn
   code untouched.

## Boundaries

- Do NOT change any text in `WHY_OPENING_QUESTION` or `WHY_REASONS`.
- Do NOT alter landing layout, font sizes, colors, chapter controls, or book
  geometry.
- Do NOT add a dependency, cursor, sound, or new control.
- Do NOT change the 4500ms completed-text hold downward.
- If the current files no longer match commit `cd6065d`, stop and report.

## Verification

- **Mechanical**:
  - `npm test -- src/components/WhyMarkdown.test.tsx`
  - `npm run build`
  - `npm run check`
- **Feel check**:
  - Open the landing page at 1028×1098 and 1280×800.
  - Confirm glyphs appear from left to right without moving already written
    words or changing the reason's line breaks.
  - Time the complete state: it remains unchanged for at least 4.5 seconds.
  - Confirm the next reason begins only after the first has completely left.
  - Emulate reduced motion and confirm all five reasons are immediately
    readable in the existing scrollable static list.
- **Done when**: automated timing tests pass, the browser shows a legible
  writing rhythm, layout stays fixed, and the complete reason holds for at
  least 4500ms.
