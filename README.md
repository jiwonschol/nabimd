# Nabi Markdown

> Learn Markdown by rebuilding real documents—one quest at a time.

Nabi Markdown is an English-first, quest-based Markdown fluency trainer built for the **Education** track of [OpenAI Build Week](https://openai.devpost.com/).

This repository is at the foundation stage. The first working vertical slice, live demo, setup commands, and test commands will be added as they become real. The [build log](docs/build-log.md) distinguishes completed work from planned work.

## Inspiration

Ten years ago I worked at a tech company and wanted a word processor I
could drive without the mouse. That search ended in Markdown. Nobody taught
me — I tripped over it looking for something else.

I left that world. I run a convenience store now and write novels on the
side. The habit stayed.

Then AI arrived and everyone started talking to it. Chat asks you to work
out what you think while you type. I'd already worked it out — I didn't
want to explain a plan, I wanted to hand one over. So I never chatted. I
wrote the document first, in Markdown, and gave it that.

That's the only reason I adapted faster than the people around me. Not
talent. A ten-year-old habit.

They aren't slow. They've written reports and essays for years — the
structure is already in their heads. Nobody ever told them the format that
carries it.

## What it does

Markdown takes ten minutes to understand and months to use without
thinking. Every tutorial solves the first problem and ignores the second.

Nabi Markdown takes its method from language learning, not documentation.
Short quests instead of chapters. Production instead of recognition — you
type it, you don't read about it. Live rendering next to what you wrote, so
the correction arrives while your hand is still moving. Syntax you keep
missing comes back until it doesn't.

An hour, and it's automatic. That's the whole promise we are testing during
Build Week.

The planned core loop is:

```text
Rendered target
→ raw Markdown input
→ deterministic structure check
→ one smallest next fix
→ semantically equivalent completion
→ a short personalized final brief
```

The model creates a bounded final exercise. A deterministic Markdown parser
grades it. The model never decides whether an answer is correct.

## How we built it

Nabi Markdown is being built in one primary Codex thread. Codex is the only
coding agent used for the project. The repository keeps a dated
[build log](docs/build-log.md) so the final account can be specific instead
of reconstructed on the last night.

Work completed so far:

- Codex checked the official Build Week rules and converted a commercial
  product plan into a three-day submission scope.
- Codex compared product, learning, visual, and implementation options.
- Jiwon chose the product name, founder story, English-first launch,
  monochrome direction, public repository, and Codex-only workflow.
- Jiwon chose a four-quest path plus one personalized Boss rather than a
  broad curriculum.
- Jiwon chose AGPL-3.0-or-later for the public code while reserving the
  product name and a future commercial-license option.
- Codex designed the split between GPT-5.6 generation and deterministic
  Markdown grading; implementation and tests remain to be proven.

The final README will name the exact places where Codex accelerated the
work, where its suggestions were changed or rejected, and how GPT-5.6 is
meaningfully used in the working product.

## Challenges we ran into

### Turning a product roadmap into a three-day proof

The first plan assumed a full launch: 34 levels, Korean content, daily
practice, and monetization. That was incompatible with a polished Build Week
entry. We reduced the submission to four short English quests, one bounded
personalized Boss, semantic grading, and a single coherent screen.

### Keeping AI helpful without making grading unreliable

An LLM can write a kind explanation, but it should not decide whether the
same Markdown is correct differently from one attempt to the next. The
current design gives GPT-5.6 the generative role and gives an allowlisted
Markdown AST the grading role. Golden fixtures will test canonical,
equivalent, and incorrect answers.

### Publishing openly without abandoning a future business

A public repository does not prevent a paid hosted product, but a permissive
license would allow closed commercial forks. We chose AGPL-3.0-or-later so
modified network versions remain open. The official hosted experience,
learning content, support, and separate commercial licensing can still be
offered later. No pricing decision is part of the Build Week project.

## Accomplishments that we're proud of

At this foundation milestone, we have:

- locked a judge-readable product thesis;
- reduced the course to a testable three-day scope;
- separated model generation from deterministic correctness;
- created a public, licensed repository during the submission period; and
- established an evidence log before feature implementation began.

Working application claims will be added only after their tests and public
demo exist.

## What we learned

The Build Week README is part of the technical evidence, not an afterthought.
It needs to show where Codex changed the speed or quality of the work, where
the human made the consequential decisions, and how GPT-5.6 contributes to
the product. That means recording failures and rejected ideas while they are
fresh, not inventing a clean story at the deadline.

We also learned that the strongest AI boundary for this product is simple:
the model creates; the parser grades.

## Run locally

The application scaffold has not been committed yet. Exact installation and
run commands will be added with the first working vertical slice.

## Test

No feature tests exist at this foundation milestone. The first code change
must add the grading fixtures together with the vertical slice.

## Build Week evidence

- [Build log](docs/build-log.md)
- [Submission checklist](docs/submission-checklist.md)
- [Repository foundation design](docs/superpowers/specs/2026-07-18-repository-foundation-design.md)
- Primary Codex thread: this project's core-build thread
- `/feedback` Session ID: generated after the majority of core functionality
  is complete and submitted through Devpost, not published here as a claim

## What's next for Nabi Markdown

Markdown is the first code you write with AI. It shouldn't be the first
thing nobody teaches you.

Next: the syntax that agents actually read — AGENTS.md, prompt structure,
spec files. And Korean first, then other languages, because the people who
need this least are the ones who already read English documentation
comfortably.

## License

The code is licensed under the [GNU Affero General Public License v3.0 or
later](LICENSE). See [TRADEMARKS.md](TRADEMARKS.md) for the separate treatment
of the Nabi Markdown name and future visual identity.

Commercial licensing may be offered later. No pricing or commercial terms
have been decided for the Build Week submission.
