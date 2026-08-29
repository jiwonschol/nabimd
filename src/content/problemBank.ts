import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import { derivePlaintextStarter } from "./plaintextStarter"
import {
  RUNTIME_BUDGET_REVISION,
  withinRuntimeBudget,
} from "./runtimeBudget"
import {
  AUTHORING_LEVELS,
  type AuthoringLevel,
  type NormalizedProblem,
} from "./types"

if (runtimeProjections.schemaVersion !== 2) {
  throw new Error("The compiled problem bank must use schema version 2")
}

const publishedLevels = runtimeProjections.levels as unknown as Record<
  `${AuthoringLevel}`,
  readonly NormalizedProblem[]
>

export {
  countRuntimeTargetContentLines,
  RUNTIME_TARGET_BUDGETS,
  withinRuntimeBudget,
} from "./runtimeBudget"

const publishedProblems = AUTHORING_LEVELS.flatMap(
  (authoringLevel) =>
    publishedLevels[String(authoringLevel) as `${AuthoringLevel}`] ?? [],
)
export const publishedProblemIds = publishedProblems.map(
  (problem) => problem.id,
)

const compiledProblems = publishedProblems
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
  `runtime-budget@curriculum-owner-${RUNTIME_BUDGET_REVISION}`,
  `starter-projection@${STARTER_PROJECTION_REVISION}`,
].join("|")

// The last runtime before levels became syntax chapters filtered Level 4–5
// at 20 lines / 120 words. Keep its exact revision derivable from immutable
// published problems so the one-way progress migration does not depend on a
// hand-copied hash or accept unrelated stale records.
export const preChapterProblemBankRevision = [
  publishedProblems
    .filter((problem) => {
      const authoringLevel = problem.level
      if (authoringLevel < 4) return true
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

export function getProblemsForAuthoringLevel(
  authoringLevel: AuthoringLevel,
): readonly NormalizedProblem[] {
  return problemBank.filter((problem) => {
    const problemAuthoringLevel = problem.level
    return (
      problemAuthoringLevel === authoringLevel && problem.flavor === "standard"
    )
  })
}
