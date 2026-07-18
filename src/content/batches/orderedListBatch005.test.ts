import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import { orderedListBatch005Fixtures } from "./orderedListBatch005Fixtures"
import { orderedListBatch005Problems } from "./orderedListBatch005Problems"

const batchId = "2026-07-19-l1-l2-ordered-lists-005"

describe("ordered-list batch 005", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(orderedListBatch005Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = orderedListBatch005Problems.filter(
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

  it("grades parsed ordered-list structure without grading prose or numerals", () => {
    for (const problem of orderedListBatch005Problems) {
      expect(problem.matchChecks).toEqual([
        {
          id: "use-numbered-list",
          kind: "list-shape",
          scope: { kind: "document" },
          ordered: true,
          minItems: 3,
          recursive: true,
          requireNonemptyItems: true,
          priority: 10,
          feedback: "Add at least three numbered steps, with words after each marker.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-one-ordered-list",
          kind: "max-block-count",
          scope: { kind: "document" },
          block: "list",
          recursive: true,
          max: 1,
          review: "Keep these steps together in one numbered list.",
        },
      ])
    }
  })

  it("provides twenty-six real-engine fixtures per problem", () => {
    expect(orderedListBatch005Fixtures).toHaveLength(24 * 26)
    expect(
      validateProblemBank(orderedListBatch005Problems, orderedListBatch005Fixtures),
    ).toEqual([])

    for (const problem of orderedListBatch005Problems) {
      const fixtures = orderedListBatch005Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(26)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "parenthesis-marker",
          "repeated-one",
          "nonsequential-numbers",
          "unordered-list",
          "nested-under-unordered",
          "split-two-plus-one",
          "fenced-code-list",
          "image-alt-list",
          "empty-image-alt-list",
          "multiple-lists",
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

  it.each(orderedListBatch005Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = orderedListBatch005Problems.find(
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

  it.each(orderedListBatch005Problems)(
    "grades $id by Markdown grammar, not prose, case, spelling, or displayed numbering",
    (problem) => {
      expect(evaluateProblem(problem, "1. COMPLETELY NEW\n1. misspeled words\n1. Anything!"))
        .toEqual({ status: "matched", reviewItems: [] })
      expect(evaluateProblem(problem, "4) FIRST\n8) second\n2) thurd"))
        .toEqual({ status: "matched", reviewItems: [] })
    },
  )
})
