import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { levelUnlockBatch032Fixtures } from "../../src/content/batches/levelUnlockBatch032Fixtures"
import { levelUnlockBatch032Problems } from "../../src/content/batches/levelUnlockBatch032Problems"
import {
  buildLevelUnlockBatch032Artifacts,
  buildLevelUnlockBatch032Publication,
  checkLevelUnlockBatch032State,
  readCommittedLevelUnlockBatch032,
  writeLevelUnlockBatch032Artifacts,
} from "./levelUnlockBatch032Support"

const repositoryRoot = process.cwd()
const computed = await buildLevelUnlockBatch032Artifacts({ repositoryRoot })

describe("schema-v2 Level 2 and 3 unlock batch 032", () => {
  it("normalizes all candidates and verifies every real-engine fixture", () => {
    expect(computed.normalized.candidateCount).toBe(26)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(levelUnlockBatch032Fixtures.length)
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(26)
    expect(computed.regressionVerification.candidates.every((candidate: { passed: boolean }) => candidate.passed)).toBe(true)
  })

  it("binds all candidates to the real syntax detector", () => {
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/engine/syntaxPresence.ts")
    expect(computed.manifest.entries).toHaveLength(levelUnlockBatch032Problems.length)
  })

  it("tracks the empty review directory without forging review JSON", async () => {
    const reviewReadme = await readFile(
      `${repositoryRoot}/curriculum/problem-bank/batches/2026-08-30-l2-l3-unlock-032/reviews/README.md`,
      "utf8",
    )
    expect(reviewReadme).toContain("two sealed JSON review records")
    expect(reviewReadme).toContain("all 26 candidate revisions independently")
  })

  it("keeps committed mechanical evidence deterministic and unsealed", async () => {
    const committed = await readCommittedLevelUnlockBatch032({ repositoryRoot })
    expect(checkLevelUnlockBatch032State({ computed, committed })).toEqual({
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
    const committed = await readCommittedLevelUnlockBatch032({ repositoryRoot })
    const publication = buildLevelUnlockBatch032Publication({ computed, committed })
    expect(publication.errors).toContain("Batch 2026-08-30-l2-l3-unlock-032 requires 2 independent reviews")
    expect(publication.errors).toContain("Batch 2026-08-30-l2-l3-unlock-032 requires separate editorial evidence")
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedLevelUnlockBatch032({ repositoryRoot })
    expect(committed.reviews).toEqual([])
    await expect(writeLevelUnlockBatch032Artifacts({ repositoryRoot, computed })).resolves.toBeUndefined()
  })
})
