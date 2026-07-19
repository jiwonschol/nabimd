import { describe, expect, it } from "vitest"
import { readableDocumentBatch011Fixtures } from "../../src/content/batches/readableDocumentBatch011Fixtures"
import {
  buildReadableDocumentBatch011Artifacts,
  buildReadableDocumentBatch011Publication,
  checkReadableDocumentBatch011State,
  publishReadableDocumentBatch011Artifacts,
  readCommittedReadableDocumentBatch011,
  writeReadableDocumentBatch011Artifacts,
} from "./readableDocumentBatch011Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_READABLE_DOCUMENT_BATCH_011 === "1"
const publishArtifacts =
  process.env.NABI_PUBLISH_READABLE_DOCUMENT_BATCH_011 === "1"
const computed = await buildReadableDocumentBatch011Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeReadableDocumentBatch011Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishReadableDocumentBatch011Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 3 composite-document expansion batch 011", () => {
  it("runs every fixture for all 12 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      readableDocumentBatch011Fixtures.length,
    )
    expect(computed.fixtureArtifact.fixtures).toHaveLength(252)
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(12)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds every review entry to fixtures and the explicit engine contract", () => {
    expect(computed.engineContract.files.length).toBeGreaterThan(5)
    expect(computed.engineContract.dependencies).toEqual([
      { name: "mdast-util-from-markdown", version: "2.0.3" },
    ])
    expect(computed.engineContract.engineContractDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(computed.manifest.entries).toHaveLength(12)
    expect(
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest === computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("preserves the 224-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(224)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 100,
      2: 100,
      3: 16,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedReadableDocumentBatch011({ repositoryRoot })
    const state = checkReadableDocumentBatch011State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedReadableDocumentBatch011({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkReadableDocumentBatch011State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeReadableDocumentBatch011Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedReadableDocumentBatch011({ repositoryRoot })
    const state = checkReadableDocumentBatch011State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(224)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildReadableDocumentBatch011Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(236)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 100,
      2: 100,
      3: 28,
      4: 4,
      5: 4,
    })
    expect(publication.summary).toMatchObject({
      status: "published",
      generated: 12,
      accepted: 12,
      rejected: 0,
      blocked: 0,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })
})
