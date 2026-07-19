import type {
  Blockquote,
  Code,
  Definition,
  Heading,
  InlineCode,
  Link,
  LinkReference,
  List,
  ListItem,
  RootContent,
} from "mdast"
import type {
  BlockKind,
  BlockSelector,
  CheckScope,
  InlineKind,
  LinkShapeOptions,
  MatchCheck,
} from "../../content/types"
import {
  descendants,
  nodesInScope,
  type AstNode,
  type EvaluationContext,
} from "../evaluationContext"
import { isClosedFencedCode, isFencedCode } from "../markdownAst"

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
    check.recursive,
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
  const count = countInlineNodes(
    context,
    check.scope,
    check.inline,
    check.requireNonemptyContent,
  )
  return inRange(count, check.min, check.max)
}

export function countInlineNodes(
  context: EvaluationContext,
  scope: CheckScope,
  inline: InlineKind,
  requireNonemptyContent = false,
) {
  return descendants(nodesInScope(context, scope) as AstNode[]).filter(
    (node) =>
      node.type === nodeTypeByInline[inline] &&
      (!requireNonemptyContent || nodeHasVisibleLinkLabel(node, context.source)),
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
  return candidates
    .filter(
      ({ ancestorListOrders }) =>
        !check.descendantsOnly || ancestorListOrders.length > 0,
    )
    .some(({ list, ancestorListOrders }) => {
      const ordered = Boolean(list.ordered)
      return (
        (check.ordered === "either" || check.ordered === ordered) &&
        (check.ordered === "either" ||
          ancestorListOrders.every(
            (ancestorOrder) => ancestorOrder === ordered,
          )) &&
        inRange(list.children.length, check.minItems, check.maxItems) &&
        (!check.requireNonemptyItems ||
          list.children.every(listItemHasContent)) &&
        (!check.requireVisibleItems ||
          list.children.every((item) =>
            listItemHasVisibleContent(item, context.source),
          ))
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

function listItemHasVisibleContent(item: ListItem, source: string): boolean {
  return (item.children as AstNode[]).some((node) =>
    nodeHasVisibleNonListContent(node, source),
  )
}

function nodeHasVisibleNonListContent(node: AstNode, source: string): boolean {
  if (node.type === "list") return false
  if (node.type === "text") {
    return hasMeaningfulParsedCharacters(
      node.value,
      sourceForNode(node, source),
    )
  }
  if (node.type === "inlineCode") {
    return hasVisibleInlineCodeContent(node as InlineCode, source)
  }
  if (node.type === "code") {
    return codeBlockHasMeaningfulContent(node as Code, source)
  }
  if (
    ["image", "imageReference"].includes(node.type) &&
    hasMeaningfulParsedCharacters(node.alt, rawImageAlt(node, source))
  ) {
    return true
  }
  if (
    ["html", "definition", "thematicBreak", "break"].includes(node.type)
  ) {
    return false
  }
  return (
    node.children?.some((child) =>
      nodeHasVisibleNonListContent(child, source),
    ) ?? false
  )
}

function rawImageAlt(node: AstNode, source: string): string {
  const raw = sourceForNode(node, source)
  if (!raw.startsWith("![")) return ""
  let depth = 1
  for (let index = 2; index < raw.length; index += 1) {
    if (raw[index] === "\\" && index + 1 < raw.length) {
      index += 1
      continue
    }
    if (raw[index] === "[") depth += 1
    if (raw[index] !== "]") continue
    depth -= 1
    if (depth === 0) return raw.slice(2, index)
  }
  return ""
}

function blockquoteShapePasses(
  check: Extract<StructuralCheck, { kind: "blockquote-shape" }>,
  context: EvaluationContext,
) {
  const scopedNodes = nodesInScope(context, check.scope) as AstNode[]
  const candidates = (check.recursive ? descendants(scopedNodes) : scopedNodes)
    .filter((node): node is Blockquote => node.type === "blockquote")
  return candidates.some(
    (blockquote) =>
      !check.requireNonemptyContent || blockquoteHasDirectContent(blockquote),
  )
}

function blockquoteHasDirectContent(blockquote: Blockquote): boolean {
  return (blockquote.children as AstNode[]).some(nodeHasNonBlockquoteContent)
}

function inlineCodeShapePasses(
  check: Extract<StructuralCheck, { kind: "inline-code-shape" }>,
  context: EvaluationContext,
) {
  const candidates = descendants(
    nodesInScope(context, check.scope) as AstNode[],
  ).filter((node): node is InlineCode => node.type === "inlineCode")
  const count = check.requireNonemptyContent
    ? candidates.filter((node) =>
        hasVisibleInlineCodeContent(node, context.source),
      ).length
    : candidates.length
  return inRange(count, check.min, check.max)
}

function hasVisibleInlineCodeContent(node: InlineCode, source: string): boolean {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  const raw =
    typeof start === "number" && typeof end === "number"
      ? source.slice(start, end)
      : ""
  const delimiter = raw.match(/^`+/)?.[0]
  const value =
    delimiter && raw.endsWith(delimiter)
      ? raw.slice(delimiter.length, -delimiter.length)
      : node.value
  return (
    value
      .normalize("NFKC")
      .replace(
        /[\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}\u2800]/gu,
        "",
      )
      .length > 0
  )
}

function linkShapePasses(
  check: Extract<StructuralCheck, { kind: "link-shape" }>,
  context: EvaluationContext,
) {
  const count = countQualifyingLinks(context, check.scope, check)
  return inRange(count, check.min, check.max)
}

export function countQualifyingLinks(
  context: EvaluationContext,
  scope: CheckScope,
  options: LinkShapeOptions,
): number {
  return descendants(nodesInScope(context, scope) as AstNode[])
    .filter(
      (node): node is Link | LinkReference =>
        node.type === "link" || node.type === "linkReference",
    )
    .filter((node) => linkSyntaxAllowed(node, context, options))
    .filter(
      (node) =>
        !options.requireNonemptyLabel ||
        linkHasVisibleLabel(node, context.source),
    ).length
}

function linkSyntaxAllowed(
  link: Link | LinkReference,
  context: EvaluationContext,
  options: LinkShapeOptions,
): boolean {
  if (link.type === "linkReference") {
    if (!options.allowReferences) return false
    if (!options.requireNonemptyDestination) return true
    const definition = firstMatchingDefinition(context, link.identifier)
    return Boolean(
      definition &&
      hasMeaningfulDestination(
        definition.url,
        definitionDestinationSource(definition, context.source),
      ),
    )
  }

  const raw = sourceForNode(link as unknown as AstNode, context.source)
  const isAutolink = raw.startsWith("<")
  if (isAutolink ? !options.allowAutolinks : !raw.startsWith("[")) return false
  if (!options.requireNonemptyDestination) return true
  const rawDestination = isAutolink
    ? raw.slice(1, -1)
    : directLinkDestinationSource(link, context.source)
  return hasMeaningfulDestination(link.url, rawDestination)
}

function firstMatchingDefinition(
  context: EvaluationContext,
  identifier: string,
): Definition | undefined {
  return descendants(context.blocks as AstNode[])
    .filter((node): node is Definition => node.type === "definition")
    .sort(
      (left, right) =>
        (left.position?.start.offset ?? 0) -
        (right.position?.start.offset ?? 0),
    )
    .find((definition) => definition.identifier === identifier)
}

function directLinkDestinationSource(link: Link, source: string): string {
  const lastChild = link.children.at(-1)
  const labelEnd = lastChild?.position?.end.offset
  const linkEnd = link.position?.end.offset
  if (typeof labelEnd === "number" && typeof linkEnd === "number") {
    const suffix = source.slice(labelEnd, linkEnd)
    if (suffix.startsWith("](")) {
      return destinationFromParenthesizedSource(suffix.slice(2))
    }
  }

  const raw = sourceForNode(link as unknown as AstNode, source)
  const separator = raw.lastIndexOf("](")
  return separator < 0
    ? ""
    : destinationFromParenthesizedSource(raw.slice(separator + 2))
}

function definitionDestinationSource(
  definition: Definition,
  source: string,
): string {
  const raw = sourceForNode(definition as unknown as AstNode, source)
  const markerEnd = findDefinitionMarkerEnd(raw)
  return markerEnd < 0
    ? ""
    : destinationFromDefinitionSource(raw.slice(markerEnd))
}

function findDefinitionMarkerEnd(raw: string): number {
  for (let index = 0; index < raw.length - 1; index += 1) {
    if (raw[index] === "\\") {
      index += 1
      continue
    }
    if (raw[index] === "]" && raw[index + 1] === ":") return index + 2
  }
  return -1
}

function destinationFromDefinitionSource(source: string): string {
  let start = 0
  while (start < source.length && /[ \t\r\n]/.test(source[start]!)) {
    start += 1
  }
  return destinationToken(source, start, false)
}

function destinationFromParenthesizedSource(source: string): string {
  let start = 0
  while (start < source.length && /[ \t\r\n]/.test(source[start]!)) {
    start += 1
  }
  return destinationToken(source, start, true)
}

function destinationToken(
  source: string,
  start: number,
  stopAtOuterParenthesis: boolean,
): string {
  if (source[start] === "<") {
    let value = ""
    for (let index = start + 1; index < source.length; index += 1) {
      if (source[index] === "\\" && index + 1 < source.length) {
        value += source[index]! + source[index + 1]!
        index += 1
        continue
      }
      if (source[index] === ">") return value
      value += source[index]
    }
    return ""
  }

  let parenthesisDepth = 0
  let end = start
  for (; end < source.length; end += 1) {
    const character = source[end]!
    if (character === "\\" && end + 1 < source.length) {
      end += 1
      continue
    }
    if (/[ \t\r\n]/.test(character) && parenthesisDepth === 0) break
    if (character === "(") {
      parenthesisDepth += 1
      continue
    }
    if (character === ")") {
      if (parenthesisDepth === 0 && stopAtOuterParenthesis) break
      if (parenthesisDepth > 0) parenthesisDepth -= 1
    }
  }
  return source.slice(start, end)
}

function hasMeaningfulDestination(parsed: string, raw: string): boolean {
  return (
    hasMeaningfulCharacters(decodePercentEncoding(parsed)) &&
    hasMeaningfulCharacters(raw)
  )
}

function decodePercentEncoding(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function linkHasVisibleLabel(
  link: Link | LinkReference,
  source: string,
): boolean {
  return (link.children as AstNode[]).some((node) =>
    nodeHasVisibleLinkLabel(node, source),
  )
}

function nodeHasVisibleLinkLabel(node: AstNode, source: string): boolean {
  if (node.type === "inlineCode") {
    return hasVisibleInlineCodeContent(node as InlineCode, source)
  }
  if (node.type === "text") {
    return (
      hasMeaningfulCharacters(node.value) &&
      hasMeaningfulCharacters(sourceForNode(node, source))
    )
  }
  if (
    node.type === "html" ||
    node.type === "break" ||
    node.type === "image" ||
    node.type === "imageReference"
  ) return false
  return node.children?.some((child) => nodeHasVisibleLinkLabel(child, source)) ?? false
}

function sourceForNode(node: AstNode, source: string): string {
  const positionedNode = node as AstNode & {
    position?: { start?: { offset?: number }; end?: { offset?: number } }
  }
  const start = positionedNode.position?.start?.offset
  const end = positionedNode.position?.end?.offset
  return typeof start === "number" && typeof end === "number"
    ? source.slice(start, end)
    : ""
}

function hasMeaningfulCharacters(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value
      .normalize("NFKC")
      .replace(
        /[\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}\u2800]/gu,
        "",
      )
      .length > 0
  )
}

function nodeHasNonBlockquoteContent(node: AstNode): boolean {
  if (node.type === "blockquote") return false
  if (
    ["text", "inlineCode", "code"].includes(node.type) &&
    hasVisibleCharacters(node.value)
  ) {
    return true
  }
  if (
    ["image", "imageReference"].includes(node.type) &&
    hasVisibleCharacters(node.alt)
  ) {
    return true
  }
  if (
    ["html", "definition", "thematicBreak", "break"].includes(node.type)
  ) {
    return false
  }
  return node.children?.some(nodeHasNonBlockquoteContent) ?? false
}

function hasVisibleCharacters(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value
      .normalize("NFKC")
      .replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}]/gu, "")
      .length > 0
  )
}

function codeBlockPasses(
  check: Extract<StructuralCheck, { kind: "code-block" }>,
  context: EvaluationContext,
) {
  const blocks = descendants(nodesInScope(context, check.scope) as AstNode[])
    .filter((node): node is Code => node.type === "code")
    .filter((node) => !check.requireLanguageTag || Boolean(node.lang?.trim()))
    .filter((node) => !check.requireFenced || isFencedCode(context.source, node))
    .filter(
      (node) =>
        !check.requireClosedFence || isClosedFencedCode(context.source, node),
    )
    .filter(
      (node) =>
        !check.requireNonemptyContent ||
        codeBlockHasMeaningfulContent(node, context.source),
    )
  return inRange(blocks.length, check.min, check.max)
}

function codeBlockHasMeaningfulContent(node: Code, source: string): boolean {
  let rawContent = sourceForNode(node, source)
  if (isFencedCode(source, node)) {
    const lines = rawContent.split(/\r\n?|\n/)
    lines.shift()
    if (isClosedFencedCode(source, node)) lines.pop()
    rawContent = lines.join("\n")
  }
  return hasMeaningfulParsedCharacters(node.value, rawContent)
}

function hasMeaningfulParsedCharacters(
  parsedValue: unknown,
  rawSource: string,
): boolean {
  if (typeof parsedValue !== "string") return false
  const rawNullCount = [...rawSource].filter(
    (character) => character === "\u0000",
  ).length
  let remainingNullReplacements = rawNullCount
  const valueWithoutParserNullReplacements = parsedValue.replace(
    /\uFFFD/g,
    (character) => {
      if (remainingNullReplacements === 0) return character
      remainingNullReplacements -= 1
      return ""
    },
  )
  return hasMeaningfulCharacters(valueWithoutParserNullReplacements)
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
    case "blockquote-shape":
      return blockquoteShapePasses(check, context)
    case "inline-code-shape":
      return inlineCodeShapePasses(check, context)
    case "link-shape":
      return linkShapePasses(check, context)
    case "code-block":
      return codeBlockPasses(check, context)
    case "block-sequence":
      return blockSequencePasses(check, context)
    case "document-limits":
      return documentLimitsPasses(check, context)
  }
}
