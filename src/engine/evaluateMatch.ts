import type { Root } from "mdast"
import type { MatchCheck, Problem } from "../content/types"
import {
  documentText,
  headingsAtLevel,
  isHashHeading,
  nodeText,
} from "./markdownAst"
import type { MatchFailure } from "./types"

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function hasMalformedHeadingSpacing(source: string, check: MatchCheck): boolean {
  if (check.kind !== "heading-spacing") return false

  return source
    .split(/\r?\n/)
    .some((line) => /^ {0,3}#(?!#)(?=[^ \t\r\n])/.test(line))
}

function matchingHashHeadings(source: string, root: Root, check: MatchCheck) {
  if (!("level" in check) || !("text" in check)) return []

  return headingsAtLevel(root, check.level).filter(
    (heading) => isHashHeading(source, heading),
  )
}

function hasRequestedHashHeading(
  source: string,
  root: Root,
  check: MatchCheck,
): boolean {
  return matchingHashHeadings(source, root, check).some(
    (heading) => normalizeText(nodeText(heading)) === normalizeText(check.text),
  )
}

function checkPasses(check: MatchCheck, source: string, root: Root): boolean {
  switch (check.kind) {
    case "heading-spacing":
      return (
        hasRequestedHashHeading(source, root, check) ||
        !hasMalformedHeadingSpacing(source, check)
      )
    case "heading-capitalization": {
      if (hasRequestedHashHeading(source, root, check)) return true

      const exact = normalizeText(check.text)
      const expected = normalizeText(check.text).toLocaleLowerCase()
      return !headingsAtLevel(root, check.level).some((heading) => {
        const actual = normalizeText(nodeText(heading))
        return actual !== exact && actual.toLocaleLowerCase() === expected
      })
    }
    case "preserves-text":
      return normalizeText(documentText(root)).includes(
        normalizeText(check.text),
      )
    case "hash-heading-style":
      return (
        hasRequestedHashHeading(source, root, check) ||
        !headingsAtLevel(root, check.level).some(
          (heading) =>
            normalizeText(nodeText(heading)) === normalizeText(check.text) &&
            !isHashHeading(source, heading),
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
