import { writeFile } from "node:fs/promises"
import { canonicalJson, sha256 } from "./problem-bank/pipeline.mjs"

const candidates = [
  ["l1-table-bus-time", "2d5b5ba45478bba06a078d557342929106c9a1a4aeb5a5b2d608a69d77b971ef", "7d240b1950897018f83894fb08f4f5be202737c84d0d159db0d3322466f9636a"],
  ["l1-table-day-weather", "4a153594db9716bceacd4f6be15fe3d192ec0703fdaabba6e86e0458c791a139", "0bd7434fd6d3b8eecc68fc2b6b5e81bb37b580d04b527866c1af2278fe8bf893"],
  ["l1-table-event-place", "cbc8f988642fd6487da315b51be483e1eb64016a526ae9421cbcb0496af7dd4b", "56a9cf0c3c97239bb5669b638efe648941bf496b968b7c217496530fd5cfee8f"],
  ["l1-table-flower-color", "781b9d78aa5a6241e7a3c755fbea83c6d34daab95f91f5d0e5e6317e0c5e5ce3", "f2be5088c7c62bed152548846fbe62b81222750d80c81e6d6c1e87fc4652783e"],
  ["l1-table-fruit-count", "59a591920ddbaade21b48ad5b025a69e19c23adf02075ba89945db2c8e140817", "c8244fe42c0bae82c6ad3d726133e58385388b4cb35e8f8c267e2eb85e619729"],
  ["l1-table-item-price", "5e89bc25aedec9a37521f0185bf5565bafda07ef53ef6465ed4c4aaf3eec75a3", "158ec1b250fdd48212889ccda10de8e72eb2633c7b6c0a7a0213a1babef8feeb"],
  ["l1-table-meal-drink", "6483b8ea703290632a74e5fb48be0cdc92b86341571cfa53e542b2307861afc9", "78ffb270c568d3672340c1b168bf0cd464ee54a2af205e40e56d352b11f69e6c"],
  ["l1-table-pet-name", "143a5934e7edaf617500ff2df156d8ebf09810c282567b50034fe1932665d42b", "fa8d0282a6438d9e91d86d12889caf629090db27755e5b9568eafd433183eb50"],
  ["l1-table-room-floor", "8a321697cc7fb52ed85e9dd8a32038a959368cf51e3f807dc3a81b57d00a5167", "db17a045f30ce816a16cc27507859ab205fffb8594e442fb61ed30fcadf01c3f"],
  ["l1-table-shop-opens", "8973b256ba070e7896ae75551849cf8a62d5a5b8e39f1ecc4667825894810c38", "b8c6a02ae64c26915859bbd661cdd3549dac13b9da76229c3ff992e3e649d524"],
  ["l1-table-team-practice", "779951d64ad8dd6536f47c53a520b0ccd01f471608c05e7ae42873f3a316b137", "449677f0dcc4832dcc7a98f12ceca932e8d751659dd6c662edbae0078df354ea"],
  ["l1-table-trail-length", "abccdef8c4e0415ea9c933755993dec771627f80549d971980fbac1295bc2f4c", "57244f78fae5795f19d7b1ecbafa85b5be0a1449944ac6669c063b2637f74d5c"],
]

const review = {
  schemaVersion: 2,
  batchId: "2026-08-29-l1-tables-031",
  reviewerId: "donghwan-boundary-batch031",
  reviewRunId: "donghwan-boundary-batch031-2026-08-29-002",
  declaredIndependent: true,
  reviewedHead: "32455401a068048b857102b4f59356b128671424",
  sourceBuzzEventId: "798346d80c268264528d7ccee29eb7c5b27667ace9c835cbb79f2d4a2e8ea129",
  manifestDigest: "50b8683ab052ae5e0bc5dbf559ee758cb55e9df8cdadb763bdc27893bf1f421f",
  artifactDigests: {
    normalizedArtifactDigest: "29c713d136d24f8bf09eaf23eee95c8952f22f28a1b7828e60a2d90e073af50f",
    fixtureArtifactDigest: "a32b31a3bcc90c739441f74c7358c42ae417312df3fc0ae3babf96ee584fb500",
    verificationDigest: "a71dba74d05e611705e60e3a7695e168e5dc12b95c6d2ba8195ec0a5dc362add",
  },
  overallVerdict: "pass",
  verdicts: candidates.map(([candidateId, candidateDigest, fixtureResultsDigest]) => ({
    candidateId,
    revision: 2,
    candidateDigest,
    fixtureResultsDigest,
    verdict: "pass",
  })),
  notes:
    "Mechanical boundary/counterexample review for the revision-2 replacement batch (031), rebound across two head moves that did not touch batch evidence: ef60e153 (original 031 content, P1/P2/P3 editorial fixes applied) and 32455401 (repositoryBankGate publication-boundary fix in scripts/problem-bank/{batchArtifactSupport.ts,batchPipeline.mjs,batchPipeline.test.mjs,repositoryBankGate.gate.ts} only — diffed ef60e153..32455401 to confirm no batch-030/031 evidence files changed and manifestDigest/artifactDigests are identical to the ef60e153 run, so content-level checks were not re-run). Re-parsed all 192 shipped fixtures and all 12 revision-2 candidate targets (including P3's bus-time header change Bus->Route, Green|Noon under Route|Time) with the product's actual GFM parser via an independently re-implemented top-level-table-node rule. Zero mismatches. Re-ran the same 8 boundary probes from the 030 review (all-dash header/body, double-escaped bar, colon-only divider, asymmetric divider-cell-count mismatch, extra body-row cells, pipe inside blockquote, table interrupting a paragraph) plus a P3 vocabulary sanity check (bus-time target header equals 'Route | Time'). Zero defects. Confirmed the committed fixtures.json artifact matches tableBatch031Fixtures.ts exactly (192/192, no drift). Ran scripts/problem-bank/tableBatch031Artifacts.gate.ts (7/7) and the full suite (86 files / 10,371 tests) at 32455401, matching 현철's stated numbers. Confirmed gate sensitivity by mutating the shared tableBatch030Fixtures.ts (which tableBatch031Fixtures.ts derives from) — flipped the 'no-divider' fixture's expectedStatus fail->matched and observed the 031 gate go from 7/7 to 3/7 (four assertions failed on the resulting artifact/tracker drift), then reverted and re-confirmed 7/7. Full method and probe-by-probe detail: review-notes/donghwan-boundary.json. This pass verdict is scoped to table syntax/boundary mechanics and P3 vocabulary structure only — it does not speak to editorial wording quality (진서's axis) or the publication-boundary fix itself (outside table-030/031 evidence, not this review's scope).",
}

review.reviewDigest = sha256(canonicalJson(review))

await writeFile(
  "curriculum/problem-bank/batches/2026-08-29-l1-tables-031/reviews/donghwan-boundary.json",
  `${JSON.stringify(review, null, 2)}\n`,
)

console.log("reviewDigest:", review.reviewDigest)
