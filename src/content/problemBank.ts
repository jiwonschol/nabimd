import { level12SeedProblems } from "./level12SeedProblems"
import { level35SeedProblems } from "./level35SeedProblems"
import type { CurriculumLevel, NormalizedProblem } from "./types"

const compiledProblems = [
  ...level12SeedProblems,
  ...level35SeedProblems,
] satisfies readonly NormalizedProblem[]

if (!compiledProblems[0]) {
  throw new Error("The compiled problem bank must not be empty")
}

export const problemBank: readonly [
  NormalizedProblem,
  ...NormalizedProblem[],
] = [compiledProblems[0], ...compiledProblems.slice(1)]

export const problemBankRevision = problemBank
  .map((problem) => `${problem.id}@${problem.revision}`)
  .join("|")

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
