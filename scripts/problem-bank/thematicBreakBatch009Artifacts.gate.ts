import { describe, expect, it } from "vitest"
import { thematicBreakBatch009Fixtures } from "../../src/content/batches/thematicBreakBatch009Fixtures"
import {
  buildThematicBreakBatch009Artifacts,
  buildThematicBreakBatch009Publication,
  checkThematicBreakBatch009State,
  publishThematicBreakBatch009Artifacts,
  readCommittedThematicBreakBatch009,
  writeThematicBreakBatch009Artifacts,
} from "./thematicBreakBatch009Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_THEMATIC_BREAK_BATCH_009 === "1"
const publishArtifacts =
  process.env.NABI_PUBLISH_THEMATIC_BREAK_BATCH_009 === "1"
const computed = await buildThematicBreakBatch009Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeThematicBreakBatch009Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishThematicBreakBatch009Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1-2 thematic-break expansion batch 009", () => {
  it("runs every fixture for all 24 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      thematicBreakBatch009Fixtures.length,
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

  it("preserves the 188-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(188)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 88,
      2: 88,
      3: 4,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedThematicBreakBatch009({ repositoryRoot })
    const state = checkThematicBreakBatch009State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedThematicBreakBatch009({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkThematicBreakBatch009State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeThematicBreakBatch009Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedThematicBreakBatch009({ repositoryRoot })
    const state = checkThematicBreakBatch009State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(188)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildThematicBreakBatch009Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(212)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 100,
      2: 100,
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
