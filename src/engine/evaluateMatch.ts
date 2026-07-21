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
    case "link-shape":
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

  const failures = checksByPriority
    .filter(({ check }) => !checkPasses(check, context))
    .map(({ check }) => ({
      feedbackId: check.id,
      message: check.feedback,
      check,
    }))

  const firstFailure = failures[0]
  if (!firstFailure) return null

  return {
    status: "fail",
    feedbackId: firstFailure.feedbackId,
    message: firstFailure.message,
    failures,
  }
}
