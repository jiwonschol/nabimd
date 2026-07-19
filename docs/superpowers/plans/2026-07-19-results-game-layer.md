# Results Game Layer Implementation Plan

**Goal:** Add a session-scoped elapsed clock, a legible turn-progress display, and a truthful completion summary without changing grading, level composition, or remediation rules.

**Architecture:** Progress schema v5 stores only durable run facts: scheduled problem count, first-failure problem IDs, and start/completion timestamps. The reducer owns those facts; React derives the live display time from the persisted timestamp. The top bar renders the current dynamic run queue (six scheduled exercises, with a visible extra step when remediation extends it). A dedicated `RunSummary` consumes a local asynchronous `rankingClient` seam that #41 can later implement without changing the results UI.

## Product decisions

- The clock uses `MM:SS` below one hour and `H:MM:SS` afterward. It starts when a level is chosen, survives reload from `sessionStorage`, and freezes at completion.
- The base progress rail has six steps for Levels 1–4 and the truthful available count for Level 5. If remediation extends a run, its extra step is visible rather than hidden.
- Score counts scheduled exercises completed without a failed Check. A remediation exercise never changes the denominator and cannot penalize the score a second time.
- The summary does not invent a percentile. The local ranking client returns `Collecting data` and clearly labels the result as the learner's time only.
- Syntax review groups first-failure problems by retry family and shows the existing teaching concept, instruction, and syntax tokens. It does not inspect prose or alter verdicts.
- Progress v4 is not migrated. D7 makes progress browser-session scoped, so an incompatible record safely starts fresh.

## Task 1 — Persist run timing and score facts

**Files:** `src/progress/types.ts`, `src/progress/progressStore.ts`, `src/progress/progressStore.test.ts`, `src/session/learningSession.ts`, `src/session/learningSession.test.ts`, `src/session/useLearningSession.ts`, `src/session/useLearningSession.test.tsx`

1. Add failing tests for v5 validation, timestamp round trips, fresh-run reset, mid-run reload, completion freeze, and one-score-penalty-per-scheduled-exercise.
2. Add `scheduledProblemCount`, `failedScheduledProblemIds`, `runStartedAtMs`, and `runCompletedAtMs` to progress.
3. Timestamp `started` and `completed` events through an injectable clock in the hook.
4. Record only first failures on non-transfer exercises and preserve them through repair and reload.

## Task 2 — Add clock and progress rail

**Files:** `src/components/ElapsedTime.tsx`, `src/components/ElapsedTime.test.tsx`, `src/components/ExerciseTopBar.tsx`, `src/components/ExerciseTopBar.test.tsx`, `src/components/EditorialDesk.tsx`, `src/styles/global.css`

1. Add failing formatting, ticking, freezing, and progress-accessibility tests.
2. Render a labeled timer and an ordered visual rail in the top-bar center.
3. Keep the existing level identity and sound preference while preventing overlap at 1280×800 and preserving narrow-screen horizontal access.

## Task 3 — Add ranking seam and results summary

**Files:** `src/ranking/rankingClient.ts`, `src/ranking/rankingClient.test.ts`, `src/components/RunSummary.tsx`, `src/components/RunSummary.test.tsx`, `src/components/EditorialDesk.tsx`, `src/styles/global.css`

1. Define an async identity-free `rankingClient` request/result contract and a local collecting-data stub.
2. Add a focused results surface with score, frozen time, standing placeholder, encouragement, optional syntax review, and all three existing actions.
3. Group syntax review by family and use only authored teaching metadata.

## Task 4 — Update contracts and browser proof

**Files:** `docs/nabimd-decisions-2026-07-18.md`, `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md`, `docs/superpowers/specs/2026-07-19-cbt-editorial-desk-design.md`, `docs/design/heading-mvp-visual-contract.md`, `tests/e2e/heading-flow.spec.ts`

1. Replace the stale no-ranking non-goal with the approved anonymous placeholder bracket and document the timer/results contract.
2. Prove keyboard-only greeting-to-summary completion, timestamp persistence over reload, a truthful remediation extension, and a fixed 1280×800 frame.
3. Run focused tests, `npm run check`, and the full Playwright suite; inspect the actual summary and active turn at 1280×800.

## Task 5 — Review and delivery

1. Run independent Codex review, then open a non-draft PR closing #38.
2. If CodeRabbit shows active review heartbeat, wait and address valid findings; if it stalls without heartbeat, use the approved Codex fallback.
3. Re-run gates after review fixes, squash-merge, fast-forward local main without touching user-owned changes, deploy the existing Vercel project, and verify production.
