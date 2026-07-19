# Batch 009 generation brief — Markdown dividers

Generate 24 Standard Markdown problems: 12 Level 1 guided-production exercises
and 12 Level 2 recall exercises.

## Curriculum constraints

- Teach one grammar family only: a CommonMark thematic break, called a
  **Markdown divider** in learner-facing copy.
- Level 1 uses short, age-neutral US English from everyday life. Level 2 uses
  familiar planning, learning, office, and beginner coding situations.
- Every authored Goal is a readable mini-document with one short text block,
  one canonical `---` divider surrounded by blank lines, and another short
  text block.
- Every ID, content variant, target, vocabulary set, and prose pair is unique
  within the batch and against the published bank.
- Do not use decorative filler, brands, personal data, unsafe operations,
  school-only framing, or region-specific assumptions.

## Product contract

- Grading uses parsed `thematicBreak` blocks through the production CommonMark
  engine, never a source regex or Goal-string comparison.
- Accept `---`, `***`, `___`, longer runs, spaced forms, tabs between markers,
  trailing whitespace, and up to three leading spaces when CommonMark parses a
  divider.
- Accept a qualifying divider inside otherwise valid Markdown wrappers such as
  blockquotes or list items. Single-syntax problems do not prescribe placement.
- The authored Goal must remain a useful two-part note, but learner prose,
  capitalization, spelling, punctuation, surrounding block count, and exact
  placement are not grading operands.
- Reject Setext headings, too-short or mixed markers, trailing words, escaped
  and Unicode lookalikes, inline or fenced code, comments, raw HTML, links,
  images, definitions, and other sources that do not parse a thematic break.
- More than one qualifying divider remains Matched with one optional Review;
  verdicts stay binary: Matched or Try again.
- No runtime AI, learner-content network request, randomness, semantic grading,
  or hidden target comparison.

## Fixture contract

- Include canonical, different-prose, case/spelling, all valid marker families,
  spaced/long/indented/trailing-whitespace forms, interrupting forms, nested
  wrappers, multiple-divider Review, Setext precedence, lists, emphasis, code,
  HTML/comments, links/images/definitions, malformed, escaped, and Unicode
  lookalikes.
- Keep different-prose and case/spelling roles independent. Each case/spelling
  fixture is a unique uppercase, one-character spelling variation of that
  problem's own canonical prose.
- Every fixture runs through the production grading engine before review.
- Two declared-independent mechanical reviews and a separate editorial review
  are required before publication.

## Decisions made during authoring

- Images were considered first, then held because the approved curriculum
  requires local-asset and alt-text visual/editorial inspection before that
  family can publish.
- A pre-implementation reviewer proposed requiring a top-level paragraph →
  divider → paragraph sequence. That was not adopted as a learner match rule:
  the approved single-syntax contract says extra valid Markdown and equivalent
  placement pass unless a lesson explicitly declares an anatomy constraint.
  The two-part sequence remains a strict editorial requirement for authored
  Goals.
- Match-side block counting gained an optional `recursive` flag. Its default is
  still root-only, preserving every existing problem; this batch opts in so a
  real nested divider is not falsely rejected.

## Rejected examples during authoring

- A bare `---` Goal — valid learner grammar, but too decorative to be an
  authored human-readable Goal.
- `Part one\n\n---\n\nPart two` — generic filler rather than useful practice.
- `Summary\n\n---\n\nSources` — collides with frozen legacy rule vocabulary.
- “Draw a horizontal line” — teaches appearance instead of document purpose.
- “Add a thematicBreak AST node” — developer language for a beginner lesson.
- A page-break exercise — a Markdown divider separates sections; it does not
  promise print pagination.
- An image exercise — locally blocked until the separate asset and alt-guidance
  inspection is complete.
