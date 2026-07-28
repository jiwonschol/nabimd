# Loop — design completeness

Unattended loop that raises Nabi Markdown from "works" to "finished". Written
2026-07-29. Second and later runs read this file instead of re-interviewing.

## Concept (owner's words, non-negotiable)

- Anyone can open it and use it — web and phone, no login.
- It should feel like **reading a book**, not using a tool.
- The Summary page is **encouragement**, not scoring.
- Priority when density and whitespace conflict: **book-likeness wins, phone is
  the reference viewport.** Wide desktop is an expansion of the phone layout,
  not a different design.

## 1. Target — what "finished" is judged against

Not an implementation reference. These are the evaluation references.

**Structural target.** Every shipped practice screen surveyed on Mobbin — web
and iOS — frames its content the same way, and Nabi Markdown does none of it:

| Element | Reference behaviour | Nabi Markdown today |
| --- | --- | --- |
| Top rail | Close + full-width progress pinned to the top edge | absent; controls float inside the card |
| Prompt | Left-aligned, starts high, flows down | centred, floats mid-screen |
| Primary action | Pinned to the bottom; full-width on phone | inside the card, and **below the fold on phone** |
| Empty space | Trapped between rail and action bar, so it reads as margin | unbounded, so it reads as a void |

References (open them, do not recall them):
- [Duolingo — type the missing letters, web](https://mobbin.com/screens/216a2a66-9ea7-4911-9086-91fab2978485) — closest analogue: a bordered card holding a *dense document* with inline blanks
- [Duolingo — character choice, web](https://mobbin.com/screens/dc97c6c2-a552-4c96-a809-28e7da3f059b)
- [Babbel — listen and choose, web](https://mobbin.com/screens/9607627c-d29f-4ed9-a0af-fdc65e80d670)
- [Uxcel — quiz, web](https://mobbin.com/screens/6afe237b-00ba-4b25-a2cc-897383f7cd26)
- [Duolingo — complete the translation, iOS](https://mobbin.com/screens/3fd25e96-f414-434e-b999-eaa873a8f874)
- [Duolingo — fill in the blank, iOS](https://mobbin.com/screens/61cbdb80-29c5-4f75-83d4-2d086ea19cac)

**Take the structure, not the style.** Those apps are loud and cartoon-like.
Nabi Markdown keeps its book palette, serif type, and paper texture. Borrowing
their colour or mascots is a failure, not a success.

**Tone target.** `docs/design/*.png` — the approved open-book references. The
result must still read as the same product.

**Floor.** `.claude/loop/baseline/` holds the round-zero capture. No gauge may
end worse than it started, on any surface.

## 2. Staging rig

```
npm run build
npx vite preview --port 4174 --host 127.0.0.1 &
node scripts/loop/measure.mjs --base http://127.0.0.1:4174 --out .loop-artifacts
```

Writes one screenshot per surface plus `gauges.json`. Session seed is pinned to
`1`, so the same commit always renders the same exercise. Twelve surfaces:
`{landing, practice, hint} x {phone 390, tablet 768, laptop 1440, wide 1800}`.

The rig asserts it actually reached each surface before reading numbers from it,
records `reached: false` with a reason when it cannot, and **exits non-zero if
any surface is unreached** — so a round can never be scored on the surfaces that
happened to load.

## 3. Gauges

All gauges are measured **inside the reading area** (`.card-practice`, else
`main`), not the whole window. A viewport-wide grid is blind here: the top bar
spreads controls across the full width, so every column contains ink and the
gauges do not move when the card shrinks. The calibration gate caught this —
see the note at the end of this section.

Round zero, measured 2026-07-29 (`.claude/loop/baseline/gauges.json`):

| Gauge | Round zero | Target |
| --- | --- | --- |
| `emptyRatio` | 0.430 – **0.875** | **≤ 0.70 on every surface** |
| `deadBandY` | 0.094 – **0.580** | **≤ 0.25 on every surface** |
| `deadBandX` | 0.053 – **0.299** | **≤ 0.15 on every surface** |
| `hasTopRail` | false on 10 of 12 | **true on all 12** |
| `bottomGapRatio` | **−0.104** on phone (action below the fold) | **0 ≤ gap ≤ 0.12 on all 12** |
| `undersizedTargets` | 0 – 5 | **0 on all 12** |
| `maxMeasure` | 20.1 – 73.9 | **45 – 75 wherever prose exists** |
| `horizontalOverflow` | 0 | **stays 0** |

`bottomGapRatio` below zero means the primary action renders past the bottom of
the viewport. On a phone that is not a polish problem, it is a broken screen.
`deadBandY` is the tallest run of completely empty rows — at 0.58 on the tablet
practice screen, well over half the reading area is a single blank band.

**Calibration, 2026-07-29.** Shrinking `.center-card` from 44rem to 14rem — a
gross regression — moved the first two versions of these gauges by less than
0.002. Both were rewritten before the loop was allowed to start. The surviving
instrument moves `deadBandX` 0.287 → 0.455 and `emptyRatio` 0.850 → 0.944 on
the same injection. Any future edit to the gauges must be re-calibrated the
same way; a gauge that cannot see a deliberate regression cannot see a real one.

## 4. Cross-examination

A judge that reads the diff is a code review, not cross-examination. The judge
**looks at the rendered screenshots** and opens the Mobbin references, and never
sees the CSS.

Judge prompt: `.claude/loop/judge-prompt.md` (hash-pinned, see §5).
Model: `fable`, effort `high` — deliberately not weaker than the builder.

The judge must, per round: open the reference links; compare each captured
surface against them; cite the gauge number behind every verdict; and state
plainly whether the result still reads as the same book-like product. It returns
`pass` only when the structural target is met *and* the tone target survives.

## 5. Blocks

The owner opened the design scope deliberately — layout, spacing, density,
responsive behaviour, palette, and type are all fair game. These blocks are not
scope limits. They exist because the cheapest way to satisfy a gauge is to
attack the instrument.

Forbidden, every round:

1. Editing, deleting, skipping, or loosening any existing test, gate, or
   assertion — `src/**/*.test.*`, `tests/e2e/**`, `scripts/problem-bank/*.gate.*`.
2. Editing `scripts/loop/measure.mjs` or `.claude/loop/judge-prompt.md`.
   Both are hash-pinned in `.claude/loop/guard.sha256`; the round fails if a
   hash moves.
3. Any remote or external write — push, PR, merge, deploy, alias change, issue
   creation. The loop commits to its own branch and stops there.
4. Changing problem-bank content or grading logic. This is a design loop; the
   exercises it renders must stay identical so the captures stay comparable.
5. Hardcoding a value to satisfy a gauge without changing what a reader sees.

## 6. Stop

Stops on the first of these.

- **Reached** — every gauge in §3 at target on all twelve surfaces, and the
  judge returns `pass`.
- **Stalled** — 2 consecutive rounds with no gauge improving by more than 0.01.
- **Budget** — 5 hours wall clock from the first round.

## Model roles

| Role | Model | Effort |
| --- | --- | --- |
| Builder | `opus` | `xhigh` |
| Judge | `fable` | `high` |
| Measurement | deterministic script, no model | — |

## Artefacts

- `.claude/loop/baseline/` — round-zero capture, the floor
- `.claude/loop/design-completeness.log.jsonl` — one row per round
- `.claude/loop/rounds/<n>/` — that round's captures and judge verdict in full
- Branch `loop/design-completeness`, one commit per round
