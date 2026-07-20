# Open-book Practice page

**Status:** Visual direction approved by Jiwon on 2026-07-20  
**Tracker:** Issue #60  
**Visual truth:** `docs/design/practice-open-book-level5-hint-reference.png` at 1586 x 992

## Product decision

Practice is the next physical spread of the book introduced on the landing page. It keeps the familiar computer-based-test contract, but the two panels stop looking like dashboard cards. Goal and Your writing become facing pages in one book.

This redesign changes presentation and the location of Hint. It does not change problem selection, grading, repair scheduling, sounds, scoring, or Summary data.

## Fixed frame

- Practice occupies one viewport. The browser document does not scroll.
- A single top strip remains fixed above the book. It contains the Nabi Markdown home control, Exit, level, elapsed time, six-step progress, position, Try another, sound, and Check or Next.
- Nabi Markdown and Exit both return to the level chooser.
- The left and right page frames are always equal width and equal height on desktop.
- Long Level 5 documents scroll inside the page content areas. The top strip, page headings, tabs, page edges, and center seam never move.
- The approved landing page and Summary page are out of scope.

## Top strip

- Use the existing wordmark and real butterfly asset.
- Place Exit immediately after the wordmark.
- Center `Level N`, elapsed time, six circular progress steps, and `N of 6` as a quiet two-row group.
- Place Try another, a compact square sound toggle, and Check or Next at the right.
- Remove Hint from the top strip because it is now a Your writing tab.
- The sound toggle uses an icon from an installed icon library or existing trusted asset, has an accessible `Mute feedback sounds` or `Unmute feedback sounds` name, and exposes `aria-pressed`. It does not show the words `Sound on` or `Muted`.
- Check remains the only black filled action. Next uses the same position and dimensions after a Matched result.
- Existing keyboard shortcuts and focus handoff remain unchanged.

## Book geometry

- The workspace is one open-book surface with a warm ivory paper token, thin dark outer edge, restrained inner-page shadow, and stitched center seam.
- The implementation reuses the landing page's Source Serif 4, book-paper palette, wordmark, and page-turn visual vocabulary.
- There are no dashboard gaps, floating cards, rounded controls, gradients, decorative colors, or ornamental animation.
- Desktop uses a strict 50:50 spread. The page heads contain only `GOAL` and `YOUR WRITING`. Level and chapter labels do not repeat on either page because the fixed top strip already owns level and progress context.
- The two pages use the same top alignment and baseline rhythm.

## Goal page

- Goal never changes mode or content after Check and never becomes a brief, hint, review, source, or learner preview.
- At every level, Goal renders `problem.target`. The Level 3-5 prompt remains useful to assistive technology and tests but is not substituted for the visible target.
- The target is fixed reference ink: no caret, focus ring, editable control, or answer state appears inside it.
- Goal uses the ruled writing-paper standard at every level:
  - slim line-number gutter;
  - horizontal rules matching the editor line height;
  - a clear left writing start guide;
  - faint indentation guides;
  - line numbers that continue through blank rows.
- The rendered Markdown sits on the rules without requiring prose equality. Nested lists visibly step across the indentation guides, so one and two indentation levels are immediately legible.
- Level 1 short targets keep generous blank ruled rows. Level 5 targets use the same paper geometry and scroll internally.

## Your writing page

- The right page heading is `YOUR WRITING`.
- The right page always exposes three beginner-facing tabs in this order: `WRITE`, `PREVIEW`, `HINT`.
- `Alt+1`, `Alt+2`, and `Alt+3` activate Write, Preview or Review, and Hint. Arrow keys move between tabs. Tab remains available for editor indentation and ordinary focus navigation.
- Every new problem opens Write and focuses the editor.
- Write uses the same ruled-paper geometry as Goal, with CodeMirror line numbers aligned to the same row height. The caret and focused editor make this page visibly writable.
- Preview renders only the learner's current answer. It is never a third column.
- After a failed Check, Preview's slot becomes Review and opens automatically. Review keeps the existing beginner language and grammar-only verdict contract.
- Hint remains a separate third tab even when Preview becomes Review.

## Hint

- Hint is intentionally lighter than a documentation page. It contains only the marks used by the current Goal and short labels such as Title, Section, Phase, List, Nested list, Steps, Quote, Code, and Report.
- The heading is `Syntax guide`; its single supporting line is `Only the marks used in this Goal.`
- Remove redundant instructions such as `Rebuild the Goal in Markdown`, `Return to Write when you are ready`, `Fixed reference`, and long developer-oriented explanations.
- The table derives from the current problem's authored syntax metadata and teaching data. It must not hard-code one Level 5 exercise.
- Progressive failure coaching may appear below the compact syntax table, but only after a failed Check. It uses the existing three authored hints and `Next hint` behavior.
- Hint does not use the ruled writing-paper background. Returning to Write restores the ruled answer sheet.

## Check, Review, and feedback

- Outcomes remain exactly Try again and Matched. The redesign does not compare spelling, capitalization, prose, or exact wording.
- The existing large centered pale-red or pale-green verdict notice remains viewport-centered and fades without moving the book.
- Try again keeps the learner on the same exercise and returns them to Write for repair.
- Matched moves focus to the top-strip Next action. Space, Enter, or the existing action shortcut advances. The next problem restores editor focus.
- Try another supplies another problem from the same skill without consuming the scheduled step.

## Responsive and motion behavior

- At 1280 x 800, the top strip and complete book frame fit in one browser viewport. Only the page interiors may scroll.
- At narrower widths, retain both logical pages and their controls without horizontal overflow. Below 900 px, stack Goal above Your writing inside the remaining viewport height, with each page receiving an equal share and its own internal scroll.
- Preserve visible two-pixel focus treatment and minimum 44 px pointer targets.
- The landing-to-Practice page-turn remains the only entrance motion. Practice itself does not replay a book animation when tabs change.
- Under `prefers-reduced-motion: reduce`, existing crossfade and instant-state behavior remain.

## Component boundaries

- `EditorialDesk` continues to own the fixed frame and session phase. It passes hint state and actions to the right answer page instead of the left Goal page.
- `ExerciseTopBar` owns navigation, progress, sound, and Check or Next. It no longer owns Hint.
- `GoalPanel` becomes a stable rendered target page and has no coach or evaluation state.
- `AnswerPanel` owns Write, Preview or Review, and Hint tabs plus keyboard navigation.
- A focused presentation helper may derive compact human-readable syntax rows from `GradableProblem`. It must remain deterministic and must not add runtime AI or external data.
- A shared ruled-page treatment aligns Goal rendering and CodeMirror without changing the Markdown renderer or editor document model.

## Accessibility and regression contract

- The three tabs expose correct `tablist`, `tab`, and `tabpanel` relationships, selected state, roving focus, and keyboard shortcuts.
- The hidden Hint panel is absent from the accessibility tree.
- The sound icon has a textual accessible name and visible focus state.
- The fixed target and learner preview retain meaningful region labels.
- Regression tests prove:
  - high-level Goal renders `problem.target`, never only `problem.prompt`;
  - Hint is available from the right-page tab and not from the top strip;
  - Alt+3 and arrow navigation open Hint without stealing Tab from CodeMirror;
  - a failed Check still opens Review while Hint remains reachable;
  - Matched -> focused Next -> Space or Enter -> next problem -> focused editor remains intact;
  - sound preference and action behavior remain unchanged.
- Browser verification covers Level 1 Write, Level 5 Write, Level 5 Hint, failed Review, narrow responsive layout, internal scrolling, keyboard-only completion, reduced motion, and console errors.

## Design QA gate

- Capture the implementation at the same 1586 x 992 Level 5 Hint state as the visual truth and compare them in one combined image.
- Also inspect 1280 x 800 Level 1 Write and Level 5 Write states because the chosen reference alone does not prove short-target balance or editable-paper alignment.
- Fix all P0, P1, and P2 mismatches before handoff. P3 polish may be listed as follow-up.
- Save the final report to project-root `design-qa.md` with `final result: passed` before the PR is ready.

## Delivery

- The implementation PR closes Issue #60.
- It includes this spec, the approved visual truth, tests, browser evidence, and the updated design-QA report.
- CodeRabbit is used when it has a healthy heartbeat. If it fails to respond or invocation fails, an independent Codex review supplies the merge evidence. A visibly active CodeRabbit review is allowed to finish and its actionable findings are addressed before merge.

## Out of scope

- Landing-page redesign.
- Summary-page redesign or information-hierarchy changes.
- Curriculum, problem-bank, grading, repair-schedule, scoring, ranking, or sound-content changes.
- Runtime AI, API-backed coaching, exact prose diffing, or spelling correction.
