import { EditorState } from "@codemirror/state"
import { describe, expect, it } from "vitest"
import {
  buildFormattingMarks,
  findInvisibleCharacters,
} from "./invisibleCharacters"

describe("findInvisibleCharacters", () => {
  it("marks leading spaces, tabs, and line breaks without marking word spaces", () => {
    expect(findInvisibleCharacters("  # Rainy\tday\nNext words")).toEqual([
      { from: 0, to: 1, kind: "space" },
      { from: 1, to: 2, kind: "space" },
      { from: 9, to: 10, kind: "tab" },
      { from: 13, to: 14, kind: "line-break" },
    ])
  })

  it("does not mutate the source it annotates", () => {
    const source = "# Study tools"

    findInvisibleCharacters(source)

    expect(source).toBe("# Study tools")
  })

  it("distinguishes NBSP and ideographic-space traps", () => {
    expect(findInvisibleCharacters("# \t\u00a0\u3000Apple")).toEqual([
      { from: 2, to: 3, kind: "tab" },
      { from: 3, to: 4, kind: "non-breaking-space" },
      { from: 4, to: 5, kind: "ideographic-space" },
    ])
  })

  it("decorates only visible ranges while retaining the visible line break", () => {
    const state = EditorState.create({ doc: "visible\t\nhidden\t" })
    const decorations = buildFormattingMarks({
      state,
      visibleRanges: [{ from: 0, to: 8 }],
    })
    const positions: Array<{ from: number; to: number }> = []

    decorations.between(0, state.doc.length, (from, to) => {
      positions.push({ from, to })
    })

    expect(positions).toEqual([
      { from: 7, to: 8 },
      { from: 8, to: 8 },
    ])
  })

  it("decorates only the spaces before the first visible character", () => {
    const state = EditorState.create({ doc: "   nested item" })
    const decorations = buildFormattingMarks({
      state,
      visibleRanges: [{ from: 0, to: state.doc.length }],
    })
    const positions: Array<{ from: number; to: number }> = []

    decorations.between(0, state.doc.length, (from, to) => {
      positions.push({ from, to })
    })

    expect(positions).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 14, to: 14 },
    ])
  })
})
