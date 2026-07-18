import type { NormalizedProblem } from "../content/types"

type TransferSelection = {
  problems: readonly NormalizedProblem[]
  currentProblemId: string
  retryFamily: NormalizedProblem["retryFamily"]
  recentProblemIds: readonly string[]
}

export function selectTransferProblem({
  problems,
  currentProblemId,
  retryFamily,
  recentProblemIds,
}: TransferSelection): NormalizedProblem {
  const currentProblem = problems.find(
    (problem) => problem.id === currentProblemId,
  )
  if (!currentProblem) {
    throw new Error(`Unknown current problem: ${currentProblemId}`)
  }

  const recentIds = new Set(recentProblemIds)
  const candidates = problems.filter(
    (problem) =>
      problem.level === currentProblem.level &&
      problem.flavor === currentProblem.flavor &&
      problem.retryFamily === retryFamily &&
      problem.id !== currentProblemId &&
      problem.contentVariant !== currentProblem.contentVariant,
  )

  const selected =
    candidates.find((problem) => !recentIds.has(problem.id)) ?? candidates.at(0)

  if (!selected) {
    throw new Error(`No safe transfer problem for ${retryFamily}`)
  }

  return selected
}
