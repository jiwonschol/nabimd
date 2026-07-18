import { describe, expect, it } from "vitest"
import { headingProblemFixtures } from "./problemFixtures"
import { getHeadingProblem, headingProblems } from "./headingProblems"
import { validateProblemBank } from "./validateProblemBank"
import type { Problem, ProblemFixture } from "./types"

describe("heading problem bank", () => {
  it("contains three distinct transfer variants", () => {
    expect(headingProblems).toHaveLength(3)
    expect(new Set(headingProblems.map((problem) => problem.id)).size).toBe(3)
    expect(
      new Set(
        headingProblems.map((problem) => problem.protectedContent.at(0)),
      ).size,
    ).toBe(3)
  })

  it("has a complete valid fixture contract", () => {
    expect(
      validateProblemBank(headingProblems, headingProblemFixtures),
    ).toEqual([])
  })

  it("reports duplicate problem IDs", () => {
    const duplicateProblems: readonly Problem[] = [
      ...headingProblems,
      headingProblems[0],
    ]

    expect(
      validateProblemBank(duplicateProblems, headingProblemFixtures),
    ).toContain("Duplicate problem id: heading-project-notes")
  })

  it("reports duplicate protected content", () => {
    const duplicateContentProblem: Problem = {
      ...headingProblems[1],
      id: "heading-duplicate-content",
      protectedContent: headingProblems[0].protectedContent,
    }

    expect(
      validateProblemBank(
        [...headingProblems, duplicateContentProblem],
        headingProblemFixtures,
      ),
    ).toContain("Duplicate protected content: Project notes")
  })

  it("reports fixtures for unknown problems", () => {
    const unknownFixture: ProblemFixture = {
      problemId: "heading-unknown",
      kind: "canonical",
      source: "# Unknown",
      expectedStatus: "perfect",
    }

    expect(
      validateProblemBank(headingProblems, [
        ...headingProblemFixtures,
        unknownFixture,
      ]),
    ).toContain("Unknown fixture problem id: heading-unknown")
  })

  it("reports missing fixture kinds", () => {
    const incompleteFixtures = headingProblemFixtures.filter(
      (fixture) =>
        !(
          fixture.problemId === "heading-project-notes" &&
          fixture.kind === "perfect"
        ),
    )

    expect(
      validateProblemBank(headingProblems, incompleteFixtures),
    ).toContain("Missing fixture kind perfect for heading-project-notes")
  })

  it("requires two transfer candidates in a retry family", () => {
    const singleProblem = [headingProblems[0]]
    const singleProblemFixtures = headingProblemFixtures.filter(
      (fixture) => fixture.problemId === headingProblems[0].id,
    )

    expect(
      validateProblemBank(singleProblem, singleProblemFixtures),
    ).toContain(
      "Retry family heading-h1 requires at least two distinct problems",
    )
  })

  it("requires exactly three progressive hints", () => {
    const invalidHintsProblem = {
      ...headingProblems[0],
      hints: ["One hint only"],
    } as unknown as Problem

    expect(
      validateProblemBank(
        [invalidHintsProblem, ...headingProblems.slice(1)],
        headingProblemFixtures,
      ),
    ).toContain(
      "Problem heading-project-notes must provide exactly three hints",
    )
  })

  it("returns a known problem by ID", () => {
    expect(getHeadingProblem("heading-project-notes").target).toBe(
      "# Project notes",
    )
  })

  it("rejects an unknown problem ID", () => {
    expect(() => getHeadingProblem("heading-unknown")).toThrow(
      "Unknown heading problem: heading-unknown",
    )
  })
})
