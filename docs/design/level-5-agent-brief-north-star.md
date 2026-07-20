# Historical Level 5 Anatomy: The Agent-Ready Work Order

**Status:** Superseded historical anatomy reference; not a product north star,
current curriculum endpoint, or learner exercise
**Source:** A real 210-line Overwater Codex work order supplied by Jiwon during
the first Nabi Markdown MVP review  
**Use policy:** Learn from its structure; do not republish project-specific
content verbatim as a learner exercise. The anonymized public reference is
[`docs/examples/level-5-agent-work-order-reference.md`](../examples/level-5-agent-work-order-reference.md).

## Historical Level 5 outcome

This section records the former blank-page endpoint. Current Level 5 instead
asks the learner to restore Markdown structure in a short developer-facing
document from a fixed Goal. The longer work order remains useful only as a
source of document anatomy for future, separately approved exploration.

The target artifact is simultaneously:

- readable as a project handoff;
- precise enough for an agent to act without inventing authority;
- explicit about sources of truth and their order;
- bounded by prohibitions and stop conditions;
- testable through commands and observable outcomes; and
- accountable through a defined final report.

This was the original long-form interpretation of Nabi's founding claim. The
current curriculum keeps the useful Markdown anatomy while rejecting its
reading burden and blank-page authorship task.

## Why the Overwater example qualifies

The reference work order describes a real implementation after two failed
design attempts. Its value comes from structure rather than domain length or
technical vocabulary.

| Work-order element | Purpose |
|---|---|
| Mission | Names the repository, architecture decision, and concrete outcome |
| Prior failure context | Explains why an apparently easier implementation was discarded |
| Ordered reading list | Establishes source-of-truth precedence before any edits |
| Comprehension gate | Requires the agent to restate seven critical constraints before acting |
| Staged execution | Gives an autonomous sequence with a verification rhythm |
| Absolute prohibitions | Defines results that must be rejected even if tests pass |
| Immediate stop conditions | Separates safe autonomy from decisions that need the owner |
| Verification contract | Names typechecks, tests, regression searches, and production guards |
| Final report schema | Makes completion evidence predictable and reviewable |
| Repository conventions | Preserves local language, tooling, migration, and commit rules |

The document also demonstrates a more important skill: it distinguishes
**authority** from **autonomy**. The agent may continue through known stages
without waiting, but it must stop when evidence contradicts the plan or when
progress would require new authority.

## Former proposed five-level progression

The progression below is decision history and is not an active curriculum
contract. The definitive ladder is maintained in the
[`five-level problem-bank design`](../superpowers/specs/2026-07-19-five-level-problem-bank-design.md):
Level 4 is short workplace writing and Level 5 is equally approachable,
developer-facing Markdown practice.

### Level 1 — See and produce syntax

Learn one visible pattern at a time. The rule is shown before the learner is
asked to produce it.

Examples: H1 heading, emphasis, list item, link, code span.

### Level 2 — Recall syntax

Reproduce the same skills with new content while the Hint begins closed. The
learner proves that the syntax can be recalled rather than copied.

### Level 3 — Build a readable human document

Combine several syntax families to make a document scannable for another
person. This level introduces hierarchy, one-document-title discipline,
section rhythm, lists, code blocks, and restrained emphasis.

### Level 4 — Write an executable specification

Turn unstructured requirements into a document with scope, dependencies,
constraints, acceptance criteria, verification, and unresolved decisions.
The reader is still primarily human, but the document is precise enough to
support implementation.

### Level 5 — Write an agent-ready work order

Adapt a specification to the current conventions of AI coding agents. Add
ordered context, explicit authority boundaries, staged autonomy, forbidden
shortcuts, stop conditions, regression guards, and a completion-report
contract. The result must remain easy for a human maintainer to inspect.

## Former Level 5 learning task

Do not ask the learner to reproduce the Overwater document exactly. That would
test transcription and domain familiarity rather than document judgment.

The superseded proposal used this document-makeover challenge:

1. provide a realistic but anonymized bundle of engineering notes;
2. provide a rendered agent-ready Goal;
3. let the learner write or restructure the Markdown source;
4. check structural requirements deterministically; and
5. offer editorial Review for clarity, authority, and human scanability.

The proposed public curriculum would have replaced Overwater names, paths,
services, and incident details with a fictional project while preserving the
work-order anatomy and the fact that the plan followed earlier failed attempts.

## Historical deterministic-evaluation rationale

The long-form proposal did not require runtime AI grading. A curated problem
could have declared:

- required heading levels and structural section positions;
- required ordering relationships;
- minimum and maximum section counts;
- required code fences or command blocks;
- required list structure for stages and prohibitions;
- required verification categories;
- a required final-report template.

The Markdown AST could determine whether those structures existed. Curated text
checks do not participate in learner grading: title wording, case, spelling,
punctuation, and semantic truth never affect the verdict. Build-time editorial
inspection would have confirmed that each Goal demonstrated a credible work
order before publication.

### Matched in the former proposal

The work order contained the requested Markdown anatomy. `Matched` was its only
pass state. Optional Review could point out additional Markdown-structure
refinements, but it never created a second grade or revoked Matched.

## Historical UI implications

The former long-document proposal would have required:

- tall, equal-height source and preview panes;
- scrollable Goal, source, and preview documents;
- stable document position while Hint or Review opens;
- navigation among required sections without turning Nabi into an IDE; and
- clear versioning of the agent conventions being taught.

That exploration helped establish internal document scrolling and a constrained
reading measure. It no longer implies that a learner will author a tall work
order; current Level 5 Goals are compact developer documents.

The horizontal reading measure remains deliberately constrained because even a
short developer document becomes harder to scan when lines stretch across an
IDE-sized canvas. This layout rationale survives; the expectation of a much
taller Level 5 work order does not.

## Historical convention-maintenance rationale

The long-form proposal noted that agent conventions change and therefore
required a curriculum version, convention set, and review date. Existing
accepted Level 5 records retain that metadata for digest compatibility. The
current compact developer curriculum may revisit the schema separately; this
historical document does not require every future developer-facing lesson to
teach an agent convention.

The app should never label one vendor-specific template as a timeless universal
standard.

The proposal treated dated agent conventions as a possible reason to return.
That commercial and curriculum direction is not part of the current Build Week
contract.

## Current boundary

For Build Week, the Overwater document is evidence of an explored and rejected
long-form direction. Its project-specific content is not republished, and its
shape is not the product's current destination. Issue #9 implements the short,
fixed-Goal structural curriculum described in the definitive
[`five-level problem-bank design`](../superpowers/specs/2026-07-19-five-level-problem-bank-design.md),
including deterministic Level 5 predicates and compact fictional developer
exercises. No agent integration or runtime AI call is added.
