import { describe, expect, it } from "vitest"
import { emphasisBatch003Fixtures } from "../../src/content/batches/emphasisBatch003Fixtures"
import {
  buildEmphasisBatch003Artifacts,
  buildEmphasisBatch003Publication,
  checkEmphasisBatch003State,
  publishEmphasisBatch003Artifacts,
  readCommittedEmphasisBatch003,
  writeEmphasisBatch003Artifacts,
} from "./emphasisBatch003Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_EMPHASIS_BATCH_003 === "1"
const publishArtifacts = process.env.NABI_PUBLISH_EMPHASIS_BATCH_003 === "1"
const computed = await buildEmphasisBatch003Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeEmphasisBatch003Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishEmphasisBatch003Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1-2 emphasis expansion batch 003", () => {
  it("runs every fixture for all 24 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      emphasisBatch003Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(24)
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
    expect(computed.manifest.entries).toHaveLength(24)
    expect(
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest === computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("preserves the 44-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(44)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 16,
      2: 16,
      3: 4,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedEmphasisBatch003({ repositoryRoot })
    const state = checkEmphasisBatch003State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedEmphasisBatch003({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkEmphasisBatch003State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeEmphasisBatch003Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedEmphasisBatch003({ repositoryRoot })
    const state = checkEmphasisBatch003State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(44)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildEmphasisBatch003Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(68)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 28,
      2: 28,
      3: 4,
      4: 4,
      5: 4,
    })
    expect(publication.summary).toMatchObject({
      status: "published",
      generated: 24,
      accepted: 24,
      rejected: 0,
      blocked: 0,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })
})
