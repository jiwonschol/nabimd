import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import { listBatch004Fixtures } from "./listBatch004Fixtures"
import { listBatch004Problems } from "./listBatch004Problems"

const batchId = "2026-07-19-l1-l2-lists-004"

describe("list batch 004", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(listBatch004Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = listBatch004Problems.filter(
        (problem) => problem.level === level,
      )

      expect(problems).toHaveLength(12)
      expect(new Set(problems.map((problem) => problem.id)).size).toBe(12)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(12)
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

  it("grades only parsed unordered-list structure and keeps focus nonblocking", () => {
    for (const problem of listBatch004Problems) {
      expect(problem.matchChecks).toEqual([
        {
          id: "use-bullet-list",
          kind: "list-shape",
          scope: { kind: "document" },
          ordered: false,
          minItems: 3,
          recursive: true,
          requireNonemptyItems: true,
          priority: 10,
          feedback: "Add at least three bullet items, with words after each marker.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-one-list",
          kind: "max-block-count",
          scope: { kind: "document" },
          block: "list",
          recursive: true,
          max: 1,
          review: "Keep these items together in one bullet list.",
        },
      ])
    }
  })

  it("provides fifteen real-engine fixtures per problem", () => {
    expect(listBatch004Fixtures).toHaveLength(24 * 15)
    expect(
      validateProblemBank(listBatch004Problems, listBatch004Fixtures),
    ).toEqual([])

    for (const problem of listBatch004Problems) {
      const fixtures = listBatch004Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(15)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "asterisk-bullet",
          "plus-bullet",
          "ordered-list",
          "too-short-list",
          "inline-code-list",
          "multiple-lists",
          "blockquote-list",
          "empty-list",
          "image-alt-list",
          "empty-image-alt-list",
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

  it.each(listBatch004Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = listBatch004Problems.find(
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

  it.each(listBatch004Problems)(
    "grades $id by Markdown grammar, not prose, case, spelling, or marker choice",
    (problem) => {
      expect(evaluateProblem(problem, "* Completely new\n* misspeled WORDS\n* Anything!"))
        .toEqual({ status: "matched", reviewItems: [] })
      expect(evaluateProblem(problem, "+ FIRST\n+ second\n+ thurd"))
        .toEqual({ status: "matched", reviewItems: [] })
    },
  )
})
