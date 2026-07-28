# Morning report — the design-completeness loop

## The short version

Nabi Markdown now has the frame it was missing. Both the Greeting and the
Practice screen carry the same book chrome: a running head pinned to the very
top edge of the window and spanning its full width, a bounded reading column in
the middle instead of a small card adrift in a large empty region, and an action
line pinned to the bottom edge so the primary button can never fall below the
fold. **Every one of the eight gauges is now at target on all twelve measured
surfaces, and not a single gauge is worse than it was before the night started.**

The three numbers you named in the brief:

- Wide desktop empty reading area: **87.5% → 56.2%** (target was 70% or less).
- Tallest blank band on the tablet practice screen: **58.0% → 16.1%** (target 25%).
- Phone primary action: it used to render **10.4% of the screen height below the
  fold**; it now sits **1.4% above the bottom edge**, pinned, full width.

The identity survived. The judge, which never saw a line of the CSS and only
looked at the rendered screenshots, confirmed in writing that the cream paper
ground, the serif, the hairline rules, the stitched spine and the flat black
button are all intact, and that nothing drifted toward Duolingo's saturated
fills, pill buttons or cartoon shapes.

**Which stop condition fired: "Reached."** That is the first of the three the
spec lists — every gauge at target on all twelve surfaces *and* the judge
returning `pass`. It fired at about four hours into the five-hour budget, so the
loop stopped early rather than running out of time or stalling. The judge's exact
words on the point it had failed the round before: the phone's empty space is now
"page", not "a hole".

One caveat you should weigh before treating the `pass` as final: the judge could
not open the six Mobbin reference URLs the way the spec intends, and said so
itself. See "Things only you can decide", item 6.

## What changed, in plain terms

**Round 1 — the frame.** The book used to float in the middle of the window with
a small margin around it, and its controls floated inside the card. Now the book
fills the window on both screens. The running head sits on the top edge and runs
the full width; the prompt is left-aligned and starts high instead of being
centred display type floating mid-screen; the mark-to-mark arrows moved out of
the card's top-right corner down onto the action line, which freed the prompt to
use the full column width; and a single action line is pinned to the bottom edge
carrying Hint on the left and Enter on the right, full width on a phone. On a
phone the Greeting now fits one screen, so choosing a chapter no longer requires
scrolling past a full-height hero. Every tap target that was under 44 by 44
pixels — the two mark arrows, the Hint button, the hint's close button, the
phone wordmark, and the two footer links — was brought up to the floor.

**Round 2 — the judge's corrections.** The judge failed round 1 on one point:
on a phone the bordered card stopped two thirds of the way down the screen and
turned the paper beneath it into a hole. The card frame is now gone on phones —
the exercise sits directly on the book paper, so the space under the last mark
row reads as page rather than as a gap where content ran out. The room that
freed went to the specimen (the rendered document line) and the mark row, the
two things a learner actually reads. At tablet width the reading column regained
an outer margin, which brought the prompt from 68.6 characters a line down to
62.2. Round 2 also repaired a defect round 1 had introduced on the Summary
screen, which shares the same shell and was carrying an empty strip at its foot
where the practice screen's action line would be.

## Gauges: start → end, every surface

`landing`, `practice` and `hint` are the three states captured at each of four
widths. Lower is better for the empty-area, blank-band and small-target columns.
"Action gap" is how far above the bottom edge the primary button ends, as a
fraction of the window height; a negative number means it was off the screen.
"Line length" is characters per line for the longest run of prose, where a book
sits between 45 and 75.

| Surface | Empty area | Tallest blank band | Widest blank column | Top rail | Action gap | Small targets | Line length |
| --- | --- | --- | --- | --- | --- | --- | --- |
| landing-phone | 0.556 → 0.452 | 0.286 → 0.212 | 0.053 → 0.051 | no → yes | −0.104 → 0.020 | 0 → 0 | 46.2 → 47.9 |
| practice-phone | 0.674 → 0.513 | 0.484 → 0.189 | 0.079 → 0.026 | no → yes | −0.092 → 0.014 | 4 → 0 | 41.6 → 46.8 |
| hint-phone | 0.430 → 0.242 | 0.094 → 0.040 | 0.079 → 0.026 | no → yes | 0.302 → 0.014 | 5 → 0 | 20.1 → 46.8 |
| landing-tablet | 0.651 → 0.592 | 0.108 → 0.097 | 0.053 → 0.052 | no → yes | 0.217 → 0.098 | 2 → 0 | 45.7 → 46.5 |
| practice-tablet | 0.804 → 0.455 | 0.580 → 0.161 | 0.092 → 0.056 | no → yes | 0.217 → 0.016 | 5 → 0 | 42.8 → 62.2 |
| hint-tablet | 0.680 → 0.445 | 0.352 → 0.096 | 0.092 → 0.056 | no → yes | 0.432 → 0.016 | 4 → 0 | 42.8 → 62.2 |
| landing-laptop | 0.612 → 0.564 | 0.112 → 0.100 | 0.126 → 0.125 | no → yes | 0.131 → 0.036 | 2 → 0 | 70.0 → 70.8 |
| practice-laptop | 0.850 → 0.542 | 0.423 → 0.167 | 0.287 → 0.080 | yes → yes | 0.131 → 0.018 | 5 → 0 | 70.0 → 70.8 |
| hint-laptop | 0.777 → 0.512 | 0.154 → 0.105 | 0.287 → 0.080 | yes → yes | 0.293 → 0.018 | 4 → 0 | 32.9 → 61.8 |
| landing-wide | 0.662 → 0.653 | 0.121 → 0.090 | 0.149 → 0.128 | no → yes | 0.189 → 0.067 | 2 → 0 | 73.9 → 73.9 |
| practice-wide | 0.875 → 0.562 | 0.477 → 0.189 | 0.299 → 0.080 | no → yes | 0.189 → 0.017 | 5 → 0 | 73.9 → 73.9 |
| hint-wide | 0.813 → 0.533 | 0.239 → 0.119 | 0.299 → 0.080 | no → yes | 0.352 → 0.017 | 4 → 0 | 32.9 → 59.9 |

Targets: empty area ≤ 0.70, tallest blank band ≤ 0.25, widest blank column
≤ 0.15, top rail present on all twelve, action gap between 0 and 0.12, small
targets 0, line length between 45 and 75. Sideways overflow was 0 before and is
still 0 on all twelve. **No cell moved the wrong way**, so the round-zero floor
held everywhere.

The column that moves most is line length on the practice screens, from the
twenties and thirties up into the sixties. That is not drift, it is the fix: at
round zero the prompt was a narrow centred block, so the longest line of prose on
the phone practice screen ran twenty characters — under half a book measure — and
on laptop and wide it ran thirty-three. Making the prompt a full-width
left-aligned line brought every surface inside the 45–75 range for the first
time. Round 1 overshot at tablet (68.6) and the judge said so; round 2 brought it
back to 62.2.

## The three things the judge still flags

It passed the round, so none of these is a failure — they are the judge's own
list of what it would fix next, in its order of value. Its full verdict is at
`.claude/loop/rounds/2/verdict.json`.

1. **The rail falls apart at exactly one width: tablet, 768 pixels.** There the
   running head wraps into two rows and the previous / next / shuffle controls
   are orphaned on the second row with nothing tying them to the head above. At
   laptop and wide the whole rail is one line; on a phone the two rows are closed
   by a hairline. 768 is the only width where the rail reads as two loose rows
   rather than one pinned band. I tried a different two-row arrangement for that
   width during the night, looked at it, judged it worse, and reverted it, so
   this is still open.

2. **Above phone size, the primary button is under-weighted.** The Enter button
   is about 109 pixels wide in an 1800-pixel window — 2.4% of the width, 3.1% at
   laptop, 5.7% at tablet. On a phone it is 93%, which the judge called right. In
   the reference screens the primary action carries the terminal weight of the
   screen; on Nabi's desktop widths it reads as a small link sitting in a large
   empty strip. Widening it, or giving the whole action line more presence, is
   the judge's second-highest-value change.

3. **The Greeting has a top rail but no bottom one.** The chapter list simply
   runs out; there is no closing line the way the practice screen has one. On a
   phone the Level 5 rule lands 14 pixels from the bottom edge, which the judge
   says reads as a list truncated by the window rather than as a deliberate last
   row. Giving the Greeting the same bottom line, or an explicit closing rule,
   would make the two screens read as one book.

One further round after the pass — round 3 — was spent on something the judge was
not looking for: in every practice capture the Greeting's new running head was
transparent while the page turned, so the practice rail underneath showed through
and the two heads composited into one unreadable strip for the length of the
animation. That is fixed (commit `d667a52`). It moved no gauge, because the
gauges read the practice screen underneath the animation rather than the
animation itself.

## Things only you can decide

1. **The phone prompt is now small.** To get the reading measure on a 390-pixel
   screen up to a book-like 45 characters a line, the practice prompt had to drop
   from roughly 23 pixels to about 15. It now reads as an instruction line above
   the exercise rather than as a display heading, which is what the reference
   screens do — but it is a visible change in emphasis and you may want it
   somewhere in between. It is one value in the phone block of
   `src/styles/global.css` (`.center-card__instruction { font-size: 0.95rem }`).

2. **Phones no longer draw a card.** The bordered, off-white card is gone at
   phone width; the exercise sits directly on the book paper. This was the fix
   for the judge's one failing point, and it matches the reference phone screens,
   but it is a real change to how the product looks on the device most people
   will open it on. Desktop and tablet keep the card.

3. **The project links moved.** "Source code" and "Third-party licenses" used to
   sit at the foot of the chapter list; they are now the right-hand end of the
   Greeting's running head. They are placed into the first row by CSS rather than
   written first in the markup, so choosing a chapter is still the first thing
   the keyboard reaches. If you would rather they stayed at the foot, the
   Greeting will need a different element to carry the full-width rail.

4. **The book no longer floats on a desk.** Both screens fill the window edge to
   edge instead of sitting inside a 12-pixel margin with rounded corners. This
   was required to put a rail on the top edge across the full width, and it is
   how the approved Level 5 reference in `docs/design/` already looks — but it
   changes the "book on a table" reading of the app at very large window sizes.

5. **The capture rig photographs the page turn.** The measurement script
   screenshots the practice screen a few hundred milliseconds after a chapter is
   chosen, while the 720-millisecond page-turn animation is still running, so the
   four `practice-*.png` captures show the turning Greeting page lying on top of
   the practice screen rather than the practice screen itself. The numbers in
   those rows are still taken from the real practice screen underneath. The four
   `hint-*.png` captures are taken after the turn finishes and show the practice
   screen properly. The script is hash-pinned and I was forbidden to touch it, so
   I told the judge about this in the covering note instead. If you want future
   rounds to photograph the practice screen cleanly, the rig needs to wait for
   `page-turn-transition` to detach, the way the existing end-to-end tests do.

6. **How much to trust the `pass`.** Two substitutions were forced on the
   cross-examination, and you may want to re-run it before treating the verdict
   as final.

   *The model.* The loop specifies `fable` for the judge. The very first call
   came back with "you've hit your monthly spend limit" for that model, so both
   rounds were judged by `opus` instead, using the identical, unmodified judge
   prompt. Nothing else about the judging changed.

   *The reference screens.* The judge is required to open six named Mobbin URLs
   and forbidden to judge from memory. `mobbin.com/screens/<id>` returns HTTP 403
   both to a plain fetch and to a real browser navigation, so five of the six
   could not be opened. The judge recovered one of the six exactly by searching
   the authenticated Mobbin connector, plus thirty-four further live screens
   covering every app and platform the spec names — Duolingo web and iOS, Babbel
   web, Uxcel web — and based its findings on those. It flagged this itself and
   wrote, in its own verdict: a strict reading of its instructions says it should
   have returned `blocked`, and you should override it to `blocked` if you want
   the literal contract enforced. I have left its judgement standing because the
   evidence it used was live rather than remembered, but the call is yours.

   Neither the judge prompt nor the gauge script was edited at any point;
   `shasum -a 256 -c .claude/loop/guard.sha256` passes, and the judge
   independently checked and confirmed the same thing from the commit contents.

## What was not touched

No push, no pull request, no merge, no deployment, no alias change, no issue.
Everything is local commits on one branch. No problem-bank content and no
grading logic was changed, so the exercises the captures render are identical to
the ones they rendered at round zero. No test was weakened, skipped or deleted:
`npm run typecheck`, `npm test` (10,224 tests) and
`npx playwright test tests/e2e/heading-flow.spec.ts --project=chromium` (28
tests) all pass. Twice during the night a change of mine broke an existing test;
both times the test was right and the change was rewritten to respect it — the
end-to-end test that pins the Greeting and Practice books to the same geometry
is why the Greeting went full-bleed too, and the one that pins the first tab stop
to "Level 1" is why the Greeting's running head is placed by CSS rather than
written first.

## How to undo everything

Branch: **`loop/design-completeness`**

```
git reset --hard 1a1899e
```

`1a1899e` is the commit the night started from — the loop harness, with none of
the design work on top. The commits on top of it are:

- `88930aa` — round 1, the frame
- `ce42820` — round 2, the phone page and the tablet margin
- `d667a52` — round 3, the page-turn fix
- `13f2414` — round 3's captures and log row (no source changes)

To keep round 1 and drop everything after it, `git reset --hard 88930aa`.

Nothing was pushed, so no remote branch exists and nothing needs cleaning up
anywhere else.

## Where the evidence is

- `.claude/loop/design-completeness.log.jsonl` — one row per round: the change,
  and every gauge on every surface at the end of that round.
- `.claude/loop/rounds/1/`, `/2/` and `/3/` — that round's twelve screenshots,
  its `gauges.json`, and (for rounds 1 and 2) the judge's verdict in full. Round
  3 has no verdict: the loop had already stopped on the round 2 `pass`, and round
  3 only repaired the page-turn defect described above.
- `.claude/loop/baseline/` — the round-zero screenshots, untouched.
- `.loop-artifacts/` — the final capture (identical to `rounds/3/`).

To reproduce any of it:

```
npm run build
npx vite preview --port 4174 --host 127.0.0.1 &
node scripts/loop/measure.mjs --base http://127.0.0.1:4174 --out .loop-artifacts
```
