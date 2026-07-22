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
 * finish in one to three minutes. If a future batch publishes an over-length
 * problem, this gate fails CI before the app can serve it.
 */
describe("runtime problem budgets", () => {
  it("serves only problems within the per-level target budgets", () => {
    const violations = problemBank
      .filter((problem) => !withinRuntimeBudget(problem))
      .map((problem) => problem.id)
    expect(violations).toEqual([])
  })

  it("keeps upper levels at compact miniature scale", () => {
    for (const problem of problemBank) {
      if (problem.level < 4) continue
      const lines = problem.target.split("\n").length
      const words = problem.target.split(/\s+/).filter(Boolean).length
      expect(lines, problem.id).toBeLessThanOrEqual(20)
      expect(words, problem.id).toBeLessThanOrEqual(120)
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

  it("keeps the retired document-length problems out of runtime", () => {
    const servedIds = new Set(problemBank.map((problem) => problem.id))
    const retired = [
      "l4-api-field-deprecation-migration",
      "l4-audit-archive-contract-spec",
      "l4-cache-namespace-migration",
      "l4-contact-import-contract-spec",
      "l4-support-webhook-contract-spec",
      "l4-customer-digest-contract-spec",
      "l4-project-archive-spec",
    ]
    for (const id of retired) {
      expect(servedIds.has(id), id).toBe(false)
    }
  })

  it("documents the budget table this gate enforces", () => {
    expect(RUNTIME_TARGET_BUDGETS).toEqual({
      1: { maxLines: 5 },
      2: { maxLines: 14 },
      3: { maxLines: 28 },
      4: { maxLines: 20, maxWords: 120 },
      5: { maxLines: 20, maxWords: 120 },
    })
  })
})
