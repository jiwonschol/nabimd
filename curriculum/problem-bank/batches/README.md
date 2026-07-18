# Schema-v2 batch evidence

Each child directory is immutable after it lands. A batch contains:

- `generation-prompt.md` — the exact build-time GPT-5.6 prompt;
- `candidates.raw.json` — schema-v2 authoring output;
- `candidates.normalized.json` — deterministic normalization with `standard`
  flavor and content digests;
- `fixtures.json` — canonical, different-prose, case-spelling-variation,
  missing, malformed, matched-with-review, direct-check, and applicable
  collision cases;
- `verification.json` — transcript digests produced through the real-engine
  adapter;
- `review-manifest.json` — the frozen scope for independent review;
- `reviews/*.json` — at least two distinct reviewer and run records;
- `editorial.json` — the separate vocabulary and policy decision; and
- `summary.generated.json` — generated counts and the final batch digest.

Changing any accepted evidence creates a new batch. A baseline tracker rejects
removal or mutation of an already recorded batch. Schema-v1 candidates are not
copied here or promoted automatically.

## Published batches

- `2026-07-19-milestone-1-foundation-001` — 20 accepted problems and 184
  real-engine fixtures across Levels 1–5.
- `2026-07-19-l1-l2-headings-002` — 24 accepted H1 vocabulary variants and 192
  real-engine fixtures, bringing Levels 1 and 2 to 16 problems each.

Mechanical preparation writes only the new batch directory. Publication
recompiles the global runtime projection and tracker from every accepted batch;
it never rewrites an older batch summary.
