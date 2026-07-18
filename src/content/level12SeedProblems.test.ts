import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../engine/evaluateProblem"
import {
  level12SeedFixtures,
  level12SeedProblems,
} from "./level12SeedProblems"
import type { FixtureRole } from "./types"
import { validateProblemBank } from "./validateProblemBank"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
]

describe("Level 1-2 vetted seed problems", () => {
  it("defines four guided Level 1 problems and four recall Level 2 problems", () => {
    expect(level12SeedProblems).toHaveLength(8)

    const levelOne = level12SeedProblems.filter((problem) => problem.level === 1)
    const levelTwo = level12SeedProblems.filter((problem) => problem.level === 2)

    expect(levelOne).toHaveLength(4)
    expect(levelTwo).toHaveLength(4)
    expect(
      levelOne.every(
        (problem) =>
          problem.schemaVersion === 2 &&
          problem.flavor === "standard" &&
          problem.teachingMode === "introduce" &&
          problem.vocabulary.profile === "everyday",
      ),
    ).toBe(true)
    expect(
      levelTwo.every(
        (problem) =>
          problem.schemaVersion === 2 &&
          problem.flavor === "standard" &&
          problem.teachingMode === "recall" &&
          problem.vocabulary.profile === "everyday-recall",
      ),
    ).toBe(true)
  })

  it("uses one retry family and four distinct content variants per level", () => {
    for (const level of [1, 2] as const) {
      const problems = level12SeedProblems.filter(
        (problem) => problem.level === level,
      )

      expect(new Set(problems.map((problem) => problem.retryFamily)).size).toBe(1)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(4)
    }
  })

  it("carries the complete schema-v2 fixture contract", () => {
    expect(validateProblemBank(level12SeedProblems, level12SeedFixtures)).toEqual(
      [],
    )

    for (const problem of level12SeedProblems) {
      const fixtures = level12SeedFixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length).toBeGreaterThanOrEqual(requiredRoles.length)
      expect(fixtures.map((fixture) => fixture.role)).toEqual(
        expect.arrayContaining([...requiredRoles]),
      )
    }
  })

  it.each(level12SeedProblems)(
    "directly covers every match check for $id",
    (problem) => {
      const failingFixtures = level12SeedFixtures.filter(
        (fixture) =>
          fixture.problemId === problem.id && fixture.expectedStatus === "fail",
      )

      expect(
        new Set(failingFixtures.map((fixture) => fixture.expectedFeedbackId)),
      ).toEqual(
        new Set([
          "space-after-hash",
          "use-hash-heading-style",
          "use-h1-heading",
        ]),
      )
      expect(
        failingFixtures.find(
          (fixture) => fixture.expectedFeedbackId === "use-hash-heading-style",
        ),
      ).toMatchObject({
        role: "edge-case",
        kind: "setext",
        expectedStatus: "fail",
      })
    },
  )

  it.each(level12SeedFixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = level12SeedProblems.find(
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

  it.each(level12SeedProblems)(
    "grades $id by heading grammar instead of displayed prose",
    (problem) => {
      expect(
        problem.matchChecks.every((check) => !("text" in check)),
      ).toBe(true)
      expect(evaluateProblem(problem, "# Completely new words")).toEqual({
        status: "matched",
        reviewItems: [],
      })

      const differentProse = level12SeedFixtures.find(
        (fixture) =>
          fixture.problemId === problem.id &&
          fixture.role === "different-prose",
      )
      const caseSpelling = level12SeedFixtures.find(
        (fixture) =>
          fixture.problemId === problem.id &&
          fixture.role === "case-spelling-variation",
      )

      expect(differentProse).toMatchObject({ expectedStatus: "matched" })
      expect(caseSpelling).toMatchObject({ expectedStatus: "matched" })
      expect(differentProse!.source).not.toBe(problem.target)
      expect(caseSpelling!.source).not.toBe(problem.target)
    },
  )
})
