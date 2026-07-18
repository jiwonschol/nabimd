import { level12SeedProblems } from "./level12SeedProblems"
import type { FixtureRole, ProblemFixture } from "./types"

const variants: Readonly<
  Record<string, { differentProse: string; caseSpellingVariation: string }>
> = {
  "l1-heading-apple": {
    differentProse: "Bicycle repair",
    caseSpellingVariation: "aple",
  },
  "l1-heading-rainy-day": {
    differentProse: "Family recipe",
    caseSpellingVariation: "RANE DAY",
  },
  "l1-heading-study-notes": {
    differentProse: "Morning walk",
    caseSpellingVariation: "study nots",
  },
  "l1-heading-library-card": {
    differentProse: "Picnic basket",
    caseSpellingVariation: "libary card",
  },
  "l2-heading-grocery-list": {
    differentProse: "Garden path",
    caseSpellingVariation: "grocery lst",
  },
  "l2-heading-bus-schedule": {
    differentProse: "Snowy morning",
    caseSpellingVariation: "bus shedule",
  },
  "l2-heading-weekend-plans": {
    differentProse: "Library card",
    caseSpellingVariation: "wekend plans",
  },
  "l2-heading-morning-walk": {
    differentProse: "Birthday cake",
    caseSpellingVariation: "mornng walk",
  },
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

function createSeedFixtures(problem: (typeof level12SeedProblems)[number]): ProblemFixture[] {
  const heading = problem.protectedContent[0]!
  const variant = variants[problem.id]!
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
      source: `# ${variant.differentProse}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "case-spelling-variation",
      source: `# ${variant.caseSpellingVariation}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "missing",
      source: heading,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
      exercisesCheckId: "use-h1-heading",
    },
    {
      role: "malformed",
      source: `#${heading}`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
      exercisesCheckId: "space-after-hash",
    },
    {
      role: "edge-case",
      kind: "setext",
      source: `${heading}\n===`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-hash-heading-style",
      exercisesCheckId: "use-hash-heading-style",
    },
    {
      role: "matched-with-review",
      source: `${problem.target}\n\n# Notes`,
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
    },
  ]

  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.role}`,
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

export const level12SeedFixtures: readonly ProblemFixture[] =
  level12SeedProblems.flatMap(createSeedFixtures)
