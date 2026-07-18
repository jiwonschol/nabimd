import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-emphasis-003"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "Bold emphasis makes one phrase stand out.",
  howTo: "Wrap the phrase with two asterisks on each side.",
  example: "**Good news**",
} as const

const hints = [
  "Bold text has a matching marker on both sides.",
  "Type two asterisks, the phrase, then two more asterisks.",
  "Example: `**Good news**`",
] as const

const focusedBoldCheck = {
  id: "keep-bold-focused",
  kind: "max-inline-count",
  scope: { kind: "document" },
  inline: "strong",
  max: 1,
  review: "Keep bold focused on one important phrase in this short note.",
} as const

type EmphasisInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  phrase: string
  vocabularyDomain: string
}

function createEmphasisProblem({
  id,
  level,
  contentVariant,
  phrase,
  vocabularyDomain,
}: EmphasisInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "emphasis",
    skillIds: ["bold-emphasis"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["**", "Phrase", "**"],
    title: level === 1 ? "Bold emphasis" : "Bold emphasis recall",
    prompt:
      level === 1
        ? "Write one short phrase in bold Markdown."
        : "From memory, write one short phrase in bold Markdown.",
    target: `**${phrase}**`,
    starterText: "",
    protectedContent: [phrase],
    matchChecks: [
      {
        id: "use-bold-emphasis",
        kind: "inline-presence",
        scope: { kind: "document" },
        inline: "strong",
        min: 1,
        priority: 10,
        feedback: "Make at least one phrase bold with Markdown.",
      },
    ],
    editorialChecks: [focusedBoldCheck],
    hints,
    retryFamily:
      level === 1
        ? "level-1-bold-emphasis"
        : "level-2-bold-emphasis-recall",
    reviewTags: ["focused-bold-emphasis"],
    vocabulary: {
      profile: level === 1 ? "everyday" : "everyday-recall",
      domains: [vocabularyDomain],
      terms: [phrase],
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant,
  }
}

const emphasisInputs: readonly EmphasisInput[] = [
  { id: "l1-emphasis-important-note", level: 1, contentVariant: "important-note", phrase: "Important note", vocabularyDomain: "information" },
  { id: "l1-emphasis-safety-first", level: 1, contentVariant: "safety-first", phrase: "Safety first", vocabularyDomain: "safety" },
  { id: "l1-emphasis-new-arrival", level: 1, contentVariant: "new-arrival", phrase: "New arrival", vocabularyDomain: "shopping" },
  { id: "l1-emphasis-required-reading", level: 1, contentVariant: "required-reading", phrase: "Required reading", vocabularyDomain: "school" },
  { id: "l1-emphasis-main-idea", level: 1, contentVariant: "main-idea", phrase: "Main idea", vocabularyDomain: "reading" },
  { id: "l1-emphasis-next-step", level: 1, contentVariant: "next-step", phrase: "Next step", vocabularyDomain: "instructions" },
  { id: "l1-emphasis-quiet-hours", level: 1, contentVariant: "quiet-hours", phrase: "Quiet hours", vocabularyDomain: "home" },
  { id: "l1-emphasis-weather-alert", level: 1, contentVariant: "weather-alert", phrase: "Weather alert", vocabularyDomain: "weather" },
  { id: "l1-emphasis-favorite-book", level: 1, contentVariant: "favorite-book", phrase: "Favorite book", vocabularyDomain: "reading" },
  { id: "l1-emphasis-fresh-fruit", level: 1, contentVariant: "fresh-fruit", phrase: "Fresh fruit", vocabularyDomain: "food" },
  { id: "l1-emphasis-lost-keys", level: 1, contentVariant: "lost-keys", phrase: "Lost keys", vocabularyDomain: "home" },
  { id: "l1-emphasis-family-game", level: 1, contentVariant: "family-game", phrase: "Family game", vocabularyDomain: "family" },
  { id: "l2-emphasis-save-your-work", level: 2, contentVariant: "save-your-work", phrase: "Save your work", vocabularyDomain: "computer-routine" },
  { id: "l2-emphasis-check-the-address", level: 2, contentVariant: "check-the-address", phrase: "Check the address", vocabularyDomain: "daily-routine" },
  { id: "l2-emphasis-bring-an-umbrella", level: 2, contentVariant: "bring-an-umbrella", phrase: "Bring an umbrella", vocabularyDomain: "weather-routine" },
  { id: "l2-emphasis-charge-your-phone", level: 2, contentVariant: "charge-your-phone", phrase: "Charge your phone", vocabularyDomain: "technology-routine" },
  { id: "l2-emphasis-lock-the-door", level: 2, contentVariant: "lock-the-door", phrase: "Lock the door", vocabularyDomain: "home-routine" },
  { id: "l2-emphasis-wash-your-hands", level: 2, contentVariant: "wash-your-hands", phrase: "Wash your hands", vocabularyDomain: "health-routine" },
  { id: "l2-emphasis-call-a-friend", level: 2, contentVariant: "call-a-friend", phrase: "Call a friend", vocabularyDomain: "communication-routine" },
  { id: "l2-emphasis-set-an-alarm", level: 2, contentVariant: "set-an-alarm", phrase: "Set an alarm", vocabularyDomain: "daily-routine" },
  { id: "l2-emphasis-take-a-break", level: 2, contentVariant: "take-a-break", phrase: "Take a break", vocabularyDomain: "wellbeing-routine" },
  { id: "l2-emphasis-clean-your-desk", level: 2, contentVariant: "clean-your-desk", phrase: "Clean your desk", vocabularyDomain: "workspace-routine" },
  { id: "l2-emphasis-review-your-notes", level: 2, contentVariant: "review-your-notes", phrase: "Review your notes", vocabularyDomain: "study-routine" },
  { id: "l2-emphasis-turn-off-the-lights", level: 2, contentVariant: "turn-off-the-lights", phrase: "Turn off the lights", vocabularyDomain: "home-routine" },
]

export const emphasisBatch003Problems: readonly NormalizedProblem[] =
  emphasisInputs.map(createEmphasisProblem)
