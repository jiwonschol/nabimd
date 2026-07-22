# Batch 021: compact Level 4 workplace notes

Generate exactly 12 append-only schema-v2 Level 4 problems in four retry
families with three content variants each:

- three shift handoff notes;
- three team decision notes;
- three short checklists; and
- three status update notes.

The batch replaces the learner-facing role of the long development-spec and
contract-spec documents. Level 4 means "write for work," not "do office work."
Every Goal is a fictional, non-sensitive miniature that a learner can read at
a glance and finish in roughly one to three minutes. Difficulty comes from
combining and placing Markdown syntax, never from prose volume, domain
knowledge, or typing stamina.

## Frozen family anatomy

### Shift handoff notes

Use exactly this block order:

1. one H1 title;
2. one short context paragraph;
3. a `Today` H2 with exactly two visible bullet items; and
4. a `Tomorrow` H2 with exactly two visible bullet items.

### Team decision notes

Use exactly this block order:

1. one H1 title;
2. one short context paragraph;
3. a `Decision` H2 with one nonempty blockquote; and
4. a `Steps` H2 with exactly three visible ordered items.

### Short checklists

Use exactly this block order:

1. one H1 title;
2. one short context paragraph; and
3. one H2 section with exactly three visible bullet items, one of which
   wraps its command in nonempty inline code.

### Status update notes

Use exactly this block order:

1. one H1 title;
2. one short context paragraph containing one nonempty bold span;
3. a `Done` H2 with exactly two visible bullet items; and
4. a `Next` H2 with exactly two visible ordered items.

## Hard limits

- At most 16 authored lines and 120 words per Goal, including blank lines.
- Exactly one `document-limits` match check per problem with `maxLines: 16`.
- One block-sequence check pins the family anatomy exactly.
- Grade Markdown structure only; prose, case, and spelling never change the
  verdict. Editorial review may note italics but never affects pass or fail.
- Vocabulary stays everyday and workplace-flavored: reception desks, cafes,
  libraries, studios, workshops, kiosks, printers, newsletters, and signage.
- Every problem ships the six required fixture roles plus direct exercising
  evidence for every match check and one CRLF normalization edge case.
