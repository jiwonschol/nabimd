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
