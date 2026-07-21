# Answer Sheet Prose Pre-seed Design

**Status:** Historical Level 1–2 foundation; all-level topology-preserving
extension shipped under D15/D17 on 2026-07-21

## Purpose

This design originally limited reproduction to Levels 1–2. D15/D17 now extend
the same fixed-Goal, prose-first contract to every level. The extension also
strengthens the serializer: it preserves every authored Goal line so the Goal
and answer sheet keep the same spatial structure while the learner restores
Markdown marks.

This is a product-behavior change, not a problem-bank expansion. Existing
accepted candidates, fixtures, review manifests, digests, and generated
runtime projections remain byte-for-byte unchanged.

## Runtime contract

`problemBank.ts` hydrates every accepted problem with a deterministic
`starterText` derived from `target` as the runtime projection is loaded. Every
consumer receives that hydrated `Problem`, so first load, retry replacement,
Next, Start over, and session restore all share one source of truth. A saved
learner draft continues to take precedence over the starter.

The all-level extension includes a narrow migration to projection revision
`starter-projection@2`. It accepts both the bare pre-projection bank revision
and `starter-projection@1`. From the bare revision it removes only exact
automatic values: the former flattened starter at Levels 1–2 and the former
empty draft at Levels 3–5. From `@1` it removes the exact flattened starter at
every level, plus empty Level 3–5 drafts left during that transition. The new
topology-preserving starter can then become the fallback. Genuine edits and
intentional empty Level 1–2 drafts remain authoritative.

## Markdown-to-prose conversion

A small content utility parses the target with the existing
`mdast-util-from-markdown` dependency, maps learner-visible text back to its
authored source lines, and leaves syntax-only positions blank:

- headings, paragraphs, blockquotes, emphasis, and inline code keep their text;
- link destinations and all formatting marks are removed while link labels stay;
- fenced code keeps the literal code body on its original lines while its fence
  delimiters and language metadata become blank lines;
- list items and nested items keep their authored line positions;
- thematic breaks disappear without collapsing their source line;
- images contribute alt text; raw HTML and definitions contribute no visible
  seed text; and
- every target line has exactly one starter line, including leading, trailing,
  and repeated blank lines.

The result uses LF line endings. Non-code visible prose removes zero-width
characters, replaces non-breaking and wide Unicode spaces with ASCII spaces,
and trims trailing spaces. Literal code content is preserved. The serializer
does not collapse or trim the document's line topology.

## Immutability decision

Rewriting accepted artifacts would invalidate the review-bound problem-bank
evidence for a presentation-only runtime behavior. Hydrating at the single
runtime boundary preserves those artifacts while automatically covering future
accepted batches. Deriving inside the session layer was rejected because it
would leave `problem.starterText` stale and create two sources of truth.

## Verification

Tests cover supported node shapes, exact line-topology preservation, literal
code payloads, all 344 published problems receiving deterministic seeds, every
authored Goal matching through the real evaluator, guarded legacy-draft
migration, and real-browser entry at Levels 1–5. The full immutable problem-bank
gates remain green, and the browser suite also verifies the answer stays inside
the editor's scroll surface.
