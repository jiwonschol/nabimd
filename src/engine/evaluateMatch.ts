import type { GradableProblem, MatchCheck } from "../content/types"
import type { EvaluationContext } from "./evaluationContext"
import { headingCheckPasses } from "./predicates/heading"
import { structuralCheckPasses } from "./predicates/structural"
import type { EngineMessageKey, MatchFailure } from "./types"
import { diagnoseMatchFailure } from "./matchDiagnostics"

type ListShapeCheck = Extract<MatchCheck, { kind: "list-shape" }>

function isThematicBreak(line: string): boolean {
  const trimmed = line.trim()
  return /^([-+*])\1{2,}$/.test(trimmed)
}

function missingBulletSpaceCount(source: string): number {
  return source.split("\n").filter((line) => {
    if (isThematicBreak(line)) return false
    return /^[ \t]{0,3}[-+*]\S/.test(line)
  }).length
}

function missingNumberedSpaceCount(source: string): number {
  return source.split("\n").filter((line) =>
    /^[ \t]{0,3}\d{1,9}[.)]\S/.test(line),
  ).length
}

function listMessageKey(
  check: ListShapeCheck,
  source: string,
): EngineMessageKey | undefined {
  if (
    check.ordered !== true &&
    missingBulletSpaceCount(source) >= check.minItems
  ) {
    return "list-bullet-space"
  }

  if (
    check.ordered !== false &&
    missingNumberedSpaceCount(source) >= check.minItems
  ) {
    return "list-number-space"
  }

  return undefined
}

function failureMessageKey(
  check: MatchCheck,
  context: EvaluationContext,
): EngineMessageKey | undefined {
  return check.kind === "list-shape"
    ? listMessageKey(check, context.source)
    : undefined
}

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
    .map(({ check, declarationIndex }) => ({
      feedbackId: check.id,
      message: check.feedback,
      messageKey: failureMessageKey(check, context),
      check,
      diagnostic: diagnoseMatchFailure(
        problem,
        check,
        context,
        declarationIndex,
      ),
    }))

  const firstFailure = failures[0]
  if (!firstFailure) return null

  return {
    status: "fail",
    feedbackId: firstFailure.feedbackId,
    message: firstFailure.message,
    messageKey: firstFailure.messageKey,
    failures,
    checkedSource: context.source,
  }
}
