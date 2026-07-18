# Nabi Markdown Heading Vertical MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship and deploy the first complete Nabi learning loop with three curated H1 heading problems, deterministic Fail/Matched/Perfect grading, repair-to-transfer progression, optional Hint/Review coaching, local persistence, and automated proof.

**Architecture:** Keep curriculum data, Markdown parsing, grading, selection, and progress as pure TypeScript modules. A small React session layer orchestrates those modules, while the Editorial Desk and Side Coach render state without owning grading rules. The learner path is fully static and local: no account, server, model endpoint, or network call is allowed at runtime.

**Tech Stack:** Node.js `>=22.13`, npm, TypeScript `7.0.2`, React `19.2.7`, Vite `8.1.5`, `mdast-util-from-markdown` `2.0.3`, `react-markdown` `10.1.0`, Vitest `4.1.10`, Testing Library, Playwright `1.61.1`, plain CSS, static Vercel deployment.

## Global Constraints

- The approved product contract is
  `docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md`.
- This plan stops at the first vertical slice. It does not create the remaining
  30 problems. The fixture contract must be proven with headings before bank
  expansion begins.
- The first visit opens a real heading problem, not a landing page or mode
  chooser.
- Typing and preview rendering never grade the answer. Only `Check` or
  `Cmd/Ctrl + Enter` grades.
- `Fail` blocks `Next`; `Matched` and `Perfect` both unlock it.
- A learner who failed must repair the current answer and then match one
  different-content problem from the same retry family.
- Hint appears only after a failed check and never inserts text.
- Review appears only on request after Matched and never blocks progression.
- React components never inspect Markdown syntax directly.
- Raw HTML remains disabled in preview and grading.
- Every problem has canonical, alternate, missing, malformed,
  matched-with-refinement, and perfect fixtures.
- All user-facing application copy is US English.
- No runtime AI, authentication, database, payments, analytics, or
  multilingual framework enters this slice.
- Use system fonts until Jiwon supplies a font name, exact license, and official
  source URL. Font integration must remain a later isolated commit.

## Runtime File Map

```text
.
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── src
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── components
│   │   ├── EditorialDesk.tsx
│   │   ├── MarkdownPreview.tsx
│   │   ├── SideCoach.tsx
│   │   └── StatusBar.tsx
│   ├── content
│   │   ├── headingProblems.test.ts
│   │   ├── headingProblems.ts
│   │   ├── problemFixtures.ts
│   │   ├── types.ts
│   │   └── validateProblemBank.ts
│   ├── engine
│   │   ├── evaluateEditorial.ts
│   │   ├── evaluateMatch.ts
│   │   ├── evaluateProblem.test.ts
│   │   ├── evaluateProblem.ts
│   │   ├── markdownAst.ts
│   │   └── types.ts
│   ├── progress
│   │   ├── progressStore.test.ts
│   │   ├── progressStore.ts
│   │   └── types.ts
│   ├── selection
│   │   ├── selectTransferProblem.test.ts
│   │   └── selectTransferProblem.ts
│   ├── session
│   │   ├── learningSession.test.ts
│   │   ├── learningSession.ts
│   │   └── useLearningSession.ts
│   ├── styles
│   │   ├── global.css
│   │   └── tokens.css
│   └── test
│       └── setup.ts
└── tests
    └── e2e
        └── heading-flow.spec.ts
```

---

## Task 1: Establish the reproducible React and test shell

**Files:**

- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles/global.css`

- [ ] **Step 1: Add the exact dependency and script contract**

Create `package.json` with no runtime service dependency:

```json
{
  "name": "nabimd",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22.13"
  },
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "build": "tsc -b && vite build",
    "check": "npm run typecheck && npm test && npm run build"
  },
  "dependencies": {
    "mdast-util-from-markdown": "2.0.3",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "react-markdown": "10.1.0"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/mdast": "4.0.4",
    "@types/node": "26.1.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.3",
    "jsdom": "29.1.1",
    "typescript": "7.0.2",
    "vite": "8.1.5",
    "vitest": "4.1.10"
  }
}
```

Run:

```bash
npm install
```

Expected: npm creates `package-lock.json`, installs without peer dependency
errors, and reports no install failure. Record advisories without claiming they
are fixed until reviewed.

- [ ] **Step 2: Add TypeScript, Vite, Vitest, and Playwright configuration**

Set `tsconfig.json` references to the app and Node configurations. In
`tsconfig.app.json`, use `strict: true`, `noUncheckedIndexedAccess: true`,
`jsx: "react-jsx"`, and `types: ["vitest/globals"]`. Configure Vitest with
`environment: "jsdom"` and `setupFiles: ["./src/test/setup.ts"]`.

Use this browser contract in `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
})
```

- [ ] **Step 3: Write the first failing application smoke test**

Create `src/App.test.tsx` before `src/App.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { App } from "./App"

describe("App", () => {
  it("opens directly on a real Markdown exercise", () => {
    render(<App />)

    expect(screen.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
    expect(screen.getByRole("textbox", { name: "Your Markdown" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Check" })).toBeVisible()
  })
})
```

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 4: Implement only enough shell to pass**

Create `src/App.tsx`:

```tsx
export function App() {
  return (
    <main>
      <h1>Nabi Markdown</h1>
      <label htmlFor="markdown-source">Your Markdown</label>
      <textarea id="markdown-source" />
      <button type="button">Check</button>
    </main>
  )
}
```

Create `src/main.tsx` with `createRoot`, import `global.css`, and render `App`
inside `StrictMode`. Start `src/styles/global.css` with `body { margin: 0; }` so
the import exists before visual styling. Add the standard Vite root element to
`index.html`.

Run:

```bash
npm test -- src/App.test.tsx
npm run typecheck
npm run build
```

Expected: one passing test, no TypeScript errors, and a successful Vite build.

- [ ] **Step 5: Commit the reproducible shell**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts playwright.config.ts src
git commit -m "Build Nabi application shell"
```

---

## Task 2: Define and validate the heading curriculum contract

**Files:**

- Create: `src/content/types.ts`
- Create: `src/content/headingProblems.ts`
- Create: `src/content/problemFixtures.ts`
- Create: `src/content/validateProblemBank.ts`
- Create: `src/content/headingProblems.test.ts`

- [ ] **Step 1: Write a failing bank-contract test**

```ts
import { describe, expect, it } from "vitest"
import { headingProblems } from "./headingProblems"
import { headingProblemFixtures } from "./problemFixtures"
import { validateProblemBank } from "./validateProblemBank"

describe("heading problem bank", () => {
  it("contains three distinct transfer-safe problems with complete fixtures", () => {
    expect(headingProblems).toHaveLength(3)
    expect(new Set(headingProblems.map((problem) => problem.id)).size).toBe(3)
    expect(new Set(headingProblems.map((problem) => problem.protectedContent[0])).size).toBe(3)
    expect(validateProblemBank(headingProblems, headingProblemFixtures)).toEqual([])
  })
})
```

Run `npm test -- src/content/headingProblems.test.ts`.

Expected: FAIL because the curriculum modules do not exist.

- [ ] **Step 2: Add discriminated curriculum types**

Use a constrained MVP contract rather than generic string callbacks:

```ts
export type MatchCheck =
  | { id: string; kind: "preserves-text"; text: string; priority: number; feedback: string }
  | { id: string; kind: "heading-spacing"; level: 1; text: string; priority: number; feedback: string }
  | { id: string; kind: "has-heading"; level: 1; text: string; priority: number; feedback: string }

export type EditorialCheck = {
  id: string
  kind: "single-h1"
  review: string
}

export type Problem = {
  id: string
  familyId: "headings"
  skillIds: readonly ["heading-h1"]
  difficulty: "warmup"
  title: string
  prompt: string
  target: string
  starterText: string
  protectedContent: readonly string[]
  matchChecks: readonly MatchCheck[]
  editorialChecks: readonly EditorialCheck[]
  hints: readonly [string, string, string]
  retryFamily: "heading-h1"
  reviewTags: readonly ["one-document-title"]
}

export type FixtureKind =
  | "canonical"
  | "alternate"
  | "missing"
  | "malformed"
  | "matched-with-refinement"
  | "perfect"

export type ProblemFixture = {
  problemId: string
  kind: FixtureKind
  source: string
  expectedStatus: "fail" | "matched" | "perfect"
  expectedFeedbackId?: string
  expectedReviewIds?: readonly string[]
}
```

- [ ] **Step 3: Add three immutable H1 problems with different protected text**

Use these IDs and content so transfer selection can be asserted:

| Problem ID | Protected text | Target |
|---|---|---|
| `heading-project-notes` | `Project notes` | `# Project notes` |
| `heading-weekend-guide` | `Weekend guide` | `# Weekend guide` |
| `heading-reading-list` | `Summer reading list` | `# Summer reading list` |

Each problem uses the same three hint levels:

1. Concept: `Turn the line into the document's main heading.`
2. Recipe: `Type one hash symbol, one space, then the title.`
3. Different-text example: ``Example: `# Team update` ``

The first feedback priorities are:

1. malformed heading spacing;
2. protected text missing;
3. H1 structure missing.

Freeze the exported array with `as const satisfies readonly Problem[]`.
Export a guarded `getHeadingProblem(id: string): Problem` lookup that throws an
explicit `Unknown heading problem: ${id}` error instead of leaking
`Problem | undefined` into grading and session code.

- [ ] **Step 4: Add all six fixture classes for every problem**

For `heading-project-notes`, use:

```ts
[
  { kind: "canonical", source: "# Project notes", expectedStatus: "perfect" },
  { kind: "alternate", source: "# Project notes #", expectedStatus: "perfect" },
  { kind: "missing", source: "# Weekly notes", expectedStatus: "fail", expectedFeedbackId: "preserve-project-notes" },
  { kind: "malformed", source: "#Project notes", expectedStatus: "fail", expectedFeedbackId: "space-after-hash" },
  { kind: "matched-with-refinement", source: "# Project notes\n\n# Details", expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
  { kind: "perfect", source: "# Project notes", expectedStatus: "perfect", expectedReviewIds: [] },
]
```

Create equivalent fixtures for the other two protected texts. Every fixture ID
must resolve to an actual problem; every problem must have all six kinds.

- [ ] **Step 5: Implement bank validation and make the test pass**

`validateProblemBank` returns string errors for duplicate IDs, duplicate first
protected text, missing fixture kinds, unknown fixture problem IDs, fewer than
three hints, and a retry family with fewer than two distinct problems.

Run:

```bash
npm test -- src/content/headingProblems.test.ts
npm run typecheck
```

Expected: the contract test passes and TypeScript prevents an unsupported
check kind or incomplete hint tuple.

- [ ] **Step 6: Commit the curriculum contract**

```bash
git add src/content
git commit -m "Define heading problem contract"
```

---

## Task 3: Build deterministic Markdown match grading

**Files:**

- Create: `src/engine/types.ts`
- Create: `src/engine/markdownAst.ts`
- Create: `src/engine/evaluateMatch.ts`
- Create: `src/engine/evaluateProblem.ts`
- Create: `src/engine/evaluateProblem.test.ts`

- [ ] **Step 1: Turn bank fixtures into a failing grading test**

```ts
import { describe, expect, it } from "vitest"
import { getHeadingProblem } from "../content/headingProblems"
import { headingProblemFixtures } from "../content/problemFixtures"
import { evaluateProblem } from "./evaluateProblem"

describe("evaluateProblem heading fixtures", () => {
  it.each(headingProblemFixtures)("$problemId $kind", (fixture) => {
    const problem = getHeadingProblem(fixture.problemId)
    const result = evaluateProblem(problem, fixture.source)

    expect(result.status).toBe(fixture.expectedStatus)
    if (result.status === "fail") {
      expect(result.feedbackId).toBe(fixture.expectedFeedbackId)
    }
  })
})
```

Run `npm test -- src/engine/evaluateProblem.test.ts`.

Expected: FAIL because evaluation does not exist.

- [ ] **Step 2: Define result types that make progression explicit**

```ts
export type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
}

export type PassedEvaluation =
  | { status: "matched"; reviewItems: readonly ReviewItem[] }
  | { status: "perfect"; reviewItems: readonly [] }

export type Evaluation = MatchFailure | PassedEvaluation

export type ReviewItem = {
  id: string
  message: string
}
```

Do not add a boolean named `isPerfect`; the union is the source of truth.

- [ ] **Step 3: Parse Markdown once and expose narrow AST helpers**

In `markdownAst.ts`, call `fromMarkdown(source)` and export pure helpers:

```ts
import type { Root, RootContent } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"

export function parseMarkdown(source: string): Root {
  return fromMarkdown(source)
}

export function nodeText(node: Root | RootContent): string {
  if ("value" in node && typeof node.value === "string") return node.value
  if ("children" in node) return node.children.map((child) => nodeText(child)).join("")
  return ""
}
```

Add `headingsAtLevel(root, 1)` and `documentText(root)` helpers. Do not render or
execute raw HTML.

- [ ] **Step 4: Implement priority-ordered match checks**

`evaluateMatch(problem, source, root)` must:

1. detect `#Title` for the expected title and return the spacing feedback;
2. ensure every protected string appears in normalized document text;
3. find an H1 whose normalized text equals the expected title;
4. return the first failure after sorting by numeric priority;
5. return `null` when every required check passes.

Use whitespace normalization only:

```ts
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}
```

Do not lowercase, rewrite punctuation, or compare to one complete canonical
source string.

- [ ] **Step 5: Prove malformed, missing, and alternate syntax behavior**

Run:

```bash
npm test -- src/engine/evaluateProblem.test.ts
```

Expected at this intermediate point: match-related failure assertions pass;
the Matched-versus-Perfect refinement fixture remains red because editorial
grading is not implemented.

- [ ] **Step 6: Commit the match engine**

```bash
git add src/engine
git commit -m "Grade heading matches deterministically"
```

---

## Task 4: Separate Matched from Perfect editorial review

**Files:**

- Create: `src/engine/evaluateEditorial.ts`
- Modify: `src/engine/evaluateProblem.ts`
- Modify: `src/engine/evaluateProblem.test.ts`

- [ ] **Step 1: Add failing assertions for optional refinement**

Extend the fixture test:

```ts
if (result.status !== "fail") {
  expect(result.reviewItems.map((item) => item.id)).toEqual(
    fixture.expectedReviewIds ?? [],
  )
}
```

Add a direct invariant test:

```ts
it("never turns an editorial refinement into a failure", () => {
  const result = evaluateProblem(
    getHeadingProblem("heading-project-notes"),
    "# Project notes\n\n# Details",
  )

  expect(result.status).toBe("matched")
})
```

Run the test and expect failure until editorial evaluation exists.

- [ ] **Step 2: Implement the `single-h1` editorial predicate**

`evaluateEditorial` receives the parsed tree and returns review items. For the
heading slice, return:

```ts
{
  id: "one-document-title",
  message: "Keep one H1 as the document title; use lower heading levels for sections.",
}
```

when more than one H1 is present. Cap the general result with `.slice(0, 3)` so
later editorial checks inherit the approved review limit.

- [ ] **Step 3: Compose the two-stage evaluator**

`evaluateProblem` parses once, calls match grading first, and only then calls
editorial grading:

```ts
export function evaluateProblem(problem: Problem, source: string): Evaluation {
  const tree = parseMarkdown(source)
  const matchFailure = evaluateMatch(problem, source, tree)
  if (matchFailure) return matchFailure

  const reviewItems = evaluateEditorial(problem, tree)
  return reviewItems.length === 0
    ? { status: "perfect", reviewItems: [] }
    : { status: "matched", reviewItems }
}
```

- [ ] **Step 4: Run all curriculum and engine fixtures**

```bash
npm test -- src/content/headingProblems.test.ts src/engine/evaluateProblem.test.ts
npm run typecheck
```

Expected: all 18 heading fixtures pass; the extra-H1 source is Matched, not
Fail; both canonical and closing-hash alternates are Perfect.

- [ ] **Step 5: Commit the outcome model**

```bash
git add src/engine
git commit -m "Separate matched and perfect outcomes"
```

---

## Task 5: Implement transfer selection and recoverable local progress

**Files:**

- Create: `src/selection/selectTransferProblem.ts`
- Create: `src/selection/selectTransferProblem.test.ts`
- Create: `src/progress/types.ts`
- Create: `src/progress/progressStore.ts`
- Create: `src/progress/progressStore.test.ts`

- [ ] **Step 1: Write failing transfer-selection tests**

```ts
it("chooses different content from the same retry family", () => {
  const selected = selectTransferProblem({
    problems: headingProblems,
    currentProblemId: "heading-project-notes",
    retryFamily: "heading-h1",
    recentProblemIds: ["heading-project-notes"],
  })

  expect(selected.id).not.toBe("heading-project-notes")
  expect(selected.retryFamily).toBe("heading-h1")
  expect(selected.protectedContent[0]).not.toBe("Project notes")
})
```

Add a second test proving deterministic fallback when every eligible problem is
recent: choose the first bank-order candidate that is not the current ID.

Run `npm test -- src/selection/selectTransferProblem.test.ts` and expect FAIL.

- [ ] **Step 2: Implement deterministic selection**

Filter in this order:

1. same `retryFamily`;
2. not the current ID;
3. different first protected text;
4. prefer IDs absent from `recentProblemIds`;
5. use original bank order as the stable tie-breaker.

Throw a descriptive error only if the validated bank has no safe transfer
candidate. Do not use randomness in the vertical slice.

- [ ] **Step 3: Write failing storage tests**

Use a versioned document:

```ts
export type ProgressV1 = {
  version: 1
  currentProblemId: string
  draftByProblemId: Record<string, string>
  completedProblemIds: string[]
  recentProblemIds: string[]
  pendingTransferFamily: "heading-h1" | null
  currentIsTransfer: boolean
}
```

Test fresh storage, round-trip saving, corrupt JSON, an unknown version, and an
unknown problem ID. Corruption must recover to the supplied default rather than
throwing.

- [ ] **Step 4: Implement storage behind an injected `Storage` boundary**

Use the key `nabimd.progress.v1`. Export:

```ts
loadProgress(storage: Storage, validProblemIds: ReadonlySet<string>): ProgressV1
saveProgress(storage: Storage, progress: ProgressV1): void
clearProgress(storage: Storage): void
```

Validate arrays, booleans, string records, version, and IDs before accepting a
record. Clone the default object on recovery so tests cannot share mutable
state.

- [ ] **Step 5: Run selection and persistence tests**

```bash
npm test -- src/selection src/progress
npm run typecheck
```

Expected: transfer never repeats the current ID or protected text; bad storage
never prevents the first problem from loading.

- [ ] **Step 6: Commit selection and persistence**

```bash
git add src/selection src/progress
git commit -m "Persist heading transfer progress"
```

---

## Task 6: Encode the learning session as a testable state machine

**Files:**

- Create: `src/session/learningSession.ts`
- Create: `src/session/learningSession.test.ts`
- Create: `src/session/useLearningSession.ts`

- [ ] **Step 1: Write failing transition tests**

Cover these complete sequences:

```text
first-attempt Perfect → Next enabled → complete
first-attempt Matched → Next enabled → complete, Review optional
Fail → Next disabled → repair to pass → Next → different transfer problem
transfer Fail → repair to pass → Next → complete, no second transfer loop
typing after a result → result returns to editing, but earlier-failure memory remains
```

Assert the exact current problem ID, `hadFailure`, `currentIsTransfer`, result,
and whether Next is enabled after each transition.

- [ ] **Step 2: Define explicit session state and events**

```ts
export type LearningSession = {
  phase: "editing" | "evaluated" | "complete"
  currentProblemId: string
  draft: string
  evaluation: Evaluation | null
  hadFailure: boolean
  currentIsTransfer: boolean
  hintLevel: 0 | 1 | 2 | 3
  coach: "closed" | "hint" | "review"
  progress: ProgressV1
}

export type SessionEvent =
  | { type: "edited"; value: string }
  | { type: "checked"; evaluation: Evaluation }
  | { type: "hint-requested" }
  | { type: "review-requested" }
  | { type: "coach-closed" }
  | { type: "next"; transferProblemId?: string }
```

Keep problem evaluation and transfer selection outside the reducer. Events
carry their already-computed result or selected ID, which keeps the reducer
pure.

- [ ] **Step 3: Implement progression invariants**

- `edited` clears the visible evaluation and closes Review, but never clears
  `hadFailure`.
- failed `checked` sets `hadFailure: true`, keeps `phase: "evaluated"`, and
  leaves Next disabled.
- passed `checked` enables Next regardless of Matched or Perfect.
- `hint-requested` does nothing unless the visible result is Fail; otherwise it
  increments to at most level 3.
- `review-requested` does nothing unless the visible result is Matched.
- `next` after a repaired failure requires a supplied transfer ID, writes the
  old ID to recent progress, opens the transfer with its saved or starter
  draft, resets `hadFailure: false`, and sets `currentIsTransfer: true`.
- `next` after a passed transfer completes the slice even if that transfer had
  failed before repair; it never creates an endless transfer chain.
- first-attempt pass completes the slice directly.

- [ ] **Step 4: Implement `useLearningSession` as the integration boundary**

The hook must:

- load validated progress once;
- expose `edit`, `check`, `requestHint`, `requestReview`, `closeCoach`, and
  `next` actions;
- call `evaluateProblem` only in `check`;
- call `selectTransferProblem` only when the state machine requires transfer;
- save progress after state transitions, including every draft edit;
- expose `canCheck`, `canNext`, and the current `Problem` as derived values.

Do not add timers, effects that grade, or network requests.

- [ ] **Step 5: Run transition and storage integration tests**

```bash
npm test -- src/session src/progress src/selection
npm run typecheck
```

Expected: every approved transition passes and a repaired failure always
routes through a different heading problem exactly once.

- [ ] **Step 6: Commit the learning loop**

```bash
git add src/session
git commit -m "Model the heading learning session"
```

---

## Task 7: Build the Editorial Desk and Side Coach behavior

**Files:**

- Create: `src/components/MarkdownPreview.tsx`
- Create: `src/components/EditorialDesk.tsx`
- Create: `src/components/SideCoach.tsx`
- Create: `src/components/StatusBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Replace the smoke test with failing behavior tests**

Add component tests proving:

1. the prompt, rendered target, editor, and Check are present immediately;
2. typing does not show Fail, Matched, or Perfect before Check;
3. `Cmd+Enter` and `Ctrl+Enter` both trigger the same explicit check action;
4. Fail shows one correction and keeps Next absent;
5. Hint appears only after Fail and advances through the three levels;
6. Matched shows Next and a closed Review control;
7. Perfect shows Next and no required review step;
8. opening or closing Side Coach never changes the textarea value;
9. a repaired failure opens a different prompt after Next.

Run `npm test -- src/App.test.tsx` and expect the new tests to fail against the
shell.

- [ ] **Step 2: Render safe Markdown previews**

Use `react-markdown` without `rehype-raw`:

```tsx
import Markdown from "react-markdown"

export function MarkdownPreview({ source, label }: { source: string; label: string }) {
  return (
    <section aria-label={label} className="markdown-preview">
      <Markdown>{source}</Markdown>
    </section>
  )
}
```

Use this component for the target and an optional learner preview. The preview
may update while typing, but it must not display correctness state.

- [ ] **Step 3: Implement the status and action contract**

`StatusBar` must render one polite live region and one primary action:

| State | Live message | Primary action |
|---|---|---|
| Editing | `Write the heading, then check your work.` | `Check` |
| Fail | exact one feedback message | `Check again` |
| Matched | `Matched. Your Markdown uses the requested skill.` | `Next` |
| Perfect | `Perfect. Every check for this exercise passed.` | `Next` |
| Complete | `Heading practice complete.` | none |

Keep Hint and Review secondary. Do not render a disabled Next button during
Fail; render Check again instead.

- [ ] **Step 4: Implement the request-only Side Coach**

The panel has `aria-label="Coach"`, a close button, and no form submission.

- Hint is offered only for Fail. Each request reveals the next string from the
  current problem's hint tuple. It never calls the editor's `onChange`.
- Review is offered only for Matched. One request shows all review items at
  once, already capped by the engine.
- Perfect has no refinement list; it may display the status without opening the
  coach.
- At mobile widths the same DOM becomes a bottom sheet through CSS; do not
  create separate mobile logic.

- [ ] **Step 5: Compose the Editorial Desk**

The DOM order must be:

```text
header → instruction → target → editor label → textarea → preview → status/actions → coach
```

Use a native textarea with `spellCheck={false}` and no syntax coloring. Give
the exercise instruction an ID and reference it from the textarea with
`aria-describedby`. Handle the keyboard shortcut on the textarea only when the
platform modifier and Enter are pressed; call `preventDefault()` and the same
`check()` action as the visible button.

On completion, show:

```text
Heading practice complete.
You matched the requested syntax. The full learning path is being built next.
```

This is a truthful vertical-slice ending, not a fake home screen.

- [ ] **Step 6: Make all component tests pass**

```bash
npm test -- src/App.test.tsx
npm run typecheck
```

Expected: typing alone never grades; Fail blocks progression; Matched and
Perfect both progress; transfer content differs; Side Coach never edits.

- [ ] **Step 7: Commit the complete interaction**

```bash
git add src/App.tsx src/App.test.tsx src/components
git commit -m "Build the Nabi Editorial Desk"
```

---

## Task 8: Apply the monochrome visual system and browser proof

**Files:**

- Create: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Create: `tests/e2e/heading-flow.spec.ts`
- Modify: `src/components/EditorialDesk.tsx`
- Modify: `src/components/SideCoach.tsx`

- [ ] **Step 1: Add the approved CSS tokens**

```css
:root {
  color-scheme: light;
  --ink: #111111;
  --paper: #ffffff;
  --canvas: #f5f5f2;
  --muted: #5f5f5a;
  --line: #d7d7d2;
  --focus: #111111;
  --sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --space-1: 0.375rem;
  --space-2: 0.75rem;
  --space-3: 1.25rem;
  --space-4: 2rem;
  --radius: 0.75rem;
  --motion: 180ms;
}
```

Use warm canvas, white writing surface, black primary button, thin rules,
system sans, and system monospace. Do not add gradients, shadows that imitate
glass, colored syntax, cards, mascot art, or celebratory animation.

- [ ] **Step 2: Implement responsive Editorial Desk layout**

- Center the page with a readable maximum width.
- Keep instruction and target in the upper stage and the editor full-width
  below.
- Give the textarea enough height for a short document without page-jumping.
- At widths above `860px`, reserve space for the right-side coach when open.
- At `860px` and below, stack upper-stage content and position the coach as an
  accessible bottom sheet without horizontal overflow.
- Keep visible focus rings at least 2 px and interactive targets at least
  44 px high where practical.
- Under `prefers-reduced-motion: reduce`, remove nonessential transitions.

- [ ] **Step 3: Write the first failing browser path**

```ts
import { expect, test } from "@playwright/test"

test("fails, repairs, transfers, and restores a heading session", async ({ page }) => {
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("#Project notes")
  await page.getByRole("button", { name: "Check" }).click()
  await expect(page.getByText("Add one space after the hash symbol.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)

  await page.getByRole("button", { name: "Hint" }).click()
  await expect(page.getByRole("region", { name: "Coach" })).toBeVisible()

  await editor.fill("# Project notes")
  await page.getByRole("button", { name: "Check again" }).click()
  await expect(page.getByText(/^Perfect\./)).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()

  await expect(editor).not.toHaveValue("# Project notes")
  await editor.fill("# Weekend guide")
  const transferDraft = await editor.inputValue()
  await page.reload()
  await expect(editor).toHaveValue(transferDraft)
})
```

Select the transfer title from the visible prompt rather than assuming
`Weekend guide` if the stable bank order is changed during implementation.

- [ ] **Step 4: Add first-attempt and Matched browser paths**

- First-attempt Perfect completes without transfer.
- Extra H1 yields Matched, Review stays closed until clicked, and Next remains
  available without applying the refinement.
- `Control+Enter` completes Check on Chromium; component tests retain the Mac
  modifier case.
- At a `390 x 844` viewport, the open Coach is visible and the page has no
  horizontal scrollbar.

- [ ] **Step 5: Install Chromium and run the full local gate**

```bash
npx playwright install chromium
npm run check
npm run test:e2e
```

Expected: all unit/component tests pass, TypeScript and Vite build pass, and
all Chromium paths pass in a clean browser context.

- [ ] **Step 6: Inspect at desktop and mobile sizes**

Open the running app at `1440 x 1000` and `390 x 844`. Verify visible focus,
Side Coach placement, textarea readability, 200% zoom reflow, status live-region
copy, and no horizontal scroll. Record any real failure in `docs/build-log.md`
before fixing it.

- [ ] **Step 7: Commit visual and browser proof**

```bash
git add src/styles src/components tests playwright.config.ts
git commit -m "Polish and verify the heading MVP"
```

---

## Task 9: Publish the vertical slice and preserve Build Week evidence

**Files:**

- Modify: `README.md`
- Modify: `docs/build-log.md`
- Modify: `docs/submission-checklist.md`
- Create: `vercel.json` only if clean-path static routing requires it

- [ ] **Step 1: Run the pre-publication verification gate**

```bash
npm ci
npm run check
npm run test:e2e
git status --short
```

Expected: clean install succeeds, all verification succeeds, and status shows
only the deliberate documentation edits made in this task.

- [ ] **Step 2: Update README with verified facts only**

Add:

- one-sentence value proposition;
- a current-scope section that says the deployed slice teaches H1 headings;
- `npm ci`, `npm run dev`, `npm test`, `npm run test:e2e`, and `npm run build`;
- deterministic grading and no-runtime-AI architecture;
- the concrete Codex/Jiwon conflict: live correction was rejected in favor of
  explicit Check, Hint, and transfer;
- a link to `docs/build-log.md`;
- no claim that the 33-problem bank or GPT-5.6 curriculum pass is complete.

- [ ] **Step 3: Add the factual build-log milestone**

Record:

- what the first failing fixture exposed;
- what Codex proposed or implemented;
- what Jiwon decided when a product judgment was required;
- the exact command that verified the resolution;
- actual test counts and deployment URL only after they exist.

Do not reconstruct a conflict that did not occur. Do not call ideation a
GPT-5.6 curriculum artifact.

- [ ] **Step 4: Deploy the static build**

```bash
npx vercel@56.3.1 --prod
```

Expected: a production HTTPS URL that opens without login. Since the app is a
single static entry path, add `vercel.json` only if the deployed navigation or
refresh check proves it necessary.

- [ ] **Step 5: Verify the production URL in a clean browser context**

Run the same first-attempt and fail-repair-transfer journeys against the
production URL. Verify there is no runtime network request to OpenAI, no API
key in the built assets, and no authentication gate.

- [ ] **Step 6: Commit and push the verified milestone**

```bash
git add README.md docs package.json package-lock.json index.html tsconfig*.json vite.config.ts vitest.config.ts playwright.config.ts src tests
git add vercel.json # run this second command only when the file was proven necessary
git commit -m "Ship Nabi heading vertical MVP"
git push origin agent/bootstrap-nabi-markdown
```

If `vercel.json` was not needed, omit it from `git add`. Keep the pull request
in Draft until the complete Build Week submission scope and assets are ready.

- [ ] **Step 7: Stop and review before bank expansion**

Compare the deployed slice with every Global Constraint in this plan. Then
write a separate implementation plan for the other seven syntax families,
mixed problems, and Document Makeovers. Do not bulk-create 30 problems until
the heading fixture schema, transfer behavior, and UI have survived this gate.

## Final Verification Checklist

- [ ] `rg -n 'TO''DO|TB''D|FIX''ME|lorem' src tests README.md docs/build-log.md
  docs/submission-checklist.md` has no unfinished product or evidence markers.
- [ ] `npm ci` succeeds from the committed lockfile.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm test` passes all bank, engine, selection, progress, session, and
  component tests.
- [ ] `npm run build` succeeds.
- [ ] `npm run test:e2e` passes first-attempt, Matched, and
  fail-repair-transfer paths.
- [ ] Typing alone never grades.
- [ ] Fail never exposes Next.
- [ ] Matched and Perfect both expose Next.
- [ ] A repaired failure requires exactly one different-content transfer.
- [ ] Hint never inserts or changes editor text.
- [ ] Review is optional and closed by default.
- [ ] Corrupt progress recovers to the first problem.
- [ ] Raw HTML does not execute in preview.
- [ ] The mobile viewport has no horizontal overflow.
- [ ] README and build log claim only behavior verified in tests or the live
  build.
- [ ] The production URL is public, free to test, and requires no account.
