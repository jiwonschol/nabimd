import type { GradableProblem, MatchCheck } from "../content/types"
import type { EvaluationContext } from "./evaluationContext"
import { headingCheckPasses } from "./predicates/heading"
import { structuralCheckPasses } from "./predicates/structural"
import type { MatchFailure } from "./types"

function checkPasses(
  check: MatchCheck,
  context: EvaluationContext,
): boolean {
  switch (check.kind) {
    case "heading-spacing":
    case "hash-heading-style":
    case "has-heading":
      return headingCheckPasses(check, context.source, context.root)
    case "block-count":
    case "inline-presence":
    case "heading-depth-order":
    case "list-shape":
    case "blockquote-shape":
    case "inline-code-shape":
    case "code-block":
    case "block-sequence":
    case "document-limits":
      return structuralCheckPasses(check, context)
  }
}

export function evaluateMatch(
  problem: GradableProblem,
  context: EvaluationContext,
): MatchFailure | null {
  const checksByPriority = problem.matchChecks
    .map((check, declarationIndex) => ({ check, declarationIndex }))
    .sort(
      (left, right) =>
        left.check.priority - right.check.priority ||
        left.declarationIndex - right.declarationIndex,
    )

  for (const { check } of checksByPriority) {
    if (!checkPasses(check, context)) {
      return {
        status: "fail",
        feedbackId: check.id,
        message: check.feedback,
      }
    }
  }

  return null
}
