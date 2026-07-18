import { describe, expect, it } from "vitest"
import { headingProblems } from "./headingProblems"
import { createRunProblemIds } from "./entryChoices"

describe("createRunProblemIds", () => {
  it("keeps every normal run to three exercises", () => {
    for (const entryId of ["level-1", "basics", "challenge"] as const) {
      expect(createRunProblemIds(entryId, 0)).toHaveLength(3)
    }
  })

  it("rotates by non-overlapping three-problem windows", () => {
    expect(createRunProblemIds("level-1", 0)).toEqual([
      "heading-apple",
      "heading-rainy-day",
      "heading-study-tools",
    ])
    expect(createRunProblemIds("level-1", 1)).toEqual([
      "heading-weekend-forecast",
      "heading-team-handbook",
      "heading-product-roadmap",
    ])
  })

  it("exposes the full accepted bank within six Level 1 runs", () => {
    const seen = new Set(
      Array.from({ length: 6 }, (_, runNumber) =>
        createRunProblemIds("level-1", runNumber),
      ).flat(),
    )

    expect(seen).toEqual(new Set(headingProblems.map((problem) => problem.id)))
  })

  it("wraps deterministically without producing unknown IDs", () => {
    const ids = createRunProblemIds("challenge", 17)
    expect(ids).toHaveLength(3)
    expect(
      ids.every((id) => headingProblems.some((problem) => problem.id === id)),
    ).toBe(true)
    expect(createRunProblemIds("challenge", 17)).toEqual(ids)
  })
})
