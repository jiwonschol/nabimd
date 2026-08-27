import { describe, expect, it } from "vitest"
import {
  problemBank,
  getProblemsForLevel,
  RUNTIME_TARGET_BUDGETS,
  withinRuntimeBudget,
} from "../../src/content/problemBank"
import { CURRICULUM_LEVELS } from "../../src/content/types"

/**
 * Deterministic guard for the 2026-07-22 practice redesign: whatever the
 * published evidence contains, runtime may only serve problems a learner can
 * finish in a short practice turn. If a future batch publishes an over-length
 * problem, this gate fails CI before the app can serve it.
 */
describe("runtime problem budgets", () => {
  it("serves only problems within the per-level target budgets", () => {
    const violations = problemBank
      .filter((problem) => !withinRuntimeBudget(problem))
      .map((problem) => problem.id)
    expect(violations).toEqual([])
  })

  it("keeps upper chapters within the reviewed restoration ceiling", () => {
    for (const problem of problemBank) {
      if (problem.level < 4) continue
      const lines = problem.target.split("\n").length
      const words = problem.target.split(/\s+/).filter(Boolean).length
      expect(lines, problem.id).toBeLessThanOrEqual(40)
      expect(words, problem.id).toBeLessThanOrEqual(165)
    }
  })

  it("keeps every level deep enough for rotated six-problem turns", () => {
    for (const level of CURRICULUM_LEVELS) {
      expect(
        getProblemsForLevel(level).length,
        `level ${level}`,
      ).toBeGreaterThanOrEqual(12)
    }
  })

  it("documents the budget table this gate enforces", () => {
    expect(RUNTIME_TARGET_BUDGETS).toEqual({
      1: { maxLines: 5 },
      2: { maxLines: 14 },
      3: { maxLines: 28 },
      4: { maxLines: 40, maxWords: 165 },
      5: { maxLines: 40, maxWords: 165 },
    })
  })
})
