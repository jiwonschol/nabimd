import type { CurriculumLevel } from "./types"
import { curriculumLevels } from "./curriculumLevels"

export type ExerciseMode = "target"

/** Every level reproduces a fixed rendered Goal from Goal-derived starter prose. */
export function getExerciseMode(level: CurriculumLevel): ExerciseMode {
  const definition = curriculumLevels.find(
    (candidate) => candidate.level === level,
  )
  if (!definition) throw new Error(`Unknown curriculum level: ${level}`)
  return definition.exerciseMode
}
