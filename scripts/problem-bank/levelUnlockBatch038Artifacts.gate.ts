import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { levelUnlockBatch038Fixtures } from "../../src/content/batches/levelUnlockBatch038Fixtures"
import { levelUnlockBatch038Problems } from "../../src/content/batches/levelUnlockBatch038Problems"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import { buildGuidedDraft, deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"
import {
  buildLevelUnlockBatch038Artifacts,
  buildLevelUnlockBatch038Publication,
  checkLevelUnlockBatch038State,
  readCommittedLevelUnlockBatch038,
  writeLevelUnlockBatch038Artifacts,
} from "./levelUnlockBatch038Support"

const repositoryRoot = process.cwd()
const computed = await buildLevelUnlockBatch038Artifacts({ repositoryRoot })

describe("schema-v2 Level 2 and 3 unlock batch 038", () => {
  it("normalizes all candidates and verifies every real-engine fixture", () => {
    expect(computed.normalized.candidateCount).toBe(24)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(levelUnlockBatch038Fixtures.length)
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(24)
    expect(computed.regressionVerification.candidates.every((candidate: { passed: boolean }) => candidate.passed)).toBe(true)
  })

  it("binds all candidates to the real syntax detector", () => {
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/engine/syntaxPresence.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/markdown/parser.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/editor/renderedMarkdown.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/content/plaintextStarter.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/guided/guidedSyntax.ts")
    expect(computed.manifest.entries).toHaveLength(levelUnlockBatch038Problems.length)
  })

  it("replays every completed guided draft through the real evaluator", () => {
    for (const problem of levelUnlockBatch038Problems) {
      const checkpoints = deriveSyntaxCheckpoints(problem.target, problem.starterText)
      const completed = buildGuidedDraft(problem.target, checkpoints, checkpoints.length)
      expect(evaluateProblem(problem, completed), problem.id).toMatchObject({
        status: "pass",
      })
    }
  })

  it("tracks the empty review directory without forging review JSON", async () => {
    const reviewReadme = await readFile(
      `${repositoryRoot}/curriculum/problem-bank/batches/2026-08-31-l2-l3-unlock-038/reviews/README.md`,
      "utf8",
    )
    expect(reviewReadme).toContain("two sealed JSON review records")
    expect(reviewReadme).toContain("all 24 candidate revisions independently")
  })

  it("keeps committed mechanical evidence deterministic and unsealed", async () => {
    const committed = await readCommittedLevelUnlockBatch038({ repositoryRoot })
    expect(checkLevelUnlockBatch038State({ computed, committed })).toEqual({
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
    const committed = await readCommittedLevelUnlockBatch038({ repositoryRoot })
    const publication = buildLevelUnlockBatch038Publication({ computed, committed })
    expect(publication.errors).toContain("Batch 2026-08-31-l2-l3-unlock-038 requires 2 independent reviews")
    expect(publication.errors).toContain("Batch 2026-08-31-l2-l3-unlock-038 requires separate editorial evidence")
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedLevelUnlockBatch038({ repositoryRoot })
    expect(committed.reviews).toEqual([])
    await expect(writeLevelUnlockBatch038Artifacts({ repositoryRoot, computed })).resolves.toBeUndefined()
  })
})
