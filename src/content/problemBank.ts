import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import { derivePlaintextStarter } from "./plaintextStarter"
import {
  CURRICULUM_LEVELS,
  type CurriculumLevel,
  type NormalizedProblem,
} from "./types"

if (runtimeProjections.schemaVersion !== 2) {
  throw new Error("The compiled problem bank must use schema version 2")
}

const publishedLevels = runtimeProjections.levels as unknown as Record<
  `${CurriculumLevel}`,
  readonly NormalizedProblem[]
>

/**
 * Per-level ceilings for what practice may serve. Published batches stay
 * immutable evidence; problems over these budgets are retired from runtime
 * only (2026-07-22 direction: every level practices Markdown syntax in
 * one-to-three minutes — never document-length typing).
 */
export const RUNTIME_TARGET_BUDGETS: Readonly<
  Record<CurriculumLevel, { maxLines: number; maxWords?: number }>
> = {
  1: { maxLines: 5 },
  2: { maxLines: 14 },
  3: { maxLines: 28 },
  4: { maxLines: 40, maxWords: 165 },
  5: { maxLines: 40, maxWords: 165 },
}

export function withinRuntimeBudget(
  problem: Pick<NormalizedProblem, "level" | "target">,
): boolean {
  const budget = RUNTIME_TARGET_BUDGETS[problem.level]
  if (problem.target.split("\n").length > budget.maxLines) return false
  if (budget.maxWords === undefined) return true
  const words = problem.target.split(/\s+/).filter(Boolean).length
  return words <= budget.maxWords
}

const compiledProblems = CURRICULUM_LEVELS.flatMap(
  (level) => publishedLevels[String(level) as `${CurriculumLevel}`] ?? [],
)
  .filter(withinRuntimeBudget)
  .map(
    (problem): NormalizedProblem => ({
      ...problem,
      starterText: derivePlaintextStarter(problem.target),
    }),
  )

if (!compiledProblems[0]) {
  throw new Error("The compiled problem bank must not be empty")
}

export const problemBank: readonly [
  NormalizedProblem,
  ...NormalizedProblem[],
] = [compiledProblems[0], ...compiledProblems.slice(1)]

export const preStarterProjectionProblemBankRevision = problemBank
  .map((problem) => `${problem.id}@${problem.revision}`)
  .join("|")

export const flattenedStarterProjectionProblemBankRevision = [
  preStarterProjectionProblemBankRevision,
  "starter-projection@1",
].join("|")

export const STARTER_PROJECTION_REVISION = 2
export const problemBankRevision = [
  preStarterProjectionProblemBankRevision,
  `starter-projection@${STARTER_PROJECTION_REVISION}`,
].join("|")

// The last runtime before levels became syntax chapters filtered Level 4–5
// at 20 lines / 120 words. Keep its exact revision derivable from immutable
// published problems so the one-way progress migration does not depend on a
// hand-copied hash or accept unrelated stale records.
export const preChapterProblemBankRevision = [
  problemBank
    .filter((problem) => {
      if (problem.level < 4) return true
      const lines = problem.target.split("\n").length
      const words = problem.target.split(/\s+/).filter(Boolean).length
      return lines <= 20 && words <= 120
    })
    .map((problem) => `${problem.id}@${problem.revision}`)
    .join("|"),
  `starter-projection@${STARTER_PROJECTION_REVISION}`,
].join("|")

export function getProblem(id: string): NormalizedProblem {
  const problem = problemBank.find((candidate) => candidate.id === id)
  if (!problem) throw new Error(`Unknown problem: ${id}`)
  return problem
}

export function getProblemsForLevel(
  level: CurriculumLevel,
): readonly NormalizedProblem[] {
  return problemBank.filter(
    (problem) => problem.level === level && problem.flavor === "standard",
  )
}
