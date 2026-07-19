# Build-time generation brief: fenced code-block breadth Batch 014

Generate exactly 24 schema-v2 `standard` Markdown exercises for Nabi Markdown:
12 Level 1 fenced code-block lessons and 12 Level 2 short document rebuilds.
This is an immutable, review-gated Issue #9 batch, never runtime AI output.

This batch considers all four syntax references named in Issue #9's
2026-07-19 refinement:

- https://daringfireball.net/projects/markdown/basics
- https://daringfireball.net/projects/markdown/syntax
- https://www.markdownguide.org/basic-syntax/
- https://markdown.kr/guide.php

The original Markdown pages establish code blocks as a block element, while
the Markdown Guide points readers to the fenced form. Nabi teaches that fenced
form because its visible boundaries are practical for beginners and the
Devpost target surface supports it. This is CommonMark-compatible syntax, not
a GFM-only feature.

Teach a closed fenced code block because fences are practical to type and make
the block boundary visible to a beginner. Require a real parsed code block, a
backtick or tilde fence, a matching closing fence at least as long as its
opener, and meaningful content. Do not require a language tag. Whitespace-only
and default-ignorable-only blocks fail. Text such as `<!-- shown as code -->`
inside a code block is visible literal code and therefore passes; an HTML
comment outside a code block is only a lookalike and fails. Inline code, raw
HTML, indented code, unclosed fences, short closers, and wrong-marker closers do
not satisfy this explicitly fenced lesson. These opt-in requirements leave all
previous `code-block` verdicts unchanged.

Never compare learner wording, target prose, protected content, vocabulary,
case, spelling, punctuation, language tags, or meaning.

Level 1 uses one short familiar line, visible instruction, `introduce` mode,
and the `everyday` vocabulary profile. Level 2 implements the revised
curriculum: rebuild a whole short document that combines one H1, one closed
nonempty fenced code block, and either a blockquote, an unordered list, or an
ordered list. Use four genuinely different everyday variants for each
of those three retry families. The Goal is visible, but learner prose may
differ; only the declared Markdown anatomy is graded.

For every candidate, provide canonical, different-prose, case/spelling,
missing, malformed, matched-with-review, equivalent-fence, and adversarial
parser fixtures. Every match check must have direct failing evidence. The four
links define syntax scope only. Do not crawl them or any third-party site for
vocabulary. Vocabulary is authored in this build-time session and remains
novice-friendly contemporary US English.

Bind all candidates and fixtures to batch
`2026-07-20-l1-code-block-l2-rebuilds-014`, sequence 14, curriculum version
`2026-07-19`, revision 1. Do not publish until real-engine verification, two
declared-independent reviews, and a separate editorial acceptance all pass
against the same frozen manifest.
