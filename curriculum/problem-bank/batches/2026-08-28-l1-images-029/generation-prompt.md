# Batch 029: source-aware Level 1 image destinations

Replace exactly the 12 accepted schema-v2 Level 1 image problems from batch 028
at revision 3. Keep all educational content and learner feedback unchanged.
Change only the engine destination boundary and the paired regression evidence.

## Frozen anatomy

- Preserve every authored target, prompt, teaching field, hint, vocabulary
  field, content variant, match check, editorial check, and feedback string.
- Use the same 12 problem IDs and publish them only as revision 3 from batch
  029. Batch 027 and 028 evidence remains immutable.
- Locate an image destination only from the closing bracket found by the
  existing depth- and escape-aware alt-text scan. Accept only the `](` that
  begins immediately after that bracket.
- Keep links on their existing position-aware destination path.
- A valid image title containing `]()` must not make a visible destination
  appear empty.
- Preserve the visible-text boundary: empty, whitespace-only, angle-empty,
  NUL-only, and zero-width destinations fail; visible destinations match.
- Preserve the alt-text boundary: NUL-only and zero-width alt text fail, while
  directly authored U+FFFD and a single visible character match.

## Regression constraints

- Freeze all cases for all 12 candidates rather than using one representative.
- Pair the failing title-ending `]()` counterexample with no title, a plain
  title, single `]` and `(` title characters, and a nonterminal `a ]( b` title.
- Include valid escaped alt text containing `\]()` so an `indexOf("](")`
  implementation fails the suite.
- Include a NUL-only destination so removing the raw-source half of the
  meaningful-destination check fails the suite.
- Delimiter regressions must use `]()` rather than only `](`: selecting the
  wrong delimiter is observable to a nonempty check only when its tail is
  empty.
- Keep all 36 existing `link-shape` destination consumers matched with the
  poison title, proving the shared engine change does not regress links.
- Every failing fixture must keep the one previously reviewed visible-text
  learner instruction.
