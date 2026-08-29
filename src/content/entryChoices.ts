import { problemBank } from "./problemBank"
import type { CurriculumLevel, NormalizedProblem } from "./types"
import { createTurnProblemIds } from "../selection/runComposition"
import { curriculumLevels } from "./curriculumLevels"
import {
  type EntryId,
  getCurriculumElements,
  getProblemEntryId,
  isEntryAvailableForBank,
} from "./curriculumElements"
import {
  RUN_POLICY,
  SYNTAX_FAMILY_WEIGHTS,
} from "../selection/runPolicy"
import {
  isEligibleMixedExercise,
  MIXED_EXERCISE_POLICY,
} from "./mixedExercisePolicy"

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
  | "target"
  | "starterText"
>

export const entryChoices = curriculumLevels.map((entry) => ({
  ...entry,
  available: isEntryAvailableForBank(entry, problemBank, RUN_POLICY.turnSize),
}))

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
      (problem) => {
        if (
          problem.flavor !== "standard" ||
          getProblemEntryId(problem) !== entry.id
        ) {
          return false
        }
        const elements = getCurriculumElements(problem)
        return elements.length === 1 || isEligibleMixedExercise(problem)
      },
    )
    servedByLevel.set(level, served)
  }
  return served
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619)
  }
  return (hash >>> 0).toString(36)
}

/** See the note beside its use in `runScheduleRevision`. */
export const COMPOSITION_REVISION = "composition@2-mixed-avoids-adjacent-runs"

/**
 * Any input that can invalidate a persisted deterministic run belongs here.
 * Deriving the value prevents a curriculum edit from relying on a manual bump.
 *
 * The served set is part of it because eligibility is computed, not declared:
 * `isEligibleMixedExercise` counts checkpoints, so a change to how the card
 * cuts blanks silently changes which mixed exercises a level may serve. That
 * happened — grouping adjacent same-syntax checkpoints took twelve Level 2
 * composites from over the checkpoint ceiling to under it. Naming only the
 * policy constants would have left a persisted run being validated against a
 * different schedule under an unchanged revision, which drops the learner's
 * progress instead of migrating it.
 */
export const runScheduleRevision = [
  `turn-size@${RUN_POLICY.turnSize}`,
  `family-weights@${Object.entries(SYNTAX_FAMILY_WEIGHTS)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([family, weight]) => `${family}:${weight}`)
    .join(",")}`,
  `mixed-exercise@max-${MIXED_EXERCISE_POLICY.maxCheckpoints}:separated-repeat-${MIXED_EXERCISE_POLICY.separatedSyntaxRepeats}`,
  ...entryChoices.map(
    (entry) =>
      `${entry.id}@${entry.level}:${entry.elements.join(",")}`,
  ),
  // Everything else here is derived, and nothing derived can see the shape of
  // the code that reads it. A persisted run is validated by recomputing the
  // schedule, so changing how a run is composed changes that contract even
  // when every constant and the served set stay byte-identical. Without this
  // token the recomputed run simply would not match, and the learner's drafts
  // would be dropped by the validator instead of carried by the migration.
  // Bump it whenever `createTurnProblemIds` can return a different run for an
  // unchanged (chapter, runNumber, seed).
  COMPOSITION_REVISION,
  ...curriculumLevels.map((entry) => {
    const ids = getServedProblemsForBank(problemBank, entry.level).map(
      (problem) => problem.id,
    )
    return `served@${entry.id}:${ids.length}:${fingerprint(ids.join(","))}`
  }),
].join("|")

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
  const available =
    problems === problemBank
      ? entry.available
      : isEntryAvailableForBank(entry, problems, RUN_POLICY.turnSize)
  if (!available) {
    throw new Error(`Level ${entry.level} is not available yet`)
  }
  const served = getServedProblemsForBank(problems, entry.level)
  return createTurnProblemIds(entry.level, runNumber, served, seed)
}
