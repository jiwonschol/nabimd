# Declared-independent curriculum reviews

This directory accepts one JSON artifact per reviewer who declares an
independent pass. Each file contains an array of records with `reviewerId`,
`reviewRunId`, `candidateId`, `candidateDigest`, `fixtureResultsDigest`,
`fixtureCount`, `verdict`, and `notes`.

Reviewers must run the real heading fixtures and assess the US-English content.
They must not copy another review. `npm run bank:review-manifest` prints the
exact digests to review; `npm run bank:gate` rejects missing, stale, duplicate,
or disagreeing records. No reviewer verdict is prefilled here.

The repository gate verifies distinct declared identities, distinct run IDs,
digest freshness, and unanimous results. Static JSON cannot authenticate the
human or agent behind an ID, so the public claim is limited to declared
independence; process provenance belongs in the Build Week log and PR record.
