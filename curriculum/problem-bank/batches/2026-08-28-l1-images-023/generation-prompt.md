# Batch 023: everyday Level 1 images

Generate exactly 12 append-only schema-v2 Level 1 image problems in one retry
family. Each problem teaches one inline Markdown image in a short everyday
sentence and must be finishable in well under one minute.

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
- An empty alt is a valid parser edge case but never an authored target.
- Two images may match grammar but must produce the `keep-one-image`
  editorial review item.

## Content constraints

- All prose is original and uses everyday subjects: weather, travel, food,
  pets, books, gardens, and community events.
- Do not copy descriptions from external examples or documentation.
- Every problem ships the six required fixture roles, edge cases for relative
  and titled destinations, and direct failure evidence for `use-image`.
