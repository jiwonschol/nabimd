import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { normalizeProblem } from "../content/normalizeProblem"
import type { GradableProblem, MatchCheck } from "../content/types"
import { evaluateProblem } from "./evaluateProblem"

function problem(matchChecks: readonly MatchCheck[]): GradableProblem {
  return {
    ...normalizeProblem(headingProblems[0]),
    id: "structural-test",
    familyId: "document-structure",
    skillIds: ["document-structure"],
    difficulty: "makeover",
    matchChecks,
    editorialChecks: [],
    retryFamily: "document-structure",
    reviewTags: [],
  }
}

function common(id: string, priority = 10) {
  return { id, priority, feedback: `Fix ${id}.` }
}

describe("structural match predicates", () => {
  it.each([
    "# Plan\n\n## Steps\n\n- Prepare\n- Share",
    "# Completely different\n\n## Words changed\n\n- Alpha\n- Beta",
  ])("grades block counts without comparing prose: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("two-headings"),
          kind: "block-count",
          scope: { kind: "document" },
          block: "heading",
          min: 2,
        },
        {
          ...common("one-list", 20),
          kind: "block-count",
          scope: { kind: "document" },
          block: "list",
          min: 1,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it("targets a section by heading depth and occurrence, never heading prose", () => {
    const sectionList = problem([
      {
        ...common("ordered-second-section"),
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        ordered: true,
        minItems: 2,
      },
    ])

    expect(
      evaluateProblem(
        sectionList,
        "# Title\n\n## Any first name\n\nContext.\n\n## Any second name\n\n1. One\n2. Two",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        sectionList,
        "# Title\n\n## First\n\nContext.\n\n## Second\n\n- One\n- Two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "ordered-second-section" })
  })

  it("does not let a nested list satisfy a direct section list requirement", () => {
    const directOrderedList = problem([
      {
        ...common("direct-ordered-list"),
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        ordered: true,
        minItems: 2,
      },
    ])

    expect(
      evaluateProblem(
        directOrderedList,
        "# Plan\n\n## Steps\n\n- Parent item\n  1. Nested one\n  2. Nested two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "direct-ordered-list" })
    expect(
      evaluateProblem(
        directOrderedList,
        "# Plan\n\n## Steps\n\n1. Direct one\n2. Direct two\n   - Nested detail",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
  })

  it("rejects skipped heading depths but accepts a logical hierarchy", () => {
    const hierarchy = problem([
      {
        ...common("logical-headings"),
        kind: "heading-depth-order",
        allowSkippedDepths: false,
      },
    ])

    expect(evaluateProblem(hierarchy, "# Title\n\n### Skipped")).toMatchObject({
      status: "fail",
      feedbackId: "logical-headings",
    })
    expect(
      evaluateProblem(hierarchy, "# Title\n\n## Section\n\n### Detail"),
    ).toEqual({ status: "matched", reviewItems: [] })
  })

  it("requires a language-tagged code block inside the selected section", () => {
    const verification = problem([
      {
        ...common("verification-code"),
        kind: "code-block",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        min: 1,
        max: 1,
        requireLanguageTag: true,
      },
    ])

    expect(
      evaluateProblem(
        verification,
        "# Spec\n\n## Verification\n\n```sh\nnpm test\n```",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        verification,
        "# Spec\n\n## Verification\n\n```\nnpm test\n```",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "verification-code" })
  })

  it("distinguishes a fenced code lesson from indented code", () => {
    const fenced = problem([
      {
        ...common("fenced-code"),
        kind: "code-block",
        scope: { kind: "document" },
        min: 1,
        requireFenced: true,
      },
    ])

    expect(evaluateProblem(fenced, "```\nnpm test\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(fenced, "    npm test")).toMatchObject({
      status: "fail",
      feedbackId: "fenced-code",
    })
  })

  it("finds inline Markdown recursively without treating plain markers as syntax", () => {
    const inline = problem([
      {
        ...common("emphasis"),
        kind: "inline-presence",
        scope: { kind: "document" },
        inline: "emphasis",
        min: 1,
      },
    ])

    expect(
      evaluateProblem(inline, "# Note\n\n[A *careful* link](https://example.com)"),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(evaluateProblem(inline, "# Note\n\nA plain * marker")).toMatchObject({
      status: "fail",
      feedbackId: "emphasis",
    })
  })

  it("matches an ordered block subsequence and can require an exact shape", () => {
    const sequence = [
      { block: "heading", depth: 1 },
      { block: "heading", depth: 2 },
      { block: "list" },
    ] as const
    const source = "# Title\n\nIntro.\n\n## Steps\n\n1. One\n2. Two"

    expect(
      evaluateProblem(
        problem([
          {
            ...common("sequence"),
            kind: "block-sequence",
            scope: { kind: "document" },
            sequence,
          },
        ]),
        source,
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        problem([
          {
            ...common("exact-sequence"),
            kind: "block-sequence",
            scope: { kind: "document" },
            sequence,
            exact: true,
          },
        ]),
        source,
      ),
    ).toMatchObject({ status: "fail", feedbackId: "exact-sequence" })
  })

  it("applies inclusive document-size boundaries", () => {
    const limits = problem([
      {
        ...common("concise"),
        kind: "document-limits",
        minBlocks: 2,
        maxBlocks: 2,
        minLines: 3,
        maxLines: 3,
      },
    ])

    expect(evaluateProblem(limits, "# Note\n\nShort context.")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(limits, "# Note\n\nToo\nlong")).toMatchObject({
      status: "fail",
      feedbackId: "concise",
    })
  })

  it("uses declaration order to break equal-priority failures", () => {
    const result = evaluateProblem(
      problem([
        {
          ...common("first", 10),
          kind: "block-count",
          scope: { kind: "document" },
          block: "list",
          min: 1,
        },
        {
          ...common("second", 10),
          kind: "block-count",
          scope: { kind: "document" },
          block: "code",
          min: 1,
        },
      ]),
      "# Only a title",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "first",
      message: "Fix first.",
    })
  })
})
