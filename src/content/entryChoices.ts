import { problemBank } from "./problemBank"
import type { CurriculumLevel, NormalizedProblem } from "./types"
import { createTurnProblemIds } from "../selection/runComposition"
import { curriculumLevels } from "./curriculumLevels"
import {
  type CurriculumElement,
  getCurriculumElements,
  getImplementedElementsForEntry,
} from "./curriculumElements"
import {
  RUN_POLICY,
  SYNTAX_FAMILY_WEIGHTS,
} from "../selection/runPolicy"

export const entryChoices = curriculumLevels.map((entry) => ({
  ...entry,
  available:
    getImplementedElementsForEntry(entry, problemBank).length >=
    RUN_POLICY.turnSize,
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

export type EntryId = (typeof curriculumLevels)[number]["id"]

type SchedulableEntryProblem = Pick<
  NormalizedProblem,
  | "id"
  | "level"
  | "flavor"
  | "retryFamily"
  | "skillIds"
  | "syntaxTokens"
>

export function getProblemEntryId(
  problem: SchedulableEntryProblem,
): EntryId | null {
  const elements = getCurriculumElements(problem)
  if (elements.length === 0) return null

  let owner: (typeof curriculumLevels)[number] | null = null
  for (const element of elements) {
    const candidate = curriculumLevels.find((entry) =>
      (entry.elements as readonly CurriculumElement[]).includes(element),
    )
    if (!candidate) return null
    if (owner === null || candidate.level > owner.level) owner = candidate
  }
  return owner?.id ?? null
}

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
  const implementedElements = getImplementedElementsForEntry(entry, problems)
  if (implementedElements.length < RUN_POLICY.turnSize) {
    throw new Error(`Level ${entry.level} is not available yet`)
  }
  const served = getServedProblemsForBank(problems, entry.level)
  return createTurnProblemIds(entry.level, runNumber, served, seed)
}
