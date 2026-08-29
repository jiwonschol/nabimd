import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { normalizeProblem } from "../content/normalizeProblem"
import type { GradableProblem, MatchCheck } from "../content/types"
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
    "1. Parent\n   - Child one\n   - Child two\n   - Child three",
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
    "-\n  - Child one\n-\n  - Child two\n-\n  - Child three",
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

  it("explains the missing space after repeated bullet markers", () => {
    expect(
      evaluateProblem(bulletListProblem, "-One\n-Two\n-Three"),
    ).toMatchObject({
      status: "fail",
      feedbackId: "use-bullet-list",
      message: "Put one space after each bullet marker, for example `- Item`.",
    })
  })

  it("explains the missing space after repeated numbered markers", () => {
    const baseListCheck = bulletListProblem.matchChecks[0]! as Extract<
      MatchCheck,
      { kind: "list-shape" }
    >
    const orderedListProblem: GradableProblem = {
      ...bulletListProblem,
      id: "ordered-list-predicate-test",
      matchChecks: [
        {
          ...baseListCheck,
          id: "use-numbered-list",
          ordered: true,
          feedback: "Make a numbered list with at least three items.",
        },
      ],
    }

    expect(
      evaluateProblem(orderedListProblem, "1.One\n2.Two\n3.Three"),
    ).toMatchObject({
      status: "fail",
      feedbackId: "use-numbered-list",
      message: "Put one space after each numbered marker, for example `1. Step`.",
    })
  })

  it("does not describe thematic breaks as missing bullet spaces", () => {
    expect(
      evaluateProblem(bulletListProblem, "---\n---\n---"),
    ).toMatchObject({
      status: "fail",
      feedbackId: "use-bullet-list",
      message: "Make a bullet list with at least three items.",
    })
  })
})

describe("task list checkboxes", () => {
  const taskListProblem = (requireTaskItems: boolean): GradableProblem => ({
    ...bulletListProblem,
    id: "task-list-predicate-test",
    familyId: "task-lists",
    skillIds: ["task-list"],
    matchChecks: [
      {
        id: "use-task-list",
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: false,
        minItems: 2,
        requireTaskItems,
        priority: 10,
        feedback: "Add a task list with at least two checkbox items.",
      },
    ] as unknown as GradableProblem["matchChecks"],
    editorialChecks: [] as unknown as GradableProblem["editorialChecks"],
  })

  const status = (source: string, requireTaskItems = true) =>
    evaluateProblem(taskListProblem(requireTaskItems), source).status

  it("accepts either tick and rejects a list with no boxes", () => {
    // Nothing in the engine could see a checkbox before this: `BLOCK_KINDS`
    // has `list` and no task kind, `InlineKind` has no bracket mark, and no
    // predicate read `checked`. A task-list exercise therefore graded
    // `- Buy milk` as correct — the answer passed without the syntax the
    // exercise is named after.
    expect(status("- [ ] Buy milk\n- [ ] Post the letter")).toBe("matched")
    expect(status("- [x] Buy milk\n- [ ] Post the letter")).toBe("matched")
    // Presence, not state: `[x]` and `[X]` are the same box to the parser and
    // which one the learner ticks is not what the exercise teaches.
    expect(status("- [X] Buy milk\n- [x] Post the letter")).toBe("matched")

    expect(status("- Buy milk\n- Post the letter")).toBe("fail")
    // Every item, not some: half a task list is not one.
    expect(status("- [ ] Buy milk\n- Post the letter")).toBe("fail")
  })

  it("says what is missing rather than repeating the generic feedback", () => {
    const result = evaluateProblem(
      taskListProblem(true),
      "- Buy milk\n- Post the letter",
    )
    expect(result.status).toBe("fail")
    expect(JSON.stringify(result)).toContain(
      "Put a checkbox after each bullet marker",
    )
    expect(
      JSON.stringify(
        evaluateProblem(taskListProblem(true), "- [ ] Buy milk\n- Post the letter"),
      ),
    ).toContain("Put a checkbox after each bullet marker")
  })

  it("names missing boxes on an ordered task list", () => {
    const taskCheck = taskListProblem(true)
      .matchChecks[0] as Extract<MatchCheck, { kind: "list-shape" }>
    const orderedProblem: GradableProblem = {
      ...taskListProblem(true),
      matchChecks: [
        {
          ...taskCheck,
          ordered: true,
        },
      ],
    }
    const result = evaluateProblem(orderedProblem, "1. Buy milk\n2. Post the letter")

    expect(result.status).toBe("fail")
    expect(JSON.stringify(result)).toContain(
      "Put a checkbox after each numbered marker",
    )
  })

  it("uses the near-miss list's actual marker when either order is accepted", () => {
    const taskCheck = taskListProblem(true)
      .matchChecks[0] as Extract<MatchCheck, { kind: "list-shape" }>
    const eitherProblem: GradableProblem = {
      ...taskListProblem(true),
      matchChecks: [{ ...taskCheck, ordered: "either" }],
    }

    expect(
      JSON.stringify(evaluateProblem(eitherProblem, "1. Buy milk\n2. Post it")),
    ).toContain("Put a checkbox after each numbered marker")
  })

  it("uses the predicate's recursive selection for checkbox diagnosis", () => {
    const taskCheck = taskListProblem(true)
      .matchChecks[0] as Extract<MatchCheck, { kind: "list-shape" }>
    const rootOnly: GradableProblem = {
      ...taskListProblem(true),
      matchChecks: [{ ...taskCheck, recursive: false }],
    }
    const descendantsOnly: GradableProblem = {
      ...taskListProblem(true),
      matchChecks: [
        { ...taskCheck, recursive: true, descendantsOnly: true },
      ],
    }

    expect(evaluateProblem(rootOnly, "> - One\n> - Two")).toMatchObject({
      status: "fail",
      message: taskCheck.feedback,
    })
    expect(evaluateProblem(descendantsOnly, "- One\n- Two")).toMatchObject({
      status: "fail",
      message: taskCheck.feedback,
    })
    expect(
      JSON.stringify(evaluateProblem(descendantsOnly, "- Parent\n  - One\n  - Two")),
    ).toContain("Put a checkbox after each bullet marker")
  })

  it("targets the task list that satisfies the configured item range", () => {
    const taskCheck = taskListProblem(true)
      .matchChecks[0] as Extract<MatchCheck, { kind: "list-shape" }>
    const rangedTarget: GradableProblem = {
      ...taskListProblem(true),
      target: "- [ ] Solo\n\nBetween\n\n- [ ] One\n- [ ] Two",
      matchChecks: [taskCheck],
    }

    const result = evaluateProblem(rangedTarget, "No task list yet")

    expect(result).toMatchObject({
      status: "fail",
      failures: [
        { diagnostic: { expectedSource: "- [ ] One" } },
      ],
    })
  })

  it("does not prescribe checkboxes for otherwise invalid list items", () => {
    const taskCheck = taskListProblem(true)
      .matchChecks[0] as Extract<MatchCheck, { kind: "list-shape" }>
    const visibleTaskProblem: GradableProblem = {
      ...taskListProblem(true),
      matchChecks: [
        { ...taskCheck, requireVisibleItems: true },
      ],
    }

    expect(
      evaluateProblem(
        visibleTaskProblem,
        "- <!-- hidden -->\n- <!-- still hidden -->",
      ),
    ).toMatchObject({
      status: "fail",
      message: taskCheck.feedback,
    })
  })

  it("does not diagnose bullets outside the checked section", () => {
    const taskCheck = taskListProblem(true)
      .matchChecks[0] as Extract<MatchCheck, { kind: "list-shape" }>
    const scopedProblem: GradableProblem = {
      ...taskListProblem(true),
      matchChecks: [
        {
          ...taskCheck,
          scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        },
      ],
    }
    const result = evaluateProblem(
      scopedProblem,
      "## Notes\n\n- One\n- Two\n\n## Tasks\n\nNothing here yet.",
    )

    expect(result).toMatchObject({
      status: "fail",
      message: "Add a task list with at least two checkbox items.",
    })
  })

  it("leaves lists without the option exactly as they were", () => {
    // The option is opt-in. Without it a plain bullet list still passes, so
    // adding the axis cannot have narrowed any problem already in the bank.
    expect(status("- Buy milk\n- Post the letter", false)).toBe("matched")
    expect(status("- [ ] Buy milk\n- Post the letter", false)).toBe("matched")
  })
})
