import type { Heading, Root } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"

export function parseMarkdown(source: string): Root {
  return fromMarkdown(source)
}

export function headingsAtLevel(root: Root, level: Heading["depth"]): Heading[] {
  return root.children.filter(
    (node): node is Heading =>
      node.type === "heading" && node.depth === level,
  )
}

export function isHashHeading(source: string, heading: Heading): boolean {
  const startOffset = heading.position?.start.offset
  const endOffset = heading.position?.end.offset

  if (startOffset === undefined || endOffset === undefined) return false

  const headingSource = source.slice(startOffset, endOffset)
  return /^ {0,3}#(?:[ \t]+|$)/.test(headingSource)
}
