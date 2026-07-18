import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { selectTransferProblem } from "./selectTransferProblem"

describe("selectTransferProblem", () => {
  it("chooses different content from the same retry family", () => {
    const selected = selectTransferProblem({
      problems: headingProblems,
      currentProblemId: "heading-apple",
      retryFamily: "heading-h1",
      recentProblemIds: ["heading-apple"],
    })

    expect(selected.id).toBe("heading-rainy-day")
    expect(selected.retryFamily).toBe("heading-h1")
    expect(selected.protectedContent[0]).not.toBe("Apple")
  })

  it("prefers a nonrecent eligible problem", () => {
    const selected = selectTransferProblem({
      problems: headingProblems,
      currentProblemId: "heading-apple",
      retryFamily: "heading-h1",
      recentProblemIds: ["heading-apple", "heading-rainy-day"],
    })

    expect(selected.id).toBe("heading-study-tools")
  })

  it("falls back to stable bank order when every candidate is recent", () => {
    const selected = selectTransferProblem({
      problems: headingProblems,
      currentProblemId: "heading-apple",
      retryFamily: "heading-h1",
      recentProblemIds: headingProblems.map((problem) => problem.id),
    })

    expect(selected.id).toBe("heading-rainy-day")
  })

  it("rejects a bank with no safe transfer candidate", () => {
    expect(() =>
      selectTransferProblem({
        problems: [headingProblems[0]],
        currentProblemId: "heading-apple",
        retryFamily: "heading-h1",
        recentProblemIds: [],
      }),
    ).toThrow("No safe transfer problem for heading-h1")
  })
})
