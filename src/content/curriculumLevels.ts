import type { CurriculumLevel } from "./types"

export const curriculumLevels = [
  {
    id: "level-1",
    level: 1,
    label: "Level 1 — Learn the syntax",
    taskType: "learn-syntax",
    exerciseMode: "target",
  },
  {
    id: "level-2",
    level: 2,
    label: "Level 2 — Rebuild real documents",
    taskType: "rebuild-document",
    exerciseMode: "target",
  },
  {
    id: "level-3",
    level: 3,
    label: "Level 3 — Write for people",
    taskType: "write-for-people",
    exerciseMode: "target",
  },
  {
    id: "level-4",
    level: 4,
    label: "Level 4 — Write a development spec",
    taskType: "development-spec",
    exerciseMode: "target",
  },
  {
    id: "level-5",
    level: 5,
    label: "Level 5 — Write an agent work order",
    taskType: "agent-work-order",
    exerciseMode: "target",
  },
] as const satisfies readonly {
  id: string
  level: CurriculumLevel
  label: string
  taskType: string
  exerciseMode: "target"
}[]
