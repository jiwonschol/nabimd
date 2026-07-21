# Batch 018: compact advanced-document replacements

Generate an append-only schema-v2 replacement batch for the 18 currently
published Level 4 and Level 5 Goals that exceed Nabi Markdown's corrected
practice ceilings. Preserve each stable problem ID and publish the next
contiguous revision:

- eight over-budget Batch 012 Level 4 problems become revision 2;
- four over-budget foundation Level 5 problems become revision 3; and
- six over-budget Batch 017 Level 5 problems become revision 2.

The exact replacement set is frozen to:

- Level 4 revision 2: `l4-api-field-deprecation-migration`,
  `l4-cache-namespace-migration`, `l4-configuration-key-migration`,
  `l4-nullable-column-backfill-migration`,
  `l4-duplicate-form-submission-investigation`,
  `l4-lost-pagination-cursor-investigation`,
  `l4-offline-retry-banner-investigation`, and
  `l4-stale-permission-badge-investigation`;
- Level 5 revision 3: `l5-auth-migration-work-order`,
  `l5-dependency-upgrade-work-order`,
  `l5-performance-recovery-work-order`, and
  `l5-release-context-work-order`; and
- Level 5 revision 2: `l5-duplicate-job-recovery-work-order`,
  `l5-search-index-recovery-work-order`,
  `l5-date-format-refactor-work-order`,
  `l5-analytics-adapter-refactor-work-order`,
  `l5-api-contract-rollout-work-order`, and
  `l5-notification-schema-rollout-work-order`.

Do not replace any compliant problem. Do not mutate any sealed historical
batch. The compiled runtime total and level split must remain 344 and
`136/148/30/20/10` because each accepted revision supersedes one existing
record.

Author realistic miniatures, not complete workplace documents. Every Goal must
stay at or below 40 physical lines and 165 authored words. Lists contain two or
three short items, normally no more than twelve words each. Difficulty comes
from Markdown variety, hierarchy, and placement rather than prose volume,
domain knowledge, or typing endurance.

Level 4 remains compatible with the current schema metadata while using short,
human-readable work documents. Level 5 uses compact developer-facing forms:
headings, a small list or nested list, inline code, a short fenced block, a
blockquote, and a meaningful link where the family requires them. Do not use
task lists or images because their dedicated validators are not available.

For every candidate:

- preserve grammar-only grading and `protectedContent: []`;
- provide exactly one `document-limits` match check with `maxLines: 40`;
- keep canonical, different-prose, case/spelling, missing, malformed,
  matched-with-review, and one direct-failure fixture per match check;
- include a direct length failure that retains the document structure and
  exceeds the line ceiling;
- accept equivalent CommonMark forms supported by the existing engine; and
- use fictional, non-sensitive US-English content distributable under the
  repository's CC BY-SA 4.0 content license.

The batch must pass two declared-independent mechanical reviews and one
separate editorial inspection before publication. Quantity never overrides
verification or editorial quality.
