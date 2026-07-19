import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-blockquotes-006"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "A blockquote sets a quote or callout apart from the rest of a document.",
  howTo: "Start the line with a greater-than sign, a space, then the words.",
  example: "> The window is open.",
} as const

const hints = [
  "The callout starts at the beginning of the line.",
  "Type a greater-than sign, one space, then the words.",
  "Example: `> The window is open.`",
] as const

const focusedBlockquoteCheck = {
  id: "keep-one-blockquote",
  kind: "max-block-count",
  scope: { kind: "document" },
  block: "blockquote",
  recursive: true,
  max: 1,
  review: "Keep this short callout in one blockquote.",
} as const

type BlockquoteInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  sentence: string
  vocabularyDomain: string
}

function createBlockquoteProblem({
  id,
  level,
  contentVariant,
  sentence,
  vocabularyDomain,
}: BlockquoteInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "blockquotes",
    skillIds: ["blockquote"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: [">", "Space", "Words"],
    title: level === 1 ? "Blockquote" : "Blockquote recall",
    prompt:
      level === 1
        ? "Write the callout as a blockquote in Markdown."
        : "From memory, write the callout as a blockquote in Markdown.",
    target: `> ${sentence}`,
    starterText: "",
    protectedContent: [sentence],
    matchChecks: [
      {
        id: "use-blockquote",
        kind: "blockquote-shape",
        scope: { kind: "document" },
        recursive: true,
        requireNonemptyContent: true,
        priority: 10,
        feedback: "Add a blockquote with words inside it.",
      },
    ],
    editorialChecks: [focusedBlockquoteCheck],
    hints,
    retryFamily:
      level === 1 ? "level-1-blockquote" : "level-2-blockquote-recall",
    reviewTags: ["one-focused-blockquote"],
    vocabulary: {
      profile: level === 1 ? "everyday" : "everyday-recall",
      domains: [vocabularyDomain],
      terms: [sentence],
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant,
  }
}

const blockquoteInputs: readonly BlockquoteInput[] = [
  { id: "l1-blockquote-bring-keys", level: 1, contentVariant: "bring-keys", sentence: "Bring your keys.", vocabularyDomain: "home-reminder" },
  { id: "l1-blockquote-dinner-table", level: 1, contentVariant: "dinner-table", sentence: "Dinner is on the table.", vocabularyDomain: "family-meal" },
  { id: "l1-blockquote-bus-arrival", level: 1, contentVariant: "bus-arrival", sentence: "The bus will arrive soon.", vocabularyDomain: "daily-travel" },
  { id: "l1-blockquote-take-umbrella", level: 1, contentVariant: "take-umbrella", sentence: "Take an umbrella today.", vocabularyDomain: "weather-reminder" },
  { id: "l1-blockquote-close-back-door", level: 1, contentVariant: "close-back-door", sentence: "Please close the back door.", vocabularyDomain: "home-routine" },
  { id: "l1-blockquote-book-by-lamp", level: 1, contentVariant: "book-by-lamp", sentence: "Your book is beside the lamp.", vocabularyDomain: "home-objects" },
  { id: "l1-blockquote-dog-water", level: 1, contentVariant: "dog-water", sentence: "The dog needs fresh water.", vocabularyDomain: "pet-care" },
  { id: "l1-blockquote-shoes-by-door", level: 1, contentVariant: "shoes-by-door", sentence: "Leave your shoes by the door.", vocabularyDomain: "clothing-routine" },
  { id: "l1-blockquote-milk-in-fridge", level: 1, contentVariant: "milk-in-fridge", sentence: "The milk is in the fridge.", vocabularyDomain: "kitchen-note" },
  { id: "l1-blockquote-call-when-home", level: 1, contentVariant: "call-when-home", sentence: "Call me when you get home.", vocabularyDomain: "homecoming-message" },
  { id: "l1-blockquote-store-closing", level: 1, contentVariant: "store-closing", sentence: "The store closes at six.", vocabularyDomain: "local-errand" },
  { id: "l1-blockquote-pack-snack", level: 1, contentVariant: "pack-snack", sentence: "Pack a snack for later.", vocabularyDomain: "food-reminder" },
  { id: "l2-blockquote-meeting-time", level: 2, contentVariant: "meeting-time", sentence: "The team meeting starts at nine.", vocabularyDomain: "workplace-schedule" },
  { id: "l2-blockquote-updated-schedule", level: 2, contentVariant: "updated-schedule", sentence: "Please check the updated schedule.", vocabularyDomain: "schedule-update" },
  { id: "l2-blockquote-package-front-desk", level: 2, contentVariant: "package-front-desk", sentence: "Your package is at the front desk.", vocabularyDomain: "office-delivery" },
  { id: "l2-blockquote-save-copy", level: 2, contentVariant: "save-copy", sentence: "Save a copy before you edit.", vocabularyDomain: "computer-routine" },
  { id: "l2-blockquote-side-entrance", level: 2, contentVariant: "side-entrance", sentence: "The side entrance is closed today.", vocabularyDomain: "building-notice" },
  { id: "l2-blockquote-pickup-noon", level: 2, contentVariant: "pickup-noon", sentence: "Pickup begins at noon.", vocabularyDomain: "pickup-schedule" },
  { id: "l2-blockquote-bring-id", level: 2, contentVariant: "bring-id", sentence: "Bring your ID when you check in.", vocabularyDomain: "check-in-reminder" },
  { id: "l2-blockquote-friday-deadline", level: 2, contentVariant: "friday-deadline", sentence: "The deadline moved to Friday.", vocabularyDomain: "workplace-deadline" },
  { id: "l2-blockquote-shared-folder", level: 2, contentVariant: "shared-folder", sentence: "Put updates in the shared folder.", vocabularyDomain: "document-sharing" },
  { id: "l2-blockquote-ask-for-help", level: 2, contentVariant: "ask-for-help", sentence: "Ask for help if you get stuck.", vocabularyDomain: "learning-support" },
  { id: "l2-blockquote-lobby-opening", level: 2, contentVariant: "lobby-opening", sentence: "The lobby opens at eight.", vocabularyDomain: "building-schedule" },
  { id: "l2-blockquote-printer-paper", level: 2, contentVariant: "printer-paper", sentence: "The printer needs more paper.", vocabularyDomain: "office-supplies" },
]

export const blockquoteBatch006Problems: readonly NormalizedProblem[] =
  blockquoteInputs.map(createBlockquoteProblem)
