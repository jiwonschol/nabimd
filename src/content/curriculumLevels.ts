import type { CurriculumElement } from "./curriculumElements"

export const CURRICULUM_LEVELS = [1, 2, 3] as const
export type CurriculumLevel = (typeof CURRICULUM_LEVELS)[number]

export const curriculumLevels = [
  {
    id: "level-1",
    curriculumLevel: 1,
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
    unimplementedElements: ["task-list"],
    exerciseMode: "target",
  },
  {
    id: "level-2",
    curriculumLevel: 2,
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
      "code-block-language",
      "hard-line-break",
      "automatic-url",
    ],
    exerciseMode: "target",
  },
  {
    id: "level-3",
    curriculumLevel: 3,
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
  curriculumLevel: CurriculumLevel
  label: string
  description: string
  elements: readonly CurriculumElement[]
  unimplementedElements: readonly CurriculumElement[]
  exerciseMode: "target"
}[]
