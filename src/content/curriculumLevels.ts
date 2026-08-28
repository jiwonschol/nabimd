import type { CurriculumLevel } from "./types"
import type { ChapterFamily } from "../selection/runPolicy"

export const curriculumLevels = [
  {
    id: "level-1",
    level: 1,
    label: "Chapter 1 — Headings & emphasis",
    families: ["heading", "bold", "italic"],
    exerciseMode: "target",
  },
  {
    id: "level-2",
    level: 2,
    label: "Chapter 2 — Lists",
    families: ["ordered-list", "unordered-list"],
    exerciseMode: "target",
  },
  {
    id: "level-3",
    level: 3,
    label: "Chapter 3 — Links & dividers",
    families: ["link", "image", "thematic-break"],
    exerciseMode: "target",
  },
  {
    id: "level-4",
    level: 4,
    label: "Chapter 4 — Code & quotes",
    families: ["inline-code", "code-block", "blockquote"],
    exerciseMode: "target",
  },
  {
    id: "level-5",
    level: 5,
    label: "Chapter 5 — Mixed practice",
    families: ["composite"],
    exerciseMode: "target",
  },
] as const satisfies readonly {
  id: string
  level: CurriculumLevel
  label: string
  families: readonly ChapterFamily[]
  exerciseMode: "target"
}[]
