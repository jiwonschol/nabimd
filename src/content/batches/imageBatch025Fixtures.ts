import type { FixtureRole, ProblemFixture } from "../types"
import {
  imageBatch025Inputs,
  imageBatch025Problems,
} from "./imageBatch025Problems"

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

function createImageFixtures(
  problem: (typeof imageBatch025Problems)[number],
  index: number,
): readonly ProblemFixture[] {
  const input = imageBatch025Inputs[index]!
  const imageUrl = `https://example.com/images/alternate-${index + 1}.jpg`
  const fail = {
    expectedFeedbackId: "use-image",
    exercisesCheckId: "use-image",
  } as const

  return [
    fixture(
      problem.id,
      "canonical",
      "canonical",
      problem.target,
      "matched",
      { expectedReviewIds: [] },
    ),
    fixture(
      problem.id,
      "different-prose",
      "different-prose",
      `Remember this: ![A blue umbrella by the door](${imageUrl}).`,
      "matched",
      { expectedReviewIds: [] },
    ),
    fixture(
      problem.id,
      "case-spelling",
      "case-spelling-variation",
      `SAVE ![A BRITE YELLOW KITE](${imageUrl.toUpperCase()}).`,
      "matched",
      { expectedReviewIds: [] },
    ),
    fixture(
      problem.id,
      "missing",
      "missing",
      input.plainText,
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "link-not-image",
      "malformed",
      `[A blue umbrella](${imageUrl})`,
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "empty-image-address",
      "malformed",
      "![A blue umbrella by the door]()",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "two-images",
      "matched-with-review",
      `![First view](${imageUrl}) and ![Second view](https://example.com/images/second.jpg)`,
      "matched",
      { expectedReviewIds: ["keep-one-image"] },
    ),
    fixture(
      problem.id,
      "relative-address",
      "edge-case",
      "![A bicycle beside a tree](../photos/bicycle.jpg)",
      "matched",
      { expectedReviewIds: [] },
    ),
    fixture(
      problem.id,
      "image-title",
      "edge-case",
      '![A lantern at dusk](/photos/lantern.jpg "Evening walk")',
      "matched",
      { expectedReviewIds: [] },
    ),
    fixture(
      problem.id,
      "empty-decorative-image",
      "edge-case",
      "![](/photos/divider.png)",
      "matched",
      { expectedReviewIds: [] },
    ),
    fixture(
      problem.id,
      "code-lookalike",
      "edge-case",
      "`![A blue umbrella](https://example.com/images/umbrella.jpg)`",
      "fail",
      fail,
    ),
    fixture(
      problem.id,
      "escaped-image-mark",
      "edge-case",
      "\\![A blue umbrella](https://example.com/images/umbrella.jpg)",
      "fail",
      fail,
    ),
  ]
}

export const imageBatch025Fixtures: readonly ProblemFixture[] =
  imageBatch025Problems.flatMap(createImageFixtures)
