import { koSamples } from "../content/ko/_samples"
import { derivePlaintextStarter } from "../content/plaintextStarter"
import type { NormalizedProblem } from "../content/types"
import { ko } from "../i18n/ko"
import { isMark, MARKS, type MarkId } from "./marks"
import type { PracticeItem } from "./practiceItem"

/**
 * The shape the Korean bank (issue #253, PR #257) exports from
 * `src/content/ko/index.ts`. Only the fields this screen reads are named, so
 * the bank can grow without touching this file.
 */
type KoCardLike = {
  problem: NormalizedProblem
  /** The bank's mark names; it calls the bulleted list "list". */
  marks: readonly string[]
}

type KoIndexModule = {
  koCardsByMark: Readonly<Partial<Record<string, readonly KoCardLike[]>>>
  koMixedCards: readonly KoCardLike[]
}

/**
 * The one-line switch: the glob is empty while `index.ts` is absent, and
 * Korean mode runs on the three samples until the bank lands.
 */
const koIndex = import.meta.glob<KoIndexModule>("../content/ko/index.ts")

function toMark(name: string): MarkId | null {
  if (name === "list") return "unordered-list"
  return isMark(name) ? name : null
}

function withStarter(problem: NormalizedProblem): NormalizedProblem {
  return problem.starterText
    ? problem
    : { ...problem, starterText: derivePlaintextStarter(problem.target) }
}

function toItem(problem: NormalizedProblem, marks: readonly MarkId[], mixed: boolean) {
  if (marks.length === 0) return []
  return [
    {
      problem: withStarter(problem),
      marks: [marks[0]!, ...marks.slice(1)] as PracticeItem["marks"],
      mixed,
    } satisfies PracticeItem,
  ]
}

export function itemsFromKoIndex(module: KoIndexModule): PracticeItem[] {
  const single = Object.values(module.koCardsByMark).flatMap((cards) =>
    (cards ?? []).flatMap((card) =>
      toItem(card.problem, card.marks.map(toMark).filter((mark) => mark !== null), false),
    ),
  )
  const mixed = module.koMixedCards.flatMap((card) =>
    toItem(card.problem, card.marks.map(toMark).filter((mark) => mark !== null), true),
  )
  return [...single, ...mixed]
}

function markByKoreanName(name: string): MarkId | null {
  return MARKS.find((mark) => ko[`mark.${mark}`] === name) ?? null
}

function sampleItems(): PracticeItem[] {
  return koSamples.flatMap(({ problem, focusMark }) => {
    const focus = markByKoreanName(focusMark)
    return focus ? toItem(problem, [focus], false) : []
  })
}

export async function koreanItems(): Promise<readonly PracticeItem[]> {
  const loadIndex = Object.values(koIndex)[0]
  if (loadIndex) return itemsFromKoIndex(await loadIndex())
  return sampleItems()
}
