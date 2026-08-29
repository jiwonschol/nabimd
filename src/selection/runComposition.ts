import type { CurriculumLevel, NormalizedProblem } from "../content/types"
import {
  getCurriculumElement,
  getCurriculumElements,
} from "../content/curriculumElements"
import {
  RUN_POLICY,
  SYNTAX_FAMILY_WEIGHTS,
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
  table: "table",
  "task-list": "task-list",
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

function seededProblemOrder(
  problems: readonly SchedulableProblem[],
  seed: number,
): SchedulableProblem[] {
  return [...problems].sort((left, right) => {
    const difference =
      mixSeed(seed, hashString(left.id)) - mixSeed(seed, hashString(right.id))
    return difference === 0 ? left.id.localeCompare(right.id) : difference
  })
}

function selectionKey(problem: SchedulableProblem): string {
  return getCurriculumElement(problem) ?? problem.retryFamily
}

/**
 * Distribute syntax/retry families across the whole chapter by their policy
 * weights, then take consecutive fixed-size windows. Stable syntax-family
 * ordering decides which equal-weight family receives an extra card, so a
 * learner's seed changes variants and presentation order without changing
 * syntax coverage. Composite retry families retain seed-based ordering so the
 * mixed chapter can reach its wider set of exercise shapes. Smaller pools
 * rotate their variants when exhausted instead of quietly reducing that
 * family's teaching weight. The current chapter pools keep every family deep
 * enough for five non-repeating turns before a variant wraps.
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
    const leftIsSyntaxFamily = getSyntaxFamily(groups.get(left)![0]!) !== null
    const rightIsSyntaxFamily = getSyntaxFamily(groups.get(right)![0]!) !== null
    if (leftIsSyntaxFamily && rightIsSyntaxFamily) {
      return left.localeCompare(right)
    }
    if (leftIsSyntaxFamily !== rightIsSyntaxFamily) {
      return leftIsSyntaxFamily ? -1 : 1
    }

    const difference =
      mixSeed(seed, hashString(left)) - mixSeed(seed, hashString(right))
    return difference === 0 ? left.localeCompare(right) : difference
  })
  const orderedGroups = keys.map((key) => {
    const group = groups.get(key)!
    const syntaxFamily = getSyntaxFamily(group[0]!)
    return {
      key,
      problems: rotate(group, mixSeed(seed, hashString(key)) % group.length),
      weight: syntaxFamily ? SYNTAX_FAMILY_WEIGHTS[syntaxFamily] : 1,
    }
  })
  const totalWeight = orderedGroups.reduce(
    (total, group) => total + group.weight,
    0,
  )
  const rounds = Math.max(
    ...orderedGroups.map((group) =>
      Math.ceil(group.problems.length / group.weight),
    ),
  )
  const ordered = Array.from({ length: rounds }, (_, round) =>
    orderedGroups.flatMap((group) =>
      Array.from(
        { length: group.weight },
        (_, index) =>
          group.problems[
            (round * group.weight + index) % group.problems.length
          ]!,
      ),
    ),
  ).flat()
  const roundOffset = seed === 0 ? 0 : mixSeed(seed, 7_919) % rounds
  return rotate(ordered, roundOffset * totalWeight)
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

  const mixedProblems = standardProblems.filter(
    (problem) => getCurriculumElements(problem).length > 1,
  )
  const singleProblems = standardProblems.filter(
    (problem) => getCurriculumElements(problem).length === 1,
  )
  const singleElementCount = new Set(singleProblems.map(selectionKey)).size
  if (
    mixedProblems.length > 0 &&
    singleElementCount >= RUN_POLICY.turnSize - 1
  ) {
    const orderedSingles = chapterOrder(singleProblems, seed)
    const singleCount = RUN_POLICY.turnSize - 1
    const singleOffset = (runNumber * singleCount) % orderedSingles.length
    const singles = Array.from(
      { length: singleCount },
      (_, index) =>
        orderedSingles[(singleOffset + index) % orderedSingles.length]!,
    )
    const orderedMixed = seededProblemOrder(mixedProblems, seed)
    const mixed = orderedMixed[runNumber % orderedMixed.length]!
    const selected = [...singles, mixed]
    const presentationOffset =
      seed === 0
        ? 0
        : mixSeed(seed, 104_729 + runNumber) % RUN_POLICY.turnSize
    return rotate(selected, presentationOffset).map((problem) => problem.id)
  }

  const ordered = chapterOrder(standardProblems, seed)
  const count = Math.min(RUN_POLICY.turnSize, ordered.length)
  const offset = (runNumber * RUN_POLICY.turnSize) % ordered.length
  const selected = Array.from(
    { length: count },
    (_, index) => ordered[(offset + index) % ordered.length]!.id,
  )
  const presentationOffset =
    seed === 0 ? 0 : mixSeed(seed, 104_729 + runNumber) % count
  return rotate(selected, presentationOffset)
}
