import { describe, expect, it } from "vitest"
import { getProblem, problemBank } from "../content/problemBank"
import {
  findRenderedMarkdownTokens,
  type RenderedMarkdownToken,
} from "./renderedMarkdown"

type MarkToken = Extract<RenderedMarkdownToken, { kind: "mark" }>
type ReplacementToken = Extract<RenderedMarkdownToken, { kind: "replace" }>

describe("renderedMarkdown", () => {
  it("keeps every Bus card source row while rendering syntax in place", () => {
    const problem = getProblem("l2-code-block-bus-reference")
    const tokens = findRenderedMarkdownTokens(problem.target)
    const lines = tokens.filter((token) => token.kind === "line")
    const replacements = tokens.filter((token) => token.kind === "replace")

    expect(lines.map((line) => line.sourceLine)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
    expect(
      replacements
        .filter((token) => token.replacement === "fence")
        .map((token) => problem.target.slice(token.from, token.to)),
    ).toEqual(["```", "```"])
    expect(
      replacements
        .filter((token) => token.replacement === "list")
        .map((token) => token.glyph),
    ).toEqual(["•", "•"])
  })

  it("never consumes a newline in any published Goal decoration", () => {
    for (const problem of problemBank) {
      const tokens = findRenderedMarkdownTokens(problem.target)

      expect(
        tokens.filter((token) => token.kind === "line"),
        problem.id,
      ).toHaveLength(problem.target.split("\n").length)

      for (const token of tokens) {
        if (token.kind === "line") continue
        expect(
          problem.target.slice(token.from, token.to),
          `${problem.id}:${token.kind}:${token.from}-${token.to}`,
        ).not.toContain("\n")
      }
    }
  })

  it("projects the full published syntax family without problem-specific rules", () => {
    const tokens = problemBank.flatMap((problem) =>
      findRenderedMarkdownTokens(problem.target),
    )
    const marks = new Set(
      tokens
        .filter((token) => token.kind === "mark")
        .map((token) => token.className),
    )
    const replacements = new Set(
      tokens
        .filter((token) => token.kind === "replace")
        .map((token) => token.replacement),
    )

    expect([...marks]).toEqual(
      expect.arrayContaining([
        "cm-rendered-strong",
        "cm-rendered-emphasis",
        "cm-rendered-inline-code",
        "cm-rendered-link",
        "cm-rendered-quote",
        "cm-rendered-code-block",
      ]),
    )
    expect([...replacements]).toEqual(
      expect.arrayContaining(["conceal", "fence", "list", "quote", "rule"]),
    )
  })

  it("projects image Markdown as a local text placeholder", () => {
    const source = "![tracking pixel](https://example.com/pixel.png)"
    const replacement = findRenderedMarkdownTokens(source).find(
      (token) =>
        token.kind === "replace" &&
        token.from === 0 &&
        token.to === source.length,
    )

    expect(replacement).toMatchObject({
      glyph: "[Image: tracking pixel]",
      replacement: "image",
      source,
    })
  })

  it("projects the Devpost GFM Preview family through the shared renderer", () => {
    const source = [
      "~~Archived~~",
      "",
      "- [x] Verified",
      "",
      "| Item | Owner |",
      "| --- | --- |",
      "| Release | Nabi |",
      "",
      "Read [guide][docs].[^1]",
      "",
      "[docs]: https://example.com/guide",
      "[^1]: Kept with the document.",
    ].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const marks = tokens
      .filter((token) => token.kind === "mark")
      .map((token) => token.className)
    const replacements = tokens.filter((token) => token.kind === "replace")

    expect(marks).toEqual(
      expect.arrayContaining([
        "cm-rendered-delete",
        "cm-rendered-link",
        "cm-rendered-table-header",
      ]),
    )
    expect(replacements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ glyph: "☑", replacement: "list" }),
        expect.objectContaining({ replacement: "table-pipe" }),
        expect.objectContaining({ replacement: "table-separator" }),
        expect.objectContaining({ replacement: "footnote" }),
        expect.objectContaining({ replacement: "definition" }),
      ]),
    )
    for (const token of replacements) {
      expect(source.slice(token.from, token.to)).not.toContain("\n")
    }
  })

  it("keeps ordered tasks and escaped table pipes semantically rendered", () => {
    const source = [
      "1. [x] Ordered task",
      "",
      "| Text | Owner |",
      "| --- | --- |",
      "| A \\| B | Nabi |",
    ].join("\n")
    const replacements = findRenderedMarkdownTokens(source).filter(
      (token) => token.kind === "replace",
    )
    const escapedPipeFrom = source.indexOf("\\|")

    expect(replacements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          glyph: "☑",
          replacement: "list",
          source: "1. [x] ",
        }),
        expect.objectContaining({
          from: escapedPipeFrom,
          glyph: "|",
          replacement: "escaped-pipe",
          source: "\\|",
          to: escapedPipeFrom + 2,
        }),
      ]),
    )
    expect(
      replacements.some(
        (token) =>
          token.replacement === "table-pipe" &&
          token.from === escapedPipeFrom + 1,
      ),
    ).toBe(false)
  })

  it("renders setext, closed ATX, and empty ATX headings semantically", () => {
    const source = [
      "Primary",
      "=======",
      "",
      "Secondary",
      "---",
      "",
      "# Release notes #",
      "",
      "###",
      "",
      "# #",
    ].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const headingMarks = tokens.filter(
      (token): token is MarkToken =>
        token.kind === "mark" &&
        token.className.includes("cm-rendered-heading"),
    )
    const concealed = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "conceal",
    )

    expect(
      headingMarks.map((token) => ({
        className: token.className,
        source: source.slice(token.from, token.to),
      })),
    ).toEqual([
      {
        className: "cm-rendered-heading cm-rendered-heading--1",
        source: "Primary",
      },
      {
        className: "cm-rendered-heading cm-rendered-heading--2",
        source: "Secondary",
      },
      {
        className: "cm-rendered-heading cm-rendered-heading--1",
        source: "Release notes",
      },
    ])
    expect(concealed.map((token) => token.source)).toEqual([
      "=======",
      "---",
      "# ",
      " #",
      "###",
      "# #",
    ])
    expect(tokens.filter((token) => token.kind === "line")).toHaveLength(11)
    for (const token of tokens) {
      if (token.kind === "line") continue
      expect(source.slice(token.from, token.to)).not.toContain("\n")
    }
  })

  it("derives ordered-list glyphs from the parsed start and item sequence", () => {
    const source = ["3) Alpha", "9) Beta", "1) Gamma"].join("\n")
    const items = findRenderedMarkdownTokens(source).filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "list",
    )

    expect(items.map((token) => token.source)).toEqual(["3) ", "9) ", "1) "])
    expect(items.map((token) => token.glyph)).toEqual(["3.", "4.", "5."])
  })

  it("finds fenced code after blockquote and list container prefixes", () => {
    const source = [
      "> ```ts",
      "> const answer = 42",
      "> ```",
      "",
      "- ~~~js",
      "  answer()",
      "  ~~~",
    ].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const fences = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "fence",
    )
    const code = tokens.filter(
      (token): token is MarkToken =>
        token.kind === "mark" && token.className === "cm-rendered-code-block",
    )

    expect(fences.map((token) => token.source)).toEqual([
      "```ts",
      "```",
      "~~~js",
      "~~~",
    ])
    expect(code.map((token) => source.slice(token.from, token.to))).toEqual([
      "const answer = 42",
      "answer()",
    ])
    expect(tokens.filter((token) => token.kind === "line")).toHaveLength(7)
    for (const token of tokens) {
      if (token.kind === "line") continue
      expect(source.slice(token.from, token.to)).not.toContain("\n")
    }
  })

  it("styles every row of indented code blocks inside containers", () => {
    const sources = [
      [">     first", ">     second"].join("\n"),
      ["- item", "", "      first", "      second"].join("\n"),
    ]

    for (const source of sources) {
      const codeRows = findRenderedMarkdownTokens(source)
        .filter((token) => token.kind === "line")
        .filter((token) =>
          token.className.split(" ").includes("cm-rendered-code-block-line"),
        )

      expect(
        codeRows.map((token) => source.split("\n")[token.sourceLine - 1]),
        source,
      ).toEqual([
        expect.stringContaining("first"),
        expect.stringContaining("second"),
      ])
    }
  })

  it("keeps the final content line visible for an unclosed fence", () => {
    const source = ["```", "hello"].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const fences = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "fence",
    )
    const code = tokens.filter(
      (token): token is MarkToken =>
        token.kind === "mark" && token.className === "cm-rendered-code-block",
    )

    expect(fences.map((token) => token.source)).toEqual(["```"])
    expect(code.map((token) => source.slice(token.from, token.to))).toEqual([
      "hello",
    ])
  })

  it("uses each blockquote node's own marker inside nesting and lists", () => {
    const nestedSource = "> > nested"
    const nestedQuotes = findRenderedMarkdownTokens(nestedSource).filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "quote",
    )
    const listedSource = "- > listed"
    const listedTokens = findRenderedMarkdownTokens(listedSource)
    const listedQuotes = listedTokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "quote",
    )

    expect(
      nestedQuotes.map((token) => ({
        from: token.from,
        source: token.source,
        to: token.to,
      })),
    ).toEqual([
      { from: 0, source: "> ", to: 2 },
      { from: 2, source: "> ", to: 4 },
    ])
    expect(listedQuotes).toEqual([
      expect.objectContaining({ from: 2, source: "> ", to: 4 }),
    ])
    expect(
      listedTokens.find(
        (token) => token.kind === "replace" && token.replacement === "list",
      ),
    ).toEqual(expect.objectContaining({ from: 0, source: "- ", to: 2 }))
  })

  it("keeps inline and block HTML literal without losing physical rows", () => {
    const source = [
      "before <span>inside</span> after",
      "",
      "<div>",
      "inside",
      "</div>",
    ].join("\n")
    const tokens = findRenderedMarkdownTokens(source)

    expect(tokens.filter((token) => token.kind === "replace")).toEqual([])
    expect(tokens.filter((token) => token.kind === "line")).toHaveLength(5)
  })

  it("conceals multiline link syntax without replacing physical newlines", () => {
    const source = ["[guide](", "/docs", ")"].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const replacements = tokens.filter(
      (token): token is ReplacementToken => token.kind === "replace",
    )

    expect(tokens.filter((token) => token.kind === "line")).toHaveLength(3)
    expect(replacements.map((token) => token.source)).toEqual([
      "[",
      "](",
      "/docs",
      ")",
    ])
    for (const token of replacements) {
      expect(source.slice(token.from, token.to)).not.toContain("\n")
    }
  })

  it("does not mistake fence-looking final code content for a closing fence", () => {
    const source = ["```", "1. ```"].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const fences = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "fence",
    )
    const code = tokens.filter(
      (token): token is MarkToken =>
        token.kind === "mark" && token.className === "cm-rendered-code-block",
    )

    expect(fences.map((token) => token.source)).toEqual(["```"])
    expect(code.map((token) => source.slice(token.from, token.to))).toEqual([
      "1. ```",
    ])
  })

  it("uses visual tab columns when validating a closing fence", () => {
    const source = [" ```", "\t```"].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const fences = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "fence",
    )

    expect(fences.map((token) => token.source)).toEqual(["```"])
  })

  it("rejects an over-indented closing fence inside quote-list containers", () => {
    const source = ["> - ```", ">       ```"].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const fences = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "fence",
    )

    expect(fences.map((token) => token.source)).toEqual(["```"])
  })

  it("conceals valid indented Setext underlines", () => {
    for (const source of ["Title\n =====", "Title\n  =====", "Title\n   ====="]) {
      const concealed = findRenderedMarkdownTokens(source).filter(
        (token): token is ReplacementToken =>
          token.kind === "replace" && token.replacement === "conceal",
      )

      expect(concealed.map((token) => token.source), source).toEqual(["====="])
    }
  })

  it("finds blockquote markers independently on each physical line", () => {
    const source = ["> first", "  > second"].join("\n")
    const quotes = findRenderedMarkdownTokens(source).filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "quote",
    )

    expect(
      quotes.map((token) => ({ from: token.from, source: token.source })),
    ).toEqual([
      { from: 0, source: "> " },
      { from: 10, source: "> " },
    ])
  })

  it("does not project a blockquote marker beyond that mdast node's range", () => {
    const source = ["> - > first", ">   -   > second"].join("\n")
    const quotes = findRenderedMarkdownTokens(source).filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "quote",
    )

    expect(quotes.map((token) => token.from)).toEqual([0, 12, 4, 20])
    expect(new Set(quotes.map((token) => token.from)).size).toBe(quotes.length)
  })

  it("derives unordered-list nesting from the mdast list ancestry", () => {
    const topLevelIndented = findRenderedMarkdownTokens("  - item").find(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "list",
    )
    const topLevelQuoted = findRenderedMarkdownTokens("> - item").find(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "list",
    )
    const nested = findRenderedMarkdownTokens("- outer\n  - inner").filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "list",
    )

    expect(topLevelIndented?.glyph).toBe("•")
    expect(topLevelQuoted?.glyph).toBe("•")
    expect(nested.map((token) => token.glyph)).toEqual(["•", "◦"])
  })

  it("marks full fenced-code content when container columns vary by line", () => {
    const sources = [
      ["   ```", "code", "   ```"].join("\n"),
      ["> ```", ">code", "> ```"].join("\n"),
    ]

    for (const source of sources) {
      const code = findRenderedMarkdownTokens(source).filter(
        (token): token is MarkToken =>
          token.kind === "mark" &&
          token.className === "cm-rendered-code-block",
      )
      expect(
        code.map((token) => source.slice(token.from, token.to)),
        source,
      ).toEqual(["code"])
    }
  })

  it("maps mdast-normalized tab indentation back to raw code text", () => {
    const source = ["> ```", ">\tcode", "> ```"].join("\n")
    const code = findRenderedMarkdownTokens(source).filter(
      (token): token is MarkToken =>
        token.kind === "mark" && token.className === "cm-rendered-code-block",
    )

    expect(code.map((token) => source.slice(token.from, token.to))).toEqual([
      "code",
    ])
  })

  it("marks lazy blockquote continuation rows without consuming newlines", () => {
    const sources = [
      ["> first", "second"].join("\n"),
      ["> > first", "> second"].join("\n"),
      ["- > first", "  second"].join("\n"),
    ]

    for (const source of sources) {
      const tokens = findRenderedMarkdownTokens(source)
      const secondLineFrom = source.indexOf("\n") + 1
      const quoteMarks = tokens.filter(
        (token): token is MarkToken =>
          token.kind === "mark" && token.className === "cm-rendered-quote",
      )

      expect(
        quoteMarks.some(
          (token) => token.from <= secondLineFrom && token.to === source.length,
        ),
        source,
      ).toBe(true)
      expect(tokens.filter((token) => token.kind === "line"), source).toHaveLength(
        2,
      )
      for (const token of tokens) {
        if (token.kind === "line") continue
        expect(source.slice(token.from, token.to), source).not.toContain("\n")
      }
    }
  })

  it("renders one-to-three-space-indented footnote definition prefixes", () => {
    for (const indent of [" ", "  ", "   "]) {
      const source = `${indent}[^note]: First line\n${indent}    continued`
      const tokens = findRenderedMarkdownTokens(source)
      const footnotes = tokens.filter(
        (token): token is ReplacementToken =>
          token.kind === "replace" && token.replacement === "footnote",
      )

      expect(footnotes, source).toEqual([
        expect.objectContaining({
          from: indent.length,
          glyph: "[note] ",
          source: "[^note]: ",
          to: indent.length + "[^note]: ".length,
        }),
      ])
      expect(source.slice(0, footnotes[0]?.from), source).toBe(indent)
      expect(footnotes[0]?.source, source).not.toContain("\n")
    }
  })

  it("replaces only the actual GFM table delimiter row", () => {
    const source = [
      "| Left | Right |",
      "| --- | --- |",
      "| --- | --- |",
    ].join("\n")
    const tokens = findRenderedMarkdownTokens(source)
    const separators = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" && token.replacement === "table-separator",
    )
    const bodyLine = source.split("\n")[2] ?? ""
    const bodyFrom = source.lastIndexOf(bodyLine)
    const bodyPipes = tokens.filter(
      (token): token is ReplacementToken =>
        token.kind === "replace" &&
        token.replacement === "table-pipe" &&
        token.from >= bodyFrom,
    )

    expect(separators.map((token) => token.source)).toEqual(["| --- | --- |"])
    expect(bodyPipes).toHaveLength(3)
    expect(
      tokens.some(
        (token) =>
          token.kind === "replace" &&
          token.from === bodyFrom &&
          token.to === source.length,
      ),
    ).toBe(false)
  })
})
