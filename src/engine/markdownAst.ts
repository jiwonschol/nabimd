import type { Heading, Root, RootContent } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"

export function parseMarkdown(source: string): Root {
  return fromMarkdown(source)
}

export function nodeText(node: Root | RootContent): string {
  if ("value" in node && typeof node.value === "string") {
    return node.value
  }

  if ("children" in node) {
    return node.children.map((child) => nodeText(child)).join("")
  }

  return ""
}

export function documentText(root: Root): string {
  return root.children.map((child) => nodeText(child)).join("\n")
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

function semanticValue(key: string, value: unknown): unknown {
  if (key === "position") return undefined
  if (key === "value" && typeof value === "string") {
    return value.replace(/\s+/g, " ").trim()
  }
  if (Array.isArray(value)) {
    return value.map((item) => semanticValue("", item))
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([childKey, childValue]) => [
          childKey,
          semanticValue(childKey, childValue),
        ])
        .filter(([, childValue]) => childValue !== undefined),
    )
  }
  return value
}

export function hasSameRenderedSemantics(left: Root, right: Root): boolean {
  return JSON.stringify(semanticValue("", left)) === JSON.stringify(semanticValue("", right))
}
