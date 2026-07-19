import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { inlineCodeBatch007Fixtures } from "./inlineCodeBatch007Fixtures"
import { inlineCodeBatch007Problems } from "./inlineCodeBatch007Problems"

const batchId = "2026-07-19-l1-l2-inline-code-007"

describe("inline-code batch 007", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(inlineCodeBatch007Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = inlineCodeBatch007Problems.filter(
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

    for (const problem of inlineCodeBatch007Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(
        previousVocabulary.has(JSON.stringify(problem.vocabulary)),
        problem.id,
      ).toBe(false)
    }
  })

  it("keeps beginner examples safe, age-neutral, and platform-neutral", () => {
    const targets = inlineCodeBatch007Problems.map((problem) => problem.target)
    expect(targets.some((target) => /\brm\b|\bsudo\b/.test(target))).toBe(false)
    expect(targets.some((target) => target.includes("homework"))).toBe(false)
    expect(targets.some((target) => target.includes("Command-"))).toBe(false)
    expect(targets.some((target) => target.includes("Run `date`"))).toBe(false)
    expect(targets).toContain("Name the list `today.txt`.")
    expect(targets).toContain("Search for `rain`.")
  })

  it("grades meaningful inline-code grammar without grading prose", () => {
    for (const problem of inlineCodeBatch007Problems) {
      expect(problem.matchChecks).toEqual([
        {
          id: "use-inline-code",
          kind: "inline-code-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyContent: true,
          priority: 10,
          feedback: "Wrap at least one meaningful item in backticks.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-one-inline-code",
          kind: "max-inline-count",
          scope: { kind: "document" },
          inline: "inline-code",
          max: 1,
          review: "Keep inline code focused on one short item in this note.",
        },
      ])
    }
  })

  it("provides thirty-eight real-engine fixtures per problem", () => {
    expect(inlineCodeBatch007Fixtures).toHaveLength(24 * 38)
    expect(
      validateProblemBank(inlineCodeBatch007Problems, inlineCodeBatch007Fixtures),
    ).toEqual([])

    for (const problem of inlineCodeBatch007Problems) {
      const fixtures = inlineCodeBatch007Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(38)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "double-backtick-code",
          "literal-backtick-inline-code",
          "multiline-inline-code",
          "inline-code-link-label",
          "multiple-inline-code",
          "empty-plus-real-inline-code",
          "zero-width-only-inline-code",
          "control-only-inline-code",
          "null-plus-visible-inline-code",
          "null-only-inline-code",
          "braille-blank-only-inline-code",
          "fenced-code-only",
          "raw-html-code",
          "inline-code-image-alt",
          "inline-code-definition",
          "inline-code-comment",
          "fullwidth-backtick",
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

  it.each(inlineCodeBatch007Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = inlineCodeBatch007Problems.find(
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

  it.each(inlineCodeBatch007Problems)(
    "grades $id by Markdown grammar, not prose, case, spelling, or token choice",
    (problem) => {
      expect(evaluateProblem(problem, "Use `COMPLETELY DIFFRENT words`."))
        .toEqual({ status: "matched", reviewItems: [] })
      expect(evaluateProblem(problem, "Try `lowercase alternative`."))
        .toEqual({ status: "matched", reviewItems: [] })
    },
  )
})
