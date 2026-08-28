import {
  createRunProblemIds,
  getEntryChoice,
  isEntryId,
  runScheduleRevision,
} from "../content/entryChoices"
import {
  flattenedStarterProjectionProblemBankRevision,
  getProblem,
  preChapterProblemBankRevision,
  preStarterProjectionProblemBankRevision,
  problemBankRevision,
} from "../content/problemBank"
import { deriveLegacyPlaintextStarter } from "../content/plaintextStarter"
import type { SyntaxMistake } from "../guided/guidedSyntax"
import { isReachableRunSchedule } from "../session/runSchedule"
import type { ProgressV5 } from "./types"

export const PROGRESS_STORAGE_KEY = "nabimd.progress.v5"
// A browser session cannot legitimately reach this many five-problem turns.
// Cap untrusted storage before deterministic schedule reconstruction.
export const MAX_PERSISTED_RUN_NUMBER = 10_000
const MAX_PERSISTED_SYNTAX_MISTAKES = 128
const MAX_PERSISTED_MARK_LENGTH = 256

export function createDefaultProgress(
  currentProblemId: string,
  bankRevision = problemBankRevision,
  runSeed = 0,
): ProgressV5 {
  return {
    version: 5,
    bankRevision,
    runScheduleRevision,
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
    pendingSlotRetryProblemId: null,
    currentIsTransfer: false,
    failedScheduledStepIndexes: [],
    failedProblemIds: [],
    syntaxMistakes: [],
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

function recoverValidDrafts(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
): Record<string, string> {
  if (!isRecord(value) || !isRecord(value.draftByProblemId)) return {}
  return Object.fromEntries(
    Object.entries(value.draftByProblemId).filter(
      (entry): entry is [string, string] =>
        validProblemIds.has(entry[0]) && typeof entry[1] === "string",
    ),
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

function isBoundedString(value: unknown, maximumLength: number): value is string {
  return typeof value === "string" && value.length <= maximumLength
}

function isValidSyntaxMistakes(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
): value is SyntaxMistake[] {
  if (
    !Array.isArray(value) ||
    value.length > MAX_PERSISTED_SYNTAX_MISTAKES
  ) {
    return false
  }

  const seen = new Set<string>()
  return value.every((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.problemId !== "string" ||
      !validProblemIds.has(candidate.problemId) ||
      !isBoundedString(candidate.checkpointId, MAX_PERSISTED_MARK_LENGTH) ||
      candidate.checkpointId.length === 0 ||
      !isNonnegativeSafeInteger(candidate.groupIndex) ||
      !isBoundedString(candidate.term, MAX_PERSISTED_MARK_LENGTH) ||
      !isBoundedString(candidate.submitted, MAX_PERSISTED_MARK_LENGTH) ||
      !Array.isArray(candidate.expected) ||
      candidate.expected.length === 0 ||
      candidate.expected.length > 8 ||
      !candidate.expected.every((form) =>
        isBoundedString(form, MAX_PERSISTED_MARK_LENGTH),
      )
    ) {
      return false
    }

    const key = `${candidate.problemId}:${candidate.checkpointId}:${candidate.groupIndex}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
    value.runScheduleRevision !== runScheduleRevision ||
    (value.entryId !== null &&
      (!isEntryId(value.entryId) || !getEntryChoice(value.entryId).available)) ||
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
    isValidSyntaxMistakes(value.syntaxMistakes, validProblemIds) &&
    (value.pendingTransferFamily === null ||
      typeof value.pendingTransferFamily === "string") &&
    (value.pendingSlotRetryProblemId === null ||
      (typeof value.pendingSlotRetryProblemId === "string" &&
        validProblemIds.has(value.pendingSlotRetryProblemId) &&
        value.pendingSlotRetryProblemId === value.currentProblemId)) &&
    (entryId === null
      ? value.runProblemIds.length === 0 &&
        value.runStepIndex === 0 &&
        value.scheduledStepIndex === 0 &&
        value.failedScheduledStepIndexes.length === 0 &&
        value.failedProblemIds.length === 0 &&
        value.pendingSlotRetryProblemId === null
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
    syntaxMistakes: progress.syntaxMistakes.map((mistake) => ({
      ...mistake,
      expected: [...mistake.expected],
    })),
  }
}

function migrateLegacyRunSeed(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 5 || "runSeed" in value) {
    return value
  }

  // Progress records written before session-varying runs used the same
  // deterministic order now represented by seed 0. Keep v5 storage backward
  // compatible without accepting it for nonzero session seeds.
  return {
    ...value,
    runSeed: 0,
  }
}

function migratePendingSlotRetry(value: unknown): unknown {
  if (
    !isRecord(value) ||
    value.version !== 5 ||
    "pendingSlotRetryProblemId" in value
  ) {
    return value
  }
  return {
    ...value,
    pendingSlotRetryProblemId: null,
  }
}

function migrateSyntaxMistakes(value: unknown): unknown {
  if (
    !isRecord(value) ||
    value.version !== 5 ||
    "syntaxMistakes" in value
  ) {
    return value
  }
  return {
    ...value,
    syntaxMistakes: [],
  }
}

function migrateStarterProjectionRevision(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  expectedBankRevision: string,
): unknown {
  if (
    expectedBankRevision !== problemBankRevision ||
    !isRecord(value) ||
    value.version !== 5 ||
    !isRecord(value.draftByProblemId)
  ) {
    return value
  }

  const sourceBankRevision = value.bankRevision
  if (
    sourceBankRevision !== preStarterProjectionProblemBankRevision &&
    sourceBankRevision !== flattenedStarterProjectionProblemBankRevision
  ) {
    return value
  }

  const draftByProblemId = { ...value.draftByProblemId }
  for (const [problemId, draft] of Object.entries(draftByProblemId)) {
    if (!validProblemIds.has(problemId) || typeof draft !== "string") continue

    const problem = getProblem(problemId)
    if (problem.level <= 2 && draft === "") continue

    const legacyPlaintextStarter = deriveLegacyPlaintextStarter(problem.target)
    const legacyAutomaticStarter =
      sourceBankRevision === preStarterProjectionProblemBankRevision &&
      problem.level >= 3
        ? ""
        : legacyPlaintextStarter
    const isFlattenedHighLevelBlank =
      sourceBankRevision === flattenedStarterProjectionProblemBankRevision &&
      problem.level >= 3 &&
      draft === ""
    if (draft === legacyAutomaticStarter || isFlattenedHighLevelBlank) {
      // Previous runtimes persisted automatic starters when navigating to a
      // problem. Remove only a known automatic value so the new
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

function migratePreChapterRevision(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  expectedBankRevision: string,
  expectedRunSeed: number,
): unknown {
  if (
    expectedBankRevision !== problemBankRevision ||
    !isRecord(value) ||
    value.version !== 5 ||
    value.bankRevision !== preChapterProblemBankRevision ||
    !isRecord(value.draftByProblemId)
  ) {
    return value
  }

  const firstProblemId = validProblemIds.values().next().value
  const fallback = createDefaultProgress(
    firstProblemId ?? "l1-heading-apple",
    expectedBankRevision,
    expectedRunSeed,
  )
  const draftByProblemId = recoverValidDrafts(value, validProblemIds)

  if (
    typeof value.entryId !== "string" ||
    !isEntryId(value.entryId) ||
    !getEntryChoice(value.entryId).available ||
    !isNonnegativeSafeInteger(value.runStartedAtMs)
  ) {
    return { ...fallback, draftByProblemId }
  }

  const runNumber =
    isNonnegativeSafeInteger(value.runNumber) &&
    value.runNumber <= MAX_PERSISTED_RUN_NUMBER
      ? value.runNumber
      : 0
  const runProblemIds = createRunProblemIds(
    value.entryId,
    runNumber,
    expectedRunSeed,
  )
  const currentProblemId = runProblemIds[0] ?? fallback.currentProblemId

  return {
    ...createDefaultProgress(
      currentProblemId,
      expectedBankRevision,
      expectedRunSeed,
    ),
    entryId: value.entryId,
    runNumber,
    runProblemIds,
    runStartedAtMs: Date.now(),
    draftByProblemId,
  }
}

function migrateRunScheduleRevision(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
  expectedBankRevision: string,
  expectedRunSeed: number,
): unknown {
  if (
    expectedBankRevision !== problemBankRevision ||
    !isRecord(value) ||
    value.version !== 5 ||
    value.bankRevision !== expectedBankRevision ||
    value.runScheduleRevision === runScheduleRevision ||
    !isRecord(value.draftByProblemId)
  ) {
    return value
  }

  const firstProblemId = validProblemIds.values().next().value
  const fallback = createDefaultProgress(
    firstProblemId ?? "l1-heading-apple",
    expectedBankRevision,
    expectedRunSeed,
  )
  const draftByProblemId = recoverValidDrafts(value, validProblemIds)

  if (
    value.runCompletedAtMs !== null &&
    value.runCompletedAtMs !== undefined
  ) {
    const nextRunNumber =
      isNonnegativeSafeInteger(value.runNumber) &&
      value.runNumber < MAX_PERSISTED_RUN_NUMBER
        ? value.runNumber + 1
        : 0
    return { ...fallback, runNumber: nextRunNumber, draftByProblemId }
  }

  if (value.entryId === null) {
    return {
      ...value,
      runScheduleRevision,
      draftByProblemId,
    }
  }

  if (
    typeof value.entryId !== "string" ||
    !isEntryId(value.entryId) ||
    !getEntryChoice(value.entryId).available ||
    !isNonnegativeSafeInteger(value.runStartedAtMs) ||
    !isNonnegativeSafeInteger(value.runSeed) ||
    value.runSeed !== expectedRunSeed
  ) {
    return { ...fallback, draftByProblemId }
  }

  const runNumber =
    isNonnegativeSafeInteger(value.runNumber) &&
    value.runNumber <= MAX_PERSISTED_RUN_NUMBER
      ? value.runNumber
      : 0
  const runProblemIds = createRunProblemIds(
    value.entryId,
    runNumber,
    expectedRunSeed,
  )
  const currentProblemId = runProblemIds[0] ?? fallback.currentProblemId

  return {
    ...createDefaultProgress(
      currentProblemId,
      expectedBankRevision,
      expectedRunSeed,
    ),
    entryId: value.entryId,
    runNumber,
    runProblemIds,
    runStartedAtMs: Date.now(),
    draftByProblemId,
  }
}

/**
 * The run seed the persisted progress record was generated under, or `null`
 * when no seed-bearing v5 record is stored. Legacy records written before
 * runs varied by seed lack `runSeed` and are equivalent to seed 0. Callers use
 * this to adopt the stored seed instead of validating an old run against a
 * fresh random seed (which would discard it).
 */
export function readPersistedRunSeed(storage: Storage): number | null {
  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return null
    const parsed: unknown = JSON.parse(saved)
    if (!isRecord(parsed) || parsed.version !== 5) return null
    if (!("runSeed" in parsed)) return 0
    return isNonnegativeSafeInteger(parsed.runSeed) ? parsed.runSeed : null
  } catch {
    return null
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

    const parsed: unknown = migrateSyntaxMistakes(
      migratePendingSlotRetry(
        migrateRunScheduleRevision(
          migrateLegacyRunSeed(
            migrateStarterProjectionRevision(
              migratePreChapterRevision(
                JSON.parse(saved),
                validProblemIds,
                expectedBankRevision,
                expectedRunSeed,
              ),
              validProblemIds,
              expectedBankRevision,
            ),
          ),
          validProblemIds,
          expectedBankRevision,
          expectedRunSeed,
        ),
      ),
    )
    return isProgressV5(
      parsed,
      validProblemIds,
      isEligibleTransferProblem,
      expectedBankRevision,
      expectedRunSeed,
    )
      ? cloneProgress(parsed)
      : {
          ...fallback,
          draftByProblemId: recoverValidDrafts(parsed, validProblemIds),
        }
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

/**
 * Drop every saved draft while keeping the run itself.
 *
 * A draft that makes the app throw is reloaded on the next visit, so without
 * this the learner is stuck in a loop they cannot escape by refreshing. Levels
 * and completed problems survive — only the typed text goes.
 */
export function clearPersistedDrafts(storage: Storage): void {
  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return
    const parsed: unknown = JSON.parse(saved)
    if (!isRecord(parsed)) return
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ ...parsed, draftByProblemId: {} }),
    )
  } catch {
    // Nothing more to do: the drafts are unreachable either way.
  }
}
