import { describe, expect, it } from "vitest"
import { getProblemsForLevel, problemBank } from "./problemBank"
import {
  createRunProblemIds,
  createRunProblemIdsForBank,
  entryChoices,
  getEntryChoice,
  isEntryId,
} from "./entryChoices"

describe("five-level entry choices", () => {
  it("exposes the definitive ladder and only auto-opens Level 1 Help", () => {
    expect(entryChoices.map((entry) => entry.id)).toEqual([
      "level-1",
      "level-2",
      "level-3",
      "level-4",
      "level-5",
    ])
    expect(entryChoices.map((entry) => entry.autoOpenHelp)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ])
  })

  it.each(entryChoices)("keeps $id runs inside its exact level", (entry) => {
    const ids = createRunProblemIds(entry.id, 0)
    const allowed = new Set(
      getProblemsForLevel(entry.level).map((problem) => problem.id),
    )
    expect(ids).toHaveLength(3)
    expect(ids.every((id) => allowed.has(id))).toBe(true)
  })

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
