import { describe, expect, it } from "vitest"
import type { NormalizedProblem } from "../content/types"
import { emptyLangProgress, type LangProgress } from "../progress/learning"
import type { MarkId } from "./marks"
import type { PracticeItem } from "./practiceItem"
import { pickForMark, pickTodayFive, RUN_SIZE } from "./selection"

function item(id: string, marks: MarkId[], allMarks = marks): PracticeItem {
  return {
    problem: { id } as NormalizedProblem,
    marks: [marks[0]!, ...marks.slice(1)],
    allMarks,
    mixed: marks.length > 1,
  }
}

/** A seeded generator, so a failure replays. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

const bank: PracticeItem[] = [
  ...(["heading", "bold", "italic", "blockquote", "link", "table"] as const).flatMap(
    (mark) => [item(`${mark}-1`, [mark]), item(`${mark}-2`, [mark])],
  ),
  item("mixed-heading-list", ["heading", "unordered-list"]),
  item("mixed-quote-code", ["blockquote", "inline-code"]),
]

function triedAll(except: MarkId[] = []): LangProgress {
  const progress = emptyLangProgress()
  const marks: MarkId[] = ["heading", "bold", "italic", "blockquote", "link", "table"]
  return {
    ...progress,
    marks: Object.fromEntries(
      marks
        .filter((mark) => !except.includes(mark))
        .map((mark) => [mark, { tries: 1, passes: 1, lastAt: 1 }]),
    ),
  }
}

describe("pickTodayFive", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    "keeps the bundle rules for seed %i",
    (seed) => {
      const run = pickTodayFive(bank, emptyLangProgress(), seeded(seed))
      expect(run).toHaveLength(RUN_SIZE)
      expect(run.filter((entry) => entry.mixed).length).toBeLessThanOrEqual(1)
      // A mixed document, when there is one, closes the bundle.
      expect(run.slice(0, -1).some((entry) => entry.mixed)).toBe(false)
      for (let index = 1; index < run.length; index += 1) {
        const shared = run[index]!.marks.filter((mark) =>
          run[index - 1]!.marks.includes(mark),
        )
        expect(shared).toEqual([])
      }
      expect(new Set(run.map((entry) => entry.problem.id)).size).toBe(run.length)
    },
  )

  it("puts the marks the learner has not tried first", () => {
    const progress = triedAll(["table", "italic"])
    for (const seed of [1, 2, 3]) {
      const run = pickTodayFive(bank, progress, seeded(seed))
      expect(new Set(run.slice(0, 2).map((entry) => entry.marks[0]))).toEqual(
        new Set(["table", "italic"]),
      )
    }
  })

  it("prefers documents the learner has not written recently", () => {
    const progress: LangProgress = {
      ...emptyLangProgress(),
      recentIds: bank.filter((entry) => entry.problem.id.endsWith("-1")).map(
        (entry) => entry.problem.id,
      ),
    }
    const run = pickTodayFive(bank, progress, seeded(9))
    const singles = run.filter((entry) => !entry.mixed)
    expect(singles.every((entry) => entry.problem.id.endsWith("-2"))).toBe(true)
  })

  it("fills five from three documents without repeating a neighbour", () => {
    const small = [
      item("list", ["unordered-list"]),
      item("steps", ["ordered-list"]),
      item("quote", ["blockquote"]),
    ]
    const run = pickTodayFive(small, emptyLangProgress(), seeded(3))
    expect(run).toHaveLength(RUN_SIZE)
    for (let index = 1; index < run.length; index += 1) {
      expect(run[index]!.problem.id).not.toBe(run[index - 1]!.problem.id)
    }
  })

  it("returns nothing for an empty bank", () => {
    expect(pickTodayFive([], emptyLangProgress())).toEqual([])
  })
})

describe("pickForMark", () => {
  it("opens a single-mark document of that mark, avoiding the current one", () => {
    const choice = pickForMark(bank, "bold", emptyLangProgress(), ["bold-1"], seeded(1))
    expect(choice?.problem.id).toBe("bold-2")
  })

  it("practises a mark found only inside another document as that mark", () => {
    const choice = pickForMark(bank, "unordered-list", emptyLangProgress(), [], seeded(1))
    expect(choice).toMatchObject({
      problem: { id: "mixed-heading-list" },
      marks: ["unordered-list"],
      mixed: false,
    })
  })

  it("finds nothing for a mark no document contains", () => {
    expect(pickForMark(bank, "task-list", emptyLangProgress())).toBeNull()
  })
})
