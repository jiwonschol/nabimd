import { describe, expect, it } from "vitest"
import { getHeadingProblem } from "../content/headingProblems"
import { headingProblemFixtures } from "../content/problemFixtures"
import { evaluateProblem } from "./evaluateProblem"

const matchStageFixtures = headingProblemFixtures.filter(
  (fixture) => fixture.kind !== "matched-with-refinement",
)

describe("evaluateProblem match stage", () => {
  it.each(matchStageFixtures)("grades $problemId $kind", (fixture) => {
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
})
