import type { ProgressV2 } from "./types"
import {
  createRunProblemIds,
  isEntryId,
} from "../content/entryChoices"

export const PROGRESS_STORAGE_KEY = "nabimd.progress.v2"

export function createDefaultProgress(currentProblemId: string): ProgressV2 {
  return {
    version: 2,
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
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" && validProblemIds.has(item),
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

function matchesRunProblemIds(
  runProblemIds: readonly string[],
  entryId: ProgressV2["entryId"],
  runNumber: number,
): boolean {
  if (entryId === null) return runProblemIds.length === 0

  const expectedRunProblemIds = createRunProblemIds(entryId, runNumber)
  if (runProblemIds.length === expectedRunProblemIds.length) {
    return runProblemIds.every(
      (problemId, index) => problemId === expectedRunProblemIds[index],
    )
  }

  if (runProblemIds.length !== expectedRunProblemIds.length + 1) {
    return false
  }

  return runProblemIds.some((_, insertedIndex) => {
    const withoutInsertedProblem = [
      ...runProblemIds.slice(0, insertedIndex),
      ...runProblemIds.slice(insertedIndex + 1),
    ]

    return withoutInsertedProblem.every(
      (problemId, index) => problemId === expectedRunProblemIds[index],
    )
  })
}

function isProgressV2(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
): value is ProgressV2 {
  if (!isRecord(value)) return false

  return (
    value.version === 2 &&
    (value.entryId === null || isEntryId(value.entryId)) &&
    typeof value.runNumber === "number" &&
    Number.isSafeInteger(value.runNumber) &&
    value.runNumber >= 0 &&
    Array.isArray(value.runProblemIds) &&
    matchesRunProblemIds(
      value.runProblemIds,
      value.entryId,
      value.runNumber,
    ) &&
    isKnownIdList(value.runProblemIds, validProblemIds) &&
    typeof value.runStepIndex === "number" &&
    Number.isSafeInteger(value.runStepIndex) &&
    value.runStepIndex >= 0 &&
    value.runStepIndex <= value.runProblemIds.length &&
    typeof value.currentProblemId === "string" &&
    validProblemIds.has(value.currentProblemId) &&
    isValidDraftRecord(value.draftByProblemId, validProblemIds) &&
    isKnownIdList(value.completedProblemIds, validProblemIds) &&
    isKnownIdList(value.recentProblemIds, validProblemIds) &&
    (value.pendingTransferFamily === null ||
      value.pendingTransferFamily === "heading-h1") &&
    typeof value.currentIsTransfer === "boolean" &&
    (value.entryId === null
      ? value.runProblemIds.length === 0 && value.runStepIndex === 0
      : value.runProblemIds.length > 0 &&
        value.runProblemIds[
          Math.min(value.runStepIndex, value.runProblemIds.length - 1)
        ] === value.currentProblemId)
  )
}

function cloneProgress(progress: ProgressV2): ProgressV2 {
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
): ProgressV2 {
  const firstProblemId = validProblemIds.values().next().value
  const fallback = createDefaultProgress(
    firstProblemId ?? "heading-apple",
  )

  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return fallback

    const parsed: unknown = JSON.parse(saved)
    return isProgressV2(parsed, validProblemIds)
      ? cloneProgress(parsed)
      : fallback
  } catch {
    return fallback
  }
}

export function saveProgress(
  storage: Storage,
  progress: ProgressV2,
): void {
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
