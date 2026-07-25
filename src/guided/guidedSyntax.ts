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

function expandInputForms(
  forms: string[][],
  transform: (form: readonly string[]) => string[] | null,
): void {
  for (const form of [...forms]) {
    const alternative = transform(form)
    if (alternative) forms.push(alternative)
  }
}

function replacePairedDelimiter(
  form: readonly string[],
  from: string,
  to: string,
): string[] | null {
  const openingIndex = form.findIndex((part) => part.endsWith(from))
  if (openingIndex < 0) return null
  const closingIndex = form.findIndex(
    (part, index) => index > openingIndex && part === from,
  )
  if (closingIndex < 0) return null

  const alternative = [...form]
  alternative[openingIndex] = `${form[openingIndex]!.slice(0, -from.length)}${to}`
  alternative[closingIndex] = to
  return alternative
}

export function acceptedGuidedSyntaxInputs(
  checkpoint: SyntaxCheckpoint,
): readonly string[] {
  const canonicalParts = checkpoint.segments
    .filter(
      (segment): segment is Extract<GuidedSyntaxSegment, { kind: "input" }> =>
        segment.kind === "input",
    )
    .map((segment) => segment.value)
  const forms = [canonicalParts]

  const canonicalFirst = canonicalParts[0]
  const unorderedMatch = canonicalFirst?.match(/^(\s*)([-+*])(\s+)/)
  if (canonicalFirst && unorderedMatch) {
    for (const marker of ["-", "*", "+"] as const) {
      if (marker === unorderedMatch[2]) continue
      const alternative = [...canonicalParts]
      alternative[0] = `${unorderedMatch[1] ?? ""}${marker}${unorderedMatch[3] ?? ""}${canonicalFirst.slice(unorderedMatch[0].length)}`
      forms.push(alternative)
    }
  }

  const orderedMatch = canonicalFirst?.match(/^(\s*\d+)([.)])(\s+)/)
  if (canonicalFirst && orderedMatch) {
    const delimiter = orderedMatch[2] === "." ? ")" : "."
    const alternative = [...canonicalParts]
    alternative[0] = `${orderedMatch[1] ?? ""}${delimiter}${orderedMatch[3] ?? ""}${canonicalFirst.slice(orderedMatch[0].length)}`
    forms.push(alternative)
  }

  const pairedDelimiter = (
    [
      ["**", "__"],
      ["__", "**"],
      ["*", "_"],
      ["_", "*"],
    ] as const
  ).find(([from, to]) =>
    replacePairedDelimiter(canonicalParts, from, to) !== null,
  )
  if (pairedDelimiter) {
    const [from, to] = pairedDelimiter
    expandInputForms(forms, (form) =>
      replacePairedDelimiter(form, from, to),
    )
  }

  if (
    canonicalParts.length === 2 &&
    canonicalParts[0] === canonicalParts[1] &&
    (canonicalParts[0] === "```" || canonicalParts[0] === "~~~")
  ) {
    const alternativeFence = canonicalParts[0] === "```" ? "~~~" : "```"
    expandInputForms(forms, (form) =>
      form[0] === canonicalParts[0] && form[1] === canonicalParts[1]
        ? [alternativeFence, alternativeFence]
        : null,
    )
  }

  const isSetextHeading =
    canonicalParts.length === 1 &&
    /^(?:=+|-+)$/.test(canonicalParts[0] ?? "") &&
    checkpoint.segments.some(
      (segment) =>
        segment.kind === "locked" && /\n[\t ]*$/.test(segment.value),
    )

  if (
    !isSetextHeading &&
    canonicalParts.length === 1 &&
    ["---", "***", "___"].includes(canonicalParts[0] ?? "")
  ) {
    for (const divider of ["---", "***", "___"]) {
      if (divider !== canonicalParts[0]) forms.push([divider])
    }
  }

  return [...new Set(forms.map((form) => form.join("")))]
}

export function acceptsGuidedSyntaxInput(
  checkpoint: SyntaxCheckpoint,
  value: string,
): boolean {
  return acceptedGuidedSyntaxInputs(checkpoint).includes(value)
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

export type CheckpointHintRow = {
  input: string
  source: string
}

export function checkpointHintRows(
  checkpoint: SyntaxCheckpoint,
): readonly CheckpointHintRow[] {
  return acceptedGuidedSyntaxInputs(checkpoint).map((input) => ({
    input,
    source: renderCheckpointWithInput(checkpoint, input),
  }))
}

export type CheckpointContext = {
  before: string | null
  current: string
  after: string | null
}

function lineIndexAt(source: string, offset: number): number {
  let line = 0
  const boundedOffset = Math.min(Math.max(offset, 0), source.length)
  for (let index = 0; index < boundedOffset; index += 1) {
    if (source[index] === "\n") line += 1
  }
  return line
}

function nearestMeaningfulLine(
  lines: readonly string[],
  from: number,
  direction: -1 | 1,
): string | null {
  for (
    let index = from;
    index >= 0 && index < lines.length;
    index += direction
  ) {
    const line = lines[index]
    if (line?.trim()) return line
  }
  return null
}

export function projectCheckpointContext(
  target: string,
  checkpoint: SyntaxCheckpoint,
): CheckpointContext {
  const source = target.replace(/\r\n?/g, "\n")
  const document = fromMarkdown(source)
  const blocks = document.children.flatMap((node) => {
    const range = nodeRange(node)
    return range ? [{ range }] : []
  })
  const activeBlockIndex = blocks.findIndex(
    ({ range }) =>
      range.from <= checkpoint.targetFrom &&
      range.to >= checkpoint.targetTo,
  )

  if (activeBlockIndex >= 0) {
    const active = blocks[activeBlockIndex]!
    const before = blocks[activeBlockIndex - 1]
    const after = blocks[activeBlockIndex + 1]
    return {
      before: before
        ? source.slice(before.range.from, before.range.to)
        : null,
      current: source.slice(active.range.from, active.range.to),
      after: after ? source.slice(after.range.from, after.range.to) : null,
    }
  }

  // Malformed or extension-only source can lack a positioned mdast block.
  // Preserve the line-based projection as a defensive fallback.
  const lines = source.split("\n")
  const currentStartLine = lineIndexAt(source, checkpoint.targetFrom)
  const currentEndLine = lineIndexAt(
    source,
    Math.max(checkpoint.targetFrom, checkpoint.targetTo - 1),
  )

  return {
    before: nearestMeaningfulLine(lines, currentStartLine - 1, -1),
    current: lines.slice(currentStartLine, currentEndLine + 1).join("\n"),
    after: nearestMeaningfulLine(lines, currentEndLine + 1, 1),
  }
}

type GuidedListStyle = {
  orderedDelimiter?: "." | ")"
  unorderedMarker?: "-" | "*" | "+"
}

function listStyleFromInput(value: string): GuidedListStyle {
  const unordered = value.match(/^\s*([-+*])\s/)
  if (unordered?.[1]) {
    return { unorderedMarker: unordered[1] as "-" | "*" | "+" }
  }
  const ordered = value.match(/^\s*\d+([.)])\s/)
  if (ordered?.[1]) {
    return { orderedDelimiter: ordered[1] as "." | ")" }
  }
  return {}
}

function coherentListStyle(
  checkpoints: readonly SyntaxCheckpoint[],
  completedValues: Readonly<Record<string, string>>,
): GuidedListStyle {
  const style: GuidedListStyle = {}
  for (const checkpoint of checkpoints) {
    const value = completedValues[checkpoint.id] ?? checkpoint.canonicalInput
    const candidate = listStyleFromInput(value)
    style.unorderedMarker ??= candidate.unorderedMarker
    style.orderedDelimiter ??= candidate.orderedDelimiter
    if (style.unorderedMarker && style.orderedDelimiter) break
  }
  return style
}

function normalizeListStyle(value: string, style: GuidedListStyle): string {
  let normalized = value
  if (style.unorderedMarker) {
    normalized = normalized.replace(
      /^(\s*)[-+*](\s)/,
      `$1${style.unorderedMarker}$2`,
    )
  }
  if (style.orderedDelimiter) {
    normalized = normalized.replace(
      /^(\s*\d+)[.)](\s)/,
      `$1${style.orderedDelimiter}$2`,
    )
  }
  return normalized
}

type SourceRange = { from: number; to: number }

/**
 * Which syntax family owns each masked character. Adjacent marks from
 * different families (`> ` then `**`) are separate input groups the learner
 * answers side by side; marks from one family (`]` then `(` inside a link)
 * stay one group. `null` means the character is locked prose.
 */
type SyntaxFamilies = (string | null)[]

function isParent(node: Nodes): node is Parents {
  return "children" in node
}

function markRange(
  mask: boolean[],
  range: SourceRange,
  families: SyntaxFamilies,
  family: string,
): void {
  const from = Math.max(0, range.from)
  const to = Math.min(mask.length, range.to)
  for (let index = from; index < to; index += 1) {
    mask[index] = true
    families[index] = family
  }
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
  families: SyntaxFamilies,
  family: string,
): void {
  const start = lineStartAt(source, offset)
  const end = lineEndAt(source, offset)
  const match = source.slice(start, end).match(pattern)
  if (match?.[0]) {
    markRange(mask, { from: start, to: start + match[0].length }, families, family)
  }
}

function markInlineDelimiters(
  source: string,
  mask: boolean[],
  node: Parents,
  families: SyntaxFamilies,
  family: string,
): void {
  const range = nodeRange(node)
  const first = node.children.at(0)?.position?.start.offset
  const last = node.children.at(-1)?.position?.end.offset
  if (!range || first === undefined || last === undefined) return
  // The opening and closing delimiters are two answers the learner types in
  // two places, so they never share a family instance.
  markRange(mask, { from: range.from, to: first }, families, `${family}-open`)
  markRange(mask, { from: last, to: range.to }, families, `${family}-close`)
}

function markLinkPunctuation(
  source: string,
  mask: boolean[],
  node: Nodes,
  families: SyntaxFamilies,
  family: string,
): void {
  const range = nodeRange(node)
  if (!range) return
  const raw = source.slice(range.from, range.to)
  const openingLength = raw.startsWith("![") ? 2 : 1
  markRange(
    mask,
    { from: range.from, to: range.from + openingLength },
    families,
    family,
  )

  const labelClose = raw.indexOf("]")
  if (labelClose < 0) return
  markRange(
    mask,
    { from: range.from + labelClose, to: range.from + labelClose + 1 },
    families,
    family,
  )

  const destinationOpen = raw.indexOf("(", labelClose + 1)
  if (destinationOpen >= 0) {
    markRange(
      mask,
      { from: range.from + destinationOpen, to: range.from + destinationOpen + 1 },
      families,
      family,
    )
    const destinationClose = raw.lastIndexOf(")")
    if (destinationClose > destinationOpen) {
      markRange(
        mask,
        {
          from: range.from + destinationClose,
          to: range.from + destinationClose + 1,
        },
        families,
        family,
      )
    }
  }
}

function markCodeFence(
  source: string,
  mask: boolean[],
  node: Nodes,
  families: SyntaxFamilies,
  family: string,
): SourceRange | null {
  const range = nodeRange(node)
  if (!range) return null
  const openingStart = lineStartAt(source, range.from)
  const openingEnd = lineEndAt(source, range.from)
  const opening = source
    .slice(openingStart, openingEnd)
    .match(/^(\s*)(`{3,}|~{3,})/)
  if (!opening?.[2]) return null

  markRange(
    mask,
    {
      from: openingStart,
      to: openingStart + (opening[1]?.length ?? 0) + opening[2].length,
    },
    families,
    `${family}-open`,
  )

  const closingLineStart = lineStartAt(source, Math.max(range.from, range.to - 1))
  if (closingLineStart !== openingStart) {
    const closingEnd = lineEndAt(source, closingLineStart)
    const closing = source
      .slice(closingLineStart, closingEnd)
      .match(/^(\s*)(`{3,}|~{3,})\s*$/)
    if (closing?.[2]) {
      markRange(
        mask,
        {
          from: closingLineStart,
          to: closingLineStart + (closing[1]?.length ?? 0) + closing[2].length,
        },
        families,
        `${family}-close`,
      )
    }
  }

  return { from: openingStart, to: lineEndAt(source, range.to) }
}

function markNodeSyntax(
  node: Nodes,
  source: string,
  mask: boolean[],
  groupedRanges: SourceRange[],
  families: SyntaxFamilies,
): void {
  const range = nodeRange(node)
  // Two sibling nodes of the same type can sit side by side (`[a](b)[c](d)`).
  // Keying the family by node type *and* start offset keeps their marks in
  // separate input groups.
  const family = `${node.type}@${range?.from ?? 0}`

  switch (node.type) {
    case "heading":
      if (range) {
        const headingStart = lineStartAt(source, range.from)
        const headingLine = source.slice(
          headingStart,
          lineEndAt(source, headingStart),
        )
        if (/^ {0,3}#{1,6}[\t ]+/.test(headingLine)) {
          markPrefix(
            source,
            mask,
            range.from,
            /^ {0,3}#{1,6}[\t ]+/,
            families,
            family,
          )
          break
        }

        const underlineStart = lineStartAt(
          source,
          Math.max(range.from, range.to - 1),
        )
        const underlineEnd = lineEndAt(source, underlineStart)
        const underline = source.slice(underlineStart, underlineEnd)
        const marker = underline.match(/^ {0,3}(=+|-+)[\t ]*$/)
        if (marker?.[1]) {
          const markerFrom = underlineStart + underline.indexOf(marker[1])
          markRange(
            mask,
            { from: markerFrom, to: markerFrom + marker[1].length },
            families,
            family,
          )
          groupedRanges.push({ from: headingStart, to: underlineEnd })
        }
      }
      break
    case "blockquote":
      if (range) {
        let lineStart = lineStartAt(source, range.from)
        while (lineStart < range.to) {
          // Each quoted line carries its own `>` the learner types, so every
          // line is its own group.
          markPrefix(
            source,
            mask,
            lineStart,
            /^ {0,3}>[\t ]?/,
            families,
            `${family}-${lineStart}`,
          )
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
          families,
          family,
        )
      }
      break
    case "emphasis":
    case "strong":
      markInlineDelimiters(source, mask, node, families, family)
      break
    case "inlineCode":
      if (range) {
        const raw = source.slice(range.from, range.to)
        const opening = raw.match(/^`+/)?.[0] ?? ""
        const closing = raw.match(/`+$/)?.[0] ?? ""
        markRange(
          mask,
          { from: range.from, to: range.from + opening.length },
          families,
          `${family}-open`,
        )
        markRange(
          mask,
          { from: range.to - closing.length, to: range.to },
          families,
          `${family}-close`,
        )
      }
      break
    case "link":
    case "linkReference":
    case "image":
    case "imageReference":
      markLinkPunctuation(source, mask, node, families, family)
      break
    case "code": {
      const grouped = markCodeFence(source, mask, node, families, family)
      if (grouped) groupedRanges.push(grouped)
      break
    }
    case "thematicBreak":
    case "break":
      if (range) markRange(mask, range, families, family)
      break
    default:
      break
  }

  if (isParent(node)) {
    for (const child of node.children) {
      markNodeSyntax(child as Nodes, source, mask, groupedRanges, families)
    }
  }
}

function unmaskLineLeadingWhitespace(
  source: string,
  mask: boolean[],
  families: SyntaxFamilies,
): void {
  // Line-leading indentation is Goal layout, never a mark the learner types:
  // only whitespace the Markdown grammar itself requires (after `-`, `#`, …)
  // stays inside an input segment.
  let lineStart = 0
  while (lineStart <= source.length) {
    let index = lineStart
    while (
      index < source.length &&
      (source[index] === " " || source[index] === "\t")
    ) {
      mask[index] = false
      families[index] = null
      index += 1
    }
    const lineEnd = lineEndAt(source, lineStart)
    if (lineEnd >= source.length) break
    lineStart = lineEnd + 1
  }
}

function mergeSegments(
  source: string,
  mask: readonly boolean[],
  from: number,
  to: number,
  families: readonly (string | null)[],
): GuidedSyntaxSegment[] {
  const segments: GuidedSyntaxSegment[] = []
  let segmentStart = from
  let segmentIsInput = mask[from] === true
  let segmentFamily = families[from] ?? null

  const append = (end: number) => {
    if (end <= segmentStart) return
    const value = source.slice(segmentStart, end)
    const previous = segments.at(-1)
    const kind = segmentIsInput ? "input" : "locked"
    // Locked prose still merges freely, but two input runs only merge while
    // they belong to the same syntax family: `> ` and `**` stay apart so the
    // learner answers the block quote and the bold marks as separate groups.
    if (previous?.kind === kind && kind === "locked") previous.value += value
    else segments.push({ kind, value } as GuidedSyntaxSegment)
  }

  for (let index = from + 1; index < to; index += 1) {
    const isInput = mask[index] === true
    const family = families[index] ?? null
    if (isInput === segmentIsInput && (!isInput || family === segmentFamily)) {
      continue
    }
    append(index)
    segmentStart = index
    segmentIsInput = isInput
    segmentFamily = family
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
  const families: SyntaxFamilies = Array.from(
    { length: source.length },
    () => null,
  )
  const groupedRanges: SourceRange[] = []
  markNodeSyntax(fromMarkdown(source), source, mask, groupedRanges, families)
  unmaskLineLeadingWhitespace(source, mask, families)

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
      // Line-leading indentation is not Markdown grammar, so it never appears
      // inside the card: the checkpoint starts at the first mark or prose
      // character and the indentation rejoins the document as the untouched
      // slice between checkpoints.
      let contentStart = lineStart
      while (
        contentStart < checkpointEnd &&
        (source[contentStart] === " " || source[contentStart] === "\t")
      ) {
        contentStart += 1
      }
      const segments = mergeSegments(
        source,
        mask,
        contentStart,
        checkpointEnd,
        families,
      )
      const canonicalInput = segments
        .filter(
          (segment): segment is Extract<GuidedSyntaxSegment, { kind: "input" }> =>
            segment.kind === "input",
        )
        .map((segment) => segment.value)
        .join("")
      const activeOffset = mask.findIndex(
        (isInput, index) => index >= contentStart && index < checkpointEnd && isInput,
      )
      const line = lineNumberAt(source, lineStart)
      checkpoints.push({
        id: `syntax-${line}-${checkpoints.length + 1}`,
        line,
        targetFrom: contentStart,
        targetTo: checkpointEnd,
        activeOffset: activeOffset < 0 ? contentStart : activeOffset,
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
  const completedCheckpoints = checkpoints.slice(0, boundedCount)
  const listStyle = coherentListStyle(completedCheckpoints, completedValues)

  for (const checkpoint of completedCheckpoints) {
    parts.push(target.slice(cursor, checkpoint.targetFrom))
    const submittedValue = completedValues[checkpoint.id]
    const acceptedValue =
      submittedValue !== undefined &&
      acceptsGuidedSyntaxInput(checkpoint, submittedValue)
        ? submittedValue
        : checkpoint.canonicalInput
    parts.push(
      renderCheckpointWithInput(
        checkpoint,
        normalizeListStyle(acceptedValue, listStyle),
      ),
    )
    cursor = checkpoint.targetTo
  }

  parts.push(target.slice(cursor, draftEnd))
  return parts.join("")
}
