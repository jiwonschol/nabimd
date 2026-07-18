import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-headings-002"
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

type HeadingInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  heading: string
  vocabularyDomain: string
}

function createHeadingProblem({
  id,
  level,
  contentVariant,
  heading,
  vocabularyDomain,
}: HeadingInput): NormalizedProblem {
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

const headingInputs: readonly HeadingInput[] = [
  {
    id: "l1-heading-breakfast-menu",
    level: 1,
    contentVariant: "breakfast-menu",
    heading: "Breakfast menu",
    vocabularyDomain: "food",
  },
  {
    id: "l1-heading-soccer-practice",
    level: 1,
    contentVariant: "soccer-practice",
    heading: "Soccer practice",
    vocabularyDomain: "sports",
  },
  {
    id: "l1-heading-family-photo",
    level: 1,
    contentVariant: "family-photo",
    heading: "Family photo",
    vocabularyDomain: "family",
  },
  {
    id: "l1-heading-garden-flowers",
    level: 1,
    contentVariant: "garden-flowers",
    heading: "Garden flowers",
    vocabularyDomain: "nature",
  },
  {
    id: "l1-heading-school-bus",
    level: 1,
    contentVariant: "school-bus",
    heading: "School bus",
    vocabularyDomain: "school",
  },
  {
    id: "l1-heading-pet-care",
    level: 1,
    contentVariant: "pet-care",
    heading: "Pet care",
    vocabularyDomain: "pets",
  },
  {
    id: "l1-heading-birthday-party",
    level: 1,
    contentVariant: "birthday-party",
    heading: "Birthday party",
    vocabularyDomain: "celebrations",
  },
  {
    id: "l1-heading-beach-trip",
    level: 1,
    contentVariant: "beach-trip",
    heading: "Beach trip",
    vocabularyDomain: "travel",
  },
  {
    id: "l1-heading-bedtime-story",
    level: 1,
    contentVariant: "bedtime-story",
    heading: "Bedtime story",
    vocabularyDomain: "reading",
  },
  {
    id: "l1-heading-music-class",
    level: 1,
    contentVariant: "music-class",
    heading: "Music class",
    vocabularyDomain: "learning",
  },
  {
    id: "l1-heading-winter-coat",
    level: 1,
    contentVariant: "winter-coat",
    heading: "Winter coat",
    vocabularyDomain: "clothing",
  },
  {
    id: "l1-heading-doctor-visit",
    level: 1,
    contentVariant: "doctor-visit",
    heading: "Doctor visit",
    vocabularyDomain: "health",
  },
  {
    id: "l2-heading-make-lunch",
    level: 2,
    contentVariant: "make-lunch",
    heading: "Make lunch",
    vocabularyDomain: "daily-routine",
  },
  {
    id: "l2-heading-fold-laundry",
    level: 2,
    contentVariant: "fold-laundry",
    heading: "Fold laundry",
    vocabularyDomain: "household-routine",
  },
  {
    id: "l2-heading-water-the-garden",
    level: 2,
    contentVariant: "water-the-garden",
    heading: "Water the garden",
    vocabularyDomain: "home-routine",
  },
  {
    id: "l2-heading-prepare-for-class",
    level: 2,
    contentVariant: "prepare-for-class",
    heading: "Prepare for class",
    vocabularyDomain: "learning-routine",
  },
  {
    id: "l2-heading-practice-piano",
    level: 2,
    contentVariant: "practice-piano",
    heading: "Practice piano",
    vocabularyDomain: "practice-routine",
  },
  {
    id: "l2-heading-share-family-photos",
    level: 2,
    contentVariant: "share-family-photos",
    heading: "Share family photos",
    vocabularyDomain: "family-routine",
  },
  {
    id: "l2-heading-plan-game-night",
    level: 2,
    contentVariant: "plan-game-night",
    heading: "Plan game night",
    vocabularyDomain: "social-planning",
  },
  {
    id: "l2-heading-get-ready-for-bed",
    level: 2,
    contentVariant: "get-ready-for-bed",
    heading: "Get ready for bed",
    vocabularyDomain: "evening-routine",
  },
  {
    id: "l2-heading-pack-for-a-trip",
    level: 2,
    contentVariant: "pack-for-a-trip",
    heading: "Pack for a trip",
    vocabularyDomain: "travel-planning",
  },
  {
    id: "l2-heading-read-before-bed",
    level: 2,
    contentVariant: "read-before-bed",
    heading: "Read before bed",
    vocabularyDomain: "reading-routine",
  },
  {
    id: "l2-heading-stretch-after-work",
    level: 2,
    contentVariant: "stretch-after-work",
    heading: "Stretch after work",
    vocabularyDomain: "wellness-routine",
  },
  {
    id: "l2-heading-help-a-neighbor",
    level: 2,
    contentVariant: "help-a-neighbor",
    heading: "Help a neighbor",
    vocabularyDomain: "community-routine",
  },
]

export const headingBatch002Problems: readonly NormalizedProblem[] =
  headingInputs.map(createHeadingProblem)
