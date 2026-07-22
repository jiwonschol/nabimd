# Batch 020: compact Level 5 developer forms

Generate exactly 12 append-only schema-v2 Level 5 problems in three retry
families with four content variants each:

- four compact README quick starts;
- four compact bug reports; and
- four compact pull-request descriptions.

The batch broadens Level 5 beyond agent work orders. Level 5 means "write for
developers," not "complete a difficult final exam." Every Goal is a fictional,
non-sensitive miniature that a learner can understand at a glance and finish in
roughly one to three minutes. Difficulty comes from combining and placing
Markdown syntax, never from prose volume, domain knowledge, or typing stamina.

## Frozen family anatomy

### README quick starts

Use exactly this block order:

1. one H1 title;
2. an `Install` H2 with one closed, nonempty, language-tagged fenced command;
3. a `Try it` H2 with exactly two visible ordered items;
4. exactly two nonempty inline-code spans in the `Try it` section; and
5. one descriptive Markdown link.

### Bug reports

Use exactly this block order:

1. one H1 title;
2. an `Observed` H2 with one nonempty blockquote;
3. a `Reproduce` H2 with exactly two visible ordered items; and
4. an `Evidence` H2 with one closed, nonempty, language-tagged fenced block and
   one nonempty inline-code command.

### Pull-request descriptions

Use exactly this block order:

1. one H1 title;
2. a `Change` H2 with exactly two visible bullet items and one nonempty
   inline-code file or symbol;
3. a `Boundary` H2 with one nonempty blockquote; and
4. a `Verify` H2 with one closed, nonempty, language-tagged fenced command and
   one descriptive Markdown link.

## Authoring contract

- Keep every Goal compact, normally 14-22 physical lines, and always at or
  below 40 lines and 165 authored words.
- Include exactly one `document-limits` match check with `maxLines: 40` on every
  candidate.
- Use only existing engine predicates. Do not change runtime grading semantics.
- Grade Markdown structure only. Do not grade prose, capitalization, spelling,
  punctuation, labels, paths, command meaning, or domain truth.
- Keep `protectedContent: []`, derive the starter at the runtime projection
  boundary, and preserve the Goal's words, blank lines, and line breaks.
- Use the required Level 5 convention and `agent-workflow` vocabulary profile.
- Accept equivalent supported CommonMark forms, including reference links where
  the existing link predicate accepts them.
- Do not use task lists, images, tables, raw HTML, runtime AI, or web-crawled
  vocabulary.
- Keep candidate IDs, content variants, teaching examples, and vocabulary term
  sets distinct from the published bank and from one another.

## Verification contract

For every candidate, freeze canonical, different-prose, case/spelling, missing,
malformed, and matched-with-review fixtures, plus one isolated direct failure
for every match check. Add equivalent CommonMark and over-limit edge cases where
relevant. Replay every fixture through the real `evaluateProblem` engine and
check all collision dimensions against the published bank.

The batch may publish only after two declared-independent mechanical reviews
and one separate editorial review accept the exact frozen manifest. Quantity
never overrides the verification or editorial gate.
