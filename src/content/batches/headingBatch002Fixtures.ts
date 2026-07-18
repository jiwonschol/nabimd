import type { FixtureRole, ProblemFixture } from "../types"
import { headingBatch002Problems } from "./headingBatch002Problems"

const proseVariants: Readonly<
  Record<string, { differentProse: string; caseSpellingVariation: string }>
> = {
  "l1-heading-breakfast-menu": {
    differentProse: "City park",
    caseSpellingVariation: "brekfast MENU",
  },
  "l1-heading-soccer-practice": {
    differentProse: "Blue sky",
    caseSpellingVariation: "SOCCER practis",
  },
  "l1-heading-family-photo": {
    differentProse: "Warm soup",
    caseSpellingVariation: "famly FOTO",
  },
  "l1-heading-garden-flowers": {
    differentProse: "Red balloon",
    caseSpellingVariation: "GARDEN flowrs",
  },
  "l1-heading-school-bus": {
    differentProse: "Happy dog",
    caseSpellingVariation: "scool BUS",
  },
  "l1-heading-pet-care": {
    differentProse: "Green apple",
    caseSpellingVariation: "PET kare",
  },
  "l1-heading-birthday-party": {
    differentProse: "Lunch box",
    caseSpellingVariation: "BIRTHDAY pary",
  },
  "l1-heading-beach-trip": {
    differentProse: "Yellow hat",
    caseSpellingVariation: "bech TRIP",
  },
  "l1-heading-bedtime-story": {
    differentProse: "Rain boots",
    caseSpellingVariation: "BEDTIME stori",
  },
  "l1-heading-music-class": {
    differentProse: "Small garden",
    caseSpellingVariation: "musik CLASS",
  },
  "l1-heading-winter-coat": {
    differentProse: "Toy train",
    caseSpellingVariation: "WINTER cote",
  },
  "l1-heading-doctor-visit": {
    differentProse: "Family picnic",
    caseSpellingVariation: "doktor VISIT",
  },
  "l2-heading-make-lunch": {
    differentProse: "Clean the desk",
    caseSpellingVariation: "MAKE lunc",
  },
  "l2-heading-fold-laundry": {
    differentProse: "Call a friend",
    caseSpellingVariation: "fold LONDRY",
  },
  "l2-heading-water-the-garden": {
    differentProse: "Write a note",
    caseSpellingVariation: "WATER the gardn",
  },
  "l2-heading-prepare-for-class": {
    differentProse: "Feed the cat",
    caseSpellingVariation: "prepare FOR clas",
  },
  "l2-heading-practice-piano": {
    differentProse: "Open the window",
    caseSpellingVariation: "PRACTIS piano",
  },
  "l2-heading-share-family-photos": {
    differentProse: "Meet at the park",
    caseSpellingVariation: "share FAMLY fotos",
  },
  "l2-heading-plan-game-night": {
    differentProse: "Walk to school",
    caseSpellingVariation: "PLAN game nite",
  },
  "l2-heading-get-ready-for-bed": {
    differentProse: "Wash the dishes",
    caseSpellingVariation: "get REDY for bed",
  },
  "l2-heading-pack-for-a-trip": {
    differentProse: "Check the mail",
    caseSpellingVariation: "PACK for a trp",
  },
  "l2-heading-read-before-bed": {
    differentProse: "Take a short walk",
    caseSpellingVariation: "reed BEFORE bed",
  },
  "l2-heading-stretch-after-work": {
    differentProse: "Put away groceries",
    caseSpellingVariation: "STRECH after work",
  },
  "l2-heading-help-a-neighbor": {
    differentProse: "Set the table",
    caseSpellingVariation: "help A neibor",
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

function createHeadingFixtures(
  problem: (typeof headingBatch002Problems)[number],
): ProblemFixture[] {
  const heading = problem.protectedContent[0]!
  const variants = proseVariants[problem.id]!
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
      source: `# ${variants.differentProse}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      role: "case-spelling-variation",
      source: `# ${variants.caseSpellingVariation}`,
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
      role: "edge-case",
      kind: "h2",
      source: `## ${heading}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
      exercisesCheckId: "use-h1-heading",
    },
    {
      role: "matched-with-review",
      source: `${problem.target}\n\n# Notes`,
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
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

export const headingBatch002Fixtures: readonly ProblemFixture[] =
  headingBatch002Problems.flatMap(createHeadingFixtures)
