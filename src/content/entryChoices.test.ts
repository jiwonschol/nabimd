import { describe, expect, it } from "vitest"
import { getProblemsForLevel, problemBank } from "./problemBank"
import {
  createRunProblemIds,
  createRunProblemIdsForBank,
  entryChoices,
  getEntryChoice,
  isEntryId,
} from "./entryChoices"
import { getSyntaxFamily } from "../selection/runComposition"

describe("five-level entry choices", () => {
  it("exposes the task-type ladder", () => {
    expect(entryChoices.map((entry) => entry.id)).toEqual([
      "level-1",
      "level-2",
      "level-3",
      "level-4",
      "level-5",
    ])
    expect(entryChoices.map((entry) => entry.label)).toEqual([
      "Level 1 — Learn the syntax",
      "Level 2 — Rebuild real documents",
      "Level 3 — Write for people",
      "Level 4 — Write a development spec",
      "Level 5 — Write an agent work order",
    ])
    expect(
      entryChoices.map(
        (entry) => (entry as typeof entry & { taskType?: string }).taskType,
      ),
    ).toEqual([
      "learn-syntax",
      "rebuild-document",
      "write-for-people",
      "development-spec",
      "agent-work-order",
    ])
  })

  it.each(entryChoices)("builds a six-problem $id turn", (entry) => {
    const ids = createRunProblemIds(entry.id, 0)
    const problems = ids.map((id) => problemBank.find((problem) => problem.id === id)!)

    if (entry.level === 5) {
      expect(ids).toHaveLength(Math.min(6, getProblemsForLevel(5).length))
      expect(new Set(ids).size).toBe(ids.length)
      expect(problems.every((problem) => problem.level === 5)).toBe(true)
    } else {
      expect(ids).toHaveLength(6)
      expect(problems.slice(0, 4).every((problem) => problem.level === entry.level)).toBe(true)
      expect(problems.slice(4).every((problem) => problem.level === entry.level + 1)).toBe(true)
    }
  })

  it.each(["level-1", "level-2"] as const)(
    "spreads the four at-level problems across distinct syntax families for %s",
    (entryId) => {
      const ids = createRunProblemIds(entryId, 0).slice(0, 4)
      const families = ids.map(
        (id) => problemBank.find((problem) => problem.id === id)!.skillIds[0],
      )

      expect(new Set(families).size).toBe(4)
    },
  )

  it("never places the same low-level syntax family back-to-back across turns", () => {
    const families = Array.from({ length: 16 }, (_, runNumber) =>
      createRunProblemIds("level-1", runNumber)
        .map((id) =>
          getSyntaxFamily(
            problemBank.find((problem) => problem.id === id)!,
          ),
        ),
    ).flat()

    for (let index = 1; index < families.length; index += 1) {
      expect(families[index]).not.toBe(families[index - 1])
    }
  })

  it.each(["level-1", "level-2"] as const)(
    "serves two structurally different challenge problems for %s",
    (entryId) => {
      const challenges = createRunProblemIds(entryId, 0)
        .slice(4)
        .map((id) => problemBank.find((problem) => problem.id === id)!)
      const keys = challenges.map(
        (problem) => getSyntaxFamily(problem) ?? problem.retryFamily,
      )

      expect(challenges).toHaveLength(2)
      expect(new Set(keys).size).toBe(2)
    },
  )

  it("rotates deterministically within a level", () => {
    expect(createRunProblemIds("level-1", 0)).toEqual(
      createRunProblemIds("level-1", 0),
    )
    expect(createRunProblemIds("level-1", 0)).not.toEqual(
      createRunProblemIds("level-1", 1),
    )
  })

  it("rejects an empty level without crossing into another level", () => {
    const withoutLevelFive = problemBank.filter((problem) => problem.level !== 5)
    expect(() =>
      createRunProblemIdsForBank("level-5", 0, withoutLevelFive),
    ).toThrow("No standard problems available for level-5")
  })

  it("validates and resolves entry IDs", () => {
    expect(isEntryId("level-5")).toBe(true)
    expect(isEntryId("challenge")).toBe(false)
    expect(getEntryChoice("level-3").level).toBe(3)
  })
})
