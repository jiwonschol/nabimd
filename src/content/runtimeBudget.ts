import { curriculumLevels } from "./curriculumLevels"
import {
  getCurriculumElements,
  getProblemEntryId,
} from "./curriculumElements"
import type { NormalizedProblem } from "./types"

/**
 * Curriculum-owner ceilings for what practice may serve. Published batches
 * stay immutable evidence; problems over these budgets are retired from
 * runtime only (2026-07-22 direction: every level practices Markdown syntax in
 * one-to-three minutes — never document-length typing).
 */
export const RUNTIME_TARGET_BUDGETS: Readonly<
  Record<
    (typeof curriculumLevels)[number]["curriculumLevel"],
    {
      /** Physical source lines, including Markdown separator lines. */
      maxLines: number
      /** Non-empty source lines, used only for mixed-document practice. */
      maxContentLines?: number
      maxWords?: number
    }
  >
> = {
  1: { maxLines: 5, maxContentLines: 12 },
  2: { maxLines: 14, maxContentLines: 14 },
  3: { maxLines: 28, maxContentLines: 28 },
}

export const RUNTIME_BUDGET_REVISION = 1

export function countRuntimeTargetContentLines(target: string): number {
  return target
    .split("\n")
    .filter((line) => line.trim().length > 0).length
}

export function withinRuntimeBudget(
  problem: Pick<
    NormalizedProblem,
    "skillIds" | "syntaxTokens" | "target"
  >,
): boolean {
  const entryId = getProblemEntryId(problem)
  const entry = curriculumLevels.find((candidate) => candidate.id === entryId)
  if (!entry) return false
  const budget = RUNTIME_TARGET_BUDGETS[entry.curriculumLevel]
  const isMixed = getCurriculumElements(problem).length > 1
  const lineCount =
    isMixed && budget.maxContentLines !== undefined
      ? countRuntimeTargetContentLines(problem.target)
      : problem.target.split("\n").length
  const maxLines =
    isMixed && budget.maxContentLines !== undefined
      ? budget.maxContentLines
      : budget.maxLines
  if (lineCount > maxLines) return false
  if (budget.maxWords === undefined) return true
  const words = problem.target.split(/\s+/).filter(Boolean).length
  return words <= budget.maxWords
}
