import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  buildMarkdownNotationMatrix,
  markdownNotationMatrixPath,
  renderMarkdownNotationMatrix,
} from "../../scripts/markdownNotationMatrix"

describe("nested blockquote notation matrix", () => {
  it("executes all 49 forms through the parser, blank generator, and grader", () => {
    const rows = buildMarkdownNotationMatrix()
    expect(rows).toHaveLength(49)
    expect(rows.filter((row) => row.parserOpensNestedQuote)).toHaveLength(42)
    expect(rows.filter((row) => row.nestedQuoteBlankAppears)).toHaveLength(35)
    expect(rows.filter((row) => row.gradesCanonicalInput)).toHaveLength(35)
    expect(
      rows.filter((row) => !row.gradesCanonicalInput).map((row) => row.outer),
    ).toEqual([...Array(7).fill("\t "), ...Array(7).fill("\t\t")])
    const deliberatelyLocked = rows.filter(
      (row) => row.parserOpensNestedQuote && !row.gradesCanonicalInput,
    )
    expect(deliberatelyLocked).toHaveLength(7)
    expect(deliberatelyLocked.every((row) => row.reason !== "—")).toBe(true)
  })

  it("keeps the committed report generated from executable results", () => {
    expect(readFileSync(markdownNotationMatrixPath, "utf8")).toBe(
      renderMarkdownNotationMatrix(),
    )
  })
})
