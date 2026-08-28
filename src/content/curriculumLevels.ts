import type { CurriculumLevel } from "./types"
import type { CurriculumElement } from "./curriculumElements"

export const curriculumLevels = [
  {
    id: "level-1",
    level: 1,
    label: "Level 1 — Everyday Markdown",
    description: "The marks you use most.",
    elements: [
      "heading",
      "bold",
      "italic",
      "unordered-list",
      "ordered-list",
      "link",
      "inline-code",
      "code-block",
      "blockquote",
      "table",
      "task-list",
      "image",
    ],
    unimplementedElements: ["table", "task-list", "image"],
    exerciseMode: "target",
  },
  {
    id: "level-2",
    level: 2,
    label: "Level 2 — Useful patterns",
    description: "Useful combinations and shortcuts.",
    elements: [
      "bold-italic",
      "strikethrough",
      "thematic-break",
      "nested-list",
      "nested-blockquote",
      "code-block-language",
      "hard-line-break",
      "automatic-url",
    ],
    unimplementedElements: [
      "bold-italic",
      "strikethrough",
      "nested-blockquote",
      "hard-line-break",
      "automatic-url",
    ],
    exerciseMode: "target",
  },
  {
    id: "level-3",
    level: 3,
    label: "Level 3 — Good to know",
    description: "Less common syntax worth recognizing.",
    elements: [
      "link-title",
      "angle-bracket-url",
      "angle-bracket-email",
      "escape",
      "list-with-block",
      "footnote",
      "heading-id",
    ],
    unimplementedElements: [
      "link-title",
      "angle-bracket-url",
      "angle-bracket-email",
      "escape",
      "list-with-block",
      "footnote",
      "heading-id",
    ],
    exerciseMode: "target",
  },
] as const satisfies readonly {
  id: string
  level: CurriculumLevel
  label: string
  description: string
  elements: readonly CurriculumElement[]
  unimplementedElements: readonly CurriculumElement[]
  exerciseMode: "target"
}[]
