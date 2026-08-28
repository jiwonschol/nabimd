import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { buildReviewCorrections } from "../../feedback/reviewCorrections"
import { deriveSyntaxCheckpoints } from "../../guided/guidedSyntax"
import { derivePlaintextStarter } from "../plaintextStarter"
import { problemBank, withinRuntimeBudget } from "../problemBank"
import type { FixtureRole } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { imageBatch027Fixtures } from "./imageBatch027Fixtures"
import {
  imageBatch027Id,
  imageBatch027Inputs,
  imageBatch027Problems,
} from "./imageBatch027Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

describe("Level 1 image batch 027", () => {
  it("adds twelve distinct everyday image exercises", () => {
    expect(imageBatch027Problems).toHaveLength(12)
    expect(new Set(imageBatch027Problems.map((problem) => problem.id)).size).toBe(
      12,
    )
    expect(
      new Set(imageBatch027Problems.map((problem) => problem.contentVariant))
        .size,
    ).toBe(12)
    expect(
      new Set(imageBatch027Problems.map((problem) => problem.target)).size,
    ).toBe(12)

    for (const problem of imageBatch027Problems) {
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 1,
        flavor: "standard",
        familyId: "images",
        skillIds: ["inline-image"],
        retryFamily: "level-1-image",
        sourceBatchId: imageBatch027Id,
        revision: 1,
      })
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("keeps every alt description meaningful and visible in the starter", () => {
    const bannedGenericAlt = /^(?:img|image|photo|picture)$/i

    for (const [index, problem] of imageBatch027Problems.entries()) {
      const alt = problem.target.match(/!\[([^\]]*)]\(/)?.[1]
      expect(alt, problem.id).toBeDefined()
      expect(alt!.trim().split(/\s+/).length, problem.id).toBeGreaterThanOrEqual(
        3,
      )
      expect(alt, problem.id).not.toMatch(bannedGenericAlt)
      expect(problem.protectedContent, problem.id).toEqual([])
      expect(derivePlaintextStarter(problem.target), problem.id).toBe(
        imageBatch027Inputs[index]!.plainText,
      )
    }
  })

  it("creates the existing three image-marker inputs without parser changes", () => {
    for (const problem of imageBatch027Problems) {
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
    const priorProblems = problemBank.filter(
      (problem) => problem.sourceBatchId !== imageBatch027Id,
    )
    const priorIds = new Set(priorProblems.map((problem) => problem.id))
    const priorTargets = new Set(priorProblems.map((problem) => problem.target))
    const priorVariants = new Set(
      priorProblems.map((problem) => problem.contentVariant),
    )

    for (const problem of imageBatch027Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
    }
  })

  it("binds all required fixture roles and direct match-check evidence", () => {
    expect(
      validateProblemBank(imageBatch027Problems, imageBatch027Fixtures),
    ).toEqual([])

    for (const problem of imageBatch027Problems) {
      const fixtures = imageBatch027Fixtures.filter(
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
      imageBatch027Problems.map((problem) => [problem.id, problem]),
    )

    for (const fixture of imageBatch027Fixtures) {
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

  it("explains that image descriptions and addresses cannot be empty", () => {
    const problem = imageBatch027Problems[0]!

    for (const source of [
      "![](https://example.com/images/rainy-window.jpg)",
      "![Raindrops on the window]()",
    ]) {
      const evaluation = evaluateProblem(problem, source)
      expect(evaluation.status, source).toBe("fail")
      if (evaluation.status !== "fail") continue

      expect(
        buildReviewCorrections(problem, evaluation, source)[0]
          ?.repairInstruction,
        source,
      ).toContain(
        "Neither the description nor the address can be empty.",
      )
    }
  })
})
