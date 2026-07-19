import type { CurriculumLevel, NormalizedProblem } from "../content/types"
import {
  getChallengeLevel,
  RUN_POLICY,
  SYNTAX_FAMILY_ORDER,
  SYNTAX_FAMILY_WEIGHTS,
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

function getSelectionKey(problem: SchedulableProblem): string {
  return getSyntaxFamily(problem) ?? problem.retryFamily
}

type TurnContext = {
  previousKey: string | null
  selected: SchedulableProblem[]
  selectedIds: Set<string>
}

function appendProblem(
  context: TurnContext,
  problem: SchedulableProblem,
): void {
  context.selected.push(problem)
  context.selectedIds.add(problem.id)
  context.previousKey = getSelectionKey(problem)
}

function rotatedProblems(
  problems: readonly SchedulableProblem[],
  offset: number,
): SchedulableProblem[] {
  if (problems.length === 0) return []
  return Array.from(
    { length: problems.length },
    (_, index) => problems[(offset + index) % problems.length]!,
  )
}

function selectRotatedUniqueProblems(
  problems: readonly SchedulableProblem[],
  count: number,
  offset: number,
  context: TurnContext,
): void {
  const candidates = rotatedProblems(problems, offset)
  const targetCount = Math.min(count, candidates.length)
  const initialLength = context.selected.length

  while (
    context.selected.length < initialLength + targetCount &&
    context.selectedIds.size < candidates.length
  ) {
    const candidate =
      candidates.find(
        (problem) =>
          !context.selectedIds.has(problem.id) &&
          getSelectionKey(problem) !== context.previousKey,
      ) ??
      candidates.find(
        (problem) =>
          !context.selectedIds.has(problem.id) &&
          getSyntaxFamily(problem) === null,
      )
    if (!candidate) break
    appendProblem(context, candidate)
  }
}

function selectDistinctChallengeProblems(
  problems: readonly SchedulableProblem[],
  count: number,
  offset: number,
  context: TurnContext,
): void {
  const candidates = rotatedProblems(problems, offset)
  const targetCount = Math.min(count, candidates.length)
  const initialLength = context.selected.length
  const selectedKeys = new Set<string>()

  while (selectedKeys.size < targetCount) {
    const candidate = candidates.find((problem) => {
      const key = getSelectionKey(problem)
      return (
        !context.selectedIds.has(problem.id) &&
        key !== context.previousKey &&
        !selectedKeys.has(key)
      )
    })
    if (!candidate) break
    appendProblem(context, candidate)
    selectedKeys.add(getSelectionKey(candidate))
  }

  while (context.selected.length < initialLength + targetCount) {
    const candidate =
      candidates.find(
        (problem) =>
          !context.selectedIds.has(problem.id) &&
          getSelectionKey(problem) !== context.previousKey,
      ) ??
      candidates.find(
        (problem) =>
          !context.selectedIds.has(problem.id) &&
          getSyntaxFamily(problem) === null,
      )
    if (!candidate) break
    appendProblem(context, candidate)
  }
}

type WeightedSelectionState = {
  familySelectionCounts: Map<SyntaxFamily, number>
  scores: Map<SyntaxFamily, number>
}

function createWeightedSelectionState(): WeightedSelectionState {
  return {
    familySelectionCounts: new Map(),
    scores: new Map(),
  }
}

function selectWeightedAtLevelProblems(
  problems: readonly SchedulableProblem[],
  count: number,
  context: TurnContext,
  state: WeightedSelectionState,
): void {
  const groups = new Map<SyntaxFamily, SchedulableProblem[]>()
  for (const problem of problems) {
    const family = getSyntaxFamily(problem)
    if (!family) continue
    const group = groups.get(family) ?? []
    group.push(problem)
    groups.set(family, group)
  }

  const availableFamilies = SYNTAX_FAMILY_ORDER.filter((family) =>
    groups.has(family),
  )
  if (availableFamilies.length === 0) return

  for (const family of availableFamilies) {
    if (!state.scores.has(family)) state.scores.set(family, 0)
    if (!state.familySelectionCounts.has(family)) {
      state.familySelectionCounts.set(family, 0)
    }
  }
  const totalWeight = availableFamilies.reduce(
    (sum, family) => sum + SYNTAX_FAMILY_WEIGHTS[family],
    0,
  )
  const usedThisTurn = new Map<SyntaxFamily, number>()

  for (let slot = 0; slot < count; slot += 1) {
    for (const family of availableFamilies) {
      state.scores.set(
        family,
        state.scores.get(family)! + SYNTAX_FAMILY_WEIGHTS[family],
      )
    }

    const eligible = availableFamilies.filter((family) => {
      if (family === context.previousKey) return false
      if ((usedThisTurn.get(family) ?? 0) >= 2) return false
      return groups
        .get(family)!
        .some((problem) => !context.selectedIds.has(problem.id))
    })
    const unused = eligible.filter(
      (family) => (usedThisTurn.get(family) ?? 0) === 0,
    )
    const candidates = unused.length > 0 ? unused : eligible
    if (candidates.length === 0) break

    const selectedFamily = candidates.reduce((best, family) => {
      const scoreDifference =
        state.scores.get(family)! - state.scores.get(best)!
      return scoreDifference > 0 ? family : best
    }, candidates[0]!)
    const group = groups.get(selectedFamily)!
    const selectionCount = state.familySelectionCounts.get(selectedFamily)!
    const problem = Array.from(
      { length: group.length },
      (_, index) => group[(selectionCount + index) % group.length]!,
    ).find((candidate) => !context.selectedIds.has(candidate.id))
    if (!problem) break

    appendProblem(context, problem)
    state.familySelectionCounts.set(selectedFamily, selectionCount + 1)
    state.scores.set(
      selectedFamily,
      state.scores.get(selectedFamily)! - totalWeight,
    )
    usedThisTurn.set(
      selectedFamily,
      (usedThisTurn.get(selectedFamily) ?? 0) + 1,
    )
  }
}

function selectLevelTwoProblems(
  problems: readonly SchedulableProblem[],
  runNumber: number,
  context: TurnContext,
  state: WeightedSelectionState,
): void {
  const compositeProblems = problems.filter(
    (problem) => getSyntaxFamily(problem) === null,
  )
  selectRotatedUniqueProblems(
    compositeProblems,
    RUN_POLICY.atLevelCount,
    runNumber * RUN_POLICY.atLevelCount,
    context,
  )
  if (context.selected.length === RUN_POLICY.atLevelCount) return

  // The accepted bank still contains legacy single-syntax Level 2 lessons.
  // Prefer real rebuilds as they arrive, then fill only the remaining slots.
  const singleSyntaxProblems = problems.filter(
    (problem) => getSyntaxFamily(problem) !== null,
  )
  selectWeightedAtLevelProblems(
    singleSyntaxProblems,
    RUN_POLICY.atLevelCount - context.selected.length,
    context,
    state,
  )
}

export function createTurnProblemIds(
  level: CurriculumLevel,
  runNumber: number,
  problems: readonly SchedulableProblem[],
): string[] {
  const standardProblems = problems.filter(
    (problem) => problem.flavor === "standard",
  )
  const atLevelProblems = standardProblems.filter(
    (problem) => problem.level === level,
  )
  if (atLevelProblems.length === 0) {
    throw new Error(`No standard problems available for level-${level}`)
  }

  const challengeLevel = getChallengeLevel(level)
  const challengeProblems =
    challengeLevel === null
      ? []
      : standardProblems.filter((problem) => problem.level === challengeLevel)
  const weightedState = createWeightedSelectionState()
  let previousKey: string | null = null
  let selectedIds: string[] = []

  // Replaying earlier turns makes an arbitrary run number deterministic while
  // carrying the final challenge family into the next turn's first slot.
  for (let turn = 0; turn <= runNumber; turn += 1) {
    const context: TurnContext = {
      previousKey,
      selected: [],
      selectedIds: new Set(),
    }

    if (level === 1) {
      selectWeightedAtLevelProblems(
        atLevelProblems,
        RUN_POLICY.atLevelCount,
        context,
        weightedState,
      )
    } else if (level === 2) {
      selectLevelTwoProblems(atLevelProblems, turn, context, weightedState)
    } else {
      selectRotatedUniqueProblems(
        atLevelProblems,
        level === 5 ? RUN_POLICY.turnSize : RUN_POLICY.atLevelCount,
        turn * RUN_POLICY.atLevelCount,
        context,
      )
    }

    if (challengeProblems.length > 0) {
      selectDistinctChallengeProblems(
        challengeProblems,
        RUN_POLICY.challengeCount,
        turn * RUN_POLICY.challengeCount,
        context,
      )
    }

    previousKey = context.previousKey
    selectedIds = context.selected.map(({ id }) => id)
  }

  return selectedIds
}
