import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { levelUnlockBatch039Fixtures } from "../../src/content/batches/levelUnlockBatch039Fixtures"
import { levelUnlockBatch039Problems } from "../../src/content/batches/levelUnlockBatch039Problems"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import { buildGuidedDraft, deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"
import {
  buildLevelUnlockBatch039Artifacts,
  buildLevelUnlockBatch039Publication,
  checkLevelUnlockBatch039State,
  readCommittedLevelUnlockBatch039,
  writeLevelUnlockBatch039Artifacts,
} from "./levelUnlockBatch039Support"

const repositoryRoot = process.cwd()
const computed = await buildLevelUnlockBatch039Artifacts({ repositoryRoot })

describe("schema-v2 Level 2 and 3 unlock batch 039", () => {
  it("normalizes all candidates and verifies every real-engine fixture", () => {
    expect(computed.normalized.candidateCount).toBe(60)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(levelUnlockBatch039Fixtures.length)
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(60)
    expect(computed.regressionVerification.candidates.every((candidate: { passed: boolean }) => candidate.passed)).toBe(true)
  })

  it("binds all candidates to the real syntax detector", () => {
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/engine/syntaxPresence.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/markdown/parser.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/editor/renderedMarkdown.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/content/plaintextStarter.ts")
    expect(computed.engineContract.files.map(({ path }: { path: string }) => path)).toContain("src/guided/guidedSyntax.ts")
    expect(computed.manifest.entries).toHaveLength(levelUnlockBatch039Problems.length)
  })

  it("replays every completed guided draft through the real evaluator", () => {
    for (const problem of levelUnlockBatch039Problems) {
      const checkpoints = deriveSyntaxCheckpoints(problem.target, problem.starterText)
      const completed = buildGuidedDraft(problem.target, checkpoints, checkpoints.length)
      expect(evaluateProblem(problem, completed).status, problem.id).not.toBe(
        "fail",
      )
    }
  })

  it("tracks the empty review directory without forging review JSON", async () => {
    const reviewReadme = await readFile(
      `${repositoryRoot}/curriculum/problem-bank/batches/2026-08-31-l2-l3-unlock-039/reviews/README.md`,
      "utf8",
    )
    expect(reviewReadme).toContain("two sealed JSON review records")
    expect(reviewReadme).toContain("all 60 candidate revisions independently")
  })

  it("keeps committed mechanical evidence deterministic in every review phase", async () => {
    const committed = await readCommittedLevelUnlockBatch039({ repositoryRoot })
    const state = checkLevelUnlockBatch039State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("keeps publication closed until every independent seal exists", async () => {
    const committed = await readCommittedLevelUnlockBatch039({ repositoryRoot })
    const state = checkLevelUnlockBatch039State({ computed, committed })
    const publication = buildLevelUnlockBatch039Publication({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(publication.errors).toContain(
        "Batch 2026-08-31-l2-l3-unlock-039 requires separate editorial evidence",
      )
      return
    }
    expect(publication.errors).toEqual([])
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedLevelUnlockBatch039({ repositoryRoot })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      await expect(
        writeLevelUnlockBatch039Artifacts({ repositoryRoot, computed }),
      ).resolves.toBeUndefined()
      return
    }
    await expect(
      writeLevelUnlockBatch039Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })
})
