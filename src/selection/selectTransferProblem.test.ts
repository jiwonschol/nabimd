import { describe, expect, it } from "vitest"
import { getProblemsForLevel, problemBank } from "../content/problemBank"
import { selectTransferProblem } from "./selectTransferProblem"

describe("selectTransferProblem", () => {
  it("chooses different content from the same level, flavor, and retry family", () => {
    const current = getProblemsForLevel(1)[0]!
    const selected = selectTransferProblem({
      problems: problemBank,
      currentProblemId: current.id,
      retryFamily: current.retryFamily,
      recentProblemIds: [current.id],
    })

    expect(selected.id).not.toBe(current.id)
    expect(selected.level).toBe(current.level)
    expect(selected.flavor).toBe(current.flavor)
    expect(selected.retryFamily).toBe(current.retryFamily)
    expect(selected.contentVariant).not.toBe(current.contentVariant)
  })

  it("prefers a nonrecent eligible problem", () => {
    const problems = getProblemsForLevel(2)
    const selected = selectTransferProblem({
      problems: problemBank,
      currentProblemId: problems[0]!.id,
      retryFamily: problems[0]!.retryFamily,
      recentProblemIds: [problems[0]!.id, problems[1]!.id],
    })

    expect(selected.id).toBe(problems[2]!.id)
  })

  it("never crosses levels even when another level shares Markdown skills", () => {
    const current = getProblemsForLevel(1)[0]!
    const selected = selectTransferProblem({
      problems: problemBank,
      currentProblemId: current.id,
      retryFamily: current.retryFamily,
      recentProblemIds: getProblemsForLevel(1).map((problem) => problem.id),
    })
    expect(selected.level).toBe(1)
  })

  it("keeps every Level 3 document transfer inside its structural family", () => {
    const retryFamilies = [
      "level3-status-handoff-document",
      "level3-how-to-document",
      "level3-decision-record",
      "level3-meeting-agenda-document",
      "level3-reference-note-document",
      "level3-recommendation-brief-document",
    ] as const

    for (const retryFamily of retryFamilies) {
      const family = getProblemsForLevel(3).filter(
        (problem) => problem.retryFamily === retryFamily,
      )
      expect(family).toHaveLength(4)
      expect(new Set(family.map((problem) => problem.contentVariant)).size).toBe(4)

      const current = family[0]!
      const selected = selectTransferProblem({
        problems: problemBank,
        currentProblemId: current.id,
        retryFamily,
        recentProblemIds: [current.id, family[1]!.id],
      })

      expect(selected.id).toBe(family[2]!.id)
      expect(selected.level).toBe(3)
      expect(selected.retryFamily).toBe(retryFamily)
      expect(selected.contentVariant).not.toBe(current.contentVariant)
    }
  })

  it("rejects a bank with no safe transfer candidate", () => {
    const current = getProblemsForLevel(5)[0]!
    expect(() =>
      selectTransferProblem({
        problems: [current],
        currentProblemId: current.id,
        retryFamily: current.retryFamily,
        recentProblemIds: [],
      }),
    ).toThrow(`No safe transfer problem for ${current.retryFamily}`)
  })
})
