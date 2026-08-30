import type { SyntaxPresenceKind } from "../content/types"
import {
  descendants,
  type AstNode,
  type EvaluationContext,
} from "./evaluationContext"

type PositionedSyntaxNode = AstNode & {
  identifier?: string
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

function countNestedBlockquotes(
  nodes: readonly AstNode[],
  insideBlockquote = false,
): number {
  return nodes.reduce((count, node) => {
    const isNested = node.type === "blockquote" && insideBlockquote
    return (
      count +
      (isNested ? 1 : 0) +
      countNestedBlockquotes(
        node.children ?? [],
        insideBlockquote || node.type === "blockquote",
      )
    )
  }, 0)
}

function isListWithBlock(node: AstNode): boolean {
  if (node.type !== "listItem" || !node.children) return false
  return (
    node.children.length > 1 &&
    node.children.slice(1).some((child) => child.type !== "list")
  )
}

function isAngleBracketEmail(node: PositionedSyntaxNode, source: string): boolean {
  if (node.type !== "link" || !String(node.url ?? "").startsWith("mailto:")) {
    return false
  }
  const raw = rawSource(node, source)
  return raw.startsWith("<") && !/^<mailto:/i.test(raw)
}

function countEscapes(
  nodes: readonly PositionedSyntaxNode[],
  source: string,
): number {
  return nodes
    .filter((node) => node.type === "text")
    .reduce(
      (count, node) =>
        count +
        (rawSource(node, source).match(
          /\\[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g,
        )?.length ?? 0),
      0,
    )
}

export const supportedSyntaxPresenceKinds = new Set<SyntaxPresenceKind>([
  "bold-italic",
  "strikethrough",
  "nested-blockquote",
  "code-block-language",
  "hard-line-break",
  "automatic-url",
  "link-title",
  "angle-bracket-url",
  "angle-bracket-email",
  "escape",
  "list-with-block",
  "footnote",
])

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
      return countNestedBlockquotes(context.root.children as AstNode[])
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
        return !raw.startsWith("<") && /^(?:https?:\/\/|www\.)/i.test(raw)
      }).length
    case "link-title":
      {
        const inlineTitles = nodes.filter(
          (node) =>
            node.type === "link" &&
            rawSource(node, context.source).startsWith("[") &&
            Boolean(node.title?.trim()),
        ).length
        const referencedIdentifiers = new Set(
          nodes
            .filter((node) => node.type === "linkReference")
            .map((node) => node.identifier),
        )
        const referencedDefinitionTitles = nodes.filter(
          (node) =>
            node.type === "definition" &&
            referencedIdentifiers.has(node.identifier) &&
            Boolean(node.title?.trim()),
        ).length
        return inlineTitles + referencedDefinitionTitles
      }
    case "angle-bracket-url":
      return nodes.filter((node) => {
        if (node.type !== "link") return false
        const raw = rawSource(node, context.source)
        return raw.startsWith("<") && !isAngleBracketEmail(node, context.source)
      }).length
    case "angle-bracket-email":
      return nodes.filter((node) => isAngleBracketEmail(node, context.source)).length
    case "escape":
      return countEscapes(nodes, context.source)
    case "list-with-block":
      return nodes.filter(isListWithBlock).length
    case "footnote":
      {
        const definitions = new Set(
          nodes
            .filter((node) => node.type === "footnoteDefinition")
            .map((node) => node.identifier),
        )
        return new Set(
          nodes
            .filter(
              (node) =>
                node.type === "footnoteReference" &&
                definitions.has(node.identifier),
            )
            .map((node) => node.identifier),
        ).size
      }
    case "heading-id":
      return nodes.filter(
        (node) =>
          node.type === "heading" &&
          typeof node.data?.hProperties?.id === "string",
      ).length
  }
}
