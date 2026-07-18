import type { EntryId } from "../content/entryChoices"

export type ProgressV2 = {
  version: 2
  entryId: EntryId | null
  runNumber: number
  runProblemIds: string[]
  runStepIndex: number
  currentProblemId: string
  draftByProblemId: Record<string, string>
  completedProblemIds: string[]
  recentProblemIds: string[]
  pendingTransferFamily: "heading-h1" | null
  currentIsTransfer: boolean
}
