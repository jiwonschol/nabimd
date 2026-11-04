import { koCardsByMark, koMixedCards } from "../content/ko"
import { derivePlaintextStarter } from "../content/plaintextStarter"
import type { NormalizedProblem } from "../content/types"
import { isMark, type MarkId } from "./marks"
import type { PracticeItem } from "./practiceItem"

/** The fields of a Korean bank card (issue #253) this screen reads. */
type KoCardLike = {
  problem: NormalizedProblem
  /** The bank's mark names; it calls the bulleted list "list". */
  marks: readonly string[]
}

type KoBank = {
  koCardsByMark: Readonly<Partial<Record<string, readonly KoCardLike[]>>>
  koMixedCards: readonly KoCardLike[]
}

function toMark(name: string): MarkId | null {
  if (name === "list") return "unordered-list"
  return isMark(name) ? name : null
}

function toItem(card: KoCardLike, mixed: boolean): PracticeItem[] {
  const marks = card.marks.map(toMark).filter((mark) => mark !== null)
  if (marks.length === 0) return []
  const { problem } = card
  return [
    {
      // The bank leaves starterText empty; fill mode needs the goal's prose.
      problem: problem.starterText
        ? problem
        : { ...problem, starterText: derivePlaintextStarter(problem.target) },
      marks: [marks[0]!, ...marks.slice(1)],
      mixed,
    },
  ]
}

export function itemsFromKoBank(bank: KoBank): PracticeItem[] {
  return [
    ...Object.values(bank.koCardsByMark).flatMap((cards) =>
      (cards ?? []).flatMap((card) => toItem(card, false)),
    ),
    ...bank.koMixedCards.flatMap((card) => toItem(card, true)),
  ]
}

/** Korean mode serves the Korean bank v1: 96 single-mark and 24 mixed documents. */
export function koreanItems(): PracticeItem[] {
  return itemsFromKoBank({ koCardsByMark, koMixedCards })
}
