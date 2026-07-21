import type { RootContent } from "mdast"
import type { GradableProblem, MatchCheck } from "../content/types"
import {
  createEvaluationContext,
  descendants,
  nodesInScope,
  type AstNode,
  type EvaluationContext,
} from "./evaluationContext"
import type { MatchDiagnostic, SourceRange } from "./types"
import {
  countBlockNodes,
  structuralCheckPasses,
} from "./predicates/structural"

type PositionedNode = AstNode & {
  ordered?: boolean | null
  position?: {
    start: { offset?: number }
    end: { offset?: number }
  }
}

const blockType = {
  heading: "heading",
  paragraph: "paragraph",
  list: "list",
  code: "code",
  blockquote: "blockquote",
  "thematic-break": "thematicBreak",
} as const

const inlineType = {
  emphasis: "emphasis",
  strong: "strong",
  "inline-code": "inlineCode",
  link: "link",
  image: "image",
} as const

function rangeFor(node: PositionedNode | undefined): SourceRange | null {
  const start = node?.position?.start.offset
  const end = node?.position?.end.offset
  return start === undefined || end === undefined ? null : { start, end }
}

function nodeText(node: AstNode): string {
  if (typeof node.value === "string") return node.value
  return node.children?.map(nodeText).join("") ?? ""
}

function targetNodeForCheck(
  check: MatchCheck,
  context: EvaluationContext,
): PositionedNode | undefined {
  switch (check.kind) {
    case "heading-spacing":
    case "hash-heading-style":
    case "has-heading":
      return context.headings.find((heading) => heading.depth === check.level)
    case "heading-depth-order":
      return context.headings[0]
    case "document-limits":
      return context.blocks[0] as PositionedNode | undefined
    case "block-sequence":
      return nodesInScope(context, check.scope)[0] as PositionedNode | undefined
    case "block-count":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) =>
          node.type === blockType[check.block] &&
          (check.depth === undefined || node.depth === check.depth),
      ) as PositionedNode | undefined
    case "inline-presence":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) => node.type === inlineType[check.inline],
      ) as PositionedNode | undefined
    case "list-shape":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) =>
          node.type === "list" &&
          (check.ordered === "either" ||
            Boolean((node as PositionedNode).ordered) === check.ordered),
      ) as PositionedNode | undefined
    case "blockquote-shape":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) => node.type === "blockquote",
      ) as PositionedNode | undefined
    case "inline-code-shape":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) => node.type === "inlineCode",
      ) as PositionedNode | undefined
    case "link-shape":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) => node.type === "link" || node.type === "linkReference",
      ) as PositionedNode | undefined
    case "code-block":
      return descendants(nodesInScope(context, check.scope) as AstNode[]).find(
        (node) => node.type === "code",
      ) as PositionedNode | undefined
  }
}

function containingBlockIndex(
  blocks: readonly RootContent[],
  range: SourceRange | null,
): number | null {
  if (!range) return null
  const index = blocks.findIndex((block) => {
    const blockRange = rangeFor(block as PositionedNode)
    return Boolean(
      blockRange &&
      blockRange.start <= range.start &&
      blockRange.end >= range.end,
    )
  })
  return index < 0 ? null : index
}

function nearestHeadingLocation(
  context: EvaluationContext,
  blockIndex: number | null,
): string {
  if (blockIndex === null) return "Document"
  for (let index = blockIndex; index >= 0; index -= 1) {
    const block = context.blocks[index]
    if (block?.type !== "heading") continue
    if (block.depth === 1 && index === blockIndex) return "Document title"
    if (block.depth >= 2) return `In “${nodeText(block as AstNode)}”`
  }
  return "Document"
}

function locationForCheck(
  check: MatchCheck,
  context: EvaluationContext,
  blockIndex: number | null,
): string {
  if ("scope" in check && check.scope.kind === "section") {
    const scope = check.scope
    const section = context.sections.find(
      (candidate) =>
        candidate.headingDepth === scope.headingDepth &&
        candidate.occurrence === scope.occurrence,
    )
    if (section) return `In “${nodeText(section.heading as AstNode)}”`
  }
  return nearestHeadingLocation(context, blockIndex)
}

function syntaxSource(
  check: MatchCheck,
  target: string,
  range: SourceRange | null,
): string | null {
  if (!range) return null
  const raw = target.slice(range.start, range.end)

  switch (check.kind) {
    case "heading-spacing":
    case "hash-heading-style":
    case "has-heading":
    case "inline-presence":
    case "inline-code-shape":
    case "link-shape":
      return raw
    case "list-shape":
    case "blockquote-shape":
      return raw.split(/\r?\n/)[0] ?? raw
    case "code-block":
      return raw
    case "block-count":
      return check.block === "thematic-break" && (check.min ?? 0) > 0
        ? raw
        : null
    case "heading-depth-order":
    case "block-sequence":
    case "document-limits":
      return null
  }
}

function isAggregate(check: MatchCheck): boolean {
  if (
    check.kind === "block-sequence" ||
    check.kind === "document-limits" ||
    check.kind === "heading-depth-order"
  ) {
    return true
  }
  return check.kind === "block-count" && !(
    check.block === "thematic-break" && (check.min ?? 0) > 0
  )
}

function isMisplacedScopedRequirement(
  check: MatchCheck,
  learner: EvaluationContext,
): boolean {
  if (!("scope" in check) || check.scope.kind === "document") return false
  switch (check.kind) {
    case "inline-presence":
    case "list-shape":
    case "blockquote-shape":
    case "inline-code-shape":
    case "link-shape":
    case "code-block":
      return structuralCheckPasses(
        { ...check, scope: { kind: "document" } },
        learner,
      )
    default:
      return false
  }
}

function nodeMatchesSelector(
  node: RootContent | undefined,
  selector: Extract<MatchCheck, { kind: "block-sequence" }>["sequence"][number],
): boolean {
  return Boolean(
    node &&
    node.type === blockType[selector.block] &&
    (selector.depth === undefined ||
      (node.type === "heading" && node.depth === selector.depth)),
  )
}

function sequenceMismatchRange(
  check: Extract<MatchCheck, { kind: "block-sequence" }>,
  learner: EvaluationContext,
): SourceRange | null {
  const nodes = nodesInScope(learner, check.scope)
  const mismatchIndex = check.sequence.findIndex(
    (selector, index) => !nodeMatchesSelector(nodes[index], selector),
  )
  if (mismatchIndex >= 0) {
    return rangeFor(nodes[mismatchIndex] as PositionedNode | undefined)
  }
  if (check.exact && nodes.length > check.sequence.length) {
    return rangeFor(nodes[check.sequence.length] as PositionedNode | undefined)
  }
  return null
}

function alignedObservedRange(
  target: EvaluationContext,
  learner: EvaluationContext,
  targetBlockIndex: number | null,
): SourceRange | null {
  if (
    targetBlockIndex === null ||
    target.blocks.length !== learner.blocks.length
  ) {
    return null
  }

  const hasOtherShapeMismatch = target.blocks.some((block, index) => {
    if (index === targetBlockIndex) return false
    const candidate = learner.blocks[index]
    if (!candidate || candidate.type !== block.type) return true
    return (
      block.type === "heading" &&
      (candidate.type !== "heading" || candidate.depth !== block.depth)
    )
  })
  if (hasOtherShapeMismatch) return null

  return rangeFor(learner.blocks[targetBlockIndex] as PositionedNode | undefined)
}

function reasonFor(
  check: MatchCheck,
  learner: EvaluationContext,
  observedRange: SourceRange | null,
) {
  if (check.kind === "document-limits") {
    const exceedsMaximum =
      (check.maxBlocks !== undefined &&
        learner.blocks.length > check.maxBlocks) ||
      (check.maxLines !== undefined && learner.lineCount > check.maxLines) ||
      (check.maxSourceCharacters !== undefined &&
        learner.sourceCharacterCount > check.maxSourceCharacters)
    return exceedsMaximum ? "extra" as const : "missing" as const
  }
  if (check.kind === "block-count") {
    const count = countBlockNodes(
      learner,
      check.scope,
      check.block,
      check.depth,
      check.recursive,
    )
    if (check.max !== undefined && count > check.max) return "extra" as const
    if (check.min !== undefined && count < check.min) return "missing" as const
  }
  return observedRange ? "malformed" as const : "missing" as const
}

export function diagnoseMatchFailure(
  problem: GradableProblem,
  check: MatchCheck,
  learner: EvaluationContext,
  declarationIndex: number,
): MatchDiagnostic {
  const target = createEvaluationContext(problem.target)
  const expectedNode = targetNodeForCheck(check, target)
  const expectedRange = rangeFor(expectedNode)
  const targetBlockIndex = containingBlockIndex(target.blocks, expectedRange)
  const observedRange = check.kind === "block-sequence"
    ? sequenceMismatchRange(check, learner)
    : alignedObservedRange(target, learner, targetBlockIndex)

  return {
    classification:
      isAggregate(check) || isMisplacedScopedRequirement(check, learner)
        ? "aggregate"
        : "specific",
    reason: reasonFor(check, learner, observedRange),
    slotId: check.id,
    slotOrder: expectedRange?.start ?? problem.target.length + declarationIndex,
    location: locationForCheck(check, target, targetBlockIndex),
    expectedRange,
    expectedSource: syntaxSource(check, problem.target, expectedRange),
    observedRange,
  }
}
