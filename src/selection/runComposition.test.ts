import { describe, expect, it } from "vitest"
import { createRunProblemIds } from "../content/entryChoices"
import { getProblem, getProblemsForLevel } from "../content/problemBank"
import { createTurnProblemIds, getSyntaxFamily } from "./runComposition"
import {
  EXCLUDED_SYNTAX_FAMILIES,
  RUN_POLICY,
  SYNTAX_FAMILY_WEIGHTS,
  type SyntaxFamily,
} from "./runPolicy"

describe("run composition policy", () => {
  const problem = (
    id: string,
    level: 1 | 2 | 3 | 4 | 5,
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
    // No family is privileged: a practice run should feel varied, not
    // list-heavy the way weight 1.25 used to make it.
    expect(new Set(Object.values(SYNTAX_FAMILY_WEIGHTS))).toEqual(new Set([1]))
    // Numbered-list drills are retired from every served run.
    expect(EXCLUDED_SYNTAX_FAMILIES.has("ordered-list")).toBe(true)
  })

  it("schedules a one-syntax code-block lesson as its own family", () => {
    expect(getSyntaxFamily(problem("block", 1, ["code-block"]))).toBe(
      "code-block",
    )
    expect(SYNTAX_FAMILY_WEIGHTS["code-block"]).toBe(
      SYNTAX_FAMILY_WEIGHTS.heading,
    )
  })

  it("retires numbered-list drills and serves every family evenly", () => {
    const counts = new Map<string, number>()

    for (let runNumber = 0; runNumber < 40; runNumber += 1) {
      for (const id of createRunProblemIds("level-1", runNumber, 17).slice(0, 4)) {
        const family = getSyntaxFamily(getProblem(id))!
        counts.set(family, (counts.get(family) ?? 0) + 1)
      }
    }

    // Numbered lists never reach a learner again.
    expect(counts.get("ordered-list") ?? 0).toBe(0)

    // Every eligible family must actually be served. A family that is never
    // selected has a count of zero — the worst kind of imbalance — and would
    // otherwise hide from the spread check below, which only sees the families
    // that did appear.
    const eligibleFamilies = new Set<SyntaxFamily>()
    for (const problem of getProblemsForLevel(1)) {
      const family = getSyntaxFamily(problem)
      if (family && !EXCLUDED_SYNTAX_FAMILIES.has(family)) {
        eligibleFamilies.add(family)
      }
    }
    for (const family of eligibleFamilies) {
      expect(counts.get(family) ?? 0).toBeGreaterThan(0)
    }

    // Bullets used to dominate; now no family is served far more than another.
    // Build the spread from the full eligible set so a missing family counts as
    // zero rather than being silently dropped.
    const served = [...eligibleFamilies].map((family) => counts.get(family) ?? 0)
    expect(Math.max(...served) - Math.min(...served)).toBeLessThanOrEqual(4)

    // The families the old policy suppressed now appear as often as bullets.
    expect(counts.get("unordered-list") ?? 0).toBeLessThanOrEqual(
      (counts.get("inline-code") ?? 0) + 2,
    )
  })

  it("keeps the first two seeded turns free of repeated problems", () => {
    const first = createRunProblemIds("level-1", 0, 17)
    const second = createRunProblemIds("level-1", 1, 17)

    expect(second.every((id) => !first.includes(id))).toBe(true)
  })

  it("is deterministic for a fixed seed and changes the family ordering for a different seed", () => {
    const bank = [
      problem("heading-a", 1, ["heading-h1"]),
      problem("heading-b", 1, ["heading-h1"]),
      problem("quote-a", 1, ["blockquote"]),
      problem("quote-b", 1, ["blockquote"]),
      problem("ordered-a", 1, ["ordered-list"]),
      problem("ordered-b", 1, ["ordered-list"]),
      problem("unordered-a", 1, ["unordered-list"]),
      problem("unordered-b", 1, ["unordered-list"]),
      problem("code-a", 2, ["inline-code"]),
      problem("code-b", 2, ["inline-code"]),
      problem("link-a", 2, ["inline-link"]),
      problem("link-b", 2, ["inline-link"]),
    ]

    const fixed = createTurnProblemIds(1, 0, bank, 17)
    const repeated = createTurnProblemIds(1, 0, bank, 17)
    const different = createTurnProblemIds(1, 0, bank, 18)
    const byId = new Map(bank.map((candidate) => [candidate.id, candidate]))

    expect(repeated).toEqual(fixed)
    expect(different).not.toEqual(fixed)
    expect(different.map((id) => getSyntaxFamily(byId.get(id)!))).not.toEqual(
      fixed.map((id) => getSyntaxFamily(byId.get(id)!)),
    )
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

  it("eventually serves every composite variant for a stable session seed", () => {
    const rebuilds = Array.from({ length: 6 }, (_, familyIndex) =>
      Array.from({ length: 4 }, (_, variantIndex) => ({
        ...problem(
          `rebuild-${familyIndex}-${variantIndex}`,
          2,
          ["heading-h1", `shape-${familyIndex}`],
        ),
        retryFamily: `rebuild-family-${familyIndex}`,
      })),
    ).flat()

    for (const seed of [0, 17, 255]) {
      const seen = new Set<string>()
      for (let turn = 0; turn < 24; turn += 1) {
        for (const id of createTurnProblemIds(2, turn, rebuilds, seed)) {
          seen.add(id)
        }
      }
      expect(seen).toEqual(new Set(rebuilds.map(({ id }) => id)))
    }
  })

  it("rotates the problem variant within each challenge family", () => {
    const bank = [
      problem("h1", 1, ["heading-h1"]),
      problem("b1", 1, ["blockquote"]),
      problem("o1", 1, ["ordered-list"]),
      problem("u1", 1, ["unordered-list"]),
      problem("code-a", 2, ["inline-code"]),
      problem("code-b", 2, ["inline-code"]),
      problem("link-a", 2, ["inline-link"]),
      problem("link-b", 2, ["inline-link"]),
    ]

    const first = createTurnProblemIds(1, 0, bank).slice(4)
    const second = createTurnProblemIds(1, 1, bank).slice(4)

    expect(new Set(first)).not.toEqual(new Set(second))
    expect(second).not.toContain(first[0])
    expect(second).not.toContain(first[1])
  })

  it("serves non-overlapping pairs from one four-item challenge family", () => {
    const bank = [
      ...Array.from({ length: 4 }, (_, index) =>
        problem(`level-four-${index}`, 4, ["document-shape", `part-${index}`]),
      ),
      ...Array.from({ length: 4 }, (_, index) =>
        problem(`work-order-${index}`, 5, ["agent-work-order", "shared-shape"]),
      ),
    ]

    const first = createTurnProblemIds(4, 0, bank).slice(4)
    const second = createTurnProblemIds(4, 1, bank).slice(4)

    expect(first).toHaveLength(2)
    expect(second).toHaveLength(2)
    expect(second.every((id) => !first.includes(id))).toBe(true)
  })

  it("rotates a four-item Level 5 bank between turns", () => {
    const bank = Array.from({ length: 4 }, (_, index) =>
      problem(`work-order-${index}`, 5, [`document-shape-${index}`]),
    )

    expect(createTurnProblemIds(5, 1, bank)).not.toEqual(
      createTurnProblemIds(5, 0, bank),
    )
  })
})
