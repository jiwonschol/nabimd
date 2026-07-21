import { EditorState } from "@codemirror/state"
import { describe, expect, it } from "vitest"
import {
  buildFormattingMarks,
  findInvisibleCharacters,
} from "./invisibleCharacters"

describe("findInvisibleCharacters", () => {
  it("finds tabs and line breaks without marking ordinary spaces", () => {
    expect(findInvisibleCharacters("# Rainy\tday\nNext")).toEqual([
      { from: 7, to: 8, kind: "tab" },
      { from: 11, to: 12, kind: "line-break" },
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
})
