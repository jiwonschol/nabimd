import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { levelUnlockBatch035Fixtures } from "../../src/content/batches/levelUnlockBatch035Fixtures"
import { levelUnlockBatch035Problems } from "../../src/content/batches/levelUnlockBatch035Problems"
import {
  buildLevelUnlockBatch035Artifacts,
  buildLevelUnlockBatch035Publication,
  checkLevelUnlockBatch035State,
  readCommittedLevelUnlockBatch035,
  writeLevelUnlockBatch035Artifacts,
} from "./levelUnlockBatch035Support"

const repositoryRoot = process.cwd()
const computed = await buildLevelUnlockBatch035Artifacts({ repositoryRoot })

describe("schema-v2 Level 2 and 3 unlock batch 035", () => {
  it("normalizes all candidates and verifies every real-engine fixture", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(levelUnlockBatch035Fixtures.length)
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(24)
    expect(computed.regressionVerification.candidates.every((candidate: { passed: boolean }) => candidate.passed)).toBe(true)
  })

  it("binds all candidates to the real syntax detector", () => {
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/engine/syntaxPresence.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/markdown/parser.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/editor/renderedMarkdown.ts")
    expect(computed.manifest.entries).toHaveLength(levelUnlockBatch035Problems.length)
  })

  it("tracks the empty review directory without forging review JSON", async () => {
    const reviewReadme = await readFile(
      `${repositoryRoot}/curriculum/problem-bank/batches/2026-08-31-l2-l3-unlock-035/reviews/README.md`,
      "utf8",
    )
    expect(reviewReadme).toContain("two sealed JSON review records")
    expect(reviewReadme).toContain("all 24 candidate revisions independently")
  })

  it("keeps committed mechanical evidence deterministic and unsealed", async () => {
    const committed = await readCommittedLevelUnlockBatch035({ repositoryRoot })
    expect(checkLevelUnlockBatch035State({ computed, committed })).toEqual({
      status: "awaiting-independent-review",
      errors: [],
      committedIndependentReviews: 0,
    })
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
    expect(committed.reviews).toEqual([])
    expect(committed.editorial).toBeNull()
    expect(committed.summary).toBeNull()
  })

  it("refuses publication until independent seals exist", async () => {
    const committed = await readCommittedLevelUnlockBatch035({ repositoryRoot })
    const publication = buildLevelUnlockBatch035Publication({ computed, committed })
    expect(publication.errors).toContain("Batch 2026-08-31-l2-l3-unlock-035 requires 2 independent reviews")
    expect(publication.errors).toContain("Batch 2026-08-31-l2-l3-unlock-035 requires separate editorial evidence")
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedLevelUnlockBatch035({ repositoryRoot })
    expect(committed.reviews).toEqual([])
    await expect(writeLevelUnlockBatch035Artifacts({ repositoryRoot, computed })).resolves.toBeUndefined()
  })
})
