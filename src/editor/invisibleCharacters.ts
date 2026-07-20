import { RangeSetBuilder, type Extension } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view"

export type InvisibleCharacter = {
  from: number
  to: number
  kind: "tab" | "line-break" | "non-breaking-space" | "ideographic-space"
}

function invisibleCharacterKind(
  character: string | undefined,
): InvisibleCharacter["kind"] | null {
  switch (character) {
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

  for (let position = 0; position < source.length; position += 1) {
    const kind = invisibleCharacterKind(source[position])
    if (!kind) continue

    characters.push({
      from: position,
      to: position + 1,
      kind,
    })
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

function buildFormattingMarks(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const document = view.state.doc

  for (let lineNumber = 1; lineNumber <= document.lines; lineNumber += 1) {
    const line = document.line(lineNumber)

    for (let position = line.from; position < line.to; position += 1) {
      const kind = invisibleCharacterKind(document.sliceString(position, position + 1))
      if (!kind || kind === "line-break") continue
      builder.add(
        position,
        position + 1,
        Decoration.replace({ widget: new FormattingMarkWidget(kind) }),
      )
    }

    builder.add(
      line.to,
      line.to,
      Decoration.widget({
        side: 1,
        widget: new FormattingMarkWidget("line-break"),
      }),
    )
  }

  return builder.finish()
}

const formattingMarkPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildFormattingMarks(view)
    }

    update(update: { docChanged: boolean; view: EditorView }) {
      if (update.docChanged) this.decorations = buildFormattingMarks(update.view)
    }
  },
  {
    decorations: (value) => value.decorations,
  },
)

export function invisibleCharacters(): Extension {
  return formattingMarkPlugin
}
