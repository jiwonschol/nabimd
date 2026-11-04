import type { NormalizedProblem } from "../content/types"
import type { MarkId } from "./marks"

/**
 * One document the practice screen can open. `marks` are the marks this
 * document practises: one for a single-mark document, two or three for a
 * mixed one. Its teaching and hints are about those marks.
 */
export type PracticeItem = {
  problem: NormalizedProblem
  marks: readonly [MarkId, ...MarkId[]]
  mixed: boolean
}
