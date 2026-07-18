import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import { emphasisBatch003Fixtures } from "./emphasisBatch003Fixtures"
import { emphasisBatch003Problems } from "./emphasisBatch003Problems"

const batchId = "2026-07-19-l1-l2-emphasis-003"

describe("emphasis batch 003", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(emphasisBatch003Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = emphasisBatch003Problems.filter(
        (problem) => problem.level === level,
      )

      expect(problems).toHaveLength(12)
      expect(new Set(problems.map((problem) => problem.id)).size).toBe(12)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(
        12,
      )
      expect(new Set(problems.map((problem) => problem.retryFamily)).size).toBe(1)
      expect(
        problems.every(
          (problem) =>
            problem.sourceBatchId === batchId &&
            problem.teachingMode === (level === 1 ? "introduce" : "recall") &&
            problem.vocabulary.profile ===
              (level === 1 ? "everyday" : "everyday-recall"),
        ),
      ).toBe(true)
    }
  })

  it("grades only parsed bold structure and keeps restraint nonblocking", () => {
    for (const problem of emphasisBatch003Problems) {
      expect(problem.matchChecks).toEqual([
        {
          id: "use-bold-emphasis",
          kind: "inline-presence",
          scope: { kind: "document" },
          inline: "strong",
          min: 1,
          priority: 10,
          feedback: "Make at least one phrase bold with Markdown.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-bold-focused",
          kind: "max-inline-count",
          scope: { kind: "document" },
          inline: "strong",
          max: 1,
          review: "Keep bold focused on one important phrase in this short note.",
        },
      ])
    }
  })

  it("provides nine real-engine fixtures per problem", () => {
    expect(emphasisBatch003Fixtures).toHaveLength(24 * 9)
    expect(
      validateProblemBank(emphasisBatch003Problems, emphasisBatch003Fixtures),
    ).toEqual([])

    for (const problem of emphasisBatch003Problems) {
      const fixtures = emphasisBatch003Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(9)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "underscore-strong",
          "inline-emphasis",
          "inline-code",
        ]),
      )
      expect(
        new Set(
          fixtures
            .map((fixture) => fixture.exercisesCheckId)
            .filter((checkId): checkId is string => Boolean(checkId)),
        ),
      ).toEqual(new Set(problem.matchChecks.map((check) => check.id)))
    }
  })

  it.each(emphasisBatch003Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = emphasisBatch003Problems.find(
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

  it.each(emphasisBatch003Problems)(
    "grades $id by Markdown grammar, not prose, case, spelling, or marker choice",
    (problem) => {
      expect(evaluateProblem(problem, "**Completely new words!**")).toEqual({
        status: "matched",
        reviewItems: [],
      })
      expect(evaluateProblem(problem, "__misspeled WORDS__")).toEqual({
        status: "matched",
        reviewItems: [],
      })
    },
  )
})
