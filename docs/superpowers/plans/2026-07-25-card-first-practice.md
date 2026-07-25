# Card-first Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split Goal/Write document workspace with one responsive syntax card that teaches only the required Markdown marks, gives exact inline help, and reveals completed documents in Summary.

**Architecture:** Keep the existing problem bank, structural grader, learning session, and `guidedSyntax` checkpoint derivation. Extend the guided domain layer with direct instruction, local rendered context, and complete Hint alternatives; make `useCenterCard` own Hint/retry/focus state; render one new Practice card directly from `EditorialDesk`. Reuse persisted `draftByProblemId` to show finished documents in a secondary Summary viewer.

**Tech Stack:** React 19, TypeScript strict mode, Vitest + Testing Library, Playwright, Vite, `react-markdown`, existing Nabi design tokens and fonts.

## Global Constraints

- Practice has one centered card; split Goal/Write pages and Write/Preview/Hint tabs are absent.
- The instruction names the Markdown operation directly and only its syntax term uses semantic `<strong>`.
- Locked prose is never editable; only Markdown marks and grammar-required spaces accept input.
- Manual Hint clears partial input, stays inline while typing, and returns focus to the first syntax box.
- Wrong or empty Enter opens the exact Hint; a wrong non-empty attempt records one miss.
- Every accepted standard alternative is shown separately and accepted equally.
- The complete document stays hidden during Practice and becomes review-only in Summary.
- Desktop and mobile use the same state machine and content order.
- Do not rewrite the problem bank, structural grader, landing page, or two-verdict policy.

---

### Task 1: Guided checkpoint teaching model

**Files:**
- Modify: `src/guided/guidedSyntax.ts`
- Modify: `src/guided/guidedSyntax.test.ts`
- Modify: `src/components/CenterCard.tsx`
- Modify: `src/components/CenterCard.test.ts`

**Interfaces:**
- Produces: `checkpointInstruction(checkpoint): { prefix: string; term: string; suffix: string }`
- Produces: `projectCheckpointContext(target, checkpoint): { before: string | null; current: string; after: string | null }`
- Produces: `checkpointHintRows(checkpoint): readonly { input: string; source: string }[]`
- Keeps: `acceptedGuidedSyntaxInputs`, `deriveSyntaxCheckpoints`, and `buildGuidedDraft`.

- [ ] **Step 1: Write failing domain tests**

Add literal expectations proving:

```ts
expect(checkpointInstruction(blockquote)).toEqual({
  prefix: "Type the Markdown mark for a ",
  term: "block quote",
  suffix: ".",
})
expect(checkpointHintRows(italic)).toEqual([
  { input: "**", source: "*Quiet music*" },
  { input: "__", source: "_Quiet music_" },
])
expect(projectCheckpointContext(document, activeCheckpoint)).toEqual({
  before: "## Before",
  current: "> Keep rollback steps visible.",
  after: "- Verify the deploy",
})
```

Include headings, lists with required spaces, bold, italic, inline code, fenced code, links, images, thematic breaks, and Setext headings.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/guided/guidedSyntax.test.ts src/components/CenterCard.test.ts
```

Expected: failure because the three teaching-model functions do not exist.

- [ ] **Step 3: Implement the teaching model**

Add the three pure functions. Build Hint rows from
`acceptedGuidedSyntaxInputs(checkpoint)` and the checkpoint’s locked/input
segments so the source example is the real line the learner is completing.
Project at most one meaningful neighboring row before and after the active
row. Keep authentic Markdown source for `RenderedDocumentBody`.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/guided/guidedSyntax.test.ts src/components/CenterCard.test.ts
```

Expected: all selected tests pass with no warning.

- [ ] **Step 5: Commit**

```bash
git add src/guided/guidedSyntax.ts src/guided/guidedSyntax.test.ts src/components/CenterCard.tsx src/components/CenterCard.test.ts
git commit -m "feat: derive card teaching content"
```

### Task 2: Exact Hint and retry state machine

**Files:**
- Modify: `src/guided/useCenterCard.ts`
- Create: `src/guided/useCenterCard.test.tsx`
- Modify: `src/components/CenterCard.tsx`
- Create: `src/components/CenterCard.test.tsx`

**Interfaces:**
- `useCenterCard` additionally returns:

```ts
{
  hintOpen: boolean
  hintRows: readonly { input: string; source: string }[]
  openHint(): void
  closeHint(): void
  toggleHint(): void
  focusRequest: number
}
```

- `CenterCard` receives the direct instruction, local context, Hint state, and mark history callbacks from this hook.

- [ ] **Step 1: Write failing hook and component tests**

Test observable behavior:

```ts
// Manual help
typePartialMarks()
openHint()
expect(boxes()).toBeEmpty()
expect(firstBox()).toHaveFocus()
expect(exactHintRows()).toBeVisible()

// Wrong non-empty Enter
submit("@")
expect(onMiss).toHaveBeenCalledTimes(1)
expect(exactHintRows()).toBeVisible()
expect(firstBox()).toHaveFocus()

// Empty Enter
submit("")
expect(onMiss).not.toHaveBeenCalled()
expect(exactHintRows()).toBeVisible()

// Equivalent syntax
submit("_", "_")
expect(onComplete).toHaveBeenCalledWith("_Quiet music_")
```

Also prove Hint remains open while retry typing, `?` toggles it, Enter during
IME composition does not submit, Backspace moves to the preceding slot, and
locked prose has no textbox semantics.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/guided/useCenterCard.test.tsx src/components/CenterCard.test.tsx
```

Expected: failures for missing Hint state and inline Hint UI.

- [ ] **Step 3: Implement state and card UI**

Move Hint ownership into `useCenterCard`. Manual Hint and wrong/empty submit
clear mark values, increment `focusRequest`, and open the same inline Hint.
Render the direct instruction, `RenderedDocumentBody` context, locked prose,
mark boxes, history controls, and separate complete Hint rows. The visible
Enter control invokes the same submission function as keyboard Enter.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/guided/useCenterCard.test.tsx src/components/CenterCard.test.tsx
```

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/guided/useCenterCard.ts src/guided/useCenterCard.test.tsx src/components/CenterCard.tsx src/components/CenterCard.test.tsx
git commit -m "feat: make card hints exact and inline"
```

### Task 3: Replace the split Practice workspace

**Files:**
- Create: `src/components/CardFirstPractice.tsx`
- Create: `src/components/CardFirstPractice.test.tsx`
- Modify: `src/components/EditorialDesk.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- `CardFirstPractice` consumes the active problem, draft, completion state,
  `onGrow`, `onComplete`, and `onMiss`.
- `EditorialDesk` retains `ExerciseTopBar`, verdict timing, run progression,
  sounds, and Summary; it replaces `GoalPanel` + `AnswerPanel` with
  `CardFirstPractice`.

- [ ] **Step 1: Write failing composition tests**

Prove:

```ts
expect(screen.getByRole("region", { name: "Markdown syntax practice" }))
  .toBeVisible()
expect(screen.queryByRole("region", { name: "Goal" }))
  .not.toBeInTheDocument()
expect(screen.queryByRole("tablist", { name: "Answer view" }))
  .not.toBeInTheDocument()
expect(screen.getAllByRole("textbox")).toHaveLength(expectedMarkGroups)
```

Complete one Level 1 problem using only the mark boxes and prove the regular
Matched/auto-advance session flow still runs.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/components/CardFirstPractice.test.tsx src/App.test.tsx
```

Expected: failure because Practice still renders the split workspace.

- [ ] **Step 3: Implement the card-first composition**

Render the single card below the unchanged top bar. Add scoped
`.card-practice*` selectors; do not rewrite landing or Summary selectors.
Use a bounded desktop width, Nabi’s existing warm paper color, existing serif
and sans fonts, and the existing focus ring. At `max-width: 760px`, keep the
same content order and stack Hint alternatives without horizontal overflow.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/components/CardFirstPractice.test.tsx src/App.test.tsx
npm run typecheck
```

Expected: component tests and strict typecheck pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/CardFirstPractice.tsx src/components/CardFirstPractice.test.tsx src/components/EditorialDesk.tsx src/App.tsx src/App.test.tsx src/styles/global.css
git commit -m "feat: replace practice workspace with syntax card"
```

### Task 4: Completed pages in Summary

**Files:**
- Create: `src/components/CompletedPages.tsx`
- Create: `src/components/CompletedPages.test.tsx`
- Modify: `src/components/RunSummary.tsx`
- Modify: `src/components/RunSummary.test.tsx`
- Modify: `src/components/EditorialDesk.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- `CompletedPages` consumes:

```ts
type CompletedPage = {
  problemId: string
  title: string
  source: string
}
```

- `EditorialDesk` derives review-only pages from
  `session.runProblemIds`, `session.progress.completedProblemIds`, and
  `session.progress.draftByProblemId`.

- [ ] **Step 1: Write failing Summary tests**

Prove the calm Summary remains first, `Completed pages` is secondary, only one
rendered page is visible, Previous/Next controls change the page, and no editor
or textbox exists.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/components/CompletedPages.test.tsx src/components/RunSummary.test.tsx
```

Expected: failure because completed documents are not exposed in Summary.

- [ ] **Step 3: Implement completed-page review**

Add a quiet disclosure below the existing teacher note. Open it without
replacing the Summary, render one document at a time with
`RenderedDocumentBody`, and use accessible Previous/Next buttons. Keep all
documents read-only and reuse persisted drafts rather than regenerating prose.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/components/CompletedPages.test.tsx src/components/RunSummary.test.tsx
npm run typecheck
```

Expected: selected tests and typecheck pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/CompletedPages.tsx src/components/CompletedPages.test.tsx src/components/RunSummary.tsx src/components/RunSummary.test.tsx src/components/EditorialDesk.tsx src/styles/global.css
git commit -m "feat: reveal completed pages in summary"
```

### Task 5: Browser, responsive, and repository verification

**Files:**
- Modify: `tests/e2e/heading-flow.spec.ts`
- Create: `docs/design/qa/card-first-practice-fidelity.md`
- Add QA screenshots under: `docs/design/qa/`

**Interfaces:**
- Browser contract: card-only Practice, keyboard/pointer submission, exact
  Hint retry, six-problem completion, completed-page viewer, no overflow.

- [ ] **Step 1: Write failing browser expectations**

Update Playwright coverage to require the card region and reject the legacy
Goal/Answer tab surfaces. Add an exact-Hint retry path and a narrow viewport
path.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm run test:e2e -- tests/e2e/heading-flow.spec.ts
```

Expected: failure until selectors and full card behavior are implemented.

- [ ] **Step 3: Fix only browser-visible regressions**

Run the local app, inspect desktop at `1280×800`, current browser size, and
mobile at `390×844`. Fix clipped marks, Hint movement, focus loss, typography,
and horizontal/page overflow without changing approved copy or hierarchy.

- [ ] **Step 4: Record the fidelity ledger**

Compare the accepted Visual Companion concept with fresh implementation
screenshots. Record at least copy, hierarchy, card width, typography, paper
palette, input geometry, Hint expansion, responsive stacking, and focus state
in `docs/design/qa/card-first-practice-fidelity.md`.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
git diff --check
```

Expected: zero failures and a production build.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/heading-flow.spec.ts docs/design/qa
git commit -m "test: verify card-first practice"
```

