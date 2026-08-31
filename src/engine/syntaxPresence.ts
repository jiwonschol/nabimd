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

function countBoldItalicSegments(
  nodes: readonly AstNode[],
  effectiveFootnoteDefinitions: ReadonlySet<AstNode>,
  insideStrong = false,
  insideEmphasis = false,
): number {
  return nodes.reduce((count, node) => {
    if (
      node.type === "footnoteDefinition" &&
      !effectiveFootnoteDefinitions.has(node)
    ) return count
    const segment =
      (node.type === "strong" && insideEmphasis) ||
      (node.type === "emphasis" && insideStrong)
    return count + (segment ? 1 : 0) + countBoldItalicSegments(
      node.children ?? [],
      effectiveFootnoteDefinitions,
      insideStrong || node.type === "strong",
      insideEmphasis || node.type === "emphasis",
    )
  }, 0)
}

function effectiveReferencedFootnoteDefinitions(root: AstNode): Set<AstNode> {
  const referencedFootnotes = referencedFootnoteIdentifiers(root)
  const definitions = new Map<string, AstNode>()
  for (const node of descendants(root.children ?? []) as PositionedSyntaxNode[]) {
    if (
      node.type === "footnoteDefinition" &&
      node.identifier &&
      referencedFootnotes.has(node.identifier) &&
      !definitions.has(node.identifier)
    ) {
      definitions.set(node.identifier, node)
    }
  }
  return new Set(definitions.values())
}

function referencedFootnoteIdentifiers(root: AstNode): Set<string> {
  const definitions = new Map<string, PositionedSyntaxNode>()
  const referencedFootnotes = new Set<string>()
  const collectTopLevelReferences = (
    nodes: readonly AstNode[],
    insideDefinition = false,
  ): void => {
    for (const node of nodes as readonly PositionedSyntaxNode[]) {
      if (
        node.type === "footnoteDefinition" &&
        node.identifier &&
        !definitions.has(node.identifier)
      ) {
        definitions.set(node.identifier, node)
      }
      if (node.type === "footnoteReference" && !insideDefinition && node.identifier) {
        referencedFootnotes.add(node.identifier)
      }
      collectTopLevelReferences(
        node.children ?? [],
        insideDefinition || node.type === "footnoteDefinition",
      )
    }
  }
  collectTopLevelReferences(root.children ?? [])

  const queue = [...referencedFootnotes]
  for (let index = 0; index < queue.length; index += 1) {
    const definition = definitions.get(queue[index]!)
    if (!definition) continue
    for (const node of descendants(definition.children ?? []) as PositionedSyntaxNode[]) {
      if (
        node.type === "footnoteReference" &&
        node.identifier &&
        !referencedFootnotes.has(node.identifier)
      ) {
        referencedFootnotes.add(node.identifier)
        queue.push(node.identifier)
      }
    }
  }
  return referencedFootnotes
}

function syntaxNodes(root: AstNode): PositionedSyntaxNode[] {
  const all = descendants(root.children ?? []) as PositionedSyntaxNode[]
  const effectiveFootnoteDefinitions = effectiveReferencedFootnoteDefinitions(root)
  const hiddenDefinitions = new Set(
    all.filter(
      (node) =>
        node.type === "footnoteDefinition" &&
        !effectiveFootnoteDefinitions.has(node),
    ),
  )
  const hiddenRanges = all.flatMap((node) => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    return hiddenDefinitions.has(node) &&
      start !== undefined &&
      end !== undefined
      ? [{ start, end }]
      : []
  })
  return all.filter((node) => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    return !hiddenDefinitions.has(node) && (
      start === undefined || end === undefined || !hiddenRanges.some(
      (range) => start >= range.start && end <= range.end,
      )
    )
  })
}

function countNestedBlockquotes(
  nodes: readonly AstNode[],
  effectiveFootnoteDefinitions: ReadonlySet<AstNode>,
  insideBlockquote = false,
): number {
  return nodes.reduce((count, node) => {
    if (
      node.type === "footnoteDefinition" &&
      !effectiveFootnoteDefinitions.has(node)
    ) return count
    const isNested = node.type === "blockquote" && insideBlockquote
    return (
      count +
      (isNested ? 1 : 0) +
      countNestedBlockquotes(
        node.children ?? [],
        effectiveFootnoteDefinitions,
        insideBlockquote || node.type === "blockquote",
      )
    )
  }, 0)
}

function isListWithBlock(node: AstNode): boolean {
  if (node.type !== "listItem" || !node.children) return false
  return node.children.some(
    (child, index) =>
      child.type !== "list" &&
      child.type !== "definition" &&
      child.type !== "footnoteDefinition" &&
      (index > 0 || child.type !== "paragraph"),
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
  const offsets = new Set<number>()
  const literalRanges = nodes.flatMap((node) => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    return (node.type === "inlineCode" || node.type === "code") &&
      start !== undefined && end !== undefined
      ? [{ start, end }]
      : []
  })
  const autolinkRanges = nodes.flatMap((node) => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    return node.type === "link" &&
      start !== undefined &&
      end !== undefined &&
      /^(?:<|https?:\/\/|www\.)/i.test(source.slice(start, end))
      ? [{ start, end }]
      : []
  })
  const referencedDefinitionIdentifiers = new Set(
    nodes.flatMap((node) =>
      (node.type === "linkReference" || node.type === "imageReference") &&
      node.identifier
        ? [node.identifier]
        : [],
    ),
  )
  const effectiveDefinitions = new Map<string, PositionedSyntaxNode>()
  for (const node of nodes) {
    if (
      node.type === "definition" &&
      node.identifier &&
      !effectiveDefinitions.has(node.identifier)
    ) {
      effectiveDefinitions.set(node.identifier, node)
    }
  }
  for (const node of nodes) {
    const fullRaw = rawSource(node, source)
    const raw = node.type === "image" || node.type === "imageReference"
      ? fullRaw.match(/^!?\[(?:\\.|[^\]])*\]/)?.[0] ?? ""
      : node.type === "footnoteDefinition"
        ? fullRaw.match(/^(?: {0,3})\[\^(?:\\.|[^\]])+\]:/)?.[0] ?? ""
        : node.type === "definition"
          ? fullRaw.match(/^(?: {0,3})\[(?:\\.|[^\]])+\]:/)?.[0] ?? ""
        : fullRaw
    const syntaxBearingRange =
      node.type === "text" ||
      node.type === "image" ||
      node.type === "imageReference" ||
      (node.type === "definition" &&
        Boolean(node.identifier) &&
        referencedDefinitionIdentifiers.has(node.identifier!) &&
        effectiveDefinitions.get(node.identifier!) === node)
    if (!syntaxBearingRange) continue
    const start = node.position?.start.offset
    if (start === undefined) continue
    for (const match of raw.matchAll(
      /\\[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g,
    )) {
      if (match.index === undefined) continue
      const offset = start + match.index
      if (
        !literalRanges.some(
          (range) => offset >= range.start && offset < range.end,
        ) &&
        !autolinkRanges.some(
          (range) => offset >= range.start && offset < range.end,
        )
      ) {
        offsets.add(offset)
      }
    }
  }
  return offsets.size
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
  const nodes = syntaxNodes(context.root as AstNode)

  switch (syntax) {
    case "bold-italic":
      return countBoldItalicSegments(
        context.root.children as AstNode[],
        effectiveReferencedFootnoteDefinitions(context.root as AstNode),
      )
    case "strikethrough":
      return nodes.filter((node) => node.type === "delete").length
    case "nested-blockquote":
      return countNestedBlockquotes(
        context.root.children as AstNode[],
        effectiveReferencedFootnoteDefinitions(context.root as AstNode),
      )
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
            node.title !== null && node.title !== undefined,
        ).length
        const referencedIdentifiers = new Set<string>(
          nodes
            .filter((node) => node.type === "linkReference")
            .flatMap((node) => node.identifier ? [node.identifier] : []),
        )
        const effectiveDefinitions = new Map<string, PositionedSyntaxNode>()
        for (const node of nodes) {
          if (node.type === "definition" && node.identifier && !effectiveDefinitions.has(node.identifier)) {
            effectiveDefinitions.set(node.identifier, node)
          }
        }
        const referencedDefinitionTitles = [...referencedIdentifiers].filter(
          (identifier) => {
            const title = effectiveDefinitions.get(identifier)?.title
            return title !== null && title !== undefined
          },
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
