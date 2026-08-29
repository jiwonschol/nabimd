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
import {
  countRuntimeTargetContentLines,
  problemBank,
} from "./problemBank"
import {
  deriveSyntaxCheckpoints,
  syntaxGroupTerm,
  type SyntaxCheckpoint,
} from "../guided/guidedSyntax"
import { instructionFor } from "../guided/checkpointInstruction"
import { checkpointShape } from "../guided/checkpointShape"

function checkpointTerms(checkpoint: SyntaxCheckpoint): string[] {
  return [
    ...new Set(
      checkpoint.segments.flatMap((segment, index) => {
        if (segment.kind !== "input") return []
        const previous = checkpoint.segments[index - 1]
        return [
          syntaxGroupTerm(
            segment.value,
            previous?.kind === "locked" && /\n[\t ]*$/.test(previous.value),
          ),
        ]
      }),
    ),
  ]
}

function hasSeparatedRepeatedTerm(
  checkpoints: readonly SyntaxCheckpoint[],
): boolean {
  const termsByCheckpoint = checkpoints.map(checkpointTerms)
  const allTerms = new Set(termsByCheckpoint.flat())
  return [...allTerms].some((term) => {
    const indexes = termsByCheckpoint.flatMap((terms, index) =>
      terms.includes(term) ? [index] : [],
    )
    return indexes.some(
      (value, index) => index > 0 && value - indexes[index - 1]! > 1,
    )
  })
}

describe("three-level entry choices", () => {
  it("owns the measured runtime pools before mixed eligibility", () => {
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
          "image",
          "table",
        ]),
      },
      {
        id: "level-2",
        problems: 48,
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
          if (
            !(
            problem.flavor === "standard" &&
            elements.length > 1 &&
            elements.every((element) => entryElements.has(element))
            )
          ) {
            return false
          }
          const checkpoints = deriveSyntaxCheckpoints(
            problem.target,
            problem.starterText,
          )
          return (
            checkpoints.length <= 5 &&
            !hasSeparatedRepeatedTerm(checkpoints)
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

    expect(expectedMixedIds).toHaveLength(39)
    expect(servedMixedIds).toEqual(expectedMixedIds)

    const allServedIds = new Set(
      Array.from({ length: 300 }, (_, runNumber) =>
        createRunProblemIds("level-1", runNumber, 0),
      ).flat(),
    )
    expect(allServedIds).toHaveLength(275)
  })

  it("keeps every served mixed exercise short and free of separated syntax repeats", () => {
    const servedMixedIds = new Set<string>()
    for (const seed of [0, 1, 17, 999]) {
      const mixedIds: string[] = []
      for (let runNumber = 0; runNumber < 39; runNumber += 1) {
        for (const id of createRunProblemIds("level-1", runNumber, seed)) {
          const problem = problemBank.find((candidate) => candidate.id === id)!
          if (getCurriculumElements(problem).length > 1) {
            servedMixedIds.add(id)
            mixedIds.push(id)
          }
        }
      }
      expect(new Set(mixedIds), `seed ${seed}`).toHaveLength(39)
      expect(
        mixedIds.some((id, index) => index > 0 && id === mixedIds[index - 1]),
        `seed ${seed}`,
      ).toBe(false)
    }

    expect(servedMixedIds).toHaveLength(39)
    for (const id of servedMixedIds) {
      const problem = problemBank.find((candidate) => candidate.id === id)!
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )
      expect(checkpoints.length, id).toBeLessThanOrEqual(5)
      expect(hasSeparatedRepeatedTerm(checkpoints), id).toBe(false)
    }
  })

  it("keeps every served Level 1 exercise inside its owner-level line budget", () => {
    const served = problemBank.filter(
      (problem) => getProblemEntryId(problem) === "level-1",
    )

    expect(served).not.toHaveLength(0)
    for (const problem of served) {
      const isMixed = getCurriculumElements(problem).length > 1
      if (isMixed) {
        expect(
          countRuntimeTargetContentLines(problem.target),
          problem.id,
        ).toBeLessThanOrEqual(12)
      } else {
        expect(
          problem.target.split("\n").length,
          problem.id,
        ).toBeLessThanOrEqual(5)
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
    const mixed = problemBank.find(
      (problem) => problem.id === "l2-code-block-door-copy",
    )
    if (!mixed) throw new Error("Missing Level 1 mixed fixture")
    const separatedRepeat = {
      ...mixed,
      id: "synthetic-separated-heading-repeat",
      target: [
        "# Daily note",
        "",
        "## Morning",
        "",
        "**Remember this**",
        "",
        "## Evening",
      ].join("\n"),
      starterText: [
        "Daily note",
        "",
        "Morning",
        "",
        "Remember this",
        "",
        "Evening",
      ].join("\n"),
      skillIds: ["heading-h1", "bold-emphasis"],
      syntaxTokens: ["# ", "## ", "**", "## "],
    }
    const consecutiveRepeat = {
      ...mixed,
      id: "synthetic-consecutive-list-repeat",
      target: ["# Groceries", "", "- Apples", "- Milk"].join("\n"),
      starterText: ["Groceries", "", "Apples", "Milk"].join("\n"),
      skillIds: ["heading-h1", "unordered-list"],
      syntaxTokens: ["# ", "- ", "- "],
    }
    const sixUniqueCheckpoints = {
      ...mixed,
      id: "synthetic-six-unique-checkpoints",
      target: [
        "# Plan",
        "",
        "**Important**",
        "",
        "*Quietly*",
        "",
        "- Pack",
        "",
        "1. Leave",
        "",
        "> Be safe",
      ].join("\n"),
      starterText: [
        "Plan",
        "",
        "Important",
        "",
        "Quietly",
        "",
        "Pack",
        "",
        "Leave",
        "",
        "Be safe",
      ].join("\n"),
      skillIds: [
        "heading-h1",
        "bold-emphasis",
        "italic-emphasis",
        "unordered-list",
        "ordered-list",
        "blockquote",
      ],
      syntaxTokens: ["# ", "**", "*", "- ", "1. ", "> "],
    }

    expect(() =>
      createRunProblemIdsForBank("level-1", 0, representatives),
    ).toThrow("Level 1 is not available yet")
    expect(() =>
      createRunProblemIdsForBank("level-1", 0, [
        ...representatives,
        separatedRepeat,
      ]),
    ).toThrow("Level 1 is not available yet")
    expect(() =>
      createRunProblemIdsForBank("level-1", 0, [
        ...representatives,
        sixUniqueCheckpoints,
      ]),
    ).toThrow("Level 1 is not available yet")
    expect(
      createRunProblemIdsForBank("level-1", 0, [
        ...representatives,
        consecutiveRepeat,
      ]),
    ).toHaveLength(5)
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

describe("how often a run repeats a syntax the learner just practised", () => {
  // Jiwon, 2026-08-29: "I answered everything right and kept pressing Enter,
  // and problems of the same syntax keep coming." Measured on the live build
  // it was true and not a feeling: over this grid the same problem never came
  // back, while the syntax behind it returned every second run.
  //
  // The budgets below are ceilings, not the current readings. They are chosen
  // to sit under what the schedule did before the mixed exercise started
  // avoiding what the run beside it teaches (same-run 1.29 cards, run-to-run
  // 35.1%), so reverting that choice fails here rather than passing quietly.
  //
  // The run-to-run figure cannot go much lower from this file. Every mixed
  // exercise in the bank opens on a level 1 heading, so no candidate can avoid
  // that element; #198 is where that card is answered.
  const SEEDS = 40
  const RUNS = 10
  const MAX_SAME_RUN_REPEATS_PER_RUN = 1.1
  const MAX_RUN_TO_RUN_REPEAT_RATE = 0.33
  const MAX_CARDS_PER_RUN = 8.1

  function runCardTerms(runNumber: number, seed: number): string[] {
    return createRunProblemIds("level-1", runNumber, seed).flatMap((id) => {
      const problem = problemBank.find((candidate) => candidate.id === id)!
      return deriveSyntaxCheckpoints(problem.target, problem.starterText).map(
        (checkpoint) => instructionFor(checkpointShape(checkpoint)).term,
      )
    })
  }

  it("keeps a sitting off the syntax it just taught", () => {
    let runs = 0
    let cards = 0
    let sameRunRepeats = 0
    let returningSyntaxes = 0
    let syntaxes = 0

    for (let seed = 0; seed < SEEDS; seed += 1) {
      let previous = new Set<string>()
      for (let runNumber = 0; runNumber < RUNS; runNumber += 1) {
        const terms = runCardTerms(runNumber, seed)
        const distinct = new Set<string>()
        for (const term of terms) {
          if (distinct.has(term)) sameRunRepeats += 1
          distinct.add(term)
        }
        for (const term of distinct) {
          syntaxes += 1
          if (previous.has(term)) returningSyntaxes += 1
        }
        previous = distinct
        runs += 1
        cards += terms.length
      }
    }

    expect(runs).toBe(SEEDS * RUNS)
    expect(sameRunRepeats / runs).toBeLessThanOrEqual(
      MAX_SAME_RUN_REPEATS_PER_RUN,
    )
    expect(returningSyntaxes / syntaxes).toBeLessThanOrEqual(
      MAX_RUN_TO_RUN_REPEAT_RATE,
    )
    expect(cards / runs).toBeLessThanOrEqual(MAX_CARDS_PER_RUN)
  })

  it("never serves the same problem twice across the grid it covers", () => {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const served: string[] = []
      for (let runNumber = 0; runNumber < RUNS; runNumber += 1) {
        served.push(...createRunProblemIds("level-1", runNumber, seed))
      }
      expect(new Set(served).size, `seed ${seed}`).toBe(served.length)
    }
  })
})
