import { describe, expect, it } from "vitest"
import { createRunProblemIds } from "../content/entryChoices"
import { getProblem } from "../content/problemBank"
import { createTurnProblemIds, getSyntaxFamily } from "./runComposition"
import { RUN_POLICY, SYNTAX_FAMILY_WEIGHTS } from "./runPolicy"

describe("run composition policy", () => {
  const problem = (
    id: string,
    level: 1 | 2 | 3,
    skillIds: readonly string[],
  ) => ({
    flavor: "standard" as const,
    id,
    level,
    retryFamily: skillIds.join("-") || id,
    skillIds,
    syntaxTokens: skillIds,
  })

  it("keeps every tunable count and family weight in one policy module", () => {
    expect(RUN_POLICY).toEqual({
      turnSize: 6,
      atLevelCount: 4,
      challengeCount: 2,
      hintShownCount: 4,
      challengeLevelOffset: 1,
    })
    expect(SYNTAX_FAMILY_WEIGHTS["ordered-list"]).toBeGreaterThan(
      SYNTAX_FAMILY_WEIGHTS.heading,
    )
    expect(SYNTAX_FAMILY_WEIGHTS["unordered-list"]).toBeGreaterThan(
      SYNTAX_FAMILY_WEIGHTS.heading,
    )
    for (const rareFamily of ["inline-code", "link", "image"] as const) {
      expect(SYNTAX_FAMILY_WEIGHTS[rareFamily]).toBeLessThan(
        SYNTAX_FAMILY_WEIGHTS.heading,
      )
    }
  })

  it("makes lists recur more often than rare families across many turns", () => {
    const counts = new Map<string, number>()

    for (let runNumber = 0; runNumber < 40; runNumber += 1) {
      for (const id of createRunProblemIds("level-1", runNumber).slice(0, 4)) {
        const family = getSyntaxFamily(getProblem(id))!
        counts.set(family, (counts.get(family) ?? 0) + 1)
      }
    }

    expect(counts.get("ordered-list")).toBeGreaterThan(
      counts.get("inline-code")!,
    )
    expect(counts.get("unordered-list")).toBeGreaterThan(counts.get("link")!)
  })

  it("keeps a limited two-family pool alternating and caps each family at two", () => {
    const bank = [
      problem("h1", 1, ["heading-h1"]),
      problem("h2", 1, ["heading-h1"]),
      problem("b1", 1, ["blockquote"]),
      problem("b2", 1, ["blockquote"]),
      problem("c1", 2, ["inline-code"]),
      problem("l1", 2, ["inline-link"]),
    ]
    const selected = createTurnProblemIds(1, 0, bank).slice(0, 4)
    const families = selected.map(
      (id) => getSyntaxFamily(bank.find((candidate) => candidate.id === id)!)!,
    )

    expect(families).toEqual(["heading", "blockquote", "heading", "blockquote"])
  })

  it("degrades to the available unique low-level problems without repeating IDs", () => {
    const bank = [
      problem("h1", 1, ["heading-h1"]),
      problem("b1", 1, ["blockquote"]),
      problem("c1", 2, ["inline-code"]),
      problem("l1", 2, ["inline-link"]),
    ]

    const selected = createTurnProblemIds(1, 0, bank)

    expect(selected).toEqual(["h1", "b1", "c1", "l1"])
    expect(new Set(selected).size).toBe(selected.length)
  })

  it("omits an unavoidable same-family low-level challenge at the boundary", () => {
    const bank = [
      problem("h1", 1, ["heading-h1"]),
      problem("b1", 1, ["blockquote"]),
      problem("b2", 2, ["blockquote"]),
    ]

    expect(createTurnProblemIds(1, 0, bank)).toEqual(["h1", "b1"])
  })

  it("prefers Level 2 composite rebuilds when the bank supplies them", () => {
    const bank = [
      problem("single-1", 2, ["heading-h1"]),
      problem("single-2", 2, ["blockquote"]),
      ...Array.from({ length: 4 }, (_, index) =>
        problem(`rebuild-${index}`, 2, ["document-outline", `shape-${index}`]),
      ),
      problem("challenge-1", 3, ["shape-a", "shape-b"]),
      problem("challenge-2", 3, ["shape-c", "shape-d"]),
    ]

    expect(createTurnProblemIds(2, 0, bank).slice(0, 4)).toEqual([
      "rebuild-0",
      "rebuild-1",
      "rebuild-2",
      "rebuild-3",
    ])
  })
})
