import { describe, expect, it } from "vitest"
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

describe("issue #170: reviewedHead/sourceBuzzEventId provenance gate", () => {
  it("passes with zero provenance errors on real batch-029 evidence (positive control)", async () => {
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
    // Ancestry is only enforced pre-publish (see the checkAncestor comment in
    // batchArtifactSupport.ts): this repo squash-merges every PR, so a real,
    // already-merged reviewedHead like batch 029's own is *expected* to stop being an
    // ancestor of HEAD the moment its PR lands. Simulating "not yet published" here
    // (summary: null) is what puts the check into the state where it actually runs —
    // i.e. during a batch's live review window, before its own merge rewrites history.
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
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

  it("does NOT re-check ancestry once the batch is published (squash-merge would otherwise fail it forever)", async () => {
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
    const committed = structuredClone(await readCommittedImageBatch029({ repositoryRoot }))
    expect(committed.summary).not.toBeNull()
    committed.reviews[0].reviewedHead = NONEXISTENT_SHA
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.some((error) => error.includes("is not an ancestor of HEAD")),
    ).toBe(false)
    // Format is still enforced forever: a well-formed-but-bogus SHA is still a 40-char
    // lowercase hex string, so it passes format and is silently tolerated post-publish —
    // that's fine, because the review's own reviewDigest (sha256 of everything except
    // itself) already makes tampering with this field detectable without git ancestry.
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
    const computed = await buildImageBatch029Artifacts({ repositoryRoot })
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
