import { describe, expect, it } from "vitest"
import { headingProblems } from "./headingProblems"
import { normalizeProblem } from "./normalizeProblem"
import type {
  CurriculumLevel,
  FixtureRole,
  GradableProblem,
  NormalizedProblem,
  ProblemFixture,
  VocabularyProfile,
} from "./types"
import { validateProblemBank } from "./validateProblemBank"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
]

function problem(
  id: string,
  overrides: Partial<NormalizedProblem> = {},
): NormalizedProblem {
  return {
    ...normalizeProblem(headingProblems[0]),
    id,
    sourceBatchId: "test-batch",
    contentVariant: id,
    ...overrides,
  }
}

function fixtures(problemId: string): ProblemFixture[] {
  const required: ProblemFixture[] = requiredRoles.map((role, index) => ({
    id: `${problemId}-${role}`,
    problemId,
    role,
    ...(role === "missing" ? { exercisesCheckId: "use-h1-heading" } : {}),
    kind:
      role === "canonical"
        ? "canonical"
        : role === "different-prose"
          ? "alternate"
          : role === "case-spelling-variation"
            ? "case-variation"
            : role === "missing"
              ? "missing"
              : role === "malformed"
                ? "malformed"
                : "matched-with-refinement",
    source: index < 3 ? "# Any prose" : "Any prose",
    expectedStatus: index < 3 || role === "matched-with-review"
      ? "matched"
      : "fail",
  }))
  return [
    ...required,
    {
      id: `${problemId}-spacing-direct`,
      problemId,
      role: "edge-case",
      exercisesCheckId: "space-after-hash",
      kind: "compound-missing-space",
      source: "#No space",
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      id: `${problemId}-style-direct`,
      problemId,
      role: "edge-case",
      exercisesCheckId: "use-hash-heading-style",
      kind: "setext",
      source: "Title\n=====",
      expectedStatus: "fail",
      expectedFeedbackId: "use-hash-heading-style",
    },
  ]
}

function validate(
  problems: readonly GradableProblem[],
  problemFixtures = problems.flatMap((item) => fixtures(item.id)),
) {
  return validateProblemBank(problems, problemFixtures)
}

describe("schema-v2 problem-bank validation", () => {
  it("accepts unique fixtures and multiple edge cases per role", () => {
    const problems = [problem("first"), problem("second")]
    const problemFixtures = [
      ...fixtures("first"),
      ...fixtures("second"),
      {
        id: "first-edge-a",
        problemId: "first",
        role: "edge-case" as const,
        kind: "extra-h2" as const,
        source: "# Any\n\n## One",
        expectedStatus: "matched" as const,
      },
      {
        id: "first-edge-b",
        problemId: "first",
        role: "edge-case" as const,
        kind: "extra-h2" as const,
        source: "# Any\n\n## Two",
        expectedStatus: "matched" as const,
      },
    ]

    expect(validate(problems, problemFixtures)).toEqual([])
  })

  it.each([
    [1, "everyday", "introduce"],
    [2, "everyday-recall", "recall"],
    [3, "workplace-document", "recall"],
    [4, "development-spec", "recall"],
    [5, "agent-workflow", "recall"],
  ] as const)(
    "accepts the fixed Level %i metadata mapping",
    (level, profile, teachingMode) => {
      const convention = level === 5
        ? { id: "agent-work-order", version: "2026.1", reviewedOn: "2026-07-19" }
        : undefined
      const problems = ["a", "b"].map((suffix) =>
        problem(`level-${level}-${suffix}`, {
          level,
          teachingMode,
          vocabulary: { profile, domains: ["test"], terms: ["term"] },
          retryFamily: `level-${level}-heading`,
          convention,
        }),
      )

      expect(validate(problems)).toEqual([])
    },
  )

  it("rejects invalid profile, teaching mode, flavor, and blank provenance", () => {
    const invalid = problem("invalid", {
      level: 4,
      teachingMode: "introduce",
      vocabulary: {
        profile: "everyday",
        domains: ["  ", "software"],
        terms: ["scope", "scope"],
      },
      flavor: "gfm" as "standard",
      sourceBatchId: " ",
      revision: 0,
      curriculumVersion: " ",
    })

    expect(validate([invalid, problem("peer")])).toEqual(
      expect.arrayContaining([
        "Problem invalid has unsupported flavor: gfm",
        "Problem invalid level 4 requires vocabulary profile development-spec",
        "Problem invalid level 4 requires teaching mode recall",
        "Problem invalid has blank vocabulary domain",
        "Problem invalid has duplicate vocabulary term: scope",
        "Problem invalid has blank source batch",
        "Problem invalid has invalid revision",
        "Problem invalid has blank curriculum version",
      ]),
    )
  })

  it("requires complete Level 5 convention metadata", () => {
    const levelFive = problem("level-five", {
      level: 5,
      teachingMode: "recall",
      vocabulary: {
        profile: "agent-workflow",
        domains: ["ai-workflow"],
        terms: ["authority"],
      },
      convention: undefined,
    })

    expect(validate([levelFive, problem("peer")])).toContain(
      "Problem level-five requires Level 5 convention metadata",
    )

    const malformed = {
      ...levelFive,
      convention: { id: "agent-work-order" },
    } as unknown as NormalizedProblem
    expect(() => validate([malformed, problem("peer")])).not.toThrow()
    expect(validate([malformed, problem("peer")])).toContain(
      "Problem level-five requires Level 5 convention metadata",
    )
  })

  it("rejects an unknown level and predicate kind safely", () => {
    const invalid = problem("unknown-contract", {
      level: 6 as CurriculumLevel,
      matchChecks: [
        {
          ...commonCheck("unknown"),
          kind: "semantic-prose-match",
        } as unknown as NormalizedProblem["matchChecks"][number],
      ],
    })

    expect(() => validate([invalid, problem("peer")])).not.toThrow()
    expect(validate([invalid, problem("peer")])).toEqual(
      expect.arrayContaining([
        "Problem unknown-contract has invalid level: 6",
        "Problem unknown-contract has unsupported match check kind: semantic-prose-match",
      ]),
    )
  })

  it("rejects duplicate check and fixture IDs plus malformed check ranges", () => {
    const invalid = problem("invalid", {
      matchChecks: [
        {
          id: "shape",
          kind: "block-count",
          scope: { kind: "document" },
          block: "heading",
          min: 2,
          max: 1,
          priority: 10,
          feedback: "Add headings.",
        },
        {
          id: "shape",
          kind: "document-limits",
          maxLines: 0,
          priority: 20,
          feedback: " ",
        },
      ],
    })
    const problemFixtures = [...fixtures("invalid"), ...fixtures("peer")]
    problemFixtures[1]!.id = problemFixtures[0]!.id

    expect(validate([invalid, problem("peer")], problemFixtures)).toEqual(
      expect.arrayContaining([
        "Problem invalid has duplicate match check id: shape",
        "Problem invalid check shape has min greater than max",
        "Problem invalid check shape has blank feedback",
        `Duplicate fixture id: ${problemFixtures[0]!.id}`,
      ]),
    )
  })

  it("accepts recursive block-count checks", () => {
    const recursive = problem("recursive-block-count", {
      matchChecks: [
        {
          id: "nested-thematic-break",
          kind: "block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          recursive: true,
          min: 1,
          priority: 10,
          feedback: "Add a separator.",
        },
      ],
      editorialChecks: [],
    })
    const recursiveFixtures = fixtures(recursive.id).map((fixture) => ({
      ...fixture,
      exercisesCheckId: "nested-thematic-break",
    }))

    expect(
      validate(
        [recursive, problem("recursive-block-count-peer")],
        [...recursiveFixtures, ...fixtures("recursive-block-count-peer")],
      ),
    ).toEqual([])
  })

  it("validates list-shape operands and section scope safely", () => {
    const invalid = problem("invalid-list-shape", {
      matchChecks: [
        {
          id: "list-shape",
          kind: "list-shape",
          scope: { kind: "section", headingDepth: 7, occurrence: -1 },
          ordered: "sometimes",
          minItems: 0,
          maxItems: -1,
          recursive: "yes",
          requireNonemptyItems: 1,
          priority: 10,
          feedback: "Add a list.",
        },
        {
          id: "paragraph-depth",
          kind: "block-count",
          scope: { kind: "document" },
          block: "paragraph",
          depth: 2,
          min: 1,
          priority: 20,
          feedback: "Add a paragraph.",
        },
        {
          id: "missing-scope",
          kind: "inline-presence",
          inline: "strong",
          min: 1,
          priority: 30,
          feedback: "Add bold text.",
        },
        {
          id: "invalid-block",
          kind: "block-count",
          scope: { kind: "document" },
          block: "table",
          depth: 7,
          recursive: "yes",
          min: 1,
          priority: 40,
          feedback: "Add a block.",
        },
        {
          id: "invalid-blockquote-shape",
          kind: "blockquote-shape",
          recursive: "yes",
          requireNonemptyContent: 1,
          priority: 50,
          feedback: "Add a blockquote.",
        },
        {
          id: "invalid-inline-code-shape",
          kind: "inline-code-shape",
          min: -1,
          max: -2,
          requireNonemptyContent: "yes",
          priority: 60,
          feedback: "Add inline code.",
        },
        {
          id: "invalid-link-shape",
          kind: "link-shape",
          min: -1,
          max: -2,
          requireNonemptyLabel: "yes",
          requireNonemptyDestination: "no",
          allowReferences: "yes",
          allowAutolinks: 1,
          priority: 70,
          feedback: "Add a link.",
        },
      ] as unknown as NormalizedProblem["matchChecks"],
    })

    expect(() => validate([invalid, problem("peer")])).not.toThrow()
    expect(validate([invalid, problem("peer")])).toEqual(
      expect.arrayContaining([
        "Problem invalid-list-shape check list-shape has invalid section heading depth",
        "Problem invalid-list-shape check list-shape has invalid section occurrence",
        "Problem invalid-list-shape check list-shape has unsupported ordered value: sometimes",
        "Problem invalid-list-shape check list-shape requires at least one item",
        "Problem invalid-list-shape check list-shape has invalid max",
        "Problem invalid-list-shape check list-shape has invalid recursive flag",
        "Problem invalid-list-shape check list-shape has invalid nonempty-items flag",
        "Problem invalid-list-shape check paragraph-depth can only use depth with heading blocks",
        "Problem invalid-list-shape check missing-scope requires a scope",
        "Problem invalid-list-shape check invalid-block has unsupported block kind: table",
        "Problem invalid-list-shape check invalid-block has invalid heading depth",
        "Problem invalid-list-shape check invalid-block has invalid recursive flag",
        "Problem invalid-list-shape check invalid-blockquote-shape requires a scope",
        "Problem invalid-list-shape check invalid-blockquote-shape has invalid recursive flag",
        "Problem invalid-list-shape check invalid-blockquote-shape has invalid nonempty-content flag",
        "Problem invalid-list-shape check invalid-inline-code-shape requires a scope",
        "Problem invalid-list-shape check invalid-inline-code-shape has invalid min",
        "Problem invalid-list-shape check invalid-inline-code-shape has invalid max",
        "Problem invalid-list-shape check invalid-inline-code-shape has min greater than max",
        "Problem invalid-list-shape check invalid-inline-code-shape has invalid nonempty-content flag",
        "Problem invalid-list-shape check invalid-link-shape requires a scope",
        "Problem invalid-list-shape check invalid-link-shape has invalid min",
        "Problem invalid-list-shape check invalid-link-shape has invalid max",
        "Problem invalid-list-shape check invalid-link-shape has min greater than max",
        "Problem invalid-list-shape check invalid-link-shape has invalid nonempty-label flag",
        "Problem invalid-list-shape check invalid-link-shape has invalid nonempty-destination flag",
        "Problem invalid-list-shape check invalid-link-shape has invalid references flag",
        "Problem invalid-list-shape check invalid-link-shape has invalid autolinks flag",
      ]),
    )
  })

  it("validates generic nonblocking editorial checks safely", () => {
    const invalid = problem("invalid-editorial", {
      editorialChecks: [
        {
          id: " ",
          kind: "max-inline-count",
          scope: { kind: "section", headingDepth: 2, occurrence: -1 },
          inline: "strong",
          max: -1,
          review: " ",
        },
        {
          id: "unknown-review",
          kind: "semantic-review",
          review: "Review prose meaning.",
        },
        {
          id: "missing-scope",
          kind: "max-inline-count",
          inline: "strong",
          max: 1,
          review: "Review focus.",
        },
        {
          id: "unknown-shapes",
          kind: "max-inline-count",
          scope: { kind: "chapter" },
          inline: "underline",
          max: 1,
          review: "Review focus.",
        },
        {
          id: "invalid-heading-depth",
          kind: "max-inline-count",
          scope: { kind: "section", headingDepth: 7, occurrence: 0 },
          inline: "strong",
          max: 1,
          review: "Review focus.",
        },
        {
          id: "invalid-block-review",
          kind: "max-block-count",
          scope: { kind: "section", headingDepth: 8, occurrence: -2 },
          block: "table",
          depth: 7,
          recursive: "yes",
          max: -1,
          review: "Review structure.",
        },
        {
          id: "paragraph-depth-review",
          kind: "max-block-count",
          scope: { kind: "document" },
          block: "paragraph",
          depth: 2,
          max: 1,
          review: "Review structure.",
        },
        {
          id: "invalid-link-review",
          kind: "max-link-count",
          scope: { kind: "document" },
          max: -1,
          requireNonemptyLabel: "yes",
          requireNonemptyDestination: "yes",
          allowReferences: 1,
          allowAutolinks: "no",
          review: "Review link focus.",
        },
      ] as unknown as NormalizedProblem["editorialChecks"],
    })

    expect(() => validate([invalid, problem("peer")])).not.toThrow()
    expect(validate([invalid, problem("peer")])).toEqual(
      expect.arrayContaining([
        "Problem invalid-editorial has blank editorial check id",
        "Problem invalid-editorial editorial check <blank> has blank review",
        "Problem invalid-editorial editorial check <blank> has invalid section occurrence",
        "Problem invalid-editorial editorial check <blank> has invalid max",
        "Problem invalid-editorial has unsupported editorial check kind: semantic-review",
        "Problem invalid-editorial editorial check missing-scope has invalid scope",
        "Problem invalid-editorial editorial check unknown-shapes has unsupported scope kind: chapter",
        "Problem invalid-editorial editorial check unknown-shapes has unsupported inline kind: underline",
        "Problem invalid-editorial editorial check invalid-heading-depth has invalid section heading depth",
        "Problem invalid-editorial editorial check invalid-block-review has invalid section heading depth",
        "Problem invalid-editorial editorial check invalid-block-review has invalid section occurrence",
        "Problem invalid-editorial editorial check invalid-block-review has unsupported block kind: table",
        "Problem invalid-editorial editorial check invalid-block-review has invalid heading depth",
        "Problem invalid-editorial editorial check invalid-block-review has invalid recursive flag",
        "Problem invalid-editorial editorial check invalid-block-review has invalid max",
        "Problem invalid-editorial editorial check paragraph-depth-review can only use depth with heading blocks",
        "Problem invalid-editorial editorial check invalid-link-review has invalid max",
        "Problem invalid-editorial editorial check invalid-link-review has invalid nonempty-label flag",
        "Problem invalid-editorial editorial check invalid-link-review has invalid nonempty-destination flag",
        "Problem invalid-editorial editorial check invalid-link-review has invalid references flag",
        "Problem invalid-editorial editorial check invalid-link-review has invalid autolinks flag",
      ]),
    )
  })

  it("scopes transfer cardinality by level, flavor, and retry family", () => {
    const first = problem("level-1-only", { retryFamily: "shared" })
    const otherLevel = problem("level-2-only", {
      level: 2,
      teachingMode: "recall",
      vocabulary: {
        profile: "everyday-recall",
        domains: ["routine"],
        terms: ["plan"],
      },
      retryFamily: "shared",
    })

    expect(validate([first, otherLevel])).toEqual(
      expect.arrayContaining([
        "Retry family 1/standard/shared requires at least two distinct content variants",
        "Retry family 2/standard/shared requires at least two distinct content variants",
      ]),
    )
  })
})

function commonCheck(id: string) {
  return { id, priority: 10, feedback: `Fix ${id}.` }
}
