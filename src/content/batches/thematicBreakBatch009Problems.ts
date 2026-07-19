import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-thematic-breaks-009"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "A Markdown divider separates two parts of a note.",
  howTo: "Leave a blank line, type three hyphens on their own line, then leave another blank line.",
  example: "Tea is ready.\n\n---\n\nThe cookies are warm.",
} as const

const hints = [
  "Put the divider between the two parts of the note.",
  "Leave a blank line, then type three hyphens on their own line.",
  "Example: `First part.\\n\\n---\\n\\nSecond part.`",
] as const

const focusedDividerCheck = {
  id: "keep-one-divider",
  kind: "max-block-count",
  scope: { kind: "document" },
  block: "thematic-break",
  recursive: true,
  max: 1,
  review: "One divider is enough for this short note.",
} as const

type ThematicBreakInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  before: string
  after: string
  alternateBefore: string
  alternateAfter: string
  vocabularyDomain: string
}

function createThematicBreakProblem({
  id,
  level,
  contentVariant,
  before,
  after,
  vocabularyDomain,
}: ThematicBreakInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "horizontal-rules",
    skillIds: ["thematic-break"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["Blank line", "---", "Blank line"],
    title: level === 1 ? "Markdown divider" : "Markdown divider recall",
    prompt:
      level === 1
        ? "Add one Markdown divider between the two parts."
        : "From memory, add one Markdown divider between the two parts.",
    target: `${before}\n\n---\n\n${after}`,
    starterText: "",
    protectedContent: [before, after],
    matchChecks: [
      {
        id: "use-divider",
        kind: "block-count",
        scope: { kind: "document" },
        block: "thematic-break",
        min: 1,
        recursive: true,
        priority: 10,
        feedback: "Add a Markdown divider between the two text blocks.",
      },
    ],
    editorialChecks: [focusedDividerCheck],
    hints,
    retryFamily:
      level === 1 ? "level-1-thematic-break" : "level-2-thematic-break-recall",
    reviewTags: ["one-focused-divider"],
    vocabulary: {
      profile: level === 1 ? "everyday" : "everyday-recall",
      domains: [vocabularyDomain],
      terms: [before, after],
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant,
  }
}

export const thematicBreakBatch009Inputs: readonly ThematicBreakInput[] = [
  { id: "l1-thematic-break-breakfast-dessert", level: 1, contentVariant: "breakfast-dessert", before: "Breakfast is ready.", after: "Save dessert for later.", alternateBefore: "Toast is warm.", alternateAfter: "Fruit is cold.", vocabularyDomain: "food-and-home" },
  { id: "l1-thematic-break-sunny-day-indoor-game", level: 1, contentVariant: "sunny-day-indoor-game", before: "The sun is out.", after: "The board game is inside.", alternateBefore: "The yard is dry.", alternateAfter: "The cards are on the table.", vocabularyDomain: "weather-and-play" },
  { id: "l1-thematic-break-groceries-dinner", level: 1, contentVariant: "groceries-dinner", before: "Buy rice and apples.", after: "Cook soup tonight.", alternateBefore: "Pick up bread.", alternateAfter: "Make salad later.", vocabularyDomain: "errands-and-meals" },
  { id: "l1-thematic-break-story-drawing", level: 1, contentVariant: "story-drawing", before: "Read one story.", after: "Draw your favorite part.", alternateBefore: "Open the short book.", alternateAfter: "Color one scene.", vocabularyDomain: "learning-and-art" },
  { id: "l1-thematic-break-clean-desk-free-time", level: 1, contentVariant: "clean-desk-free-time", before: "Clear the small desk.", after: "Play music after.", alternateBefore: "Put away the pencils.", alternateAfter: "Listen to a song.", vocabularyDomain: "home-and-leisure" },
  { id: "l1-thematic-break-bus-walk-home", level: 1, contentVariant: "bus-walk-home", before: "Take the bus downtown.", after: "Walk home by the park.", alternateBefore: "Ride the train north.", alternateAfter: "Walk back by the river.", vocabularyDomain: "local-travel" },
  { id: "l1-thematic-break-fern-cat", level: 1, contentVariant: "fern-cat", before: "Water the fern.", after: "Fill the cat's bowl.", alternateBefore: "Turn the pot toward the window.", alternateAfter: "Brush the dog later.", vocabularyDomain: "home-care" },
  { id: "l1-thematic-break-morning-music-bedtime", level: 1, contentVariant: "morning-music-bedtime", before: "Play morning music.", after: "Keep bedtime quiet.", alternateBefore: "Open the curtains early.", alternateAfter: "Dim the lights at night.", vocabularyDomain: "daily-routine" },
  { id: "l1-thematic-break-pack-lunch-wash-box", level: 1, contentVariant: "pack-lunch-wash-box", before: "Pack a cheese sandwich.", after: "Wash the lunch box.", alternateBefore: "Add an orange to the bag.", alternateAfter: "Rinse the bottle later.", vocabularyDomain: "food-routine" },
  { id: "l1-thematic-break-sweater-rain-coat", level: 1, contentVariant: "sweater-rain-coat", before: "Wear the blue sweater.", after: "Bring the raincoat.", alternateBefore: "Wear the warm socks.", alternateAfter: "Pack the small umbrella.", vocabularyDomain: "clothes-and-weather" },
  { id: "l1-thematic-break-puzzle-word-game", level: 1, contentVariant: "puzzle-word-game", before: "Finish the first puzzle.", after: "Try the word game next.", alternateBefore: "Complete the maze.", alternateAfter: "Start the matching game.", vocabularyDomain: "games-and-learning" },
  { id: "l1-thematic-break-park-movie", level: 1, contentVariant: "park-movie", before: "Visit the park at noon.", after: "Watch a movie tonight.", alternateBefore: "Meet at the pool at one.", alternateAfter: "Read a comic tonight.", vocabularyDomain: "leisure-plans" },
  { id: "l2-thematic-break-meeting-action-items", level: 2, contentVariant: "meeting-action-items", before: "The meeting starts at ten.", after: "Send action items after lunch.", alternateBefore: "The call begins at nine.", alternateAfter: "Share the notes by noon.", vocabularyDomain: "meetings" },
  { id: "l2-thematic-break-customer-delivery-reply", level: 2, contentVariant: "customer-delivery-reply", before: "The customer asked about delivery.", after: "Reply with the new date.", alternateBefore: "A guest asked about parking.", alternateAfter: "Answer with the map link.", vocabularyDomain: "customer-service" },
  { id: "l2-thematic-break-draft-review", level: 2, contentVariant: "draft-review", before: "The draft is complete.", after: "Review the last page next.", alternateBefore: "The outline is ready.", alternateAfter: "Check the final section.", vocabularyDomain: "document-review" },
  { id: "l2-thematic-break-fractions-practice", level: 2, contentVariant: "fractions-practice", before: "Today's notes cover fractions.", after: "Practice three problems.", alternateBefore: "Today's class covers maps.", alternateAfter: "Label two regions.", vocabularyDomain: "study-routine" },
  { id: "l2-thematic-break-morning-closing-shift", level: 2, contentVariant: "morning-closing-shift", before: "The morning shift stocked the shelves.", after: "The closing shift checks the doors.", alternateBefore: "The early shift filled the cooler.", alternateAfter: "The late shift counts the keys.", vocabularyDomain: "shift-handoff" },
  { id: "l2-thematic-break-weekly-sign-copies", level: 2, contentVariant: "weekly-sign-copies", before: "This week we finished the sign.", after: "Next week we print copies.", alternateBefore: "This week we chose the colors.", alternateAfter: "Next week we hang the poster.", vocabularyDomain: "weekly-update" },
  { id: "l2-thematic-break-outdoor-event-rain-plan", level: 2, contentVariant: "outdoor-event-rain-plan", before: "The outdoor table is reserved.", after: "Use the lobby if it rains.", alternateBefore: "The patio seats are ready.", alternateAfter: "Move inside during a storm.", vocabularyDomain: "event-planning" },
  { id: "l2-thematic-break-order-pickup", level: 2, contentVariant: "order-pickup", before: "The order is ready at the front desk.", after: "Bring the receipt for pickup.", alternateBefore: "The package is ready in the lobby.", alternateAfter: "Show the ticket at pickup.", vocabularyDomain: "orders-and-pickup" },
  { id: "l2-thematic-break-team-idea-manager-decision", level: 2, contentVariant: "team-idea-manager-decision", before: "The team suggested a shorter form.", after: "The manager approved the change.", alternateBefore: "The group proposed a larger label.", alternateAfter: "The lead accepted the update.", vocabularyDomain: "team-decisions" },
  { id: "l2-thematic-break-training-quiz", level: 2, contentVariant: "training-quiz", before: "The training video takes five minutes.", after: "Answer the quick quiz after.", alternateBefore: "The lesson takes ten minutes.", alternateAfter: "Complete the short check next.", vocabularyDomain: "workplace-learning" },
  { id: "l2-thematic-break-travel-request-approval", level: 2, contentVariant: "travel-request-approval", before: "The travel request lists two nights.", after: "Approval details are in the email.", alternateBefore: "The visit request lists one day.", alternateAfter: "The answer is in the message.", vocabularyDomain: "travel-administration" },
  { id: "l2-thematic-break-file-changes-test", level: 2, contentVariant: "file-changes-test", before: "The file changes are saved.", after: "The final test passed.", alternateBefore: "The page update is saved.", alternateAfter: "The quick check passed.", vocabularyDomain: "beginner-coding-workflow" },
] as const

export const thematicBreakBatch009Problems: readonly NormalizedProblem[] =
  thematicBreakBatch009Inputs.map(createThematicBreakProblem)
