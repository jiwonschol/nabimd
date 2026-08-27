import type { CurriculumLevel, NormalizedProblem } from "../content/types"
import {
  RUN_POLICY,
  type ChapterFamily,
  type SyntaxFamily,
} from "./runPolicy"

type SchedulableProblem = Pick<
  NormalizedProblem,
  | "flavor"
  | "id"
  | "level"
  | "retryFamily"
  | "skillIds"
  | "syntaxTokens"
>

const skillFamilyById: Readonly<Record<string, SyntaxFamily>> = {
  blockquote: "blockquote",
  "bold-emphasis": "bold",
  "code-block": "code-block",
  "heading-h1": "heading",
  image: "image",
  "inline-code": "inline-code",
  "inline-image": "image",
  "inline-link": "link",
  italic: "italic",
  "italic-emphasis": "italic",
  "ordered-list": "ordered-list",
  "thematic-break": "thematic-break",
  "unordered-list": "unordered-list",
}

export function getSyntaxFamily(
  problem: Pick<NormalizedProblem, "skillIds" | "syntaxTokens">,
): SyntaxFamily | null {
  if (problem.skillIds.length !== 1) return null

  const family = skillFamilyById[problem.skillIds[0]!]
  if (family) return family

  const tokens = new Set(problem.syntaxTokens)
  if (tokens.has("![")) return "image"
  if (tokens.has("[")) return "link"
  if (tokens.has("1.")) return "ordered-list"
  if (tokens.has("-")) return "unordered-list"
  if (tokens.has("---")) return "thematic-break"
  if (tokens.has(">")) return "blockquote"
  if (tokens.has("**")) return "bold"
  if (tokens.has("*")) return "italic"
  if (tokens.has("`")) return "inline-code"
  if (tokens.has("#")) return "heading"
  return null
}

export function getChapterFamily(
  problem: Pick<NormalizedProblem, "skillIds" | "syntaxTokens">,
): ChapterFamily {
  return getSyntaxFamily(problem) ?? "composite"
}

function mixSeed(seed: number, salt: number): number {
  let value = (seed ^ salt) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  return (value ^ (value >>> 16)) >>> 0
}

function hashString(value: string): number {
  let hash = 2_166_136_261
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619)
  }
  return hash >>> 0
}

function rotate<T>(values: readonly T[], offset: number): T[] {
  if (values.length === 0) return []
  return Array.from(
    { length: values.length },
    (_, index) => values[(offset + index) % values.length]!,
  )
}

function selectionKey(problem: SchedulableProblem): string {
  return getSyntaxFamily(problem) ?? problem.retryFamily
}

/**
 * Interleave syntax/retry families once, then take consecutive six-card
 * windows. A chapter with at least 30 cards yields five non-repeating turns
 * before it wraps, while a fixed seed keeps reloads deterministic.
 */
function chapterOrder(
  problems: readonly SchedulableProblem[],
  seed: number,
): SchedulableProblem[] {
  const groups = new Map<string, SchedulableProblem[]>()
  for (const problem of problems) {
    const key = selectionKey(problem)
    const group = groups.get(key) ?? []
    group.push(problem)
    groups.set(key, group)
  }

  const keys = [...groups.keys()].sort((left, right) => {
    const difference =
      mixSeed(seed, hashString(left)) - mixSeed(seed, hashString(right))
    return difference === 0 ? left.localeCompare(right) : difference
  })
  const orderedGroups = keys.map((key) => {
    const group = groups.get(key)!
    return rotate(group, mixSeed(seed, hashString(key)) % group.length)
  })
  const ordered: SchedulableProblem[] = []

  for (let index = 0; ordered.length < problems.length; index += 1) {
    for (const group of orderedGroups) {
      const problem = group[index]
      if (problem) ordered.push(problem)
    }
  }
  return ordered
}

export function createTurnProblemIds(
  chapter: CurriculumLevel,
  runNumber: number,
  problems: readonly SchedulableProblem[],
  seed = 0,
): string[] {
  if (!Number.isSafeInteger(runNumber) || runNumber < 0) {
    throw new Error(`Invalid run number: ${runNumber}`)
  }
  if (!Number.isSafeInteger(seed) || seed < 0) {
    throw new Error(`Invalid run seed: ${seed}`)
  }

  const standardProblems = problems.filter(
    (problem) => problem.flavor === "standard",
  )
  if (standardProblems.length === 0) {
    throw new Error(`No standard problems available for chapter-${chapter}`)
  }

  const ordered = chapterOrder(standardProblems, seed)
  const count = Math.min(RUN_POLICY.turnSize, ordered.length)
  const offset = (runNumber * RUN_POLICY.turnSize) % ordered.length
  return Array.from(
    { length: count },
    (_, index) => ordered[(offset + index) % ordered.length]!.id,
  )
}
