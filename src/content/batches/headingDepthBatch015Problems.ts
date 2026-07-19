import type { MatchCheck, NormalizedProblem } from "../types"

export const headingDepthBatch015Id =
  "2026-07-20-l1-heading-depth-l2-sectioned-documents-015"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

type HeadingDepth = 2 | 3 | 4 | 5 | 6

export type HeadingDepthLevel1Input = {
  id: string
  depth: HeadingDepth
  goal: string
  teachingExample: string
  domain: string
  contentVariant: string
}

export const headingDepthLevel1Inputs: readonly HeadingDepthLevel1Input[] = [
  { id: "l1-heading-depth-snack-ideas", depth: 2, goal: "## Snack ideas", teachingExample: "## Paper stars", domain: "everyday-food", contentVariant: "h2-snack-ideas" },
  { id: "l1-heading-depth-pool-pass", depth: 2, goal: "## Pool pass", teachingExample: "## Morning bell", domain: "everyday-outdoors", contentVariant: "h2-pool-pass" },
  { id: "l1-heading-depth-yard-sale", depth: 2, goal: "## Yard sale", teachingExample: "## Warm cookies", domain: "neighborhood", contentVariant: "h2-yard-sale" },
  { id: "l1-heading-depth-bus-stop", depth: 3, goal: "### Bus stop", teachingExample: "### Blue pencil", domain: "local-travel", contentVariant: "h3-bus-stop" },
  { id: "l1-heading-depth-tea-break", depth: 3, goal: "### Tea break", teachingExample: "### Shoe box", domain: "daily-routine", contentVariant: "h3-tea-break" },
  { id: "l1-heading-depth-bring-along", depth: 3, goal: "### Bring along", teachingExample: "### After dinner", domain: "daily-planning", contentVariant: "h3-bring-along" },
  { id: "l1-heading-depth-map-key", depth: 4, goal: "#### Map key", teachingExample: "#### Lemon slices", domain: "navigation", contentVariant: "h4-map-key" },
  { id: "l1-heading-depth-pet-bowl", depth: 4, goal: "#### Pet bowl", teachingExample: "#### Garden gate", domain: "pet-care", contentVariant: "h4-pet-bowl" },
  { id: "l1-heading-depth-movie-seat", depth: 5, goal: "##### Movie seat", teachingExample: "##### Orange cup", domain: "leisure", contentVariant: "h5-movie-seat" },
  { id: "l1-heading-depth-clean-shelf", depth: 5, goal: "##### Clean shelf", teachingExample: "##### Paper plane", domain: "home-care", contentVariant: "h5-clean-shelf" },
  { id: "l1-heading-depth-lost-mitten", depth: 6, goal: "###### Lost mitten", teachingExample: "###### Green bowl", domain: "clothing", contentVariant: "h6-lost-mitten" },
  { id: "l1-heading-depth-dog-leash", depth: 6, goal: "###### Dog leash", teachingExample: "###### Blue blanket", domain: "pet-care", contentVariant: "h6-dog-leash" },
]

const avoidEmphasisReview = {
  id: "keep-heading-plain",
  kind: "max-inline-count",
  scope: documentScope,
  inline: "emphasis",
  max: 0,
  review: "Keep this focused heading plain unless emphasis is useful.",
} as const

function createLevel1Problem(
  input: HeadingDepthLevel1Input,
): NormalizedProblem {
  const hashes = "#".repeat(input.depth)
  const headingName = `H${input.depth}`
  const hashStyleFeedback =
    input.depth === 2
      ? `This exercise practices the hash form of an ${headingName}. Start with \`${hashes} \`.`
      : `Start the ${headingName} with \`${hashes} \`.`
  return {
    id: input.id,
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching: {
      concept:
        input.depth === 2
          ? "An H2 can name a section below a document title. This exercise uses the hash form."
          : `An ${headingName} marks a heading at depth ${input.depth}.`,
      howTo: `Start the line with exactly ${input.depth} hash marks, then a space.`,
      example: input.teachingExample,
    },
    syntaxTokens: [hashes, "Space"],
    title: `${headingName} heading`,
    prompt: `Write one ${headingName} heading in Markdown.`,
    target: input.goal,
    starterText: "",
    protectedContent: [input.goal.slice(input.depth + 1)],
    matchChecks: [
      {
        id: `${input.id}-spacing`,
        kind: "heading-spacing",
        level: input.depth,
        priority: 10,
        feedback: `Add a space after the ${input.depth} hash marks.`,
      },
      {
        id: `${input.id}-hash-style`,
        kind: "hash-heading-style",
        level: input.depth,
        priority: 20,
        feedback: hashStyleFeedback,
      },
      {
        id: `${input.id}-shape`,
        kind: "block-sequence",
        scope: documentScope,
        exact: true,
        sequence: [{ block: "heading", depth: input.depth }],
        priority: 30,
        feedback: `Write exactly one ${headingName} heading and no other blocks.`,
      },
    ],
    editorialChecks: [avoidEmphasisReview],
    hints: [
      `Begin at the start of a line with ${hashes}.`,
      `Put one space after ${hashes}.`,
      `Example: \`${input.teachingExample}\``,
    ],
    retryFamily: "level-1-heading-depth",
    reviewTags: ["atx-heading", `heading-depth-${input.depth}`],
    vocabulary: {
      profile: "everyday",
      domains: [input.domain],
      terms: [input.goal.slice(input.depth + 1)],
    },
    sourceBatchId: headingDepthBatch015Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export type SectionedDocumentFamily =
  | "sectioned-process"
  | "sectioned-checklist"
  | "sectioned-message"

type SectionedAnatomy =
  | readonly ["h1", "paragraph", "h2", "ordered-list"]
  | readonly ["h1", "h2", "paragraph", "unordered-list"]
  | readonly ["h1", "h2", "paragraph", "h3", "blockquote"]

export type HeadingDepthLevel2Input = {
  id: string
  family: SectionedDocumentFamily
  anatomy: SectionedAnatomy
  contentVariant: string
  target: string
  domain: string
  terms: readonly [string, string, string]
}

export const headingDepthLevel2Inputs: readonly HeadingDepthLevel2Input[] = [
  { id: "l2-sectioned-process-car-wash", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"], contentVariant: "sectioned-car-wash-process", target: "# Car wash\n\nClean the car in a shady spot.\n\n## Steps\n\n1. Rinse the car\n2. Wash each side\n3. Dry the windows", domain: "car-care", terms: ["car", "wash", "windows"] },
  { id: "l2-sectioned-process-blanket-fort", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"], contentVariant: "sectioned-blanket-fort-process", target: "# Blanket fort\n\nBuild a cozy place for reading.\n\n## Steps\n\n1. Move two chairs\n2. Drape the blanket\n3. Add a pillow", domain: "indoor-play", terms: ["blanket", "chairs", "pillow"] },
  { id: "l2-sectioned-process-bird-feeder", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"], contentVariant: "sectioned-bird-feeder-process", target: "# Bird feeder\n\nFill the feeder before the birds arrive.\n\n## Steps\n\n1. Open the lid\n2. Pour in seed\n3. Hang it outside", domain: "backyard-nature", terms: ["feeder", "seed", "birds"] },
  { id: "l2-sectioned-process-sort-mail", family: "sectioned-process", anatomy: ["h1", "paragraph", "h2", "ordered-list"], contentVariant: "sectioned-mail-sorting-process", target: "# Sort the mail\n\nClear the table before sorting.\n\n## Steps\n\n1. Check each name\n2. Group the letters\n3. Recycle the flyers", domain: "household-routine", terms: ["mail", "letters", "flyers"] },
  { id: "l2-sectioned-checklist-pool-day", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"], contentVariant: "sectioned-pool-day-checklist", target: "# Pool day\n\n## Pack\n\nBring the bag by the front door.\n\n- Towel\n- Water bottle\n- Sunscreen", domain: "outdoor-swimming", terms: ["pool", "towel", "sunscreen"] },
  { id: "l2-sectioned-checklist-indoor-art", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"], contentVariant: "sectioned-indoor-art-checklist", target: "# Indoor art\n\n## Supplies\n\nCover the table before starting.\n\n- Paper\n- Washable paint\n- Old towel", domain: "arts-and-crafts", terms: ["art", "paint", "paper"] },
  { id: "l2-sectioned-checklist-bake-sale", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"], contentVariant: "sectioned-bake-sale-checklist", target: "# Bake sale\n\n## Table supplies\n\nSet these items beside the treats.\n\n- Price cards\n- Paper bags\n- Small change", domain: "community-event", terms: ["sale", "cards", "bags"] },
  { id: "l2-sectioned-checklist-bike-repair", family: "sectioned-checklist", anatomy: ["h1", "h2", "paragraph", "unordered-list"], contentVariant: "sectioned-bike-repair-checklist", target: "# Bike repair\n\n## Tool tray\n\nGather the basics before checking the tire.\n\n- Hand pump\n- Patch kit\n- Clean rag", domain: "bike-care", terms: ["bike", "pump", "tire"] },
  { id: "l2-sectioned-message-lost-and-found", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"], contentVariant: "sectioned-lost-found-message", target: "# Lost and found\n\n## Blue scarf\n\nIt was found near the gym door.\n\n### Pickup note\n\n> Ask at the front desk.", domain: "school-message", terms: ["scarf", "gym", "desk"] },
  { id: "l2-sectioned-message-book-swap", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"], contentVariant: "sectioned-book-swap-message", target: "# Book swap\n\n## Saturday table\n\nBring one book in good condition.\n\n### Friendly reminder\n\n> Write your name inside the cover.", domain: "neighborhood-reading", terms: ["book", "table", "cover"] },
  { id: "l2-sectioned-message-bus-stop", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"], contentVariant: "sectioned-bus-stop-message", target: "# Bus stop update\n\n## New corner\n\nThe morning bus now stops by Pine Street.\n\n### Rider note\n\n> Arrive five minutes early.", domain: "local-transit", terms: ["bus", "corner", "rider"] },
  { id: "l2-sectioned-message-school-play", family: "sectioned-message", anatomy: ["h1", "h2", "paragraph", "h3", "blockquote"], contentVariant: "sectioned-school-play-message", target: "# School play\n\n## Costume check\n\nBring each costume to the music room.\n\n### Cast note\n\n> Label every bag with a name.", domain: "school-theater", terms: ["play", "costume", "cast"] },
]

function sequenceFor(input: HeadingDepthLevel2Input): MatchCheck {
  return {
    id: `${input.id}-shape`,
    kind: "block-sequence",
    scope: documentScope,
    exact: true,
    sequence: input.anatomy.map((block) => {
      if (block === "h1") return { block: "heading", depth: 1 }
      if (block === "h2") return { block: "heading", depth: 2 }
      if (block === "h3") return { block: "heading", depth: 3 }
      if (block === "ordered-list" || block === "unordered-list") {
        return { block: "list" }
      }
      return { block }
    }),
    priority: 20,
    feedback: "Keep the same heading, paragraph, and list or quote order shown in the Goal.",
  }
}

function level2Checks(input: HeadingDepthLevel2Input): readonly MatchCheck[] {
  const checks: MatchCheck[] = [
    {
      id: `${input.id}-hierarchy`,
      kind: "heading-depth-order",
      allowSkippedDepths: false,
      priority: 10,
      feedback: "Keep heading levels in order without skipping a depth.",
    },
    sequenceFor(input),
  ]
  if (input.family === "sectioned-message") {
    checks.push({
      id: `${input.id}-quote`,
      kind: "blockquote-shape",
      scope: documentScope,
      requireNonemptyContent: true,
      priority: 30,
      feedback: "Finish with a blockquote that contains a short message.",
    })
  } else {
    checks.push({
      id: `${input.id}-list`,
      kind: "list-shape",
      scope: documentScope,
      ordered: input.family === "sectioned-process",
      minItems: input.family === "sectioned-process" ? 3 : 2,
      requireNonemptyItems: true,
      priority: 30,
      feedback:
        input.family === "sectioned-process"
          ? "Finish with an ordered list of at least three nonempty steps."
          : "Finish with an unordered list of at least two nonempty items.",
    })
  }
  return checks
}

function createLevel2Problem(
  input: HeadingDepthLevel2Input,
): NormalizedProblem {
  const listSkill =
    input.family === "sectioned-process"
      ? "ordered-list"
      : input.family === "sectioned-checklist"
        ? "unordered-list"
        : "blockquote"
  const title =
    input.family === "sectioned-process"
      ? "Rebuild a sectioned process"
      : input.family === "sectioned-checklist"
        ? "Rebuild a sectioned checklist"
        : "Rebuild a sectioned message"
  const example =
    input.family === "sectioned-process"
      ? "# Make cocoa\n\nPrepare a warm drink.\n\n## Steps\n\n1. Heat milk\n2. Add cocoa\n3. Stir well"
      : input.family === "sectioned-checklist"
        ? "# Rainy walk\n\n## Bring\n\nSet these by the door.\n\n- Raincoat\n- Dry socks"
        : "# Porch notice\n\n## Package\n\nA box arrived this afternoon.\n\n### Neighbor note\n\n> Please bring it inside."
  return {
    id: input.id,
    schemaVersion: 2,
    level: 2,
    flavor: "standard",
    familyId: "rebuild-sectioned-documents",
    skillIds: ["heading-h1", listSkill],
    difficulty: "mixed",
    teachingMode: "recall",
    teaching: {
      concept: "A short document uses heading depth to show how its sections fit together.",
      howTo: "Rebuild the visible heading hierarchy and block order, using your own wording if you like.",
      example,
    },
    syntaxTokens:
      input.family === "sectioned-message"
        ? ["#", "##", "###", ">"]
        : ["#", "##", input.family === "sectioned-process" ? "1." : "-"],
    title,
    prompt:
      "Rebuild the rendered document as Markdown. Your wording may differ, but keep the same Markdown shape.",
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: level2Checks(input),
    editorialChecks: [avoidEmphasisReview],
    hints:
      input.family === "sectioned-message"
        ? [
            "Start with H1, then add an H2 section.",
            "Put one paragraph under H2 and an H3 below it.",
            "Finish with a nonempty blockquote that starts with >.",
          ]
        : [
            "Start with H1 and add the H2 section shown in the Goal.",
            input.family === "sectioned-process"
              ? "Keep the opening paragraph before H2."
              : "Keep the paragraph after H2.",
            input.family === "sectioned-process"
              ? "Finish with at least three numbered steps."
              : "Finish with at least two bullet items.",
          ],
    retryFamily: `level-2-${input.family}`,
    reviewTags: ["composite-level-2", "heading-hierarchy", input.family],
    vocabulary: {
      profile: "everyday-recall",
      domains: [input.domain],
      terms: input.terms,
    },
    sourceBatchId: headingDepthBatch015Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const headingDepthBatch015Problems: readonly NormalizedProblem[] = [
  ...headingDepthLevel1Inputs.map(createLevel1Problem),
  ...headingDepthLevel2Inputs.map(createLevel2Problem),
]
