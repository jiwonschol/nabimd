import { describe, expect, it } from "vitest"
import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import { emphasisBatch003Fixtures } from "./batches/emphasisBatch003Fixtures"
import { headingBatch002Fixtures } from "./batches/headingBatch002Fixtures"
import { listBatch004Fixtures } from "./batches/listBatch004Fixtures"
import { orderedListBatch005Fixtures } from "./batches/orderedListBatch005Fixtures"
import { level12SeedFixtures } from "./level12SeedFixtures"
import { level35SeedFixtures } from "./level35SeedFixtures"
import {
  getProblem,
  getProblemsForLevel,
  problemBank,
  problemBankRevision,
} from "./problemBank"
import { validateProblemBank } from "./validateProblemBank"

describe("compiled five-level problem bank", () => {
  it("publishes the accepted foundation, heading, emphasis, bullet-list, and ordered-list expansions", () => {
    expect(problemBank).toHaveLength(116)
    expect(getProblemsForLevel(1)).toHaveLength(52)
    expect(getProblemsForLevel(2)).toHaveLength(52)
    for (const level of [3, 4, 5] as const) {
      expect(getProblemsForLevel(level)).toHaveLength(4)
    }
  })

  it("executes the generated runtime projection without a parallel source list", () => {
    expect(problemBank).toEqual([
      ...runtimeProjections.levels[1],
      ...runtimeProjections.levels[2],
      ...runtimeProjections.levels[3],
      ...runtimeProjections.levels[4],
      ...runtimeProjections.levels[5],
    ])
  })

  it("has a deterministic revision and lookup", () => {
    expect(problemBankRevision).toContain("l1-")
    expect(problemBankRevision).toContain("l5-")
    expect(getProblem(problemBank[0].id)).toBe(problemBank[0])
    expect(() => getProblem("missing-problem")).toThrow("Unknown problem")
  })

  it("passes the schema-v2 bank and fixture contract", () => {
    expect(
      validateProblemBank(problemBank, [
        ...level12SeedFixtures,
        ...level35SeedFixtures,
        ...headingBatch002Fixtures,
        ...emphasisBatch003Fixtures,
        ...listBatch004Fixtures,
        ...orderedListBatch005Fixtures,
      ]),
    ).toEqual([])
  })
})
