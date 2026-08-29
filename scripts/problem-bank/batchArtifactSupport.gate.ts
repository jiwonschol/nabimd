import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { provenanceErrors } from "./batchArtifactSupport"
import {
  buildImageBatch029Artifacts,
  buildImageBatch029Publication,
  checkImageBatch029State,
  readCommittedImageBatch029,
} from "./imageBatch029Support"
import {
  buildWorkplaceNotesBatch021Artifacts,
  checkWorkplaceNotesBatch021State,
  readCommittedWorkplaceNotesBatch021,
} from "./workplaceNotesBatch021Support"

const repositoryRoot = process.cwd()
const NONEXISTENT_SHA = "0".repeat(40)

function isProvenanceError(error: string) {
  return (
    error.includes("sourceBuzzEventId") ||
    error.includes("reviewedHead") ||
    error.includes("is not an ancestor of HEAD")
  )
}

// Real batch 029 is, by now, actually squash-merged into origin/main (PR #163), so its
// review and editorial records genuinely exist there — that's what makes it a valid
// merged-batch pass pair. Pointing the lookup at a batchId nothing was ever published
// under lets the destructive cases model the publish-to-merge window without inventing
// a second evidence record.
function withUnmergedBatchId(
  computed: Awaited<ReturnType<typeof buildImageBatch029Artifacts>>,
) {
  return {
    ...computed,
    config: { ...computed.config, batchId: "issue-170-not-yet-merged-probe" },
  }
}

describe("issue #170: reviewedHead/sourceBuzzEventId provenance gate", () => {
  it("passes with zero provenance errors on real batch-029 evidence (positive control: its exact evidence exists on origin/main after squash removed the reviewed branch commit)", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = await readCommittedImageBatch029({ repositoryRoot })
    const state = checkImageBatch029State({ computed, committed })
    expect(state.errors.filter(isProvenanceError)).toEqual([])

    const publication = buildImageBatch029Publication({ computed, committed })
    expect(publication.errors.filter(isProvenanceError)).toEqual([])
  })

  it("does not require the fields on a pre-027 batch (sequence 21, grandfathered)", async () => {
    const computed = await buildWorkplaceNotesBatch021Artifacts({ repositoryRoot })
    const committed = await readCommittedWorkplaceNotesBatch021({ repositoryRoot })
    expect(committed.reviews.some((review) => "reviewedHead" in review)).toBe(false)
    const state = checkWorkplaceNotesBatch021State({ computed, committed })
    expect(state.errors.filter(isProvenanceError)).toEqual([])
  })

  it("catches a reviewedHead that is not an ancestor of HEAD while the batch is still unpublished (the core destructive case)", async () => {
    // Ancestry is always attempted (see provenanceErrors in batchArtifactSupport.ts); it
    // only passes without being an ancestor when the batch's own summary.generated.json
    // is already on origin/main — withUnmergedBatchId forces that lookup to miss.
    const computed = withUnmergedBatchId(await buildImageBatch029Artifacts({ repositoryRoot }))
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    committed.summary = null
    committed.reviews[0].reviewedHead = NONEXISTENT_SHA
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes(`reviewedHead ${NONEXISTENT_SHA} is not an ancestor of HEAD`),
      ),
    ).toBe(true)
  })

  it("still catches a tampered reviewedHead once the batch is published but not yet merged to origin/main (the cherry-pick/rebase window issue #170 was actually about)", async () => {
    // Same setup as the prior test, except committed.summary stays non-null (genuinely
    // published) — proving the check is keyed on origin/main state, not local publish
    // state. issue #170's real risk window is exactly this: published, not yet merged.
    const computed = withUnmergedBatchId(await buildImageBatch029Artifacts({ repositoryRoot }))
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    expect(committed.summary).not.toBeNull()
    committed.reviews[0].reviewedHead = NONEXISTENT_SHA
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes(`reviewedHead ${NONEXISTENT_SHA} is not an ancestor of HEAD`),
      ),
    ).toBe(true)
    // Format is still enforced forever: a well-formed-but-bogus SHA is still a 40-char
    // lowercase hex string, so it passes format regardless of merge state — that part
    // relies on the review's own reviewDigest (sha256 of everything except itself) to
    // make tampering with this field detectable without git ancestry.
  })

  it("fails closed when origin/main cannot be resolved", async () => {
    const repositoryWithoutRemote = await mkdtemp(
      resolve(tmpdir(), "nabimd-provenance-no-origin-"),
    )
    const errors = provenanceErrors({
      record: {
        sourceBuzzEventId: "a".repeat(64),
        reviewedHead: "b".repeat(40),
      },
      label: "Review isolated-checkout",
      repositoryRoot: repositoryWithoutRemote,
      batchPath: "curriculum/problem-bank/batches/example",
    })
    expect(errors).toContain(
      "Review isolated-checkout origin/main is unavailable; cannot verify merged provenance evidence",
    )
  })

  it("rejects an empty reviewedHead", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    committed.reviews[0].reviewedHead = ""
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes("reviewedHead must be a 40-character lowercase hex string"),
      ),
    ).toBe(true)
  })

  it("rejects a reviewedHead of the wrong length (a valid commit truncated by one char)", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    committed.reviews[0].reviewedHead = String(committed.reviews[0].reviewedHead).slice(0, 39)
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes("reviewedHead must be a 40-character lowercase hex string"),
      ),
    ).toBe(true)
  })

  it("rejects an empty sourceBuzzEventId", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    committed.reviews[0].sourceBuzzEventId = ""
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes("sourceBuzzEventId must be a 64-character lowercase hex string"),
      ),
    ).toBe(true)
  })

  it("rejects a sourceBuzzEventId of the wrong length (64-char pattern must not accept a 40-char SHA)", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    committed.reviews[0].sourceBuzzEventId = String(committed.reviews[0].reviewedHead)
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes("sourceBuzzEventId must be a 64-character lowercase hex string"),
      ),
    ).toBe(true)
  })

  it("catches a typo'd key name (reviewedHead written as reviewdHead)", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    const review = committed.reviews[0] as Record<string, unknown>
    review.reviewdHead = review.reviewedHead
    delete review.reviewedHead
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) =>
        error.includes("reviewedHead must be a 40-character lowercase hex string"),
      ),
    ).toBe(true)
  })

  it("catches a non-ancestor reviewedHead on editorial evidence, not just reviews", async () => {
    const computed = withUnmergedBatchId(await buildImageBatch029Artifacts({ repositoryRoot }))
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    if (committed.editorial === null) {
      throw new Error("Fixture assumption broken: batch 029 must have editorial evidence")
    }
    committed.summary = null
    committed.editorial.reviewedHead = NONEXISTENT_SHA
    const publication = buildImageBatch029Publication({ computed, committed })
    expect(
      publication.errors.some((error) =>
        error.includes(`Editorial reviewedHead ${NONEXISTENT_SHA} is not an ancestor of HEAD`),
      ),
    ).toBe(true)
  })
})
