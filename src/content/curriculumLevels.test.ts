import { describe, expect, it } from "vitest"
import { problemBank } from "./problemBank"
import { CURRICULUM_LEVELS, curriculumLevels } from "./curriculumLevels"
import { AUTHORING_LEVELS } from "./types"

describe("three-level curriculum", () => {
  it("declares the frequency-based levels and their known content gaps", () => {
    expect(curriculumLevels).toEqual([
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
    ])
  })

  it("keeps learner levels separate from immutable published problem levels", () => {
    expect(AUTHORING_LEVELS).toEqual([1, 2, 3, 4, 5])
    expect(CURRICULUM_LEVELS).toEqual([1, 2, 3])
    expect(
      new Set(curriculumLevels.map((entry) => entry.curriculumLevel)),
    ).toEqual(
      new Set([1, 2, 3]),
    )
    expect(new Set(problemBank.map((problem) => problem.level))).toEqual(
      new Set([1, 2, 3, 4, 5]),
    )
  })
})
