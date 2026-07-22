import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { derivePlaintextStarter } from "../plaintextStarter"
import { problemBank, withinRuntimeBudget } from "../problemBank"
import type { FixtureRole } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { workplaceNotesBatch021Fixtures } from "./workplaceNotesBatch021Fixtures"
import {
  workplaceNotesBatch021Id,
  workplaceNotesBatch021Problems,
} from "./workplaceNotesBatch021Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

describe("Level 4 workplace-notes batch 021", () => {
  it("adds twelve compact Level 4 miniatures in four families", () => {
    expect(workplaceNotesBatch021Problems).toHaveLength(12)
    expect(
      new Set(workplaceNotesBatch021Problems.map((problem) => problem.id)).size,
    ).toBe(12)
    expect(
      new Set(
        workplaceNotesBatch021Problems.map((problem) => problem.retryFamily),
      ).size,
    ).toBe(4)

    for (const problem of workplaceNotesBatch021Problems) {
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 4,
        flavor: "standard",
        familyId: "workplace-notes",
        difficulty: "mixed",
        teachingMode: "recall",
        sourceBatchId: workplaceNotesBatch021Id,
        revision: 1,
      })
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
      const lines = problem.target.split("\n")
      expect(lines.length, problem.id).toBeLessThanOrEqual(16)
      const words = problem.target.split(/\s+/).filter(Boolean)
      expect(words.length, problem.id).toBeLessThanOrEqual(120)
      // D17: the learner restores structure over the Goal's own prose.
      const starter = derivePlaintextStarter(problem.target)
      expect(starter, problem.id).not.toBe("")
      expect(starter, problem.id).not.toBe(problem.target)
      expect(starter.split("\n"), problem.id).toHaveLength(lines.length)
    }
  })

  it("grades structure only: canonical, other prose, and other case all match", () => {
    for (const problem of workplaceNotesBatch021Problems) {
      expect(evaluateProblem(problem, problem.target)).toEqual({
        status: "matched",
        reviewItems: [],
      })
      expect(
        evaluateProblem(problem, problem.target.toUpperCase()).status,
        problem.id,
      ).toBe("matched")
    }
  })

  it("does not collide with the accepted bank or within the batch", () => {
    const priorProblems = problemBank.filter(
      (problem) => problem.sourceBatchId !== workplaceNotesBatch021Id,
    )
    const priorIds = new Set(priorProblems.map((problem) => problem.id))
    const priorTargets = new Set(priorProblems.map((problem) => problem.target))
    const priorVariants = new Set(
      priorProblems.map((problem) => problem.contentVariant),
    )
    const ownExamples = new Set<string>()

    for (const problem of workplaceNotesBatch021Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(ownExamples.has(problem.teaching.example), problem.id).toBe(false)
      ownExamples.add(problem.teaching.example)
    }
  })

  it("binds all required fixture roles and direct evidence for every match check", () => {
    expect(
      validateProblemBank(
        workplaceNotesBatch021Problems,
        workplaceNotesBatch021Fixtures,
      ),
    ).toEqual([])

    for (const problem of workplaceNotesBatch021Problems) {
      const fixtures = workplaceNotesBatch021Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      for (const role of requiredRoles) {
        expect(
          fixtures.some((fixture) => fixture.role === role),
          `${problem.id}:${role}`,
        ).toBe(true)
      }
      for (const check of problem.matchChecks) {
        expect(
          fixtures.some((fixture) => fixture.exercisesCheckId === check.id),
          `${problem.id}:${check.id}`,
        ).toBe(true)
      }
    }
  })

  it("runs all frozen fixtures through the real learner engine", () => {
    const problems = new Map(
      workplaceNotesBatch021Problems.map((problem) => [problem.id, problem]),
    )
    for (const fixture of workplaceNotesBatch021Fixtures) {
      const problem = problems.get(fixture.problemId)!
      const result = evaluateProblem(problem, fixture.source)
      expect(result.status, fixture.id).toBe(fixture.expectedStatus)
      if (result.status === "fail") {
        expect(result, fixture.id).toMatchObject({
          feedbackId: fixture.expectedFeedbackId,
        })
      } else {
        expect(result.reviewItems.map((item) => item.id), fixture.id).toEqual(
          fixture.expectedReviewIds ?? [],
        )
      }
    }
  })
})
