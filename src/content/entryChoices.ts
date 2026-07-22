import { problemBank } from "./problemBank"
import type { NormalizedProblem } from "./types"
import { createTurnProblemIds, getSyntaxFamily } from "../selection/runComposition"
import { EXCLUDED_SYNTAX_FAMILIES } from "../selection/runPolicy"
import { curriculumLevels } from "./curriculumLevels"

export const entryChoices = curriculumLevels

export type EntryId = (typeof entryChoices)[number]["id"]

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
  problems: readonly Pick<
    NormalizedProblem,
    | "id"
    | "level"
    | "flavor"
    | "retryFamily"
    | "skillIds"
    | "syntaxTokens"
  >[],
  seed = 0,
): string[] {
  const entry = getEntryChoice(entryId)
  // Drop the isolated single-syntax drills the curriculum retired (numbered
  // lists). Composite rebuild documents report no single family, so ordered
  // lists embedded in them are kept.
  const served = problems.filter((problem) => {
    const family = getSyntaxFamily(problem)
    return family === null || !EXCLUDED_SYNTAX_FAMILIES.has(family)
  })
  return createTurnProblemIds(entry.level, runNumber, served, seed)
}
