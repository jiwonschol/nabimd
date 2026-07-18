import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { normalizeProblem } from "../content/normalizeProblem"
import type { GradableProblem } from "../content/types"
import { evaluateProblem } from "./evaluateProblem"

const bulletListProblem: GradableProblem = {
  ...normalizeProblem(headingProblems[0]),
  id: "list-predicate-test",
  familyId: "lists",
  skillIds: ["unordered-list"],
  matchChecks: [
    {
      id: "use-bullet-list",
      kind: "list-shape",
      scope: { kind: "document" },
      ordered: false,
      minItems: 3,
      recursive: true,
      requireNonemptyItems: true,
      priority: 10,
      feedback: "Make a bullet list with at least three items.",
    },
  ],
  editorialChecks: [
    {
      id: "keep-one-list",
      kind: "max-block-count",
      scope: { kind: "document" },
      block: "list",
      recursive: true,
      max: 1,
      review: "Keep this short note together as one bullet list.",
    },
  ] as unknown as GradableProblem["editorialChecks"],
  retryFamily: "list-predicate-test",
  reviewTags: ["one-focused-list"],
}

describe("unordered-list predicates", () => {
  it.each([
    "- One\n- Two\n- Three",
    "* New words\n* More words\n* Last words",
    "+ misspeled\n+ WORDS\n+ anything",
    "> - One\n> - Two\n> - Three",
    "- ![One](one.png)\n- ![Two](two.png)\n- ![Three](three.png)",
    "   - One\n   - Two\n   - Three",
    "- One\n\n- Two\n\n- Three",
    "- One\n- Two\n- Three\n- Four",
  ])("accepts standard bullet syntax without grading prose: %s", (source) => {
    expect(evaluateProblem(bulletListProblem, source)).toEqual({
      status: "matched",
      reviewItems: [],
    })
  })

  it("keeps nested list complexity Matched with optional Review", () => {
    expect(
      evaluateProblem(
        bulletListProblem,
        "- Parent one\n  - Nested detail\n- Parent two\n- Parent three",
      ),
    ).toEqual({
      status: "matched",
      reviewItems: [
        {
          id: "keep-one-list",
          message: "Keep this short note together as one bullet list.",
        },
      ],
    })
  })

  it.each([
    "1. One\n2. Two\n3. Three",
    "- One",
    "- One\n- Two",
    "-No space\n-No space either\n-No third space",
    "`- One`\n\n`- Two`\n\n`- Three`",
    "One\nTwo\nThree",
    "-\n-\n-",
    "- ![](one.png)\n- ![](two.png)\n- ![](three.png)",
    "---\n---\n---",
    "```md\n- One\n- Two\n- Three\n```",
    "<ul><li>One</li><li>Two</li><li>Three</li></ul>",
    "• One\n• Two\n• Three",
    "\\- One\n\\- Two\n\\- Three",
    "    - One\n    - Two\n    - Three",
    "- One\n* Two\n+ Three",
  ])("rejects a source without a three-item bullet list: %s", (source) => {
    expect(evaluateProblem(bulletListProblem, source)).toMatchObject({
      status: "fail",
      feedbackId: "use-bullet-list",
    })
  })

  it("keeps multiple valid bullet lists Matched with optional Review", () => {
    expect(
      evaluateProblem(
        bulletListProblem,
        "- One\n- Two\n- Three\n\nA short bridge.\n\n- Four\n- Five\n- Six",
      ),
    ).toEqual({
      status: "matched",
      reviewItems: [
        {
          id: "keep-one-list",
          message: "Keep this short note together as one bullet list.",
        },
      ],
    })
  })
})
