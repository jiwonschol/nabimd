import { describe, expect, it } from "vitest"
import type { MatchCheck } from "../../content/types"
import { parseMarkdown } from "../markdownAst"
import { headingCheckPasses } from "./heading"

describe("heading source predicates", () => {
  it.each([1, 2, 3, 4, 5, 6] as const)(
    "detects missing ATX spacing at depth %s",
    (level) => {
      const source = `${"#".repeat(level)}Title`
      const check: Extract<MatchCheck, { kind: "heading-spacing" }> = {
        id: `spacing-h${level}`,
        kind: "heading-spacing",
        level,
        priority: 10,
        feedback: "Add a space after the heading marker.",
      }

      expect(headingCheckPasses(check, source, parseMarkdown(source))).toBe(false)
    },
  )
})
