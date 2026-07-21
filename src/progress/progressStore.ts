import {
  createRunProblemIds,
  isEntryId,
} from "../content/entryChoices"
import {
  getProblem,
  preStarterProjectionProblemBankRevision,
  problemBankRevision,
} from "../content/problemBank"
import { deriveLegacyPlaintextStarter } from "../content/plaintextStarter"
import { isReachableRunSchedule } from "../session/runSchedule"
import type { ProgressV5 } from "./types"

export const PROGRESS_STORAGE_KEY = "nabimd.progress.v5"
// A browser session cannot legitimately reach this many six-problem turns.
// Cap untrusted storage before deterministic schedule reconstruction.
export const MAX_PERSISTED_RUN_NUMBER = 10_000

export function createDefaultProgress(
  currentProblemId: string,
  bankRevision = problemBankRevision,
  runSeed = 0,
): ProgressV5 {
  return {
    version: 5,
    bankRevision,
    entryId: null,
    runNumber: 0,
    runSeed,
    runProblemIds: [],
    runStepIndex: 0,
    scheduledStepIndex: 0,
    currentProblemId,
    draftByProblemId: {},
    completedProblemIds: [],
    recentProblemIds: [],
    pendingTransferFamily: null,
    currentIsTransfer: false,
    failedScheduledStepIndexes: [],
    failedProblemIds: [],
    runStartedAtMs: null,
    runCompletedAtMs: null,
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
  entryId: ProgressV5["entryId"],
  runNumber: number,
  runSeed: number,
  runStepIndex: number,
  scheduledStepIndex: number,
  currentIsTransfer: boolean,
  validProblemIds: ReadonlySet<string>,
  isEligibleTransferProblem: (
    currentProblemId: string,
    candidateProblemId: string,
  ) => boolean,
): value is string[] {
  if (!Array.isArray(value)) return false
  if (entryId === null) return value.length === 0

  const expectedRunProblemIds = createRunProblemIds(entryId, runNumber, runSeed)
  const maximumRunLength = expectedRunProblemIds.length * 2

  return (
    value.length >= expectedRunProblemIds.length &&
    isKnownIdList(value, validProblemIds, maximumRunLength) &&
    isReachableRunSchedule({
      baselineProblemIds: expectedRunProblemIds,
      persistedProblemIds: value,
      persistedStepIndex: runStepIndex,
      persistedScheduledStepIndex: scheduledStepIndex,
      persistedCurrentIsTransfer: currentIsTransfer,
      isEligibleTransferProblem,
    })
  )
}

function isNonnegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
}

function isUniqueIntegerList(
  value: unknown,
  upperExclusive: number,
): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= upperExclusive &&
    new Set(value).size === value.length &&
    value.every(
      (item) =>
        isNonnegativeSafeInteger(item) && item < upperExclusive,
    )
  )
}

function isUniqueKnownIdList(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  maximumLength: number,
): value is string[] {
  return (
    isKnownIdList(value, validProblemIds, maximumLength) &&
    new Set(value).size === value.length
  )
}

function isProgressV5(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  isEligibleTransferProblem: (
    currentProblemId: string,
    candidateProblemId: string,
  ) => boolean,
  expectedBankRevision: string,
  expectedRunSeed: number,
): value is ProgressV5 {
  if (!isRecord(value)) return false

  if (
    value.version !== 5 ||
    value.bankRevision !== expectedBankRevision ||
    (value.entryId !== null && !isEntryId(value.entryId)) ||
    !isNonnegativeSafeInteger(value.runNumber) ||
    !isNonnegativeSafeInteger(value.runSeed) ||
    value.runSeed !== expectedRunSeed ||
    value.runNumber > MAX_PERSISTED_RUN_NUMBER ||
    !isNonnegativeSafeInteger(value.runStepIndex) ||
    typeof value.currentIsTransfer !== "boolean"
  ) {
    return false
  }

  const entryId = value.entryId
  const scheduledRunLength =
    entryId === null
      ? 0
      : createRunProblemIds(entryId, value.runNumber, value.runSeed).length
  const activeRun = entryId !== null
  const scheduledStepIndex = isNonnegativeSafeInteger(value.scheduledStepIndex)
    ? value.scheduledStepIndex
    : null
  const startedAtMs = isNonnegativeSafeInteger(value.runStartedAtMs)
    ? value.runStartedAtMs
    : null
  const completedAtMs = isNonnegativeSafeInteger(value.runCompletedAtMs)
    ? value.runCompletedAtMs
    : null

  if (
    scheduledStepIndex === null ||
    scheduledStepIndex > scheduledRunLength ||
    !isUniqueIntegerList(
      value.failedScheduledStepIndexes,
      scheduledRunLength,
    ) ||
    value.failedScheduledStepIndexes.some(
      (failedIndex) => failedIndex > scheduledStepIndex,
    ) ||
    !isUniqueKnownIdList(
      value.failedProblemIds,
      validProblemIds,
      Math.min(validProblemIds.size, scheduledRunLength * 4),
    ) ||
    (activeRun ? startedAtMs === null : value.runStartedAtMs !== null) ||
    (!activeRun && value.runCompletedAtMs !== null) ||
    (value.runCompletedAtMs !== null && completedAtMs === null) ||
    (completedAtMs !== null &&
      (startedAtMs === null || completedAtMs < startedAtMs))
  ) {
    return false
  }

  return (
    isValidRunProblemIds(
      value.runProblemIds,
      entryId,
      value.runNumber,
      value.runSeed,
      value.runStepIndex,
      scheduledStepIndex,
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
    (entryId === null
      ? value.runProblemIds.length === 0 &&
        value.runStepIndex === 0 &&
        value.scheduledStepIndex === 0 &&
        value.failedScheduledStepIndexes.length === 0 &&
        value.failedProblemIds.length === 0
      : value.runProblemIds.length > 0 &&
        value.runProblemIds[
          Math.min(value.runStepIndex, value.runProblemIds.length - 1)
        ] === value.currentProblemId) &&
    (entryId === null ||
      (value.runCompletedAtMs === null
        ? value.runStepIndex < value.runProblemIds.length
        : value.runStepIndex === value.runProblemIds.length &&
          value.scheduledStepIndex === scheduledRunLength))
  )
}

function cloneProgress(progress: ProgressV5): ProgressV5 {
  return {
    ...progress,
    draftByProblemId: { ...progress.draftByProblemId },
    runProblemIds: [...progress.runProblemIds],
    completedProblemIds: [...progress.completedProblemIds],
    recentProblemIds: [...progress.recentProblemIds],
    failedScheduledStepIndexes: [...progress.failedScheduledStepIndexes],
    failedProblemIds: [...progress.failedProblemIds],
  }
}

function migrateLegacyStarterProjection(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  expectedBankRevision: string,
): unknown {
  if (
    expectedBankRevision !== problemBankRevision ||
    !isRecord(value) ||
    value.version !== 5 ||
    value.bankRevision !== preStarterProjectionProblemBankRevision ||
    !isRecord(value.draftByProblemId)
  ) {
    return value
  }

  const draftByProblemId = { ...value.draftByProblemId }
  for (const [problemId, draft] of Object.entries(draftByProblemId)) {
    if (!validProblemIds.has(problemId) || typeof draft !== "string") continue

    const problem = getProblem(problemId)
    const legacyAutomaticStarter =
      problem.level <= 2 ? deriveLegacyPlaintextStarter(problem.target) : ""
    if (draft === legacyAutomaticStarter) {
      // The previous runtime persisted its generated starter when navigating
      // to a problem. Remove only an exact generated value so the new
      // topology-preserving starter becomes the fallback. Any learner edit,
      // including a deliberately empty low-level draft, remains authoritative.
      delete draftByProblemId[problemId]
    }
  }

  return {
    ...value,
    bankRevision: expectedBankRevision,
    draftByProblemId,
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
  expectedRunSeed = 0,
): ProgressV5 {
  const firstProblemId = validProblemIds.values().next().value
  const fallback = createDefaultProgress(
    firstProblemId ?? "l1-heading-apple",
    expectedBankRevision,
    expectedRunSeed,
  )

  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return fallback

    const parsed: unknown = migrateLegacyStarterProjection(
      JSON.parse(saved),
      validProblemIds,
      expectedBankRevision,
    )
    return isProgressV5(
      parsed,
      validProblemIds,
      isEligibleTransferProblem,
      expectedBankRevision,
      expectedRunSeed,
    )
      ? cloneProgress(parsed)
      : fallback
  } catch {
    return fallback
  }
}

export function saveProgress(storage: Storage, progress: ProgressV5): void {
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
