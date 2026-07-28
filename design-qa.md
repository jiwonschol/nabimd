# Center Card Design QA

## Target

- Selected direction: B2 compact editorial practice card
- Reference: `docs/design/qa/center-card-b2-reference-1448x1086.png`
- Viewports: 1024 × 768 and 390 × 844
- Comparison: `docs/design/qa/center-card-b2-comparison-2048x768.png`

Every capture below is regenerated from the branch by `tests/e2e/capture-center-card-qa.spec.ts`
on seed 1, so the evidence cannot drift behind the styles it documents.

| Capture | File |
| --- | --- |
| Desktop | `docs/design/qa/center-card-b2-implementation-1024x768.png` |
| Desktop, Hint expanded | `docs/design/qa/center-card-b2-implementation-hint-1024x768.png` |
| Phone | `docs/design/qa/center-card-b2-implementation-390x844.png` |
| Phone, Hint expanded | `docs/design/qa/center-card-b2-implementation-hint-390x844.png` |

## Visual checks

- The instruction is centered; only the requested syntax term is bold and underlined.
- The rendered Goal is centered, visibly stronger than the locked source phrase, and has room for two or three natural lines.
- Syntax boxes are the visual center of the practice surface and remain at least 40 × 44 px.
- The compact Enter button does not stretch when no verdict is present.
- Hint and Enter share one short centered action row.
- The previous left-edge Goal marker was removed because it pulled attention away from the syntax boxes.
- Opening Hint keeps the card's top edge anchored and expands the surface downward, at phone width as well as on desktop.
- The card fits at 1280 × 800 and has no horizontal overflow at 390 × 844.
- Browser console: no warnings or errors.

## Regenerating the captures

```
npm run design:card-qa:capture
```

Run this after any change to the card styles. The captures are evidence, and
evidence that predates the styles it documents is worse than none — an earlier
revision of this note shipped a Hint capture taken nine minutes before the last
CSS edit.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run test:e2e`
- `npm run build`
