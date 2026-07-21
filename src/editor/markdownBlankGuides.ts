import type { Extension } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type ViewUpdate,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view"
import type { MarkdownBlankGuide } from "../content/plaintextStarter"

export type MarkdownBlankGuideSource = {
  guides: readonly MarkdownBlankGuide[]
  starterText: string
}

type ActiveGuide = MarkdownBlankGuide & {
  to: number
}

function lineStarts(source: string): number[] {
  const starts = [0]
  for (let position = 0; position < source.length; position += 1) {
    if (source[position] === "\n") starts.push(position + 1)
  }
  return starts
}

function lineIndexAt(starts: readonly number[], position: number): number {
  let low = 0
  let high = starts.length - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const start = starts[middle] ?? 0
    if (start <= position) low = middle + 1
    else high = middle - 1
  }
  return Math.max(0, high)
}

function greedyCharacterMap(starterLine: string, currentLine: string): number[] {
  const positions: number[] = []
  let currentCursor = 0

  for (let index = 0; index < starterLine.length; index += 1) {
    const position = currentLine.indexOf(starterLine[index] ?? "", currentCursor)
    positions.push(position)
    if (position >= 0) currentCursor = position + 1
  }

  return positions
}

function initialGuideRanges(
  current: string,
  source: MarkdownBlankGuideSource,
): ActiveGuide[] {
  const starterStarts = lineStarts(source.starterText)
  const currentStarts = lineStarts(current)
  const starterLines = source.starterText.split("\n")
  const currentLines = current.split("\n")
  const maps = new Map<number, number[]>()

  return source.guides.map((guide) => {
    const lineIndex = lineIndexAt(starterStarts, guide.from)
    const starterStart = starterStarts[lineIndex] ?? 0
    const currentStart = currentStarts[lineIndex] ?? current.length
    const starterLine = starterLines[lineIndex] ?? ""
    const currentLine = currentLines[lineIndex] ?? ""
    const column = Math.max(
      0,
      Math.min(starterLine.length, guide.from - starterStart),
    )
    let map = maps.get(lineIndex)
    if (!map) {
      map = greedyCharacterMap(starterLine, currentLine)
      maps.set(lineIndex, map)
    }

    const previous = column > 0 ? map[column - 1] : undefined
    const next = column < starterLine.length ? map[column] : undefined
    const fromColumn =
      previous !== undefined && previous >= 0
        ? previous + 1
        : Math.min(column, currentLine.length)
    const toColumn =
      next !== undefined && next >= fromColumn
        ? next
        : column === starterLine.length
          ? currentLine.length
          : fromColumn

    return {
      ...guide,
      from: currentStart + fromColumn,
      to: currentStart + toColumn,
    }
  })
}

function matchedMarkerCount(fragment: string, markers: string): number {
  let matched = 0
  for (const character of fragment) {
    if (character === markers[matched]) matched += 1
    if (matched === markers.length) break
  }
  return matched
}

class BlankGuideWidget extends WidgetType {
  constructor(private readonly count: number) {
    super()
  }

  override eq(other: BlankGuideWidget): boolean {
    return this.count === other.count
  }

  override toDOM(): HTMLElement {
    const guide = document.createElement("span")
    guide.ariaHidden = "true"
    guide.className = "cm-markdown-blank-guide"
    for (let index = 0; index < this.count; index += 1) {
      const cell = document.createElement("span")
      cell.className = "cm-markdown-blank-guide__cell"
      guide.append(cell)
    }
    return guide
  }

  override ignoreEvent(): boolean {
    return true
  }
}

function buildDecorations(
  view: EditorView,
  guides: readonly ActiveGuide[],
): DecorationSet {
  const ranges = guides.flatMap((guide) => {
    const fragment = view.state.doc.sliceString(guide.from, guide.to)
    const remaining =
      guide.markers.length - matchedMarkerCount(fragment, guide.markers)
    if (remaining <= 0) return []
    return [
      Decoration.widget({
        side: 1,
        widget: new BlankGuideWidget(remaining),
      }).range(guide.to),
    ]
  })

  return Decoration.set(ranges, true)
}

export function markdownBlankGuides(source: MarkdownBlankGuideSource): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      private guides: ActiveGuide[]

      constructor(view: EditorView) {
        this.guides = initialGuideRanges(view.state.doc.toString(), source)
        this.decorations = buildDecorations(view, this.guides)
      }

      update(update: ViewUpdate) {
        if (!update.docChanged && !update.viewportChanged) return
        if (update.docChanged) {
          let replacedWholeDocument = false
          update.changes.iterChanges((fromA, toA) => {
            if (fromA === 0 && toA === update.startState.doc.length) {
              replacedWholeDocument = true
            }
          })
          this.guides = replacedWholeDocument
            ? initialGuideRanges(update.state.doc.toString(), source)
            : this.guides.map((guide) => ({
                ...guide,
                from: update.changes.mapPos(guide.from, -1),
                to: update.changes.mapPos(guide.to, 1),
              }))
        }
        this.decorations = buildDecorations(update.view, this.guides)
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  )
}
