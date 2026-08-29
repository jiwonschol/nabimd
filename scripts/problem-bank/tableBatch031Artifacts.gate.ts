import { describe, expect, it } from "vitest"
import { tableBatch031Fixtures } from "../../src/content/batches/tableBatch031Fixtures"
import { tableBatch031Problems } from "../../src/content/batches/tableBatch031Problems"
import {
  buildTableBatch031Artifacts,
  buildTableBatch031Publication,
  checkTableBatch031State,
  publishTableBatch031Artifacts,
  readCommittedTableBatch031,
  writeTableBatch031Artifacts,
} from "./tableBatch031Support"

const repositoryRoot = process.cwd()
const computed = await buildTableBatch031Artifacts({ repositoryRoot })

describe("schema-v2 Level 1 table batch 031", () => {
  it("normalizes the twelve replacement candidates after the source bank gate", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      tableBatch031Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(12)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the replacement prompt, candidates, fixtures, and parser contract", () => {
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
      tableBatch031Problems
        .map(({ id, revision }) => ({ id, revision }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    )
  })

  it("starts from the same unpublished 384-problem checkpoint", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(384)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 152,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
  })

  it("keeps committed replacement evidence deterministic", async () => {
    const committed = await readCommittedTableBatch031({ repositoryRoot })
    const state = checkTableBatch031State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite replacement evidence after review begins", async () => {
    const committed = await readCommittedTableBatch031({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkTableBatch031State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeTableBatch031Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("adds all twelve replacements only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedTableBatch031({ repositoryRoot })
    const state = checkTableBatch031State({ computed, committed })
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

    const publication = buildTableBatch031Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(396)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 164,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({ tables: 12 })
    const publishedById = new Map(
      publication.runtimeProjections.levels[1].map((problem) => [
        problem.id,
        problem,
      ]),
    )
    for (const addition of tableBatch031Problems) {
      expect(publishedById.get(addition.id)).toMatchObject({
        revision: 2,
        sourceBatchId: computed.normalized.batchId,
      })
    }
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps replacement publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedTableBatch031({ repositoryRoot })
    if (committed.editorial !== null) return
    await expect(
      publishTableBatch031Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
