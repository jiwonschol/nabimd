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
  const orderedKeys = candidates.reduce<string[]>((keys, problem) => {
    const key = getSelectionKey(problem)
    if (!keys.includes(key)) keys.push(key)
    return keys
  }, [])
  const turnNumber = Math.floor(offset / Math.max(1, count))
  const variantsPerKeyPerTurn = Math.ceil(
    count / Math.max(1, orderedKeys.length),
  )
  const variantOffset = turnNumber * variantsPerKeyPerTurn

  while (selectedKeys.size < targetCount) {
    const key = orderedKeys.find(
      (candidateKey) =>
        candidateKey !== context.previousKey &&
        !selectedKeys.has(candidateKey),
    )
    if (!key) break
    const variants = problems.filter(
      (problem) => getSelectionKey(problem) === key,
    )
    const candidate = rotatedProblems(variants, variantOffset).find(
      (problem) => !context.selectedIds.has(problem.id),
    )
    if (!candidate) break
    appendProblem(context, candidate)
    selectedKeys.add(key)
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

type TurnSelectionHistory = {
  nextTurn: number
  previousKey: string | null
  selectedIdsByTurn: string[][]
  weightedState: WeightedSelectionState
}

const selectionHistoryByBank = new WeakMap<
  readonly SchedulableProblem[],
  Map<CurriculumLevel, TurnSelectionHistory>
>()

function getTurnSelectionHistory(
  problems: readonly SchedulableProblem[],
  level: CurriculumLevel,
): TurnSelectionHistory {
  let byLevel = selectionHistoryByBank.get(problems)
  if (!byLevel) {
    byLevel = new Map()
    selectionHistoryByBank.set(problems, byLevel)
  }

  let history = byLevel.get(level)
  if (!history) {
    history = {
      nextTurn: 0,
      previousKey: null,
      selectedIdsByTurn: [],
      weightedState: createWeightedSelectionState(),
    }
    byLevel.set(level, history)
  }
  return history
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
  if (!Number.isSafeInteger(runNumber) || runNumber < 0) {
    throw new Error(`Invalid run number: ${runNumber}`)
  }

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
  const history = getTurnSelectionHistory(problems, level)

  // Compute only turns not already cached for this immutable problem bank.
  // This preserves deterministic cross-turn weighting and family boundaries
  // without replaying the complete history on every request.
  while (history.nextTurn <= runNumber) {
    const turn = history.nextTurn
    const context: TurnContext = {
      previousKey: history.previousKey,
      selected: [],
      selectedIds: new Set(),
    }

    if (level === 1) {
      selectWeightedAtLevelProblems(
        atLevelProblems,
        RUN_POLICY.atLevelCount,
        context,
        history.weightedState,
      )
    } else if (level === 2) {
      selectLevelTwoProblems(
        atLevelProblems,
        turn,
        context,
        history.weightedState,
      )
    } else {
      selectRotatedUniqueProblems(
        atLevelProblems,
        level === 5 ? RUN_POLICY.turnSize : RUN_POLICY.atLevelCount,
        turn *
          (level === 5 ? RUN_POLICY.turnSize : RUN_POLICY.atLevelCount),
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

    history.previousKey = context.previousKey
    history.selectedIdsByTurn.push(context.selected.map(({ id }) => id))
    history.nextTurn += 1
  }

  return [...history.selectedIdsByTurn[runNumber]!]
}
