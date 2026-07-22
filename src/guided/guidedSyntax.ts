import type { Nodes, Parents } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"

export type GuidedSyntaxSegment =
  | { kind: "input"; value: string }
  | { kind: "locked"; value: string }

export type SyntaxCheckpoint = {
  id: string
  line: number
  targetFrom: number
  targetTo: number
  activeOffset: number
  canonicalInput: string
  segments: readonly GuidedSyntaxSegment[]
}

export function acceptsGuidedSyntaxInput(
  checkpoint: SyntaxCheckpoint,
  value: string,
): boolean {
  if (value === checkpoint.canonicalInput) return true
  if (value.length !== checkpoint.canonicalInput.length) return false

  return (
    /^\*+$/.test(checkpoint.canonicalInput) &&
    (/^\*+$/.test(value) || /^_+$/.test(value))
  )
}

function renderCheckpointWithInput(
  checkpoint: SyntaxCheckpoint,
  value: string,
): string {
  let inputOffset = 0
  return checkpoint.segments
    .map((segment) => {
      if (segment.kind === "locked") return segment.value
      const replacement = value.slice(
        inputOffset,
        inputOffset + segment.value.length,
      )
      inputOffset += segment.value.length
      return replacement
    })
    .join("")
}

type SourceRange = { from: number; to: number }

function isParent(node: Nodes): node is Parents {
  return "children" in node
}

function markRange(mask: boolean[], range: SourceRange): void {
  const from = Math.max(0, range.from)
  const to = Math.min(mask.length, range.to)
  for (let index = from; index < to; index += 1) mask[index] = true
}

function nodeRange(node: Nodes): SourceRange | null {
  const from = node.position?.start.offset
  const to = node.position?.end.offset
  return from === undefined || to === undefined ? null : { from, to }
}

function lineStartAt(source: string, offset: number): number {
  return source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1
}

function lineEndAt(source: string, offset: number): number {
  const nextBreak = source.indexOf("\n", offset)
  return nextBreak < 0 ? source.length : nextBreak
}

function markPrefix(
  source: string,
  mask: boolean[],
  offset: number,
  pattern: RegExp,
): void {
  const start = lineStartAt(source, offset)
  const end = lineEndAt(source, offset)
  const match = source.slice(start, end).match(pattern)
  if (match?.[0]) markRange(mask, { from: start, to: start + match[0].length })
}

function markInlineDelimiters(
  source: string,
  mask: boolean[],
  node: Parents,
): void {
  const range = nodeRange(node)
  const first = node.children.at(0)?.position?.start.offset
  const last = node.children.at(-1)?.position?.end.offset
  if (!range || first === undefined || last === undefined) return
  markRange(mask, { from: range.from, to: first })
  markRange(mask, { from: last, to: range.to })
}

function markLinkPunctuation(
  source: string,
  mask: boolean[],
  node: Nodes,
): void {
  const range = nodeRange(node)
  if (!range) return
  const raw = source.slice(range.from, range.to)
  const openingLength = raw.startsWith("![") ? 2 : 1
  markRange(mask, { from: range.from, to: range.from + openingLength })

  const labelClose = raw.indexOf("]")
  if (labelClose < 0) return
  markRange(mask, {
    from: range.from + labelClose,
    to: range.from + labelClose + 1,
  })

  const destinationOpen = raw.indexOf("(", labelClose + 1)
  if (destinationOpen >= 0) {
    markRange(mask, {
      from: range.from + destinationOpen,
      to: range.from + destinationOpen + 1,
    })
    const destinationClose = raw.lastIndexOf(")")
    if (destinationClose > destinationOpen) {
      markRange(mask, {
        from: range.from + destinationClose,
        to: range.from + destinationClose + 1,
      })
    }
  }
}

function markCodeFence(
  source: string,
  mask: boolean[],
  node: Nodes,
): SourceRange | null {
  const range = nodeRange(node)
  if (!range) return null
  const openingStart = lineStartAt(source, range.from)
  const openingEnd = lineEndAt(source, range.from)
  const opening = source
    .slice(openingStart, openingEnd)
    .match(/^(\s*)(`{3,}|~{3,})/)
  if (!opening?.[2]) return null

  markRange(mask, {
    from: openingStart,
    to: openingStart + (opening[1]?.length ?? 0) + opening[2].length,
  })

  const closingLineStart = lineStartAt(source, Math.max(range.from, range.to - 1))
  if (closingLineStart !== openingStart) {
    const closingEnd = lineEndAt(source, closingLineStart)
    const closing = source
      .slice(closingLineStart, closingEnd)
      .match(/^(\s*)(`{3,}|~{3,})\s*$/)
    if (closing?.[2]) {
      markRange(mask, {
        from: closingLineStart,
        to: closingLineStart + (closing[1]?.length ?? 0) + closing[2].length,
      })
    }
  }

  return { from: openingStart, to: lineEndAt(source, range.to) }
}

function markNodeSyntax(
  node: Nodes,
  source: string,
  mask: boolean[],
  groupedRanges: SourceRange[],
): void {
  const range = nodeRange(node)

  switch (node.type) {
    case "heading":
      if (range) markPrefix(source, mask, range.from, /^ {0,3}#{1,6}[\t ]+/)
      break
    case "blockquote":
      if (range) {
        let lineStart = lineStartAt(source, range.from)
        while (lineStart < range.to) {
          markPrefix(source, mask, lineStart, /^ {0,3}>[\t ]?/)
          const lineEnd = lineEndAt(source, lineStart)
          if (lineEnd >= source.length) break
          lineStart = lineEnd + 1
        }
      }
      break
    case "listItem":
      if (range) {
        markPrefix(
          source,
          mask,
          range.from,
          /^\s*(?:[-+*]|\d+[.)])[\t ]+/,
        )
      }
      break
    case "emphasis":
    case "strong":
      markInlineDelimiters(source, mask, node)
      break
    case "inlineCode":
      if (range) {
        const raw = source.slice(range.from, range.to)
        const opening = raw.match(/^`+/)?.[0] ?? ""
        const closing = raw.match(/`+$/)?.[0] ?? ""
        markRange(mask, { from: range.from, to: range.from + opening.length })
        markRange(mask, { from: range.to - closing.length, to: range.to })
      }
      break
    case "link":
    case "linkReference":
    case "image":
    case "imageReference":
      markLinkPunctuation(source, mask, node)
      break
    case "code": {
      const grouped = markCodeFence(source, mask, node)
      if (grouped) groupedRanges.push(grouped)
      break
    }
    case "thematicBreak":
    case "break":
      if (range) markRange(mask, range)
      break
    default:
      break
  }

  if (isParent(node)) {
    for (const child of node.children) {
      markNodeSyntax(child as Nodes, source, mask, groupedRanges)
    }
  }
}

function mergeSegments(
  source: string,
  mask: readonly boolean[],
  from: number,
  to: number,
): GuidedSyntaxSegment[] {
  const segments: GuidedSyntaxSegment[] = []
  let segmentStart = from
  let segmentIsInput = mask[from] === true

  const append = (end: number) => {
    if (end <= segmentStart) return
    const value = source.slice(segmentStart, end)
    const previous = segments.at(-1)
    const kind = segmentIsInput ? "input" : "locked"
    if (previous?.kind === kind) previous.value += value
    else segments.push({ kind, value } as GuidedSyntaxSegment)
  }

  for (let index = from + 1; index < to; index += 1) {
    const isInput = mask[index] === true
    if (isInput === segmentIsInput) continue
    append(index)
    segmentStart = index
    segmentIsInput = isInput
  }
  append(to)
  return segments
}

function lineNumberAt(source: string, offset: number): number {
  let line = 1
  for (let index = 0; index < offset; index += 1) {
    if (source[index] === "\n") line += 1
  }
  return line
}

export function deriveSyntaxCheckpoints(
  target: string,
  _starterText: string,
): SyntaxCheckpoint[] {
  const source = target.replace(/\r\n?/g, "\n")
  const mask = Array.from({ length: source.length }, () => false)
  const groupedRanges: SourceRange[] = []
  markNodeSyntax(fromMarkdown(source), source, mask, groupedRanges)

  const checkpoints: SyntaxCheckpoint[] = []
  let lineStart = 0
  while (lineStart <= source.length) {
    const lineEnd = lineEndAt(source, lineStart)
    const grouped = groupedRanges.find((range) => range.from === lineStart)
    const checkpointEnd = grouped?.to ?? lineEnd
    const hasInput = mask
      .slice(lineStart, checkpointEnd)
      .some((isInput) => isInput)

    if (hasInput) {
      const segments = mergeSegments(source, mask, lineStart, checkpointEnd)
      const canonicalInput = segments
        .filter(
          (segment): segment is Extract<GuidedSyntaxSegment, { kind: "input" }> =>
            segment.kind === "input",
        )
        .map((segment) => segment.value)
        .join("")
      const activeOffset = mask.findIndex(
        (isInput, index) => index >= lineStart && index < checkpointEnd && isInput,
      )
      const line = lineNumberAt(source, lineStart)
      checkpoints.push({
        id: `syntax-${line}-${checkpoints.length + 1}`,
        line,
        targetFrom: lineStart,
        targetTo: checkpointEnd,
        activeOffset: activeOffset < 0 ? lineStart : activeOffset,
        canonicalInput,
        segments,
      })
    }

    if (checkpointEnd >= source.length) break
    lineStart = checkpointEnd + 1
  }

  return checkpoints
}

export function buildGuidedDraft(
  target: string,
  checkpoints: readonly SyntaxCheckpoint[],
  completedCount: number,
  completedValues: Readonly<Record<string, string>> = {},
): string {
  if (completedCount <= 0 || checkpoints.length === 0) return ""
  const boundedCount = Math.min(completedCount, checkpoints.length)
  const nextCheckpoint = checkpoints[boundedCount]
  const draftEnd = nextCheckpoint?.targetFrom ?? target.length
  const parts: string[] = []
  let cursor = 0

  for (const checkpoint of checkpoints.slice(0, boundedCount)) {
    parts.push(target.slice(cursor, checkpoint.targetFrom))
    const submittedValue = completedValues[checkpoint.id]
    const acceptedValue =
      submittedValue !== undefined &&
      acceptsGuidedSyntaxInput(checkpoint, submittedValue)
        ? submittedValue
        : checkpoint.canonicalInput
    parts.push(renderCheckpointWithInput(checkpoint, acceptedValue))
    cursor = checkpoint.targetTo
  }

  parts.push(target.slice(cursor, draftEnd))
  return parts.join("")
}
