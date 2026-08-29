# Batch 031: editorial replacement for Level 1 Markdown tables

Replace all 12 sealed batch-030 candidates at revision two without changing
their IDs, table anatomy, grading contract, fixture coverage, or Level 1
curriculum ownership.

## Editorial corrections

- Keep the shared teaching example outside every candidate target. Use
  `Name | Age` and `Ada | 31`, which do not appear in the 12 answers.
- Describe only what the learner types: one inner bar in each of three rows.
  Do not tell the learner to create rows or type divider dashes, because those
  characters stay locked on the guided cards.
- Make the first hint actionable and include the dash-only divider row among
  the three rows that need a bar.
- Replace the abstract `Bus | Time` / `Green | Noon` pair with
  `Route | Time` / `Green | Noon` while preserving the local-travel domain.

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

## Evidence constraints

- Preserve all 192 batch-030 fixtures, rebinding canonical sources and every
  fixture to revision two.
- Preserve the four exact 12-ID sets: prepared publication, runtime bank,
  scheduled turns, and `Try another` reach.
- Publish nothing until two independent mechanical reviews, separate editorial
  acceptance, and the structural instruction module tracked by #178 are all
  present on the final main SHA.
