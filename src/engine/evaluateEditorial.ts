import type { EditorialCheck, GradableProblem } from "../content/types"
import type { EvaluationContext } from "./evaluationContext"
import { headingsAtLevel } from "./markdownAst"
import type { ReviewItem } from "./types"

function editorialCheckPasses(
  check: EditorialCheck,
  context: EvaluationContext,
): boolean {
  switch (check.kind) {
    case "single-h1":
      return headingsAtLevel(context.root, 1).length === 1
  }
}

export function evaluateEditorial(
  problem: GradableProblem,
  context: EvaluationContext,
): ReviewItem[] {
  return problem.editorialChecks
    .filter((check) => !editorialCheckPasses(check, context))
    .map((check) => ({ id: check.id, message: check.review }))
    .slice(0, 3)
}
