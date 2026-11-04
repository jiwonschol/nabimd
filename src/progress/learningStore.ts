import { isMark } from "../app/marks"
import {
  emptyLangProgress,
  emptyProgress,
  type LangProgress,
  type LearningProgress,
  type MarkRecord,
  RECENT_LIMIT,
} from "./learning"

/** localStorage key of the learner's progress (plan §4.5). No account. */
export const LEARNING_STORAGE_KEY = "nabimd.learning.v1"

/**
 * The retired drill kept its progress in sessionStorage under these keys.
 * They are removed unread on the first visit (plan §4.5).
 */
export const RETIRED_SESSION_KEYS = [
  "nabimd.progress.v5",
  "nabimd.session-seed.v1",
] as const

export type StoredLearning = LearningProgress & {
  /** The editor's "start from a blank page" choice, remembered per browser. */
  blankPage?: boolean
}

function createMemoryStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

/**
 * localStorage when it works; otherwise (Safari private windows, blocked
 * site data) a store that lasts for this page only, so the app still runs.
 */
export function resolveLearningStorage(): KeyValueStorage {
  try {
    const storage = window.localStorage
    const probe = "__nabimd_learning_probe__"
    storage.setItem(probe, "1")
    storage.removeItem(probe)
    return storage
  } catch {
    return createMemoryStorage()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null
}

/** Keeps the readable parts of one language; anything malformed is dropped. */
function readLang(value: unknown): LangProgress {
  if (!isRecord(value)) return emptyLangProgress()
  const marks: LangProgress["marks"] = {}
  if (isRecord(value.marks)) {
    for (const [mark, record] of Object.entries(value.marks)) {
      if (!isMark(mark) || !isRecord(record)) continue
      const tries = count(record.tries)
      const passes = count(record.passes)
      const lastAt = count(record.lastAt)
      if (tries === null || passes === null || lastAt === null || passes > tries) {
        continue
      }
      marks[mark] = { tries, passes, lastAt } satisfies MarkRecord
    }
  }
  const recentIds = Array.isArray(value.recentIds)
    ? value.recentIds
        .filter((id): id is string => typeof id === "string")
        .slice(0, RECENT_LIMIT)
    : []
  return { marks, recentIds }
}

export function parseLearning(raw: string | null): StoredLearning {
  if (raw === null) return emptyProgress()
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.v !== 1) return emptyProgress()
    return {
      v: 1,
      ko: readLang(value.ko),
      en: readLang(value.en),
      ...(typeof value.blankPage === "boolean" ? { blankPage: value.blankPage } : {}),
    }
  } catch {
    return emptyProgress()
  }
}

export function loadLearning(storage: KeyValueStorage): StoredLearning {
  try {
    return parseLearning(storage.getItem(LEARNING_STORAGE_KEY))
  } catch {
    return emptyProgress()
  }
}

export function saveLearning(storage: KeyValueStorage, learning: StoredLearning) {
  try {
    storage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(learning))
  } catch {
    // A full or blocked store keeps progress for this page only.
  }
}

export function clearLearning(storage: KeyValueStorage) {
  try {
    storage.removeItem(LEARNING_STORAGE_KEY)
  } catch {
    // Nothing was stored.
  }
}

export function removeRetiredProgress() {
  try {
    for (const key of RETIRED_SESSION_KEYS) window.sessionStorage.removeItem(key)
  } catch {
    // Blocked storage held nothing of ours.
  }
}
