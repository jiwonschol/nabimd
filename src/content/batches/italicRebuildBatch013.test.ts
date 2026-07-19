import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { getSyntaxFamily } from "../../selection/runComposition"
import { validateProblemBank } from "../validateProblemBank"
import { italicRebuildBatch013Fixtures } from "./italicRebuildBatch013Fixtures"
import { italicRebuildBatch013Problems } from "./italicRebuildBatch013Problems"

const batchId = "2026-07-20-l1-italic-l2-rebuilds-013"

describe("italic and rebuild batch 013", () => {
  it("adds twelve Level 1 italic lessons and twelve Level 2 document rebuilds", () => {
    expect(italicRebuildBatch013Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = italicRebuildBatch013Problems.filter(
        (problem) => problem.level === level,
      )
      expect(problems).toHaveLength(12)
      expect(new Set(problems.map((problem) => problem.id)).size).toBe(12)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(12)
      expect(
        problems.every(
          (problem) =>
            problem.sourceBatchId === batchId &&
            problem.flavor === "standard",
        ),
      ).toBe(true)
    }
  })

  it("makes italic a schedulable Level 1 family and Level 2 rebuilds composite", () => {
    const levelOne = italicRebuildBatch013Problems.filter(
      (problem) => problem.level === 1,
    )
    const levelTwo = italicRebuildBatch013Problems.filter(
      (problem) => problem.level === 2,
    )

    expect(levelOne.every((problem) => getSyntaxFamily(problem) === "italic")).toBe(true)
    expect(levelTwo.every((problem) => getSyntaxFamily(problem) === null)).toBe(true)
    expect(new Set(levelTwo.map((problem) => problem.retryFamily))).toEqual(
      new Set([
        "level-2-rebuild-quick-note",
        "level-2-rebuild-short-process",
        "level-2-rebuild-quote-card",
      ]),
    )
  })

  it("binds every candidate to complete real-engine fixtures", () => {
    expect(validateProblemBank(
      italicRebuildBatch013Problems,
      italicRebuildBatch013Fixtures,
    )).toEqual([])

    for (const problem of italicRebuildBatch013Problems) {
      const fixtures = italicRebuildBatch013Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length).toBeGreaterThanOrEqual(14)
      expect([...new Set(fixtures.map((fixture) => fixture.role))]).toEqual(
        expect.arrayContaining([
          "canonical",
          "different-prose",
          "case-spelling-variation",
          "missing",
          "malformed",
          "matched-with-review",
          "edge-case",
        ]),
      )
      expect(
        new Set(
          fixtures
            .map((fixture) => fixture.exercisesCheckId)
            .filter((id): id is string => Boolean(id)),
        ),
      ).toEqual(new Set(problem.matchChecks.map((check) => check.id)))
    }
  })

  it.each(italicRebuildBatch013Fixtures)(
    "runs $id through the learner grading engine",
    (fixture) => {
      const problem = italicRebuildBatch013Problems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      expect(problem).toBeDefined()

      const actual = evaluateProblem(problem!, fixture.source)
      expect(actual.status).toBe(fixture.expectedStatus)
      if (actual.status === "fail") {
        expect(actual.feedbackId).toBe(fixture.expectedFeedbackId)
      } else {
        expect(actual.reviewItems.map((item) => item.id)).toEqual(
          fixture.expectedReviewIds ?? [],
        )
      }
    },
  )

  it("grades italic grammar rather than prose, case, spelling, or marker choice", () => {
    for (const problem of italicRebuildBatch013Problems.filter(
      (candidate) => candidate.level === 1,
    )) {
      expect(evaluateProblem(problem, "*completely new words*").status).toBe(
        "matched",
      )
      expect(evaluateProblem(problem, "_MISPELED WORDS_").status).toBe(
        "matched",
      )
      expect(evaluateProblem(problem, "**bold only**").status).toBe("fail")
    }
  })
})
