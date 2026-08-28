import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { buildReviewCorrections } from "../../feedback/reviewCorrections"
import { deriveSyntaxCheckpoints } from "../../guided/guidedSyntax"
import { derivePlaintextStarter } from "../plaintextStarter"
import { problemBank, withinRuntimeBudget } from "../problemBank"
import type { FixtureRole } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { imageBatch027Problems } from "./imageBatch027Problems"
import { imageBatch028Fixtures } from "./imageBatch028Fixtures"
import {
  imageBatch028Id,
  imageBatch028Inputs,
  imageBatch028Problems,
} from "./imageBatch028Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

describe("Level 1 image batch 028", () => {
  it("adds twelve distinct everyday image exercises", () => {
    expect(imageBatch028Problems).toHaveLength(12)
    expect(new Set(imageBatch028Problems.map((problem) => problem.id)).size).toBe(
      12,
    )
    expect(
      new Set(imageBatch028Problems.map((problem) => problem.contentVariant))
        .size,
    ).toBe(12)
    expect(
      new Set(imageBatch028Problems.map((problem) => problem.target)).size,
    ).toBe(12)

    for (const problem of imageBatch028Problems) {
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 1,
        flavor: "standard",
        familyId: "images",
        skillIds: ["inline-image"],
        retryFamily: "level-1-image",
        sourceBatchId: imageBatch028Id,
        revision: 2,
      })
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("keeps every alt description meaningful and visible in the starter", () => {
    const bannedGenericAlt = /^(?:img|image|photo|picture)$/i

    for (const [index, problem] of imageBatch028Problems.entries()) {
      const alt = problem.target.match(/!\[([^\]]*)]\(/)?.[1]
      expect(alt, problem.id).toBeDefined()
      expect(alt!.trim().split(/\s+/).length, problem.id).toBeGreaterThanOrEqual(
        3,
      )
      expect(alt, problem.id).not.toMatch(bannedGenericAlt)
      expect(problem.protectedContent, problem.id).toEqual([])
      expect(derivePlaintextStarter(problem.target), problem.id).toBe(
        imageBatch028Inputs[index]!.plainText,
      )
    }
  })

  it("creates the existing three image-marker inputs without parser changes", () => {
    for (const problem of imageBatch028Problems) {
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

  it("replaces the accepted image exercises at revision two", () => {
    const priorById = new Map(problemBank.map((problem) => [problem.id, problem]))
    expect(imageBatch027Problems.map((problem) => problem.id)).toEqual(
      imageBatch028Problems.map((problem) => problem.id),
    )

    for (const replacement of imageBatch028Problems) {
      const prior = priorById.get(replacement.id)
      expect(prior, replacement.id).toMatchObject({
        revision: 1,
        sourceBatchId: "2026-08-28-l1-images-027",
      })
      expect(replacement, replacement.id).toMatchObject({
        revision: 2,
        sourceBatchId: imageBatch028Id,
        target: prior!.target,
        teaching: prior!.teaching,
        hints: prior!.hints,
        prompt: prior!.prompt,
        vocabulary: prior!.vocabulary,
        contentVariant: prior!.contentVariant,
      })
    }
  })

  it("binds all required fixture roles and direct match-check evidence", () => {
    expect(imageBatch028Fixtures).toHaveLength(204)
    expect(
      validateProblemBank(imageBatch028Problems, imageBatch028Fixtures),
    ).toEqual([])

    for (const problem of imageBatch028Problems) {
      const fixtures = imageBatch028Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures, problem.id).toHaveLength(17)
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
      imageBatch028Problems.map((problem) => [problem.id, problem]),
    )

    for (const fixture of imageBatch028Fixtures) {
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

  it("explains that image descriptions and addresses need visible text", () => {
    const problem = imageBatch028Problems[0]!

    for (const source of [
      "![](https://example.com/images/rainy-window.jpg)",
      "![Raindrops on the window]()",
      "![\u0000](https://example.com/images/rainy-window.jpg)",
      "![\u200b](https://example.com/images/rainy-window.jpg)",
    ]) {
      const evaluation = evaluateProblem(problem, source)
      expect(evaluation.status, source).toBe("fail")
      if (evaluation.status !== "fail") continue

      expect(
        buildReviewCorrections(problem, evaluation, source)[0]
          ?.repairInstruction,
        source,
      ).toContain(
        "Both the description and the address need visible text — spaces and invisible characters do not count.",
      )
    }

    for (const source of [
      problem.target,
      "![a](https://example.com/images/rainy-window.jpg)",
      "![\uFFFD](https://example.com/images/rainy-window.jpg)",
    ]) {
      expect(evaluateProblem(problem, source).status, source).toBe("matched")
    }
  })
})
