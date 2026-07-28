# Center Card Design QA

## Target

- Selected direction: B2 compact editorial practice card
- Reference: `docs/design/qa/center-card-b2-reference-1448x1086.png`
- Viewport: 1024 × 768
- Comparison: `docs/design/qa/center-card-b2-comparison-2048x768.png`
- Final implementation capture: `docs/design/qa/center-card-b2-implementation-1024x768.png`
- Expanded Hint capture: `docs/design/qa/center-card-b2-implementation-hint-1024x768.png`

## Visual checks

- The instruction is centered; only the requested syntax term is bold and underlined.
- The rendered Goal is centered, visibly stronger than the locked source phrase, and has room for two or three natural lines.
- Syntax boxes are the visual center of the practice surface and remain at least 40 × 44 px.
- The compact Enter button does not stretch when no verdict is present.
- Hint and Enter share one short centered action row.
- The previous left-edge Goal marker was removed because it pulled attention away from the syntax boxes.
- Opening Hint keeps the card's top edge anchored and expands the surface downward.
- The card fits at 1280 × 800 and has no horizontal overflow at 390 × 844.
- Browser console: no warnings or errors.

## Verification

- `npm run typecheck`
- `npm test` — 71 files, 10,215 tests passed
- `npm run test:e2e` — 25 tests passed
- `npm run build`

final result: passed
