import type { Code, Heading, Root } from "mdast"
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
  const openingHashes = `#{${heading.depth}}`
  return new RegExp(`^ {0,3}${openingHashes}(?:[ \\t]+|$)`).test(
    headingSource,
  )
}

export function isFencedCode(source: string, code: Code): boolean {
  const startOffset = code.position?.start.offset
  const endOffset = code.position?.end.offset
  if (startOffset === undefined || endOffset === undefined) return false

  return /^ {0,3}(?:`{3,}|~{3,})/.test(source.slice(startOffset, endOffset))
}
