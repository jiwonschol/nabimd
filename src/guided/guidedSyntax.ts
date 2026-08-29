import type { Nodes, Parents } from "mdast"
import { parseMarkdownSource } from "../markdown/parser"

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

const swappedDelimiters: Readonly<Record<string, string>> = {
  "**": "__",
  __: "**",
  "*": "_",
  _: "*",
}

type DelimiterPair = { openingIndex: number; closingIndex: number; mark: string }

/**
 * Every opening/closing delimiter pair among a checkpoint's input groups, in
 * source order and without overlap. One card can now hold several of them.
 */
function pairedDelimiterRuns(
  parts: readonly string[],
): readonly DelimiterPair[] {
  const pairs: DelimiterPair[] = []
  const used = new Set<number>()
  for (let index = 0; index < parts.length; index += 1) {
    if (used.has(index)) continue
    const part = parts[index]!
    const mark = Object.keys(swappedDelimiters).find((candidate) =>
      part.endsWith(candidate),
    )
    if (!mark) continue
    const closingIndex = parts.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index && !used.has(candidateIndex) && candidate === mark,
    )
    if (closingIndex < 0) continue
    used.add(index)
    used.add(closingIndex)
    pairs.push({ openingIndex: index, closingIndex, mark })
  }
  return pairs
}

function swapDelimiterPair(
  form: readonly string[],
  { openingIndex, closingIndex, mark }: DelimiterPair,
): string[] | null {
  const opening = form[openingIndex]
  const closing = form[closingIndex]
  if (opening === undefined || closing === undefined) return null
  if (!opening.endsWith(mark) || closing !== mark) return null
  const replacement = swappedDelimiters[mark]!
  const alternative = [...form]
  alternative[openingIndex] = `${opening.slice(0, -mark.length)}${replacement}`
  alternative[closingIndex] = replacement
  return alternative
}

/**
 * Every accepted answer, kept as one entry per input group instead of one
 * joined string. Grading still compares the joined form, but the teacher's
 * note needs to say which group was wrong and what that group accepts.
 */
export function acceptedGuidedSyntaxGroupForms(
  checkpoint: SyntaxCheckpoint,
): readonly (readonly string[])[] {
  const seen = new Set<string>()
  return buildAcceptedForms(checkpoint).filter((form) => {
    const key = form.join("\u0000")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildAcceptedForms(
  checkpoint: SyntaxCheckpoint,
): readonly (readonly string[])[] {
  const canonicalParts = checkpoint.segments
    .filter(
      (segment): segment is Extract<GuidedSyntaxSegment, { kind: "input" }> =>
        segment.kind === "input",
    )
    .map((segment) => segment.value)
  const forms = [canonicalParts]

  // One card can now hold every item of a list, so the marker alternates are
  // rewritten across all of its marker groups at once. Markdown starts a new
  // list when the marker changes partway down, so mixing `-` and `*` in one
  // list is a real mistake and no accepted form offers it.
  const unorderedGroups = canonicalParts.flatMap((part, index) => {
    const match = part.match(/^(\s*)([-+*])(\s+)/)
    return match ? [{ index, match }] : []
  })
  if (unorderedGroups.length > 0) {
    const current = unorderedGroups[0]!.match[2]
    for (const marker of ["-", "*", "+"] as const) {
      if (marker === current) continue
      const alternative = [...canonicalParts]
      for (const { index, match } of unorderedGroups) {
        const part = canonicalParts[index]!
        alternative[index] = `${match[1] ?? ""}${marker}${match[3] ?? ""}${part.slice(match[0].length)}`
      }
      forms.push(alternative)
    }
  }

  const orderedGroups = canonicalParts.flatMap((part, index) => {
    const match = part.match(/^(\s*\d+)([.)])(\s+)/)
    return match ? [{ index, match }] : []
  })
  if (orderedGroups.length > 0) {
    const delimiter = orderedGroups[0]!.match[2] === "." ? ")" : "."
    const alternative = [...canonicalParts]
    for (const { index, match } of orderedGroups) {
      const part = canonicalParts[index]!
      alternative[index] = `${match[1] ?? ""}${delimiter}${match[3] ?? ""}${part.slice(match[0].length)}`
    }
    forms.push(alternative)
  }

  // Emphasis pairs do not constrain each other. `*one*` and `*two*` were two
  // cards before they were joined, and each accepted its own delimiter;
  // swapping only the first pair offered a mixed answer (`__**`) while
  // dropping the uniform one (`____`) — the opposite of both. Every pair
  // varies on its own, so the accepted set is the product of their choices.
  for (const pair of pairedDelimiterRuns(canonicalParts)) {
    expandInputForms(forms, (form) => swapDelimiterPair(form, pair))
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

  return forms
}

export function acceptedGuidedSyntaxInputs(
  checkpoint: SyntaxCheckpoint,
): readonly string[] {
  return [...new Set(buildAcceptedForms(checkpoint).map((form) => form.join("")))]
}

/**
 * Which input groups in this attempt no group-wise accepted answer can
 * explain. An empty result means every group is typable as part of some
 * accepted form (the whole answer may still be rejected when the groups come
 * from different forms).
 */
export function missedGuidedSyntaxGroups(
  checkpoint: SyntaxCheckpoint,
  values: readonly string[],
): readonly number[] {
  const forms = acceptedGuidedSyntaxGroupForms(checkpoint)
  const groupCount = forms[0]?.length ?? 0
  const missed: number[] = []
  for (let index = 0; index < groupCount; index += 1) {
    const value = values[index] ?? ""
    if (!forms.some((form) => form[index] === value)) missed.push(index)
  }
  return missed
}

/** Every form this one group accepts, in the order Hint lists them. */
export function acceptedGuidedSyntaxGroupInputs(
  checkpoint: SyntaxCheckpoint,
  groupIndex: number,
): readonly string[] {
  return [
    ...new Set(
      acceptedGuidedSyntaxGroupForms(checkpoint).flatMap(
        (form) => form[groupIndex] ?? [],
      ),
    ),
  ]
}

/**
 * The syntax family one input group belongs to, named the way the teacher's
 * note names it. `precededByLineBreak` separates a Setext underline from a
 * thematic break, which look identical on their own.
 */
export function syntaxGroupTerm(
  value: string,
  precededByLineBreak = false,
): string {
  // A list marker is only a list marker because the grammar requires the
  // space after it. Trimming first would make `* ` (bullet) and `*` (italic)
  // indistinguishable, so the spacing is checked on the raw value.
  if (/^ {0,3}[-+*][\t ]+$/.test(value)) return "bullet item"
  if (/^ {0,3}\d+[.)][\t ]+$/.test(value)) return "numbered step"

  const mark = value.trim()
  if (/^(?:=+|-+)$/.test(mark) && precededByLineBreak) {
    return `level ${mark.startsWith("=") ? "1" : "2"} Setext heading`
  }
  if (mark.startsWith("#")) {
    return `level ${mark.match(/^#+/)?.[0]?.length ?? 1} heading`
  }
  if (["---", "***", "___"].includes(mark)) return "section break"
  if (mark.startsWith(">")) return "block quote"
  if (mark.startsWith("```") || mark.startsWith("~~~")) return "fenced code block"
  if (mark === "**" || mark === "__") return "bold text"
  if (mark === "*" || mark === "_") return "italic text"
  if (mark.startsWith("![")) return "image"
  if (mark.startsWith("[") || mark === "](" || mark === ")") return "link"
  if (mark.startsWith("`")) return "inline code"
  return "Markdown mark"
}

/** Semantic syntax names represented by one checkpoint, matching the labels
 * shown in the Now learning panel. */
export function syntaxCheckpointTerms(
  checkpoint: SyntaxCheckpoint,
): readonly string[] {
  return [
    ...new Set(
      checkpoint.segments.flatMap((segment, index) => {
        if (segment.kind !== "input") return []
        const previous = checkpoint.segments[index - 1]
        return [
          syntaxGroupTerm(
            segment.value,
            previous?.kind === "locked" && /\n[\t ]*$/.test(previous.value),
          ),
        ]
      }),
    ),
  ]
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

/**
 * One recorded miss, keyed tightly enough that the Summary can mark the exact
 * place on the page and print the matching numbered note.
 */
export type SyntaxMistake = {
  problemId: string
  checkpointId: string
  groupIndex: number
  /** The syntax family the note names, e.g. `block quote`. */
  term: string
  /** What the learner actually typed into that group. */
  submitted: string
  /** Every key sequence that group accepts. */
  expected: readonly string[]
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
  const document = parseMarkdownSource(source)
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

/**
 * One coherent marker per indentation level, not one for the document.
 *
 * A marker that changes partway down a list starts a second list, so the
 * items of one list are normalised to agree. A *nested* list is already a
 * separate list, and Markdown lets its marker differ from its parent's —
 * folding both levels into one style rewrote `  * Child` under `- Parent`
 * into `  - Child`, producing a document that is not the target.
 */
function coherentListStyles(
  source: string,
  checkpoints: readonly SyntaxCheckpoint[],
  completedValues: Readonly<Record<string, string>>,
): Map<string, GuidedListStyle> {
  const styles = new Map<string, GuidedListStyle>()
  for (const checkpoint of checkpoints) {
    const indentation = indentationOf(source, checkpoint)
    const style = styles.get(indentation) ?? {}
    if (style.unorderedMarker && style.orderedDelimiter) continue
    const value = completedValues[checkpoint.id] ?? checkpoint.canonicalInput
    const candidate = listStyleFromInput(value)
    style.unorderedMarker ??= candidate.unorderedMarker
    style.orderedDelimiter ??= candidate.orderedDelimiter
    styles.set(indentation, style)
  }
  return styles
}

function normalizeGroupListStyle(
  value: string,
  style: GuidedListStyle,
): string {
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

/**
 * A marker only starts a line, so normalisation is anchored — and one card can
 * now carry several markers, which made a leading-anchor pass rewrite the
 * first item and leave the rest. `1) ` beside `2. ` is a different list to
 * Markdown, so the document stopped grading. Each input group is normalised on
 * its own; accepted alternatives are the same length as the canonical answer,
 * so the groups can be sliced by the canonical widths.
 */
function normalizeListStyle(
  checkpoint: SyntaxCheckpoint,
  value: string,
  style: GuidedListStyle,
): string {
  const widths = checkpoint.segments.flatMap((segment) =>
    segment.kind === "input" ? [segment.value.length] : [],
  )
  if (widths.length <= 1) return normalizeGroupListStyle(value, style)

  let offset = 0
  return widths
    .map((width, index) => {
      const group =
        index === widths.length - 1
          ? value.slice(offset)
          : value.slice(offset, offset + width)
      offset += width
      return normalizeGroupListStyle(group, style)
    })
    .join("")
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
  // A GFM autolink literal (`https://example.com` written bare) is a link
  // node with no punctuation in it. Masking its first character would ask the
  // learner to type `h` — a blank that teaches nothing and cannot be right or
  // wrong. Enabling GFM is what makes these nodes appear, so the guard ships
  // with it. `<https://example.com>` is skipped for the same reason: its
  // angle brackets are a different curriculum element and are not taught by
  // pretending they are link punctuation.
  if (!raw.startsWith("[") && !raw.startsWith("![")) return
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
    case "table":
      if (range) {
        // Every bar in a table is grammar the learner types; the cell text
        // between them is prose. The delimiter row is not a child of the table
        // node — GFM consumes it — so the rows are walked by line rather than
        // by child, which also picks up its bars while leaving its dashes
        // locked. One family covers them all: what keeps a header, the rule
        // under it, and a body row on separate cards is the never-join rule in
        // `mergeAdjacentSameSyntax`, not the family. Giving each line its own
        // family read like the thing that did it and changed nothing.
        let lineStart = lineStartAt(source, range.from)
        while (lineStart < range.to) {
          const lineEnd = lineEndAt(source, lineStart)
          for (let index = lineStart; index < lineEnd; index += 1) {
            // `\|` is a literal bar inside a cell, not a separator — GFM
            // reads it as text. Counting backslashes matters because `\\|`
            // is an escaped backslash followed by a real separator.
            let backslashes = 0
            while (source[index - 1 - backslashes] === "\\") backslashes += 1
            if (source[index] === "|" && backslashes % 2 === 0) {
              markRange(
                mask,
                { from: index, to: index + 1 },
                families,
                TABLE_ROW_FAMILY,
              )
            }
          }
          if (lineEnd >= source.length) break
          lineStart = lineEnd + 1
        }
      }
      break
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

/**
 * Two cards in a row must not teach the same thing.
 *
 * The turn scheduler already keeps one syntax from filling a turn, but that
 * contract is written in problems while the learner counts cards: a
 * three-item list was one problem and three identical cards, so the practice
 * *felt* like the same mark three times in a row even though the schedule was
 * correct. Consecutive checkpoints that name the same syntax become one card
 * with one blank per item, which is the same amount of typing on one screen.
 *
 * Only whitespace may sit between the two — anything else means another block
 * came in between and swallowing it into a locked segment would put an
 * unrelated paragraph inside the card.
 */
/**
 * The layout indentation in front of a checkpoint. It is not part of the card
 * — `unmaskLineLeadingWhitespace` keeps it out — but it says which level of a
 * document the checkpoint sits at, and a nested list is a *different list*:
 * Markdown lets its marker differ from its parent's. Joining the two levels
 * onto one card would make the parent's marker constrain the child's, which
 * refuses answers the learner could give before.
 */
function indentationOf(source: string, checkpoint: SyntaxCheckpoint): string {
  return source.slice(lineStartAt(source, checkpoint.targetFrom), checkpoint.targetFrom)
}

function sameSyntax(
  left: SyntaxCheckpoint,
  right: SyntaxCheckpoint,
): boolean {
  const leftTerms = syntaxCheckpointTerms(left)
  const rightTerms = syntaxCheckpointTerms(right)
  return (
    leftTerms.length === rightTerms.length &&
    leftTerms.every((term, index) => term === rightTerms[index])
  )
}

/** A table's rows are never joined: see the `table` case in `markNodeSyntax`. */
const TABLE_ROW_FAMILY = "table-row"

function mergeAdjacentSameSyntax(
  source: string,
  checkpoints: readonly SyntaxCheckpoint[],
  familyOf: readonly (string | null)[],
): SyntaxCheckpoint[] {
  const merged: SyntaxCheckpoint[] = []
  const mergedFamilies: (string | null)[] = []
  for (const [position, checkpoint] of checkpoints.entries()) {
    const family = familyOf[position] ?? null
    const previousFamily = mergedFamilies.at(-1) ?? null
    const tableRow =
      family === TABLE_ROW_FAMILY || previousFamily === TABLE_ROW_FAMILY
    const previous = tableRow ? undefined : merged.at(-1)
    const between = previous
      ? source.slice(previous.targetTo, checkpoint.targetFrom)
      : null
    if (
      !previous ||
      between === null ||
      !/^[\t ]*\n[\n\t ]*$/.test(between) ||
      indentationOf(source, previous) !== indentationOf(source, checkpoint) ||
      !sameSyntax(previous, checkpoint)
    ) {
      merged.push(checkpoint)
      mergedFamilies.push(family)
      continue
    }

    // `mergeSegments` guarantees no two locked segments sit side by side, and
    // joining two cards must not break that: the text between them is locked
    // and so is the tail of the card before it.
    const segments: GuidedSyntaxSegment[] = []
    for (const segment of [
      ...previous.segments,
      { kind: "locked", value: between } as const,
      ...checkpoint.segments,
    ]) {
      const tail = segments.at(-1)
      if (tail?.kind === "locked" && segment.kind === "locked") {
        tail.value += segment.value
        continue
      }
      segments.push({ ...segment })
    }
    merged[merged.length - 1] = {
      ...previous,
      targetTo: checkpoint.targetTo,
      segments,
      canonicalInput: segments
        .filter(
          (segment): segment is Extract<GuidedSyntaxSegment, { kind: "input" }> =>
            segment.kind === "input",
        )
        .map((segment) => segment.value)
        .join(""),
    }
  }
  return merged
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
  markNodeSyntax(parseMarkdownSource(source), source, mask, groupedRanges, families)
  unmaskLineLeadingWhitespace(source, mask, families)

  const checkpoints: SyntaxCheckpoint[] = []
  // The family each checkpoint's first blank belongs to. Only the merge step
  // reads it, to keep a table's rows apart.
  const checkpointFamilies: (string | null)[] = []
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
      // A row is a table row whenever *any* of its blanks is a bar. Reading
      // only the first blank's family lost the rows whose first mark is
      // something else — a bold cell, or the `> ` of a quoted table — and the
      // never-join rule then collapsed them onto one card.
      const holdsTableBar = families
        .slice(contentStart, checkpointEnd)
        .some((candidate, offset) =>
          candidate === TABLE_ROW_FAMILY && mask[contentStart + offset] === true,
        )
      checkpointFamilies.push(
        holdsTableBar ? TABLE_ROW_FAMILY : (families[activeOffset] ?? null),
      )
    }

    if (checkpointEnd >= source.length) break
    lineStart = checkpointEnd + 1
  }

  return mergeAdjacentSameSyntax(source, checkpoints, checkpointFamilies)
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
  const listStyles = coherentListStyles(
    target,
    completedCheckpoints,
    completedValues,
  )

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
        normalizeListStyle(
          checkpoint,
          acceptedValue,
          listStyles.get(indentationOf(target, checkpoint)) ?? {},
        ),
      ),
    )
    cursor = checkpoint.targetTo
  }

  parts.push(target.slice(cursor, draftEnd))
  return parts.join("")
}
