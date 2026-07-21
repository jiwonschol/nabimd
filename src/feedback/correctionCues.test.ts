import { describe, expect, it } from "vitest"
import type { MatchCheck } from "../content/types"
import type { MatchFailureItem } from "../engine/types"
import { correctionCue, correctionCues } from "./correctionCues"

function failure(check: MatchCheck, message = `Fix ${check.id}.`): MatchFailureItem {
  return { feedbackId: check.id, message, check }
}

function checkBase(id: string) {
  return { id, priority: 10, feedback: "Legacy authored feedback." }
}

describe("correctionCue", () => {
  it.each([
    [
      failure({ ...checkBase("heading-spacing"), kind: "heading-spacing", level: 1 }),
      "Level 1 heading",
      "# Section",
    ],
    [
      failure({ ...checkBase("hash-heading-style"), kind: "hash-heading-style", level: 2 }),
      "Level 2 heading",
      "## Section",
    ],
    [
      failure({ ...checkBase("has-heading"), kind: "has-heading", level: 3 }),
      "Level 3 heading",
      "### Section",
    ],
    [
      failure({ ...checkBase("heading-count"), kind: "block-count", scope: { kind: "document" }, block: "heading", depth: 4, min: 1 }),
      "Level 4 heading",
      null,
    ],
    [
      failure({ ...checkBase("paragraph-count"), kind: "block-count", scope: { kind: "document" }, block: "paragraph", min: 1 }),
      "Paragraphs",
      null,
    ],
    [
      failure({ ...checkBase("list-count"), kind: "block-count", scope: { kind: "document" }, block: "list", min: 1 }),
      "Lists",
      null,
    ],
    [
      failure({ ...checkBase("code-count"), kind: "block-count", scope: { kind: "document" }, block: "code", min: 1 }),
      "Code blocks",
      null,
    ],
    [
      failure({ ...checkBase("quote-count"), kind: "block-count", scope: { kind: "document" }, block: "blockquote", min: 1 }),
      "Blockquotes",
      null,
    ],
    [
      failure({ ...checkBase("divider-count"), kind: "block-count", scope: { kind: "document" }, block: "thematic-break", min: 1 }),
      "Thematic break",
      "---",
    ],
    [
      failure({ ...checkBase("divider-max"), kind: "block-count", scope: { kind: "document" }, block: "thematic-break", max: 1 }),
      "Thematic break",
      null,
    ],
    [
      failure({ ...checkBase("divider-zero-min"), kind: "block-count", scope: { kind: "document" }, block: "thematic-break", min: 0 }),
      "Thematic break",
      null,
    ],
    [
      failure({ ...checkBase("emphasis"), kind: "inline-presence", scope: { kind: "document" }, inline: "emphasis", min: 1 }),
      "Italic text",
      "*Important*",
    ],
    [
      failure({ ...checkBase("strong"), kind: "inline-presence", scope: { kind: "document" }, inline: "strong", min: 1 }),
      "Bold text",
      "**Important**",
    ],
    [
      failure({ ...checkBase("inline-code"), kind: "inline-presence", scope: { kind: "document" }, inline: "inline-code", min: 1 }),
      "Inline code",
      "`command`",
    ],
    [
      failure({ ...checkBase("link"), kind: "inline-presence", scope: { kind: "document" }, inline: "link", min: 1 }),
      "Link",
      "[Label](https://example.com)",
    ],
    [
      failure({ ...checkBase("image"), kind: "inline-presence", scope: { kind: "document" }, inline: "image", min: 1 }),
      "Image",
      "![Description](https://example.com/image.png)",
    ],
    [
      failure({ ...checkBase("depth-order"), kind: "heading-depth-order", allowSkippedDepths: false }),
      "Heading levels",
      null,
    ],
    [
      failure({ ...checkBase("ordered-list"), kind: "list-shape", scope: { kind: "document" }, ordered: true, minItems: 1 }),
      "Ordered list",
      "1. Item",
    ],
    [
      failure({ ...checkBase("bullet-list"), kind: "list-shape", scope: { kind: "document" }, ordered: false, minItems: 1 }),
      "Bullet list",
      "- Item",
    ],
    [
      failure({ ...checkBase("either-list"), kind: "list-shape", scope: { kind: "document" }, ordered: "either", minItems: 1 }),
      "List",
      "- Item",
    ],
    [
      failure({ ...checkBase("nested-list"), kind: "list-shape", scope: { kind: "document" }, ordered: false, minItems: 1, descendantsOnly: true }),
      "Nested bullet list",
      "- Parent\n  - Child",
    ],
    [
      failure({ ...checkBase("blockquote"), kind: "blockquote-shape", scope: { kind: "document" } }),
      "Blockquote",
      "> Note",
    ],
    [
      failure({ ...checkBase("inline-code-shape"), kind: "inline-code-shape", scope: { kind: "document" }, min: 1 }),
      "Inline code",
      "`command`",
    ],
    [
      failure({ ...checkBase("link-shape"), kind: "link-shape", scope: { kind: "document" }, requireNonemptyLabel: true, requireNonemptyDestination: true, allowReferences: false, allowAutolinks: false, min: 1 }),
      "Link",
      "[Label](https://example.com)",
    ],
    [
      failure({ ...checkBase("code-block"), kind: "code-block", scope: { kind: "document" }, min: 1, requireFenced: true }),
      "Code block",
      "```\ncode\n```",
    ],
    [
      failure({ ...checkBase("language-code-block"), kind: "code-block", scope: { kind: "document" }, min: 1, requireFenced: true, requireLanguageTag: true }),
      "Code block",
      "```text\ncode\n```",
    ],
    [
      failure({ ...checkBase("sequence"), kind: "block-sequence", scope: { kind: "document" }, sequence: [{ block: "heading" }], exact: true }),
      "Document order",
      null,
    ],
    [
      failure({ ...checkBase("limits"), kind: "document-limits", maxLines: 3 }),
      "Document limits",
      null,
    ],
  ] as const)("describes %s", (item, label, example) => {
    expect(correctionCue(item)).toMatchObject({
      id: item.feedbackId,
      label,
      message: item.message,
      example,
    })
  })

  it("uses the failure message instead of legacy check text", () => {
    const item = failure(
      {
        ...checkBase("legacy-heading"),
        kind: "has-heading",
        level: 2,
        text: "Do not reveal this text",
      },
      "Write a level 2 heading.",
    )

    expect(correctionCue(item).message).toBe("Write a level 2 heading.")
    expect(correctionCue(item).example).toBe("## Section")
  })
})

describe("correctionCues", () => {
  it("deduplicates only exact label, message, and example triples in input order", () => {
    const repeated = failure({
      ...checkBase("first-strong"),
      kind: "inline-presence",
      scope: { kind: "document" },
      inline: "strong",
      min: 1,
    }, "Make the status bold.")
    const samePresentation = {
      ...repeated,
      feedbackId: "second-strong",
      check: { ...repeated.check, id: "second-strong" },
    }
    const distinctMessage = { ...samePresentation, message: "Make the title bold." }

    expect(correctionCues([repeated, samePresentation, distinctMessage])).toEqual([
      correctionCue(repeated),
      correctionCue(distinctMessage),
    ])
  })
})
