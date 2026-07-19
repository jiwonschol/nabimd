import { describe, expect, it } from "vitest"
import { inlineCodeBatch007Fixtures } from "../../src/content/batches/inlineCodeBatch007Fixtures"
import {
  buildInlineCodeBatch007Artifacts,
  buildInlineCodeBatch007Publication,
  checkInlineCodeBatch007State,
  publishInlineCodeBatch007Artifacts,
  readCommittedInlineCodeBatch007,
  writeInlineCodeBatch007Artifacts,
} from "./inlineCodeBatch007Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_INLINE_CODE_BATCH_007 === "1"
const publishArtifacts = process.env.NABI_PUBLISH_INLINE_CODE_BATCH_007 === "1"
const computed = await buildInlineCodeBatch007Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeInlineCodeBatch007Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishInlineCodeBatch007Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1-2 inline-code expansion batch 007", () => {
  it("runs every fixture for all 24 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      inlineCodeBatch007Fixtures.length,
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

  it("preserves the 140-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(140)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 64,
      2: 64,
      3: 4,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedInlineCodeBatch007({ repositoryRoot })
    const state = checkInlineCodeBatch007State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedInlineCodeBatch007({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkInlineCodeBatch007State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeInlineCodeBatch007Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedInlineCodeBatch007({ repositoryRoot })
    const state = checkInlineCodeBatch007State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(140)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildInlineCodeBatch007Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(164)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 76,
      2: 76,
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
