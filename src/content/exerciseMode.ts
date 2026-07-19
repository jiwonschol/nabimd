import type { CurriculumLevel } from "./types"
import { curriculumLevels } from "./curriculumLevels"

export type ExerciseMode = "target" | "brief"

/** Levels 1–2 reproduce a reference; Levels 3–5 compose from a brief. */
export function getExerciseMode(level: CurriculumLevel): ExerciseMode {
  const definition = curriculumLevels.find(
    (candidate) => candidate.level === level,
  )
  if (!definition) throw new Error(`Unknown curriculum level: ${level}`)
  return definition.exerciseMode
}
