import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { levelUnlockBatch037Fixtures } from "../../src/content/batches/levelUnlockBatch037Fixtures"
import { levelUnlockBatch037Problems } from "../../src/content/batches/levelUnlockBatch037Problems"
import {
  buildLevelUnlockBatch037Artifacts,
  buildLevelUnlockBatch037Publication,
  checkLevelUnlockBatch037State,
  readCommittedLevelUnlockBatch037,
  writeLevelUnlockBatch037Artifacts,
} from "./levelUnlockBatch037Support"

const repositoryRoot = process.cwd()
const computed = await buildLevelUnlockBatch037Artifacts({ repositoryRoot })

describe("schema-v2 Level 2 and 3 unlock batch 037", () => {
  it("normalizes all candidates and verifies every real-engine fixture", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(levelUnlockBatch037Fixtures.length)
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(24)
    expect(computed.regressionVerification.candidates.every((candidate: { passed: boolean }) => candidate.passed)).toBe(true)
  })

  it("binds all candidates to the real syntax detector", () => {
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/engine/syntaxPresence.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/markdown/parser.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/editor/renderedMarkdown.ts")
    expect(computed.manifest.entries).toHaveLength(levelUnlockBatch037Problems.length)
  })

  it("tracks the empty review directory without forging review JSON", async () => {
    const reviewReadme = await readFile(
      `${repositoryRoot}/curriculum/problem-bank/batches/2026-08-31-l2-l3-unlock-037/reviews/README.md`,
      "utf8",
    )
    expect(reviewReadme).toContain("two sealed JSON review records")
    expect(reviewReadme).toContain("all 24 candidate revisions independently")
  })

  it("keeps committed mechanical evidence deterministic and unsealed", async () => {
    const committed = await readCommittedLevelUnlockBatch037({ repositoryRoot })
    expect(checkLevelUnlockBatch037State({ computed, committed })).toEqual({
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
    const committed = await readCommittedLevelUnlockBatch037({ repositoryRoot })
    const publication = buildLevelUnlockBatch037Publication({ computed, committed })
    expect(publication.errors).toContain("Batch 2026-08-31-l2-l3-unlock-037 requires 2 independent reviews")
    expect(publication.errors).toContain("Batch 2026-08-31-l2-l3-unlock-037 requires separate editorial evidence")
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedLevelUnlockBatch037({ repositoryRoot })
    expect(committed.reviews).toEqual([])
    await expect(writeLevelUnlockBatch037Artifacts({ repositoryRoot, computed })).resolves.toBeUndefined()
  })
})
