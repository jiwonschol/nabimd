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
  start?: number | null
  value?: string
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

function addCodeBlockLineClass(
  tokens: RenderedMarkdownToken[],
  lineNumber: number,
): void {
  const baseLine = tokens[lineNumber - 1]
  if (
    baseLine?.kind === "line" &&
    !baseLine.className.split(" ").includes("cm-rendered-code-block-line")
  ) {
    baseLine.className += " cm-rendered-code-block-line"
  }
}

function conceal(
  tokens: RenderedMarkdownToken[],
  source: string,
  from: number,
  to: number,
) {
  let segmentFrom = from

  while (segmentFrom < to) {
    const newline = source.indexOf("\n", segmentFrom)
    const segmentTo = newline === -1 || newline >= to ? to : newline
    if (segmentFrom < segmentTo) {
      tokens.push({
        from: segmentFrom,
        kind: "replace",
        replacement: "conceal",
        source: source.slice(segmentFrom, segmentTo),
        to: segmentTo,
      })
    }
    if (newline === -1 || newline >= to) break
    segmentFrom = newline + 1
  }
}

function fenceMarker(raw: string): string | null {
  return /^(`{3,}|~{3,})/.exec(raw)?.[1] ?? null
}

function visualColumn(text: string, rawColumn: number): number {
  let column = 0
  for (let index = 0; index < rawColumn; index += 1) {
    column =
      text[index] === "\t" ? column + (4 - (column % 4)) : column + 1
  }
  return column
}

function rawCodeContentFrom(line: SourceLine, value: string): number | null {
  if (!value) return null
  if (line.text.endsWith(value)) return line.to - value.length

  const withoutNormalizedIndent = value.trimStart()
  if (
    withoutNormalizedIndent &&
    line.text.endsWith(withoutNormalizedIndent)
  ) {
    return line.to - withoutNormalizedIndent.length
  }
  return null
}

function closingFenceFrom(
  line: SourceLine,
  openingVisualColumn: number,
  openingMarker: string,
  quoteDepth: number,
  listDepth: number,
): number | null {
  const minimum = openingMarker.length
  const markerCharacter = openingMarker.charAt(0)
  const quoteMarkers = findContainerQuoteMarkers(
    line.text,
    quoteDepth,
    listDepth,
  )
  if (!quoteMarkers) return null
  const contentColumn = quoteMarkers.at(-1)?.to ?? 0
  const suffix = line.text.slice(contentColumn)
  const match = /^([ \t]*)(`{3,}|~{3,})[ \t]*$/.exec(suffix)
  const leading = match?.[1] ?? ""
  const marker = match?.[2]
  if (!marker || marker[0] !== markerCharacter || marker.length < minimum) {
    return null
  }

  const markerColumn = contentColumn + leading.length
  const markerVisualColumn = visualColumn(line.text, markerColumn)
  const contentVisualColumn = visualColumn(line.text, contentColumn)
  if (
    listDepth === 0 &&
    markerVisualColumn - contentVisualColumn > 3
  ) {
    return null
  }
  if (
    listDepth > 0 &&
    Math.abs(markerVisualColumn - openingVisualColumn) > 3
  ) {
    return null
  }

  return line.from + markerColumn
}

type ContainerMarker = { from: number; to: number }

function findContainerQuoteMarkers(
  text: string,
  quoteDepth: number,
  listDepth: number,
): ContainerMarker[] | null {
  if (quoteDepth === 0) return []

  const markers: ContainerMarker[] = []
  let cursor = 0
  let remainingLists = listDepth

  while (cursor < text.length && markers.length < quoteDepth) {
    while (text[cursor] === " " || text[cursor] === "\t") cursor += 1

    if (remainingLists > 0) {
      const listMarker = /^(?:\d+[.)]|[-+*])[ \t]+/.exec(text.slice(cursor))
      if (listMarker) {
        cursor += listMarker[0].length
        remainingLists -= 1
        continue
      }
    }

    if (text[cursor] !== ">") return null
    const from = cursor
    cursor += 1
    if (text[cursor] === " " || text[cursor] === "\t") cursor += 1
    markers.push({ from, to: cursor })
  }

  return markers.length === quoteDepth ? markers : null
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
    conceal(tokens, source, outer.from, inner.from)
  }
  if (inner.to < outer.to) {
    conceal(tokens, source, inner.to, outer.to)
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

  const visit = (node: MdNode, parent?: MdNode, ancestors: MdNode[] = []) => {
    const nodeOffsets = offsets(node)

    switch (node.type) {
      case "heading": {
        const first = node.position
          ? lineByNumber(lines, node.position.start.line)
          : null
        const last = node.position
          ? lineByNumber(lines, node.position.end.line)
          : null
        if (first && last && nodeOffsets) {
          const relativeStart = nodeOffsets.from - first.from
          const atx = /^(#{1,6})(?:[ \t]+|$)/.exec(
            first.text.slice(relativeStart),
          )
          const inner = childBounds(node)
          const className = `cm-rendered-heading cm-rendered-heading--${node.depth ?? 1}`

          if (atx) {
            if (!inner) {
              conceal(tokens, source, nodeOffsets.from, nodeOffsets.to)
              break
            }
            conceal(tokens, source, nodeOffsets.from, inner.from)
            tokens.push({
              className,
              from: inner.from,
              kind: "mark",
              to: inner.to,
            })
            conceal(tokens, source, inner.to, nodeOffsets.to)
            break
          }

          if (first.number !== last.number && inner) {
            tokens.push({
              className,
              from: inner.from,
              kind: "mark",
              to: inner.to,
            })
            const underline = /(?:=+|-+)[ \t]*$/.exec(last.text)
            if (underline) {
              conceal(
                tokens,
                source,
                last.from + (underline.index ?? 0),
                last.to,
              )
            }
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
        const listDepth = ancestors.filter(
          (ancestor) => ancestor.type === "list",
        ).length
        const nested = listDepth > 1
        const itemIndex = parent?.children?.indexOf(node) ?? -1
        const ordinal = (parent?.start ?? 1) + Math.max(itemIndex, 0)
        tokens.push({
          from: nodeOffsets.from,
          glyph:
            taskMarker !== null
              ? node.checked
                ? "☑"
                : "☐"
              : parent?.ordered
                ? `${ordinal}.`
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
          const separator =
            number === node.position.start.line + 1 &&
            /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(
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
        const match = /^( {0,3})(\[\^[^\]]+\]:[ \t]*)/.exec(line.text)
        const indent = match?.[1] ?? ""
        const prefix = match?.[2]
        if (!prefix) break
        const prefixFrom = line.from + indent.length
        tokens.push({
          from: prefixFrom,
          glyph: `[${node.label ?? node.identifier ?? "note"}] `,
          kind: "replace",
          replacement: "footnote",
          source: prefix,
          to: prefixFrom + prefix.length,
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
        if (!node.position || !nodeOffsets) break
        const quoteDepth =
          ancestors.filter((ancestor) => ancestor.type === "blockquote")
            .length + 1
        const listDepth = ancestors.filter(
          (ancestor) => ancestor.type === "list",
        ).length
        for (
          let number = node.position.start.line;
          number <= node.position.end.line;
          number += 1
        ) {
          const line = lineByNumber(lines, number)
          if (!line) continue
          const markers = findContainerQuoteMarkers(
            line.text,
            quoteDepth,
            listDepth,
          )
          const marker = markers?.at(-1)
          if (!marker) {
            const lazyFrom = Math.max(line.from, nodeOffsets.from)
            const lazyTo = Math.min(line.to, nodeOffsets.to)
            if (lazyFrom < lazyTo) {
              tokens.push({
                className: "cm-rendered-quote",
                from: lazyFrom,
                kind: "mark",
                to: lazyTo,
              })
            }
            continue
          }
          const markerFrom = line.from + marker.from
          const markerTo = line.from + marker.to
          if (markerFrom < nodeOffsets.from || markerFrom >= nodeOffsets.to) {
            continue
          }
          tokens.push({
            from: markerFrom,
            glyph: "│",
            kind: "replace",
            replacement: "quote",
            source: source.slice(markerFrom, markerTo),
            to: markerTo,
          })
          if (markerTo < line.to) {
            tokens.push({
              className: "cm-rendered-quote",
              from: markerTo,
              kind: "mark",
              to: line.to,
            })
          }
        }
        break
      }
      case "code": {
        if (!node.position || !nodeOffsets) break
        const first = lineByNumber(lines, node.position.start.line)
        const last = lineByNumber(lines, node.position.end.line)
        const openingColumn = first ? nodeOffsets.from - first.from : 0
        const openingVisualColumn = first
          ? visualColumn(first.text, openingColumn)
          : 0
        const openingMarker = first
          ? fenceMarker(first.text.slice(openingColumn))
          : null
        if (openingMarker && first && last) {
          tokens.push({
            from: nodeOffsets.from,
            kind: "replace",
            replacement: "fence",
            source: first.text.slice(openingColumn),
            to: first.to,
          })
          const quoteDepth = ancestors.filter(
            (ancestor) => ancestor.type === "blockquote",
          ).length
          const listDepth = ancestors.filter(
            (ancestor) => ancestor.type === "list",
          ).length
          const valueLines = (node.value ?? "").split("\n")
          const closingFrom =
            last.number === first.number
              ? null
              : closingFenceFrom(
                  last,
                  openingVisualColumn,
                  openingMarker,
                  quoteDepth,
                  listDepth,
                )
          if (closingFrom !== null) {
            tokens.push({
              from: closingFrom,
              kind: "replace",
              replacement: "fence",
              source: source.slice(closingFrom, last.to),
              to: last.to,
            })
          }
          for (
            let number = first.number + 1;
            number <= last.number - (closingFrom === null ? 0 : 1);
            number += 1
          ) {
            const line = lineByNumber(lines, number)
            const value = valueLines[number - first.number - 1] ?? ""
            const contentFrom = line ? rawCodeContentFrom(line, value) : null
            if (
              line &&
              contentFrom !== null &&
              contentFrom >= line.from
            ) {
              tokens.push({
                className: "cm-rendered-code-block",
                from: contentFrom,
                kind: "mark",
                to: line.to,
              })
              // The whole row reads as code: extend the base line token so
              // the row renders as a tinted, inset panel and a code block
              // never masquerades as body prose. (One line token per source
              // row is an invariant; classes stack instead.)
              addCodeBlockLineClass(tokens, line.number)
            }
          }
        } else if (nodeOffsets) {
          tokens.push({
            className: "cm-rendered-code-block",
            from: nodeOffsets.from,
            kind: "mark",
            to: nodeOffsets.to,
          })
          const startLine = node.position?.start.line
          const endLine = node.position?.end.line
          if (startLine !== undefined && endLine !== undefined) {
            for (
              let lineNumber = startLine;
              lineNumber <= endLine;
              lineNumber += 1
            ) {
              addCodeBlockLineClass(tokens, lineNumber)
            }
          }
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
    }

    node.children?.forEach((child) =>
      visit(child, node, [...ancestors, node]),
    )
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
