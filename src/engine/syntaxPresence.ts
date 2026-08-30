import type { SyntaxPresenceKind } from "../content/types"
import {
  descendants,
  type AstNode,
  type EvaluationContext,
} from "./evaluationContext"

type PositionedSyntaxNode = AstNode & {
  lang?: string | null
  title?: string | null
  url?: string
  data?: { hProperties?: { id?: unknown } }
  position?: {
    start: { offset?: number }
    end: { offset?: number }
  }
}

function rawSource(node: PositionedSyntaxNode, source: string): string {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  return start === undefined || end === undefined
    ? ""
    : source.slice(start, end)
}

function containsDescendant(node: AstNode, type: string): boolean {
  return descendants(node.children ?? []).some(
    (candidate) => candidate.type === type,
  )
}

function isNestedBlockquote(node: AstNode): boolean {
  return node.type === "blockquote" && containsDescendant(node, "blockquote")
}

function isListWithBlock(node: AstNode): boolean {
  if (node.type !== "listItem" || !node.children) return false
  return (
    node.children.length > 1 &&
    node.children.some(
      (child) => child.type !== "paragraph" && child.type !== "list",
    )
  )
}

function countEscapes(source: string): number {
  return source.match(/\\[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g)?.length ?? 0
}

export function countSyntaxPresence(
  context: EvaluationContext,
  syntax: SyntaxPresenceKind,
): number {
  const nodes = descendants(context.root.children as AstNode[]) as PositionedSyntaxNode[]

  switch (syntax) {
    case "bold-italic":
      return nodes.filter(
        (node) =>
          (node.type === "strong" && containsDescendant(node, "emphasis")) ||
          (node.type === "emphasis" && containsDescendant(node, "strong")),
      ).length
    case "strikethrough":
      return nodes.filter((node) => node.type === "delete").length
    case "nested-blockquote":
      return nodes.filter(isNestedBlockquote).length
    case "code-block-language":
      return nodes.filter(
        (node) => node.type === "code" && Boolean(node.lang?.trim()),
      ).length
    case "hard-line-break":
      return nodes.filter((node) => node.type === "break").length
    case "automatic-url":
      return nodes.filter((node) => {
        if (node.type !== "link") return false
        const raw = rawSource(node, context.source)
        return !raw.startsWith("<") && /^(?:https?:\/\/|www\.)/.test(raw)
      }).length
    case "link-title":
      return nodes.filter(
        (node) =>
          node.type === "link" &&
          rawSource(node, context.source).startsWith("[") &&
          Boolean(node.title?.trim()),
      ).length
    case "angle-bracket-url":
      return nodes.filter((node) => {
        if (node.type !== "link") return false
        const raw = rawSource(node, context.source)
        return raw.startsWith("<") && !String(node.url ?? "").startsWith("mailto:")
      }).length
    case "angle-bracket-email":
      return nodes.filter(
        (node) =>
          node.type === "link" &&
          rawSource(node, context.source).startsWith("<") &&
          String(node.url ?? "").startsWith("mailto:"),
      ).length
    case "escape":
      return countEscapes(context.source)
    case "list-with-block":
      return nodes.filter(isListWithBlock).length
    case "footnote":
      return nodes.filter(
        (node) =>
          node.type === "footnoteDefinition" ||
          node.type === "footnoteReference",
      ).length
    case "heading-id":
      return nodes.filter(
        (node) =>
          node.type === "heading" &&
          typeof node.data?.hProperties?.id === "string",
      ).length
  }
}
