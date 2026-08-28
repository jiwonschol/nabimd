/** One calm practice turn, regardless of the chosen syntax chapter. */
export const RUN_POLICY = {
  turnSize: 5,
} as const

// Bump the curriculum segment whenever entry IDs or their served families
// change. Keeping turnSize in the value makes a schedule-size change
// impossible to ship without changing the persisted contract.
export const RUN_SCHEDULE_REVISION =
  `curriculum@1|turn-size@${RUN_POLICY.turnSize}` as const

/**
 * Single-syntax chapters rotate their families evenly. The values stay
 * explicit so adding a family cannot silently change the scheduler contract.
 */
export const SYNTAX_FAMILY_WEIGHTS = {
  heading: 1,
  bold: 1,
  italic: 1,
  blockquote: 1,
  "ordered-list": 1,
  "unordered-list": 1,
  "inline-code": 1,
  "code-block": 1,
  "thematic-break": 1,
  link: 1,
  image: 1,
} as const

export type SyntaxFamily = keyof typeof SYNTAX_FAMILY_WEIGHTS
export type ChapterFamily = SyntaxFamily | "composite"
