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
  kind: "space" | "tab"
}

export function findInvisibleCharacters(source: string): InvisibleCharacter[] {
  const characters: InvisibleCharacter[] = []

  for (let position = 0; position < source.length; position += 1) {
    const character = source[position]
    if (character !== " " && character !== "\t") continue

    characters.push({
      from: position,
      to: position + 1,
      kind: character === " " ? "space" : "tab",
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
    marker.textContent = this.kind === "space" ? "·" : "→"
    return marker
  }

  override ignoreEvent(): boolean {
    return true
  }
}

const invisibleDecorator = new MatchDecorator({
  regexp: /[ \t]/g,
  decoration: (match) =>
    Decoration.replace({
      widget: new InvisibleCharacterWidget(
        match[0] === " " ? "space" : "tab",
      ),
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
