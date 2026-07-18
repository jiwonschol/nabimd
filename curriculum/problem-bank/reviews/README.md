# Independent curriculum reviews

This directory accepts one JSON artifact per independent reviewer. Each file
contains an array of records with `reviewerId`, `reviewRunId`, `candidateId`,
`candidateDigest`, `fixtureResultsDigest`, `fixtureCount`, `verdict`, and
`notes`.

Reviewers must run the real heading fixtures and assess the US-English content.
They must not copy another review. `npm run bank:review-manifest` prints the
exact digests to review; `npm run bank:gate` rejects missing, stale, duplicate,
or disagreeing records. No reviewer verdict is prefilled here.
