import type { EntryId } from "../content/entryChoices"

export type ProgressV5 = {
  version: 5
  bankRevision: string
  entryId: EntryId | null
  runNumber: number
  runProblemIds: string[]
  runStepIndex: number
  scheduledStepIndex: number
  currentProblemId: string
  draftByProblemId: Record<string, string>
  completedProblemIds: string[]
  recentProblemIds: string[]
  pendingTransferFamily: string | null
  currentIsTransfer: boolean
  failedScheduledStepIndexes: number[]
  failedProblemIds: string[]
  runStartedAtMs: number | null
  runCompletedAtMs: number | null
}
