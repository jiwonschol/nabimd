import { describe, expect, it } from "vitest"
import { getHeadingProblem } from "../content/headingProblems"
import { headingProblemFixtures } from "../content/problemFixtures"
import { evaluateProblem } from "./evaluateProblem"

describe("evaluateProblem", () => {
  it.each(headingProblemFixtures)("grades $problemId $kind", (fixture) => {
    const result = evaluateProblem(
      getHeadingProblem(fixture.problemId),
      fixture.source,
    )

    expect(result.status).toBe(fixture.expectedStatus)
    if (result.status === "fail") {
      const expectedFeedbackId =
        "expectedFeedbackId" in fixture
          ? fixture.expectedFeedbackId
          : undefined
      expect(result.feedbackId).toBe(expectedFeedbackId)
    }

    if (result.status !== "fail") {
      const expectedReviewIds =
        "expectedReviewIds" in fixture ? fixture.expectedReviewIds : []
      expect(result.reviewItems.map((item) => item.id)).toEqual(
        expectedReviewIds,
      )
    }
  })

  it("protects the required title text", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-project-notes"),
      "# Weekly notes",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "preserve-project-notes",
      message: "Keep the words ‘Project notes’ in your answer.",
    })
  })

  it("prioritizes malformed heading spacing", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-project-notes"),
      "#Project notes",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "space-after-hash",
      message: "Add one space after the hash symbol.",
    })
  })

  it("prioritizes malformed heading spacing with trailing whitespace", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-project-notes"),
      "#Project notes   ",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "space-after-hash",
      message: "Add one space after the hash symbol.",
    })
  })

  it("never turns an editorial refinement into a failure", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-project-notes"),
      "# Project notes\n\n# Details",
    )

    expect(result.status).toBe("matched")
  })
})
