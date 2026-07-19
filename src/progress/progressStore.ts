import {
  createRunProblemIds,
  isEntryId,
} from "../content/entryChoices"
import { problemBankRevision } from "../content/problemBank"
import { isReachableRunSchedule } from "../session/runSchedule"
import type { ProgressV4 } from "./types"

export const PROGRESS_STORAGE_KEY = "nabimd.progress.v4"
// A browser session cannot legitimately reach this many six-problem turns.
// Cap untrusted storage before deterministic schedule reconstruction.
export const MAX_PERSISTED_RUN_NUMBER = 10_000

export function createDefaultProgress(
  currentProblemId: string,
  bankRevision = problemBankRevision,
): ProgressV4 {
  return {
    version: 4,
    bankRevision,
    entryId: null,
    runNumber: 0,
    runProblemIds: [],
    runStepIndex: 0,
    currentProblemId,
    draftByProblemId: {},
    completedProblemIds: [],
    recentProblemIds: [],
    pendingTransferFamily: null,
    currentIsTransfer: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isKnownIdList(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  maximumLength = validProblemIds.size,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximumLength &&
    value.every(
      (item) => typeof item === "string" && validProblemIds.has(item),
    )
  )
}

function isValidDraftRecord(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([problemId, draft]) =>
        validProblemIds.has(problemId) && typeof draft === "string",
    )
  )
}

function isValidRunProblemIds(
  value: unknown,
  entryId: ProgressV4["entryId"],
  runNumber: number,
  runStepIndex: number,
  currentIsTransfer: boolean,
  validProblemIds: ReadonlySet<string>,
  isEligibleTransferProblem: (
    currentProblemId: string,
    candidateProblemId: string,
  ) => boolean,
): value is string[] {
  if (!Array.isArray(value)) return false
  if (entryId === null) return value.length === 0

  const expectedRunProblemIds = createRunProblemIds(entryId, runNumber)
  const maximumRunLength = expectedRunProblemIds.length * 2

  return (
    value.length >= expectedRunProblemIds.length &&
    isKnownIdList(value, validProblemIds, maximumRunLength) &&
    isReachableRunSchedule({
      baselineProblemIds: expectedRunProblemIds,
      persistedProblemIds: value,
      persistedStepIndex: runStepIndex,
      persistedCurrentIsTransfer: currentIsTransfer,
      isEligibleTransferProblem,
    })
  )
}

function isProgressV4(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  isEligibleTransferProblem: (
    currentProblemId: string,
    candidateProblemId: string,
  ) => boolean,
  expectedBankRevision: string,
): value is ProgressV4 {
  if (!isRecord(value)) return false

  return (
    value.version === 4 &&
    value.bankRevision === expectedBankRevision &&
    (value.entryId === null || isEntryId(value.entryId)) &&
    typeof value.runNumber === "number" &&
    Number.isSafeInteger(value.runNumber) &&
    value.runNumber >= 0 &&
    value.runNumber <= MAX_PERSISTED_RUN_NUMBER &&
    typeof value.runStepIndex === "number" &&
    Number.isSafeInteger(value.runStepIndex) &&
    value.runStepIndex >= 0 &&
    typeof value.currentIsTransfer === "boolean" &&
    isValidRunProblemIds(
      value.runProblemIds,
      value.entryId,
      value.runNumber,
      value.runStepIndex,
      value.currentIsTransfer,
      validProblemIds,
      isEligibleTransferProblem,
    ) &&
    value.runStepIndex <= value.runProblemIds.length &&
    typeof value.currentProblemId === "string" &&
    validProblemIds.has(value.currentProblemId) &&
    isValidDraftRecord(value.draftByProblemId, validProblemIds) &&
    isKnownIdList(value.completedProblemIds, validProblemIds) &&
    isKnownIdList(value.recentProblemIds, validProblemIds) &&
    (value.pendingTransferFamily === null ||
      typeof value.pendingTransferFamily === "string") &&
    (value.entryId === null
      ? value.runProblemIds.length === 0 && value.runStepIndex === 0
      : value.runProblemIds.length > 0 &&
        value.runProblemIds[
          Math.min(value.runStepIndex, value.runProblemIds.length - 1)
        ] === value.currentProblemId)
  )
}

function cloneProgress(progress: ProgressV4): ProgressV4 {
  return {
    ...progress,
    draftByProblemId: { ...progress.draftByProblemId },
    runProblemIds: [...progress.runProblemIds],
    completedProblemIds: [...progress.completedProblemIds],
    recentProblemIds: [...progress.recentProblemIds],
  }
}

export function loadProgress(
  storage: Storage,
  validProblemIds: ReadonlySet<string>,
  isEligibleTransferProblem: (
    currentProblemId: string,
    candidateProblemId: string,
  ) => boolean = () => false,
  expectedBankRevision = problemBankRevision,
): ProgressV4 {
  const firstProblemId = validProblemIds.values().next().value
  const fallback = createDefaultProgress(
    firstProblemId ?? "l1-heading-apple",
    expectedBankRevision,
  )

  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return fallback

    const parsed: unknown = JSON.parse(saved)
    return isProgressV4(
      parsed,
      validProblemIds,
      isEligibleTransferProblem,
      expectedBankRevision,
    )
      ? cloneProgress(parsed)
      : fallback
  } catch {
    return fallback
  }
}

export function saveProgress(storage: Storage, progress: ProgressV4): void {
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Progress persistence is optional when browser storage is unavailable.
  }
}

export function clearProgress(storage: Storage): void {
  try {
    storage.removeItem(PROGRESS_STORAGE_KEY)
  } catch {
    // The in-memory session is still reset even if persisted data remains.
  }
}
