/** One calm practice turn, regardless of the chosen syntax chapter. */
export const RUN_POLICY = {
  turnSize: 5,
} as const

/**
 * Single-syntax chapters rotate their families evenly. The values stay
 * explicit so adding a family cannot silently change the scheduler contract.
 */
export const SYNTAX_FAMILY_WEIGHTS = {
  "angle-bracket-email": 1,
  "angle-bracket-url": 1,
  "automatic-url": 1,
  heading: 1,
  bold: 1,
  "bold-italic": 1,
  italic: 1,
  blockquote: 1,
  "ordered-list": 1,
  "unordered-list": 1,
  "inline-code": 1,
  "code-block": 1,
  "code-block-language": 1,
  escape: 1,
  footnote: 1,
  "hard-line-break": 1,
  "thematic-break": 1,
  link: 1,
  "link-title": 1,
  "list-with-block": 1,
  "nested-blockquote": 1,
  strikethrough: 1,
  image: 1,
  table: 1,
  "task-list": 1,
} as const

export type SyntaxFamily = keyof typeof SYNTAX_FAMILY_WEIGHTS
export type ChapterFamily = SyntaxFamily | "composite"
