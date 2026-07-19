import type { BlockSelector, MatchCheck, NormalizedProblem } from "../types"

export const nestedListBatch016Id =
  "2026-07-20-l2-nested-list-documents-016"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

export type NestedListFamily = "checklist" | "outline" | "steps"

export type NestedListBatch016Input = {
  id: string
  family: NestedListFamily
  contentVariant: string
  target: string
  teachingExample: string
  domain: string
  terms: readonly [string, string, string]
}

export const nestedListBatch016Inputs: readonly NestedListBatch016Input[] = [
  {
    id: "l2-nested-checklist-picnic-bag",
    family: "checklist",
    contentVariant: "nested-picnic-bag-checklist",
    target: "# Picnic bag\n\nPack lunch before leaving for the park.\n\n- Cold items\n  - Apple slices\n  - Cheese cubes\n- Dry snacks\n- Napkins",
    teachingExample: "# Beach tote\n\nGather everything before the drive.\n\n- Sun gear\n  - Hat\n  - Sunscreen\n- Water bottle",
    domain: "picnic-planning",
    terms: ["picnic", "snacks", "napkins"],
  },
  {
    id: "l2-nested-checklist-school-supplies",
    family: "checklist",
    contentVariant: "nested-school-supplies-checklist",
    target: "# School supplies\n\nCheck the backpack before the first bell.\n\n- Writing tools\n  - Blue pen\n  - Pencil\n- Notebook\n- Lunch card",
    teachingExample: "# Library visit\n\nPrepare the bag before walking over.\n\n- Return pile\n  - Mystery book\n  - Nature book\n- Library card",
    domain: "school-routine",
    terms: ["school", "backpack", "notebook"],
  },
  {
    id: "l2-nested-checklist-closet-shelf",
    family: "checklist",
    contentVariant: "nested-closet-shelf-checklist",
    target: "# Closet shelf\n\nSort the clean clothes by where they belong.\n\n- Top shelf\n  - Sweaters\n  - Scarves\n- Middle shelf\n- Shoe bin",
    teachingExample: "# Hall cabinet\n\nPut each item back in its usual place.\n\n- Upper basket\n  - Gloves\n  - Knit hats\n- Lower basket",
    domain: "closet-organization",
    terms: ["closet", "sweaters", "shoes"],
  },
  {
    id: "l2-nested-checklist-grocery-basket",
    family: "checklist",
    contentVariant: "nested-grocery-basket-checklist",
    target: "# Grocery basket\n\nPick up a few basics for dinner.\n\n- Produce\n  - Tomatoes\n  - Spinach\n- Pasta\n- Olive oil",
    teachingExample: "# Breakfast shop\n\nBuy enough food for two mornings.\n\n- Fresh food\n  - Bananas\n  - Berries\n- Oatmeal",
    domain: "grocery-shopping",
    terms: ["grocery", "produce", "pasta"],
  },
  {
    id: "l2-nested-outline-small-garden",
    family: "outline",
    contentVariant: "nested-small-garden-outline",
    target: "# Small garden\n\n## Planting notes\n\nUse the sunny end of the yard.\n\n- Herb bed\n  - Basil\n  - Mint\n- Tomato pot\n- Watering can",
    teachingExample: "# Window plants\n\n## Care notes\n\nKeep the pots near the morning light.\n\n- Kitchen herbs\n  - Thyme\n  - Parsley\n- Fern",
    domain: "home-gardening",
    terms: ["garden", "herbs", "watering"],
  },
  {
    id: "l2-nested-outline-reading-plan",
    family: "outline",
    contentVariant: "nested-reading-plan-outline",
    target: "# Reading plan\n\n## This week\n\nMake time for a little reading each evening.\n\n- Short stories\n  - Monday\n  - Wednesday\n- Travel essay\n- Poetry book",
    teachingExample: "# Music practice\n\n## Evening set\n\nPlay a short session after dinner.\n\n- Warm-up\n  - Scales\n  - Chords\n- New song",
    domain: "reading-routine",
    terms: ["reading", "stories", "poetry"],
  },
  {
    id: "l2-nested-outline-weekend-route",
    family: "outline",
    contentVariant: "nested-weekend-route-outline",
    target: "# Weekend route\n\n## Morning stops\n\nFinish the errands before lunch.\n\n- Town center\n  - Bakery\n  - Post office\n- Farmers market\n- Gas station",
    teachingExample: "# Bike loop\n\n## Rest stops\n\nTake the quiet path around the lake.\n\n- North shore\n  - Water fountain\n  - Picnic table\n- Trail gate",
    domain: "weekend-errands",
    terms: ["route", "bakery", "market"],
  },
  {
    id: "l2-nested-outline-pet-care",
    family: "outline",
    contentVariant: "nested-pet-care-outline",
    target: "# Pet care\n\n## Evening routine\n\nSettle the dog in before bedtime.\n\n- Dinner\n  - Fill the bowl\n  - Add fresh water\n- Short walk\n- Brush coat",
    teachingExample: "# Cat care\n\n## Morning routine\n\nCheck everything before leaving home.\n\n- Breakfast\n  - Measure food\n  - Rinse bowl\n- Litter box",
    domain: "pet-care",
    terms: ["pet", "dinner", "walk"],
  },
  {
    id: "l2-nested-steps-laundry-routine",
    family: "steps",
    contentVariant: "nested-laundry-routine-steps",
    target: "# Laundry routine\n\nFinish one load before starting another.\n\n1. Sort the clothes\n   1. Set aside whites\n   2. Set aside darks\n2. Start the washer\n3. Fold the dry clothes",
    teachingExample: "# Dish routine\n\nClear the sink after the evening meal.\n\n1. Sort the dishes\n   1. Stack plates\n   2. Gather cups\n2. Fill the dishwasher",
    domain: "laundry-routine",
    terms: ["laundry", "washer", "clothes"],
  },
  {
    id: "l2-nested-steps-simple-meal",
    family: "steps",
    contentVariant: "nested-simple-meal-steps",
    target: "# Simple meal\n\nMake a quick vegetable wrap for lunch.\n\n1. Prepare the filling\n   1. Slice the cucumber\n   2. Grate the carrot\n2. Warm the tortilla\n3. Roll the wrap",
    teachingExample: "# Fruit bowl\n\nPut together a quick afternoon snack.\n\n1. Prepare the fruit\n   1. Rinse the grapes\n   2. Slice the pear\n2. Add yogurt",
    domain: "simple-cooking",
    terms: ["meal", "filling", "wrap"],
  },
  {
    id: "l2-nested-steps-craft-table",
    family: "steps",
    contentVariant: "nested-craft-table-steps",
    target: "# Craft table\n\nSet up a clean place for making paper cards.\n\n1. Gather supplies\n   1. Choose colored paper\n   2. Find the glue\n2. Cover the table\n3. Make the cards",
    teachingExample: "# Paint corner\n\nPrepare a small space for watercolor practice.\n\n1. Set out tools\n   1. Fill a water cup\n   2. Choose two brushes\n2. Tape down paper",
    domain: "arts-and-crafts",
    terms: ["craft", "paper", "cards"],
  },
  {
    id: "l2-nested-steps-room-reset",
    family: "steps",
    contentVariant: "nested-room-reset-steps",
    target: "# Room reset\n\nTidy the room before turning out the light.\n\n1. Clear the floor\n   1. Put away shoes\n   2. Pick up books\n2. Make the bed\n3. Close the curtains",
    teachingExample: "# Desk reset\n\nLeave the workspace ready for tomorrow.\n\n1. Clear the surface\n   1. File loose notes\n   2. Return pens\n2. Wipe the desk",
    domain: "home-routine",
    terms: ["room", "floor", "curtains"],
  },
]

function rootSequence(family: NestedListFamily): MatchCheck {
  const sequence: readonly BlockSelector[] =
    family === "outline"
      ? [
          { block: "heading", depth: 1 as const },
          { block: "heading", depth: 2 as const },
          { block: "paragraph" as const },
          { block: "list" as const },
        ]
      : [
          { block: "heading", depth: 1 as const },
          { block: "paragraph" as const },
          { block: "list" as const },
        ]
  return {
    id: `nested-${family}-root-shape`,
    kind: "block-sequence",
    scope: documentScope,
    exact: true,
    sequence,
    priority: 10,
    feedback: "Keep the same title, note, and top-level list order shown in the Goal.",
  }
}

function nestedBlockExclusions(family: NestedListFamily): MatchCheck[] {
  const rootListScope = {
    kind: "block",
    block: "list",
    occurrence: 0,
  } as const
  return [
    {
      id: `nested-${family}-no-extra-blockquote`,
      kind: "block-count",
      scope: rootListScope,
      block: "blockquote",
      recursive: true,
      max: 0,
      priority: 40,
      feedback: "Remove the extra quote inside the list.",
    },
    {
      id: `nested-${family}-no-extra-heading`,
      kind: "block-count",
      scope: rootListScope,
      block: "heading",
      recursive: true,
      max: 0,
      priority: 50,
      feedback: "Remove the extra heading inside the list.",
    },
    {
      id: `nested-${family}-no-extra-divider`,
      kind: "block-count",
      scope: rootListScope,
      block: "thematic-break",
      recursive: true,
      max: 0,
      priority: 60,
      feedback: "Remove the extra divider inside the list.",
    },
    {
      id: `nested-${family}-no-extra-code`,
      kind: "block-count",
      scope: rootListScope,
      block: "code",
      recursive: true,
      max: 0,
      priority: 70,
      feedback: "Remove the extra code block inside the list.",
    },
  ]
}

function createNestedListProblem(
  input: NestedListBatch016Input,
): NormalizedProblem {
  const ordered = input.family === "steps"
  const familyLabel =
    input.family === "checklist"
      ? "nested checklist"
      : input.family === "outline"
        ? "nested outline"
        : "nested step list"
  return {
    id: input.id,
    schemaVersion: 2,
    level: 2,
    flavor: "standard",
    familyId: "rebuild-nested-list-documents",
    skillIds: ["heading-h1", ordered ? "ordered-list" : "unordered-list"],
    difficulty: "mixed",
    teachingMode: "recall",
    teaching: {
      concept: "A nested list groups related details under one larger item.",
      howTo: "Rebuild the visible document and nest one list inside another. The inner list may use any valid Markdown list marker.",
      example: input.teachingExample,
    },
    syntaxTokens: ordered ? ["#", "1.", "Indent"] : ["#", "-", "Indent"],
    title: `Rebuild a ${familyLabel}`,
    prompt: "Rebuild the rendered document as Markdown. Your wording may differ, but keep the same Markdown shape.",
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: [
      rootSequence(input.family),
      {
        id: `nested-${input.family}-root-list`,
        kind: "list-shape",
        scope: documentScope,
        ordered,
        minItems: 2,
        requireNonemptyItems: true,
        requireVisibleItems: true,
        priority: 20,
        feedback: ordered
          ? "Use one top-level numbered list with at least two visible steps."
          : "Use one top-level bullet list with at least two visible items.",
      },
      {
        id: `nested-${input.family}-list-count`,
        kind: "block-count",
        scope: documentScope,
        block: "list",
        recursive: true,
        min: 2,
        max: 2,
        priority: 30,
        feedback: "Nest exactly one list inside the top-level list.",
      },
      {
        id: `nested-${input.family}-visible-child-items`,
        kind: "list-shape",
        scope: documentScope,
        ordered: "either",
        minItems: 2,
        recursive: true,
        descendantsOnly: true,
        requireVisibleItems: true,
        priority: 35,
        feedback: "Give every nested list item visible text or other visible content.",
      },
      ...nestedBlockExclusions(input.family),
    ],
    editorialChecks: [],
    hints: [
      "Build the title and short note first.",
      ordered
        ? "Start the top-level steps with 1."
        : "Start each top-level item with a bullet marker.",
      "Indent the inner items so they belong to one outer item.",
    ],
    retryFamily: `level-2-nested-${input.family}`,
    reviewTags: ["composite-level-2", "nested-list", `nested-${input.family}`],
    vocabulary: {
      profile: "everyday-recall",
      domains: [input.domain],
      terms: input.terms,
    },
    sourceBatchId: nestedListBatch016Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const nestedListBatch016Problems: readonly NormalizedProblem[] =
  nestedListBatch016Inputs.map(createNestedListProblem)
