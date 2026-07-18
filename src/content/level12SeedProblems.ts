import type {
  FixtureRole,
  NormalizedProblem,
  ProblemFixture,
} from "./types"

const sourceBatchId = "milestone-1-level-1-2-seed"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "A main heading names the whole document.",
  howTo: "Start a line with one hash, add a space, then type the heading.",
  example: "# Daily notes",
} as const

const hints = [
  "A main heading starts at the beginning of a line.",
  "Type one hash, one space, then the heading.",
  "Example: `# Morning walk`",
] as const

const singleTitleCheck = {
  id: "one-document-title",
  kind: "single-h1",
  review:
    "Keep one H1 as the document title; use lower heading levels for sections.",
} as const

type SeedInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  heading: string
  vocabularyDomain: string
  differentProse: string
  caseSpellingVariation: string
}

function createSeedProblem({
  id,
  level,
  contentVariant,
  heading,
  vocabularyDomain,
}: SeedInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["#", "Space", "Heading"],
    title: level === 1 ? "Main heading" : "Main heading recall",
    prompt:
      level === 1
        ? "Write one main heading in Markdown."
        : "From memory, write one main heading in Markdown.",
    target: `# ${heading}`,
    starterText: "",
    protectedContent: [heading],
    matchChecks: [
      {
        id: "space-after-hash",
        kind: "heading-spacing",
        level: 1,
        priority: 10,
        feedback: "Add one space after the hash symbol.",
      },
      {
        id: "use-hash-heading-style",
        kind: "hash-heading-style",
        level: 1,
        priority: 20,
        feedback:
          "That is a heading, but this exercise practices the hash style. Start with `# `.",
      },
      {
        id: "use-h1-heading",
        kind: "has-heading",
        level: 1,
        priority: 30,
        feedback: "Start the heading with one hash symbol and one space.",
      },
    ],
    editorialChecks: [singleTitleCheck],
    hints,
    retryFamily:
      level === 1 ? "level-1-heading-h1" : "level-2-heading-h1-recall",
    reviewTags: ["one-document-title"],
    vocabulary: {
      profile: level === 1 ? "everyday" : "everyday-recall",
      domains: [vocabularyDomain],
      terms: [heading],
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant,
  }
}

const seedInputs: readonly SeedInput[] = [
  {
    id: "l1-heading-apple",
    level: 1,
    contentVariant: "apple",
    heading: "Apple",
    vocabularyDomain: "fruit",
    differentProse: "Bicycle repair",
    caseSpellingVariation: "aple",
  },
  {
    id: "l1-heading-rainy-day",
    level: 1,
    contentVariant: "rainy-day",
    heading: "Rainy day",
    vocabularyDomain: "weather",
    differentProse: "Family recipe",
    caseSpellingVariation: "RANE DAY",
  },
  {
    id: "l1-heading-study-notes",
    level: 1,
    contentVariant: "study-notes",
    heading: "Study notes",
    vocabularyDomain: "learning",
    differentProse: "Morning walk",
    caseSpellingVariation: "study nots",
  },
  {
    id: "l1-heading-library-card",
    level: 1,
    contentVariant: "library-card",
    heading: "Library card",
    vocabularyDomain: "reading",
    differentProse: "Picnic basket",
    caseSpellingVariation: "libary card",
  },
  {
    id: "l2-heading-grocery-list",
    level: 2,
    contentVariant: "grocery-list",
    heading: "Grocery list",
    vocabularyDomain: "errands",
    differentProse: "Garden path",
    caseSpellingVariation: "grocery lst",
  },
  {
    id: "l2-heading-bus-schedule",
    level: 2,
    contentVariant: "bus-schedule",
    heading: "Bus schedule",
    vocabularyDomain: "daily-travel",
    differentProse: "Snowy morning",
    caseSpellingVariation: "bus shedule",
  },
  {
    id: "l2-heading-weekend-plans",
    level: 2,
    contentVariant: "weekend-plans",
    heading: "Weekend plans",
    vocabularyDomain: "daily-planning",
    differentProse: "Library card",
    caseSpellingVariation: "wekend plans",
  },
  {
    id: "l2-heading-morning-walk",
    level: 2,
    contentVariant: "morning-walk",
    heading: "Morning walk",
    vocabularyDomain: "daily-routine",
    differentProse: "Birthday cake",
    caseSpellingVariation: "mornng walk",
  },
]

export const level12SeedProblems: readonly NormalizedProblem[] =
  seedInputs.map(createSeedProblem)

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

function createSeedFixtures(input: SeedInput): ProblemFixture[] {
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
      source: `# ${input.heading}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "different-prose",
      source: `# ${input.differentProse}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "case-spelling-variation",
      source: `# ${input.caseSpellingVariation}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "missing",
      source: input.heading,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
      exercisesCheckId: "use-h1-heading",
    },
    {
      role: "malformed",
      source: `#${input.heading}`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
      exercisesCheckId: "space-after-hash",
    },
    {
      role: "edge-case",
      kind: "setext",
      source: `${input.heading}\n===`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-hash-heading-style",
      exercisesCheckId: "use-hash-heading-style",
    },
    {
      role: "matched-with-review",
      source: `# ${input.heading}\n\n# Notes`,
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
    },
  ]

  return fixtures.map((fixture) => ({
    id: `${input.id}-${fixture.role}`,
    problemId: input.id,
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
  seedInputs.flatMap(createSeedFixtures)
