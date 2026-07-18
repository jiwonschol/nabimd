import type { Code, Heading, List, RootContent } from "mdast"
import type {
  BlockKind,
  BlockSelector,
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

function blockMatches(node: RootContent, selector: BlockSelector): boolean {
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
  const count = nodesInScope(context, check.scope).filter((node) =>
    blockMatches(node, { block: check.block, depth: check.depth }),
  ).length
  return inRange(count, check.min, check.max)
}

function inlinePresencePasses(
  check: Extract<StructuralCheck, { kind: "inline-presence" }>,
  context: EvaluationContext,
) {
  const count = descendants(nodesInScope(context, check.scope) as AstNode[])
    .filter((node) => node.type === nodeTypeByInline[check.inline]).length
  return inRange(count, check.min, check.max)
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
  const lists = nodesInScope(context, check.scope).filter(
    (node): node is List => node.type === "list",
  )
  return lists.some((list) => {
    const ordered = Boolean(list.ordered)
    return (
      (check.ordered === "either" || check.ordered === ordered) &&
      inRange(list.children.length, check.minItems, check.maxItems)
    )
  })
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
