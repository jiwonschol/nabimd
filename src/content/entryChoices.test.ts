import { describe, expect, it } from "vitest"
import { getCurriculumElement } from "./curriculumElements"
import {
  createRunProblemIds,
  createRunProblemIdsForBank,
  entryChoices,
  getEntryChoice,
  isEntryId,
} from "./entryChoices"
import { problemBank } from "./problemBank"

describe("three-level entry choices", () => {
  it("serves the measured runtime pools for the frequency-based levels", () => {
    expect(
      entryChoices.map((entry) => {
        const elements = new Set(entry.elements)
        const pool = problemBank.filter((problem) => {
          const element = getCurriculumElement(problem)
          return element !== null && elements.has(element)
        })
        return {
          id: entry.id,
          problems: pool.length,
          elements: new Set(pool.map(getCurriculumElement)),
        }
      }),
    ).toEqual([
      {
        id: "level-1",
        problems: 212,
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
        problems: 78,
        elements: new Set([
          "thematic-break",
          "nested-list",
          "code-block-language",
        ]),
      },
      { id: "level-3", problems: 0, elements: new Set() },
    ])
  })

  it("builds five unique syntax elements for every open level", () => {
    for (const entry of entryChoices.filter((candidate) => candidate.available)) {
      for (const seed of [0, 1, 17, 999]) {
        for (let runNumber = 0; runNumber < 40; runNumber += 1) {
          const ids = createRunProblemIds(entry.id, runNumber, seed)
          const elements = ids.map((id) =>
            getCurriculumElement(
              problemBank.find((problem) => problem.id === id)!,
            ),
          )
          const label = `${entry.id} seed ${seed} run ${runNumber}`
          expect(ids, label).toHaveLength(5)
          expect(new Set(ids).size, label).toBe(5)
          expect(new Set(elements).size, label).toBe(5)
        }
      }
    }
  })

  it("rotates deterministically within an available level", () => {
    expect(createRunProblemIds("level-1", 0)).toEqual(
      createRunProblemIds("level-1", 0),
    )
    expect(createRunProblemIds("level-1", 0)).not.toEqual(
      createRunProblemIds("level-1", 1),
    )
  })

  it("derives custom-bank availability instead of trusting the production flag", () => {
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

    expect(
      createRunProblemIdsForBank("level-1", 0, representatives),
    ).toHaveLength(5)
    expect(() =>
      createRunProblemIdsForBank("level-1", 0, representatives.slice(0, 4)),
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
