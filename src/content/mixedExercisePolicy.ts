import type { NormalizedProblem } from "./types"
import {
  deriveSyntaxCheckpoints,
  syntaxCheckpointTerms,
} from "../guided/guidedSyntax"

export const MIXED_EXERCISE_POLICY = {
  maxCheckpoints: 5,
  separatedSyntaxRepeats: "forbid",
} as const

type MixedExerciseSource = Pick<
  NormalizedProblem,
  "target" | "starterText"
>

export function hasSeparatedSyntaxRepeat(
  problem: MixedExerciseSource,
): boolean {
  const termsByCheckpoint = deriveSyntaxCheckpoints(
    problem.target,
    problem.starterText,
  ).map(syntaxCheckpointTerms)
  const indexesByTerm = new Map<string, number[]>()

  for (const [index, terms] of termsByCheckpoint.entries()) {
    for (const term of terms) {
      const indexes = indexesByTerm.get(term) ?? []
      indexes.push(index)
      indexesByTerm.set(term, indexes)
    }
  }

  return [...indexesByTerm.values()].some((indexes) =>
    indexes.some(
      (value, index) => index > 0 && value - indexes[index - 1]! > 1,
    ),
  )
}

export function isEligibleMixedExercise(
  problem: MixedExerciseSource,
): boolean {
  const checkpoints = deriveSyntaxCheckpoints(
    problem.target,
    problem.starterText,
  )
  return (
    checkpoints.length > 0 &&
    checkpoints.length <= MIXED_EXERCISE_POLICY.maxCheckpoints &&
    !hasSeparatedSyntaxRepeat(problem)
  )
}
