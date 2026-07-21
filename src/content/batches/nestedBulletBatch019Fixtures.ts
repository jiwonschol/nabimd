import type { FixtureRole, ProblemFixture } from "../types"
import {
  nestedBulletBatch019Inputs,
  nestedBulletBatch019Problems,
} from "./nestedBulletBatch019Problems"

type FixtureInput = {
  suffix: string
  role: FixtureRole
  source: string
  expectedStatus: ProblemFixture["expectedStatus"]
  expectedFeedbackId?: string
  exercisesCheckId?: string
  expectedReviewIds?: readonly string[]
}

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

function makeSource(
  marker: "-" | "*" | "+" = "-",
  indent = "  ",
  parent = "Everyday group",
  first = "First item",
  second = "Second item",
) {
  return `${marker} ${parent}\n${indent}${marker} ${first}\n${indent}${marker} ${second}`
}

function fixtureInputs(index: number, target: string): readonly FixtureInput[] {
  const countId = "nested-bullet-list-count"
  const rootId = "nested-bullet-root-list"
  const childId = "nested-bullet-child-list"
  const reviewId = "keep-nested-bullet-warmup-focused"
  const matched = {
    expectedStatus: "matched" as const,
    expectedReviewIds: [] as const,
  }
  return [
    { suffix: "canonical", role: "canonical", source: target, ...matched },
    {
      suffix: "different-prose",
      role: "different-prose",
      source: makeSource("-", "  ", `Changed group ${index + 1}`, "Alpha word", "Beta word"),
      ...matched,
    },
    {
      suffix: "case-spelling",
      role: "case-spelling-variation",
      source: makeSource("-", "  ", "UPPER GROOP", "misspeled ONE", "ANYTHING TWO"),
      ...matched,
    },
    {
      suffix: "missing",
      role: "missing",
      source: "Everyday group\nFirst item\nSecond item",
      expectedStatus: "fail",
      expectedFeedbackId: countId,
      exercisesCheckId: countId,
    },
    {
      suffix: "flat-bullets",
      role: "malformed",
      source: "- Everyday group\n- First item\n- Second item",
      expectedStatus: "fail",
      expectedFeedbackId: countId,
      exercisesCheckId: countId,
    },
    {
      suffix: "extra-note",
      role: "matched-with-review",
      source: `${target}\n\nA short extra note.`,
      expectedStatus: "matched",
      expectedReviewIds: [reviewId],
    },
    {
      suffix: "alternate-markers",
      role: "edge-case",
      source: makeSource("*"),
      ...matched,
    },
    {
      suffix: "four-space-indent",
      role: "edge-case",
      source: makeSource("-", "    "),
      ...matched,
    },
    {
      suffix: "tab-indent",
      role: "edge-case",
      source: makeSource("-", "\t"),
      ...matched,
    },
    {
      suffix: "ordered-child-list",
      role: "edge-case",
      source: "- Everyday group\n  1. First item\n  2. Second item",
      expectedStatus: "fail",
      expectedFeedbackId: childId,
      exercisesCheckId: childId,
    },
    {
      suffix: "ordered-root-list",
      role: "edge-case",
      source: "1. Everyday group\n   - First item\n   - Second item",
      expectedStatus: "fail",
      expectedFeedbackId: rootId,
      exercisesCheckId: rootId,
    },
    {
      suffix: "third-list-depth",
      role: "edge-case",
      source: "- Everyday group\n  - First item\n    - Extra depth\n  - Second item",
      expectedStatus: "fail",
      expectedFeedbackId: countId,
      exercisesCheckId: countId,
    },
    {
      suffix: "hidden-child-item",
      role: "edge-case",
      source: "- Everyday group\n  - <!-- hidden -->\n  - Second item",
      expectedStatus: "fail",
      expectedFeedbackId: childId,
      exercisesCheckId: childId,
    },
    {
      suffix: "fenced-lookalike",
      role: "edge-case",
      source: "```markdown\n- Everyday group\n  - First item\n  - Second item\n```",
      expectedStatus: "fail",
      expectedFeedbackId: countId,
      exercisesCheckId: countId,
    },
  ]
}

export const nestedBulletBatch019Fixtures: readonly ProblemFixture[] =
  nestedBulletBatch019Problems.flatMap((problem, index) =>
    fixtureInputs(index, problem.target).map((fixture) => ({
      id: `${problem.id}-${fixture.suffix}`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: fixture.role,
      kind: fixtureKind(fixture.role),
      source: fixture.source,
      expectedStatus: fixture.expectedStatus,
      ...(fixture.expectedFeedbackId
        ? { expectedFeedbackId: fixture.expectedFeedbackId }
        : {}),
      ...(fixture.exercisesCheckId
        ? { exercisesCheckId: fixture.exercisesCheckId }
        : {}),
      ...(fixture.expectedReviewIds
        ? { expectedReviewIds: fixture.expectedReviewIds }
        : {}),
    })),
  )

if (nestedBulletBatch019Inputs.length !== nestedBulletBatch019Problems.length) {
  throw new Error("Batch019 input and problem counts must stay aligned")
}
