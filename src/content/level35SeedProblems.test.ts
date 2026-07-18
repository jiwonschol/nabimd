import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../engine/evaluateProblem"
import {
  level35SeedFixtures,
  level35SeedProblems,
} from "./level35SeedProblems"
import { validateProblemBank } from "./validateProblemBank"

describe("Level 3-5 Milestone 1 seed bank", () => {
  it("publishes four schema-v2 standard problems at each advanced level", () => {
    expect(level35SeedProblems).toHaveLength(12)

    for (const level of [3, 4, 5] as const) {
      const problems = level35SeedProblems.filter(
        (problem) => problem.level === level,
      )
      expect(problems).toHaveLength(4)
      expect(new Set(problems.map((problem) => problem.retryFamily)).size).toBe(1)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(4)
      expect(problems.every((problem) => problem.flavor === "standard")).toBe(true)
    }
  })

  it("passes schema validation with all required fixture roles", () => {
    expect(validateProblemBank(level35SeedProblems, level35SeedFixtures)).toEqual([])
  })

  it("runs every fixture through the real engine", () => {
    for (const fixture of level35SeedFixtures) {
      const problem = level35SeedProblems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      expect(problem, fixture.id).toBeDefined()

      const result = evaluateProblem(problem!, fixture.source)
      expect(result.status, fixture.id).toBe(fixture.expectedStatus)
      if (result.status === "fail") {
        expect(result.feedbackId, fixture.id).toBe(fixture.expectedFeedbackId)
      } else {
        expect(
          result.reviewItems.map((item) => item.id),
          fixture.id,
        ).toEqual(fixture.expectedReviewIds ?? [])
      }
    }
  })

  it("has a direct failing fixture for every declared match check", () => {
    for (const problem of level35SeedProblems) {
      const directFailureIds = new Set(
        level35SeedFixtures
          .filter(
            (fixture) =>
              fixture.problemId === problem.id &&
              fixture.expectedStatus === "fail",
          )
          .map((fixture) => fixture.exercisesCheckId),
      )

      expect(
        directFailureIds,
        `${problem.id} must exercise every match check as the first failure`,
      ).toEqual(new Set(problem.matchChecks.map((check) => check.id)))

      for (const fixture of level35SeedFixtures.filter(
        (candidate) =>
          candidate.problemId === problem.id &&
          candidate.expectedStatus === "fail",
      )) {
        expect(fixture.expectedFeedbackId, fixture.id).toBe(
          fixture.exercisesCheckId,
        )
      }
    }
  })

  it("uses structure-only operands and keeps learner prose unprotected", () => {
    for (const problem of level35SeedProblems) {
      expect(problem.protectedContent, problem.id).toEqual([])
      expect(
        problem.matchChecks.every(
          (check) =>
            check.kind !== "has-heading" &&
            check.kind !== "heading-spacing" &&
            check.kind !== "hash-heading-style",
        ),
        problem.id,
      ).toBe(true)
    }
  })

  it("keeps each composite document to its declared H2 slot count", () => {
    for (const problem of level35SeedProblems) {
      const result = evaluateProblem(
        problem,
        `${problem.target}\n\n## Undeclared extra section\n\nExtra material.`,
      )
      expect(result, problem.id).toMatchObject({
        status: "fail",
        feedbackId: `${problem.id}-sections`,
      })
    }
  })

  it("keeps Level 5 goals tall and convention-dated", () => {
    for (const problem of level35SeedProblems.filter(
      (candidate) => candidate.level === 5,
    )) {
      expect(problem.target.split("\n").length, problem.id).toBeGreaterThanOrEqual(60)
      expect(problem.target.length, problem.id).toBeGreaterThanOrEqual(1_800)
      expect(problem.convention, problem.id).toEqual({
        id: "nabi-agent-work-order",
        version: "2026.07",
        reviewedOn: "2026-07-19",
      })
    }
  })
})
