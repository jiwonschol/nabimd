import { problemBank } from "./problemBank"
import type { CurriculumLevel, NormalizedProblem } from "./types"
import { createTurnProblemIds } from "../selection/runComposition"
import { curriculumLevels } from "./curriculumLevels"
import {
  type EntryId,
  getCurriculumElements,
  getImplementedElementsForEntry,
  getProblemEntryId,
} from "./curriculumElements"
import {
  RUN_POLICY,
  SYNTAX_FAMILY_WEIGHTS,
} from "../selection/runPolicy"

export { getProblemEntryId }
export type { EntryId }

type SchedulableEntryProblem = Pick<
  NormalizedProblem,
  | "id"
  | "level"
  | "flavor"
  | "retryFamily"
  | "skillIds"
  | "syntaxTokens"
>

function isEntryAvailableForBank(
  entry: (typeof curriculumLevels)[number],
  problems: readonly SchedulableEntryProblem[],
): boolean {
  const hasEnoughDedicatedElements =
    getImplementedElementsForEntry(entry, problems).length >=
    RUN_POLICY.turnSize
  const hasOwnedMixedExercise = problems.some(
    (problem) =>
      problem.flavor === "standard" &&
      getCurriculumElements(problem).length > 1 &&
      getProblemEntryId(problem) === entry.id,
  )
  return hasEnoughDedicatedElements && hasOwnedMixedExercise
}

export const entryChoices = curriculumLevels.map((entry) => ({
  ...entry,
  available: isEntryAvailableForBank(entry, problemBank),
}))

// Any input that can invalidate a persisted deterministic run belongs here.
// Deriving the value prevents a curriculum edit from relying on a manual bump.
export const runScheduleRevision = [
  `turn-size@${RUN_POLICY.turnSize}`,
  `family-weights@${Object.entries(SYNTAX_FAMILY_WEIGHTS)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([family, weight]) => `${family}:${weight}`)
    .join(",")}`,
  ...entryChoices.map(
    (entry) =>
      `${entry.id}@${entry.level}:${entry.elements.join(",")}`,
  ),
].join("|")

const servedProblemsByBank = new WeakMap<
  readonly SchedulableEntryProblem[],
  Map<CurriculumLevel, readonly SchedulableEntryProblem[]>
>()

function getServedProblemsForBank(
  problems: readonly SchedulableEntryProblem[],
  level: CurriculumLevel,
): readonly SchedulableEntryProblem[] {
  let servedByLevel = servedProblemsByBank.get(problems)
  if (!servedByLevel) {
    servedByLevel = new Map()
    servedProblemsByBank.set(problems, servedByLevel)
  }

  let served = servedByLevel.get(level)
  if (!served) {
    const entry = curriculumLevels.find((candidate) => candidate.level === level)
    if (!entry) throw new Error(`Unknown chapter: ${level}`)
    served = problems.filter(
      (problem) =>
        problem.flavor === "standard" && getProblemEntryId(problem) === entry.id,
    )
    servedByLevel.set(level, served)
  }
  return served
}

export function isEntryId(value: unknown): value is EntryId {
  return entryChoices.some((entry) => entry.id === value)
}

export function getEntryChoice(entryId: EntryId) {
  const entry = entryChoices.find((candidate) => candidate.id === entryId)
  if (!entry) throw new Error(`Unknown entry: ${entryId}`)
  return entry
}

export function createRunProblemIds(
  entryId: EntryId,
  runNumber: number,
  seed = 0,
): string[] {
  return createRunProblemIdsForBank(entryId, runNumber, problemBank, seed)
}

export function createRunProblemIdsForBank(
  entryId: EntryId,
  runNumber: number,
  problems: readonly SchedulableEntryProblem[],
  seed = 0,
): string[] {
  const entry = getEntryChoice(entryId)
  if (!isEntryAvailableForBank(entry, problems)) {
    throw new Error(`Level ${entry.level} is not available yet`)
  }
  const served = getServedProblemsForBank(problems, entry.level)
  return createTurnProblemIds(entry.level, runNumber, served, seed)
}
