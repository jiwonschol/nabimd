# Batch 016 generation prompt

Create exactly 12 schema-v2 `standard` Level 2 Markdown document rebuilds for Nabi Markdown.

This batch considers all four syntax references named in Issue #9's 2026-07-19 refinement:

- https://daringfireball.net/projects/markdown/basics
- https://daringfireball.net/projects/markdown/syntax
- https://www.markdownguide.org/basic-syntax/
- https://markdown.kr/guide.php

The links define the portable basic-list syntax surface; they are not vocabulary sources. This batch extends the already-published ordered and unordered list lessons into practical nested-list documents without claiming complete Markdown or GFM coverage.

- Author three retry families of four: nested checklists with root anatomy H1, paragraph, unordered list; nested outlines with H1, H2, paragraph, unordered list; and nested steps with H1, paragraph, ordered list.
- Require exactly one top-level list containing exactly one descendant list. Require at least two nonempty items in the top-level list.
- Require the top-level list's ordered or unordered kind, but deliberately accept any valid marker kind for the descendant list.
- Use short, distinct, natural US-English everyday scenarios. Every teaching example must differ from every Goal target.
- Teach learners to “nest one list inside another” without claiming that parent and child markers must match.
- Accept different prose, capitalization, spelling, punctuation, valid indentation, and alternative list markers whenever the Markdown grammar and document shape match.
- Reject flat lists, insufficient indentation, extra list depth or sibling lists, wrong root order, missing or undersized root lists, extra root blocks, code lookalikes, and blockquote-only nested lists.
- Use only existing CommonMark engine checks. Do not add GFM, HTML, images, runtime AI, network calls, exact-string matching, or vocabulary crawling.
- Preserve every Issue #50-owned scheduling, session, progress, and heading-flow path unchanged.
- Defer paragraph-separation lessons because Level 1 scheduling would require the forbidden taxonomy paths.

Freeze authored candidates and comprehensive real-engine adversarial fixtures before any reviewer or editorial evidence exists. Publication requires two declared-independent unanimous mechanical reviews and one separate unanimous editorial verdict set.
