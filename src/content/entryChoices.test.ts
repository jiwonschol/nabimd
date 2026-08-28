import { describe, expect, it } from "vitest"
import {
  type CurriculumElement,
  getCurriculumElement,
  getCurriculumElements,
} from "./curriculumElements"
import {
  createRunProblemIds,
  createRunProblemIdsForBank,
  entryChoices,
  getEntryChoice,
  getProblemEntryId,
  isEntryId,
} from "./entryChoices"
import { problemBank } from "./problemBank"

describe("three-level entry choices", () => {
  it("serves the measured runtime pools for the frequency-based levels", () => {
    expect(
      entryChoices.map((entry) => {
        const elements = new Set(entry.elements)
        const pool = problemBank.filter((problem) => {
          return (
            problem.flavor === "standard" &&
            getProblemEntryId(problem) === entry.id
          )
        })
        return {
          id: entry.id,
          problems: pool.length,
          elements: new Set(
            pool
              .map(getCurriculumElement)
              .filter((element) => element !== null && elements.has(element)),
          ),
        }
      }),
    ).toEqual([
      {
        id: "level-1",
        problems: 316,
        elements: new Set([
          "heading",
          "bold",
          "italic",
          "unordered-list",
          "ordered-list",
          "link",
          "inline-code",
          "code-block",
          "blockquote",
        ]),
      },
      {
        id: "level-2",
        problems: 56,
        elements: new Set([
          "thematic-break",
          "nested-list",
        ]),
      },
      { id: "level-3", problems: 0, elements: new Set() },
    ])
  })

  it("routes a mixed exercise to its highest owning curriculum level", () => {
    const nested = problemBank.find(
      (problem) => problem.id === "l2-nested-checklist-closet-shelf",
    )
    if (!nested) throw new Error("Missing cross-level nested-list fixture")

    expect(getCurriculumElements(nested)).toEqual([
      "heading",
      "unordered-list",
      "nested-list",
    ])
    expect(getProblemEntryId(nested)).toBe("level-2")
  })

  it("builds five distinct exercise slots for every open level", () => {
    for (const entry of entryChoices.filter((candidate) => candidate.available)) {
      for (const seed of [0, 1, 17, 999]) {
        for (let runNumber = 0; runNumber < 40; runNumber += 1) {
          const ids = createRunProblemIds(entry.id, runNumber, seed)
          const selectionKeys = ids.map((id) => {
            const problem = problemBank.find((candidate) => candidate.id === id)!
            return getCurriculumElement(problem) ?? "mixed"
          })
          const label = `${entry.id} seed ${seed} run ${runNumber}`
          expect(ids, label).toHaveLength(5)
          expect(new Set(ids).size, label).toBe(5)
          expect(new Set(selectionKeys).size, label).toBe(5)
        }
      }
    }
  })

  it("serves one Level 1 mixed exercise beside four distinct single elements", () => {
    const entry = getEntryChoice("level-1")
    const entryElements = new Set<CurriculumElement>(entry.elements)
    const expectedMixedIds = new Set(
      problemBank
        .filter((problem) => {
          const elements = getCurriculumElements(problem)
          return (
            problem.flavor === "standard" &&
            elements.length > 1 &&
            elements.every((element) => entryElements.has(element))
          )
        })
        .map((problem) => problem.id),
    )
    const servedMixedIds = new Set<string>()

    for (const seed of [0, 1, 17, 999]) {
      for (let runNumber = 0; runNumber < 104; runNumber += 1) {
        const problems = createRunProblemIds("level-1", runNumber, seed).map(
          (id) => problemBank.find((problem) => problem.id === id)!,
        )
        const mixed = problems.filter(
          (problem) => getCurriculumElements(problem).length > 1,
        )
        const singles = problems.filter(
          (problem) => getCurriculumElements(problem).length === 1,
        )

        expect(mixed, `seed ${seed} run ${runNumber}`).toHaveLength(1)
        expect(singles, `seed ${seed} run ${runNumber}`).toHaveLength(4)
        expect(
          new Set(singles.map((problem) => getCurriculumElement(problem))).size,
          `seed ${seed} run ${runNumber}`,
        ).toBe(4)
        for (const element of getCurriculumElements(mixed[0]!)) {
          expect(entryElements.has(element)).toBe(true)
        }
        if (seed === 0) servedMixedIds.add(mixed[0]!.id)
      }
    }

    expect(expectedMixedIds).toHaveLength(104)
    expect(servedMixedIds).toEqual(expectedMixedIds)

    const allServedIds = new Set(
      Array.from({ length: 300 }, (_, runNumber) =>
        createRunProblemIds("level-1", runNumber, 0),
      ).flat(),
    )
    expect(allServedIds).toHaveLength(316)
  })

  it("rotates deterministically within an available level", () => {
    expect(createRunProblemIds("level-1", 0)).toEqual(
      createRunProblemIds("level-1", 0),
    )
    expect(createRunProblemIds("level-1", 0)).not.toEqual(
      createRunProblemIds("level-1", 1),
    )
  })

  it("requires the dedicated and mixed exercises promised by an available level", () => {
    const fiveElements = [
      "heading",
      "bold",
      "italic",
      "unordered-list",
      "ordered-list",
    ]
    const representatives = fiveElements.map((element) =>
      problemBank.find(
        (problem) => getCurriculumElement(problem) === element,
      )!,
    )
    const mixed = problemBank.find((problem) => {
      const elements = getCurriculumElements(problem)
      return (
        elements.length > 1 &&
        elements.every((element) => fiveElements.includes(element))
      )
    })
    if (!mixed) throw new Error("Missing Level 1 mixed fixture")

    expect(() =>
      createRunProblemIdsForBank("level-1", 0, representatives),
    ).toThrow("Level 1 is not available yet")
    expect(
      createRunProblemIdsForBank("level-1", 0, [
        ...representatives,
        mixed,
      ]),
    ).toHaveLength(5)
    expect(() =>
      createRunProblemIdsForBank("level-1", 0, [
        ...representatives.slice(0, 4),
        mixed,
      ]),
    ).toThrow("Level 1 is not available yet")
  })

  it("keeps incomplete levels non-enterable", () => {
    expect(() => createRunProblemIds("level-2", 0)).toThrow(
      "Level 2 is not available yet",
    )
    expect(() => createRunProblemIds("level-3", 0)).toThrow(
      "Level 3 is not available yet",
    )
  })

  it("validates and resolves the new entry IDs", () => {
    expect(isEntryId("level-3")).toBe(true)
    expect(isEntryId("level-4")).toBe(false)
    expect(isEntryId("challenge")).toBe(false)
    expect(getEntryChoice("level-2").level).toBe(2)
  })
})
