import { describe, expect, it } from "vitest"
import type { NormalizedProblem } from "../content/types"
import {
  chooseMixedForRun,
  createTurnProblemIds,
  defaultBoundaryPreviousElements,
  getSyntaxFamily,
} from "./runComposition"
import { getCurriculumElements } from "../content/curriculumElements"
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
  it("keeps only the five-card turn size in policy", () => {
    expect(RUN_POLICY).toEqual({ turnSize: 5 })
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

    expect(selected).toHaveLength(5)
    expect(new Set(selected).size).toBe(5)
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

  it("distributes five cards deterministically across any family count", () => {
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

    const threeFamilyExpectedByRun = [
      { heading: 2, bold: 2, italic: 1 },
      { heading: 1, bold: 2, italic: 2 },
      { heading: 2, bold: 1, italic: 2 },
    ]

    for (const seed of [0, 1, 17, 41, 999]) {
      for (const [runNumber, expected] of threeFamilyExpectedByRun.entries()) {
        const counts = createTurnProblemIds(1, runNumber, bank, seed).reduce(
          (result, id) => {
            const family = id.split("-")[0] as "heading" | "bold" | "italic"
            result[family] += 1
            return result
          },
          { heading: 0, bold: 0, italic: 0 },
        )

        expect(counts, `seed ${seed}, run ${runNumber}`).toEqual(expected)
      }
    }

    const twoFamilyBank = bank.filter((entry) => !entry.id.startsWith("italic"))
    for (const seed of [0, 41, 999]) {
      const counts = createTurnProblemIds(1, 0, twoFamilyBank, seed).reduce(
        (result, id) => {
          const family = id.split("-")[0] as "heading" | "bold"
          result[family] += 1
          return result
        },
        { heading: 0, bold: 0 },
      )

      expect(counts, `two families, seed ${seed}`).toEqual({
        heading: 2,
        bold: 3,
      })
    }
  })

  it("keeps composite retry-family coverage seed-variable", () => {
    const bank = Array.from({ length: 12 }, (_, index) => ({
      ...problem(`composite-${index}`, 5, ["heading-h1", "inline-code"]),
      retryFamily: `retry-${index}`,
    }))
    const reached = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        createTurnProblemIds(3, 0, bank, seed),
      ).flat(),
    )

    expect(reached.size).toBeGreaterThan(RUN_POLICY.turnSize)
  })

  it("rejects an empty chapter pool", () => {
    expect(() => createTurnProblemIds(3, 0, [], 0)).toThrow(
      "No standard problems available for chapter-3",
    )
  })
})

describe("the run before a cycle boundary", () => {
  // The walk that picks the mixed exercise starts at the cycle boundary, so
  // the run before it is one the loop never visits. Left unseeded, the first
  // run of every cycle chose as if nothing came before it.
  //
  // Comparing the boundary run against its neighbours cannot show this — the
  // neighbourhood swings by ten points on its own and a run beside it is often
  // worse. The seeded and unseeded choices are compared directly instead,
  // which is the line the code either has or does not.
  //
  // Elements come from syntax tokens, not skill ids, so the fixtures carry
  // real marks; built from names alone every candidate has no elements and
  // every overlap is zero, which passes whatever the rule does.
  const withTokens = (id: string, tokens: readonly string[]): SchedulableProblem => ({
    flavor: "standard",
    id,
    level: 1,
    retryFamily: id,
    skillIds: ["one", "two"],
    syntaxTokens: tokens,
  })

  // Ordered so the two rules disagree. `mixed-link-image` collides with
  // nothing this run, so an unseeded boundary takes it first; it collides with
  // both of the previous run's singles, so a seeded one must not.
  const mixedPool = [
    withTokens("mixed-heading-list", ["# ", "- "]),
    withTokens("mixed-link-image", ["[", "!["]),
    withTokens("mixed-quote-code", ["> ", "```"]),
  ]
  const boundary = mixedPool.length
  const singlesByRun: Record<number, SchedulableProblem[]> = {
    [boundary - 1]: [withTokens("s-link", ["["]), withTokens("s-image", ["!["])],
    [boundary]: [withTokens("s-heading", ["# "]), withTokens("s-list", ["- "])],
  }
  const singlesForRun = (runNumber: number) => singlesByRun[runNumber] ?? []

  const previousElements = () =>
    new Set(singlesForRun(boundary - 1).flatMap(getCurriculumElements))

  it("has real elements, or nothing below measures anything", () => {
    expect(previousElements()).toEqual(new Set(["link", "image"]))
    for (const candidate of mixedPool) {
      expect(getCurriculumElements(candidate), candidate.id).toHaveLength(2)
    }
  })

  it("is carried into the choice the boundary makes", () => {
    const seeded = chooseMixedForRun(mixedPool, singlesForRun, boundary)
    const unseeded = chooseMixedForRun(
      mixedPool,
      singlesForRun,
      boundary,
      () => [],
    )
    const overlap = (chosen: SchedulableProblem) => {
      const previous = previousElements()
      return getCurriculumElements(chosen).filter((element) =>
        previous.has(element),
      ).length
    }

    expect(unseeded.id).toBe("mixed-link-image")
    expect(seeded.id).toBe("mixed-quote-code")
    expect(overlap(unseeded)).toBe(2)
    expect(overlap(seeded)).toBe(0)
  })

  it("is the previous run's singles and nothing else", () => {
    const seed = defaultBoundaryPreviousElements(singlesForRun)
    expect([...seed(boundary)].sort()).toEqual(["image", "link"])
    // Run 0 has no run before it, and reaching back would wrap to the end.
    expect(seed(0)).toEqual([])
  })
})
