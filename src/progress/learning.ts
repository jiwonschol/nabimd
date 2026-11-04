import type { MarkId } from "../app/marks"
import type { Lang } from "../i18n/text"

/** Passes on a mark that make it "familiar" on the map (plan §5 default). */
export const FAMILIAR_PASSES = 3

/** How many recently written documents the selector tries not to repeat. */
export const RECENT_LIMIT = 30

export type MarkRecord = {
  tries: number
  passes: number
  /** Epoch milliseconds of the last check on this mark. */
  lastAt: number
}

export type LangProgress = {
  marks: Partial<Record<MarkId, MarkRecord>>
  /** Newest first. */
  recentIds: readonly string[]
}

/** The stored shape of `nabimd.learning.v1` (plan §4.5). */
export type LearningProgress = {
  v: 1
  ko: LangProgress
  en: LangProgress
}

export type MarkState = "new" | "tried" | "familiar"

export function emptyLangProgress(): LangProgress {
  return { marks: {}, recentIds: [] }
}

export function emptyProgress(): LearningProgress {
  return { v: 1, ko: emptyLangProgress(), en: emptyLangProgress() }
}

export function markState(progress: LangProgress, mark: MarkId): MarkState {
  const record = progress.marks[mark]
  if (!record || record.tries === 0) return "new"
  return record.passes >= FAMILIAR_PASSES ? "familiar" : "tried"
}

/**
 * Counts one press of 확인 on a document: every mark it practises gets a try,
 * and a pass when the draft passed. The document moves to the front of the
 * recent list so the next selection prefers others.
 */
export function recordCheck(
  progress: LearningProgress,
  lang: Lang,
  check: {
    problemId: string
    marks: readonly MarkId[]
    passed: boolean
    at: number
  },
): LearningProgress {
  const current = progress[lang]
  const marks = { ...current.marks }
  for (const mark of check.marks) {
    const record = marks[mark] ?? { tries: 0, passes: 0, lastAt: 0 }
    marks[mark] = {
      tries: record.tries + 1,
      passes: record.passes + (check.passed ? 1 : 0),
      lastAt: check.at,
    }
  }
  const recentIds = [
    check.problemId,
    ...current.recentIds.filter((id) => id !== check.problemId),
  ].slice(0, RECENT_LIMIT)
  return { ...progress, [lang]: { marks, recentIds } }
}
