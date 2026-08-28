import { describe, expect, it } from "vitest"
import { problemBank } from "./problemBank"
import {
  createRunProblemIds,
  createRunProblemIdsForBank,
  entryChoices,
  getEntryChoice,
  isEntryId,
} from "./entryChoices"
import { getSyntaxFamily } from "../selection/runComposition"

function scheduleFamily(problem: (typeof problemBank)[number]) {
  return getSyntaxFamily(problem) ?? "composite"
}

function familiesFor(entry: (typeof entryChoices)[number]): readonly string[] {
  return (
    entry as typeof entry & { families?: readonly string[] }
  ).families ?? []
}

describe("five-chapter entry choices", () => {
  it("exposes disjoint syntax chapters instead of a difficulty ladder", () => {
    expect(entryChoices.map((entry) => entry.id)).toEqual([
      "level-1",
      "level-2",
      "level-3",
      "level-4",
      "level-5",
    ])
    expect(entryChoices.map((entry) => entry.label)).toEqual([
      "Chapter 1 — Headings & emphasis",
      "Chapter 2 — Lists",
      "Chapter 3 — Links & dividers",
      "Chapter 4 — Code & quotes",
      "Chapter 5 — Mixed practice",
    ])
    expect(entryChoices.map(familiesFor)).toEqual([
      ["heading", "bold", "italic"],
      ["ordered-list", "unordered-list"],
      ["link", "image", "thematic-break"],
      ["inline-code", "code-block", "blockquote"],
      ["composite"],
    ])

    const everyFamily = entryChoices.flatMap(familiesFor)
    expect(new Set(everyFamily).size).toBe(everyFamily.length)
  })

  it.each(entryChoices)("keeps the complete $id pool inside its syntax families", (entry) => {
    const families = familiesFor(entry)
    const pool = problemBank.filter((problem) =>
      families.includes(scheduleFamily(problem)),
    )

    expect(pool.length).toBeGreaterThanOrEqual(30)
    expect(pool.every((problem) => families.includes(scheduleFamily(problem)))).toBe(
      true,
    )
  })

  it.each(entryChoices)("builds a five-problem $id turn without cross-chapter injection", (entry) => {
    const ids = createRunProblemIds(entry.id, 0)
    const families = familiesFor(entry)
    const problems = ids.map((id) => problemBank.find((problem) => problem.id === id)!)

    expect(ids).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
    expect(problems.every((problem) => families.includes(scheduleFamily(problem)))).toBe(
      true,
    )
  })

  it("rotates deterministically within a chapter", () => {
    expect(createRunProblemIds("level-1", 0)).toEqual(
      createRunProblemIds("level-1", 0),
    )
    expect(createRunProblemIds("level-1", 0)).not.toEqual(
      createRunProblemIds("level-1", 1),
    )
  })

  it("memoizes each chapter's served view of the same problem bank", () => {
    let sourceProblemReads = 0
    const trackedBank = new Proxy(problemBank, {
      get(target, property, receiver) {
        if (typeof property === "string" && /^\d+$/.test(property)) {
          sourceProblemReads += 1
        }
        return Reflect.get(target, property, receiver)
      },
    })

    createRunProblemIdsForBank("level-1", 0, trackedBank, 41)
    const afterFirstLevelOneRun = sourceProblemReads

    createRunProblemIdsForBank("level-1", 0, trackedBank, 41)
    expect(sourceProblemReads).toBe(afterFirstLevelOneRun)

    createRunProblemIdsForBank("level-2", 0, trackedBank, 41)
    const afterFirstLevelTwoRun = sourceProblemReads
    expect(afterFirstLevelTwoRun).toBeGreaterThan(afterFirstLevelOneRun)

    createRunProblemIdsForBank("level-2", 0, trackedBank, 41)
    expect(sourceProblemReads).toBe(afterFirstLevelTwoRun)
  })

  it("rejects an empty chapter without crossing into another chapter", () => {
    const withoutChapterFive = problemBank.filter(
      (problem) => scheduleFamily(problem) !== "composite",
    )
    expect(() =>
      createRunProblemIdsForBank("level-5", 0, withoutChapterFive),
    ).toThrow("No standard problems available for chapter-5")
  })

  it("validates and resolves entry IDs", () => {
    expect(isEntryId("level-5")).toBe(true)
    expect(isEntryId("challenge")).toBe(false)
    expect(getEntryChoice("level-3").level).toBe(3)
  })
})
