import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-ordered-lists-005"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "A numbered list shows steps in an order that is easy to follow.",
  howTo: "Start each step on a new line with a number, a period, and a space.",
  example: "1. Open the book\n2. Read one page\n3. Close the book",
} as const

const hints = [
  "Each step starts on its own line.",
  "Type a number, a period, one space, then the step.",
  "Example: `1. Open the book`",
] as const

const focusedListCheck = {
  id: "keep-one-ordered-list",
  kind: "max-block-count",
  scope: { kind: "document" },
  block: "list",
  recursive: true,
  max: 1,
  review: "Keep these steps together in one numbered list.",
} as const

type OrderedListInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  items: readonly [string, string, string]
  vocabularyDomain: string
}

function createOrderedListProblem({
  id,
  level,
  contentVariant,
  items,
  vocabularyDomain,
}: OrderedListInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "lists",
    skillIds: ["ordered-list"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["1.", "Space", "Step", "New line"],
    title: level === 1 ? "Numbered steps" : "Numbered steps recall",
    prompt:
      level === 1
        ? "Write three steps as a numbered list in Markdown."
        : "From memory, write three steps as a numbered list in Markdown.",
    target: items.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    starterText: "",
    protectedContent: items,
    matchChecks: [
      {
        id: "use-numbered-list",
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: true,
        minItems: 3,
        recursive: true,
        requireNonemptyItems: true,
        priority: 10,
        feedback: "Add at least three numbered steps, with words after each marker.",
      },
    ],
    editorialChecks: [focusedListCheck],
    hints,
    retryFamily:
      level === 1 ? "level-1-ordered-list" : "level-2-ordered-list-recall",
    reviewTags: ["one-focused-ordered-list"],
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

const orderedListInputs: readonly OrderedListInput[] = [
  { id: "l1-order-make-toast", level: 1, contentVariant: "make-toast", items: ["Get the bread", "Toast the bread", "Add butter"], vocabularyDomain: "food" },
  { id: "l1-order-wash-hands", level: 1, contentVariant: "wash-hands", items: ["Turn on the water", "Use soap", "Rinse your hands"], vocabularyDomain: "daily-care" },
  { id: "l1-order-plant-seed", level: 1, contentVariant: "plant-seed", items: ["Fill the pot", "Add the seed", "Water the soil"], vocabularyDomain: "gardening" },
  { id: "l1-order-pack-lunch", level: 1, contentVariant: "pack-lunch", items: ["Make a sandwich", "Choose a fruit", "Fill a bottle"], vocabularyDomain: "food" },
  { id: "l1-order-tie-shoes", level: 1, contentVariant: "tie-shoes", items: ["Cross the laces", "Pull them tight", "Make two loops"], vocabularyDomain: "clothing" },
  { id: "l1-order-make-bed", level: 1, contentVariant: "make-bed", items: ["Straighten the sheet", "Place the pillow", "Fold the blanket"], vocabularyDomain: "home" },
  { id: "l1-order-draw-cat", level: 1, contentVariant: "draw-cat", items: ["Draw a head", "Add two ears", "Draw a tail"], vocabularyDomain: "drawing" },
  { id: "l1-order-brush-teeth", level: 1, contentVariant: "brush-teeth", items: ["Wet the brush", "Add toothpaste", "Brush your teeth"], vocabularyDomain: "daily-care" },
  { id: "l1-order-make-tea", level: 1, contentVariant: "make-tea", items: ["Heat the water", "Add a tea bag", "Pour the water"], vocabularyDomain: "kitchen" },
  { id: "l1-order-feed-pet", level: 1, contentVariant: "feed-pet", items: ["Find the bowl", "Add the food", "Fill the water dish"], vocabularyDomain: "pets" },
  { id: "l1-order-build-tower", level: 1, contentVariant: "build-tower", items: ["Place a big block", "Add a middle block", "Top it with a small block"], vocabularyDomain: "toys" },
  { id: "l1-order-send-letter", level: 1, contentVariant: "send-letter", items: ["Write a note", "Use an envelope", "Add a stamp"], vocabularyDomain: "mail" },
  { id: "l2-order-morning-start", level: 2, contentVariant: "morning-start", items: ["Open the curtains", "Make the bed", "Eat breakfast"], vocabularyDomain: "daily-routine" },
  { id: "l2-order-return-library-book", level: 2, contentVariant: "return-library-book", items: ["Find the library book", "Remove any bookmarks", "Use the return slot"], vocabularyDomain: "library-routine" },
  { id: "l2-order-unpack-groceries", level: 2, contentVariant: "unpack-groceries", items: ["Put away cold food", "Store the cans", "Fold the bags"], vocabularyDomain: "home-routine" },
  { id: "l2-order-start-laundry", level: 2, contentVariant: "start-laundry", items: ["Sort the clothes", "Add the soap", "Start the washer"], vocabularyDomain: "home-routine" },
  { id: "l2-order-charge-phone", level: 2, contentVariant: "charge-phone", items: ["Find the cable", "Connect the phone", "Check the battery icon"], vocabularyDomain: "device-routine" },
  { id: "l2-order-set-picnic", level: 2, contentVariant: "set-picnic", items: ["Spread the blanket", "Set out the food", "Collect the empty bags"], vocabularyDomain: "outdoor-routine" },
  { id: "l2-order-lock-bike", level: 2, contentVariant: "lock-bike", items: ["Park by the rack", "Pass the lock through the frame", "Close the lock"], vocabularyDomain: "travel-routine" },
  { id: "l2-order-water-plant", level: 2, contentVariant: "water-plant", items: ["Touch the soil", "Pour water slowly", "Empty the tray"], vocabularyDomain: "plant-care" },
  { id: "l2-order-wrap-package", level: 2, contentVariant: "wrap-package", items: ["Choose a strong box", "Seal every edge", "Add the label"], vocabularyDomain: "shipping-routine" },
  { id: "l2-order-prepare-rainy-walk", level: 2, contentVariant: "prepare-rainy-walk", items: ["Check the weather", "Put on a coat", "Carry an umbrella"], vocabularyDomain: "weather-routine" },
  { id: "l2-order-save-document", level: 2, contentVariant: "save-document", items: ["Choose a clear name", "Save the file", "Check that it was saved"], vocabularyDomain: "computer-routine" },
  { id: "l2-order-clean-shared-table", level: 2, contentVariant: "clean-shared-table", items: ["Move personal items", "Wipe the surface", "Put the chairs back"], vocabularyDomain: "shared-space-routine" },
]

export const orderedListBatch005Problems: readonly NormalizedProblem[] =
  orderedListInputs.map(createOrderedListProblem)
