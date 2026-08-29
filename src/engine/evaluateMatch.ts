import type { GradableProblem, MatchCheck } from "../content/types"
import type { EvaluationContext } from "./evaluationContext"
import { headingCheckPasses } from "./predicates/heading"
import {
  isTaskItem,
  listCandidatePasses,
  listCandidatesForCheck,
  structuralCheckPasses,
} from "./predicates/structural"
import type { MatchFailure } from "./types"
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

function checkboxNearMiss(
  check: ListShapeCheck,
  context: EvaluationContext,
 ) {
  return listCandidatesForCheck(check, context).find(
    ({ list }) =>
      listCandidatePasses(check, context, list, false) &&
      list.children.some((item) => !isTaskItem(item)),
  )?.list
}

function listFailureMessage(
  check: ListShapeCheck,
  context: EvaluationContext,
): string {
  // A list that is missing its boxes is the near miss this check exists for,
  // so it gets its own sentence rather than the generic feedback.
  const nearMiss = check.requireTaskItems
    ? checkboxNearMiss(check, context)
    : undefined
  if (nearMiss) {
    return nearMiss.ordered
      ? "Put a checkbox after each numbered marker, for example `1. [ ] Item`."
      : "Put a checkbox after each bullet marker, for example `- [ ] Item`."
  }

  if (
    check.ordered !== true &&
    missingBulletSpaceCount(context.source) >= check.minItems
  ) {
    return "Put one space after each bullet marker, for example `- Item`."
  }

  if (
    check.ordered !== false &&
    missingNumberedSpaceCount(context.source) >= check.minItems
  ) {
    return "Put one space after each numbered marker, for example `1. Step`."
  }

  return check.feedback
}

function failureMessage(check: MatchCheck, context: EvaluationContext): string {
  return check.kind === "list-shape"
    ? listFailureMessage(check, context)
    : check.feedback
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
      message: failureMessage(check, context),
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
    failures,
    checkedSource: context.source,
  }
}
