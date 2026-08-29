import type { NormalizedProblem } from "../types"

export const tableBatch030Id = "2026-08-29-l1-tables-030"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

const teaching = {
  concept: "A Markdown table lines up related values in rows and columns.",
  howTo:
    "Put a bar between the cells and a divider row beneath the column headers.",
  example: "Fruit | Count\n--- | ---\nApples | 3",
} as const

const hints = [
  "Read each row from left to right.",
  "Type one vertical bar between the two cells.",
  "Example: `Fruit | Count`",
] as const

export type TableBatch030Input = {
  id: string
  contentVariant: string
  target: string
  vocabularyDomain: string
  terms: readonly string[]
}

export const tableBatch030Inputs: readonly TableBatch030Input[] = [
  {
    id: "l1-table-fruit-count",
    contentVariant: "fruit-count",
    target: "Fruit | Count\n--- | ---\nApples | 3",
    vocabularyDomain: "food",
    terms: ["fruit", "count", "apples"],
  },
  {
    id: "l1-table-day-weather",
    contentVariant: "day-weather",
    target: "Day | Weather\n--- | ---\nMonday | Sunny",
    vocabularyDomain: "weather",
    terms: ["day", "weather", "Monday", "sunny"],
  },
  {
    id: "l1-table-item-price",
    contentVariant: "item-price",
    target: "Item | Price\n--- | ---\nTea | $2",
    vocabularyDomain: "shopping",
    terms: ["item", "price", "tea"],
  },
  {
    id: "l1-table-room-floor",
    contentVariant: "room-floor",
    target: "Room | Floor\n--- | ---\nLibrary | 2",
    vocabularyDomain: "public-places",
    terms: ["room", "floor", "library"],
  },
  {
    id: "l1-table-bus-time",
    contentVariant: "bus-time",
    target: "Bus | Time\n--- | ---\nGreen | Noon",
    vocabularyDomain: "local-travel",
    terms: ["bus", "time", "green", "noon"],
  },
  {
    id: "l1-table-pet-name",
    contentVariant: "pet-name",
    target: "Pet | Name\n--- | ---\nCat | Luna",
    vocabularyDomain: "pets",
    terms: ["pet", "name", "cat", "Luna"],
  },
  {
    id: "l1-table-meal-drink",
    contentVariant: "meal-drink",
    target: "Meal | Drink\n--- | ---\nSoup | Water",
    vocabularyDomain: "meals",
    terms: ["meal", "drink", "soup", "water"],
  },
  {
    id: "l1-table-trail-length",
    contentVariant: "trail-length",
    target: "Trail | Length\n--- | ---\nPine | 4 km",
    vocabularyDomain: "outdoor-walks",
    terms: ["trail", "length", "pine"],
  },
  {
    id: "l1-table-flower-color",
    contentVariant: "flower-color",
    target: "Flower | Color\n--- | ---\nTulip | Red",
    vocabularyDomain: "gardens",
    terms: ["flower", "color", "tulip", "red"],
  },
  {
    id: "l1-table-team-practice",
    contentVariant: "team-practice",
    target: "Team | Practice\n--- | ---\nBears | Friday",
    vocabularyDomain: "community-sports",
    terms: ["team", "practice", "Bears", "Friday"],
  },
  {
    id: "l1-table-shop-opens",
    contentVariant: "shop-opens",
    target: "Shop | Opens\n--- | ---\nBakery | 8 am",
    vocabularyDomain: "neighborhood-errands",
    terms: ["shop", "opens", "bakery"],
  },
  {
    id: "l1-table-event-place",
    contentVariant: "event-place",
    target: "Event | Place\n--- | ---\nPicnic | Park",
    vocabularyDomain: "community-events",
    terms: ["event", "place", "picnic", "park"],
  },
] as const

function createTableProblem(input: TableBatch030Input): NormalizedProblem {
  return {
    id: input.id,
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: "tables",
    skillIds: ["table"],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching,
    syntaxTokens: ["|"],
    title: "Markdown table",
    prompt: "Write the three-row Markdown table.",
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: [
      {
        id: "use-table",
        kind: "block-count",
        scope: documentScope,
        block: "table",
        min: 1,
        priority: 10,
        feedback:
          "Add a Markdown table with a header row, a divider row, and a body row.",
      },
    ],
    editorialChecks: [
      {
        id: "keep-one-table",
        kind: "max-block-count",
        scope: documentScope,
        block: "table",
        max: 1,
        review: "Keep this short exercise focused on one table.",
      },
    ],
    hints,
    retryFamily: "level-1-table",
    reviewTags: ["one-focused-table", "two-column-table"],
    vocabulary: {
      profile: "everyday",
      domains: [input.vocabularyDomain],
      terms: input.terms,
    },
    sourceBatchId: tableBatch030Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const tableBatch030Problems: readonly NormalizedProblem[] =
  tableBatch030Inputs.map(createTableProblem)
