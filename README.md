# Nabi Markdown

> Build Markdown fluency by rebuilding small, readable documents—one quest at
> a time.

Nabi Markdown is an English-first Markdown practice app for the **Education**
track of [OpenAI Build Week](https://openai.devpost.com/). It teaches production,
not recognition: the learner sees a rendered target, writes the source, checks
it explicitly, and proves the same skill with different content after a
mistake.

The current deployed slice teaches H1 document titles. It is deliberately
small enough to prove the complete learning loop before the problem bank is
expanded.

**Live demo:** [nabimd.vercel.app](https://nabimd.vercel.app)

## Inspiration

Ten years ago I worked at a tech company and wanted a word processor I could
drive without the mouse. That search ended in Markdown. Nobody taught me—I
tripped over it looking for something else.

I left that world. I run a convenience store now and write novels on the side.
The habit stayed.

Then AI arrived and everyone started talking to it. Chat asks you to work out
what you think while you type. I'd already worked it out—I didn't want to
explain a plan, I wanted to hand one over. So I never chatted. I wrote the
document first, in Markdown, and gave it that.

That's the only reason I adapted faster than the people around me. Not talent.
A ten-year-old habit.

They aren't slow. They've written reports and essays for years—the structure
is already in their heads. Nobody ever told them the format that carries it.

## What it does

Markdown takes ten minutes to understand and months to use without thinking.
Most tutorials solve the first problem and ignore the second.

Nabi takes its method from language learning:

1. See a small rendered target.
2. Produce the Markdown yourself in a plain source editor.
3. Press **Check** or `Control/Command + Enter` when you are ready.
4. Receive one precise result: **Fail**, **Matched**, or **Perfect**.
5. Ask for a progressive Hint only after a failure, or an optional Review
   after Matched.
6. After repairing a failure, solve a different prompt that uses the same
   syntax so recall—not answer memorization—is tested.

Both Matched and Perfect pass. Matched means the requested syntax is correct
but an optional readability improvement is available. Perfect means all checks
for that exercise passed. Fail is reserved for missing or malformed required
syntax or lost prompt content.

## Current scope

This milestone includes:

- three curated H1 heading prompts with 18 golden fixtures;
- deterministic Markdown parsing and ordered feedback;
- different-content transfer after a repaired failure;
- progressive, request-only hints and optional review;
- local draft and transfer-state persistence;
- a monochrome responsive Editorial Desk and mobile Side Coach; and
- 62 unit/component tests plus five Chromium end-to-end paths.

It does **not** yet claim the full 33-problem curriculum, accounts, cloud
sync, Korean localization, payments, analytics, or runtime AI.

## How it works

The browser app is React, TypeScript, and Vite. `mdast-util-from-markdown`
parses learner input into a Markdown AST. The grader checks required structure,
protected prompt text, malformed syntax, and optional editorial rules. React
components render the resulting state; they do not inspect Markdown syntax.

The target preview and learner preview use `react-markdown` without raw HTML.
Progress is versioned and stored locally. The deployed app makes no request to
OpenAI or any other runtime service, so a network outage cannot change whether
the same answer passes.

## How we built it

The core work is being done in one primary Codex task. Codex is the only coding
agent used for the project.

Codex helped turn a commercial Korean-first roadmap into a Build Week proof,
compared learning models, wrote the approved application contract and execution
plan, generated the first visual direction, and implemented the vertical slice
test-first. It built the problem schema, fixture validator, deterministic AST
grader, transfer selector, versioned progress store, pure session reducer,
React interface, responsive CSS, and browser tests. It also ran the app in a
real browser at desktop and mobile sizes and fixed the defects that appeared.

Jiwon made the consequential product calls. He rejected live correction
because it improves an editor without building recall; chose explicit Check,
request-only coaching, and different-content transfer; made Matched a pass and
Perfect a stronger pass; selected the Editorial Desk and separate Side Coach;
kept runtime grading deterministic; and set the English-first, black-and-white
Build Week scope.

The dated [build log](docs/build-log.md) records these decisions and failures
while they happen. The public commit sequence preserves the implementation
work behind the summary.

## Challenges we ran into

### Helpful feedback without automatic correction

An early live-coach proposal behaved too much like a word processor's
autocorrect. Jiwon rejected it because the learner would depend on the editor.
The shipped loop grades only on explicit Check, reveals Hint only after Fail,
and requires different content after a repaired mistake.

### Grading structure rather than one copied answer

Exact-string comparison would reject valid Markdown such as a supported
closing-hash heading. The fixture bank therefore separates canonical,
alternate, missing, malformed, matched-with-refinement, and perfect cases. AST
checks accept supported equivalents while protected-content and source-spacing
checks still produce a specific failure for `#Project notes`.

### Testing browser storage under Node 26

The jsdom environment collided with Node 26's global `localStorage` behavior.
Instead of adding a product workaround, the session accepts the standard
`Storage` interface and tests use a complete in-memory implementation. That
keeps browser persistence real and the test boundary explicit.

### Keeping two test runners from collecting each other

The first full gate failed after Playwright tests were added because Vitest
also collected `tests/e2e/heading-flow.spec.ts`. Vitest is now scoped to
`src/**/*.test.{ts,tsx}` and Playwright owns `tests/e2e`. The clean-install
gate then passed both suites independently.

## Accomplishments that we're proud of

- A complete Fail → repair → different-content transfer → pass loop works in
  the browser.
- Matched and Perfect preserve the difference between correctness and readable
  presentation without turning editorial polish into punishment.
- Every current problem carries six fixture classes and three progressive
  hints.
- `npm ci`, typechecking, 62 unit/component tests, the production build, and
  five Chromium journeys pass from the committed lockfile and against the
  public deployment.
- The UI stays monochrome and source-focused while adapting the coach to a
  no-overflow mobile bottom sheet.

## What we learned

The important boundary is not “AI versus no AI.” It is creation versus
judgment. Codex can accelerate product exploration, implementation, and later
curriculum counterexample work, while the learner deserves a grader whose
decision is stable, local, and inspectable.

We also learned that the best retry is not the same answer again. A new prompt
using the same rule reveals whether the syntax moved from short-term correction
into recall.

## Run locally

Requires Node.js `22.13` or later.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Verify

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Run the same browser suite against a deployment:

```bash
E2E_BASE_URL=https://nabimd.vercel.app npm run test:e2e
```

Or run the non-browser checks together:

```bash
npm run check
```

## Build Week evidence

- [Build log](docs/build-log.md)
- [Submission checklist](docs/submission-checklist.md)
- [Approved application design](docs/superpowers/specs/2026-07-18-nabi-markdown-application-design.md)
- [Heading MVP execution plan](docs/superpowers/plans/2026-07-18-heading-vertical-mvp.md)
- [Public demo](https://nabimd.vercel.app)
- Primary Codex task: the core-build task used for this repository
- `/feedback` Session ID: generated after the majority of the final submission
  scope is complete, then supplied through Devpost

## What's next for Nabi Markdown

First, expand the proven fixture contract across the Devpost-supported common
syntax families and mix them into short document makeovers. Then use GPT-5.6
for a documented curriculum counterexample and refinement pass whose accepted
and rejected suggestions live in the repository; it will help produce the
bank, not grade learners at runtime.

Markdown is the first code many people write with AI. It should not be the
first thing nobody teaches them.

Later: the syntax agents actually read—AGENTS.md, prompt structure, and spec
files—and Korean before other localizations.

No pre-existing application code was used. The app depends on React, Vite,
TypeScript, mdast, react-markdown, Vitest, Testing Library, and Playwright;
their exact versions are locked in `package-lock.json`.

## License

The code is licensed under the [GNU Affero General Public License v3.0 or
later](LICENSE). [TRADEMARKS.md](TRADEMARKS.md) describes the separate treatment
of the Nabi Markdown name and future visual identity.

Commercial licensing may be offered later. No pricing or commercial terms are
part of the Build Week submission.
