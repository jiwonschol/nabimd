import { boldCards } from "./bold"
import type { KoCard, KoMark } from "./build"
import { codeBlockCards } from "./code-block"
import { headingCards } from "./heading"
import { inlineCodeCards } from "./inline-code"
import { italicCards } from "./italic"
import { linkCards } from "./link"
import { listCards } from "./list"
import { orderedListCards } from "./ordered-list"

/**
 * 한국어 문제은행 v1의 진입점(계획서 §4.3, 이슈 #253).
 *
 * 카드 하나 = 문서 한 장. `problem`은 기존 v2 스키마 그대로라 `evaluateProblem`에
 * 바로 넣는다. 픽스처는 화면 묶음에 들어가지 않게 `./fixtures`에 따로 둔다.
 */
export const koCardsByMark: Readonly<Partial<Record<KoMark, readonly KoCard[]>>> = {
  heading: headingCards,
  bold: boldCards,
  italic: italicCards,
  list: listCards,
  "ordered-list": orderedListCards,
  link: linkCards,
  "inline-code": inlineCodeCards,
  "code-block": codeBlockCards,
}

export const koMixedCards: readonly KoCard[] = []

export const koCards: readonly KoCard[] = [
  ...Object.values(koCardsByMark).flat(),
  ...koMixedCards,
]

export const koProblems = koCards.map((card) => card.problem)

export { KO_DOC_TYPES, KO_MARKS, markName } from "./build"
export type { KoCard, KoDocType, KoMark } from "./build"
