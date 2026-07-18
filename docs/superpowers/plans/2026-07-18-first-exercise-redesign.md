# Nabi Markdown First-Exercise Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shipped generic-editor first exercise with the approved C6 learning workspace: an explicit Level 1 rule, a large rendered Goal beside vertically opening Help, an empty real Markdown source editor beside an equal-height Live preview, and recall-aware transfer behavior.

**Architecture:** Preserve the existing deterministic curriculum, grader, transfer selector, persistence, and React session boundaries. Extend curriculum data with teaching mode and syntax tokens; let the pure session reducer own whether Help was needed; render Goal and learner output through one safe document-surface component; wrap a deliberately minimal CodeMirror 6 view as a controlled source editor. Layout and visual alignment remain CSS responsibilities, while browser tests prove geometry and network safety.

**Tech Stack:** Node.js `>=22.13`, npm, TypeScript `7.0.2`, React `19.2.7`, Vite `8.1.5`, `mdast-util-from-markdown` `2.0.3`, `react-markdown` `10.1.0`, CodeMirror state `6.7.1`, view `6.43.6`, commands `6.10.4`, Vitest `4.1.10`, Testing Library, Playwright `1.61.1`, plain CSS, static Vercel deployment.

## Global Constraints

- The approved design contract is
  `docs/superpowers/specs/2026-07-18-first-exercise-redesign-design.md`.
- C6 is the visual source of truth: Goal and Help align in one row; source and
  preview align in one equal-height row; Help opens downward without changing
  horizontal geometry.
- The work area stays horizontally restrained and is designed to grow much
  farther vertically as Levels 3–5 introduce longer documents.
- Level 1 `introduce` problems expose the new rule on first render. Level 2+
  `recall` problems hide all answer punctuation until Help is opened.
- Opening Help on a recall problem means recall was not independently proven.
  A later pass therefore requires a different-content transfer, just as a
  repaired failure does. Initially visible Level 1 Help does not set this flag.
- Typing and live rendering never grade. Only `Check` or `Cmd/Ctrl + Enter`
  grades.
- `Fail` blocks `Next`; `Matched` and `Perfect` both unlock it. Review remains
  optional after Matched.
- CodeMirror is a source-entry surface, not an IDE: no colored syntax,
  autocomplete, minimap, command palette, or runtime language service.
- Invisible characters are view decorations only. They must never alter the
  draft, clipboard, preview, persisted source, or evaluation input.
- Goal and Live preview use the same safe renderer. Raw HTML stays disabled and
  learner images never trigger a request.
- All learner-facing copy is concise US English.
- No runtime AI, authentication, database, analytics, payments, localization,
  or Level 5 grader enters this milestone.
- Developer feedback, decisions, conflicts, review corrections, and verification
  evidence are recorded in English for Build Week judges.

## Pull Request and Review Strategy

Continue on PR #1 because this redesign completes the same H1 vertical slice;
do not split an artificial second PR while the first feature is still open.
Make the history reviewable through four coherent commits:

1. `docs: approve the learning workspace redesign`
2. `feat: add recall-aware heading lesson state`
3. `feat: build the C6 Markdown learning workspace`
4. `test: verify the redesigned heading journey`

Use two remote review gates rather than requesting review after every small
commit:

- **Review Gate A — behavior checkpoint:** after curriculum/session tests and
  the first two commits are created, inspect every current unresolved thread
  and verify that behavior changes do not invalidate grading or persistence.
  Keep the checkpoint local until the complete browser suite is green; do not
  push an intentionally mismatched legacy UI merely to expose an early commit.
- **Review Gate B — release candidate:** after the C6 UI and browser suite are
  pushed, request fresh CodeRabbit and Codex reviews on the latest head, wait
  for CI, address every still-valid actionable finding, resolve the matching
  threads, rerun all verification, and only then deploy.

The existing PR baseline on 2026-07-18 is `OPEN`, merge state `CLEAN`, CI green,
but aggregate review decision `CHANGES_REQUESTED`. CodeRabbit is auto-paused.
The known valid pending candidate is the no-network E2E listener being attached
after `page.goto`, which misses bootstrap-time requests. Treat old approvals as
historical evidence, not approval of this redesign.

---

## Task 1: Approve and synchronize the product record

**Files:**

- Modify: `docs/superpowers/specs/2026-07-18-first-exercise-redesign-design.md`
- Modify: `docs/design/level-5-agent-brief-north-star.md`
- Create: `docs/examples/level-5-agent-work-order-reference.md`
- Modify: `docs/build-log.md`
- Modify outside repository: `/Users/jiwon/develop/projects/markdown-trainer-plan.md`

- [x] **Step 1: Mark the C6 design approved and record recall-help transfer**

Change the redesign status to approved by Jiwon on 2026-07-18. Add the exact
state rule:

```text
introduce + visible rule -> no transfer debt
recall + Help opened -> needs transfer
Fail -> needs transfer
Matched/Perfect + needs transfer -> different-content same-skill problem
```

Also record the narrow-width/tall-document Level 5 direction and the PR review
gates from this plan.

- [x] **Step 2: Publish an anonymized Level 5 reference**

Create a judge-readable English example based on the structure—not the domain
details—of the supplied Overwater work order. Use a fictional repository and
include Mission, prior-failure context, ordered sources, a comprehension gate,
staged execution, hard constraints, stop conditions, verification, final report,
and repository conventions. Label it as a future curriculum reference, not a
current runtime exercise.

- [x] **Step 3: Extend the Level 5 north star**

State that document width remains deliberately constrained while document
height grows, repeated practice should make agent-instruction structure
automatic, and versioned convention updates create long-term curriculum
continuity. Keep future paid content explicitly outside Build Week scope.

- [x] **Step 4: Synchronize the external master plan**

Update the Korean source-of-truth plan to reflect the already shipped H1 MVP,
approved C6 redesign, CodeMirror editor, introduce/recall Help behavior,
five-level path, Level 5 versioning, current PR/review flow, and deferred
monetization. Do not claim the redesign is implemented until its verification
task passes.

- [x] **Step 5: Record the approval in the Build Week log**

Add an English entry separating Jiwon's product decision, Codex's proposed
implementation, current unimplemented status, and the evidence that will prove
completion.

- [x] **Step 6: Review the documentation diff**

Run:

```bash
git diff --check
git diff -- docs /Users/jiwon/develop/projects/markdown-trainer-plan.md
```

Expected: no whitespace errors; public docs contain no Overwater paths, secrets,
or project-specific operational details.

- [x] **Step 7: Commit the approved record**

```bash
git add docs
git commit -m "docs: approve the learning workspace redesign"
```

---

## Task 2: Replace the heading content contract

**Files:**

- Modify: `src/content/types.ts`
- Modify: `src/content/headingProblems.ts`
- Modify: `src/content/problemFixtures.ts`
- Modify: `src/content/headingProblems.test.ts`
- Modify: `src/engine/evaluateProblem.test.ts`

- [x] **Step 1: Write failing curriculum tests**

Assert that the three IDs and targets are exactly:

```ts
[
  ["heading-apple", "# Apple", "introduce"],
  ["heading-rainy-day", "# Rainy day", "recall"],
  ["heading-study-tools", "# Study tools", "recall"],
]
```

Assert every `starterText` is empty, each problem declares `syntaxTokens`, and
all six fixture kinds still exist for every problem.

Run:

```bash
npm test -- src/content/headingProblems.test.ts src/engine/evaluateProblem.test.ts
```

Expected: FAIL because the shipped bank still contains Project notes, Weekend
guide, and Summer reading list and lacks teaching metadata.

- [x] **Step 2: Extend the typed problem contract**

Add:

```ts
teachingMode: "introduce" | "recall"
syntaxTokens: readonly string[]
```

Keep grading checks typed and local; UI components must not infer rules by
parsing `target`.

- [x] **Step 3: Replace all content-specific problem and fixture data**

Use one shared instruction: `Rebuild the heading below in Markdown.` Keep the
three progressive hints, but make the first visible rule compact enough for the
Help surface. Rename protected-content checks and fixture IDs together.

- [x] **Step 4: Prove validation and grading remain green**

Run:

```bash
npm test -- src/content/headingProblems.test.ts src/engine/evaluateProblem.test.ts
```

Expected: PASS for 18 renamed fixtures, supported alternate headings, specific
malformed-spacing feedback, Matched, and Perfect.

---

## Task 3: Make Help state teach, test recall, and create transfer debt

**Files:**

- Modify: `src/session/learningSession.ts`
- Modify: `src/session/useLearningSession.ts`
- Modify: `src/session/learningSession.test.ts`
- Modify: `src/session/useLearningSession.test.tsx`

- [x] **Step 1: Write failing reducer tests**

Cover these transitions:

```text
introduce session -> Help open, hint level 1, hadFailure false
recall session -> Help closed, hint level 0
recall hint-requested before grading -> Help open, needsTransfer true
introduce visible Help -> needsTransfer false
recall Help + pass -> Next selects different-content transfer
Fail + repair -> existing transfer behavior unchanged
```

Run:

```bash
npm test -- src/session/learningSession.test.ts src/session/useLearningSession.test.tsx
```

Expected: FAIL because Help currently opens only after Fail and the reducer has
no recall-help transfer flag.

- [x] **Step 2: Introduce explicit session semantics**

Rename or supplement `hadFailure` with `needsTransfer` so state describes the
learning obligation rather than one cause. Initialize `introduce` with Help
open at its first rule; initialize `recall` closed. Allow a learner-requested
Hint while editing, and set transfer debt only for recall mode.

- [x] **Step 3: Preserve pass and coaching gates**

Fail still blocks Next and progressive hints remain user-triggered. Matched
Review still opens only on request. Perfect never requires Review. Editing after
evaluation clears the result without erasing transfer debt.

- [x] **Step 4: Route any transfer debt through the existing selector**

In `useLearningSession.next`, select a same-family, different-content problem
when `needsTransfer` is true and the current problem is not already a transfer.
Initialize the transfer problem from its own empty or persisted draft.

- [x] **Step 5: Run focused and regression tests**

```bash
npm test -- src/session/learningSession.test.ts src/session/useLearningSession.test.tsx src/selection/selectTransferProblem.test.ts
```

Expected: PASS; no infinite transfer chain and completion restoration remains
correct.

- [x] **Step 6: Commit Review Gate A locally**

```bash
git add src/content src/session src/selection
git commit -m "feat: add recall-aware heading lesson state"
```

Inspect PR #1 checks, reviews, and unresolved threads. Fix any still-valid
behavior or persistence regression before continuing. If the new initial Help
state exposes a known mismatch in the legacy UI, record it and continue directly
to the approved C6 replacement. Do not push or request a full automated review
until the browser suite is green.

---

## Task 4: Build one safe rendered-document surface

**Files:**

- Create: `src/components/RenderedDocument.tsx`
- Create: `src/components/RenderedDocument.test.tsx`
- Delete after migration: `src/components/MarkdownPreview.tsx`
- Delete after migration: `src/components/MarkdownPreview.test.tsx`
- Modify: `src/components/EditorialDesk.tsx`

- [x] **Step 1: Write failing shared-surface tests**

Assert one component renders both `Goal` and `Live preview`, applies the same
document-surface class, blocks learner images, and exposes an empty-state
message only for an empty learner preview.

Run:

```bash
npm test -- src/components/RenderedDocument.test.tsx
```

Expected: FAIL because the shared component does not exist.

- [x] **Step 2: Implement `RenderedDocument`**

Use `react-markdown` with raw HTML disabled by omission. Replace learner image
nodes with text placeholders. Keep toolbar labels outside the rendered Markdown
body and use one paper class for Goal and preview.

- [x] **Step 3: Migrate both consumers and remove the old split variants**

The only functional variation is accessible context and empty-state copy;
typography, padding, border, and body geometry stay shared.

- [x] **Step 4: Run component tests**

```bash
npm test -- src/components/RenderedDocument.test.tsx
```

Expected: PASS with no `<img>` for learner media.

---

## Task 5: Add the minimal CodeMirror Markdown source editor

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/MarkdownSourceEditor.tsx`
- Create: `src/components/MarkdownSourceEditor.test.tsx`
- Create: `src/editor/invisibleCharacters.ts`
- Create: `src/editor/invisibleCharacters.test.ts`
- Modify: `src/test/setup.ts` only if CodeMirror requires a test-only DOM API polyfill

- [x] **Step 1: Install exact CodeMirror packages**

```bash
npm install --save-exact @codemirror/state@6.7.1 @codemirror/view@6.43.6 @codemirror/commands@6.10.4
```

Expected: package and lockfile record exact versions; no Markdown language
package or syntax highlighter is installed.

- [x] **Step 2: Write failing editor contract tests**

Test an accessible `Your Markdown` textbox, controlled initial value, edit
callback, external value synchronization without feedback loops, `Mod-Enter`
check callback, `answer.md` context, and a `Show invisibles` toggle.

Run:

```bash
npm test -- src/components/MarkdownSourceEditor.test.tsx
```

Expected: FAIL because the component does not exist.

- [x] **Step 3: Write failing pure invisible-decoration tests**

Test that space ranges receive a faint dot class, tabs receive an arrow class,
line breaks are ignored, and the input document string is returned unchanged.

Run:

```bash
npm test -- src/editor/invisibleCharacters.test.ts
```

Expected: FAIL because the extension does not exist.

- [x] **Step 4: Implement the controlled editor wrapper**

Create one `EditorView` in a ref callback/effect, destroy it on unmount, and use
`EditorView.updateListener` only when `update.docChanged`. Configure line
numbers, history, default/history keymaps, line wrapping, placeholder text,
the `Mod-Enter` binding, and content attributes for the accessible label. Use a
`Compartment` to reconfigure invisible decorations without recreating the
editor.

- [x] **Step 5: Implement non-mutating invisible decorations**

Use CodeMirror decorations or a `MatchDecorator`/`ViewPlugin`; never inject
literal dots or arrows into the document. Keep marks monochrome and low contrast.

- [x] **Step 6: Apply restrained editor styling**

Expose stable wrapper classes and style `.cm-editor`, `.cm-scroller`,
`.cm-content`, `.cm-gutters`, focus, selection, and cursor. The editor and
gutter must fill the shared workbench height and scroll vertically.

- [x] **Step 7: Run editor tests and typecheck**

```bash
npm test -- src/components/MarkdownSourceEditor.test.tsx src/editor/invisibleCharacters.test.ts
npm run typecheck
```

Expected: PASS. Add a test-only DOM polyfill only for a missing jsdom primitive
observed in output, never as a speculative product workaround.

---

## Task 6: Compose the approved C6 workspace

**Files:**

- Modify: `src/components/EditorialDesk.tsx`
- Replace or refactor: `src/components/SideCoach.tsx`
- Modify: `src/components/StatusBar.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/styles/tokens.css`

- [x] **Step 1: Rewrite component tests around the learning hierarchy**

Assert the visible order and names: Instruction, Goal, Hint, Your Markdown,
Live preview, status. Assert `Apple` is the first Goal, the editor starts empty,
the Level 1 rule is visible, a transfer/recall Hint begins closed without `#`,
and opening it never changes the draft.

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL against the old Target/textarea/Side Coach layout.

- [x] **Step 2: Refactor the top lesson row**

Render the action instruction first. Place the large Goal surface and fixed
Help frame in one grid. Help is an inline disclosure whose body expands
downward; it is not a right drawer or mobile bottom sheet.

- [x] **Step 3: Refactor the workbench row**

Place `MarkdownSourceEditor` and `RenderedDocument` in a 1:1 grid with one
shared height variable. Keep the editor narrower in feel through document
padding and type scale, not by making the preview a different geometry.

- [x] **Step 4: Integrate Hint and Review into one Help frame**

Collapsed recall state contains only `Hint` plus a neutral disclosure icon.
Level 1 rule, progressive post-Fail hints, and optional Matched Review reuse the
same column. No mode changes the row width.

- [x] **Step 5: Implement C6 CSS and mobile stacking**

Define explicit lesson/workbench grid columns, equal row heights, shared paper
tokens, aligned label baselines, a large Level 3-sized Goal height, tall source
and preview bodies, and mobile stacking in semantic order. Remove drawer and
bottom-sheet styles.

- [x] **Step 6: Run component and full unit tests**

```bash
npm test -- src/App.test.tsx
npm test
```

Expected: PASS; grading, persistence, media safety, transfer, and completion
regressions remain green.

- [x] **Step 7: Commit the C6 implementation**

```bash
git add package.json package-lock.json src
git commit -m "feat: build the C6 Markdown learning workspace"
```

---

## Task 7: Prove behavior, geometry, accessibility, and network safety

**Files:**

- Modify: `tests/e2e/heading-flow.spec.ts`
- Modify: `playwright.config.ts` only if a current test exposes a real config defect

- [x] **Step 1: Fix the known bootstrap-network blind spot first**

Move the `page.on("request", ...)` listener before `page.goto("/")`. Keep it
active while learner media is typed. This is an existing valid review finding,
not a redesign convenience.

- [x] **Step 2: Rewrite browser journeys for the new bank and Help model**

Cover:

```text
empty Apple start -> visible Level 1 rule -> Perfect -> completion
malformed Apple -> Fail -> progressive Help -> repair -> Rainy day transfer
recall Hint opened before check -> pass -> different-content transfer
Matched -> optional Review -> Next
refresh restores a CodeMirror draft
```

Read transfer content from the visible Goal rather than hard-coding a selected
problem title.

- [x] **Step 3: Add desktop geometry assertions**

At the reference viewport, compare bounding boxes and require:

```text
abs(goal.top - help.top) <= 1
abs(goal.bottom - help.bottom) <= 1
abs(editor.top - preview.top) <= 1
abs(editor.bottom - preview.bottom) <= 1
```

Open Help and repeat the Goal/Help width and edge checks.

- [x] **Step 4: Add invisible-character browser proof**

Enter a heading containing spaces and a tab, toggle Invisibles, assert the
decorative markers appear, then check `inputValue` and preview text remain
unchanged.

- [x] **Step 5: Add mobile stacking and overflow proof**

At `390 x 844`, assert semantic top positions increase in the order Goal,
Hint, editor, preview and `documentElement.scrollWidth <= innerWidth`.

- [x] **Step 6: Run the local release gate**

```bash
npm run check
npm run test:e2e
```

Expected: typecheck, all Vitest files, build, and every Chromium path pass.

- [ ] **Step 7: Commit and push the release candidate**

```bash
git add tests playwright.config.ts
git commit -m "test: verify the redesigned heading journey"
git push origin agent/bootstrap-nabi-markdown
```

---

## Task 8: Complete Review Gate B and deploy only the reviewed head

**Files:**

- Modify as findings require: smallest relevant files only
- Modify: `README.md`
- Modify: `docs/build-log.md`
- Modify: `docs/submission-checklist.md` if verification counts or demo facts change

- [ ] **Step 1: Refresh README and Build Week evidence**

Describe the verified C6 experience, exact current test counts, CodeMirror
source editor, Level 1/recall Help behavior, and the linked Level 5 public
reference. Record observed implementation challenges and accepted/rejected
review feedback without claiming future curriculum as shipped.

- [ ] **Step 2: Commit and push evidence**

```bash
git add README.md docs
git commit -m "docs: record the redesigned learning workspace"
git push origin agent/bootstrap-nabi-markdown
```

- [ ] **Step 3: Request fresh automated reviews on the latest head**

Post the repository's standard bare Codex review request and explicitly resume
or trigger CodeRabbit once the branch is stable. Do not spam review commands
between fix commits.

- [ ] **Step 4: Triage every current thread against current code**

For each actionable finding: reproduce or inspect it, fix only if valid, add or
adjust a test, reply with evidence, and resolve the thread. For stale or invalid
findings: reply with the concrete reason and resolve only with the user's
standing authorization for this PR. Ignore the generic docstring-coverage
warning unless it identifies an actual project rule or defect.

- [ ] **Step 5: Re-run the complete gate after review fixes**

```bash
npm run check
npm run test:e2e
git diff --check
git status --short
```

Expected: all pass and the worktree is clean after the final review-fix commit.

- [ ] **Step 6: Wait for remote evidence**

Confirm GitHub Verify succeeds on the final commit, CodeRabbit has reviewed the
latest head, no actionable unresolved threads remain, and the aggregate review
state no longer refers only to superseded commits. Report any unavoidable
platform warning separately.

- [ ] **Step 7: Deploy the exact reviewed commit**

```bash
npx vercel@56.3.1 --prod --yes
npx vercel@56.3.1 alias set <deployment-url> nabimd.vercel.app
curl -I https://nabimd.vercel.app
E2E_BASE_URL=https://nabimd.vercel.app npm run test:e2e
```

Expected: production reports Ready, public alias returns HTTP 200 without
authentication, and every browser journey passes against production.

- [ ] **Step 8: Record final delivery evidence**

Update the build log with final commit, exact test counts, PR review result,
deployment URL, and production E2E result. If this changes committed docs,
commit/push it and wait for the lightweight CI gate again; do not redeploy when
only evidence prose changed.

## Completion Conditions

This plan is complete only when all of the following are true:

- the public and external plans match the approved product direction;
- the first H1 problem starts empty and teaches `#` visibly;
- recall Help is closed and opening it creates transfer debt;
- Goal and Live preview share one component and visual surface;
- Goal/Help and editor/preview geometry align at desktop reference size;
- CodeMirror provides a real source editor and non-mutating invisibles;
- mobile stacks without horizontal overflow;
- local checks and local E2E pass;
- latest-head PR reviews and CI are handled;
- `https://nabimd.vercel.app` serves the reviewed build; and
- the production E2E suite passes against that URL.
