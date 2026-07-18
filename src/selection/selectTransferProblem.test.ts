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
