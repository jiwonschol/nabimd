# Level 5 North Star: The Agent-Ready Work Order

**Status:** Product north star; outside the current Build Week implementation  
**Source:** A real 210-line Overwater Codex work order supplied by Jiwon during
the first Nabi Markdown MVP review  
**Use policy:** Learn from its structure; do not republish project-specific
content verbatim as a learner exercise.

## The Level 5 outcome

Level 5 is not a larger Markdown editor and it is not generic prompt
engineering. The learner should be able to turn real project intent into a
Markdown work order that a contemporary coding agent can execute and a human
reviewer can audit.

The target artifact is simultaneously:

- readable as a project handoff;
- precise enough for an agent to act without inventing authority;
- explicit about sources of truth and their order;
- bounded by prohibitions and stop conditions;
- testable through commands and observable outcomes; and
- accountable through a defined final report.

This is the long-term version of Nabi's founding claim: Markdown is not merely
formatting. It is a portable structure for thinking with people and AI.

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

## Proposed five-level progression

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

## The Level 5 learning task

Do not ask the learner to reproduce the Overwater document exactly. That would
test transcription and domain familiarity rather than document judgment.

Use a document-makeover challenge:

1. provide a realistic but anonymized bundle of engineering notes;
2. provide a rendered agent-ready Goal;
3. let the learner write or restructure the Markdown source;
4. check structural requirements deterministically; and
5. offer editorial Review for clarity, authority, and human scanability.

The public curriculum should replace Overwater names, paths, services, and
incident details with a fictional project. It may preserve the work-order
anatomy and the fact that the plan follows earlier failed attempts.

## Deterministic evaluation remains possible

Level 5 does not require runtime AI grading. A curated problem can declare:

- required heading levels and section identities;
- required ordering relationships;
- minimum and maximum section counts;
- protected constraints and stop conditions;
- required code fences or command blocks;
- required list structure for stages and prohibitions;
- required verification categories;
- forbidden contradictions or test-bypass language; and
- a required final-report template.

The Markdown AST can determine whether those structures exist. Curated text
checks can protect critical constraints. Editorial checks can then distinguish
Matched from Perfect without pretending there is one exact sentence for every
requirement.

### Matched

The work order contains the required structure, preserves every critical
constraint, and gives the agent a viable execution and verification path.

### Perfect

The same work order is also easy for a human to scan: authority boundaries are
near the actions they constrain, repeated rules are intentional, headings are
descriptive, and the final report maps cleanly to the requested stages.

## UI implications for the long term

The Level 3-sized Goal selected during the first MVP redesign is the minimum
future-facing reference surface. Level 5 will eventually require:

- tall, equal-height source and preview panes;
- scrollable Goal, source, and preview documents;
- stable document position while Hint or Review opens;
- navigation among required sections without turning Nabi into an IDE; and
- clear versioning of the agent conventions being taught.

Those needs validate the current decision to size the layout from a moderate
document rather than a one-line heading. They do not belong in the current H1
implementation milestone.

## Keeping “current best practice” honest

Agent conventions change. A Level 5 problem must carry a curriculum version,
the agent convention set it targets, and a review date. Nabi should teach the
durable reasoning pattern—context, constraints, authority, verification, and
reporting—while periodically revising filenames, tool instructions, and agent
interfaces that become obsolete.

The app should never label one vendor-specific template as a timeless universal
standard.

## Current boundary

For Build Week, the Overwater document is evidence of the product's destination
and a source for future curriculum design. The deployed implementation remains
the existing H1 vertical slice; the only planned implementation change is the
separately reviewed first-exercise redesign. No Overwater content, Level 5
grader, agent integration, or runtime AI call is added now.
