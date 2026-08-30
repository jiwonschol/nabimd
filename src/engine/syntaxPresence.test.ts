import { describe, expect, it } from "vitest"
import { createEvaluationContext } from "./evaluationContext"
import { countSyntaxPresence } from "./syntaxPresence"

describe("syntax presence", () => {
  it("counts escapes only where Markdown interprets them", () => {
    expect(countSyntaxPresence(createEvaluationContext("\\*text\\*"), "escape")).toBe(2)
    expect(countSyntaxPresence(createEvaluationContext("`\\*text\\*`"), "escape")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("```text\n\\# literal\n```"), "escape")).toBe(0)
    expect(
      countSyntaxPresence(createEvaluationContext("[x](foo\\(bar\\))"), "escape"),
    ).toBe(2)
    expect(
      countSyntaxPresence(
        createEvaluationContext("[x][ref]\n\n[ref]: foo\\(bar\\)"),
        "escape",
      ),
    ).toBe(2)
    expect(
      countSyntaxPresence(createEvaluationContext("<http://x/\\*>"), "escape"),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("![x](foo\\(bar\\))"),
        "escape",
      ),
    ).toBe(2)
  })

  it("counts each matched footnote identifier once", () => {
    expect(countSyntaxPresence(createEvaluationContext("Claim[^a]. Again[^a].\n\n[^a]: Source"), "footnote")).toBe(1)
    expect(countSyntaxPresence(createEvaluationContext("[^a]: Unreferenced"), "footnote")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("Missing[^a]"), "footnote")).toBe(0)
  })

  it("counts each blockquote nested below another blockquote", () => {
    const source = "> Outer\n>\n> > One\n>\n> > Two"

    expect(countSyntaxPresence(createEvaluationContext(source), "nested-blockquote")).toBe(2)
  })

  it("accepts uppercase bare URL schemes", () => {
    expect(countSyntaxPresence(createEvaluationContext("HTTPS://example.com"), "automatic-url")).toBe(1)
    expect(countSyntaxPresence(createEvaluationContext("WWW.example.com"), "automatic-url")).toBe(1)
  })

  it("counts titles on referenced definitions only when a link uses them", () => {
    expect(
      countSyntaxPresence(
        createEvaluationContext('[Guide][ref]\n\n[ref]: https://example.com "Guide title"'),
        "link-title",
      ),
    ).toBe(1)
    expect(
      countSyntaxPresence(
        createEvaluationContext('[ref]: https://example.com "Unused title"'),
        "link-title",
      ),
    ).toBe(0)
  })

  it("classifies mailto URI autolinks by their source form", () => {
    const uri = createEvaluationContext("<mailto:user@example.com>")
    const email = createEvaluationContext("<user@example.com>")

    expect(countSyntaxPresence(uri, "angle-bracket-url")).toBe(1)
    expect(countSyntaxPresence(uri, "angle-bracket-email")).toBe(0)
    expect(countSyntaxPresence(email, "angle-bracket-url")).toBe(0)
    expect(countSyntaxPresence(email, "angle-bracket-email")).toBe(1)
  })

  it("counts a continuation paragraph as a block inside a list item", () => {
    const source = "- First paragraph\n\n  Second paragraph"

    expect(countSyntaxPresence(createEvaluationContext(source), "list-with-block")).toBe(1)
  })

  it("counts a block-only list item", () => {
    expect(
      countSyntaxPresence(createEvaluationContext("- > Nested note"), "list-with-block"),
    ).toBe(1)
    expect(
      countSyntaxPresence(createEvaluationContext("- Plain item"), "list-with-block"),
    ).toBe(0)
  })
})
