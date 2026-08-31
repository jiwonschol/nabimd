import { describe, expect, it } from "vitest"
import { createEvaluationContext } from "./evaluationContext"
import { countSyntaxPresence } from "./syntaxPresence"

describe("syntax presence", () => {
  it("counts escapes only where Markdown interprets them", () => {
    expect(countSyntaxPresence(createEvaluationContext("\\*text\\*"), "escape")).toBe(2)
    expect(countSyntaxPresence(createEvaluationContext("plain\\."), "escape")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("`\\*text\\*`"), "escape")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("```text\n\\# literal\n```"), "escape")).toBe(0)
    expect(
      countSyntaxPresence(createEvaluationContext("[x](foo\\(bar\\))"), "escape"),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("[x][ref]\n\n[ref]: foo\\(bar\\)"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(createEvaluationContext("<http://x/\\*>"), "escape"),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("![x](foo\\(bar\\))"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(createEvaluationContext("[`\\*`](url)"), "escape"),
    ).toBe(0)
    expect(
      countSyntaxPresence(createEvaluationContext("https://x/\\(a"), "escape"),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("[unused]: /foo\\(bar\\)"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("![a\\*][ref]\n\n[ref]: /image"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("[visible](https://example.com/\\*)"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("![a\\*](https://example.com/\\*)"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("A[^a\\*]\n\n[^a\\*]: note"),
        "escape",
      ),
    ).toBe(0)
  })

  it("ignores literal block-code backslashes inside referenced footnotes", () => {
    const source = "Use[^a]\n\n[^a]:\n\n        \\*literal\\*"

    expect(countSyntaxPresence(createEvaluationContext(source), "escape")).toBe(0)
  })

  it("ignores syntax hidden in unreferenced footnote definitions", () => {
    expect(
      countSyntaxPresence(createEvaluationContext("[^a]: ***hidden***"), "bold-italic"),
    ).toBe(0)
    expect(
      countSyntaxPresence(createEvaluationContext("[^a]: [^a]"), "footnote"),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("[^a]: > outer\n    > > inner"),
        "nested-blockquote",
      ),
    ).toBe(0)
  })

  it("ignores escapes hidden in effective reference definitions", () => {
    expect(
      countSyntaxPresence(
        createEvaluationContext("[visible][a]\n\n[a]: https://example.com/\\*"),
        "escape",
      ),
    ).toBe(0)
  })

  it("ignores syntax in duplicate footnote definitions after the first", () => {
    const source = [
      "Use[^a]",
      "",
      "[^a]: first",
      "[^a]: ***ignored***",
    ].join("\n")

    expect(countSyntaxPresence(createEvaluationContext(source), "bold-italic")).toBe(0)
  })

  it("counts each matched footnote identifier once", () => {
    expect(countSyntaxPresence(createEvaluationContext("Claim[^a]. Again[^a].\n\n[^a]: Source"), "footnote")).toBe(1)
    expect(countSyntaxPresence(createEvaluationContext("[^a]: Unreferenced"), "footnote")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("Missing[^a]"), "footnote")).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext(
          "Claim[^a]\n\n[^a]: Outer[^b]\n\n[^b]: Inner",
        ),
        "footnote",
      ),
    ).toBe(2)
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
    expect(
      countSyntaxPresence(
        createEvaluationContext('[x][a]\n\n[a]: /first\n[a]: /ignored "title"'),
        "link-title",
      ),
    ).toBe(0)
  })

  it("counts title delimiters even when the title text is whitespace", () => {
    expect(
      countSyntaxPresence(createEvaluationContext('[x](url " ")'), "link-title"),
    ).toBe(1)
    expect(
      countSyntaxPresence(
        createEvaluationContext('[x][a]\n\n[a]: /url " \t"'),
        "link-title",
      ),
    ).toBe(1)
  })

  it("does not count escapes hidden in reference identifiers", () => {
    expect(
      countSyntaxPresence(
        createEvaluationContext("[x][a\\*]\n\n[a\\*]: /url"),
        "escape",
      ),
    ).toBe(0)
    expect(
      countSyntaxPresence(
        createEvaluationContext("[a\\*][]\n\n[a\\*]: /url"),
        "escape",
      ),
    ).toBe(1)
  })

  it("counts each inner bold-italic segment", () => {
    expect(
      countSyntaxPresence(
        createEvaluationContext("_**one** and **two**_"),
        "bold-italic",
      ),
    ).toBe(2)
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

  it("ignores invisible definitions inside a list item", () => {
    expect(
      countSyntaxPresence(
        createEvaluationContext("- item\n\n  [a]: /url"),
        "list-with-block",
      ),
    ).toBe(0)
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
