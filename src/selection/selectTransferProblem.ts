import type { Problem } from "../content/types"

type TransferSelection = {
  problems: readonly Problem[]
  currentProblemId: string
  retryFamily: Problem["retryFamily"]
  recentProblemIds: readonly string[]
}

export function selectTransferProblem({
  problems,
  currentProblemId,
  retryFamily,
  recentProblemIds,
}: TransferSelection): Problem {
  const currentProblem = problems.find(
    (problem) => problem.id === currentProblemId,
  )
  const currentProtectedText = currentProblem?.protectedContent.at(0)
  const recentIds = new Set(recentProblemIds)
  const candidates = problems.filter(
    (problem) =>
      problem.retryFamily === retryFamily &&
      problem.id !== currentProblemId &&
      problem.protectedContent.at(0) !== currentProtectedText,
  )

  const selected =
    candidates.find((problem) => !recentIds.has(problem.id)) ??
    candidates.at(0)

  if (!selected) {
    throw new Error(`No safe transfer problem for ${retryFamily}`)
  }

  return selected
}
