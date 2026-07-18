# Independent reviews

`reviewer-a.json` and `reviewer-b.json` are separate digest-bound inspections of
the frozen `review-manifest.json`. Both cover all 20 candidates and use distinct
reviewer and run identities. The subsequent `editorial.json` is authored by a
different role and binds both review digests.

The build-time generator never creates review verdicts or editorial decisions,
and it refuses to mutate this batch after these files exist.
