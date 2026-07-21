# Problem-bank pipeline

Nabi treats curriculum as executable product data, not a pile of prompts. The
schema-v2 tracker currently publishes 344 inspected `standard` problems: 136 at
Level 1, 148 at Level 2, 30 at Level 3, 20 at Level 4, and 10 at Level 5. The
foundation batch carries 184 real-engine fixtures, the heading expansion
carries 192, and the first bold-emphasis expansion carries 216. The first
bullet-list expansion carries 360; the first ordered-list expansion carries
624, and the first blockquote expansion carries 672. The first inline-code
expansion carries 912.
The first link expansion carries 2,304, the first Markdown-divider expansion
carries 1,272, the first Level 3 readable-document expansion carries 212, and
the second Level 3 composite-document expansion carries 252.
The first Level 4 development-spec expansion carries 488.
The first Level 1 italic and Level 2 rebuild expansion carries 420, and the
first Level 1 code-block and Level 2 code-block-rebuild expansion carries 620.
The first ATX H2–H6 and Level 2 sectioned-document expansion carries 419.
The first Level 2 nested-list document expansion carries 300.
The first mixed advanced-document expansion carries 238 frozen fixtures for
two Level 3 operational briefs, four Level 4 integration contracts, and six
Level 5 recovery, refactor, and coordinated-rollout work orders.
Each immutable batch has two sealed independent reviews and one separate
editorial decision.

## Content license

Beginning with the commit that introduced the repository-root
[`LICENSE-CONTENT`](../../LICENSE-CONTENT) on July 21, 2026, all problem-bank
content present in this repository and all problem-bank content added later is
licensed under Creative Commons Attribution-ShareAlike 4.0 International. This
includes problem statements, teaching copy, Goal documents, and vocabulary
ladders.

Generated batches inherit that content license. The generate, normalize,
verify, inspect, and publish stages do not replace it with a different license.
Batch authors and editors must therefore contribute only material that the
project can distribute under CC BY-SA 4.0.

The earlier 128-candidate GPT-5.6 artifact remains frozen schema-v1 evidence.
Its 16 accepted headings and 112 unsupported-family candidates are preserved
for audit history but do not count toward the schema-v2 tracker.

## Gate order

1. **Generate and normalize:** an exact build-time prompt and raw candidates
   produce sorted normalized records with `flavor: "standard"` and content
   digests.
2. **Verify:** `validateProblemBank` and every fixture run through the real
   `normalizeProblem` / `evaluateProblem` implementation. The transcript is
   bound to an explicit engine-contract digest.
3. **Freeze review scope:** `review-manifest.json` binds candidate, materialized
   problem, fixture-definition, fixture-result, and engine digests.
4. **Independent review:** two distinct reviewer and run IDs must each submit a
   passing, sealed verdict for every accepted candidate. Any disagreement,
   malformed evidence, or stale scope fails the immutable batch closed before
   publication.
5. **Editorial inspection:** a separate actor decides level fit, vocabulary
   fit, ambiguity, Goal quality, duplication, licensing, flavor, and the
   no-runtime-AI boundary.
6. **Publish:** `npm run bank:batch:publish` writes only the compiled runtime
   projection, tracker, and batch summary. `npm run check` then proves those
   files exactly equal the accepted evidence set.

`npm run bank:batch:generate:check` is state-aware: it represents zero, one,
two, and editorial-complete review states honestly while keeping publication
empty until every required seal exists. The generator refuses to rewrite a
batch after any review or editorial evidence lands. `npm run check` runs both
pipeline generations, the state gate, application tests, the legacy gate, and
the production build.

The generic `npm run bank:batch:generate` alias is deliberately read-only and
runs that state-aware check. Authors use the explicitly named `prepare` or
`generate` command for the current unsealed batch; this prevents a generic
alias from later trying to rewrite whichever reviewed batch happened to be
latest when the alias was committed.

## Artifact map

- `generation-prompt.md` — exact generation request;
- `candidates.raw.json` — human-readable GPT-5.6 output;
- `candidates.normalized.json` — deterministic generated artifact and digests;
- `fixtures.json` and `verification.json` — definitions and real-engine result
  transcripts;
- `engine-contract.json` — exact source/dependency hashes used by verification;
- `review-manifest.json` — frozen content, transcript, and fixture-count digests
  for the exact review head;
- `reviews/*.json` — declared-independent digest-bound review records;
- `editorial.json` — separate per-candidate editorial decisions;
- `summary.generated.json` — accepted/rejected/blocked counts and evidence
  digests; and
- `runtime-projections.generated.json` / `tracker.generated.json` — exact
  compiled publish set and progress toward the closing target.

The 512-problem closing bank remains a target, not a quantity claim. The tracker
currently reports 344. New families publish in small batches only after their
real predicate, counterexamples, fixtures, independent agreement, and editorial
acceptance all exist.

## Schema-v2 batch foundation

Issue #9 adds an append-only batch ledger beside the frozen schema-v1 evidence.
The v1 prompt, 128 candidates, 16 accepted headings, 112 blocked candidates,
review records, and editorial decisions remain unchanged and are indexed by
`legacy/v1-128.index.json`. They do not count toward the schema-v2 tracker until
a later batch requalifies them against the new curriculum contract.

Every directory under `batches/` is a self-contained evidence unit. Its raw
candidate artifact and exact prompt deterministically produce the committed
normalized artifact. Fixtures are verified through an injected real-engine
adapter; the pipeline itself does not import the learner engine. Two distinct,
digest-current reviewer runs and a separate editorial decision are required
before compilation. The compiler publishes only the accepted set and derives
`tracker.generated.json`; neither generated projection is hand-edited.

The tracker target is 512 inspected `standard` problems: 128 each at Levels 1
and 2, 96 at Level 3, and 80 each at Levels 4 and 5. Quantity never overrides a
fixture, review, or editorial failure. The current distribution is
136/148/30/20/10.
