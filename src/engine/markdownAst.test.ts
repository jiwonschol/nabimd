import { describe, expect, it } from "vitest"
import type { Heading } from "mdast"
import { headingsAtLevel, isHashHeading, parseMarkdown } from "./markdownAst"

describe("ATX heading source recognition", () => {
  it.each([1, 2, 3, 4, 5, 6] as const)(
    "recognizes an H%i ATX heading at its parsed depth",
    (depth) => {
      const source = `${"#".repeat(depth)} Heading`
      const [heading] = headingsAtLevel(
        parseMarkdown(source),
        depth as Heading["depth"],
      )

      expect(heading).toBeDefined()
      expect(isHashHeading(source, heading!)).toBe(true)
    },
  )

  it.each([
    { source: "Heading\n=======", depth: 1 },
    { source: "Heading\n-------", depth: 2 },
  ] as const)("does not mistake a Setext H$depth for ATX", ({ source, depth }) => {
    const [heading] = headingsAtLevel(
      parseMarkdown(source),
      depth as Heading["depth"],
    )

    expect(heading).toBeDefined()
    expect(isHashHeading(source, heading!)).toBe(false)
  })
})
