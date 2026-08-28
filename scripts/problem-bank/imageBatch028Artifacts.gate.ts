import { describe, expect, it } from "vitest"
import { imageBatch028Fixtures } from "../../src/content/batches/imageBatch028Fixtures"
import { imageBatch028Problems } from "../../src/content/batches/imageBatch028Problems"
import {
  buildImageBatch028Artifacts,
  buildImageBatch028Publication,
  checkImageBatch028State,
  publishImageBatch028Artifacts,
  readCommittedImageBatch028,
  writeImageBatch028Artifacts,
} from "./imageBatch028Support"

const repositoryRoot = process.cwd()
const computed = await buildImageBatch028Artifacts({ repositoryRoot })

describe("schema-v2 Level 1 image batch 028", () => {
  it("runs every candidate fixture through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      imageBatch028Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(12)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the exact prompt, candidates, fixtures, and engine contract", () => {
    expect(computed.engineContract.dependencies).toEqual([
      { name: "mdast-util-from-markdown", version: "2.0.3" },
    ])
    expect(computed.manifest.entries).toHaveLength(12)
    expect(
      computed.normalized.candidates.map(({ id, revision }) => ({
        id,
        revision,
      })),
    ).toEqual(
      imageBatch028Problems
        .map(({ id, revision }) => ({ id, revision }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    )
  })

  it("starts from the published 384-problem checkpoint", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(384)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 152,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedImageBatch028({ repositoryRoot })
    const state = checkImageBatch028State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedImageBatch028({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkImageBatch028State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeImageBatch028Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("replaces all twelve only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedImageBatch028({ repositoryRoot })
    const state = checkImageBatch028State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(384)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildImageBatch028Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(384)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 152,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({ images: 12 })
    const publishedById = new Map(
      publication.runtimeProjections.levels[1].map((problem) => [
        problem.id,
        problem,
      ]),
    )
    for (const replacement of imageBatch028Problems) {
      expect(publishedById.get(replacement.id)).toMatchObject({
        revision: 2,
        sourceBatchId: computed.normalized.batchId,
      })
    }
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedImageBatch028({ repositoryRoot })
    if (committed.editorial !== null) return
    await expect(
      publishImageBatch028Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
