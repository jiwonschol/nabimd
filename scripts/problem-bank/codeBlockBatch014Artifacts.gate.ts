import { describe, expect, it } from "vitest"
import { codeBlockBatch014Fixtures } from "../../src/content/batches/codeBlockBatch014Fixtures"
import {
  buildCodeBlockBatch014Artifacts,
  buildCodeBlockBatch014Publication,
  checkCodeBlockBatch014State,
  publishCodeBlockBatch014Artifacts,
  readCommittedCodeBlockBatch014,
  writeCodeBlockBatch014Artifacts,
} from "./codeBlockBatch014Support"

const repositoryRoot = process.cwd()
const writeArtifacts = process.env.NABI_WRITE_CODE_BLOCK_BATCH_014 === "1"
const publishArtifacts = process.env.NABI_PUBLISH_CODE_BLOCK_BATCH_014 === "1"
const computed = await buildCodeBlockBatch014Artifacts({ repositoryRoot })

if (writeArtifacts) {
  await writeCodeBlockBatch014Artifacts({ repositoryRoot, computed })
}
if (publishArtifacts) {
  await publishCodeBlockBatch014Artifacts({ repositoryRoot, computed })
}

describe("schema-v2 Level 1 fenced code-block and Level 2 rebuild batch 014", () => {
  it("runs all candidate fixtures through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      codeBlockBatch014Fixtures.length,
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

  it("preserves the 272-problem bank before unanimous acceptance", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(272)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 112,
      2: 112,
      3: 28,
      4: 16,
      5: 4,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedCodeBlockBatch014({ repositoryRoot })
    const state = checkCodeBlockBatch014State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedCodeBlockBatch014({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkCodeBlockBatch014State({ computed, committed }).status).toBe(
        "awaiting-independent-review",
      )
      return
    }
    await expect(
      writeCodeBlockBatch014Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes all 24 only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedCodeBlockBatch014({ repositoryRoot })
    const state = checkCodeBlockBatch014State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(272)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildCodeBlockBatch014Publication({ computed, committed })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(296)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 124,
      2: 124,
      3: 28,
      4: 16,
      5: 4,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({
      "fenced-code-blocks": 12,
      "rebuild-code-block-documents": 12,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })
})
