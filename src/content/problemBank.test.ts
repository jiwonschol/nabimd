import { describe, expect, it } from "vitest"
import { level12SeedFixtures } from "./level12SeedProblems"
import { level35SeedFixtures } from "./level35SeedProblems"
import {
  getProblem,
  getProblemsForLevel,
  problemBank,
  problemBankRevision,
} from "./problemBank"
import { validateProblemBank } from "./validateProblemBank"

describe("compiled five-level problem bank", () => {
  it("publishes four inspected seed problems at every level", () => {
    expect(problemBank).toHaveLength(20)
    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(getProblemsForLevel(level)).toHaveLength(4)
    }
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
      ]),
    ).toEqual([])
  })
})
