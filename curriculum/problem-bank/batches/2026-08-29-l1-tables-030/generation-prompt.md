# Batch 030: first Level 1 Markdown tables

Add exactly 12 schema-v2 Level 1 problems that teach one simple Markdown
table each.

## Frozen anatomy

- Use exactly three physical lines: one header row, one divider row, and one
  body row.
- Use exactly two columns and no outer bars.
- Keep the divider as `--- | ---`. The dashes stay visible and the learner
  types the one bar between them.
- Keep header and body cells plain text. Do not mix bold, italic, inline code,
  links, images, hard line breaks, or another Markdown syntax into a cell.
- Every semantic row, including the header, must contain at least one visible
  cell that is not only dashes.
- Set `protectedContent` to an empty array. Grade the presence of one GFM table,
  not the wording, spelling, case, or exact cell values.
- The guided learner path must produce exactly three cards. Each card asks for
  the one inner bar, and the divider card keeps both dash runs locked.

## Content constraints

- Use original, everyday two-column facts about food, weather, places, travel,
  pets, meals, gardens, sports, errands, or community events.
- Keep each physical line within the current Level 1 authoring budget.
- Ship all required fixture roles, including direct failures for pipe prose,
  a pipe-bearing list, rows without a divider, and a fenced lookalike.
- Include positive GFM boundaries for outer bars, alignment colons, escaped
  cell bars, short divider runs, and a body cell made of dashes beside a
  visible non-dash cell.
