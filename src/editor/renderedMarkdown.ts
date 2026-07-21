import { StateField, type Extension } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"

type MdNode = {
  alt?: string | null
  checked?: boolean | null
  children?: MdNode[]
  depth?: number
  identifier?: string
  label?: string | null
  ordered?: boolean | null
  position?: {
    start: { line: number; offset?: number }
    end: { line: number; offset?: number }
  }
  type: string
}

type SourceLine = {
  from: number
  number: number
  text: string
  to: number
}

export type RenderedMarkdownToken =
  | {
      className: string
      from: number
      kind: "mark"
      to: number
    }
  | {
      className: string
      from: number
      kind: "line"
      sourceLine: number
      to: number
    }
  | {
      from: number
      kind: "replace"
      replacement:
        | "conceal"
        | "definition"
        | "escaped-pipe"
        | "fence"
        | "footnote"
        | "image"
        | "list"
        | "quote"
        | "rule"
        | "table-pipe"
        | "table-separator"
      source: string
      to: number
      glyph?: string
    }

function sourceLines(source: string): SourceLine[] {
  const lines: SourceLine[] = []
  let from = 0

  source.split("\n").forEach((text, index) => {
    const to = from + text.length
    lines.push({ from, number: index + 1, text, to })
    from = to + 1
  })

  return lines
}

function offsets(node: MdNode): { from: number; to: number } | null {
  const from = node.position?.start.offset
  const to = node.position?.end.offset
  return from === undefined || to === undefined ? null : { from, to }
}

function childBounds(node: MdNode): { from: number; to: number } | null {
  const first = node.children?.[0]
  const last = node.children?.at(-1)
  const from = first?.position?.start.offset
  const to = last?.position?.end.offset
  return from === undefined || to === undefined ? null : { from, to }
}

function lineByNumber(lines: SourceLine[], number: number): SourceLine | null {
  return lines[number - 1] ?? null
}

function addConcealedDelimiters(
  tokens: RenderedMarkdownToken[],
  node: MdNode,
  className: string,
  source: string,
) {
  const outer = offsets(node)
  const inner = childBounds(node)
  if (!outer || !inner) return

  if (outer.from < inner.from) {
    tokens.push({
      from: outer.from,
      kind: "replace",
      replacement: "conceal",
      source: source.slice(outer.from, inner.from),
      to: inner.from,
    })
  }
  if (inner.to < outer.to) {
    tokens.push({
      from: inner.to,
      kind: "replace",
      replacement: "conceal",
      source: source.slice(inner.to, outer.to),
      to: outer.to,
    })
  }
  if (inner.from < inner.to) {
    tokens.push({
      className,
      from: inner.from,
      kind: "mark",
      to: inner.to,
    })
  }
}

/**
 * Projects rendered Markdown styling onto the original source document.
 * Newline characters are never included in replacement ranges, so every
 * authored source row remains a real CodeMirror row.
 */
export function findRenderedMarkdownTokens(
  source: string,
): RenderedMarkdownToken[] {
  const lines = sourceLines(source)
  const tokens: RenderedMarkdownToken[] = lines.map((line) => ({
    className: "cm-rendered-source-line",
    from: line.from,
    kind: "line",
    sourceLine: line.number,
    to: line.from,
  }))
  const root = fromMarkdown(source, {
    extensions: [gfm({ singleTilde: false })],
    mdastExtensions: [gfmFromMarkdown()],
  }) as unknown as MdNode

  const visit = (node: MdNode, parent?: MdNode) => {
    const nodeOffsets = offsets(node)

    switch (node.type) {
      case "heading": {
        const line = node.position
          ? lineByNumber(lines, node.position.start.line)
          : null
        if (line && nodeOffsets) {
          const relativeStart = nodeOffsets.from - line.from
          const prefix = /^(#{1,6})[ \t]+/.exec(
            line.text.slice(relativeStart),
          )?.[0]
          if (prefix) {
            tokens.push({
              from: nodeOffsets.from,
              kind: "replace",
              replacement: "conceal",
              source: prefix,
              to: nodeOffsets.from + prefix.length,
            })
            tokens.push({
              className: `cm-rendered-heading cm-rendered-heading--${node.depth ?? 1}`,
              from: nodeOffsets.from + prefix.length,
              kind: "mark",
              to: line.to,
            })
          }
        }
        break
      }
      case "strong":
        addConcealedDelimiters(tokens, node, "cm-rendered-strong", source)
        break
      case "emphasis":
        addConcealedDelimiters(tokens, node, "cm-rendered-emphasis", source)
        break
      case "delete":
        addConcealedDelimiters(tokens, node, "cm-rendered-delete", source)
        break
      case "link":
        addConcealedDelimiters(tokens, node, "cm-rendered-link", source)
        break
      case "linkReference":
        addConcealedDelimiters(tokens, node, "cm-rendered-link", source)
        break
      case "image": {
        if (!nodeOffsets) break
        const raw = source.slice(nodeOffsets.from, nodeOffsets.to)
        if (raw.includes("\n")) break
        tokens.push({
          from: nodeOffsets.from,
          glyph: `[Image: ${node.alt || "image"}]`,
          kind: "replace",
          replacement: "image",
          source: raw,
          to: nodeOffsets.to,
        })
        break
      }
      case "imageReference": {
        if (!nodeOffsets) break
        const raw = source.slice(nodeOffsets.from, nodeOffsets.to)
        if (raw.includes("\n")) break
        tokens.push({
          from: nodeOffsets.from,
          glyph: `[Image: ${node.alt || "image"}]`,
          kind: "replace",
          replacement: "image",
          source: raw,
          to: nodeOffsets.to,
        })
        break
      }
      case "inlineCode": {
        if (!nodeOffsets) break
        const raw = source.slice(nodeOffsets.from, nodeOffsets.to)
        const opening = /^`+/.exec(raw)?.[0] ?? ""
        const closing = /`+$/.exec(raw)?.[0] ?? ""
        const contentFrom = nodeOffsets.from + opening.length
        const contentTo = nodeOffsets.to - closing.length
        if (opening) {
          tokens.push({
            from: nodeOffsets.from,
            kind: "replace",
            replacement: "conceal",
            source: opening,
            to: contentFrom,
          })
        }
        if (contentFrom < contentTo) {
          tokens.push({
            className: "cm-rendered-inline-code",
            from: contentFrom,
            kind: "mark",
            to: contentTo,
          })
        }
        if (closing) {
          tokens.push({
            from: contentTo,
            kind: "replace",
            replacement: "conceal",
            source: closing,
            to: nodeOffsets.to,
          })
        }
        break
      }
      case "listItem": {
        if (!nodeOffsets || !node.position) break
        const line = lineByNumber(lines, node.position.start.line)
        if (!line) break
        const itemSource = source.slice(nodeOffsets.from, line.to)
        const taskMarker = /^(?:\d+[.)]|[-+*])[ \t]+\[([ xX])\][ \t]+/.exec(
          itemSource,
        )
        const marker =
          taskMarker?.[0] ??
          /^(\d+[.)]|[-+*])([ \t]+)/.exec(itemSource)?.[0]
        if (!marker) break
        const authoredMarker = marker.trimEnd()
        const nested = nodeOffsets.from > line.from
        tokens.push({
          from: nodeOffsets.from,
          glyph:
            taskMarker !== null
              ? node.checked
                ? "☑"
                : "☐"
              : parent?.ordered
                ? authoredMarker
                : nested
                  ? "◦"
                  : "•",
          kind: "replace",
          replacement: "list",
          source: marker,
          to: nodeOffsets.from + marker.length,
        })
        break
      }
      case "table": {
        if (!node.position) break
        for (
          let number = node.position.start.line;
          number <= node.position.end.line;
          number += 1
        ) {
          const line = lineByNumber(lines, number)
          if (!line || line.from === line.to) continue
          const separator = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(
            line.text,
          )
          if (separator) {
            tokens.push({
              from: line.from,
              glyph: "────────────────",
              kind: "replace",
              replacement: "table-separator",
              source: line.text,
              to: line.to,
            })
            continue
          }

          if (number === node.position.start.line) {
            tokens.push({
              className: "cm-rendered-table-header",
              from: line.from,
              kind: "mark",
              to: line.to,
            })
          }
          for (let index = 0; index < line.text.length; index += 1) {
            if (
              line.text[index] === "\\" &&
              line.text[index + 1] === "|" &&
              line.text[index - 1] !== "\\"
            ) {
              const from = line.from + index
              tokens.push({
                from,
                glyph: "|",
                kind: "replace",
                replacement: "escaped-pipe",
                source: "\\|",
                to: from + 2,
              })
              index += 1
              continue
            }
            if (line.text[index] !== "|") continue
            const from = line.from + index
            tokens.push({
              from,
              glyph: "│",
              kind: "replace",
              replacement: "table-pipe",
              source: "|",
              to: from + 1,
            })
          }
        }
        break
      }
      case "footnoteReference": {
        if (!nodeOffsets) break
        const raw = source.slice(nodeOffsets.from, nodeOffsets.to)
        if (raw.includes("\n")) break
        tokens.push({
          from: nodeOffsets.from,
          glyph: `[${node.label ?? node.identifier ?? "note"}]`,
          kind: "replace",
          replacement: "footnote",
          source: raw,
          to: nodeOffsets.to,
        })
        break
      }
      case "footnoteDefinition": {
        if (!nodeOffsets || !node.position) break
        const line = lineByNumber(lines, node.position.start.line)
        if (!line) break
        const prefix = /^\[\^[^\]]+\]:[ \t]*/.exec(line.text)?.[0]
        if (!prefix) break
        tokens.push({
          from: line.from,
          glyph: `[${node.label ?? node.identifier ?? "note"}] `,
          kind: "replace",
          replacement: "footnote",
          source: prefix,
          to: line.from + prefix.length,
        })
        break
      }
      case "definition": {
        if (!node.position) break
        for (
          let number = node.position.start.line;
          number <= node.position.end.line;
          number += 1
        ) {
          const line = lineByNumber(lines, number)
          if (!line || line.from === line.to) continue
          tokens.push({
            from: line.from,
            kind: "replace",
            replacement: "definition",
            source: line.text,
            to: line.to,
          })
        }
        break
      }
      case "blockquote": {
        if (!node.position) break
        for (
          let number = node.position.start.line;
          number <= node.position.end.line;
          number += 1
        ) {
          const line = lineByNumber(lines, number)
          if (!line) continue
          const match = /^([ \t]*)(>[ \t]?)/.exec(line.text)
          if (!match) continue
          const leading = match[1]?.length ?? 0
          const marker = match[2] ?? ">"
          const markerFrom = line.from + leading
          tokens.push({
            from: markerFrom,
            glyph: "│",
            kind: "replace",
            replacement: "quote",
            source: marker,
            to: markerFrom + marker.length,
          })
          if (markerFrom + marker.length < line.to) {
            tokens.push({
              className: "cm-rendered-quote",
              from: markerFrom + marker.length,
              kind: "mark",
              to: line.to,
            })
          }
        }
        break
      }
      case "code": {
        if (!node.position) break
        const first = lineByNumber(lines, node.position.start.line)
        const last = lineByNumber(lines, node.position.end.line)
        const fenced = first ? /^[ \t]*(`{3,}|~{3,})/.test(first.text) : false
        if (fenced && first && last) {
          const concealFence = (line: SourceLine) => {
            const leading = /^[ \t]*/.exec(line.text)?.[0].length ?? 0
            tokens.push({
              from: line.from + leading,
              kind: "replace",
              replacement: "fence",
              source: line.text.slice(leading),
              to: line.to,
            })
          }
          concealFence(first)
          if (last.number !== first.number) concealFence(last)
          for (
            let number = first.number + 1;
            number < last.number;
            number += 1
          ) {
            const line = lineByNumber(lines, number)
            if (line && line.from < line.to) {
              tokens.push({
                className: "cm-rendered-code-block",
                from: line.from,
                kind: "mark",
                to: line.to,
              })
            }
          }
        } else if (nodeOffsets) {
          tokens.push({
            className: "cm-rendered-code-block",
            from: nodeOffsets.from,
            kind: "mark",
            to: nodeOffsets.to,
          })
        }
        break
      }
      case "thematicBreak": {
        if (!nodeOffsets) break
        tokens.push({
          from: nodeOffsets.from,
          kind: "replace",
          replacement: "rule",
          source: source.slice(nodeOffsets.from, nodeOffsets.to),
          to: nodeOffsets.to,
        })
        break
      }
      case "html": {
        if (!node.position) break
        for (
          let number = node.position.start.line;
          number <= node.position.end.line;
          number += 1
        ) {
          const line = lineByNumber(lines, number)
          if (!line || line.from === line.to) continue
          tokens.push({
            from: line.from,
            kind: "replace",
            replacement: "fence",
            source: line.text,
            to: line.to,
          })
        }
        break
      }
    }

    node.children?.forEach((child) => visit(child, node))
  }

  visit(root)
  return tokens
}

class RenderedSyntaxWidget extends WidgetType {
  constructor(
    private readonly replacement: Extract<
      RenderedMarkdownToken,
      { kind: "replace" }
    >,
  ) {
    super()
  }

  override eq(other: RenderedSyntaxWidget): boolean {
    return (
      this.replacement.replacement === other.replacement.replacement &&
      this.replacement.source === other.replacement.source &&
      this.replacement.glyph === other.replacement.glyph
    )
  }

  override toDOM(): HTMLElement {
    const widget = document.createElement("span")
    widget.ariaHidden = "true"
    widget.className = `cm-rendered-widget cm-rendered-widget--${this.replacement.replacement}`

    if (
      this.replacement.replacement === "list" ||
      this.replacement.replacement === "quote"
    ) {
      const measure = document.createElement("span")
      measure.className = "cm-rendered-widget__measure"
      measure.textContent = this.replacement.source
      const glyph = document.createElement("span")
      glyph.className = "cm-rendered-widget__glyph"
      glyph.textContent = this.replacement.glyph ?? ""
      widget.append(measure, glyph)
    } else if (this.replacement.replacement === "rule") {
      widget.textContent = "───"
    } else if (this.replacement.replacement === "image") {
      widget.textContent = this.replacement.glyph ?? "[Image: image]"
    } else if (
      this.replacement.replacement === "footnote" ||
      this.replacement.replacement === "escaped-pipe" ||
      this.replacement.replacement === "table-pipe" ||
      this.replacement.replacement === "table-separator"
    ) {
      widget.textContent = this.replacement.glyph ?? ""
    } else if (this.replacement.replacement === "conceal") {
      widget.textContent = this.replacement.source
    }

    return widget
  }

  override ignoreEvent(): boolean {
    return true
  }
}

function buildDecorations(source: string): DecorationSet {
  const ranges = findRenderedMarkdownTokens(source).map((token) => {
    if (token.kind === "line") {
      return Decoration.line({
        attributes: {
          "data-source-line": String(token.sourceLine),
        },
        class: token.className,
      }).range(token.from)
    }

    if (token.kind === "mark") {
      return Decoration.mark({ class: token.className }).range(
        token.from,
        token.to,
      )
    }

    return Decoration.replace({
      widget: new RenderedSyntaxWidget(token),
    }).range(token.from, token.to)
  })

  return Decoration.set(ranges, true)
}

export function renderedMarkdown(): Extension {
  return [
    StateField.define<DecorationSet>({
      create(state) {
        return buildDecorations(state.doc.toString())
      },
      update(decorations, transaction) {
        if (!transaction.docChanged) return decorations
        return buildDecorations(transaction.newDoc.toString())
      },
      provide: (field) => EditorView.decorations.from(field),
    }),
    EditorView.contentAttributes.of({
      "data-presentation": "rendered",
    }),
  ]
}
