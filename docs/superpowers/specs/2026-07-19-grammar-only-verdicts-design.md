# Grammar-only verdicts

**Date:** 2026-07-19  
**Status:** Approved in the Build Week product session

## Goal

Nabi teaches Markdown structure, not English capitalization, spelling, or
faithful copying. A learner passes when the requested Markdown construct is
present in the requested form.

## Verdict contract

The learner sees exactly two verdicts:

- **Try again** — the requested Markdown construct is absent or malformed.
- **Matched** — the requested Markdown construct is valid. This is a pass and
  Next is available.

`Perfect` is removed. Editorial observations may accompany a Matched verdict,
but they never create another grade.

For the Level 1 hash-H1 exercise, `# apple`, `# aple`, and `# Banana` all
receive Matched. `Apple`, `## Apple`, `#Apple`, raw HTML, and a Setext heading
receive Try again because they do not use the requested top-level hash-H1
form.

## Prose policy

- Preserve exactly what the learner typed; never auto-capitalize or rewrite it.
- Do not compare prose case, spelling, punctuation, or wording for grading.
- Do not expose spelling or capitalization differences in Review.
- The Goal supplies a human-readable example, not a string-matching answer key.

## Editorial review

Review evaluates Markdown document structure only. For the current heading
family, multiple H1 document titles may produce a review item while the verdict
remains Matched. Extra prose, different wording, inline emphasis, links, and
case differences do not create a review item merely because they differ from
the Goal.

## Compatibility

The internal `fail` discriminator may remain for stable session control, but
the user-facing label is `Try again`. All passing evaluations use the internal
`matched` discriminator. Existing retry/transfer behavior remains tied only to
failed Markdown syntax.

