import { describe, expect, it } from "vitest"
import { nestedBulletBatch019Fixtures } from "../../src/content/batches/nestedBulletBatch019Fixtures"
import { nestedBulletBatch019Problems } from "../../src/content/batches/nestedBulletBatch019Problems"
import {
  buildNestedBulletBatch019Artifacts,
  buildNestedBulletBatch019Publication,
  checkNestedBulletBatch019State,
  publishNestedBulletBatch019Artifacts,
  readCommittedNestedBulletBatch019,
  writeNestedBulletBatch019Artifacts,
} from "./nestedBulletBatch019Support"

const repositoryRoot = process.cwd()
const computed = await buildNestedBulletBatch019Artifacts({ repositoryRoot })

describe("schema-v2 Level 1 nested-bullet indentation batch 019", () => {
  it("runs every candidate fixture through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(4)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      nestedBulletBatch019Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(4)
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
    expect(computed.manifest.entries).toHaveLength(4)
    expect(computed.normalized.candidates.map(({ id, revision }) => ({
      id,
      revision,
    }))).toEqual(
      nestedBulletBatch019Problems
        .map(({ id, revision }) => ({ id, revision }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    )
    expect(
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest === computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("starts from the published 344-problem checkpoint", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(344)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 136,
      2: 148,
      3: 30,
      4: 20,
      5: 10,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedNestedBulletBatch019({ repositoryRoot })
    const state = checkNestedBulletBatch019State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedNestedBulletBatch019({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkNestedBulletBatch019State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeNestedBulletBatch019Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes all four only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedNestedBulletBatch019({ repositoryRoot })
    const state = checkNestedBulletBatch019State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(344)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildNestedBulletBatch019Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(348)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 140,
      2: 148,
      3: 30,
      4: 20,
      5: 10,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({
      "nested-lists": 4,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedNestedBulletBatch019({ repositoryRoot })
    if (committed.editorial !== null) return
    await expect(
      publishNestedBulletBatch019Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
