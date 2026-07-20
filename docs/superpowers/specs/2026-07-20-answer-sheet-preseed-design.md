# Answer Sheet Prose Pre-seed Design

**Status:** Historical implementation record; Levels 3–5 blank-composition
boundary superseded by D15/D17 on 2026-07-21

## Purpose

This design originally limited reproduction to Levels 1–2. Its shipped
Level 1–2 behavior remains accurate on `main`, but its blank-composition rule for
Levels 3–5 is no longer the product target. D15/D17 extend the same fixed-Goal,
prose-first contract to every level through a separately reviewed Practice
change.

This is a product-behavior change, not a problem-bank expansion. Existing
accepted candidates, fixtures, review manifests, digests, and generated
runtime projections remain byte-for-byte unchanged.

## Runtime contract

`problemBank.ts` hydrates every accepted Level 1–2 problem with a deterministic
`starterText` derived from `target` as the runtime projection is loaded. Every
consumer receives that hydrated `Problem`, so first load, retry replacement,
Next, Start over, and session restore all share one source of truth. A saved
learner draft continues to take precedence over the starter.

At the time this record shipped, Levels 3–5 retained their authored empty
`starterText`. That describes current `main` before the separately reviewed
Practice change, not the active product target.

## Markdown-to-prose conversion

A small content utility parses the target with the existing
`mdast-util-from-markdown` dependency and serializes only learner-visible text:

- headings, paragraphs, blockquotes, emphasis, and inline code keep their text;
- link destinations and all formatting marks are removed while link labels stay;
- fenced code keeps the code body while dropping fences and language metadata;
- list items become one text line per item, including nested items;
- thematic breaks disappear while surrounding prose keeps one blank line;
- images contribute alt text; raw HTML and definitions contribute no visible
  seed text;
- Markdown block boundaries become blank lines, while list boundaries become
  single line breaks.

The result uses LF line endings, removes zero-width characters, replaces
non-breaking and wide Unicode spaces with ASCII spaces, trims trailing spaces,
collapses excessive blank lines, and removes leading/trailing blank lines.

## Immutability decision

Rewriting all accepted Level 1–2 artifacts would invalidate the review-bound
problem-bank evidence for a presentation-only runtime behavior. Hydrating at
the single runtime boundary preserves those artifacts while automatically
covering future accepted Level 1–2 batches. Deriving inside the session layer
was rejected because it would leave `problem.starterText` stale and create two
sources of truth.

## Verification

The original tests cover the serializer's supported node shapes and whitespace
cleanup, all published Level 1–2 problems receiving deterministic seeds, the
then-current Level 3–5 blank behavior, saved drafts winning over seeds, and a
real browser opening Level 1 and Level 2 with prose already in the CodeMirror
answer sheet. The superseding Practice change must update those assertions for
all levels while keeping the full immutable problem-bank gates green.
