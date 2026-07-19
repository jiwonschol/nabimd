import { describe, expect, it } from "vitest"
import { italicRebuildBatch013Fixtures } from "../../src/content/batches/italicRebuildBatch013Fixtures"
import {
  buildItalicRebuildBatch013Artifacts,
  buildItalicRebuildBatch013Publication,
  checkItalicRebuildBatch013State,
  publishItalicRebuildBatch013Artifacts,
  readCommittedItalicRebuildBatch013,
  writeItalicRebuildBatch013Artifacts,
} from "./italicRebuildBatch013Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_ITALIC_REBUILD_BATCH_013 === "1"
const publishArtifacts = process.env.NABI_PUBLISH_ITALIC_REBUILD_BATCH_013 === "1"
const computed = await buildItalicRebuildBatch013Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeItalicRebuildBatch013Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishItalicRebuildBatch013Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1 italic and Level 2 rebuild batch 013", () => {
  it("runs all candidate fixtures through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      italicRebuildBatch013Fixtures.length,
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
          entry.engineContractDigest === computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("preserves the 248-problem bank before unanimous acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(248)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 100,
      2: 100,
      3: 28,
      4: 16,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedItalicRebuildBatch013({ repositoryRoot })
    const state = checkItalicRebuildBatch013State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedItalicRebuildBatch013({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkItalicRebuildBatch013State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeItalicRebuildBatch013Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes all 24 only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedItalicRebuildBatch013({ repositoryRoot })
    const state = checkItalicRebuildBatch013State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(248)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildItalicRebuildBatch013Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(272)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 112,
      2: 112,
      3: 28,
      4: 16,
      5: 4,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({
      "italic-emphasis": 12,
      "rebuild-real-documents": 12,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })
})
