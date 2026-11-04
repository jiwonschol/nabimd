import { markState, type LangProgress, type MarkState } from "../progress/learning"
import type { MarkId } from "./marks"
import type { PracticeItem } from "./practiceItem"

/** "오늘의 다섯 장" — a bundle, not a turn: no score, no rail (plan §2). */
export const RUN_SIZE = 5

export type Random = () => number

const STATE_ORDER: Readonly<Record<MarkState, number>> = {
  new: 0,
  tried: 1,
  familiar: 2,
}

function pickRandom<T>(values: readonly T[], random: Random): T | undefined {
  if (values.length === 0) return undefined
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))]
}

/** Fresh documents first, then ones written recently, then any. */
function pickPreferringFresh(
  candidates: readonly PracticeItem[],
  recent: ReadonlySet<string>,
  random: Random,
): PracticeItem | undefined {
  const fresh = candidates.filter((item) => !recent.has(item.problem.id))
  return pickRandom(fresh.length > 0 ? fresh : candidates, random)
}

function sharesMark(item: PracticeItem, marks: readonly MarkId[]): boolean {
  return item.marks.some((mark) => marks.includes(mark))
}

/**
 * Today's five. Marks the learner has not tried come first, then the ones
 * with the fewest passes; neighbouring documents never practise the same
 * mark; at most one mixed document, and it closes the bundle. The old turn
 * rules (repair inserts, weights) are not used.
 *
 * With fewer documents than slots (the three Korean samples), documents
 * repeat, still never next to themselves.
 */
export function pickTodayFive(
  items: readonly PracticeItem[],
  progress: LangProgress,
  random: Random = Math.random,
): PracticeItem[] {
  const singles = items.filter((item) => !item.mixed)
  const mixed = items.filter((item) => item.mixed)
  const recent = new Set(progress.recentIds)

  const ranked = [...new Set(singles.map((item) => item.marks[0]))]
    .map((mark) => ({
      mark,
      state: STATE_ORDER[markState(progress, mark)],
      passes: progress.marks[mark]?.passes ?? 0,
      tiebreak: random(),
    }))
    .sort(
      (left, right) =>
        left.state - right.state ||
        left.passes - right.passes ||
        left.tiebreak - right.tiebreak,
    )
    .map(({ mark }) => mark)

  const singleSlots =
    mixed.length > 0 && singles.length > 0 ? RUN_SIZE - 1 : RUN_SIZE
  const run: PracticeItem[] = []
  const used = new Set<string>()
  const queue = [...ranked]

  for (let slot = 0; slot < singleSlots && queue.length > 0; slot += 1) {
    const previous = run.at(-1)
    const queueIndex = queue.findIndex(
      (mark) => !previous || !previous.marks.includes(mark),
    )
    if (queueIndex < 0) break
    const [mark] = queue.splice(queueIndex, 1) as [MarkId]
    queue.push(mark)

    const ofMark = singles.filter((item) => item.marks[0] === mark)
    const unused = ofMark.filter((item) => !used.has(item.problem.id))
    const choice =
      pickPreferringFresh(unused, recent, random) ??
      pickPreferringFresh(
        ofMark.filter((item) => item.problem.id !== previous?.problem.id),
        recent,
        random,
      )
    if (!choice) continue
    used.add(choice.problem.id)
    run.push(choice)
  }

  if (mixed.length > 0 && run.length < RUN_SIZE) {
    const last = run.at(-1)
    const apart = last
      ? mixed.filter((item) => !sharesMark(item, last.marks))
      : mixed
    const choice = pickPreferringFresh(apart.length > 0 ? apart : mixed, recent, random)
    if (choice) run.push(choice)
  }

  return run
}

/**
 * The document a map cell (or 다음 장 / 다른 장 in mark practice) opens: a
 * single-mark document of that mark, avoiding the given ids and preferring
 * ones not written recently. When no single-mark document exists, any
 * document containing the mark is used and practised as that mark.
 */
export function pickForMark(
  items: readonly PracticeItem[],
  mark: MarkId,
  progress: LangProgress,
  avoidIds: readonly string[] = [],
  random: Random = Math.random,
): PracticeItem | null {
  const recent = new Set(progress.recentIds)
  const avoid = new Set(avoidIds)
  const notAvoided = (item: PracticeItem) => !avoid.has(item.problem.id)

  const dedicated = items.filter(
    (item) => !item.mixed && item.marks[0] === mark,
  )
  const dedicatedChoice =
    pickPreferringFresh(dedicated.filter(notAvoided), recent, random) ??
    pickRandom(dedicated, random)
  if (dedicatedChoice) return dedicatedChoice

  const containing = items.filter((item) => item.allMarks.includes(mark))
  const fallback =
    pickPreferringFresh(containing.filter(notAvoided), recent, random) ??
    pickRandom(containing, random)
  return fallback ? { ...fallback, marks: [mark], mixed: false } : null
}

export function hasDocumentForMark(
  items: readonly PracticeItem[],
  mark: MarkId,
): boolean {
  return items.some((item) => item.allMarks.includes(mark))
}
