import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-lists-004"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "A bullet list groups related items so each one is easy to scan.",
  howTo: "Start each item on a new line with a hyphen and a space.",
  example: "- Apples\n- Bread\n- Milk",
} as const

const hints = [
  "Each item starts on its own line.",
  "Type a hyphen, one space, then the item.",
  "Example: `- Apples`",
] as const

const focusedListCheck = {
  id: "keep-one-list",
  kind: "max-block-count",
  scope: { kind: "document" },
  block: "list",
  recursive: true,
  max: 1,
  review: "Keep these items together in one bullet list.",
} as const

type ListInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  items: readonly [string, string, string]
  vocabularyDomain: string
}

function createListProblem({
  id,
  level,
  contentVariant,
  items,
  vocabularyDomain,
}: ListInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "lists",
    skillIds: ["unordered-list"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["-", "Space", "Item", "New line"],
    title: level === 1 ? "Bullet list" : "Bullet list recall",
    prompt:
      level === 1
        ? "Write a three-item bullet list in Markdown."
        : "From memory, write a three-item bullet list in Markdown.",
    target: items.map((item) => `- ${item}`).join("\n"),
    starterText: "",
    protectedContent: items,
    matchChecks: [
      {
        id: "use-bullet-list",
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: false,
        minItems: 3,
        recursive: true,
        requireNonemptyItems: true,
        priority: 10,
        feedback: "Add at least three bullet items, with words after each marker.",
      },
    ],
    editorialChecks: [focusedListCheck],
    hints,
    retryFamily:
      level === 1 ? "level-1-unordered-list" : "level-2-unordered-list-recall",
    reviewTags: ["one-focused-list"],
    vocabulary: {
      profile: level === 1 ? "everyday" : "everyday-recall",
      domains: [vocabularyDomain],
      terms: items,
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant,
  }
}

const listInputs: readonly ListInput[] = [
  { id: "l1-list-pencil-case", level: 1, contentVariant: "pencil-case", items: ["Pens", "Markers", "Scissors"], vocabularyDomain: "school-supplies" },
  { id: "l1-list-snack-plate", level: 1, contentVariant: "snack-plate", items: ["Crackers", "Cheese", "Grapes"], vocabularyDomain: "food" },
  { id: "l1-list-art-box", level: 1, contentVariant: "art-box", items: ["Crayons", "Paper", "Glue"], vocabularyDomain: "art-supplies" },
  { id: "l1-list-toy-bin", level: 1, contentVariant: "toy-bin", items: ["Blocks", "Puzzles", "Balls"], vocabularyDomain: "toys" },
  { id: "l1-list-kitchen-drawer", level: 1, contentVariant: "kitchen-drawer", items: ["Spoons", "Forks", "Napkins"], vocabularyDomain: "kitchen" },
  { id: "l1-list-bathroom-shelf", level: 1, contentVariant: "bathroom-shelf", items: ["Soap", "Combs", "Towels"], vocabularyDomain: "home" },
  { id: "l1-list-cleaning-shelf", level: 1, contentVariant: "cleaning-shelf", items: ["Sponges", "Brushes", "Buckets"], vocabularyDomain: "cleaning" },
  { id: "l1-list-toolbox", level: 1, contentVariant: "toolbox", items: ["Hammers", "Tape", "Nails"], vocabularyDomain: "tools" },
  { id: "l1-list-fruit-bowl", level: 1, contentVariant: "fruit-bowl", items: ["Bananas", "Oranges", "Pears"], vocabularyDomain: "fruit" },
  { id: "l1-list-shoe-rack", level: 1, contentVariant: "shoe-rack", items: ["Sneakers", "Boots", "Sandals"], vocabularyDomain: "clothing" },
  { id: "l1-list-desk-tray", level: 1, contentVariant: "desk-tray", items: ["Paper clips", "Labels", "Stamps"], vocabularyDomain: "office-supplies" },
  { id: "l1-list-picnic-basket", level: 1, contentVariant: "picnic-basket", items: ["Water", "Blanket", "Sunscreen"], vocabularyDomain: "outdoors" },
  { id: "l2-list-kitchen-cleanup", level: 2, contentVariant: "kitchen-cleanup", items: ["Put away dishes", "Wipe the counter", "Sweep the floor"], vocabularyDomain: "home-routine" },
  { id: "l2-list-backpack-check", level: 2, contentVariant: "backpack-check", items: ["Add a notebook", "Pack a snack", "Zip each pocket"], vocabularyDomain: "school-routine" },
  { id: "l2-list-houseplant-care", level: 2, contentVariant: "houseplant-care", items: ["Check the soil", "Trim dry leaves", "Empty the tray"], vocabularyDomain: "plant-care" },
  { id: "l2-list-guest-setup", level: 2, contentVariant: "guest-setup", items: ["Clear a chair", "Set out water", "Add a clean towel"], vocabularyDomain: "home-routine" },
  { id: "l2-list-study-reset", level: 2, contentVariant: "study-reset", items: ["Close the books", "File loose papers", "Clear the table"], vocabularyDomain: "study-routine" },
  { id: "l2-list-rain-preparation", level: 2, contentVariant: "rain-preparation", items: ["Close the windows", "Move shoes inside", "Cover the bike"], vocabularyDomain: "weather-routine" },
  { id: "l2-list-closet-cleanup", level: 2, contentVariant: "closet-cleanup", items: ["Hang shirts", "Pair socks", "Stack sweaters"], vocabularyDomain: "home-routine" },
  { id: "l2-list-movie-night-setup", level: 2, contentVariant: "movie-night-setup", items: ["Choose a movie", "Make popcorn", "Set out pillows"], vocabularyDomain: "leisure-routine" },
  { id: "l2-list-donation-pickup", level: 2, contentVariant: "donation-pickup", items: ["Gather clean clothes", "Choose a few books", "Find a sturdy box"], vocabularyDomain: "community-routine" },
  { id: "l2-list-bike-ride-check", level: 2, contentVariant: "bike-ride-check", items: ["Fill a bottle", "Test the brakes", "Bring a helmet"], vocabularyDomain: "outdoor-routine" },
  { id: "l2-list-package-checklist", level: 2, contentVariant: "package-checklist", items: ["Find a box", "Bring packing tape", "Keep a marker"], vocabularyDomain: "shipping-routine" },
  { id: "l2-list-room-reset", level: 2, contentVariant: "room-reset", items: ["Open the curtains", "Make the bed", "Put away clutter"], vocabularyDomain: "home-routine" },
]

export const listBatch004Problems: readonly NormalizedProblem[] =
  listInputs.map(createListProblem)
