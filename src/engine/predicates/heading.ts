import type { Root } from "mdast"
import type { MatchCheck } from "../../content/types"
import { headingsAtLevel, isHashHeading } from "../markdownAst"

type HeadingCheck = Extract<
  MatchCheck,
  { kind: "heading-spacing" | "hash-heading-style" | "has-heading" }
>

function hasMalformedHeadingSpacing(source: string): boolean {
  return source
    .split(/\r?\n/)
    .some((line) => /^ {0,3}#{1,6}(?=[^ \t\r\n#])/.test(line))
}

function matchingHashHeadings(source: string, root: Root, check: HeadingCheck) {
  return headingsAtLevel(root, check.level).filter((heading) =>
    isHashHeading(source, heading),
  )
}

export function headingCheckPasses(
  check: HeadingCheck,
  source: string,
  root: Root,
): boolean {
  const hasRequestedHashHeading = matchingHashHeadings(source, root, check).length > 0

  switch (check.kind) {
    case "heading-spacing":
      return hasRequestedHashHeading || !hasMalformedHeadingSpacing(source)
    case "hash-heading-style":
      return (
        hasRequestedHashHeading ||
        !headingsAtLevel(root, check.level).some(
          (heading) => !isHashHeading(source, heading),
        )
      )
    case "has-heading":
      return hasRequestedHashHeading
  }
}
