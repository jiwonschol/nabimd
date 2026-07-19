import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { thematicBreakBatch009Fixtures } from "./thematicBreakBatch009Fixtures"
import { thematicBreakBatch009Problems } from "./thematicBreakBatch009Problems"

describe("Level 1-2 thematic-break batch 009", () => {
  it("adds twelve guided and twelve recall problems", () => {
    expect(thematicBreakBatch009Problems).toHaveLength(24)
    expect(
      thematicBreakBatch009Problems.filter((problem) => problem.level === 1),
    ).toHaveLength(12)
    expect(
      thematicBreakBatch009Problems.filter((problem) => problem.level === 2),
    ).toHaveLength(12)

    for (const problem of thematicBreakBatch009Problems) {
      expect(problem.familyId).toBe("horizontal-rules")
      expect(problem.skillIds).toEqual(["thematic-break"])
      expect(problem.teachingMode).toBe(
        problem.level === 1 ? "introduce" : "recall",
      )
      expect(problem.vocabulary.profile).toBe(
        problem.level === 1 ? "everyday" : "everyday-recall",
      )
    }
  })

  it("authors readable two-part Goals without grading their prose", () => {
    for (const problem of thematicBreakBatch009Problems) {
      const root = fromMarkdown(problem.target)
      expect(root.children.map((node) => node.type), problem.id).toEqual([
        "paragraph",
        "thematicBreak",
        "paragraph",
      ])
      expect(problem.target).toContain("\n\n---\n\n")
      expect(problem.protectedContent).toHaveLength(2)
      expect(problem.matchChecks).toEqual([
        {
          id: "use-divider",
          kind: "block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          min: 1,
          recursive: true,
          priority: 10,
          feedback: "Add a Markdown divider between the two text blocks.",
        },
      ])
      expect(problem.editorialChecks).toEqual([
        {
          id: "keep-one-divider",
          kind: "max-block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          recursive: true,
          max: 1,
          review: "One divider is enough for this short note.",
        },
      ])
    }
  })

  it("does not collide with the 188-problem published bank", () => {
    const previousProblems = problemBank.filter(
      (problem) => problem.sourceBatchId !== "2026-07-19-l1-l2-thematic-breaks-009",
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

    for (const problem of thematicBreakBatch009Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(
        previousVocabulary.has(JSON.stringify(problem.vocabulary)),
        problem.id,
      ).toBe(false)
    }
  })

  it("provides the same broad production-engine fixture matrix for every problem", () => {
    expect(
      validateProblemBank(
        thematicBreakBatch009Problems,
        thematicBreakBatch009Fixtures,
      ),
    ).toEqual([])

    const fixtureCounts = thematicBreakBatch009Problems.map(
      (problem) =>
        thematicBreakBatch009Fixtures.filter(
          (fixture) => fixture.problemId === problem.id,
        ).length,
    )
    expect(new Set(fixtureCounts).size).toBe(1)
    expect(fixtureCounts[0]).toBeGreaterThanOrEqual(50)

    for (const problem of thematicBreakBatch009Problems) {
      const fixtures = thematicBreakBatch009Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.map((fixture) => fixture.kind)).toEqual(
        expect.arrayContaining([
          "thematic-break-asterisk",
          "thematic-break-underscore",
          "thematic-break-spaced-dash",
          "thematic-break-blockquote-wrapper",
          "thematic-break-list-wrapper",
          "thematic-break-setext-heading",
          "thematic-break-fenced-code",
          "thematic-break-raw-html",
          "thematic-break-root-plus-nested",
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

  it("isolates case and spelling tolerance against each problem's own prose", () => {
    const variations = thematicBreakBatch009Fixtures.filter(
      (fixture) => fixture.role === "case-spelling-variation",
    )
    expect(variations).toHaveLength(24)
    expect(new Set(variations.map((fixture) => fixture.source)).size).toBe(24)

    for (const problem of thematicBreakBatch009Problems) {
      const [canonicalBefore, canonicalAfter] = problem.target.split(
        "\n\n---\n\n",
      )
      const variation = variations.find(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(variation, problem.id).toBeDefined()
      const [variedBefore, variedAfter] = variation!.source.split(
        "\n\n___\n\n",
      )
      const uppercaseBefore = canonicalBefore!.toUpperCase()

      expect(variedAfter).toBe(canonicalAfter!.toUpperCase())
      expect(
        [...uppercaseBefore].some(
          (_, index) =>
            `${uppercaseBefore.slice(0, index)}${uppercaseBefore.slice(index + 1)}` ===
            variedBefore,
        ),
        problem.id,
      ).toBe(true)
    }
  })

  it.each(thematicBreakBatch009Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = thematicBreakBatch009Problems.find(
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

  it.each(thematicBreakBatch009Problems)(
    "grades $id by divider grammar, not prose, capitalization, or placement",
    (problem) => {
      expect(evaluateProblem(problem, "***")).toEqual({
        status: "matched",
        reviewItems: [],
      })
      expect(evaluateProblem(problem, "> ___")).toEqual({
        status: "matched",
        reviewItems: [],
      })
      expect(evaluateProblem(problem, "COMPLETELY CHANGED WORDS\n\n- - -")).toEqual({
        status: "matched",
        reviewItems: [],
      })
    },
  )
})
