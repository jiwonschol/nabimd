import { describe, expect, it } from "vitest"
import { advancedDocumentBatch017Fixtures } from "../../src/content/batches/advancedDocumentBatch017Fixtures"
import {
  buildAdvancedDocumentBatch017Artifacts,
  buildAdvancedDocumentBatch017Publication,
  checkAdvancedDocumentBatch017State,
  publishAdvancedDocumentBatch017Artifacts,
  readCommittedAdvancedDocumentBatch017,
  writeAdvancedDocumentBatch017Artifacts,
} from "./advancedDocumentBatch017Support"

const repositoryRoot = process.cwd()
const computed = await buildAdvancedDocumentBatch017Artifacts({ repositoryRoot })

describe("schema-v2 Level 3-5 advanced-document batch 017", () => {
  it("runs every candidate fixture through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      advancedDocumentBatch017Fixtures.length,
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
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest ===
          computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("preserves the 332-problem bank before unanimous acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(332)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 136,
      2: 148,
      3: 28,
      4: 16,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedAdvancedDocumentBatch017({ repositoryRoot })
    const state = checkAdvancedDocumentBatch017State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedAdvancedDocumentBatch017({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkAdvancedDocumentBatch017State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeAdvancedDocumentBatch017Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the 344 checkpoint only after unanimous review", async () => {
    const committed = await readCommittedAdvancedDocumentBatch017({ repositoryRoot })
    const state = checkAdvancedDocumentBatch017State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(332)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildAdvancedDocumentBatch017Publication({
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
    expect(publication.tracker.counts.byFamily).toMatchObject({
      "readable-human-document": 30,
      "executable-development-spec": 20,
      "agent-ready-work-order": 10,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedAdvancedDocumentBatch017({ repositoryRoot })
    if (committed.editorial !== null) return
    await expect(
      publishAdvancedDocumentBatch017Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
