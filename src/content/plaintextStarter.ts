import type { Nodes, Parents } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"

const unicodeSpaces = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g
const zeroWidthCharacters = /[\u200b-\u200d\u2060\ufeff]/g

function isParent(node: Nodes): node is Parents {
  return "children" in node
}

function visibleChildren(node: Parents, separator: string): string {
  return node.children
    .map((child) => visibleText(child as Nodes))
    .filter((value) => value.length > 0)
    .join(separator)
}

function visibleText(node: Nodes): string {
  switch (node.type) {
    case "root":
    case "blockquote":
      return visibleChildren(node, "\n\n")
    case "list":
    case "listItem":
      return visibleChildren(node, "\n")
    case "heading":
    case "paragraph":
    case "emphasis":
    case "strong":
    case "link":
    case "linkReference":
      return visibleChildren(node, "")
    case "text":
    case "inlineCode":
    case "code":
      return node.value
    case "image":
    case "imageReference":
      return node.alt ?? ""
    case "break":
      return "\n"
    case "definition":
    case "html":
    case "thematicBreak":
      return ""
    default:
      return isParent(node) ? visibleChildren(node, "") : ""
  }
}

function normalizePlaintext(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(unicodeSpaces, " ")
    .replace(zeroWidthCharacters, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function derivePlaintextStarter(target: string): string {
  return normalizePlaintext(visibleText(fromMarkdown(target)))
}
