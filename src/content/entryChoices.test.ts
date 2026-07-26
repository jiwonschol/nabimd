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
import { getExerciseMode } from "./exerciseMode"
import { deriveSyntaxCheckpoints } from "../guided/guidedSyntax"

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
      "Level 4 — Write for work",
      "Level 5 — Write for developers",
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

  it("keeps every cross-level challenge self-contained with a visible target", () => {
    for (const entry of entryChoices.filter((item) => item.level < 5)) {
      const challenges = createRunProblemIds(entry.id, 0)
        .slice(4)
        .map((id) => problemBank.find((problem) => problem.id === id)!)

      for (const challenge of challenges) {
        expect(getExerciseMode(challenge.level)).toBe("target")
        expect(challenge.starterText.split("\n")).toHaveLength(
          challenge.target.split("\n").length,
        )
      }
    }
  })

  it("spreads the four Level 1 problems across distinct syntax families", () => {
    const ids = createRunProblemIds("level-1", 0).slice(0, 4)
    const families = ids.map((id) =>
      getSyntaxFamily(problemBank.find((problem) => problem.id === id)!),
    )

    expect(new Set(families).size).toBe(4)
  })

  it("keeps every Level 1 turn to six distinct single-mark syntax cards", () => {
    for (const seed of [0, 17, 255]) {
      for (let runNumber = 0; runNumber < 12; runNumber += 1) {
        const problems = createRunProblemIds(
          "level-1",
          runNumber,
          seed,
        ).map((id) => problemBank.find((problem) => problem.id === id)!)
        const families = problems.map((problem) => getSyntaxFamily(problem))

        expect(problems).toHaveLength(6)
        expect(families.every((family) => family !== null)).toBe(true)
        expect(new Set(families).size).toBe(6)
        expect(
          problems.map(
            (problem) =>
              deriveSyntaxCheckpoints(problem.target, problem.starterText)
                .length,
          ),
        ).toEqual([1, 1, 1, 1, 1, 1])
      }
    }
  })

  it("prefers composite Level 2 rebuilds without adjacent retry families", () => {
    const problems = createRunProblemIds("level-2", 0)
      .slice(0, 4)
      .map((id) => problemBank.find((problem) => problem.id === id)!)

    expect(problems.every((problem) => getSyntaxFamily(problem) === null)).toBe(
      true,
    )
    expect(
      problems.every((problem, index) =>
        index === 0 || problem.retryFamily !== problems[index - 1]!.retryFamily,
      ),
    ).toBe(true)
  })

  it("never places the same low-level syntax family back-to-back across turns", () => {
    const families = Array.from({ length: 16 }, (_, runNumber) =>
      createRunProblemIds("level-1", runNumber)
        .map((id) => {
          const problem = problemBank.find((candidate) => candidate.id === id)!
          return getSyntaxFamily(problem) ?? problem.retryFamily
        }),
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

  it("memoizes each level's served view of the same problem bank", () => {
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
