# Problem-bank pipeline

Nabi treats curriculum as executable product data, not a pile of prompts. The
committed GPT-5.6 artifact contains 128 candidates: 16 in each of eight common
Markdown families. Only the 16 headings can use the current deterministic
engine. The remaining 112 are explicitly blocked as
`engine-family-not-supported`; blocked candidates are roadmap evidence, not
shipped lessons.

## Gate order

1. **Generate:** `npm run bank:generate` normalizes the raw GPT-5.6 artifact,
   attaches deterministic candidate digests, and preserves the exact prompt
   digest. `npm run bank:generate:check` rejects drift.
2. **Validate fixtures:** the publish gate runs `validateProblemBank` and every
   committed fixture through the real `evaluateProblem` engine. Each heading
   currently has 29 fixtures. The resulting transcript and fixture count are
   bound to a SHA-256 digest.
3. **Independent agreement:** `npm run bank:review-manifest` prints the exact
   candidate and fixture-result digests. At least two distinct reviewers must
   submit separate passing records. A stale digest, duplicate reviewer/run,
   or any disagreeing verdict blocks publication.
4. **Editorial queue:** one decision is required for every candidate. An
   accepted heading must cite the same candidate and fixture-result digests and
   name the editorial actor. Unsupported families remain blocked, including
   image candidates that still need licensed assets and visual alt-text review.
5. **Publish:** `npm run bank:gate` requires the runtime JSON set to equal the
   accepted editorial set exactly. Unknown, unsupported, or bypassed content
   fails the gate.

`npm run check` runs the normalization drift check, ordinary tests, bank gate,
and production build. During review, a feature branch is expected to fail only
at the missing independent-review/editorial stages. It must not merge in that
state.

## Artifact map

- `generation-prompt.md` — exact generation request;
- `candidates.raw.json` — human-readable GPT-5.6 output;
- `candidates.normalized.json` — deterministic generated artifact and digests;
- `editorial-queue.json` — one decision per candidate;
- `reviews/*.json` — independent digest-bound review records; and
- `src/content/generated/headingBank.generated.json` — the runtime publish set.

The 500+ bank remains a roadmap, not a quantity claim. New families publish in
small batches only after their real predicate, counterexamples, fixtures,
independent agreement, and editorial acceptance all exist.
