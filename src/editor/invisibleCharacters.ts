import type { Extension } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view"

export type InvisibleCharacter = {
  from: number
  to: number
  kind:
    | "space"
    | "tab"
    | "non-breaking-space"
    | "ideographic-space"
}

function invisibleCharacterKind(
  character: string | undefined,
): InvisibleCharacter["kind"] | null {
  switch (character) {
    case " ":
      return "space"
    case "\t":
      return "tab"
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

class InvisibleCharacterWidget extends WidgetType {
  constructor(private readonly kind: InvisibleCharacter["kind"]) {
    super()
  }

  override eq(other: InvisibleCharacterWidget): boolean {
    return this.kind === other.kind
  }

  override toDOM(): HTMLElement {
    const marker = document.createElement("span")
    marker.ariaHidden = "true"
    marker.className = `cm-invisible-character cm-invisible-character--${this.kind}`
    marker.textContent = {
      space: "·",
      tab: "→",
      "non-breaking-space": "⍽",
      "ideographic-space": "□",
    }[this.kind]
    return marker
  }

  override ignoreEvent(): boolean {
    return true
  }
}

const invisibleDecorator = new MatchDecorator({
  regexp: /[ \t\u00a0\u3000]/g,
  decoration: (match) =>
    Decoration.replace({
      widget: new InvisibleCharacterWidget(invisibleCharacterKind(match[0])!),
    }),
})

const invisibleCharacterPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = invisibleDecorator.createDeco(view)
    }

    update(update: Parameters<typeof invisibleDecorator.updateDeco>[0]) {
      this.decorations = invisibleDecorator.updateDeco(
        update,
        this.decorations,
      )
    }
  },
  {
    decorations: (value) => value.decorations,
  },
)

export function invisibleCharacters(): Extension {
  return invisibleCharacterPlugin
}
