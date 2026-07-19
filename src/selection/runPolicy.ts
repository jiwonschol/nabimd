import type { CurriculumLevel } from "../content/types"

/**
 * The complete turn contract for Issue #36. Product tuning belongs here so
 * counts, spillover, hint rhythm, and family frequency never drift apart.
 */
export const RUN_POLICY = {
  turnSize: 6,
  atLevelCount: 4,
  challengeCount: 2,
  hintShownCount: 4,
  challengeLevelOffset: 1,
} as const

export const SYNTAX_FAMILY_WEIGHTS = {
  heading: 1,
  bold: 1,
  italic: 1,
  blockquote: 1,
  "ordered-list": 1.25,
  "unordered-list": 1.25,
  "inline-code": 0.65,
  "code-block": 0.65,
  "thematic-break": 1,
  link: 0.65,
  image: 0.65,
} as const

export type SyntaxFamily = keyof typeof SYNTAX_FAMILY_WEIGHTS

export const SYNTAX_FAMILY_ORDER = Object.keys(
  SYNTAX_FAMILY_WEIGHTS,
) as SyntaxFamily[]

export function getChallengeLevel(
  level: CurriculumLevel,
): CurriculumLevel | null {
  const challengeLevel = level + RUN_POLICY.challengeLevelOffset
  return challengeLevel <= 5 ? (challengeLevel as CurriculumLevel) : null
}
