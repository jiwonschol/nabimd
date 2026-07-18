import type { Root } from "mdast"
import type { MatchCheck, Problem } from "../content/types"
import {
  headingsAtLevel,
  isHashHeading,
} from "./markdownAst"
import type { MatchFailure } from "./types"

function hasMalformedHeadingSpacing(source: string, check: MatchCheck): boolean {
  if (check.kind !== "heading-spacing") return false

  return source
    .split(/\r?\n/)
    .some((line) => /^ {0,3}#(?!#)(?=[^ \t\r\n])/.test(line))
}

function matchingHashHeadings(source: string, root: Root, check: MatchCheck) {
  if (!("level" in check)) return []

  return headingsAtLevel(root, check.level).filter((heading) =>
    isHashHeading(source, heading),
  )
}

function hasRequestedHashHeading(
  source: string,
  root: Root,
  check: MatchCheck,
): boolean {
  return matchingHashHeadings(source, root, check).length > 0
}

function checkPasses(check: MatchCheck, source: string, root: Root): boolean {
  switch (check.kind) {
    case "heading-spacing":
      return (
        hasRequestedHashHeading(source, root, check) ||
        !hasMalformedHeadingSpacing(source, check)
      )
    case "hash-heading-style":
      return (
        hasRequestedHashHeading(source, root, check) ||
        !headingsAtLevel(root, check.level).some(
          (heading) => !isHashHeading(source, heading),
        )
      )
    case "has-heading":
      return hasRequestedHashHeading(source, root, check)
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
