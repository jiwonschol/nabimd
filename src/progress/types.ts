export type ProgressV1 = {
  version: 1
  currentProblemId: string
  draftByProblemId: Record<string, string>
  completedProblemIds: string[]
  recentProblemIds: string[]
  pendingTransferFamily: "heading-h1" | null
  currentIsTransfer: boolean
}
