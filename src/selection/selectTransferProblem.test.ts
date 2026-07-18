import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { selectTransferProblem } from "./selectTransferProblem"

describe("selectTransferProblem", () => {
  it("chooses different content from the same retry family", () => {
    const selected = selectTransferProblem({
      problems: headingProblems,
      currentProblemId: "heading-project-notes",
      retryFamily: "heading-h1",
      recentProblemIds: ["heading-project-notes"],
    })

    expect(selected.id).toBe("heading-weekend-guide")
    expect(selected.retryFamily).toBe("heading-h1")
    expect(selected.protectedContent[0]).not.toBe("Project notes")
  })

  it("prefers a nonrecent eligible problem", () => {
    const selected = selectTransferProblem({
      problems: headingProblems,
      currentProblemId: "heading-project-notes",
      retryFamily: "heading-h1",
      recentProblemIds: ["heading-project-notes", "heading-weekend-guide"],
    })

    expect(selected.id).toBe("heading-reading-list")
  })

  it("falls back to stable bank order when every candidate is recent", () => {
    const selected = selectTransferProblem({
      problems: headingProblems,
      currentProblemId: "heading-project-notes",
      retryFamily: "heading-h1",
      recentProblemIds: headingProblems.map((problem) => problem.id),
    })

    expect(selected.id).toBe("heading-weekend-guide")
  })

  it("rejects a bank with no safe transfer candidate", () => {
    expect(() =>
      selectTransferProblem({
        problems: [headingProblems[0]],
        currentProblemId: "heading-project-notes",
        retryFamily: "heading-h1",
        recentProblemIds: [],
      }),
    ).toThrow("No safe transfer problem for heading-h1")
  })
})
