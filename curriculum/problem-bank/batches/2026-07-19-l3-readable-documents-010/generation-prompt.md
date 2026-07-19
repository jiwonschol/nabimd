# Batch 010 generation brief — readable workplace documents

Generate 12 Standard Markdown Level 3 problems. The batch is a bounded pilot
for the transition from isolated syntax recall to documents another person can
scan.

## Batch shape

Create three structural retry families with four genuinely different content
variants in each family:

1. **Status or handoff note:** one H1 and opening paragraph; an H2 section with
   a paragraph containing restrained bold emphasis; then an H2 section with an
   unordered list of at least three next steps.
2. **How-to note:** one H1 and opening paragraph; an H2 section with an
   unordered preparation list of at least three items; then an H2 section with
   an ordered list of at least three steps and meaningful inline code in that
   second H2 section. Authored Goals place the code inside a step.
3. **Decision record:** one H1 and opening paragraph; an H2 context section
   with a paragraph; an H2 decision section with a nonempty blockquote; then an
   H2 action section with an unordered list of at least three items.

Within a retry family, match checks and teaching metadata use the same document
anatomy. Across families, the anatomy must be visibly and mechanically
different. Do not group unrelated structures under one retry family merely
because they are all Level 3.

## Curriculum and editorial constraints

- Use `level: 3`, `teachingMode: "recall"`, `difficulty: "makeover"`,
  `familyId: "readable-human-document"`, and vocabulary profile
  `workplace-document`.
- Use plain contemporary US workplace English: recap, owner, due date, draft,
  review, shared folder, schedule, customer request, handoff, and next steps are
  appropriate examples.
- Avoid jargon, unexplained acronyms, brands, personal data, real organizations,
  legal/medical/payroll/disciplinary situations, and Level 5 agent-contract
  terms such as authority boundary, forbidden shortcut, or stop condition.
- Keep each authored Goal approximately 55–100 words. This is an editorial
  authoring constraint, never a learner grading predicate.
- All 12 IDs, targets, content variants, vocabulary sets, and scenarios must be
  unique within the batch and against the 212 published problems. Do not
  rephrase the existing weekly handoff, customer feedback, meeting decision,
  or new teammate guide seeds.
- Use no images, GFM tables, task lists, thematic-break quota, decorative
  filler, or external content dependency.

## Deterministic grading contract

- Grade only parsed Markdown structure through the production engine. Do not
  compare heading text, Goal prose, vocabulary, spelling, capitalization,
  punctuation, line count, source length, or semantic meaning.
- Address sections only by H2 depth and occurrence, never by heading words.
- Section-scoped inline checks cannot require inline code to be inside a
  particular list item. The how-to matcher therefore requires meaningful
  inline code anywhere in the second H2 section; editorially authored Goals
  still demonstrate the preferred placement inside an ordered step.
- Use `block-sequence`, document-level H2 `block-count`,
  `heading-depth-order`, and the existing section-scoped structural predicate
  appropriate to the family.
- `block-sequence` remains non-exact so extra otherwise-valid Markdown does not
  fail a learner.
- One extra H1 remains Matched with the existing optional `single-h1` Review;
  Review is not a third verdict.
- Do not add or weaken engine predicates in this batch. In particular, do not
  claim that paragraph meaning or bold wording is machine-validated.
- The existing `list-shape` predicate treats parsed HTML/comment node values as
  nonempty list-item content even when the preview has no visible words. Issue
  #9 forbids changing existing verdict semantics in this content batch, so
  explicit fixtures preserve that boundary. Editorial review still requires
  visible, useful list items in every authored Goal; Nabi does not claim to
  validate their meaning.
- No runtime AI, network request, randomness, semantic grading, spelling
  correction, or target-string comparison.

## Fixture and publication contract

- Every problem receives canonical, genuinely different-prose, unique
  case/spelling, missing, malformed, and Matched-with-Review fixtures.
- Give every match check direct isolated failure evidence.
- Add wrong-section, wrong list type/count, code/HTML/lookalike, heading-order,
  and archetype-specific parser collisions. Extra nonconflicting Markdown must
  remain Matched.
- Different-prose fixtures must preserve the same retry-family anatomy; do not
  borrow a different archetype as a shortcut.
- All fixtures run through the real production engine before review.
- Two declared-independent mechanical reviews and a separate editorial review
  must agree on the exact frozen manifest before publication.

## Autonomous sizing decision

The initial curriculum proposal allowed 24 Level 3 documents. The engine audit
confirmed that the existing predicate set can express them, but recommended
two 12-problem immutable batches. Composite documents carry more interacting
checks than single-syntax exercises, and one ambiguous candidate would
invalidate the whole frozen batch. Batch 010 therefore uses three anatomies ×
four variants; Batch 011 can add the next three anatomies after this review
cycle proves the contract.
