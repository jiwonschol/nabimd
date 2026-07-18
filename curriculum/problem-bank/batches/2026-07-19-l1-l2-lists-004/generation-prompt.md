# Build-time generation brief: Level 1–2 bullet-list expansion

Generate exactly 24 schema-v2 `standard` Markdown exercises for Nabi Markdown:
12 at Level 1 and 12 at Level 2. This is an immutable, review-gated batch for
Issue #9, not runtime AI output.

Every exercise asks the learner to write one bullet list containing at least
three nonempty items. Grade parsed Markdown list structure only. Never compare
the learner's words with the Goal, protected content, vocabulary terms,
capitalization, spelling, punctuation, meaning, item order, or exact item
count. Standard `-`, `*`, and `+` bullet markers all produce a Matched answer.
Numbered lists, plain lines, missing marker spaces, empty items, raw marker text
inside code, and other lookalikes do not satisfy this bullet-list exercise.

The requested list may appear inside another valid Markdown wrapper because
the lesson checks whether the bullet-list grammar exists, not whether it is a
root block. More than one list group remains Matched but may produce the
nonblocking `keep-one-list` Review. Review can never revoke Matched and must not
judge prose, marker choice, or extra valid items.

Level 1 uses familiar concrete nouns, visible guidance, `introduce` mode, and
the `everyday` vocabulary profile. Level 2 uses short familiar actions and
routines, request-only Help, `recall` mode, and the `everyday-recall` profile.
Avoid specialist, corporate, brand, quotation, lyric, and culture-dependent
language. The Goal is an example of the requested structure, never copy text.

For each candidate, provide 15 deterministic fixtures: canonical, unrelated
prose, changed case/spelling, asterisk markers, plus markers, a list inside a
blockquote, plain lines, missing spaces, a numbered-list collision, a two-item
list, marker text inside inline code, three empty items, and multiple list
groups with the optional Review, a list of image-alt items, and a list of
empty-alt images. Bind every candidate and fixture to batch
`2026-07-19-l1-l2-lists-004`, curriculum version `2026-07-19`, and revision 1.

Do not web crawl. Do not publish any candidate until real-engine verification,
two independent reviews, and a separate eight-dimension editorial acceptance
all pass against the same frozen manifest.
