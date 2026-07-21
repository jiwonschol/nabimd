# Batch 019 generation prompt

Create exactly four schema-v2 `standard` Level 1 Markdown warmups that teach
the relationship between a bullet marker and indentation. This is the smallest
coherent response to Issue #9's added Level 1 breadth requirement; do not pad
the bank with a second near-duplicate family merely to raise the total.

Each Goal is exactly three short lines: one unordered-list item containing one
unordered child list with exactly two visible items. Keep each Goal at or below
ten learner-visible words. Use familiar US-English nouns from ordinary life,
and keep every teaching example distinct from every Goal.

Teach the simplest source form: `- ` before every item and two spaces before
each child marker. Grade the parsed Markdown structure rather than literal
characters. Equivalent valid unordered markers and CommonMark indentation,
including four spaces or a tab, must pass. Ordered roots or children, flat
lists, extra nesting, invisible child items, and fenced lookalikes must fail.

Grade Markdown grammar only. Do not grade prose, capitalization, spelling,
punctuation, or literal spacing. Keep `protectedContent: []`, expose only the
existing `unordered-list` scheduling skill, derive the plain-text starter from
the fixed Goal, and use no runtime AI, network access, exact-string matching,
vocabulary crawling, task lists, or images.

Freeze canonical, different-prose, case/spelling, missing, malformed,
matched-with-review, direct-check, alternative-marker, four-space, tab,
ordered-list, excessive-depth, invisible-item, and fenced-lookalike fixtures
before review. Publication requires two declared-independent unanimous
mechanical reviews and one separate unanimous editorial verdict set.
