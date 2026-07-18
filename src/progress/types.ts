import type { EntryId } from "../content/entryChoices"

export type ProgressV3 = {
  version: 3
  bankRevision: string
  entryId: EntryId | null
  runNumber: number
  runProblemIds: string[]
  runStepIndex: number
  currentProblemId: string
  draftByProblemId: Record<string, string>
  completedProblemIds: string[]
  recentProblemIds: string[]
  pendingTransferFamily: string | null
  currentIsTransfer: boolean
}
