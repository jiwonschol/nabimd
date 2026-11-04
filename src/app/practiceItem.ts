import type { NormalizedProblem } from "../content/types"
import type { MarkId } from "./marks"

/**
 * One document the practice screen can open. `marks` are the marks this
 * document practises (one for a single-mark document, two or three for a
 * mixed one); `allMarks` also counts marks that only appear in it, such as
 * the title most Korean documents open with.
 */
export type PracticeItem = {
  problem: NormalizedProblem
  marks: readonly [MarkId, ...MarkId[]]
  allMarks: readonly MarkId[]
  mixed: boolean
}
