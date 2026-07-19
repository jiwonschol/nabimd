import type { MatchCheck, NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-20-l1-italic-l2-rebuilds-013"
const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

const italicTeaching = {
  concept: "Italics make a word or short phrase stand out without making it bold.",
  howTo: "Wrap the words with one asterisk or one underscore on each side.",
  example: "*Quiet music*",
} as const

const italicHints = [
  "Italic text has one matching marker on each side.",
  "Type one asterisk, the phrase, then one more asterisk.",
  "Example: `*Quiet music*`",
] as const

const focusedItalicCheck = {
  id: "keep-one-italic-focus",
  kind: "max-inline-count",
  scope: documentScope,
  inline: "emphasis",
  max: 1,
  review: "Keep italics focused on one short phrase in this exercise.",
} as const

type ItalicInput = {
  id: string
  contentVariant: string
  phrase: string
  vocabularyDomain: string
}

function createItalicProblem(input: ItalicInput): NormalizedProblem {
  return {
    id: input.id,
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: "italic-emphasis",
    skillIds: ["italic-emphasis"],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching: italicTeaching,
    syntaxTokens: ["*", "Phrase", "*"],
    title: "Italic emphasis",
    prompt: "Write one short phrase in italics using Markdown.",
    target: `*${input.phrase}*`,
    starterText: "",
    protectedContent: [input.phrase],
    matchChecks: [
      {
        id: "use-italic-emphasis",
        kind: "inline-presence",
        scope: documentScope,
        inline: "emphasis",
        min: 1,
        requireNonemptyContent: true,
        priority: 10,
        feedback: "Make at least one phrase italic with Markdown.",
      },
    ],
    editorialChecks: [focusedItalicCheck],
    hints: italicHints,
    retryFamily: "level-1-italic-emphasis",
    reviewTags: ["focused-italic-emphasis"],
    vocabulary: {
      profile: "everyday",
      domains: [input.vocabularyDomain],
      terms: [input.phrase],
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

const italicInputs: readonly ItalicInput[] = [
  { id: "l1-italic-yellow-kite", contentVariant: "yellow-kite", phrase: "Yellow kite", vocabularyDomain: "outdoor-play" },
  { id: "l1-italic-cold-water", contentVariant: "cold-water", phrase: "Cold water", vocabularyDomain: "drinks" },
  { id: "l1-italic-sunny-window", contentVariant: "sunny-window", phrase: "Sunny window", vocabularyDomain: "home" },
  { id: "l1-italic-paper-boat", contentVariant: "paper-boat", phrase: "Paper boat", vocabularyDomain: "crafts" },
  { id: "l1-italic-orange-socks", contentVariant: "orange-socks", phrase: "Orange socks", vocabularyDomain: "clothes" },
  { id: "l1-italic-little-garden", contentVariant: "little-garden", phrase: "Little garden", vocabularyDomain: "plants" },
  { id: "l1-italic-blue-marble", contentVariant: "blue-marble", phrase: "Blue marble", vocabularyDomain: "toys-and-games" },
  { id: "l1-italic-wooden-spoon", contentVariant: "wooden-spoon", phrase: "Wooden spoon", vocabularyDomain: "kitchen" },
  { id: "l1-italic-soft-pillow", contentVariant: "soft-pillow", phrase: "Soft pillow", vocabularyDomain: "home" },
  { id: "l1-italic-silver-moon", contentVariant: "silver-moon", phrase: "Silver moon", vocabularyDomain: "weather-and-sky" },
  { id: "l1-italic-happy-turtle", contentVariant: "happy-turtle", phrase: "Happy turtle", vocabularyDomain: "animals" },
  { id: "l1-italic-warm-soup", contentVariant: "warm-soup", phrase: "Warm soup", vocabularyDomain: "food" },
]

type RebuildFamily = "quick-note" | "short-process" | "quote-card"

export type RebuildInput = {
  id: string
  family: RebuildFamily
  contentVariant: string
  target: string
  vocabularyDomain: string
  vocabularyTerms: readonly [string, string, string]
}

const rebuildTeaching = {
  "quick-note": {
    concept: "A small practical note can combine a title, an italic sentence, and a bullet list.",
    howTo: "Use one H1, one italic paragraph, then an unordered list with at least two items.",
    example: "# Art box\n\n*Bring a few tools for drawing.*\n\n- Paper\n- Crayons",
  },
  "short-process": {
    concept: "A short process is easier to follow when a title and italic purpose lead into numbered steps.",
    howTo: "Use one H1, one italic paragraph, then an ordered list with at least three steps.",
    example: "# Plant a seed\n\n*Follow these steps in order.*\n\n1. Fill the pot\n2. Add the seed\n3. Water the soil",
  },
  "quote-card": {
    concept: "A quotation card can combine a title, an italic cue, and a message from a named source.",
    howTo: "Use one H1, one italic paragraph, then a quote with text that starts with `>`.",
    example: "# Coach's message\n\n*Remember this before the game.*\n\n> Coach: Bring a water bottle.",
  },
} as const

const rebuildHints = {
  "quick-note": [
    "Start with one # title.",
    "Put one complete sentence in italics below the title.",
    "Finish with at least two bullet items that start with `-`.",
  ],
  "short-process": [
    "Start with one # title.",
    "Put one complete sentence in italics below the title.",
    "Finish with at least three numbered steps.",
  ],
  "quote-card": [
    "Start with one # title.",
    "Put one complete sentence in italics below the title.",
    "Finish with one quoted message that starts with `>`.",
  ],
} as const

function rebuildChecks(input: RebuildInput): readonly MatchCheck[] {
  const shapeCheck: MatchCheck = {
    id: `${input.id}-shape`,
    kind: "block-sequence",
    scope: documentScope,
    exact: true,
    sequence:
      input.family === "quote-card"
        ? [
            { block: "heading", depth: 1 },
            { block: "paragraph" },
            { block: "blockquote" },
          ]
        : [
            { block: "heading", depth: 1 },
            { block: "paragraph" },
            { block: "list" },
          ],
    priority: 10,
    feedback: "Rebuild the three-block shape shown in the Goal: title, italic note, then the final block.",
  }
  const italicCheck: MatchCheck = {
    id: `${input.id}-italic`,
    kind: "inline-presence",
    scope: { kind: "block", block: "paragraph", occurrence: 0 },
    inline: "emphasis",
    min: 1,
    requireNonemptyContent: true,
    priority: 20,
    feedback: "Make the middle note italic with Markdown.",
  }

  if (input.family === "quote-card") {
    return [
      shapeCheck,
      italicCheck,
      {
        id: `${input.id}-quote`,
        kind: "blockquote-shape",
        scope: documentScope,
        requireNonemptyContent: true,
        priority: 30,
        feedback: "Finish with a Markdown quote that contains text.",
      },
    ]
  }

  return [
    shapeCheck,
    italicCheck,
    {
      id: `${input.id}-list`,
      kind: "list-shape",
      scope: documentScope,
      ordered: input.family === "short-process",
      minItems: input.family === "short-process" ? 3 : 2,
      requireNonemptyItems: true,
      priority: 30,
      feedback:
        input.family === "short-process"
          ? "Finish with an ordered list of at least three steps."
          : "Finish with an unordered list of at least two items.",
    },
  ]
}

function createRebuildProblem(input: RebuildInput): NormalizedProblem {
  const finalSkill =
    input.family === "quick-note"
      ? "unordered-list"
      : input.family === "short-process"
        ? "ordered-list"
        : "blockquote"
  const finalToken =
    input.family === "quick-note"
      ? "-"
      : input.family === "short-process"
        ? "1."
        : ">"

  return {
    id: input.id,
    schemaVersion: 2,
    level: 2,
    flavor: "standard",
    familyId: "rebuild-real-documents",
    skillIds: ["heading-h1", "italic-emphasis", finalSkill],
    difficulty: "mixed",
    teachingMode: "recall",
    teaching: rebuildTeaching[input.family],
    syntaxTokens: ["#", "*", finalToken],
    title:
      input.family === "quick-note"
        ? "Rebuild a quick note"
        : input.family === "short-process"
          ? "Rebuild a short process"
          : "Rebuild a reminder card",
    prompt: "Rebuild the rendered document as Markdown. Your wording may differ, but keep the same Markdown shape.",
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: rebuildChecks(input),
    editorialChecks: [focusedItalicCheck],
    hints: rebuildHints[input.family],
    retryFamily: `level-2-rebuild-${input.family}`,
    reviewTags: ["composite-level-2", "focused-italic-emphasis", input.family],
    vocabulary: {
      profile: "everyday-recall",
      domains: [input.vocabularyDomain],
      terms: input.vocabularyTerms,
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const rebuildInputs: readonly RebuildInput[] = [
  {
    id: "l2-rebuild-picnic-bag",
    family: "quick-note",
    contentVariant: "picnic-bag",
    target: `# Picnic bag

*Pack light for the park.*

- Water
- Apples`,
    vocabularyDomain: "simple-outing",
    vocabularyTerms: ["picnic", "park", "apples"],
  },
  {
    id: "l2-rebuild-rainy-day",
    family: "quick-note",
    contentVariant: "rainy-day-preparation-note",
    target: `# Rainy day

*Keep these by the door.*

- Umbrella
- Boots`,
    vocabularyDomain: "weather-preparation",
    vocabularyTerms: ["rainy day", "umbrella", "boots"],
  },
  {
    id: "l2-rebuild-school-backpack",
    family: "quick-note",
    contentVariant: "school-backpack",
    target: `# School backpack

*Bring the tools for class.*

- Notebook
- Pencil`,
    vocabularyDomain: "study-preparation",
    vocabularyTerms: ["school backpack", "notebook", "pencil"],
  },
  {
    id: "l2-rebuild-cat-supplies",
    family: "quick-note",
    contentVariant: "cat-supplies",
    target: `# Cat supplies

*Check these before dinner.*

- Fresh water
- Dry food`,
    vocabularyDomain: "home-care",
    vocabularyTerms: ["cat supplies", "water", "food"],
  },
  {
    id: "l2-rebuild-morning-routine",
    family: "short-process",
    contentVariant: "morning-routine",
    target: `# Morning routine

*Finish these steps before leaving.*

1. Open the curtains
2. Pack lunch
3. Lock the door`,
    vocabularyDomain: "daily-routine",
    vocabularyTerms: ["morning", "lunch", "door"],
  },
  {
    id: "l2-rebuild-library-visit",
    family: "short-process",
    contentVariant: "library-visit",
    target: `# Library visit

*Get ready before you leave.*

1. Find the book list
2. Pack the library card
3. Check the library hours`,
    vocabularyDomain: "library-routine",
    vocabularyTerms: ["library", "book list", "library hours"],
  },
  {
    id: "l2-rebuild-homework-plan",
    family: "short-process",
    contentVariant: "homework-plan",
    target: `# Homework plan

*Work through one task at a time.*

1. Read the page
2. Answer the questions
3. Check the work`,
    vocabularyDomain: "study-routine",
    vocabularyTerms: ["homework", "questions", "work"],
  },
  {
    id: "l2-rebuild-kitchen-cleanup",
    family: "short-process",
    contentVariant: "kitchen-cleaning-steps",
    target: `# Kitchen cleanup

*Clean one area at a time.*

1. Wash the cups
2. Wipe the table
3. Sweep the floor`,
    vocabularyDomain: "home-routine",
    vocabularyTerms: ["kitchen", "table", "floor"],
  },
  {
    id: "l2-rebuild-reading-reminder",
    family: "quote-card",
    contentVariant: "reading-reminder",
    target: `# Reading reminder

*Remember the return date.*

> Librarian: Return the book by Friday.`,
    vocabularyDomain: "reading-routine",
    vocabularyTerms: ["reading", "librarian", "book"],
  },
  {
    id: "l2-rebuild-garden-reminder",
    family: "quote-card",
    contentVariant: "garden-reminder",
    target: `# Garden reminder

*Check the soil before watering.*

> Garden note: Move the small pot into the shade.`,
    vocabularyDomain: "plant-care",
    vocabularyTerms: ["garden", "soil", "shade"],
  },
  {
    id: "l2-rebuild-travel-reminder",
    family: "quote-card",
    contentVariant: "travel-reminder",
    target: `# Travel reminder

*Read this before the train arrives.*

> Station message: Keep your ticket ready.`,
    vocabularyDomain: "local-travel",
    vocabularyTerms: ["travel", "station", "ticket"],
  },
  {
    id: "l2-rebuild-baking-reminder",
    family: "quote-card",
    contentVariant: "baking-reminder",
    target: `# Baking reminder

*Prepare the pan before mixing.*

> Recipe note: Let the bread cool before slicing.`,
    vocabularyDomain: "cooking-routine",
    vocabularyTerms: ["baking", "bread", "pan"],
  },
]

export const italicRebuildBatch013Problems: readonly NormalizedProblem[] = [
  ...italicInputs.map(createItalicProblem),
  ...rebuildInputs.map(createRebuildProblem),
]
