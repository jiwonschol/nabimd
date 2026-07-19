import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { linkBatch008Fixtures } from "./linkBatch008Fixtures"
import { linkBatch008Problems } from "./linkBatch008Problems"

const batchId = "2026-07-19-l1-l2-links-008"

describe("link batch 008", () => {
  it("adds twelve guided Level 1 and twelve recall Level 2 problems", () => {
    expect(linkBatch008Problems).toHaveLength(24)

    for (const level of [1, 2] as const) {
      const problems = linkBatch008Problems.filter(
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

    for (const problem of linkBatch008Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(
        previousVocabulary.has(JSON.stringify(problem.vocabulary)),
        problem.id,
      ).toBe(false)
    }
  })

  it("keeps beginner destinations reserved, safe to display, and non-endorsing", () => {
    for (const problem of linkBatch008Problems) {
      expect(problem.target).toContain("https://example.com/")
      expect(problem.target).not.toMatch(
        /github\.com|openai\.com|devpost\.com|mailto:|production-reset/i,
      )
    }
  })

  it("grades meaningful link grammar without grading prose or destinations", () => {
    for (const problem of linkBatch008Problems) {
      expect(problem.matchChecks).toEqual([
        {
          id: "use-link",
          kind: "link-shape",
          scope: { kind: "document" },
          min: 1,
          allowReferences: true,
          allowAutolinks: false,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          priority: 10,
          feedback: "Add a Markdown link with readable words and a web address.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-one-link",
          kind: "max-link-count",
          scope: { kind: "document" },
          max: 1,
          allowReferences: true,
          allowAutolinks: false,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          review: "Keep this short note focused on one link.",
        },
      ])
    }
  })

  it("provides ninety-six real-engine fixtures per problem", () => {
    expect(linkBatch008Fixtures).toHaveLength(24 * 96)
    expect(
      validateProblemBank(linkBatch008Problems, linkBatch008Fixtures),
    ).toEqual([])

    for (const problem of linkBatch008Problems) {
      const fixtures = linkBatch008Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(96)
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "link-reference-full-after",
          "link-reference-collapsed",
          "link-reference-shortcut",
          "link-image-plus-visible-label",
          "link-null-plus-visible-destination",
          "link-null-only-destination",
          "link-unsafe-javascript",
          "link-http-autolink",
          "link-image-only-label",
          "multiple-reference-links",
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

  it("isolates case and spelling tolerance with one canonical-label change per problem", () => {
    const variationSources = linkBatch008Fixtures.filter(
      (fixture) => fixture.role === "case-spelling-variation",
    )
    expect(variationSources).toHaveLength(24)
    expect(new Set(variationSources.map((fixture) => fixture.source)).size).toBe(24)

    for (const problem of linkBatch008Problems) {
      const canonicalLabel = problem.target.match(/\[([^\]]+)]\(/)?.[1]
      const variation = variationSources
        .find((fixture) => fixture.problemId === problem.id)
        ?.source.match(/\[([^\]]+)]\(/)?.[1]
      expect(canonicalLabel, problem.id).toBeDefined()
      expect(variation, problem.id).toBeDefined()

      const uppercaseCanonical = canonicalLabel!.toUpperCase()
      expect(variation).toBe(variation!.toUpperCase())
      expect(
        [...uppercaseCanonical].some(
          (_, index) =>
            `${uppercaseCanonical.slice(0, index)}${uppercaseCanonical.slice(index + 1)}` ===
            variation,
        ),
        problem.id,
      ).toBe(true)
    }
  })

  it.each(linkBatch008Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = linkBatch008Problems.find(
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

  it.each(linkBatch008Problems)(
    "grades $id by Markdown grammar, not prose, case, spelling, or destination",
    (problem) => {
      expect(
        evaluateProblem(problem, "Use [COMPLETELY DIFFRENT words](/changed)."),
      ).toEqual({ status: "matched", reviewItems: [] })
      expect(
        evaluateProblem(
          problem,
          "Try [lowercase alternative](javascript:still-grammar).",
        ),
      ).toEqual({ status: "matched", reviewItems: [] })
    },
  )
})
