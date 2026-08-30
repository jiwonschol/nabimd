import { describe, expect, it } from "vitest"
import {
  SYNTAX_CAPABILITY_IDS,
  buildSyntaxCapabilityMatrix,
  renderSyntaxCapabilityMarkdown,
} from "../../scripts/syntax-capabilities/syntaxCapabilityMatrix"

describe("Level 2 and Level 3 syntax capability matrix", () => {
  it("measures every declared unlock candidate through the real learner paths", () => {
    const matrix = buildSyntaxCapabilityMatrix()

    expect(matrix.map((row) => row.id)).toEqual(SYNTAX_CAPABILITY_IDS)
    expect(matrix).toHaveLength(13)
    expect(
      matrix.every(
        (row) =>
          typeof row.parser.opens === "boolean" &&
          typeof row.grading.acceptsCanonical === "boolean" &&
          typeof row.guided.createsCheckpoint === "boolean" &&
          Array.isArray(row.guided.terms),
      ),
    ).toBe(true)
  })

  it("records heading IDs as intentionally excluded instead of inventing a parser", () => {
    const row = buildSyntaxCapabilityMatrix().find(
      (candidate) => candidate.id === "heading-id",
    )

    expect(row).toMatchObject({
      parser: { opens: false },
      decision: "intentional-exclusion",
    })
    expect(row?.notes).toContain("GFM parser has no heading ID extension")
  })

  it("keeps every parser-supported row teachable and rejects its missing form", () => {
    const matrix = buildSyntaxCapabilityMatrix()
    const supported = matrix.filter((row) => row.id !== "heading-id")

    expect(supported).toHaveLength(12)
    expect(
      supported.every(
        (row) =>
          row.parser.opens &&
          row.grading.acceptsCanonical &&
          row.grading.rejectsMissing &&
          row.guided.createsCheckpoint &&
          row.guided.hasSpecificTerm,
      ),
    ).toBe(true)
  })

  it("renders generated values and the command that refreshes them", () => {
    const markdown = renderSyntaxCapabilityMarkdown(
      buildSyntaxCapabilityMatrix(),
    )

    expect(markdown).toContain("npm run syntax:capabilities:write")
    expect(markdown).toContain("| Level | Syntax | Parser opens | Grading accepts | Guided blank | Learner terms | Decision | Notes |")
    for (const id of SYNTAX_CAPABILITY_IDS) {
      const level = SYNTAX_CAPABILITY_IDS.indexOf(id) < 6 ? 2 : 3
      expect(markdown).toContain(`| ${level} | ${id} |`)
    }
  })
})
