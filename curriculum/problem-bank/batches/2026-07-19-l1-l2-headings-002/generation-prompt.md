# Build-time generation brief: Level 1–2 H1 vocabulary expansion

Generate exactly 24 schema-v2 `standard` Markdown exercises for Nabi Markdown:
12 at Level 1 and 12 at Level 2. This is an immutable, review-gated batch for
Issue #9, not runtime AI output.

Use only the existing ATX H1 skill and grading engine. Every exercise must ask
the learner to produce one main heading with `# ` at the start of a line. The
three blocking checks are Markdown structure only: a separating space after
the hash, hash-style rather than Setext-style heading syntax, and H1 rather
than a different heading depth. A second H1 may create a nonblocking document
title review, but it must remain Matched.

Never grade target wording, capitalization, spelling, punctuation, prose
meaning, document length, or technical truth. Include passing counterexamples
with unrelated prose and changed case/spelling, plus direct failing fixtures
for every structural check.

Level 1 uses short, familiar everyday noun phrases with visible guidance and
the `everyday` vocabulary profile. Level 2 uses familiar action and routine
phrases, hides Help by default through recall teaching mode, and uses the
`everyday-recall` profile. All IDs, content variants, and displayed phrases
must be unique within the batch and must not duplicate the foundation batch.

For each candidate, provide eight deterministic fixtures: canonical,
different prose, case/spelling variation, missing hash, missing space, Setext
collision, wrong H2 depth, and Matched with the optional second-H1 review.
Bind every candidate and fixture to batch
`2026-07-19-l1-l2-headings-002`, curriculum version `2026-07-19`, and revision
1. Do not publish any candidate until real-engine verification, two independent
reviews, and separate eight-dimension editorial acceptance all pass.
