import type { Root } from "mdast"
import { fromMarkdown, type Options } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"

/**
 * The single Markdown dialect this product reads.
 *
 * Four surfaces used to declare their own dialect: the rendered document, the
 * source-styling projection, grading, and the card's blank derivation. The
 * first two enabled GFM and the last two did not, so the app could *show* a
 * table it could neither grade nor teach. A learner-visible asymmetry like
 * that is invisible in every per-surface test, because each surface is
 * self-consistent — only comparing them catches it. Everything that parses
 * Markdown goes through this module.
 *
 * `singleTilde: false` means `~text~` is literal text and only `~~text~~` is
 * strikethrough, matching GitHub. It is exported so the react-markdown
 * pipeline (which takes a remark plugin rather than these extensions) can
 * spend the same value instead of restating it.
 */
export const GFM_OPTIONS = { singleTilde: false } as const

const MARKDOWN_PARSE_OPTIONS: Options = {
  extensions: [gfm(GFM_OPTIONS)],
  mdastExtensions: [gfmFromMarkdown()],
}

export function parseMarkdownSource(source: string): Root {
  return fromMarkdown(source, MARKDOWN_PARSE_OPTIONS)
}
