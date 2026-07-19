import { problemBank } from "./problemBank"
import type { NormalizedProblem } from "./types"
import { createTurnProblemIds } from "../selection/runComposition"
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
): string[] {
  return createRunProblemIdsForBank(entryId, runNumber, problemBank)
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
): string[] {
  const entry = getEntryChoice(entryId)
  return createTurnProblemIds(entry.level, runNumber, problems)
}
