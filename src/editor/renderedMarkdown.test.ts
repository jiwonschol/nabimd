import { describe, expect, it } from "vitest"
import { getProblem, problemBank } from "../content/problemBank"
import { findRenderedMarkdownTokens } from "./renderedMarkdown"

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
})
