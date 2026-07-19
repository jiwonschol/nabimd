import { describe, expect, it } from "vitest"
import { headingDepthBatch015Fixtures } from "../../src/content/batches/headingDepthBatch015Fixtures"
import {
  buildHeadingDepthBatch015Artifacts,
  buildHeadingDepthBatch015Publication,
  checkHeadingDepthBatch015State,
  publishHeadingDepthBatch015Artifacts,
  readCommittedHeadingDepthBatch015,
  writeHeadingDepthBatch015Artifacts,
} from "./headingDepthBatch015Support"

const repositoryRoot = process.cwd()
const computed = await buildHeadingDepthBatch015Artifacts({ repositoryRoot })

describe("schema-v2 Level 1 heading-depth and Level 2 sectioned-document batch 015", () => {
  it("runs all candidate fixtures through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      headingDepthBatch015Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(24)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the exact prompt, content, fixtures, and engine contract", () => {
    expect(computed.engineContract.dependencies).toEqual([
      { name: "mdast-util-from-markdown", version: "2.0.3" },
    ])
    expect(computed.manifest.entries).toHaveLength(24)
    expect(
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest ===
          computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("preserves the 296-problem bank before unanimous acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(296)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 124,
      2: 124,
      3: 28,
      4: 16,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedHeadingDepthBatch015({
      repositoryRoot,
    })
    const state = checkHeadingDepthBatch015State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedHeadingDepthBatch015({
      repositoryRoot,
    })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkHeadingDepthBatch015State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeHeadingDepthBatch015Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes all 24 only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedHeadingDepthBatch015({
      repositoryRoot,
    })
    const state = checkHeadingDepthBatch015State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(296)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildHeadingDepthBatch015Publication({
      computed,
      committed,
    })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(320)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 136,
      2: 136,
      3: 28,
      4: 16,
      5: 4,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({
      headings: 44,
      "rebuild-sectioned-documents": 12,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedHeadingDepthBatch015({
      repositoryRoot,
    })
    if (committed.editorial !== null) return
    await expect(
      publishHeadingDepthBatch015Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
