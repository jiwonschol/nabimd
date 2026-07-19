import { describe, expect, it } from "vitest"
import { linkBatch008Fixtures } from "../../src/content/batches/linkBatch008Fixtures"
import {
  buildLinkBatch008Artifacts,
  buildLinkBatch008Publication,
  checkLinkBatch008State,
  publishLinkBatch008Artifacts,
  readCommittedLinkBatch008,
  writeLinkBatch008Artifacts,
} from "./linkBatch008Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_LINK_BATCH_008 === "1"
const publishArtifacts = process.env.NABI_PUBLISH_LINK_BATCH_008 === "1"
const computed = await buildLinkBatch008Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeLinkBatch008Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishLinkBatch008Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1-2 link expansion batch 008", () => {
  it("runs every fixture for all 24 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      linkBatch008Fixtures.length,
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

  it("preserves the 164-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(164)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 76,
      2: 76,
      3: 4,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedLinkBatch008({ repositoryRoot })
    const state = checkLinkBatch008State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedLinkBatch008({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkLinkBatch008State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeLinkBatch008Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedLinkBatch008({ repositoryRoot })
    const state = checkLinkBatch008State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(164)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildLinkBatch008Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(188)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 88,
      2: 88,
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
