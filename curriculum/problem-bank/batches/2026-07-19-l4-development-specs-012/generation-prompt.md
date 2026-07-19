# Batch 012 generation brief — executable development specifications

Generate 12 Standard Markdown Level 4 problems. This batch moves from short
human-readable workplace documents into implementation-facing specifications
that another person can inspect before work begins.

## Batch shape

Create three structural retry families with four genuinely different,
vendor-neutral work scenarios in each family:

1. **Interface feature specification:** H1 and opening paragraph; six H2
   sections for an unordered scope, a dependency paragraph containing one
   explicit descriptive link and one nonempty inline-code span, a direct
   nonempty constraint blockquote, ordered implementation, unordered
   acceptance, and a final direct fenced language-tagged code block.
2. **Bug investigation specification:** H1 and opening paragraph; seven H2
   sections for a direct evidence blockquote followed by a Markdown divider,
   ordered reproduction, unordered constraints, ordered fix plan, unordered
   regression acceptance, a direct nonempty open-decision blockquote, and a
   final unordered verification list containing at least two nonempty
   inline-code spans.
3. **Staged migration specification:** H1 and opening paragraph; six H2
   sections for unordered preconditions, a closed migration section containing
   exactly three H3 headings each followed by one unordered list, ordered
   rollback, unordered acceptance, a direct nonempty open-decision blockquote,
   and a final direct fenced language-tagged code block.

Within a retry family, match checks and teaching metadata use the same anatomy.
Across families, the anatomy must be mechanically different from the other two
families and from the original five-section Level 4 development-spec seeds.

## Pre-freeze product decisions

- Level 4 teaches a document structure that supports implementation. It does
  not certify that the proposed implementation is correct, safe, complete, or
  appropriate.
- The heading-only outline checks deliberately omit lists, quotes, dividers,
  links, and code. This keeps each family-specific failure independently
  reachable instead of letting a generic outline message shadow it.
- The verification code predicate proves only that a parsed code block is
  fenced and language-tagged. It does not execute commands, inspect their
  contents, or require the block to contain visible characters.
- Section checks use heading depth and occurrence. Heading words are examples
  for people and never grading operands.

## Curriculum and editorial constraints

- Use `level: 4`, `teachingMode: "recall"`, `difficulty: "makeover"`,
  `familyId: "executable-development-spec"`, and vocabulary profile
  `development-spec`.
- Keep the Goals long enough to resemble useful development documents while
  remaining readable inside Nabi's equal-size Goal and answer panels. Goal
  length is an authoring rule, never a learner grading predicate.
- Use plain contemporary US English. Explain the structure in learner-facing
  language and keep unavoidable developer terms grounded by the example.
- Use original, vendor-neutral scenarios without brands, real organizations,
  real URLs, personal data, credentials, payments, medical, legal, payroll,
  disciplinary, or other high-stakes claims.
- Keep every ID, target, content variant, vocabulary object, domain, scenario,
  and visible wording distinct within the batch and against all 236 published
  problems.
- Use no images, GFM tables, task lists, external content dependency, runtime
  AI, or network access.
- Keep `protectedContent` empty. These exercises grade Markdown anatomy rather
  than exact prose copied from the Goal.

## Deterministic grading contract

- Grade parsed Markdown structure only. Do not compare heading text, prose,
  vocabulary, spelling, capitalization, punctuation, source length, document
  length, command text, or meaning.
- Address H2 and H3 sections by depth and global occurrence, never by heading
  words.
- Keep the document outline sequence non-exact so extra nonconflicting
  Markdown can remain Matched. Use exact sequences only for the explicitly
  closed evidence, migration-stage, and final-verification anatomies.
- Require the documented H2 count and logical heading-depth order. The staged
  migration family additionally requires exactly three H3 headings.
- Lists are graded by parsed orderedness, direct section placement, item count,
  and the current nonempty-item predicate. Starting number, delimiter,
  capitalization, prose, and technical quality are not graded.
- The current nonempty-list predicate can count parsed HTML or comment content
  even when it presents no visible words. Fixtures must freeze that engine
  boundary; editorial review must still require useful visible Goal items.
- Blockquotes must be direct section children with nonempty parsed content.
  Nabi does not judge whether a constraint, observation, or open decision is
  sensible.
- Interface dependency links require explicit inline Markdown link syntax with
  nonempty readable words and a destination. Reference links, autolinks,
  images, HTML anchors, and inert lookalikes do not qualify. URL safety,
  reachability, wording, and technical relevance are not graded.
- Inline-code checks require parsed, nonempty inline-code spans. They do not
  judge the code's spelling, language, or behavior.
- A divider is any direct parsed CommonMark thematic break in the closed
  evidence section. Its marker style is not graded.
- A fenced verification block needs a language tag and direct placement in its
  closed section. Its language name and contents are not graded or executed.
- An extra H1 remains Matched with the optional `single-h1` Review. Review is
  not a third verdict.
- Do not add, weaken, or reinterpret an engine predicate in this content batch.

## Fixture and publication contract

- Give every candidate canonical, genuinely different-prose, unique
  case/spelling, missing, malformed, and Matched-with-Review roles.
- Give every match check an isolated direct failure that reaches its own
  feedback ID through the real evaluation engine.
- Cover wrong list types and counts, misplaced or nested structures, empty
  quotes, link and inline-code lookalikes, divider lookalikes and order,
  indented, untagged, nested, and empty code blocks, H3 count and closed-stage
  order, alternate Standard Markdown forms, hidden-only list boundaries, and
  extra-valid-Markdown behavior.
- Different-prose fixtures must use another Goal in the same retry family.
- Freeze candidate, fixture, verification, engine-contract, and manifest
  digests before review. Any later candidate, fixture, predicate, engine, or
  manifest change invalidates all review evidence.
- Two declared-independent mechanical reviews and a separate editorial review
  must agree on the exact frozen manifest before all 12 problems publish
  together.
