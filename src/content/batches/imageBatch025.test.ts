import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { deriveSyntaxCheckpoints } from "../../guided/guidedSyntax"
import { derivePlaintextStarter } from "../plaintextStarter"
import { problemBank, withinRuntimeBudget } from "../problemBank"
import type { FixtureRole } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { imageBatch025Fixtures } from "./imageBatch025Fixtures"
import {
  imageBatch025Id,
  imageBatch025Inputs,
  imageBatch025Problems,
} from "./imageBatch025Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

describe("Level 1 image batch 025", () => {
  it("adds twelve distinct everyday image exercises", () => {
    expect(imageBatch025Problems).toHaveLength(12)
    expect(new Set(imageBatch025Problems.map((problem) => problem.id)).size).toBe(
      12,
    )
    expect(
      new Set(imageBatch025Problems.map((problem) => problem.contentVariant))
        .size,
    ).toBe(12)
    expect(
      new Set(imageBatch025Problems.map((problem) => problem.target)).size,
    ).toBe(12)

    for (const problem of imageBatch025Problems) {
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 1,
        flavor: "standard",
        familyId: "images",
        skillIds: ["inline-image"],
        retryFamily: "level-1-image",
        sourceBatchId: imageBatch025Id,
        revision: 1,
      })
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("keeps every alt description meaningful and visible in the starter", () => {
    const bannedGenericAlt = /^(?:img|image|photo|picture)$/i

    for (const [index, problem] of imageBatch025Problems.entries()) {
      const alt = problem.target.match(/!\[([^\]]*)]\(/)?.[1]
      expect(alt, problem.id).toBeDefined()
      expect(alt!.trim().split(/\s+/).length, problem.id).toBeGreaterThanOrEqual(
        3,
      )
      expect(alt, problem.id).not.toMatch(bannedGenericAlt)
      expect(problem.protectedContent, problem.id).toEqual([])
      expect(derivePlaintextStarter(problem.target), problem.id).toBe(
        imageBatch025Inputs[index]!.plainText,
      )
    }
  })

  it("creates the existing three image-marker inputs without parser changes", () => {
    for (const problem of imageBatch025Problems) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        derivePlaintextStarter(problem.target),
      )
      expect(checkpoints, problem.id).toHaveLength(1)
      expect(checkpoints[0]!.canonicalInput, problem.id).toBe("![]()")
      expect(
        checkpoints[0]!.segments
          .filter((segment) => segment.kind === "input")
          .map((segment) => segment.value),
        problem.id,
      ).toEqual(["![", "](", ")"])
    }
  })

  it("does not collide with the accepted bank", () => {
    const priorIds = new Set(problemBank.map((problem) => problem.id))
    const priorTargets = new Set(problemBank.map((problem) => problem.target))
    const priorVariants = new Set(
      problemBank.map((problem) => problem.contentVariant),
    )

    for (const problem of imageBatch025Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
    }
  })

  it("binds all required fixture roles and direct match-check evidence", () => {
    expect(
      validateProblemBank(imageBatch025Problems, imageBatch025Fixtures),
    ).toEqual([])

    for (const problem of imageBatch025Problems) {
      const fixtures = imageBatch025Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      for (const role of requiredRoles) {
        expect(
          fixtures.some((fixture) => fixture.role === role),
          `${problem.id}:${role}`,
        ).toBe(true)
      }
      expect(
        fixtures.some(
          (fixture) => fixture.exercisesCheckId === "use-image",
        ),
        problem.id,
      ).toBe(true)
    }
  })

  it("runs every frozen fixture through the real learner engine", () => {
    const problems = new Map(
      imageBatch025Problems.map((problem) => [problem.id, problem]),
    )

    for (const fixture of imageBatch025Fixtures) {
      const result = evaluateProblem(problems.get(fixture.problemId)!, fixture.source)
      expect(result.status, fixture.id).toBe(fixture.expectedStatus)
      if (result.status === "fail") {
        expect(result.feedbackId, fixture.id).toBe(fixture.expectedFeedbackId)
      } else {
        expect(result.reviewItems.map((item) => item.id), fixture.id).toEqual(
          fixture.expectedReviewIds ?? [],
        )
      }
    }
  })
})
