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
      getHeadingProblem("heading-apple"),
      "# Weekly notes",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "preserve-apple",
      message: "Keep the word ‘Apple’ in your answer.",
    })
  })

  it("prioritizes malformed heading spacing", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "#Apple",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "space-after-hash",
      message: "Add one space after the hash symbol.",
    })
  })

  it("prioritizes malformed heading spacing with trailing whitespace", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "#Apple   ",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "space-after-hash",
      message: "Add one space after the hash symbol.",
    })
  })

  it("requires the taught hash heading form", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "Apple\n=====",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "use-h1-heading",
      message: "Start the title with one hash symbol and one space.",
    })
  })

  it("never turns an editorial refinement into a failure", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "# Apple\n\n# Details",
    )

    expect(result.status).toBe("matched")
  })
})
