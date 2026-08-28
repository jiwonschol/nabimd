import { describe, expect, it } from "vitest"
import { imageBatch029Fixtures } from "../../src/content/batches/imageBatch029Fixtures"
import { imageBatch029Problems } from "../../src/content/batches/imageBatch029Problems"
import {
  buildImageBatch029Artifacts,
  buildImageBatch029Publication,
  checkImageBatch029State,
  publishImageBatch029Artifacts,
  readCommittedImageBatch029,
  writeImageBatch029Artifacts,
} from "./imageBatch029Support"

const repositoryRoot = process.cwd()
const computed = await buildImageBatch029Artifacts({ repositoryRoot })

describe("schema-v2 Level 1 image batch 029", () => {
  it("runs every candidate fixture through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      imageBatch029Fixtures.length,
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
      imageBatch029Problems
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
    const committed = await readCommittedImageBatch029({ repositoryRoot })
    const state = checkImageBatch029State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedImageBatch029({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkImageBatch029State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeImageBatch029Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("replaces all twelve only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedImageBatch029({ repositoryRoot })
    const state = checkImageBatch029State({ computed, committed })
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

    const publication = buildImageBatch029Publication({ computed, committed })
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
    for (const replacement of imageBatch029Problems) {
      expect(publishedById.get(replacement.id)).toMatchObject({
        revision: 3,
        sourceBatchId: computed.normalized.batchId,
      })
    }
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedImageBatch029({ repositoryRoot })
    if (committed.editorial !== null) return
    await expect(
      publishImageBatch029Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
