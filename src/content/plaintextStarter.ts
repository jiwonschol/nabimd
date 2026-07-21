import type { Nodes, Parents } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"

const unicodeSpaces = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g
const zeroWidthCharacters = /[\u200b-\u200d\u2060\ufeff]/g
const fencedCodeOpening = /^ {0,3}(?:`{3,}|~{3,})/
const alwaysMarkdownMark = /[#*_~`>\[\]()!|\\<>=]/

function isParent(node: Nodes): node is Parents {
  return "children" in node
}

function legacyVisibleChildren(node: Parents, separator: string): string {
  return node.children
    .map((child) => legacyVisibleText(child as Nodes))
    .filter((value) => value.length > 0)
    .join(separator)
}

function legacyVisibleText(node: Nodes): string {
  switch (node.type) {
    case "root":
    case "blockquote":
      return legacyVisibleChildren(node, "\n\n")
    case "list":
    case "listItem":
      return legacyVisibleChildren(node, "\n")
    case "heading":
    case "paragraph":
    case "emphasis":
    case "strong":
    case "link":
    case "linkReference":
      return legacyVisibleChildren(node, "")
    case "text":
    case "inlineCode":
    case "code":
      return node.value
    case "image":
    case "imageReference":
      return node.alt ?? ""
    case "break":
      return "\n"
    case "definition":
    case "html":
    case "thematicBreak":
      return ""
    default:
      return isParent(node) ? legacyVisibleChildren(node, "") : ""
  }
}

function normalizeLegacyPlaintext(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(unicodeSpaces, " ")
    .replace(zeroWidthCharacters, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "")
}

/**
 * Reproduces the starter projection shipped before line topology was
 * preserved. It is intentionally retained only to identify auto-generated
 * persisted drafts during the one-step storage migration.
 */
export function deriveLegacyPlaintextStarter(target: string): string {
  return normalizeLegacyPlaintext(legacyVisibleText(fromMarkdown(target)))
}

function normalizeVisibleText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(unicodeSpaces, " ")
    .replace(zeroWidthCharacters, "")
}

function projectVisibleText(
  outputLines: string[],
  value: string,
  startLine: number,
  literalLineIndexes: Set<number>,
  literal = false,
): void {
  const visibleValue = literal
    ? value.replace(/\r\n?/g, "\n")
    : normalizeVisibleText(value)

  for (const [lineOffset, text] of visibleValue
    .split("\n")
    .entries()) {
    const outputLine = startLine - 1 + lineOffset
    if (outputLine >= 0 && outputLine < outputLines.length) {
      outputLines[outputLine] += text
      if (literal) literalLineIndexes.add(outputLine)
    }
  }
}

function projectNode(
  node: Nodes,
  source: string,
  outputLines: string[],
  literalLineIndexes: Set<number>,
): void {
  const startLine = node.position?.start.line

  switch (node.type) {
    case "text":
    case "inlineCode":
      if (startLine !== undefined) {
        projectVisibleText(
          outputLines,
          node.value,
          startLine,
          literalLineIndexes,
        )
      }
      return
    case "image":
    case "imageReference":
      if (startLine !== undefined && node.alt) {
        projectVisibleText(
          outputLines,
          node.alt,
          startLine,
          literalLineIndexes,
        )
      }
      return
    case "code": {
      if (startLine === undefined) return
      const startOffset = node.position?.start.offset
      const sourceOpening =
        startOffset === undefined ? "" : source.slice(startOffset)
      const contentStartLine = fencedCodeOpening.test(sourceOpening)
        ? startLine + 1
        : startLine
      projectVisibleText(
        outputLines,
        node.value,
        contentStartLine,
        literalLineIndexes,
        true,
      )
      return
    }
    case "definition":
    case "html":
    case "thematicBreak":
    case "break":
      return
    default:
      if (isParent(node)) {
        for (const child of node.children) {
          projectNode(
            child as Nodes,
            source,
            outputLines,
            literalLineIndexes,
          )
        }
      }
  }
}

export function derivePlaintextStarter(target: string): string {
  const normalizedTarget = target.replace(/\r\n?/g, "\n")
  const sourceLines = normalizedTarget.split("\n")
  const outputLines = sourceLines.map(() => "")
  const literalLineIndexes = new Set<number>()

  projectNode(
    fromMarkdown(normalizedTarget),
    normalizedTarget,
    outputLines,
    literalLineIndexes,
  )

  return outputLines
    .map((line, index) =>
      literalLineIndexes.has(index)
        ? line
        : line.replace(/[ \t]+$/g, ""),
    )
    .join("\n")
}

export type MarkdownBlankGuide = {
  from: number
  markers: string
}

function hiddenMarkdownMarks(gap: string, atLineStart: boolean): string {
  const contextualPositions = new Set<number>()
  if (atLineStart) {
    for (const match of gap.matchAll(/(?:^|\s)(\d+[.)])(?=\s|$)/g)) {
      const marker = match[1]
      if (!marker || match.index === undefined) continue
      const markerStart = match.index + match[0].indexOf(marker)
      for (let offset = 0; offset < marker.length; offset += 1) {
        contextualPositions.add(markerStart + offset)
      }
    }
    for (const match of gap.matchAll(/(?:^|\s)([-+])(?=\s|$)/g)) {
      const marker = match[1]
      if (!marker || match.index === undefined) continue
      contextualPositions.add(match.index + match[0].indexOf(marker))
    }
    if (/^\s*-{3,}\s*$/.test(gap)) {
      for (let index = 0; index < gap.length; index += 1) {
        if (gap[index] === "-") contextualPositions.add(index)
      }
    }
  }

  return Array.from(gap)
    .filter(
      (character, index) =>
        contextualPositions.has(index) || alwaysMarkdownMark.test(character),
    )
    .join("")
}

function guidesForLine(
  targetLine: string,
  starterLine: string,
  lineStart: number,
): MarkdownBlankGuide[] {
  const guides: MarkdownBlankGuide[] = []
  let targetCursor = 0

  const appendGap = (gapEnd: number, starterColumn: number) => {
    if (gapEnd <= targetCursor) return
    const markers = hiddenMarkdownMarks(
      targetLine.slice(targetCursor, gapEnd),
      starterColumn === 0,
    )
    if (markers) {
      const from = lineStart + starterColumn
      const previous = guides.at(-1)
      if (previous?.from === from) previous.markers += markers
      else guides.push({ from, markers })
    }
  }

  for (let starterColumn = 0; starterColumn < starterLine.length; starterColumn += 1) {
    const character = starterLine[starterColumn]
    const targetPosition = targetLine.indexOf(character ?? "", targetCursor)
    if (targetPosition < 0) continue
    appendGap(targetPosition, starterColumn)
    targetCursor = targetPosition + 1
  }

  appendGap(targetLine.length, starterLine.length)
  return guides
}

/**
 * Describes only the positions and lengths of Markdown marks removed from the
 * learner's starter text. The actual characters stay internal and are never
 * inserted into, or rendered as text inside, the answer document.
 */
export function deriveMarkdownBlankGuides(
  target: string,
): MarkdownBlankGuide[] {
  const normalizedTarget = target.replace(/\r\n?/g, "\n")
  const starter = derivePlaintextStarter(normalizedTarget)
  const targetLines = normalizedTarget.split("\n")
  const starterLines = starter.split("\n")
  const guides: MarkdownBlankGuide[] = []
  let lineStart = 0

  for (let lineIndex = 0; lineIndex < starterLines.length; lineIndex += 1) {
    const starterLine = starterLines[lineIndex] ?? ""
    guides.push(
      ...guidesForLine(
        targetLines[lineIndex] ?? "",
        starterLine,
        lineStart,
      ),
    )
    lineStart += starterLine.length + 1
  }

  return guides
}
