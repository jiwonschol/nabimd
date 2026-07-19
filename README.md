# Nabi Markdown

[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/jiwonschol/nabimd?utm_source=oss&utm_medium=github&utm_campaign=jiwonschol%2Fnabimd&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

> Build Markdown fluency by rebuilding small, readable documents—one quest at
> a time.

Nabi Markdown is an English-first Markdown practice app for the **Education**
track of [OpenAI Build Week](https://openai.devpost.com/). It teaches production,
not recognition: a beginner rebuilds a rendered target, an advanced learner
composes from a brief, and everyone writes the Markdown source and checks it
explicitly. After a mistake, the learner proves the same skill with different
content.

The playable curriculum now spans five levels: Learn the syntax, Rebuild real
documents, Write for people, Write a development spec, and Write an agent work
order. The
first schema-v2 milestone is intentionally small and deeply tested; the public
tracker, not a marketing estimate, is the source of truth as the bank grows
toward 512 inspected problems.

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

1. Rebuild a rendered target at Levels 1–2, then compose from a brief at
   Levels 3–5.
2. Produce the Markdown yourself in a plain source editor.
3. Press **Check** or `Control/Command + Enter` when you are ready.
4. Receive one precise result: **Try again** or **Matched**.
5. See Hint during the first four chosen-level problems, then try two
   next-level challenges with Hint closed. Hint remains available on request;
   after Try again it reveals progressively stronger help. After Matched,
   Review remains optional.
6. After repairing a failure, solve a different prompt that uses the same
   syntax so recall—not answer memorization—is tested.

Matched means the requested Markdown structure is present. Case, spelling,
punctuation, and wording are not graded. Try again is reserved for missing or
malformed requested Markdown. Optional Review can point out another structural
habit, but it is not a third grade and cannot revoke Matched.

## Current scope

This milestone includes:

- five selectable curriculum levels with six scheduled problems per turn:
  four at the selected level and two next-level challenges;
- a 320-problem deterministic bank split 136/136/28/16/4 across Levels 1–5,
  including reviewed ATX H2–H6 lessons and H1–H3 sectioned-document rebuilds;
  the current Level 5 turn uses all four unique work orders instead of
  duplicating two to display six;
- a fixed CBT-style top bar and two equal Goal/Answer panels;
- Write and Preview tabs, with Review replacing Preview after Check when useful;
- chosen-level Hint that begins open, next-level challenges that begin closed,
  and request-only Hint at any point without a grading penalty;
- deterministic AST predicates and ordered, structure-only feedback;
- different-content remediation after a failure and `Try another` at any time;
- browser-session draft, schedule, and transfer-state persistence;
- safe local rendering with no runtime AI or learner-content API request;
- a monochrome CodeMirror editor with optional, non-mutating invisibles; and
- an append-only, digest-bound fixture, independent-review, and editorial gate.

The repository also preserves the earlier 128-candidate GPT-5.6 experiment as
frozen legacy evidence. Its 112 unsupported-family candidates are not silently
counted as schema-v2 lessons. Nabi does **not** yet claim the 512-problem closing
target, accounts, cloud sync, Korean localization, payments, or analytics.

## How it works

The browser app is React, TypeScript, and Vite. CodeMirror 6 provides the plain
Markdown source surface, caret, history, gutter, and view-only whitespace
decorations. `mdast-util-from-markdown` parses learner input into a Markdown
AST once. Pure predicates check node types, counts, nesting, order, section
boundaries, and explicitly taught source forms. They never inspect title text,
case, spelling, vocabulary, or prose similarity. React components render the
resulting state; they do not inspect Markdown syntax.

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
request-only coaching, and different-content transfer; collapsed the verdicts
to Try again and Matched; defined Goal as the rendered reference; replaced a
three-column editor with the familiar CBT two-panel composition; kept runtime
grading deterministic; and defined Level 5 as a human-reviewable, AI-executable
work order rather than a vendor-specific prompt template.

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
The shipped loop grades only on explicit Check. Chosen-level practice starts
with Hint open, next-level challenges start with it closed, and opening it never
changes the verdict or creates a penalty. Only an actual failed Check requires
different-content remediation.

### Grading structure rather than one copied answer

Exact-string comparison would punish the learner for writing different words.
The fixture bank therefore separates canonical, alternate-prose,
case-or-spelling, missing, malformed, and matched-with-review cases. AST checks
accept `# aple` when the lesson asks for an H1, while still producing a specific
spacing correction for `#Project notes`.

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
The first redesign kept the tested grader, persistence, and transfer selector
while replacing the learner hierarchy with an empty source and a large rendered
Goal. The later CBT redesign removed the redundant permanent live-preview
column: Goal stays on the left, while Write, Preview, and Review share the equal
Answer panel on the right.

### Keeping fast typing from being overwritten

The first CodeMirror integration passed its isolated component test but lost
characters when the full app re-rendered after every keystroke. A passive
effect could replay an older controlled value after the editor had already
advanced. Moving controlled document synchronization to the layout phase made
parent echoes settle before the next browser input. The regression is covered
in the application and real-browser keyboard paths.

### Removing the mobile overlay exposed by the new Help default

Chosen-level practice now opens Hint on entry. The legacy mobile Side Coach was a
fixed bottom sheet, so it covered the Check action. The CBT composition removes
that overlay entirely: Hint opens inside Goal and never changes the equal panel
frame. Browser tests assert the fixed desktop contract and bounded narrow-screen
overflow.

## Accomplishments that we're proud of

- A complete Try again → repair → different-content transfer → Matched loop
  works in the browser.
- Structure-only grading lets learners change every visible word without losing
  credit for correct Markdown.
- Every schema-v2 seed carries real-engine counterexamples, a complete teaching
  payload, and three progressive hints.
- Goal and Answer remain equal at `1280 × 800`; long Level 5 documents scroll
  inside their panels while the app chrome stays fixed.
- Typechecking, the complete unit/component suite, digest-bound pipeline and
  bank gates, production build, and 12 Chromium journeys cover the current
  foundation. Exact current counts are recorded by CI rather than copied here.
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
- [Approved five-level problem-bank design](docs/superpowers/specs/2026-07-19-five-level-problem-bank-design.md)
- [Five-level problem-bank execution plan](docs/superpowers/plans/2026-07-19-five-level-problem-bank.md)
- [Problem-bank pipeline](curriculum/problem-bank/README.md)
- [Anonymized Level 5 reference](docs/examples/level-5-agent-work-order-reference.md)
- [Public demo](https://nabimd.vercel.app)
- Primary Codex task and `/feedback` Session ID:
  `019f7290-4f9c-7c01-beaa-bc106cbdd874`

## What's next for Nabi Markdown

First, expand the proven fixture contract to the 512-problem distribution in
small reviewed batches. GPT-5.6 helps generate vocabulary, candidates, and
counterexamples at build time; accepted and rejected results remain inspectable
in the repository, and it never grades a learner at runtime.

Markdown is the first code many people write with AI. It should not be the
first thing nobody teaches them.

Level 5 already establishes the north star: repeated document makeovers teach a
person to structure an AI instruction document that another human can audit.
Its convention metadata is versioned so the curriculum can evolve with agent
workflows. Korean comes before other localizations after the English curriculum
is proven.

No pre-existing application code was used. The app depends on React, Vite,
TypeScript, CodeMirror, mdast, react-markdown, Vitest, Testing Library, and
Playwright; their exact versions are locked in `package-lock.json`.

## License

The code is licensed under the [GNU Affero General Public License v3.0 or
later](LICENSE). [TRADEMARKS.md](TRADEMARKS.md) describes the separate treatment
of the Nabi Markdown name and future visual identity.

Commercial licensing may be offered later. No pricing or commercial terms are
part of the Build Week submission.
