import { describe, expect, it } from "vitest"
import { advancedDocumentReplacementBatch018Fixtures } from "../../src/content/batches/advancedDocumentReplacementBatch018Fixtures"
import {
  advancedDocumentReplacementBatch018Problems,
} from "../../src/content/batches/advancedDocumentReplacementBatch018Problems"
import {
  buildAdvancedDocumentReplacementBatch018Artifacts,
  buildAdvancedDocumentReplacementBatch018Publication,
  checkAdvancedDocumentReplacementBatch018State,
  publishAdvancedDocumentReplacementBatch018Artifacts,
  readCommittedAdvancedDocumentReplacementBatch018,
  writeAdvancedDocumentReplacementBatch018Artifacts,
} from "./advancedDocumentReplacementBatch018Support"

const repositoryRoot = process.cwd()
const computed = await buildAdvancedDocumentReplacementBatch018Artifacts({
  repositoryRoot,
})

describe("schema-v2 compact advanced-document replacement batch 018", () => {
  it("runs every replacement fixture through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(18)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      advancedDocumentReplacementBatch018Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(18)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the exact prompt, revisions, fixtures, and engine contract", () => {
    expect(computed.engineContract.dependencies).toEqual([
      { name: "mdast-util-from-markdown", version: "2.0.3" },
    ])
    expect(computed.manifest.entries).toHaveLength(18)
    expect(computed.normalized.candidates.map(({ id, revision }) => ({
      id,
      revision,
    }))).toEqual(
      advancedDocumentReplacementBatch018Problems
        .map(({ id, revision }) => ({ id, revision }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    )
    expect(
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest ===
          computed.engineContract.engineContractDigest,
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
    const committed = await readCommittedAdvancedDocumentReplacementBatch018({
      repositoryRoot,
    })
    const state = checkAdvancedDocumentReplacementBatch018State({
      computed,
      committed,
    })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedAdvancedDocumentReplacementBatch018({
      repositoryRoot,
    })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkAdvancedDocumentReplacementBatch018State({
        computed,
        committed,
      })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeAdvancedDocumentReplacementBatch018Artifacts({
        repositoryRoot,
        computed,
      }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("replaces eighteen records without changing the published total", async () => {
    const committed = await readCommittedAdvancedDocumentReplacementBatch018({
      repositoryRoot,
    })
    const state = checkAdvancedDocumentReplacementBatch018State({
      computed,
      committed,
    })
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

    const publication = buildAdvancedDocumentReplacementBatch018Publication({
      computed,
      committed,
    })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(344)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 136,
      2: 148,
      3: 30,
      4: 20,
      5: 10,
    })
    const publishedById = new Map(
      publication.runtimeProjections.levels[4]
        .concat(publication.runtimeProjections.levels[5])
        .map((problem) => [problem.id, problem]),
    )
    for (const replacement of advancedDocumentReplacementBatch018Problems) {
      expect(publishedById.get(replacement.id)).toMatchObject({
        revision: replacement.revision,
        sourceBatchId: computed.normalized.batchId,
      })
    }
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedAdvancedDocumentReplacementBatch018({
      repositoryRoot,
    })
    if (committed.editorial !== null) return
    await expect(
      publishAdvancedDocumentReplacementBatch018Artifacts({
        repositoryRoot,
        computed,
      }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
