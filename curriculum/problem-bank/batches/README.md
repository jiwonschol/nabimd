# Schema-v2 batch evidence

Each child directory is immutable after it lands. A batch contains:

- `generation-prompt.md` — the exact build-time GPT-5.6 prompt;
- `candidates.raw.json` — schema-v2 authoring output;
- `candidates.normalized.json` — deterministic normalization with `standard`
  flavor and content digests;
- `fixtures.json` — canonical, different-prose, case-spelling-variation,
  missing, malformed, matched-with-review, direct-check, and applicable
  collision cases;
- `verification.json` — transcript digests produced through the real-engine
  adapter;
- `review-manifest.json` — the frozen scope for independent review;
- `reviews/*.json` — at least two distinct reviewer and run records;
- `editorial.json` — the separate vocabulary and policy decision; and
- `summary.generated.json` — generated counts and the final batch digest.

Changing any accepted evidence creates a new batch. A baseline tracker rejects
removal or mutation of an already recorded batch. Schema-v1 candidates are not
copied here or promoted automatically.

## Published batches

- `2026-07-19-milestone-1-foundation-001` — 20 accepted problems and 184
  real-engine fixtures across Levels 1–5.
- `2026-07-19-l1-l2-headings-002` — 24 accepted H1 vocabulary variants and 192
  real-engine fixtures, bringing Levels 1 and 2 to 16 problems each.
- `2026-07-19-l1-l2-emphasis-003` — 24 accepted bold-emphasis variants and 216
  real-engine fixtures. Standard `**phrase**` and `__phrase__` forms both pass;
  multiple bold spans remain Matched with an optional structural Review.
- `2026-07-19-l1-l2-lists-004` — 24 accepted bullet-list variants and 360
  real-engine fixtures. Standard `-`, `*`, and `+` markers pass; wording,
  capitalization, spelling, and exact item text are not graded.
- `2026-07-19-l1-l2-ordered-lists-005` — 24 accepted ordered-list variants and
  624 real-engine fixtures. CommonMark period and parenthesis delimiters,
  repeated `1.` markers, and non-one starts pass; wording, capitalization,
  spelling, and exact numbers are not graded.
- `2026-07-19-l1-l2-blockquotes-006` — 24 accepted blockquote variants and 672
  real-engine fixtures. CommonMark no-space markers, up to three leading
  spaces, lazy continuation, and nested quotes pass; empty or hidden-only
  content and code or HTML lookalikes do not.
- `2026-07-19-l1-l2-inline-code-007` — 24 accepted inline-code variants and 912
  real-engine fixtures. Alternate backtick runs, nested inline contexts, and
  grammar-only wording changes pass; empty or invisible-only spans and code,
  HTML, image-alt, definition, autolink, and lookalike forms do not.
- `2026-07-19-l1-l2-links-008` — 24 accepted inline-link variants and 2,304
  real-engine fixtures. Direct and resolved reference links pass without
  grading label wording, capitalization, spelling, or destination text;
  autolinks, empty or hidden labels and destinations, and code, image-only,
  HTML-only, malformed, or lookalike forms do not.
- `2026-07-19-l1-l2-thematic-breaks-009` — 24 accepted Markdown-divider
  variants and 1,272 real-engine fixtures. All CommonMark marker families,
  spaced and longer forms, and nested valid dividers pass without prose
  grading; Setext headings, code, HTML, comments, malformed markers, and
  lookalikes do not. Extra dividers stay Matched with one optional Review.
- `2026-07-19-l3-readable-documents-010` — 12 accepted Level 3 status or
  handoff notes, how-to notes, and decision records with 212 real-engine
  fixtures. Each anatomy has four different workplace variants for transfer.
- `2026-07-19-l3-composite-documents-011` — 12 accepted Level 3 meeting
  agendas, reference notes, and recommendation briefs with 252 real-engine
  fixtures. Grading checks document structure without grading prose or meaning.
- `2026-07-19-l4-development-specs-012` — 12 accepted Level 4 interface
  feature specs, bug investigations, and staged migration plans with 488
  real-engine fixtures. Verification commands are never executed; the grader
  checks only the documented Markdown anatomy.

Mechanical preparation writes only the new batch directory. Publication
recompiles the global runtime projection and tracker from every accepted batch;
it never rewrites an older batch summary.
