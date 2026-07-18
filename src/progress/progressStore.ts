import type { ProgressV1 } from "./types"

export const PROGRESS_STORAGE_KEY = "nabimd.progress.v1"

export function createDefaultProgress(currentProblemId: string): ProgressV1 {
  return {
    version: 1,
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

function isProgressV1(
  value: unknown,
  validProblemIds: ReadonlySet<string>,
): value is ProgressV1 {
  if (!isRecord(value)) return false

  return (
    value.version === 1 &&
    typeof value.currentProblemId === "string" &&
    validProblemIds.has(value.currentProblemId) &&
    isValidDraftRecord(value.draftByProblemId, validProblemIds) &&
    isKnownIdList(value.completedProblemIds, validProblemIds) &&
    isKnownIdList(value.recentProblemIds, validProblemIds) &&
    (value.pendingTransferFamily === null ||
      value.pendingTransferFamily === "heading-h1") &&
    typeof value.currentIsTransfer === "boolean"
  )
}

function cloneProgress(progress: ProgressV1): ProgressV1 {
  return {
    ...progress,
    draftByProblemId: { ...progress.draftByProblemId },
    completedProblemIds: [...progress.completedProblemIds],
    recentProblemIds: [...progress.recentProblemIds],
  }
}

export function loadProgress(
  storage: Storage,
  validProblemIds: ReadonlySet<string>,
): ProgressV1 {
  const firstProblemId = validProblemIds.values().next().value
  const fallback = createDefaultProgress(
    firstProblemId ?? "heading-project-notes",
  )

  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return fallback

    const parsed: unknown = JSON.parse(saved)
    return isProgressV1(parsed, validProblemIds)
      ? cloneProgress(parsed)
      : fallback
  } catch {
    return fallback
  }
}

export function saveProgress(
  storage: Storage,
  progress: ProgressV1,
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
