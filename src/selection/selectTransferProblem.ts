import type { NormalizedProblem } from "../content/types"

type TransferSelection = {
  problems: readonly NormalizedProblem[]
  currentProblemId: string
  retryFamily: NormalizedProblem["retryFamily"]
  recentProblemIds: readonly string[]
}

type TransferProblem = Pick<
  NormalizedProblem,
  "id" | "level" | "flavor" | "retryFamily" | "contentVariant"
>

export function isEligibleTransferProblem(
  currentProblem: TransferProblem,
  candidate: TransferProblem,
  retryFamily: NormalizedProblem["retryFamily"],
): boolean {
  return (
    candidate.level === currentProblem.level &&
    candidate.flavor === currentProblem.flavor &&
    candidate.retryFamily === retryFamily &&
    candidate.id !== currentProblem.id &&
    candidate.contentVariant !== currentProblem.contentVariant
  )
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
  const candidates = problems.filter((problem) =>
    isEligibleTransferProblem(currentProblem, problem, retryFamily),
  )

  const selected =
    candidates.find((problem) => !recentIds.has(problem.id)) ?? candidates.at(0)

  if (!selected) {
    throw new Error(`No safe transfer problem for ${retryFamily}`)
  }

  return selected
}
