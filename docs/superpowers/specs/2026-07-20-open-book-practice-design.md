# Open-book Practice page

**Status:** Visual direction approved by Jiwon on 2026-07-20  
**Tracker:** Issue #60  
**Primary visual truth:** `docs/design/practice-open-book-level5-hint-reference.png` at 1586 x 992

**Matched companion:** `docs/design/practice-open-book-level5-next-reference.png` at 1586 x 992

**Entrance-motion reference:** `docs/design/landing-practice-turn-midpoint-motion-reference.png` (geometry, paper light, and shadow only; its UI copy is not normative)

## Product decision

Practice is the next physical spread of the book introduced on the landing page. The familiar computer-based-test contract remains, but Goal and the learner's writing become facing sheets instead of dashboard panels.

The transition is one continuous scene: the warm Greeting spread turns into a slightly brighter work surface as though a comfortable reading light has been switched on. It must never look like two unrelated products or like a beige template with a white application pasted on top.

This redesign changes presentation and the location of Hint. It does not change problem selection, grading, repair scheduling, scoring, or Summary data. The existing real page-turn sound remains part of the entrance.

`Show, don't tell` is a binding rule for this surface. Familiar shape and state replace explanatory copy whenever they remain clear. Visible words stay only when an icon or layout cannot communicate the action reliably.

## Fixed frame

- Practice occupies one viewport. The browser document does not scroll.
- A single fixed top strip contains navigation, session context, sound, progress, Try another, and the primary Check or Next action.
- The left and right page frames are always equal width and equal height on desktop.
- Long Level 5 documents scroll only inside their page interiors. The strip, page edges, icon tabs, and center seam never move.
- Summary layout and information hierarchy are out of scope.

## Top strip

### Left

- Use the existing Nabi Markdown wordmark and real butterfly asset. The wordmark remains a home control that returns to the level chooser.
- Follow it with a thin vertical hairline and the quiet serif text link `Exit`.
- Exit has no box and no X icon. Hover and keyboard focus reveal an underline. The visible text sits inside an invisible minimum 44 px target and moves down by 1 px when pressed.
- Exit returns to the level chooser without completing the current practice run.

### Center

- Show `Level N`, elapsed time, and a compact speaker icon on one row.
- Show six circular progress steps beneath them.
- Do not show visible `N of 6`; expose the exact position in the progress control's accessible name.
- Sound defaults on. The on state uses a speaker icon; the muted state uses the matching slashed-speaker icon.
- Tooltips and accessible names are `Mute sound` and `Turn sound on`. The existing persisted sound preference and feedback channel remain authoritative.

### Right

- Try another is an icon-only shuffle control with the tooltip and accessible name `Try another`.
- The primary action is a wide black horizontal keycap. It is neither square nor pill-shaped and keeps exactly the same dimensions and position in both states.
- Before evaluation, the keycap contains only a centered white checkmark and is named `Check answer`.
- After Matched, only its inner indicator changes to a centered straight right arrow and it is named `Next exercise`.
- The Return or bent Enter-arrow metaphor is discarded.
- On press, icon controls and the primary keycap scale to approximately 96%, translate down 2 px, and gain a restrained inset shadow. Release settles in about 140 ms. Reduced-motion mode uses tonal feedback without transform.

## Icon contract

- Use the closest matching icons from the project's trusted icon library. Do not use emoji, Unicode approximations, handcrafted SVGs, or CSS drawings.
- Every icon-only control has an `aria-label` and a concise tooltip on both pointer hover and keyboard focus.
- Tooltips do not duplicate permanently visible text and never obscure the focused control's target.
- All controls retain a visible two-pixel focus treatment and minimum 44 px pointer target.

## Typography contract

- Continue the established three-role system: the operating interface uses the system sans stack, rendered reading surfaces use Source Serif 4, and Markdown source plus code use JetBrains Mono.
- Source Serif 4 and JetBrains Mono are self-hosted project assets with their SIL Open Font License files committed beside the fonts. The interface must not depend on a third-party font CDN or an installed system font.
- Use regular and semibold weights only unless a later visual requirement proves another weight necessary.
- Preserve fallback stacks and `font-display: swap` so missing or delayed font loading never hides the exercise.

## Book geometry and paper system

- The workspace is one open-book surface with thin dark outer edges, restrained inner-page shadow, ruled paper, and a realistic stitched center seam.
- Greeting and Practice share one optimized raster containing both warm paper sheets and their restrained stitched center fold. The fold is inseparable from the paper pixels; there is no separate spine image, DOM layer, pseudo-element, or CSS-drawn seam. Content remains HTML and CSS above transparent page surfaces.
- The unified spread is fixed throughout the page turn. The receiving Practice spread is already visible beneath the transition; only the opaque right leaf moves, while the outgoing left page uses a temporary opaque paper surface to prevent content bleed-through.
- On desktop the two pages form a strict 50:50 spread. Their top alignment and baseline rhythm match.
- Remove visible `GOAL`, `YOUR WRITING`, repeated level labels, chapter labels, and other page explanations.
- The left fixed target is identified by a small bullseye icon. The right modes are identified by their tab icons.
- There are no dashboard gaps, floating cards, rounded page panels, decorative gradients, ornamental colors, or unrelated entrance animation.
- On the stacked mobile layout, replace the two-page spread raster with the neutral repeating paper texture because the pages no longer meet horizontally.

## Goal page

- Goal never changes mode or content after Check and never becomes a brief, hint, review, source, or learner preview.
- At every level it renders `problem.target`. The Level 3-5 prompt remains available to assistive technology and tests but never replaces the visible target.
- A small bullseye icon denotes the fixed reference; its accessible label is `Goal`.
- The target is fixed reference ink: no caret, editable focus ring, or answer state appears inside it.
- Goal uses the ruled writing-paper standard at every level:
  - slim line-number gutter;
  - horizontal rules matching the editor line height;
  - a clear left writing start guide;
  - faint indentation guides;
  - line numbers continuing through blank rows.
- Rendered Markdown sits on the rules. Nested lists visibly step across indentation guides so one and two indentation levels are immediately legible.
- Level 1 short targets keep generous blank ruled rows. Level 5 targets use the same geometry and scroll internally.

## Answer page

- The answer page has three icon-only tabs in this order: pencil for Write, eye for Preview or Review, and lightbulb for Hint.
- The selected tab is shown by a black underline. Tooltips and accessible names are `Write`, `Preview` or `Review`, and `Hint`.
- `Alt+1`, `Alt+2`, and `Alt+3` activate the tabs. Arrow keys move between tabs. Tab remains available for editor indentation and ordinary focus navigation.
- Every new problem opens Write and focuses the editor.
- Write uses the same ruled-paper geometry as Goal, with CodeMirror line numbers aligned to the same row height. The caret and focus state are the principal signals that this page is editable.
- Preview renders only the learner's current answer. It is never a third column.
- After a failed Check, Preview's slot becomes Review and opens automatically. Review keeps the existing beginner language and grammar-only verdict contract.
- Hint remains reachable as the third tab when Preview becomes Review.

## Hint

- Hint is a spacious one-column syntax reminder, not a documentation page and not a table.
- Remove `Syntax guide`, `Only the marks used in this Goal.`, semantic-label columns, return instructions, and developer-oriented explanations.
- Show only the actual Markdown source examples needed by the current Goal, such as `# Title`, `## Section`, `### Phase`, `- API provider`, an indented `- Versioned schema`, `1. Read AGENTS.md`, `> Pause when...`, `` `npm test` ``, and a fenced Markdown example.
- The list derives from the current problem's authored syntax metadata and teaching data. It must not hard-code one Level 5 exercise.
- Progressive coaching text may appear only after a failed Check and continues to use the existing authored hint sequence.
- Hint does not use ruled writing paper. Returning to Write restores the ruled answer sheet.

## Check, Review, and feedback

- Outcomes remain exactly Try again and Matched. The redesign does not compare spelling, capitalization, prose, or exact wording.
- The existing large centered pale-red or pale-green verdict notice remains viewport-centered and fades without moving the book.
- Try again keeps the learner on the same exercise and returns to Write for repair.
- Matched changes the black keycap from checkmark to straight right arrow and hands focus to it. Space, Enter, or the existing action shortcut advances. The next problem restores editor focus.
- Try another supplies another problem from the same skill without consuming the scheduled step.

## Three-stage entrance and sound

- The existing 720 ms page-turn remains the sole Greeting-to-Practice entrance motion.
- Stage 1, approximately 0-220 ms: Greeting keeps its warm book-paper tone. The selected right leaf begins to lift and its moving shadow deepens.
- Stage 2, approximately 220-520 ms: the leaf passes the center; the revealed paper moves through an intermediate ivory while shadow and restrained page highlight make the work surface feel gently illuminated.
- Stage 3, approximately 520-720 ms: Practice settles into a warm-neutral work ivory that is brighter than Greeting but is neither stark white nor yellow beige. The moving shadow collapses into the static inner-page shadow.
- The transition coordinates page rotation, paper background color, restrained brightness, and moving shadow. Do not add a literal lamp, spotlight, glow orb, persistent decorative gradient, or full-screen raster backdrop.
- Keep the unified spread fixed and visually continuous for the entire transition. Never animate the fold or add another image above it.
- Play the existing `src/sound/nabi-page-turn.mp3` once from the already unlocked sound channel when the physical leaf begins to move. The animation must not wait for audio playback, and muted preference suppresses it as it does today.
- Practice does not replay the book animation when tabs, verdicts, or exercises change.
- Under `prefers-reduced-motion: reduce`, skip the 3D turn and moving shadow. Use the existing 120 ms paper-color crossfade; the page-turn sound still follows the user's sound preference rather than motion preference.

## Responsive behavior

- At 1280 x 800, the complete fixed strip and book frame fit within one browser viewport. Only page interiors may scroll.
- Below 900 px, stack Goal above the answer page inside the remaining viewport height. Give each an equal share and independent internal scroll, swap the spread for neutral paper without a fold, and retain the same controls without horizontal overflow.
- On narrow layouts, preserve icon tooltips or equivalent accessible descriptions, keyboard operation, focus visibility, and minimum targets.

## Component boundaries

- `EditorialDesk` owns the fixed frame and session phase. It passes hint state and actions to the answer page rather than Goal.
- `ExerciseTopBar` owns navigation, progress, sound, Try another, and the Check or Next keycap. It no longer owns Hint.
- `GoalPanel` is a stable rendered target page with no coach or evaluation state.
- `AnswerPanel` owns Write, Preview or Review, and Hint tabs plus keyboard navigation.
- A focused presentation helper may derive compact syntax examples from `GradableProblem`. It remains deterministic and adds no runtime AI or external data.
- A shared ruled-page treatment aligns Goal rendering and CodeMirror without changing the Markdown renderer or editor document model.
- The app shell owns one shared two-page-and-fold raster on Greeting, Practice, and Summary. Child page surfaces stay transparent, and no component or pseudo-element may recreate or reposition the fold.

## Accessibility and regression contract

- The three icon tabs expose correct `tablist`, `tab`, and `tabpanel` relationships, selected state, roving focus, keyboard shortcuts, labels, and tooltips.
- Hidden tab panels are absent from the accessibility tree.
- Sound, Try another, Goal, Check, and Next have state-correct textual accessible names and visible focus states.
- The fixed target and learner preview retain meaningful region labels.
- Regression tests prove:
  - high-level Goal renders `problem.target`, never only `problem.prompt`;
  - Hint is available from the right-page tab and not the top strip;
  - Alt+3 and arrow navigation open Hint without stealing Tab from CodeMirror;
  - a failed Check opens Review while Hint remains reachable;
  - Matched changes only the keycap indicator and accessible name;
  - Matched -> focused Next -> Space or Enter -> next problem -> focused editor remains intact;
  - visible progress omits `N of 6` while the accessible name reports it;
  - sound defaults on, persists mute state, swaps speaker icon and label, and suppresses page-turn audio when muted;
  - the page-turn sound fires once per accepted level selection;
  - reduced motion removes transforms while preserving the short paper-color transition.
- Browser verification covers Greeting, the transition, Level 1 Write, Level 5 Write, Level 5 Hint, failed Review, Matched Next, narrow responsive layout, internal scrolling, keyboard-only completion, tooltips by hover and focus, reduced motion, muted audio, and console errors.

## Design QA gate

- Capture the implementation at the same 1586 x 992 Level 5 Hint state as the primary visual truth and compare source and implementation in one combined image.
- Repeat the comparison for the Matched Next state.
- Inspect the Greeting and page-turn midpoint against their references for paper-family continuity, fixed spine, leaf geometry, moving shadow, and absence of a visible route cut. Midpoint copy is explicitly non-normative.
- Also inspect 1280 x 800 Level 1 Write and Level 5 Write because the selected reference alone does not prove short-target balance or editable-paper alignment.
- The implementation PR may become ready after the automated layout, interaction, accessibility, and review gates pass. It must not claim that a visual comparison passed without fresh same-viewport captures from the approved browser workflow.
- Complete the same-viewport comparison before Build Week submission. Fix all P0, P1, and P2 mismatches before submission; P3 polish may be listed as follow-up.
- Record current automated evidence and any pending visual comparison honestly in project-root `design-qa.md`. Add `final result: passed` only after the current implementation has been compared against the approved references.

## Delivery

- The implementation PR closes Issue #60.
- It includes this spec, approved visual references, tests, and an updated design-QA report that distinguishes automated evidence from pending visual inspection.
- CodeRabbit is used when it has a healthy heartbeat. If it fails to respond or invocation fails, an independent Codex review supplies the merge evidence. A visibly active CodeRabbit review is allowed to finish and its actionable findings are addressed before merge.

## Out of scope

- Landing-page information architecture, copy, typography, and level-choice redesign. Only its shared spine and transition participation change.
- Summary-page redesign or information-hierarchy changes.
- Curriculum, problem-bank, grading, repair-schedule, scoring, ranking, or sound-content changes.
- Runtime AI, API-backed coaching, exact prose diffing, spelling correction, or capitalization correction.
