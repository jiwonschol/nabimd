# Batch 005 generation brief — ordered lists

Generate one coherent schema-v2 expansion batch for Nabi Markdown.

## Scope

- 24 `standard` problems: 12 Level 1 guided-production exercises and 12 Level 2 recall exercises.
- Teach one grammar family only: an ordered Markdown list with at least three nonempty items.
- Level 1 uses short, familiar everyday procedures and shows the syntax pattern.
- Level 2 uses recognizable everyday and beginner workplace procedures while hiding the syntax until Hint is requested.
- Every ID, content variant, target, and vocabulary set must be distinct from the accepted bank.

## Product contract

- Targets and teaching examples show the portable `1.`, `2.`, `3.` period style.
- Grading uses the parsed ordered-list node, not literal numerals. Repeated `1.`, non-one starts, nonsequential numbers, and the CommonMark parenthesis delimiter remain valid.
- Require at least three structurally nonempty items in one list node.
- Do not aggregate items across separate lists.
- Neutral wrappers such as blockquotes may contain the answer, but an ordered list nested beneath an unordered-list ancestor must not satisfy the lesson.
- Never grade wording, meaning, capitalization, spelling, punctuation, item order, exact numeral values, or exact Goal text.
- More than one list group remains Matched with optional Review; verdicts stay binary: Matched or Try again.
- No runtime AI or learner-content network request.

## Evidence requirements

- Run every candidate through the real parser and grading engine.
- Include canonical, changed-prose, case/spelling, repeated-number, parenthesis, nonsequential-number, blockquote, image-alt, empty-item, wrong-list-family, opposite-ancestor nesting, split-list, code-lookalike, same-family nesting, and multiple-list fixtures.
- Freeze the mechanical manifest before review.
- Require two digest-bound independent reviews and one separate editorial decision covering clarity, level fit, vocabulary fit, prompt/Goal coherence, hint quality, grammar-only fairness, retry variety, and novice-facing language.
