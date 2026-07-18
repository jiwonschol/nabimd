import { describe, expect, it } from "vitest"
import { headingBatch002Fixtures } from "../../src/content/batches/headingBatch002Fixtures"
import {
  buildHeadingBatch002Artifacts,
  buildHeadingBatch002Publication,
  checkHeadingBatch002State,
  publishHeadingBatch002Artifacts,
  readCommittedHeadingBatch002,
  writeHeadingBatch002Artifacts,
} from "./headingBatch002Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_HEADING_BATCH_002 === "1"
const publishArtifacts = process.env.NABI_PUBLISH_HEADING_BATCH_002 === "1"
const computed = await buildHeadingBatch002Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeHeadingBatch002Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishHeadingBatch002Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1-2 heading expansion batch 002", () => {
  it("runs every fixture for all 24 candidates through the real engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      headingBatch002Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(24)
    expect(
      computed.normalized.candidates.every(
        (candidate: { sourceBatch: string; sourceBatchId?: string }) =>
          candidate.sourceBatch === computed.normalized.batchId &&
          !("sourceBatchId" in candidate),
      ),
    ).toBe(true)
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
          entry.engineContractDigest ===
          computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("preserves the 20-problem published bank before editorial acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(20)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 4,
      2: 4,
      3: 4,
      4: 4,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedHeadingBatch002({ repositoryRoot })
    const state = checkHeadingBatch002State({ computed, committed })

    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
    expect(
      checkHeadingBatch002State({
        computed,
        committed: {
          ...committed,
          normalized: { ...committed.normalized, candidateCount: 23 },
        },
      }).errors,
    ).toContain("Committed normalized candidates has deterministic drift")
  })

  it("refuses to regenerate after independent evidence exists", async () => {
    const committed = await readCommittedHeadingBatch002({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(
        checkHeadingBatch002State({ computed, committed }).status,
      ).toBe("awaiting-independent-review")
      return
    }

    await expect(
      writeHeadingBatch002Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes the whole coherent batch only after unanimous review and editorial acceptance", async () => {
    const committed = await readCommittedHeadingBatch002({ repositoryRoot })
    const state = checkHeadingBatch002State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(20)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildHeadingBatch002Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(44)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 16,
      2: 16,
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
    if (state.status === "published") {
      expect(state.errors).toEqual([])
    } else {
      expect(
        state.errors.every((error) => error.includes("Published")),
      ).toBe(true)
    }
  })
})
