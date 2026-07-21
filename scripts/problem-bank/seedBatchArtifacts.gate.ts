import { describe, expect, it } from "vitest"
import { level12SeedFixtures } from "../../src/content/level12SeedFixtures"
import { level35SeedFixtures } from "../../src/content/level35SeedFixtures"
import {
  buildSeedBatchPublication,
  buildSeedBatchArtifacts,
  checkSeedBatchState,
  publishSeedBatchArtifacts,
  readCommittedSeedBatch,
  writeSeedBatchArtifacts,
} from "./seedBatchSupport"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_SEED_BATCH === "1"
const publishArtifacts = process.env.NABI_PUBLISH_SEED_BATCH === "1"
const computed = await buildSeedBatchArtifacts({ repositoryRoot })

if (writeArtifacts) await writeSeedBatchArtifacts({ repositoryRoot, computed })
if (publishArtifacts) {
  await publishSeedBatchArtifacts({ repositoryRoot, computed })
}

describe("schema-v2 foundation seed batch", () => {
  it("runs every fixture for all 20 seeds through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(20)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      level12SeedFixtures.length + level35SeedFixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(20)
    expect(
      computed.normalized.candidates.every(
        (candidate) =>
          candidate.sourceBatch === computed.normalized.batchId &&
          !("sourceBatchId" in candidate),
      ),
    ).toBe(true)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the manifest to the explicit engine-contract policy", () => {
    expect(computed.engineContract.files.length).toBeGreaterThan(5)
    expect(computed.engineContract.dependencies).toEqual([
      { name: "mdast-util-from-markdown", version: "2.0.3" },
    ])
    expect(computed.engineContract.engineContractDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(computed.manifest.entries).toHaveLength(20)
    expect(
      computed.manifest.entries.every(
        (entry) =>
          entry.engineContractDigest ===
          computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("reports zero, partial, and complete review states without changing publication", async () => {
    const committed = await readCommittedSeedBatch({ repositoryRoot })
    const pendingPublication = {
      runtimeProjections: computed.runtimeProjections,
      tracker: computed.tracker,
      summary: null,
    }
    const withoutReviews = {
      ...committed,
      ...pendingPublication,
      reviews: [],
      editorial: null,
    }
    const withOneReview = {
      ...withoutReviews,
      reviews: committed.reviews.slice(0, 1),
    }
    const withTwoReviews = {
      ...withoutReviews,
      reviews: committed.reviews.slice(0, 2),
    }

    expect(checkSeedBatchState({ computed, committed: withoutReviews })).toMatchObject({
      status: "awaiting-independent-review",
      errors: [],
      committedIndependentReviews: 0,
    })
    expect(checkSeedBatchState({ computed, committed: withOneReview })).toMatchObject({
      status: "awaiting-second-independent-review",
      errors: [],
      committedIndependentReviews: 1,
    })
    expect(checkSeedBatchState({ computed, committed: withTwoReviews })).toMatchObject({
      status: "awaiting-editorial",
      errors: [],
      committedIndependentReviews: 2,
    })
    expect(
      checkSeedBatchState({
        computed,
        committed: {
          ...withTwoReviews,
          reviews: [
            { ...withTwoReviews.reviews[0], reviewDigest: "0".repeat(64) },
            withTwoReviews.reviews[1],
          ],
        },
      }),
    ).toMatchObject({
      status: "invalid-review-evidence",
      errors: [expect.stringContaining("Stale review digest")],
    })
  })

  it("checks frozen mechanical artifacts after reviews land", async () => {
    const committed = await readCommittedSeedBatch({ repositoryRoot })
    const state = checkSeedBatchState({ computed, committed })

    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
    expect(committed.reviews).toHaveLength(2)
    expect(
      checkSeedBatchState({
        computed,
        committed: {
          ...committed,
          normalized: { ...committed.normalized, candidateCount: 19 },
        },
      }).errors,
    ).toContain("Committed normalized candidates has deterministic drift")
  })

  it("refuses to regenerate a batch after review evidence exists", async () => {
    await expect(
      writeSeedBatchArtifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("fails closed on stale editorial evidence", async () => {
    const committed = await readCommittedSeedBatch({ repositoryRoot })
    expect(committed.editorial).not.toBeNull()
    const staleState = checkSeedBatchState({
      computed,
      committed: {
        ...committed,
        editorial: {
          ...committed.editorial,
          editorialDigest: "0".repeat(64),
        },
      },
    })
    expect(staleState.status).toBe("invalid-editorial-evidence")
    expect(
      staleState.errors.some((error) => error.includes("Stale editorial digest")),
    ).toBe(true)
  })

  it("publishes exactly the editorially accepted set when editorial evidence exists", async () => {
    const committed = await readCommittedSeedBatch({ repositoryRoot })
    if (committed.editorial === null) {
      expect(checkSeedBatchState({ computed, committed })).toMatchObject({
        status: "awaiting-editorial",
        errors: [],
      })
      expect(committed.tracker.acceptedTotal).toBe(0)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildSeedBatchPublication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(20)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 4,
      2: 4,
      3: 4,
      4: 4,
      5: 4,
    })
    expect(publication.summary).toMatchObject({
      status: "published",
      accepted: 20,
      rejected: 0,
      blocked: 0,
    })
    expect(checkSeedBatchState({ computed, committed })).toMatchObject({
      status: "published",
      errors: [],
    })

    const malformedRevision = structuredClone(committed)
    const foundationId = computed.normalized.candidates[0]!.id
    const foundationProjection = Object.values(
      malformedRevision.runtimeProjections.levels,
    )
      .flat()
      .find((problem) => problem.id === foundationId)!
    foundationProjection.revision = "not-a-number"
    expect(
      checkSeedBatchState({ computed, committed: malformedRevision }).errors,
    ).toContainEqual(expect.stringContaining("has invalid revision"))
  })
})
