import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { blockquoteBatch006Fixtures } from "./blockquoteBatch006Fixtures"
import { blockquoteBatch006Problems } from "./blockquoteBatch006Problems"

const batchId = "2026-07-19-l1-l2-blockquotes-006"

describe("blockquote batch 006", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(blockquoteBatch006Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = blockquoteBatch006Problems.filter(
        (problem) => problem.level === level,
      )
      expect(problems).toHaveLength(12)
      expect(new Set(problems.map((problem) => problem.id)).size).toBe(12)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(12)
      expect(new Set(problems.map((problem) => problem.target)).size).toBe(12)
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

  it("keeps authored identities distinct from the accepted bank", () => {
    const previousProblems = problemBank.filter(
      (problem) => problem.sourceBatchId !== batchId,
    )
    const previousIds = new Set(previousProblems.map((problem) => problem.id))
    const previousVariants = new Set(
      previousProblems.map((problem) => problem.contentVariant),
    )
    const previousTargets = new Set(
      previousProblems.map((problem) => problem.target),
    )
    const previousVocabulary = new Set(
      previousProblems.map((problem) => JSON.stringify(problem.vocabulary)),
    )

    for (const problem of blockquoteBatch006Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(
        previousVocabulary.has(JSON.stringify(problem.vocabulary)),
        problem.id,
      ).toBe(false)
    }
  })

  it("keeps Level 1 callouts age-neutral", () => {
    expect(
      blockquoteBatch006Problems.some(
        (problem) => problem.id === "l1-blockquote-call-when-home",
      ),
    ).toBe(true)
    expect(
      blockquoteBatch006Problems.some(
        (problem) => problem.id === "l1-blockquote-call-after-school",
      ),
    ).toBe(false)
  })

  it("grades a nonempty parsed blockquote without grading prose", () => {
    for (const problem of blockquoteBatch006Problems) {
      expect(problem.matchChecks).toEqual([
        {
          id: "use-blockquote",
          kind: "blockquote-shape",
          scope: { kind: "document" },
          recursive: true,
          requireNonemptyContent: true,
          priority: 10,
          feedback: "Add a blockquote with words inside it.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-one-blockquote",
          kind: "max-block-count",
          scope: { kind: "document" },
          block: "blockquote",
          recursive: true,
          max: 1,
          review: "Keep this short callout in one blockquote.",
        },
      ])
    }
  })

  it("provides twenty-eight real-engine fixtures per problem", () => {
    expect(blockquoteBatch006Fixtures).toHaveLength(24 * 28)
    expect(
      validateProblemBank(blockquoteBatch006Problems, blockquoteBatch006Fixtures),
    ).toEqual([])

    for (const problem of blockquoteBatch006Problems) {
      const fixtures = blockquoteBatch006Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(28)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "blockquote-no-space",
          "blockquote-lazy-continuation",
          "blockquote-image-alt",
          "blockquote-code-content",
          "blockquote-list-wrapper",
          "nested-blockquote",
          "multiple-blockquotes",
          "empty-blockquote",
          "thematic-break-blockquote",
          "blockquote-zero-width-only",
          "blockquote-comment-only",
          "escaped-blockquote",
          "fenced-code-blockquote",
          "html-blockquote",
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

  it.each(blockquoteBatch006Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = blockquoteBatch006Problems.find(
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

  it.each(blockquoteBatch006Problems)(
    "grades $id by Markdown grammar, not prose, case, spelling, or spacing style",
    (problem) => {
      expect(evaluateProblem(problem, ">COMPLETELY DIFFRENT words!"))
        .toEqual({ status: "matched", reviewItems: [] })
      expect(evaluateProblem(problem, "   > lowercase alternative"))
        .toEqual({ status: "matched", reviewItems: [] })
    },
  )
})
