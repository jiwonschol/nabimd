# Nabi Markdown

> Build Markdown fluency by rebuilding small, readable documents—one quest at
> a time.

Nabi Markdown is an English-first Markdown practice app for the **Education**
track of [OpenAI Build Week](https://openai.devpost.com/). It teaches production,
not recognition: the learner sees a rendered target, writes the source, checks
it explicitly, and proves the same skill with different content after a
mistake.

The current product track teaches H1 document titles. Its accepted bank is
deliberately bounded by a deterministic publication gate before later syntax
families are allowed into the learner runtime.

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
5. See a new rule during its Level 1 introduction; on later recall exercises,
   choose whether to open Help. After Fail, ask for progressively stronger
   hints. After Matched, Review remains optional.
6. After repairing a failure, solve a different prompt that uses the same
   syntax so recall—not answer memorization—is tested.

Both Matched and Perfect pass. Matched means the requested syntax is correct
but an optional readability improvement is available. Perfect means all checks
for that exercise passed. Fail is reserved for missing or malformed required
syntax or lost prompt content.

## Current scope

This milestone includes:

- 16 curated H1 heading prompts with 29 real-engine fixtures each;
- three-exercise replay windows that rotate through the accepted bank;
- a compact Level 1 concept, how-to, and inline example that disappears in
  recall mode;
- a reproducible 128-candidate GPT-5.6 artifact with 112 unsupported-family
  candidates truthfully blocked from runtime publication;
- deterministic Markdown parsing and ordered feedback;
- different-content transfer after a repaired failure;
- introduce/recall teaching modes, downward Help, progressive hints, and
  optional Review;
- local draft and transfer-state persistence;
- one safe rendered-document surface for Goal and Live preview;
- a restrained monochrome CodeMirror source editor with optional,
  non-mutating invisibles; and
- a digest-bound declared-independent review and editorial publication gate.

It does **not** yet claim the full 33-problem curriculum, accounts, cloud
sync, Korean localization, payments, analytics, or runtime AI.

## How it works

The browser app is React, TypeScript, and Vite. CodeMirror 6 provides the plain
Markdown source surface, caret, history, gutter, and view-only whitespace
decorations. `mdast-util-from-markdown` parses learner input into a Markdown
AST. The grader checks required structure, protected prompt text, malformed
syntax, and optional editorial rules. React components render the resulting
state; they do not inspect Markdown syntax.

The Goal and learner preview use `react-markdown` without raw HTML.
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
Perfect a stronger pass; defined Goal as the rendered reference; selected the
C6 workspace with aligned Goal/Help and equal editor/preview rows; kept runtime
grading deterministic; and set the English-first, black-and-white Build Week
scope.

The dated [build log](docs/build-log.md) records these decisions and failures
while they happen. The public commit sequence preserves the implementation
work behind the summary.

## Development log

Follow the public [release tracker](https://github.com/jiwonschol/nabimd/issues/2)
for the implementation sequence and shipped evidence.

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

### Replacing a generic editor without losing the learning engine

The first shipped slice proved grading but repeated `Project notes` across the
instruction, target, prefilled source, and preview. Jiwon's hands-on review
showed that the result looked like a generic Markdown editor, not a lesson.
The redesign kept the tested grader, persistence, and transfer selector while
replacing the learner hierarchy: an empty source, a large rendered Goal,
downward Help, and one shared paper component for Goal and Live preview.

### Keeping fast typing from being overwritten

The first CodeMirror integration passed its isolated component test but lost
characters when the full app re-rendered after every keystroke. A passive
effect could replay an older controlled value after the editor had already
advanced. Moving controlled document synchronization to the layout phase made
parent echoes settle before the next browser input. The regression is covered
in the application and real-browser keyboard paths.

### Removing the mobile overlay exposed by the new Help default

Level 1 now opens Help on first exposure. The legacy mobile Side Coach was a
fixed bottom sheet, so it covered the Check action before the C6 composition
was complete. C6 removes that overlay entirely: Help is a normal downward
disclosure in semantic document order. Browser tests now assert Goal → Help →
source → preview ordering and no horizontal overflow at 390 px.

## Accomplishments that we're proud of

- A complete Fail → repair → different-content transfer → pass loop works in
  the browser.
- Matched and Perfect preserve the difference between correctness and readable
  presentation without turning editorial polish into punishment.
- Every current problem carries 29 grading fixtures, a complete teaching
  payload, and three progressive hints.
- Goal and Live preview share one safe renderer, while the source editor can
  reveal spaces and tabs without changing the learner's Markdown.
- Typechecking, 661 unit/component/pipeline checks, the digest-bound bank gate,
  the production build, and 15 Chromium journeys pass on the issue #7 release
  candidate. Production deployment is verified separately after merge.
- The UI stays monochrome and source-focused while preserving a constrained
  reading width and allowing future document exercises to grow vertically.

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
- [Approved first-exercise redesign](docs/superpowers/specs/2026-07-18-first-exercise-redesign-design.md)
- [C6 redesign execution plan](docs/superpowers/plans/2026-07-18-first-exercise-redesign.md)
- [Level 5 agent-brief north star](docs/design/level-5-agent-brief-north-star.md)
- [Problem-bank pipeline](curriculum/problem-bank/README.md)
- [Anonymized Level 5 reference](docs/examples/level-5-agent-work-order-reference.md)
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

Later: the syntax agents actually read—AGENTS.md, prompt structure, spec files,
and contemporary agent work orders. The eventual Level 5 outcome is not merely
an editor: repeated document makeovers should teach a person to structure an
AI instruction document that another human can audit. Those conventions will
be versioned as tools evolve. Korean comes before other localizations after the
English curriculum is proven.

No pre-existing application code was used. The app depends on React, Vite,
TypeScript, CodeMirror, mdast, react-markdown, Vitest, Testing Library, and
Playwright; their exact versions are locked in `package-lock.json`.

## License

The code is licensed under the [GNU Affero General Public License v3.0 or
later](LICENSE). [TRADEMARKS.md](TRADEMARKS.md) describes the separate treatment
of the Nabi Markdown name and future visual identity.

Commercial licensing may be offered later. No pricing or commercial terms are
part of the Build Week submission.
