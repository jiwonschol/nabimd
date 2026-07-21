import type { BlockKind, InlineKind, MatchCheck } from "../content/types"
import type { MatchFailureItem } from "../engine/types"

export type CorrectionCue = {
  id: string
  label: string
  message: string
  example: string | null
}

function assertNever(value: never): never {
  throw new Error(`Unsupported MatchCheck kind: ${String(value)}`)
}

function headingCue(
  failure: MatchFailureItem,
  level: 1 | 2 | 3 | 4 | 5 | 6,
): CorrectionCue {
  return cue(failure, `Level ${level} heading`, `${"#".repeat(level)} Section`)
}

function blockLabel(
  block: BlockKind,
  depth: 1 | 2 | 3 | 4 | 5 | 6 | undefined,
): string {
  switch (block) {
    case "heading":
      return depth === undefined ? "Headings" : `Level ${depth} heading`
    case "paragraph":
      return "Paragraphs"
    case "list":
      return "Lists"
    case "code":
      return "Code blocks"
    case "blockquote":
      return "Blockquotes"
    case "thematic-break":
      return "Thematic break"
    default:
      return assertNever(block)
  }
}

function inlinePresentation(inline: InlineKind): {
  label: string
  example: string
} {
  switch (inline) {
    case "emphasis":
      return { label: "Italic text", example: "*Important*" }
    case "strong":
      return { label: "Bold text", example: "**Important**" }
    case "inline-code":
      return { label: "Inline code", example: "`command`" }
    case "link":
      return { label: "Link", example: "[Label](https://example.com)" }
    case "image":
      return {
        label: "Image",
        example: "![Description](https://example.com/image.png)",
      }
    default:
      return assertNever(inline)
  }
}

function listPresentation(
  ordered: boolean | "either",
  descendantsOnly: boolean | undefined,
): { label: string; example: string } {
  const label =
    ordered === true ? "Ordered list" : ordered === false ? "Bullet list" : "List"
  const example = ordered === true ? "1. Item" : "- Item"

  if (!descendantsOnly) return { label, example }

  return {
    label: `Nested ${label.toLowerCase()}`,
    example:
      ordered === true ? "1. Parent\n   1. Child" : "- Parent\n  - Child",
  }
}

function cue(
  failure: MatchFailureItem,
  label: string,
  example: string | null,
): CorrectionCue {
  return {
    id: failure.feedbackId,
    label,
    message: failure.message,
    example,
  }
}

export function correctionCue(failure: MatchFailureItem): CorrectionCue {
  const { check } = failure

  switch (check.kind) {
    case "heading-spacing":
    case "hash-heading-style":
    case "has-heading":
      return headingCue(failure, check.level)
    case "block-count":
      return cue(
        failure,
        blockLabel(check.block, check.depth),
        check.block === "thematic-break" && (check.min ?? 0) > 0
          ? "---"
          : null,
      )
    case "inline-presence": {
      const presentation = inlinePresentation(check.inline)
      return cue(failure, presentation.label, presentation.example)
    }
    case "heading-depth-order":
      return cue(failure, "Heading levels", null)
    case "list-shape": {
      const presentation = listPresentation(check.ordered, check.descendantsOnly)
      return cue(failure, presentation.label, presentation.example)
    }
    case "blockquote-shape":
      return cue(failure, "Blockquote", "> Note")
    case "inline-code-shape":
      return cue(failure, "Inline code", "`command`")
    case "link-shape":
      return cue(failure, "Link", "[Label](https://example.com)")
    case "code-block":
      return cue(
        failure,
        "Code block",
        `\`\`\`${check.requireLanguageTag ? "text" : ""}\ncode\n\`\`\``,
      )
    case "block-sequence":
      return cue(failure, "Document order", null)
    case "document-limits":
      return cue(failure, "Document limits", null)
    default:
      return assertNever(check)
  }
}

export function correctionCues(
  failures: readonly MatchFailureItem[],
): readonly CorrectionCue[] {
  const seen = new Set<string>()

  return failures.map(correctionCue).filter((item) => {
    const key = `${item.label}\u0000${item.message}\u0000${item.example ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
