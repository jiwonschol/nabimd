# Batch 007 generation brief — inline code

Generate 24 Standard Markdown problems: 12 Level 1 guided-production exercises
and 12 Level 2 recall exercises.

## Curriculum constraints

- Teach one grammar family only: a meaningful inline code span.
- Level 1 uses short, age-neutral US English with familiar files, keys, values,
  and safe beginner commands. It shows the syntax pattern.
- Level 2 uses recognizable everyday, workplace, and beginner AI/software
  language while hiding the syntax until Hint is requested.
- Every ID, content variant, target, and vocabulary set must be distinct from
  the accepted bank.
- Reject destructive commands, platform-specific shortcuts, school-only
  framing, and unnecessary programmer jargon.

## Product contract

- Targets show one short item wrapped in backticks inside a useful human note.
- Grading uses parsed `inlineCode` nodes, not a source regex.
- Require learner-visible code-span content. Normalize Unicode and reject spans
  containing only whitespace, default-ignorable characters, controls, format
  characters, or the blank braille cell.
- Inspect the raw source span before CommonMark substitutes NUL with the visible
  replacement character; NUL-only content must still fail.
- Longer matching delimiter runs, literal backticks, delimiter padding,
  multiline spans, and neutral Markdown wrappers remain valid CommonMark.
- Character references inside code spans remain literal visible text and match.
- Never grade wording, token choice, meaning, capitalization, spelling,
  punctuation, or exact Goal text.
- More than one inline code span remains Matched with optional Review; verdicts
  stay binary: Matched or Try again.
- Raw HTML, code blocks, image alt text, definitions, autolinks, comments, and
  escaped or lookalike delimiters do not satisfy the inline-code requirement.
- No runtime AI or learner-content network request.

## Fixture contract

- Include canonical, different-prose, case/spelling, longer-delimiter,
  literal-backtick, padding, multiline, neutral-wrapper, multiple-span,
  empty-plus-real, hidden-content, malformed-delimiter, code-block, raw-HTML,
  image-alt, definition, autolink, comment, and Unicode-lookalike fixtures.
- Every fixture runs through the production grading engine before review.
- Two declared-independent mechanical reviews and a separate editorial review
  are required before publication.

## Rejected examples during authoring

- `Save your homework as homework.md.` — school-specific rather than age-neutral.
- `Press Command-S to save.` — platform-specific.
- `Run rm notes.md.` and any `sudo` example — destructive or unsafe.
- `Set enabled to true.` — avoidable jargon for this level.
- `Run date to show the date.` — platform behavior is not consistent; on
  Windows the command enters a date-setting flow.
- `Open list.txt.` — too close to the visible teaching example `Open notes.txt.`
  and therefore weak guided production.
