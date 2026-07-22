import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import type { FixtureRole } from "../types"
import { developerFormsBatch020Fixtures } from "./developerFormsBatch020Fixtures"
import {
  developerFormsBatch020Inputs,
  developerFormsBatch020Problems,
} from "./developerFormsBatch020Problems"

const requiredFixtureRoles: ReadonlySet<FixtureRole> = new Set([
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
])

function authoredWordCount(source: string) {
  return source.match(/[A-Za-z0-9][A-Za-z0-9'`.:/-]*/g)?.length ?? 0
}

describe("Level 5 compact developer forms batch 020", () => {
  it("adds twelve compact forms across three new retry families", () => {
    expect(developerFormsBatch020Problems).toHaveLength(12)
    expect(developerFormsBatch020Inputs).toHaveLength(12)
    expect(
      Object.fromEntries(
        ["readme-quick-start", "bug-report", "pr-description"].map(
          (family) => [
            family,
            developerFormsBatch020Inputs.filter(
              (candidate) => candidate.family === family,
            ).length,
          ],
        ),
      ),
    ).toEqual({
      "readme-quick-start": 4,
      "bug-report": 4,
      "pr-description": 4,
    })
    expect(
      new Set(developerFormsBatch020Problems.map(({ familyId }) => familyId)),
    ).toEqual(
      new Set([
        "developer-readme",
        "developer-bug-report",
        "developer-pr-description",
      ]),
    )
  })

  it("keeps every Goal short and pins the current developer convention", () => {
    for (const problem of developerFormsBatch020Problems) {
      expect(problem.level, problem.id).toBe(5)
      expect(problem.target.split("\n").length, problem.id).toBeLessThanOrEqual(
        40,
      )
      expect(authoredWordCount(problem.target), problem.id).toBeLessThanOrEqual(
        165,
      )
      expect(problem.convention, problem.id).toEqual({
        id: "nabi-agent-work-order",
        version: "2026.07",
        reviewedOn: "2026-07-22",
      })
    }
  })

  it("uses structural grammar checks with exactly one enforced document limit", () => {
    for (const problem of developerFormsBatch020Problems) {
      expect(problem.protectedContent, problem.id).toEqual([])
      const limits = problem.matchChecks.filter(
        (check) => check.kind === "document-limits",
      )
      expect(limits, problem.id).toHaveLength(1)
      expect(limits[0]!.maxLines, problem.id).toBe(40)
      expect(
        problem.matchChecks.every(
          (check) =>
            !Object.hasOwn(check, "text") &&
            !Object.hasOwn(check, "pattern") &&
            !Object.hasOwn(check, "expectedText"),
        ),
        problem.id,
      ).toBe(true)
    }
  })

  it("matches every authored Goal through the real grading engine", () => {
    for (const problem of developerFormsBatch020Problems) {
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("validates required roles and directly exercises every match check", () => {
    expect(
      validateProblemBank(
        developerFormsBatch020Problems,
        developerFormsBatch020Fixtures,
      ),
    ).toEqual([])

    for (const problem of developerFormsBatch020Problems) {
      const fixtures = developerFormsBatch020Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      const roles = new Set(
        fixtures
          .map(({ role }) => role)
          .filter((role): role is FixtureRole => role !== undefined),
      )
      for (const role of requiredFixtureRoles) {
        expect(roles.has(role), `${problem.id}/${role}`).toBe(true)
      }
      expect(
        new Set(
          fixtures
            .map(({ exercisesCheckId }) => exercisesCheckId)
            .filter((id): id is string => Boolean(id)),
        ),
        problem.id,
      ).toEqual(new Set(problem.matchChecks.map(({ id }) => id)))
    }
  })

  it("runs every frozen fixture through the real learner engine", () => {
    for (const fixture of developerFormsBatch020Fixtures) {
      const problem = developerFormsBatch020Problems.find(
        ({ id }) => id === fixture.problemId,
      )
      expect(problem, fixture.id).toBeDefined()
      const actual = evaluateProblem(problem!, fixture.source)
      if (fixture.expectedStatus === "fail") {
        expect(actual, fixture.id).toMatchObject({
          status: "fail",
          feedbackId: fixture.expectedFeedbackId,
        })
      } else {
        expect(actual.status, fixture.id).toBe("matched")
        expect(
          actual.status === "matched"
            ? actual.reviewItems.map(({ id }) => id)
            : [],
          fixture.id,
        ).toEqual(fixture.expectedReviewIds ?? [])
      }
    }
  })
})
