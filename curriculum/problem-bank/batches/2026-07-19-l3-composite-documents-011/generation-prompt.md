# Batch 011 generation brief — composite workplace documents

Generate 12 Standard Markdown Level 3 problems. This batch continues the
transition from isolated syntax recall to short documents another person can
scan and use.

## Batch shape

Create three structural retry families with four genuinely different US
workplace variants in each family:

1. **Meeting agenda:** H1 and opening paragraph; an H2 purpose paragraph with
   a direct Markdown divider in that first H2 section; an H2 ordered agenda of
   at least three items; then an H2 unordered preparation list of at least
   three items.
2. **Reference note:** H1 and opening paragraph; an H2 paragraph containing a
   Markdown link with readable words and a destination plus a direct divider
   in that first H2 section; then an H2 with a direct nonempty blockquote.
3. **Recommendation brief:** H1 and opening paragraph; an H2 unordered list of
   at least three options; an H2 with a direct nonempty blockquote; then an H2
   ordered list of at least three next steps.

Within a retry family, match checks and teaching metadata use the same anatomy.
Across families, the anatomy must be mechanically different from the other two
families and from Batch 010 status/handoff, how-to, and decision records.

## Pre-freeze product decision

A fenced copy-ready template was prototyped and rejected before this manifest
was frozen. The production `code-block` predicate can require a fence but
cannot require visible, nonempty contents. Calling an empty-but-matched fence
"copy-ready" would promise more than the grammar-only grader proves. The
recommendation brief replaces that family without changing the engine.

## Curriculum and editorial constraints

- Use `level: 3`, `teachingMode: "recall"`, `difficulty: "makeover"`,
  `familyId: "readable-human-document"`, and vocabulary profile
  `workplace-document`.
- Keep each Goal between 55 and 100 prose words. This is an authoring rule, not
  a learner grading predicate.
- Use plain contemporary US workplace English without brands, personal data,
  legal, medical, payroll, disciplinary, or high-stakes claims.
- Keep every ID, target, content variant, vocabulary object, scenario, heading
  frame, and list wording distinct within the batch and against the 224
  published problems.
- Refer to the learner-facing family as a **reference note**, not a source note;
  "Source" already names the editor view in the product.
- Use no images, GFM tables, task lists, external content dependency, or
  runtime AI.

## Deterministic grading contract

- Grade parsed Markdown structure only. Do not compare heading text, prose,
  vocabulary, spelling, capitalization, punctuation, source length, or meaning.
- Address H2 sections by depth and occurrence, never by heading words.
- Keep `block-sequence` non-exact so extra nonconflicting Markdown can remain
  Matched.
- Require exactly the documented H2 count and logical heading-depth order.
- A divider is any direct CommonMark thematic break in the first H2 section;
  exact marker text and exact position after the paragraph are not graded.
- A reference link may be direct or resolved reference syntax. It needs
  nonempty readable words and a destination. Autolinks do not qualify. Scheme,
  host, reachability, safety, title, wording, case, and spelling are not graded,
  and the renderer remains inert.
- Lists are graded by parsed orderedness and direct item count. Starting number,
  numbering sequence, delimiter, capitalization, prose, and semantic quality
  are not graded.
- The existing list predicate counts parsed HTML/comment node values as
  nonempty even when they have no visible words. Explicit Matched fixtures
  freeze this boundary; editorial review still requires useful visible items.
- Blockquotes must be direct section children with nonempty parsed content.
  Nabi does not judge whether a takeaway or recommendation is correct.
- An extra H1 remains Matched with the optional `single-h1` Review. Review is
  not a third verdict.
- Do not add, weaken, or reinterpret an engine predicate in this content batch.

## Fixture and publication contract

- Freeze 21 real-engine fixtures per candidate: 252 total.
- Every candidate receives canonical, genuinely different-prose, unique
  case/spelling, missing, malformed, and Matched-with-Review roles.
- Give every match check an isolated direct failure.
- Cover wrong-section, wrong list type/count, divider/link/blockquote
  lookalikes, alternate CommonMark markers, hidden-only list boundaries,
  heading order, and extra-valid-Markdown behavior.
- Different-prose fixtures must use a different Goal in the same retry family.
- Two declared-independent mechanical reviews and a separate editorial review
  must agree on the exact frozen manifest before all 12 publish together.
