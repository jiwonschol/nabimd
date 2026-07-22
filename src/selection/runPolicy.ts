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

/**
 * Every syntax family is served with equal priority. The bank used to privilege
 * ordered and unordered lists (weight 1.25) over everything else, which made a
 * Level 1 practice feel like an endless run of "add a number / add a bullet"
 * drills while headings, emphasis, quotes, code, dividers, and links were held
 * back (weight 0.65). Equal weights let every family surface just as often, so a
 * run stays varied instead of list-heavy.
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

/**
 * Isolated single-syntax drills the curriculum no longer serves. A numbered-list
 * drill only asks the learner to type "1. 2. 3." in front of three lines: it is
 * mechanical and no richer than the bullet-list drill sitting beside it. Ordered
 * lists still appear inside the multi-syntax rebuild documents at Level 2 and
 * above, so excluding the isolated drill removes the busywork without dropping
 * the syntax from the course.
 */
export const EXCLUDED_SYNTAX_FAMILIES: ReadonlySet<SyntaxFamily> = new Set([
  "ordered-list",
])

export const SYNTAX_FAMILY_ORDER = Object.keys(
  SYNTAX_FAMILY_WEIGHTS,
) as SyntaxFamily[]

export function getChallengeLevel(
  level: CurriculumLevel,
): CurriculumLevel | null {
  const challengeLevel = level + RUN_POLICY.challengeLevelOffset
  return challengeLevel <= 5 ? (challengeLevel as CurriculumLevel) : null
}
