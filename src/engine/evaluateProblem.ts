import type { Problem } from "../content/types"
import { evaluateEditorial } from "./evaluateEditorial"
import { evaluateMatch } from "./evaluateMatch"
import { parseMarkdown } from "./markdownAst"
import type { Evaluation } from "./types"

export function evaluateProblem(
  problem: Problem,
  source: string,
): Evaluation {
  const tree = parseMarkdown(source)
  const matchFailure = evaluateMatch(problem, source, tree)

  if (matchFailure) return matchFailure

  const reviewItems = evaluateEditorial(problem, tree)

  return { status: "matched", reviewItems }
}
