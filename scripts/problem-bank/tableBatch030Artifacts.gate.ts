import { describe, expect, it } from "vitest"
import { tableBatch030Fixtures } from "../../src/content/batches/tableBatch030Fixtures"
import { tableBatch030Problems } from "../../src/content/batches/tableBatch030Problems"
import {
  buildTableBatch030Artifacts,
  buildTableBatch030Publication,
  checkTableBatch030State,
  publishTableBatch030Artifacts,
  readCommittedTableBatch030,
  writeTableBatch030Artifacts,
} from "./tableBatch030Support"

const repositoryRoot = process.cwd()
const computed = await buildTableBatch030Artifacts({ repositoryRoot })

describe("schema-v2 Level 1 table batch 030", () => {
  it("normalizes the twelve candidates after the source bank gate", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      tableBatch030Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(12)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the prompt, candidates, fixtures, and real parser contract", () => {
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
      tableBatch030Problems
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
    const committed = await readCommittedTableBatch030({ repositoryRoot })
    const state = checkTableBatch030State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedTableBatch030({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkTableBatch030State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeTableBatch030Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("preserves the 384-problem bank after all twelve candidates are rejected", async () => {
    const committed = await readCommittedTableBatch030({ repositoryRoot })
    const state = checkTableBatch030State({ computed, committed })
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

    const rejectionErrors = tableBatch030Problems
      .map(
        ({ id }) =>
          `Batch ${computed.normalized.batchId} is fail-closed after editorial rejection: ${id}`,
      )
      .sort()
    const publication = buildTableBatch030Publication({ computed, committed })
    expect(publication.errors).toEqual(rejectionErrors)
    expect(publication.tracker.acceptedTotal).toBe(384)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 152,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
    expect(publication.tracker.counts.byFamily.tables ?? 0).toBe(0)
    expect(committed.tracker.acceptedTotal).toBe(384)
    expect(committed.summary).toBeNull()
    expect(state).toEqual({
      status: "invalid-editorial-evidence",
      errors: rejectionErrors,
      committedIndependentReviews: 2,
    })
  })

  it("keeps publication fail-closed while editorial evidence is absent or rejected", async () => {
    const committed = await readCommittedTableBatch030({ repositoryRoot })
    if (committed.editorial !== null) {
      expect(
        buildTableBatch030Publication({ computed, committed }).errors,
      ).toEqual(
        tableBatch030Problems
          .map(
            ({ id }) =>
              `Batch ${computed.normalized.batchId} is fail-closed after editorial rejection: ${id}`,
          )
          .sort(),
      )
      return
    }
    await expect(
      publishTableBatch030Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
