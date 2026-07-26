import { problemBank } from "./problemBank"
import type { CurriculumLevel, NormalizedProblem } from "./types"
import { createTurnProblemIds, getSyntaxFamily } from "../selection/runComposition"
import { EXCLUDED_SYNTAX_FAMILIES } from "../selection/runPolicy"
import { curriculumLevels } from "./curriculumLevels"

export const entryChoices = curriculumLevels

export type EntryId = (typeof entryChoices)[number]["id"]

type SchedulableEntryProblem = Pick<
  NormalizedProblem,
  | "id"
  | "level"
  | "flavor"
  | "retryFamily"
  | "skillIds"
  | "syntaxTokens"
>

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
    // Drop the isolated single-syntax drills the curriculum retired (numbered
    // lists). Composite rebuild documents report no single family, so ordered
    // lists embedded in them are kept.
    served = problems.filter((problem) => {
      const family = getSyntaxFamily(problem)
      if (family !== null && EXCLUDED_SYNTAX_FAMILIES.has(family)) return false
      // Level 1 promises six short syntax decisions, not six documents whose
      // repeated markers expand into an unknown number of cards. Composite
      // practice begins at Level 2.
      return (
        level !== 1 || (family !== null && family !== "unordered-list")
      )
    })
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
  const served = getServedProblemsForBank(problems, entry.level)
  return createTurnProblemIds(entry.level, runNumber, served, seed)
}
