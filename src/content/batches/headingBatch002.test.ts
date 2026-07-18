import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import { headingBatch002Fixtures } from "./headingBatch002Fixtures"
import { headingBatch002Problems } from "./headingBatch002Problems"

const batchId = "2026-07-19-l1-l2-headings-002"

describe("heading batch 002", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(headingBatch002Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = headingBatch002Problems.filter(
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

  it("defines exactly three grammar checks and one nonblocking title review", () => {
    for (const problem of headingBatch002Problems) {
      expect(problem.matchChecks.map((check) => check.id)).toEqual([
        "space-after-hash",
        "use-hash-heading-style",
        "use-h1-heading",
      ])
      expect(problem.matchChecks.every((check) => !("text" in check))).toBe(
        true,
      )
      expect(problem.editorialChecks).toEqual([
        {
          id: "one-document-title",
          kind: "single-h1",
          review:
            "Keep one H1 as the document title; use lower heading levels for sections.",
        },
      ])
    }
  })

  it("provides eight fixtures per problem, including Setext and wrong-H2 cases", () => {
    expect(headingBatch002Fixtures).toHaveLength(24 * 8)
    expect(
      validateProblemBank(headingBatch002Problems, headingBatch002Fixtures),
    ).toEqual([])

    for (const problem of headingBatch002Problems) {
      const fixtures = headingBatch002Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )

      expect(fixtures).toHaveLength(8)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining(["setext", "h2"]),
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

  it.each(headingBatch002Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = headingBatch002Problems.find(
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

  it.each(headingBatch002Problems)(
    "grades $id by Markdown grammar, not prose, case, or spelling",
    (problem) => {
      expect(evaluateProblem(problem, "# Completely new words")).toEqual({
        status: "matched",
        reviewItems: [],
      })

      const differentProse = headingBatch002Fixtures.find(
        (fixture) =>
          fixture.problemId === problem.id &&
          fixture.role === "different-prose",
      )
      const caseSpelling = headingBatch002Fixtures.find(
        (fixture) =>
          fixture.problemId === problem.id &&
          fixture.role === "case-spelling-variation",
      )

      expect(differentProse).toMatchObject({ expectedStatus: "matched" })
      expect(caseSpelling).toMatchObject({ expectedStatus: "matched" })
      expect(evaluateProblem(problem, differentProse!.source).status).toBe(
        "matched",
      )
      expect(evaluateProblem(problem, caseSpelling!.source).status).toBe(
        "matched",
      )
    },
  )
})
