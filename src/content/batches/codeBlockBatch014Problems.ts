import type { MatchCheck, NormalizedProblem } from "../types"

export const codeBlockBatch014Id =
  "2026-07-20-l1-code-block-l2-rebuilds-014"
const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

const fenceTeaching = {
  concept: "A code block keeps a whole line in a separate copy-ready block.",
  howTo: "Put three backticks on a line before the text and three matching backticks on a line after it.",
  example: "```\nKeep dry\n```",
} as const

const fenceHints = [
  "Start with a line of three backticks.",
  "Type a short line inside the block.",
  "Finish with another line of three backticks.",
] as const

const focusedCodeBlock = {
  id: "keep-one-code-block",
  kind: "max-block-count",
  scope: documentScope,
  block: "code",
  recursive: true,
  max: 1,
  review: "Keep one focused code block in this short document.",
} as const

const codeBlockCheck = (id: string, priority = 10): MatchCheck => ({
  id,
  kind: "code-block",
  scope: documentScope,
  min: 1,
  requireFenced: true,
  requireClosedFence: true,
  requireNonemptyContent: true,
  priority,
  feedback: "Put text between matching lines of three backticks.",
})

type CodeBlockInput = {
  id: string
  contentVariant: string
  line: string
  vocabularyDomain: string
}

function createCodeBlockProblem(input: CodeBlockInput): NormalizedProblem {
  return {
    id: input.id,
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: "fenced-code-blocks",
    skillIds: ["code-block"],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching: fenceTeaching,
    syntaxTokens: ["```", "Text", "```"],
    title: "Code block",
    prompt: "Write one short line inside a code block.",
    target: `\`\`\`\n${input.line}\n\`\`\``,
    starterText: "",
    protectedContent: [input.line],
    matchChecks: [codeBlockCheck("use-closed-code-block")],
    editorialChecks: [focusedCodeBlock],
    hints: fenceHints,
    retryFamily: "level-1-fenced-code-block",
    reviewTags: ["closed-fence", "nonempty-code-block"],
    vocabulary: {
      profile: "everyday",
      domains: [input.vocabularyDomain],
      terms: [input.line],
    },
    sourceBatchId: codeBlockBatch014Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

const codeBlockInputs: readonly CodeBlockInput[] = [
  { id: "l1-code-block-door-sign", contentVariant: "fenced-door-sign-copy", line: "Back soon", vocabularyDomain: "home-message" },
  { id: "l1-code-block-picnic-label", contentVariant: "fenced-picnic-label-copy", line: "Water and apples", vocabularyDomain: "outdoor-food" },
  { id: "l1-code-block-laundry-note", contentVariant: "fenced-laundry-note-copy", line: "Wash in cold water", vocabularyDomain: "home-care" },
  { id: "l1-code-block-bus-stop", contentVariant: "fenced-bus-stop-copy", line: "Meet at Oak Street", vocabularyDomain: "local-travel" },
  { id: "l1-code-block-phone-reminder", contentVariant: "fenced-phone-reminder-copy", line: "Call after lunch", vocabularyDomain: "daily-message" },
  { id: "l1-code-block-pet-note", contentVariant: "fenced-pet-note-copy", line: "Fresh water at noon", vocabularyDomain: "pet-care" },
  { id: "l1-code-block-book-label", contentVariant: "fenced-book-label-copy", line: "Return on Tuesday", vocabularyDomain: "reading" },
  { id: "l1-code-block-garden-tag", contentVariant: "fenced-garden-tag-copy", line: "Water every morning", vocabularyDomain: "plant-care" },
  { id: "l1-code-block-shoe-box", contentVariant: "fenced-shoe-box-copy", line: "Rain boots", vocabularyDomain: "clothes" },
  { id: "l1-code-block-snack-label", contentVariant: "fenced-snack-label-copy", line: "Nuts and raisins", vocabularyDomain: "food" },
  { id: "l1-code-block-music-note", contentVariant: "fenced-music-note-copy", line: "Play track three", vocabularyDomain: "music" },
  { id: "l1-code-block-weather-message", contentVariant: "fenced-weather-message-copy", line: "Bring a light jacket", vocabularyDomain: "weather" },
]

export type CodeBlockRebuildFamily =
  | "sample-note"
  | "quick-reference"
  | "numbered-routine"

export type CodeBlockRebuildInput = {
  id: string
  family: CodeBlockRebuildFamily
  contentVariant: string
  target: string
  vocabularyDomain: string
  vocabularyTerms: readonly [string, string, string]
}

const rebuildTeaching = {
  "sample-note": {
    concept: "A copy-ready note can combine a title, a short quoted cue, and a code block.",
    howTo: "Rebuild one H1, one blockquote, then put text between matching lines of three backticks.",
    example: "# Door sign\n\n> Copy this message.\n\n```\nBack soon\n```",
  },
  "quick-reference": {
    concept: "A quick reference can put a copy-ready value before a short bullet list.",
    howTo: "Rebuild one H1, one code block between matching backtick lines, then an unordered list with at least two items.",
    example: "# Library card\n\n```\nShelf B\n```\n\n- Second floor\n- Near the window",
  },
  "numbered-routine": {
    concept: "A routine can put a copy-ready value before a short numbered list.",
    howTo: "Rebuild one H1, one code block between matching backtick lines, then an ordered list with at least three steps.",
    example: "# Tea timer\n\n```\n4 minutes\n```\n\n1. Boil water\n2. Set the timer\n3. Pour the tea",
  },
} as const

const rebuildHints = {
  "sample-note": [
    "Start with one # title and one quoted cue that starts with >.",
    "Open a code block with three backticks on their own line.",
    "Put text inside, then close with three matching backticks.",
  ],
  "quick-reference": [
    "Start with one # title.",
    "Put text between matching lines of three backticks below it.",
    "Finish with at least two bullet items that start with -.",
  ],
  "numbered-routine": [
    "Start with one # title.",
    "Put text between matching lines of three backticks below it.",
    "Finish with at least three numbered steps.",
  ],
} as const

function rebuildChecks(input: CodeBlockRebuildInput): readonly MatchCheck[] {
  const shape: MatchCheck = {
    id: `${input.id}-shape`,
    kind: "block-sequence",
    scope: documentScope,
    exact: true,
    sequence:
      input.family === "sample-note"
        ? [
            { block: "heading", depth: 1 },
            { block: "blockquote" },
            { block: "code" },
          ]
        : [
            { block: "heading", depth: 1 },
            { block: "code" },
            { block: "list" },
          ],
    priority: 10,
    feedback: "Rebuild the three-block shape shown in the Goal.",
  }
  const checks: MatchCheck[] = [
    shape,
    codeBlockCheck(`${input.id}-code`, 20),
  ]
  if (input.family === "sample-note") {
    checks.push({
      id: `${input.id}-quote`,
      kind: "blockquote-shape",
      scope: documentScope,
      requireNonemptyContent: true,
      priority: 30,
      feedback: "Put a short message after the > quote marker.",
    })
  } else {
    checks.push({
      id: `${input.id}-list`,
      kind: "list-shape",
      scope: documentScope,
      ordered: input.family === "numbered-routine",
      minItems: input.family === "numbered-routine" ? 3 : 2,
      requireNonemptyItems: true,
      priority: 30,
      feedback:
        input.family === "numbered-routine"
          ? "Finish with an ordered list of at least three steps."
          : "Finish with an unordered list of at least two items.",
    })
  }
  return checks
}

function createRebuildProblem(input: CodeBlockRebuildInput): NormalizedProblem {
  const listSkill =
    input.family === "quick-reference"
      ? ["unordered-list"]
      : input.family === "numbered-routine"
        ? ["ordered-list"]
        : ["blockquote"]
  return {
    id: input.id,
    schemaVersion: 2,
    level: 2,
    flavor: "standard",
    familyId: "rebuild-code-block-documents",
    skillIds: ["heading-h1", "code-block", ...listSkill],
    difficulty: "mixed",
    teachingMode: "recall",
    teaching: rebuildTeaching[input.family],
    syntaxTokens: [
      "#",
      "```",
      ...(input.family === "quick-reference"
        ? ["-"]
        : input.family === "numbered-routine"
          ? ["1."]
          : [">"]),
    ],
    title:
      input.family === "sample-note"
        ? "Rebuild a copy-ready note"
        : input.family === "quick-reference"
          ? "Rebuild a quick reference"
          : "Rebuild a numbered routine",
    prompt: "Rebuild the rendered document as Markdown. Your wording may differ, but keep the same Markdown shape.",
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: rebuildChecks(input),
    editorialChecks: [focusedCodeBlock],
    hints: rebuildHints[input.family],
    retryFamily: `level-2-code-block-${input.family}`,
    reviewTags: ["composite-level-2", "closed-fence", input.family],
    vocabulary: {
      profile: "everyday-recall",
      domains: [input.vocabularyDomain],
      terms: input.vocabularyTerms,
    },
    sourceBatchId: codeBlockBatch014Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const codeBlockRebuildInputs: readonly CodeBlockRebuildInput[] = [
  {
    id: "l2-code-block-door-copy",
    family: "sample-note",
    contentVariant: "copy-ready-door-message",
    target: "# Door message\n\n> Copy this note for the front door.\n\n```\nPlease knock\n```",
    vocabularyDomain: "home-message",
    vocabularyTerms: ["door", "note", "knock"],
  },
  {
    id: "l2-code-block-library-copy",
    family: "sample-note",
    contentVariant: "copy-ready-library-message",
    target: "# Library message\n\n> Copy this note for the book cart.\n\n```\nReturns go here\n```",
    vocabularyDomain: "library-message",
    vocabularyTerms: ["library", "book cart", "returns"],
  },
  {
    id: "l2-code-block-lunch-copy",
    family: "sample-note",
    contentVariant: "copy-ready-lunch-message",
    target: "# Lunch label\n\n> Copy this note for the lunch bag.\n\n```\nKeep cold\n```",
    vocabularyDomain: "food-message",
    vocabularyTerms: ["lunch", "bag", "cold"],
  },
  {
    id: "l2-code-block-guest-copy",
    family: "sample-note",
    contentVariant: "copy-ready-guest-message",
    target: "# Guest message\n\n> Copy this note for the spare room.\n\n```\nTowels are in the closet\n```",
    vocabularyDomain: "guest-message",
    vocabularyTerms: ["guest", "towels", "closet"],
  },
  {
    id: "l2-code-block-contact-reference",
    family: "quick-reference",
    contentVariant: "fenced-contact-quick-reference",
    target: "# Emergency contact\n\n```\nJordan: 555-0102\n```\n\n- Call first\n- Leave a message",
    vocabularyDomain: "contact-reference",
    vocabularyTerms: ["contact", "call", "message"],
  },
  {
    id: "l2-code-block-grocery-reference",
    family: "quick-reference",
    contentVariant: "fenced-grocery-quick-reference",
    target: "# Grocery pickup\n\n```\nOrder A17\n```\n\n- Bring a bag\n- Check the receipt",
    vocabularyDomain: "shopping-reference",
    vocabularyTerms: ["grocery", "bag", "receipt"],
  },
  {
    id: "l2-code-block-bus-reference",
    family: "quick-reference",
    contentVariant: "fenced-bus-quick-reference",
    target: "# Bus card\n\n```\nRoute 8\n```\n\n- North stop\n- Main Street",
    vocabularyDomain: "travel-reference",
    vocabularyTerms: ["bus", "route", "street"],
  },
  {
    id: "l2-code-block-pet-reference",
    family: "quick-reference",
    contentVariant: "fenced-pet-quick-reference",
    target: "# Pet care card\n\n```\nFood: one cup\n```\n\n- Fill the water bowl\n- Close the gate",
    vocabularyDomain: "pet-reference",
    vocabularyTerms: ["pet", "water bowl", "gate"],
  },
  {
    id: "l2-code-block-alarm-routine",
    family: "numbered-routine",
    contentVariant: "fenced-alarm-numbered-routine",
    target: "# Morning alarm\n\n```\n7:00 AM\n```\n\n1. Get up\n2. Open the curtains\n3. Make breakfast",
    vocabularyDomain: "morning-routine",
    vocabularyTerms: ["alarm", "curtains", "breakfast"],
  },
  {
    id: "l2-code-block-package-routine",
    family: "numbered-routine",
    contentVariant: "fenced-package-numbered-routine",
    target: "# Package pickup\n\n```\nLocker 14\n```\n\n1. Bring the key\n2. Open the locker\n3. Take the box",
    vocabularyDomain: "pickup-routine",
    vocabularyTerms: ["package", "locker", "box"],
  },
  {
    id: "l2-code-block-movie-routine",
    family: "numbered-routine",
    contentVariant: "fenced-movie-numbered-routine",
    target: "# Movie setup\n\n```\nInput: HDMI 1\n```\n\n1. Turn on the screen\n2. Choose the input\n3. Start the movie",
    vocabularyDomain: "movie-routine",
    vocabularyTerms: ["movie", "screen", "input"],
  },
  {
    id: "l2-code-block-plant-routine",
    family: "numbered-routine",
    contentVariant: "fenced-plant-numbered-routine",
    target: "# Plant timer\n\n```\nEvery three days\n```\n\n1. Check the soil\n2. Add water\n3. Empty the tray",
    vocabularyDomain: "plant-routine",
    vocabularyTerms: ["plant", "soil", "tray"],
  },
]

export const codeBlockBatch014Problems: readonly NormalizedProblem[] = [
  ...codeBlockInputs.map(createCodeBlockProblem),
  ...codeBlockRebuildInputs.map(createRebuildProblem),
]
