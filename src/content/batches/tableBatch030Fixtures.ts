import type { FixtureRole, ProblemFixture } from "../types"
import { tableBatch030Problems } from "./tableBatch030Problems"

function fixtureKind(role: FixtureRole): ProblemFixture["kind"] {
  switch (role) {
    case "canonical":
      return "canonical"
    case "different-prose":
      return "alternate"
    case "case-spelling-variation":
      return "case-variation"
    case "missing":
      return "missing"
    case "malformed":
      return "malformed"
    case "matched-with-review":
      return "matched-with-refinement"
    case "edge-case":
      return "normalized-whitespace"
  }
}

function fixture(
  problemId: string,
  suffix: string,
  role: FixtureRole,
  source: string,
  expectedStatus: ProblemFixture["expectedStatus"],
  extra: Pick<
    ProblemFixture,
    "expectedFeedbackId" | "exercisesCheckId" | "expectedReviewIds"
  > = {},
): ProblemFixture {
  return {
    id: `${problemId}-${suffix}`,
    problemId,
    problemRevision: 1,
    role,
    kind: fixtureKind(role),
    source,
    expectedStatus,
    ...extra,
  }
}

function createTableFixtures(
  problem: (typeof tableBatch030Problems)[number],
): readonly ProblemFixture[] {
  const matched = { expectedReviewIds: [] } as const
  const fail = {
    expectedFeedbackId: "use-table",
    exercisesCheckId: "use-table",
  } as const

  return [
    fixture(
      problem.id,
      "canonical",
      "canonical",
      problem.target,
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "different-prose",
      "different-prose",
      "Name | Color\n--- | ---\nKite | Blue",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "case-spelling",
      "case-spelling-variation",
      "NAME | COLOUR\n--- | ---\nKITE | BLU",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "missing",
      "missing",
      "Name and color\nKite and blue",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "no-divider",
      "malformed",
      "Name | Color\nKite | Blue",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "mismatched-divider",
      "malformed",
      "Name | Color | Place\n--- | ---\nKite | Blue",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "two-tables",
      "matched-with-review",
      "Name | Color\n--- | ---\nKite | Blue\n\nItem | Count\n--- | ---\nPens | 2",
      "matched",
      { expectedReviewIds: ["keep-one-table"] },
    ),
    fixture(
      problem.id,
      "outer-bars",
      "edge-case",
      "| Name | Color |\n| --- | --- |\n| Kite | Blue |",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "one-dash-divider",
      "edge-case",
      "| Name | Color |\n| - | - |\n| Kite | Blue |",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "two-dash-divider",
      "edge-case",
      "| Name | Color |\n| -- | -- |\n| Kite | Blue |",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "aligned-divider",
      "edge-case",
      "Name | Color\n:--- | ---:\nKite | Blue",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "escaped-cell-bar",
      "edge-case",
      "Choice | Note\n--- | ---\nA \\| B | Saved",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "dash-cell-with-text",
      "edge-case",
      "Item | Note\n--- | ---\n--- | Ready",
      "matched",
      matched,
    ),
    fixture(
      problem.id,
      "pipe-paragraph",
      "edge-case",
      "Compare A | B when the sizes differ.",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "pipe-list",
      "edge-case",
      "- Compare A | B",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "fenced-lookalike",
      "edge-case",
      "```md\nName | Color\n--- | ---\nKite | Blue\n```",
      "fail",
      fail,
    ),
  ]
}

export const tableBatch030Fixtures: readonly ProblemFixture[] =
  tableBatch030Problems.flatMap(createTableFixtures)
