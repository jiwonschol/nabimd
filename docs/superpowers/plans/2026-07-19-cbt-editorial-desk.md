# CBT Editorial Desk Implementation Plan

> Execute with test-driven development. Keep Issue #9 content expansion out of this branch.

**Goal:** Replace the current four-surface lesson and bottom status bar with the approved fixed CBT top bar and equal Goal/Answer panels.

**Architecture:** Keep `useLearningSession` as the product-state boundary. Add one reducer event for a no-penalty same-skill replacement. Compose the screen from a top bar, Goal panel, Answer panel, and transient verdict notice. Keep CodeMirror and `react-markdown`; do not add dependencies.

---

## Task 1: Pin navigation and same-skill replacement behavior

- Add failing reducer/hook tests for return home and replacing the current problem without advancing progress or creating transfer debt.
- Add `tryAnother` to `useLearningSession` using existing validated problems and deterministic recent-content avoidance.
- Make the active wordmark and Exit invoke `changeLevel`.
- Run the focused session and App tests.

## Task 2: Pin the top-bar keyboard contract

- Replace StatusBar expectations with failing tests for a top-bar Check/Next action.
- Prove Cmd/Ctrl+Enter checks, Matched focuses Next, Space/Enter advances, and the next problem restores editor focus.
- Keep Check disabled only when the current product state cannot check.
- Run focused component and App tests.

## Task 3: Build the equal-panel CBT workspace

- Add failing component/App tests for exactly two workspace panels, Write/Preview tabs, no Live Preview region, and no bottom contentinfo.
- Implement `ExerciseTopBar`, `GoalPanel`, `AnswerPanel`, and reuse the editor/renderer internally.
- Add `Alt+1` and `Alt+2` without intercepting Tab.
- Keep all visible UI language beginner-facing.
- Run focused component and App tests.

## Task 4: Add Hint, Review, and verdict notice states

- Add failing tests for Hint expanding inside Goal, failure Review coaching, structural Matched Review, clean Matched Preview, and transient two-color outcome notices.
- Implement the state transitions without exact prose comparison.
- Preserve ARIA live announcements and reduced-motion behavior.
- Run focused tests with fake timers only where the notice lifetime requires them.

## Task 5: Implement fixed-viewport responsive styling

- Replace the existing instructional/lesson/workbench/status layout styles with one top bar and equal panel frame.
- Keep body/document scroll locked during practice and panel body scroll independent.
- Keep compact narrow-width behavior without horizontal document overflow.
- Add a long-document E2E assertion and the 1280×800 fixed-chrome assertion.

## Task 6: Full verification and visual QA

- Run `npm run check`.
- Run `npm run test:e2e`.
- Start the local app and inspect the selected CBT reference state in the in-app browser.
- Capture the same viewport/state as the approved reference, compare both, and write `design-qa.md`.
- Fix every P0/P1/P2 issue until `design-qa.md` says `final result: passed`.
- Add the real implementation conflict/resolution and verification evidence to `docs/build-log.md`.

## Task 7: Review and ship

- Commit by coherent implementation boundary.
- Push a Draft PR with product/engineering decisions and Build Week Codex evidence.
- Run local CodeRabbit, request GitHub Codex review, address actionable findings, and rerun verification.
- Merge only with green checks; fast-forward the user's main checkout; deploy and verify the public Vercel URL.
