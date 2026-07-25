import type { EntryId } from "../content/entryChoices"
import type { SyntaxMistake } from "../guided/guidedSyntax"

export type ProgressV5 = {
  version: 5
  bankRevision: string
  entryId: EntryId | null
  runNumber: number
  runSeed: number
  runProblemIds: string[]
  runStepIndex: number
  scheduledStepIndex: number
  currentProblemId: string
  draftByProblemId: Record<string, string>
  completedProblemIds: string[]
  recentProblemIds: string[]
  pendingTransferFamily: string | null
  pendingSlotRetryProblemId: string | null
  currentIsTransfer: boolean
  failedScheduledStepIndexes: number[]
  failedProblemIds: string[]
  syntaxMistakes: SyntaxMistake[]
  runStartedAtMs: number | null
  runCompletedAtMs: number | null
}
