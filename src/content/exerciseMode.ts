import { curriculumLevels } from "./curriculumLevels"
import type { EntryId } from "./entryChoices"

export type ExerciseMode = "target"

/** Every level reproduces a fixed rendered Goal from Goal-derived starter prose. */
export function getExerciseMode(entryId: EntryId): ExerciseMode {
  const definition = curriculumLevels.find(
    (candidate) => candidate.id === entryId,
  )
  if (!definition) throw new Error(`Unknown curriculum entry: ${entryId}`)
  return definition.exerciseMode
}
