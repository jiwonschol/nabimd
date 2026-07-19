# Batch 008 generation brief — Markdown links

Generate 24 Standard Markdown problems: 12 Level 1 guided-production exercises
and 12 Level 2 recall exercises.

## Curriculum constraints

- Teach one grammar family only: a Markdown text link with readable label words
  and a meaningful destination.
- Level 1 uses short, age-neutral US English and common everyday reference
  material. It shows the inline `[label](destination)` pattern.
- Level 2 uses workplace and beginner AI/software vocabulary while hiding the
  syntax until Hint is requested.
- Every ID, content variant, target, and vocabulary set must be distinct from
  the accepted bank and the visible teaching example.
- Use only reserved `https://example.com/` destinations in authored Goals.
  Avoid endorsements, personal data, unsafe actions, and live third-party URLs.

## Product contract

- Targets contain exactly one normal inline Markdown link inside a useful,
  human-readable note.
- Grading uses parsed `link` and resolved `linkReference` nodes, not a regex.
- Accept inline links and resolved full, collapsed, or shortcut reference links.
  Reference definitions resolve document-wide using CommonMark's first match.
- Reject URL and email autolinks because they do not exercise a separate,
  descriptive label.
- Require a learner-visible, non-image-only label and a meaningful destination.
  Normalize Unicode and reject values containing only whitespace,
  default-ignorable characters, controls, format characters, or U+2800.
- Inspect raw positioned source before CommonMark substitutes NUL with U+FFFD;
  NUL-only labels and destinations fail while literal U+FFFD remains visible.
- Never grade label text, destination text, meaning, capitalization, spelling,
  punctuation, scheme, host, path, reachability, or exact Goal prose.
- Unsafe but syntactically valid nonempty schemes remain grammar-Matched.
  Rendering is a separate boundary and makes every Goal/Preview link inert.
- More than one qualifying link remains Matched with optional Review; verdicts
  stay binary: Matched or Try again.
- Raw HTML anchors, standalone images, image-only labels, code blocks,
  comments, malformed syntax, and escaped or fullwidth lookalikes do not pass.
- No runtime AI, URL validation, destination fetch, or learner-content request.

## Fixture contract

- Include canonical, different-prose, case/spelling, titles, angle/relative/
  fragment/query destinations, balanced parentheses, all three reference
  forms, identifier normalization, neutral wrappers, visible nested inline
  content, multiple links, unsafe schemes, inert-rendering, Unicode/NUL,
  hidden-only, empty destination, autolink, raw-HTML, image-only, code/comment,
  malformed-delimiter, and lookalike fixtures.
- Keep the different-prose and case/spelling roles independent. Each
  case/spelling fixture must be a unique capitalization and one-character
  spelling variation of that problem's own canonical link label, never one
  shared unrelated phrase reused across the batch.
- Every fixture runs through the production grading engine before review.
- Two declared-independent mechanical reviews and a separate editorial review
  are required before publication.

## Rejected examples during authoring

- `Visit [GitHub](https://github.com).` — an unnecessary real-brand link can
  read as endorsement and adds nothing to grammar practice.
- `Email [Jamie](mailto:jamie@example.com).` — introduces a personal identity
  pattern and a mail destination instead of the requested normal web example.
- `Find details in the [garden guide](https://example.com/garden).` — exactly
  copies the visible teaching example and leaks the guided answer frame.
- `Open the [production reset](https://example.com/work/production-reset).` —
  points a beginner toward a potentially destructive operational action.
- `A Markdown link gives a web address readable words instead of showing the
  full address.` — rejected after the first frozen manifest because the missing
  connector makes the learner-facing rule ungrammatical. The corrected rule
  says a link “connects readable words to a web address.”
- `Use [COMPLETELY DIFFRENT WORDS](https://changed.example/now).` repeated for
  every case/spelling fixture — rejected after the second frozen manifest. It
  proved the broader different-prose policy again but did not isolate
  capitalization and spelling against each problem's own label. The final
  fixtures use 24 distinct canonical-label variations.
