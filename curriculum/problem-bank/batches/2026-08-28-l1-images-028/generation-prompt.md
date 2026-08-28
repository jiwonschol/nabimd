# Batch 028: visible Level 1 image text

Replace exactly the 12 accepted schema-v2 Level 1 image problems from batch 027
at revision 2. Keep their educational content unchanged except for the shared
learner feedback that now explains the visible-text contract.

## Frozen anatomy

- Use one inline image and no other graded Markdown syntax.
- Use the canonical `![useful alt text](image address)` form.
- Write meaningful alt text of at least three words. The learner preview shows
  this text as `[Image: ...]`, so generic labels such as `img`, `image`, or
  `photo` are not acceptable authored targets.
- Use a reserved `https://example.com/images/...` address. The product renders
  a local placeholder instead of loading the remote resource.
- Keep every target to one physical line and one image.
- Grade image grammar, not prose, spelling, case, or address choice.
- Require visible characters in both the alt description and destination.
  Spaces, invisible characters, and parser-origin replacement characters do
  not satisfy this grammar check. A directly authored U+FFFD remains visible.
- Teach useful alt text in prose, but grade only Markdown grammar and
  visibility. A single visible character such as `a` remains a grammar match.
- Two images may match grammar but must produce the `keep-one-image`
  editorial review item.

## Content constraints

- All prose is original and uses everyday subjects: weather, travel, food,
  pets, books, gardens, and community events.
- Do not copy descriptions from external examples or documentation.
- Every problem ships the six required fixture roles, edge cases for relative
  and titled destinations, and direct failure evidence for NUL-only and
  zero-width alt text plus positive evidence for directly authored U+FFFD.
