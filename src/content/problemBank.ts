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

const compiledProblems = CURRICULUM_LEVELS.flatMap(
  (level) => publishedLevels[String(level) as `${CurriculumLevel}`] ?? [],
).map(
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

const STARTER_PROJECTION_REVISION = 1

export const problemBankRevision =
  `${preStarterProjectionProblemBankRevision}|starter-projection@${STARTER_PROJECTION_REVISION}`

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
