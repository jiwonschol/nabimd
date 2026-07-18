import type { FixtureRole, ProblemFixture } from "../types"
import { emphasisBatch003Problems } from "./emphasisBatch003Problems"

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

function createEmphasisFixtures(
  problem: (typeof emphasisBatch003Problems)[number],
  index: number,
): ProblemFixture[] {
  const phrase = problem.protectedContent[0]!
  const differentProse =
    problem.level === 1
      ? `Blue balloon ${index + 1}`
      : `Check a new task ${index + 1}`
  const caseSpellingVariation = `MISPELED words ${index + 1}`
  const fixtures: readonly {
    role: FixtureRole
    kind?: ProblemFixture["kind"]
    source: string
    expectedStatus: ProblemFixture["expectedStatus"]
    expectedFeedbackId?: string
    exercisesCheckId?: string
    expectedReviewIds?: readonly string[]
  }[] = [
    {
      role: "canonical",
      source: problem.target,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "different-prose",
      source: `**${differentProse}**`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "case-spelling-variation",
      source: `**${caseSpellingVariation}**`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "edge-case",
      kind: "underscore-strong",
      source: `__${differentProse}__`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "missing",
      source: phrase,
      expectedStatus: "fail",
      expectedFeedbackId: "use-bold-emphasis",
      exercisesCheckId: "use-bold-emphasis",
    },
    {
      role: "malformed",
      source: `**${phrase}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-bold-emphasis",
      exercisesCheckId: "use-bold-emphasis",
    },
    {
      role: "edge-case",
      kind: "inline-emphasis",
      source: `*${differentProse}*`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-bold-emphasis",
      exercisesCheckId: "use-bold-emphasis",
    },
    {
      role: "edge-case",
      kind: "inline-code",
      source: `\`**${differentProse}**\``,
      expectedStatus: "fail",
      expectedFeedbackId: "use-bold-emphasis",
      exercisesCheckId: "use-bold-emphasis",
    },
    {
      role: "matched-with-review",
      source: `${problem.target} and **Another point**`,
      expectedStatus: "matched",
      expectedReviewIds: ["keep-bold-focused"],
    },
  ]

  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.role}-${fixture.kind ?? fixtureKind(fixture.role)}`,
    problemId: problem.id,
    problemRevision: problem.revision,
    role: fixture.role,
    kind: fixture.kind ?? fixtureKind(fixture.role),
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
  }))
}

export const emphasisBatch003Fixtures: readonly ProblemFixture[] =
  emphasisBatch003Problems.flatMap(createEmphasisFixtures)
