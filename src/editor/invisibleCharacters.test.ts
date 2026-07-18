import { describe, expect, it } from "vitest"
import { findInvisibleCharacters } from "./invisibleCharacters"

describe("findInvisibleCharacters", () => {
  it("finds spaces and tabs but leaves line breaks alone", () => {
    expect(findInvisibleCharacters("# Rainy\tday\nNext")).toEqual([
      { from: 1, to: 2, kind: "space" },
      { from: 7, to: 8, kind: "tab" },
    ])
  })

  it("does not mutate the source it annotates", () => {
    const source = "# Study tools"

    findInvisibleCharacters(source)

    expect(source).toBe("# Study tools")
  })
})
