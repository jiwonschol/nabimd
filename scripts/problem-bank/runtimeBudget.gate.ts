import { describe, expect, it } from "vitest"
import {
  countRuntimeTargetContentLines,
  problemBank,
  getProblemsForAuthoringLevel,
  RUNTIME_TARGET_BUDGETS,
  withinRuntimeBudget,
} from "../../src/content/problemBank"
import { curriculumLevels } from "../../src/content/curriculumLevels"
import {
  getCurriculumElements,
  getProblemEntryId,
} from "../../src/content/curriculumElements"
import { AUTHORING_LEVELS } from "../../src/content/types"
import { RUN_POLICY } from "../../src/selection/runPolicy"

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

  it("keeps every served exercise within its curriculum-owner line ceiling", () => {
    for (const problem of problemBank) {
      const entryId = getProblemEntryId(problem)
      const entry = curriculumLevels.find(
        (candidate) => candidate.id === entryId,
      )
      if (!entry) throw new Error(`Missing curriculum owner for ${problem.id}`)
      const budget = RUNTIME_TARGET_BUDGETS[entry.curriculumLevel]
      const isMixed = getCurriculumElements(problem).length > 1
      const lines = isMixed
        ? countRuntimeTargetContentLines(problem.target)
        : problem.target.split("\n").length
      const ceiling = isMixed ? budget.maxContentLines : budget.maxLines
      if (ceiling === undefined) {
        throw new Error(`Missing mixed-document budget for ${problem.id}`)
      }
      expect(lines, problem.id).toBeLessThanOrEqual(ceiling)
    }
  })

  it("keeps every level deep enough for two rotated turns", () => {
    for (const authoringLevel of AUTHORING_LEVELS) {
      expect(
        getProblemsForAuthoringLevel(authoringLevel).length,
        `authoring level ${authoringLevel}`,
      ).toBeGreaterThanOrEqual(RUN_POLICY.turnSize * 2)
    }
  })

  it("documents the budget table this gate enforces", () => {
    expect(RUNTIME_TARGET_BUDGETS).toEqual({
      1: { maxLines: 5, maxContentLines: 12 },
      2: { maxLines: 14, maxContentLines: 14 },
      3: { maxLines: 28, maxContentLines: 28 },
    })
  })
})
