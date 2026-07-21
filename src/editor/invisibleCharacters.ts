import { RangeSetBuilder, type Extension } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type ViewUpdate,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view"

export type InvisibleCharacter = {
  from: number
  to: number
  kind:
    | "space"
    | "tab"
    | "line-break"
    | "non-breaking-space"
    | "ideographic-space"
}

function invisibleCharacterKind(
  character: string | undefined,
  leading = false,
): InvisibleCharacter["kind"] | null {
  switch (character) {
    case " ":
      return leading ? "space" : null
    case "\t":
      return "tab"
    case "\n":
      return "line-break"
    case "\u00a0":
      return "non-breaking-space"
    case "\u3000":
      return "ideographic-space"
    default:
      return null
  }
}

export function findInvisibleCharacters(source: string): InvisibleCharacter[] {
  const characters: InvisibleCharacter[] = []
  let leading = true

  for (let position = 0; position < source.length; position += 1) {
    const character = source[position]
    const kind = invisibleCharacterKind(character, leading)

    if (kind) {
      characters.push({
        from: position,
        to: position + 1,
        kind,
      })
    }

    if (character === "\n") {
      leading = true
    } else if (!/[ \t\u00a0\u3000]/.test(character ?? "")) {
      leading = false
    }
  }

  return characters
}

class FormattingMarkWidget extends WidgetType {
  constructor(private readonly kind: InvisibleCharacter["kind"]) {
    super()
  }

  override eq(other: FormattingMarkWidget): boolean {
    return this.kind === other.kind
  }

  override toDOM(): HTMLElement {
    const marker = document.createElement("span")
    marker.ariaHidden = "true"
    marker.className = `cm-invisible-character cm-invisible-character--${this.kind}`
    marker.textContent = {
      space: "·",
      tab: "→",
      "line-break": "↵",
      "non-breaking-space": "⍽",
      "ideographic-space": "□",
    }[this.kind]
    return marker
  }

  override ignoreEvent(): boolean {
    return true
  }
}

export function buildFormattingMarks(
  view: Pick<EditorView, "state" | "visibleRanges">,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const document = view.state.doc
  const marks: Array<{
    decoration: Decoration
    from: number
    to: number
  }> = []
  const lineBreaks = new Set<number>()

  for (const range of view.visibleRanges) {
    let position = range.from

    while (position <= range.to) {
      const line = document.lineAt(position)
      const text = line.text
      const visibleFrom = Math.max(range.from, line.from)
      const visibleTo = Math.min(range.to, line.to)
      const leadingWhitespaceLength = text.match(/^[ \t]*/)?.[0].length ?? 0

      for (
        let offset = visibleFrom - line.from;
        offset < visibleTo - line.from;
        offset += 1
      ) {
        const kind = invisibleCharacterKind(
          text[offset],
          offset < leadingWhitespaceLength,
        )
        if (!kind || kind === "line-break") continue
        marks.push({
          decoration: Decoration.replace({
            widget: new FormattingMarkWidget(kind),
          }),
          from: line.from + offset,
          to: line.from + offset + 1,
        })
      }

      if (
        line.to >= range.from &&
        line.to <= range.to &&
        !lineBreaks.has(line.to)
      ) {
        lineBreaks.add(line.to)
        marks.push({
          decoration: Decoration.widget({
            side: 1,
            widget: new FormattingMarkWidget("line-break"),
          }),
          from: line.to,
          to: line.to,
        })
      }

      if (line.to >= range.to || line.number === document.lines) break
      position = line.to + 1
    }
  }

  marks
    .sort((left, right) => left.from - right.from || left.to - right.to)
    .forEach(({ decoration, from, to }) => builder.add(from, to, decoration))

  return builder.finish()
}

const formattingMarkPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildFormattingMarks(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildFormattingMarks(update.view)
      }
    }
  },
  {
    decorations: (value) => value.decorations,
  },
)

export function invisibleCharacters(): Extension {
  return formattingMarkPlugin
}
