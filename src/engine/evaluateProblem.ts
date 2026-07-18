import type { GradableProblem } from "../content/types"
import { evaluateEditorial } from "./evaluateEditorial"
import { evaluateMatch } from "./evaluateMatch"
import { createEvaluationContext } from "./evaluationContext"
import type { Evaluation } from "./types"

export function evaluateProblem(
  problem: GradableProblem,
  source: string,
): Evaluation {
  const context = createEvaluationContext(source)
  const matchFailure = evaluateMatch(problem, context)

  if (matchFailure) return matchFailure

  const reviewItems = evaluateEditorial(problem, context)

  return { status: "matched", reviewItems }
}
