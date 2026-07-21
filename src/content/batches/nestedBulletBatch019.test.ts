import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { getSyntaxFamily } from "../../selection/runComposition"
import { derivePlaintextStarter } from "../plaintextStarter"
import { problemBank } from "../problemBank"
import type { FixtureRole } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { nestedBulletBatch019Fixtures } from "./nestedBulletBatch019Fixtures"
import {
  nestedBulletBatch019Id,
  nestedBulletBatch019Problems,
} from "./nestedBulletBatch019Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

function countLists(source: string) {
  let count = 0
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return
    const value = node as { type?: string; children?: readonly unknown[] }
    if (value.type === "list") count += 1
    value.children?.forEach(visit)
  }
  visit(fromMarkdown(source))
  return count
}

describe("Level 1 nested-bullet batch 019", () => {
  it("adds four unique one-syntax indentation warmups", () => {
    expect(nestedBulletBatch019Problems).toHaveLength(4)
    expect(new Set(nestedBulletBatch019Problems.map((problem) => problem.id)).size).toBe(4)
    expect(
      new Set(nestedBulletBatch019Problems.map((problem) => problem.contentVariant)).size,
    ).toBe(4)
    expect(
      new Set(nestedBulletBatch019Problems.map((problem) => problem.target)).size,
    ).toBe(4)

    for (const problem of nestedBulletBatch019Problems) {
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 1,
        flavor: "standard",
        familyId: "nested-lists",
        skillIds: ["unordered-list"],
        difficulty: "warmup",
        teachingMode: "introduce",
        retryFamily: "level-1-nested-unordered-list",
        sourceBatchId: nestedBulletBatch019Id,
        revision: 1,
      })
      expect(getSyntaxFamily(problem)).toBe("unordered-list")
      expect(problem.syntaxTokens).toEqual(["- Item", "  - Nested item"])
      expect(problem.teaching.howTo).toContain("two spaces")
      expect(problem.target.split("\n")).toHaveLength(3)
      expect(countLists(problem.target)).toBe(2)
      expect(derivePlaintextStarter(problem.target).split("\n")).toHaveLength(3)
    }
  })

  it("checks one outer bullet list and one indented child list without grading prose", () => {
    for (const problem of nestedBulletBatch019Problems) {
      expect(problem.matchChecks).toEqual([
        expect.objectContaining({
          id: "nested-bullet-list-count",
          kind: "block-count",
          block: "list",
          recursive: true,
          min: 2,
          max: 2,
        }),
        expect.objectContaining({
          id: "nested-bullet-root-list",
          kind: "list-shape",
          ordered: false,
          minItems: 1,
          maxItems: 1,
        }),
        expect.objectContaining({
          id: "nested-bullet-child-list",
          kind: "list-shape",
          ordered: false,
          minItems: 2,
          maxItems: 2,
          recursive: true,
          descendantsOnly: true,
        }),
      ])
      expect(evaluateProblem(problem, problem.target)).toEqual({
        status: "matched",
        reviewItems: [],
      })
      expect(
        evaluateProblem(
          problem,
          "- COMPLETELY DIFFERENT\n  - misspeled words\n  - anything works",
        ),
      ).toEqual({ status: "matched", reviewItems: [] })
    }
  })

  it("does not collide with the accepted bank or within the batch", () => {
    const priorProblems = problemBank.filter(
      (problem) => problem.sourceBatchId !== nestedBulletBatch019Id,
    )
    const priorIds = new Set(priorProblems.map((problem) => problem.id))
    const priorTargets = new Set(priorProblems.map((problem) => problem.target))
    const priorVariants = new Set(
      priorProblems.map((problem) => problem.contentVariant),
    )
    const priorExamples = new Set(
      priorProblems.map((problem) => problem.teaching.example),
    )
    const ownExamples = new Set<string>()

    for (const problem of nestedBulletBatch019Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(priorExamples.has(problem.teaching.example), problem.id).toBe(false)
      expect(ownExamples.has(problem.teaching.example), problem.id).toBe(false)
      ownExamples.add(problem.teaching.example)
    }
  })

  it("binds all required fixture roles and direct evidence for every match check", () => {
    expect(
      validateProblemBank(
        nestedBulletBatch019Problems,
        nestedBulletBatch019Fixtures,
      ),
    ).toEqual([])
    expect(nestedBulletBatch019Fixtures).toHaveLength(4 * 14)

    for (const problem of nestedBulletBatch019Problems) {
      const fixtures = nestedBulletBatch019Fixtures.filter(
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
      expect(
        fixtures.find((fixture) => fixture.id?.endsWith("-tab-indent")),
      ).toMatchObject({
        role: "edge-case",
        expectedStatus: "matched",
      })
    }
  })

  it("runs all frozen fixtures through the real learner engine", () => {
    const problems = new Map(
      nestedBulletBatch019Problems.map((problem) => [problem.id, problem]),
    )
    for (const fixture of nestedBulletBatch019Fixtures) {
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
