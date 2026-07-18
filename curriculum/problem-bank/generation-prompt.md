# GPT-5.6 curriculum generation prompt

Generate a staged English-first Markdown curriculum artifact for Nabi Markdown.
Produce exactly 16 short US-English exercises for each of these eight common
Devpost Markdown families: headings, emphasis, lists, blockquotes, inline code,
horizontal rules, links, and images.

For every candidate, provide a stable kebab-case ID, concise learner-facing
text, the intended Markdown target, the expected skill, a likely malformed
trap, and an editorial note. Give every family a reusable concept, how-to, and
inline example. Prefer familiar subjects and natural American educational
copy. Use official destinations for links and reserved local asset paths with
descriptive alt text for images. A horizontal-rule target must preserve prose
on both sides of the rule. Do not use exact-string grading assumptions. Mark
whether the current deterministic engine can grade the exercise without a new
predicate. The current engine supports only top-level hash H1 headings.

This is generation input, not publication approval. Preserve unsupported
candidates for later engine work, but do not put them in the runtime bank.
Every publishable candidate must later pass the real fixture engine, two
independent digest-bound reviews, and the editorial queue.
