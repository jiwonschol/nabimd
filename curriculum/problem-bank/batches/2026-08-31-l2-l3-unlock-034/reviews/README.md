# Independent review records

This directory receives two sealed JSON review records only after the batch's
mechanical artifacts and `review-manifest.json` are frozen. Each reviewer must
inspect all 24 candidate revisions independently, use a distinct reviewer and
run ID, and bind every verdict to the exact candidate and fixture-result
digests. Review records never generate or alter candidate content.
