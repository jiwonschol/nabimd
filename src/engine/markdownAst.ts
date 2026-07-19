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

export function isClosedFencedCode(source: string, code: Code): boolean {
  const startOffset = code.position?.start.offset
  const endOffset = code.position?.end.offset
  if (startOffset === undefined || endOffset === undefined) return false

  const lines = source.slice(startOffset, endOffset).split(/\r\n?|\n/)
  const opener = lines[0]?.match(/^ {0,3}(`{3,}|~{3,})/)
  if (!opener) return false

  const marker = opener[1]![0]!
  const minimumLength = opener[1]!.length
  const closingFence = new RegExp(
    `^[ \\t>]*${marker === "`" ? "`" : "~"}{${minimumLength},}[ \\t]*$`,
  )
  const lastSourceLine = lines.at(-1) ?? ""
  if (!closingFence.test(lastSourceLine)) return false

  // Container markers and continuation indentation remain in the source slice,
  // while mdast excludes a real closing fence from the code value. Guarding
  // against the value's final line prevents an unclosed block whose literal
  // content merely looks like a blockquote/list-prefixed fence from passing.
  const lastValueLine = code.value.split(/\r\n?|\n/).at(-1) ?? ""
  return !closingFence.test(lastValueLine)
}
