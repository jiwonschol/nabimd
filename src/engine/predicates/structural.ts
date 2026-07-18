import type { Code, Heading, List, ListItem, RootContent } from "mdast"
import type {
  BlockKind,
  BlockSelector,
  CheckScope,
  InlineKind,
  MatchCheck,
} from "../../content/types"
import {
  descendants,
  nodesInScope,
  type AstNode,
  type EvaluationContext,
} from "../evaluationContext"
import { isFencedCode } from "../markdownAst"

type StructuralCheck = Exclude<
  MatchCheck,
  { kind: "heading-spacing" | "hash-heading-style" | "has-heading" }
>

const nodeTypeByBlock: Readonly<Record<BlockKind, RootContent["type"]>> = {
  heading: "heading",
  paragraph: "paragraph",
  list: "list",
  code: "code",
  blockquote: "blockquote",
  "thematic-break": "thematicBreak",
}

const nodeTypeByInline = {
  emphasis: "emphasis",
  strong: "strong",
  "inline-code": "inlineCode",
  link: "link",
  image: "image",
} as const

function inRange(value: number, min?: number, max?: number): boolean {
  return (min === undefined || value >= min) && (max === undefined || value <= max)
}

function blockMatches(node: AstNode, selector: BlockSelector): boolean {
  if (node.type !== nodeTypeByBlock[selector.block]) return false
  return (
    selector.depth === undefined ||
    (node.type === "heading" && node.depth === selector.depth)
  )
}

function blockCountPasses(
  check: Extract<StructuralCheck, { kind: "block-count" }>,
  context: EvaluationContext,
) {
  const count = countBlockNodes(
    context,
    check.scope,
    check.block,
    check.depth,
  )
  return inRange(count, check.min, check.max)
}

export function countBlockNodes(
  context: EvaluationContext,
  scope: CheckScope,
  block: BlockKind,
  depth?: 1 | 2 | 3 | 4 | 5 | 6,
  recursive = false,
) {
  const scopedNodes = nodesInScope(context, scope)
  const candidateNodes = recursive
    ? descendants(scopedNodes as AstNode[])
    : scopedNodes
  return candidateNodes.filter((node) =>
    blockMatches(node, { block, depth }),
  ).length
}

function inlinePresencePasses(
  check: Extract<StructuralCheck, { kind: "inline-presence" }>,
  context: EvaluationContext,
) {
  const count = countInlineNodes(context, check.scope, check.inline)
  return inRange(count, check.min, check.max)
}

export function countInlineNodes(
  context: EvaluationContext,
  scope: CheckScope,
  inline: InlineKind,
) {
  return descendants(nodesInScope(context, scope) as AstNode[]).filter(
    (node) => node.type === nodeTypeByInline[inline],
  ).length
}

function headingDepthOrderPasses(context: EvaluationContext) {
  return context.headings.every((heading, index) => {
    const previous = context.headings[index - 1]
    return !previous || heading.depth <= previous.depth + 1
  })
}

function listShapePasses(
  check: Extract<StructuralCheck, { kind: "list-shape" }>,
  context: EvaluationContext,
) {
  const scopedNodes = nodesInScope(context, check.scope)
  const candidates = check.recursive
    ? collectListCandidates(scopedNodes as AstNode[])
    : scopedNodes
        .filter((node): node is List => node.type === "list")
        .map((list) => ({ list, ancestorListOrders: [] }))
  return candidates.some(({ list, ancestorListOrders }) => {
    const ordered = Boolean(list.ordered)
    return (
      (check.ordered === "either" || check.ordered === ordered) &&
      (check.ordered === "either" ||
        ancestorListOrders.every((ancestorOrder) => ancestorOrder === ordered)) &&
      inRange(list.children.length, check.minItems, check.maxItems) &&
      (!check.requireNonemptyItems || list.children.every(listItemHasContent))
    )
  })
}

function collectListCandidates(nodes: readonly AstNode[]) {
  const candidates: { list: List; ancestorListOrders: readonly boolean[] }[] = []

  function visit(node: AstNode, ancestorListOrders: readonly boolean[]) {
    const nextAncestorOrders =
      node.type === "list"
        ? [...ancestorListOrders, Boolean((node as List).ordered)]
        : ancestorListOrders

    if (node.type === "list") {
      candidates.push({ list: node as List, ancestorListOrders })
    }
    node.children?.forEach((child) => visit(child, nextAncestorOrders))
  }

  nodes.forEach((node) => visit(node, []))
  return candidates
}

function listItemHasContent(item: ListItem): boolean {
  return (item.children as AstNode[]).some(nodeHasNonListContent)
}

function nodeHasNonListContent(node: AstNode): boolean {
  if (node.type === "list") return false
  if (
    [node.value, node.alt].some(
      (content) => typeof content === "string" && content.trim().length > 0,
    )
  ) {
    return true
  }
  return node.children?.some(nodeHasNonListContent) ?? false
}

function codeBlockPasses(
  check: Extract<StructuralCheck, { kind: "code-block" }>,
  context: EvaluationContext,
) {
  const blocks = descendants(nodesInScope(context, check.scope) as AstNode[])
    .filter((node): node is Code => node.type === "code")
    .filter((node) => !check.requireLanguageTag || Boolean(node.lang?.trim()))
    .filter((node) => !check.requireFenced || isFencedCode(context.source, node))
  return inRange(blocks.length, check.min, check.max)
}

function blockSequencePasses(
  check: Extract<StructuralCheck, { kind: "block-sequence" }>,
  context: EvaluationContext,
) {
  const nodes = nodesInScope(context, check.scope)
  if (check.exact) {
    return (
      nodes.length === check.sequence.length &&
      nodes.every((node, index) => blockMatches(node, check.sequence[index]!))
    )
  }

  let sequenceIndex = 0
  for (const node of nodes) {
    const selector = check.sequence[sequenceIndex]
    if (selector && blockMatches(node, selector)) sequenceIndex += 1
  }
  return sequenceIndex === check.sequence.length
}

function documentLimitsPasses(
  check: Extract<StructuralCheck, { kind: "document-limits" }>,
  context: EvaluationContext,
) {
  return (
    inRange(context.blocks.length, check.minBlocks, check.maxBlocks) &&
    inRange(context.lineCount, check.minLines, check.maxLines) &&
    inRange(
      context.sourceCharacterCount,
      check.minSourceCharacters,
      check.maxSourceCharacters,
    )
  )
}

export function structuralCheckPasses(
  check: StructuralCheck,
  context: EvaluationContext,
): boolean {
  switch (check.kind) {
    case "block-count":
      return blockCountPasses(check, context)
    case "inline-presence":
      return inlinePresencePasses(check, context)
    case "heading-depth-order":
      return headingDepthOrderPasses(context)
    case "list-shape":
      return listShapePasses(check, context)
    case "code-block":
      return codeBlockPasses(check, context)
    case "block-sequence":
      return blockSequencePasses(check, context)
    case "document-limits":
      return documentLimitsPasses(check, context)
  }
}
