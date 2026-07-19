# Batch 006 generation brief — blockquotes

Generate one coherent schema-v2 expansion batch for Nabi Markdown.

## Scope

- 24 `standard` problems: 12 Level 1 guided-production exercises and 12 Level 2 recall exercises.
- Teach one grammar family only: a Markdown blockquote containing learner-visible content.
- Level 1 uses short, familiar everyday callouts and shows the syntax pattern.
- Level 2 uses recognizable everyday and beginner workplace notices while hiding the syntax until Hint is requested.
- Every ID, content variant, target, and vocabulary set must be distinct from the accepted bank.

## Product contract

- Targets and teaching examples show the portable `> ` form.
- Grading uses the parsed blockquote node, not a source regex. CommonMark no-space markers, up to three leading spaces, lazy continuation, nested blockquotes, and blockquotes inside neutral containers remain valid.
- Require learner-visible content owned by a candidate blockquote. Text, inline code, code blocks, and nonempty image alt count; whitespace, default-ignorable characters, empty image alt, definitions, thematic breaks, HTML source, and descendant-blockquote-only content do not.
- Never grade wording, meaning, capitalization, spelling, punctuation, or exact Goal text.
- More than one blockquote remains Matched with optional Review; verdicts stay binary: Matched or Try again.
- No runtime AI or learner-content network request.

## Evidence requirements

- Run every candidate through the real parser and grading engine.
- Include canonical, changed-prose, case/spelling, no-space, indentation, lazy-continuation, nested, multiple-blockquote, image-alt, heading/list/code content, neutral-wrapper, empty/hidden content, escaped/fullwidth marker, code-lookalike, and raw-HTML fixtures.
- Freeze the mechanical manifest before review.
- Require two digest-bound independent reviews and one separate editorial decision covering clarity, level fit, vocabulary fit, prompt/Goal coherence, hint quality, grammar-only fairness, retry variety, and novice-facing language.
