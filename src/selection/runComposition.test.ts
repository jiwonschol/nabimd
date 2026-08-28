import { describe, expect, it } from "vitest"
import type { NormalizedProblem } from "../content/types"
import { createTurnProblemIds, getSyntaxFamily } from "./runComposition"
import { RUN_POLICY, SYNTAX_FAMILY_WEIGHTS } from "./runPolicy"

type SchedulableProblem = Pick<
  NormalizedProblem,
  "flavor" | "id" | "level" | "retryFamily" | "skillIds" | "syntaxTokens"
>

function problem(
  id: string,
  level: 1 | 2 | 3 | 4 | 5,
  skillIds: readonly string[],
): SchedulableProblem {
  return {
    flavor: "standard",
    id,
    level,
    retryFamily: skillIds.join("-") || id,
    skillIds,
    syntaxTokens: skillIds,
  }
}

describe("chapter run composition", () => {
  it("keeps only the six-card turn size in policy", () => {
    expect(RUN_POLICY).toEqual({ turnSize: 6 })
    expect(new Set(Object.values(SYNTAX_FAMILY_WEIGHTS))).toEqual(new Set([1]))
  })

  it("recognizes single-syntax families and leaves composites explicit", () => {
    expect(getSyntaxFamily(problem("heading", 1, ["heading-h1"]))).toBe(
      "heading",
    )
    expect(getSyntaxFamily(problem("code", 2, ["code-block"]))).toBe(
      "code-block",
    )
    expect(
      getSyntaxFamily(problem("mixed", 5, ["heading-h1", "inline-code"])),
    ).toBeNull()
  })

  it("selects only from the supplied chapter pool regardless of legacy level", () => {
    const bank = Array.from({ length: 12 }, (_, index) =>
      problem(
        `chapter-${index}`,
        ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        index % 2 === 0 ? ["heading-h1"] : ["bold-emphasis"],
      ),
    )

    const selected = createTurnProblemIds(1, 0, bank, 17)

    expect(selected).toHaveLength(6)
    expect(new Set(selected).size).toBe(6)
    expect(selected.every((id) => id.startsWith("chapter-"))).toBe(true)
  })

  it("is deterministic for one seed and rotates to fresh cards next turn", () => {
    const bank = Array.from({ length: 18 }, (_, index) =>
      problem(`card-${index}`, 1, [index % 2 ? "blockquote" : "heading-h1"]),
    )

    const first = createTurnProblemIds(1, 0, bank, 41)
    const repeated = createTurnProblemIds(1, 0, bank, 41)
    const second = createTurnProblemIds(1, 1, bank, 41)

    expect(repeated).toEqual(first)
    expect(second.every((id) => !first.includes(id))).toBe(true)
  })

  it("keeps imbalanced chapter families mixed after smaller groups exhaust", () => {
    const bank = [
      ...Array.from({ length: 44 }, (_, index) =>
        problem(`heading-${index}`, 1, ["heading-h1"]),
      ),
      ...Array.from({ length: 24 }, (_, index) =>
        problem(`bold-${index}`, 1, ["bold-emphasis"]),
      ),
      ...Array.from({ length: 12 }, (_, index) =>
        problem(`italic-${index}`, 1, ["italic-emphasis"]),
      ),
    ]
    const family = (id: string) => id.split("-")[0]

    for (const runNumber of [10, 11, 12]) {
      const families = createTurnProblemIds(1, runNumber, bank, 0).map(family)
      expect(new Set(families).size, `run ${runNumber}`).toBeGreaterThan(1)
    }
  })

  it("honors equal family weights in each fresh six-card turn", () => {
    const bank = [
      ...Array.from({ length: 44 }, (_, index) =>
        problem(`heading-${index}`, 1, ["heading-h1"]),
      ),
      ...Array.from({ length: 24 }, (_, index) =>
        problem(`bold-${index}`, 1, ["bold-emphasis"]),
      ),
      ...Array.from({ length: 12 }, (_, index) =>
        problem(`italic-${index}`, 1, ["italic-emphasis"]),
      ),
    ]

    for (const runNumber of [0, 1, 2, 3, 4]) {
      const counts = createTurnProblemIds(1, runNumber, bank, 0).reduce(
        (result, id) => {
          const family = id.split("-")[0] as "heading" | "bold" | "italic"
          result[family] += 1
          return result
        },
        { heading: 0, bold: 0, italic: 0 },
      )

      expect(counts, `run ${runNumber}`).toEqual({
        heading: 2,
        bold: 2,
        italic: 2,
      })
    }
  })

  it("rejects an empty chapter pool", () => {
    expect(() => createTurnProblemIds(3, 0, [], 0)).toThrow(
      "No standard problems available for chapter-3",
    )
  })
})
