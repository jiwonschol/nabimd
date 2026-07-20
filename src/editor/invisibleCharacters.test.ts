import { describe, expect, it } from "vitest"
import { findInvisibleCharacters } from "./invisibleCharacters"

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
})
