import type { NormalizedProblem } from "../types"

export const nestedBulletBatch019Id =
  "2026-07-22-l1-nested-bullet-lists-019"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

export type NestedBulletBatch019Input = {
  id: string
  contentVariant: string
  target: string
  teachingExample: string
  domain: string
  terms: readonly [string, string, string]
}

export const nestedBulletBatch019Inputs: readonly NestedBulletBatch019Input[] = [
  {
    id: "l1-nested-bullets-lunch-tray",
    contentVariant: "nested-bullets-lunch-tray",
    target: "- Lunch tray\n  - Sandwich\n  - Apple",
    teachingExample: "- Travel bag\n  - Hat\n  - Map",
    domain: "food",
    terms: ["lunch", "sandwich", "apple"],
  },
  {
    id: "l1-nested-bullets-game-box",
    contentVariant: "nested-bullets-game-box",
    target: "- Game box\n  - Cards\n  - Dice",
    teachingExample: "- Art box\n  - Paper\n  - Glue",
    domain: "games",
    terms: ["game", "cards", "dice"],
  },
  {
    id: "l1-nested-bullets-garden-bag",
    contentVariant: "nested-bullets-garden-bag",
    target: "- Garden bag\n  - Seeds\n  - Gloves",
    teachingExample: "- Rain gear\n  - Boots\n  - Coat",
    domain: "gardening",
    terms: ["garden", "seeds", "gloves"],
  },
  {
    id: "l1-nested-bullets-bedside-table",
    contentVariant: "nested-bullets-bedside-table",
    target: "- Bedside table\n  - Book\n  - Glasses",
    teachingExample: "- Desk tray\n  - Pens\n  - Tape",
    domain: "home",
    terms: ["bedside", "book", "glasses"],
  },
] as const

function createNestedBulletProblem(
  input: NestedBulletBatch019Input,
): NormalizedProblem {
  const listCountId = "nested-bullet-list-count"
  const rootListId = "nested-bullet-root-list"
  const childListId = "nested-bullet-child-list"
  return {
    id: input.id,
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: "nested-lists",
    skillIds: ["unordered-list"],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching: {
      concept: "An indented bullet belongs to the item above it.",
      howTo:
        "Type a hyphen and a space for every bullet. Put two spaces before each smaller bullet.",
      example: input.teachingExample,
    },
    syntaxTokens: ["- Item", "  - Nested item"],
    title: "Indented bullet list",
    prompt: "Write one main bullet. Indent two smaller bullets under it.",
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: [
      {
        id: listCountId,
        kind: "block-count",
        scope: documentScope,
        block: "list",
        recursive: true,
        min: 2,
        max: 2,
        priority: 10,
        feedback:
          "Make one smaller bullet list inside the first bullet. Indent its lines so Markdown nests them.",
      },
      {
        id: rootListId,
        kind: "list-shape",
        scope: documentScope,
        ordered: false,
        minItems: 1,
        maxItems: 1,
        requireNonemptyItems: true,
        requireVisibleItems: true,
        priority: 20,
        feedback: "Start the outer item with a bullet marker, such as `- Item`.",
      },
      {
        id: childListId,
        kind: "list-shape",
        scope: documentScope,
        ordered: false,
        minItems: 2,
        maxItems: 2,
        recursive: true,
        descendantsOnly: true,
        requireNonemptyItems: true,
        requireVisibleItems: true,
        priority: 30,
        feedback:
          "Put two visible bullet items inside the outer item. Indent their markers so Markdown nests them.",
      },
    ],
    editorialChecks: [
      {
        id: "keep-nested-bullet-warmup-focused",
        kind: "max-block-count",
        scope: documentScope,
        block: "paragraph",
        recursive: false,
        max: 0,
        review: "Keep this warm-up focused on one nested bullet list.",
      },
    ],
    hints: [
      "Type `- ` before all three lines.",
      "Add two spaces before the second and third bullet markers.",
      "Pattern: `- Item` then `  - Nested item`.",
    ],
    retryFamily: "level-1-nested-unordered-list",
    reviewTags: ["one-syntax", "nested-bullet-list", "indentation"],
    vocabulary: {
      profile: "everyday",
      domains: [input.domain],
      terms: input.terms,
    },
    sourceBatchId: nestedBulletBatch019Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const nestedBulletBatch019Problems: readonly NormalizedProblem[] =
  nestedBulletBatch019Inputs.map(createNestedBulletProblem)
