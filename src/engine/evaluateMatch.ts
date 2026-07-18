import type { Root } from "mdast"
import type { MatchCheck, Problem } from "../content/types"
import { documentText, headingsAtLevel, nodeText } from "./markdownAst"
import type { MatchFailure } from "./types"

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function hasMalformedHeadingSpacing(source: string, check: MatchCheck): boolean {
  if (check.kind !== "heading-spacing") return false

  return source.split(/\r?\n/).some((line) => {
    const trimmedLine = line.trim()
    return (
      trimmedLine === `#${check.text}` ||
      trimmedLine === `#${check.text} #`
    )
  })
}

function checkPasses(check: MatchCheck, source: string, root: Root): boolean {
  switch (check.kind) {
    case "heading-spacing":
      return !hasMalformedHeadingSpacing(source, check)
    case "preserves-text":
      return normalizeText(documentText(root)).includes(
        normalizeText(check.text),
      )
    case "has-heading":
      return headingsAtLevel(root, check.level).some(
        (heading) =>
          normalizeText(nodeText(heading)) === normalizeText(check.text),
      )
  }
}

export function evaluateMatch(
  problem: Problem,
  source: string,
  root: Root,
): MatchFailure | null {
  const checksByPriority = [...problem.matchChecks].sort(
    (left, right) => left.priority - right.priority,
  )

  for (const check of checksByPriority) {
    if (!checkPasses(check, source, root)) {
      return {
        status: "fail",
        feedbackId: check.id,
        message: check.feedback,
      }
    }
  }

  return null
}
