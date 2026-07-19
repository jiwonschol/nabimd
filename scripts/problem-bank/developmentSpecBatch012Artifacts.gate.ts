import { describe, expect, it } from "vitest"
import { developmentSpecBatch012Fixtures } from "../../src/content/batches/developmentSpecBatch012Fixtures"
import {
  buildDevelopmentSpecBatch012Artifacts,
  buildDevelopmentSpecBatch012Publication,
  checkDevelopmentSpecBatch012State,
  publishDevelopmentSpecBatch012Artifacts,
  readCommittedDevelopmentSpecBatch012,
  writeDevelopmentSpecBatch012Artifacts,
} from "./developmentSpecBatch012Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_DEVELOPMENT_SPEC_BATCH_012 === "1"
const publishArtifacts =
  process.env.NABI_PUBLISH_DEVELOPMENT_SPEC_BATCH_012 === "1"
const computed = await buildDevelopmentSpecBatch012Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeDevelopmentSpecBatch012Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishDevelopmentSpecBatch012Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 4 development-spec expansion batch 012", () => {
  it("runs every fixture for all 12 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      developmentSpecBatch012Fixtures.length,
    )
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

  it("preserves the 236-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(236)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 100,
      2: 100,
      3: 28,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedDevelopmentSpecBatch012({ repositoryRoot })
    const state = checkDevelopmentSpecBatch012State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedDevelopmentSpecBatch012({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkDevelopmentSpecBatch012State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeDevelopmentSpecBatch012Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedDevelopmentSpecBatch012({ repositoryRoot })
    const state = checkDevelopmentSpecBatch012State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(236)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildDevelopmentSpecBatch012Publication({
      computed,
      committed,
    })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(248)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 100,
      2: 100,
      3: 28,
      4: 16,
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
