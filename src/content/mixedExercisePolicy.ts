import type { NormalizedProblem } from "./types"
import {
  deriveSyntaxCheckpoints,
  syntaxCheckpointTerms,
} from "../guided/guidedSyntax"
import { parseMarkdownSource } from "../markdown/parser"

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
  const checkpoints = deriveSyntaxCheckpoints(
    problem.target,
    problem.starterText,
  )
  const termsByCheckpoint = checkpoints.map(syntaxCheckpointTerms)
  const listRanges: { from: number; to: number; identity: number }[] = []
  let nextListIdentity = 0
  const visit = (node: {
    type?: string
    children?: readonly unknown[]
    position?: { start?: { offset?: number }; end?: { offset?: number } }
  }) => {
    if (node.type === "list") {
      const from = node.position?.start?.offset
      const to = node.position?.end?.offset
      if (from !== undefined && to !== undefined) {
        listRanges.push({ from, to, identity: nextListIdentity })
        nextListIdentity += 1
      }
    }
    for (const child of node.children ?? []) {
      visit(child as Parameters<typeof visit>[0])
    }
  }
  visit(parseMarkdownSource(problem.target))
  const listIdentityByCheckpoint = checkpoints.map((checkpoint) =>
    listRanges
      .filter(
        (range) =>
          range.from <= checkpoint.activeOffset &&
          checkpoint.activeOffset < range.to,
      )
      .sort((left, right) => left.to - left.from - (right.to - right.from))[0]
      ?.identity ?? null,
  )
  const indexesByTerm = new Map<string, number[]>()

  for (const [index, terms] of termsByCheckpoint.entries()) {
    for (const term of terms) {
      const indexes = indexesByTerm.get(term) ?? []
      indexes.push(index)
      indexesByTerm.set(term, indexes)
    }
  }

  return [...indexesByTerm.entries()].some(([term, indexes]) =>
    indexes.some((value, index) => {
      if (index === 0) return false
      const previous = indexes[index - 1]!
      if (value - previous <= 1) return false

      // #177 turns one list line containing inline code into two lessons.
      // In a single parsed list, that can make the list-marker card appear on
      // both sides of the code card. It is still one list structure, not the
      // separated repeat this policy excludes; only the newly isolated inline
      // code may bridge the two marker cards. Every other gap stays forbidden.
      const splitListBridge =
        (term === "bullet item" || term === "numbered step") &&
        listIdentityByCheckpoint[previous] !== null &&
        listIdentityByCheckpoint[previous] === listIdentityByCheckpoint[value] &&
        checkpoints
          .slice(previous + 1, value)
          .every((checkpoint) => checkpoint.syntaxFamily === "inlineCode")
      return !splitListBridge
    }),
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
