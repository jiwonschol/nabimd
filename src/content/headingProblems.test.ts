import { describe, expect, it } from "vitest"
import { headingProblemFixtures } from "./problemFixtures"
import { getHeadingProblem, headingProblems } from "./headingProblems"
import { validateProblemBank } from "./validateProblemBank"
import type { Problem, ProblemFixture } from "./types"

describe("heading problem bank", () => {
  it("starts with one introduced rule and two recall variants", () => {
    expect(
      headingProblems.map((problem) => ({
        id: problem.id,
        target: problem.target,
        starterText: problem.starterText,
        teachingMode: problem.teachingMode,
        syntaxTokens: problem.syntaxTokens,
      })),
    ).toEqual([
      {
        id: "heading-apple",
        target: "# Apple",
        starterText: "",
        teachingMode: "introduce",
        syntaxTokens: ["#", "Space", "Title"],
      },
      {
        id: "heading-rainy-day",
        target: "# Rainy day",
        starterText: "",
        teachingMode: "recall",
        syntaxTokens: ["#", "Space", "Title"],
      },
      {
        id: "heading-study-tools",
        target: "# Study tools",
        starterText: "",
        teachingMode: "recall",
        syntaxTokens: ["#", "Space", "Title"],
      },
    ])
  })

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

  it.each(headingProblems)(
    "covers the U+3000 separator trap for $id",
    (problem) => {
      expect(
        headingProblemFixtures.find(
          (fixture) =>
            fixture.problemId === problem.id &&
            fixture.kind === "ideographic-space-separator",
        ),
      ).toMatchObject({
        source: `#\u3000${problem.protectedContent[0]}`,
        expectedStatus: "fail",
        expectedFeedbackId: "space-after-hash",
      })
    },
  )

  it("reports duplicate problem IDs", () => {
    const duplicateProblems: readonly Problem[] = [
      ...headingProblems,
      headingProblems[0],
    ]

    expect(
      validateProblemBank(duplicateProblems, headingProblemFixtures),
    ).toContain("Duplicate problem id: heading-apple")
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
    ).toContain("Duplicate protected content: Apple")
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
          fixture.problemId === "heading-apple" &&
          fixture.kind === "perfect"
        ),
    )

    expect(
      validateProblemBank(headingProblems, incompleteFixtures),
    ).toContain("Missing fixture kind perfect for heading-apple")
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
      "Problem heading-apple must provide exactly three hints",
    )
  })

  it("returns a known problem by ID", () => {
    expect(getHeadingProblem("heading-apple").target).toBe("# Apple")
  })

  it("rejects an unknown problem ID", () => {
    expect(() => getHeadingProblem("heading-unknown")).toThrow(
      "Unknown heading problem: heading-unknown",
    )
  })
})
