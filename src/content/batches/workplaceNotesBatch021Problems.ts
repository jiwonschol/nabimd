import type {
  EditorialCheck,
  MatchCheck,
  NormalizedProblem,
} from "../types"

export const workplaceNotesBatch021Id = "2026-07-22-l4-workplace-notes-021"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

function h2Section(occurrence: number) {
  return { kind: "section", headingDepth: 2, occurrence } as const
}

export type WorkplaceNoteFamily =
  | "handoff"
  | "decision"
  | "checklist"
  | "status"

export type WorkplaceNotesBatch021Input = {
  id: string
  family: WorkplaceNoteFamily
  contentVariant: string
  target: string
  teachingExample: string
  domain: string
  terms: readonly [string, string, string]
}

export const workplaceNotesBatch021Inputs: readonly WorkplaceNotesBatch021Input[] =
  [
    {
      id: "l4-handoff-front-desk",
      family: "handoff",
      contentVariant: "workplace-handoff-front-desk",
      target:
        "# Front desk handoff\n\nNotes from the afternoon shift for the morning team.\n\n## Today\n\n- Mail cart emptied\n- Visitor badges restocked\n\n## Tomorrow\n\n- Order badge sleeves\n- Water the lobby plants",
      teachingExample:
        "# Desk notes\n\nShort notes for the next shift.\n\n## Today\n\n- Task done\n- Other task done",
      domain: "reception",
      terms: ["handoff", "badges", "lobby"],
    },
    {
      id: "l4-handoff-library-desk",
      family: "handoff",
      contentVariant: "workplace-handoff-library-desk",
      target:
        "# Library desk handoff\n\nNotes from the closing shift for tomorrow's opener.\n\n## Today\n\n- Returned books shelved\n- Study rooms locked\n\n## Tomorrow\n\n- Restock printer paper\n- Update the events board",
      teachingExample:
        "# Counter notes\n\nWhat the opener should know.\n\n## Today\n\n- Shelf tidied\n- Door locked",
      domain: "library",
      terms: ["library", "books", "shelved"],
    },
    {
      id: "l4-handoff-cafe-counter",
      family: "handoff",
      contentVariant: "workplace-handoff-cafe-counter",
      target:
        "# Cafe counter handoff\n\nNotes from the morning crew for the afternoon crew.\n\n## Today\n\n- Milk delivery arrived\n- Espresso machine cleaned\n\n## Tomorrow\n\n- Rotate the pastry stock\n- Post the new menu card",
      teachingExample:
        "# Shift notes\n\nWhat the next crew should know.\n\n## Today\n\n- Delivery stored\n- Machine cleaned",
      domain: "cafe",
      terms: ["cafe", "espresso", "pastry"],
    },
    {
      id: "l4-decision-room-booking",
      family: "decision",
      contentVariant: "workplace-decision-room-booking",
      target:
        "# Meeting room booking change\n\nWe are moving to one shared booking sheet.\n\n## Decision\n\n> Book rooms on the shared sheet, not in chat.\n\n## Steps\n\n1. Open the shared sheet\n2. Pick a free slot\n3. Add your team name",
      teachingExample:
        "# Small change note\n\nOne sentence of context.\n\n## Decision\n\n> The one rule everyone follows.\n\n## Steps\n\n1. First step\n2. Second step",
      domain: "office",
      terms: ["booking", "sheet", "slot"],
    },
    {
      id: "l4-decision-recycling-bins",
      family: "decision",
      contentVariant: "workplace-decision-recycling-bins",
      target:
        "# Recycling bin change\n\nThe kitchen bins get new labels this week.\n\n## Decision\n\n> Sort paper and plastic into the labeled bins.\n\n## Steps\n\n1. Check the bin label\n2. Empty your desk tray\n3. Flatten the boxes",
      teachingExample:
        "# Kitchen note\n\nWhy the bins changed.\n\n## Decision\n\n> Sort waste by the printed label.\n\n## Steps\n\n1. Read the label\n2. Sort the item",
      domain: "facilities",
      terms: ["recycling", "bins", "labels"],
    },
    {
      id: "l4-decision-printer-queue",
      family: "decision",
      contentVariant: "workplace-decision-printer-queue",
      target:
        "# Printer queue change\n\nLarge jobs move to the copy room printer.\n\n## Decision\n\n> Send jobs over ten pages to the copy room.\n\n## Steps\n\n1. Count your pages\n2. Pick the right printer\n3. Collect the printout",
      teachingExample:
        "# Print note\n\nWhere big jobs go now.\n\n## Decision\n\n> Big jobs use the big printer.\n\n## Steps\n\n1. Check the size\n2. Choose the printer",
      domain: "office",
      terms: ["printer", "queue", "pages"],
    },
    {
      id: "l4-checklist-studio-closing",
      family: "checklist",
      contentVariant: "workplace-checklist-studio-closing",
      target:
        "# Studio closing checklist\n\nDo these before leaving the studio.\n\n## Before you leave\n\n- Lock the supply cabinet\n- Run `backup now` on the desk computer\n- Turn off the hallway lights",
      teachingExample:
        "# Closing note\n\nThree things before you go.\n\n## Before you leave\n\n- Lock the door\n- Run `save all` on the computer\n- Turn off the lamp",
      domain: "studio",
      terms: ["studio", "cabinet", "backup"],
    },
    {
      id: "l4-checklist-workshop-opening",
      family: "checklist",
      contentVariant: "workplace-checklist-workshop-opening",
      target:
        "# Workshop opening checklist\n\nDo these before the first visitors arrive.\n\n## Before you open\n\n- Unlock the tool wall\n- Run `till start` on the register\n- Prop open the side door",
      teachingExample:
        "# Opening note\n\nThree things before opening.\n\n## Before you open\n\n- Unlock the case\n- Run `till open` on the register\n- Turn on the sign",
      domain: "workshop",
      terms: ["workshop", "register", "visitors"],
    },
    {
      id: "l4-checklist-kiosk-shutdown",
      family: "checklist",
      contentVariant: "workplace-checklist-kiosk-shutdown",
      target:
        "# Kiosk shutdown checklist\n\nDo these when the market closes.\n\n## Before you go\n\n- Count the cash drawer\n- Run `report daily` on the tablet\n- Cover the display shelf",
      teachingExample:
        "# Shutdown note\n\nThree things at closing time.\n\n## Before you go\n\n- Count the drawer\n- Run `report end` on the tablet\n- Cover the stand",
      domain: "market",
      terms: ["kiosk", "drawer", "tablet"],
    },
    {
      id: "l4-status-website-refresh",
      family: "status",
      contentVariant: "workplace-status-website-refresh",
      target:
        "# Website refresh status\n\nThe new banner is live. **Feedback closes Friday.**\n\n## Done\n\n- New banner published\n- Old links checked\n\n## Next\n\n1. Collect feedback notes\n2. Update the photo page",
      teachingExample:
        "# Project status\n\nShort update. **One bold deadline.**\n\n## Done\n\n- First piece shipped\n- Second piece checked\n\n## Next\n\n1. Gather notes\n2. Update the page",
      domain: "web",
      terms: ["website", "banner", "feedback"],
    },
    {
      id: "l4-status-newsletter-move",
      family: "status",
      contentVariant: "workplace-status-newsletter-move",
      target:
        "# Newsletter move status\n\nThe new sender is ready. **The old address stops Monday.**\n\n## Done\n\n- Reader list copied\n- Welcome note drafted\n\n## Next\n\n1. Send the test issue\n2. Retire the old address",
      teachingExample:
        "# Move status\n\nShort update. **One bold cutoff date.**\n\n## Done\n\n- List copied\n- Note drafted\n\n## Next\n\n1. Send a test\n2. Close the old one",
      domain: "communications",
      terms: ["newsletter", "sender", "readers"],
    },
    {
      id: "l4-status-signage-update",
      family: "status",
      contentVariant: "workplace-status-signage-update",
      target:
        "# Lobby signage status\n\nThe new signs arrived. **Installation happens Thursday.**\n\n## Done\n\n- Old signs measured\n- New signs proofread\n\n## Next\n\n1. Book the installer\n2. Recycle the old signs",
      teachingExample:
        "# Sign status\n\nShort update. **One bold install date.**\n\n## Done\n\n- Sizes measured\n- Text proofread\n\n## Next\n\n1. Book a helper\n2. Remove the old sign",
      domain: "facilities",
      terms: ["signage", "lobby", "installer"],
    },
  ] as const

const familyPrompt: Record<WorkplaceNoteFamily, string> = {
  handoff:
    "Rebuild the short handoff note: one title, two H2 sections, and a two-item bullet list in each section.",
  decision:
    "Rebuild the short decision note: one title, a blockquote under Decision, and three numbered steps.",
  checklist:
    "Rebuild the short checklist: one title, one H2 section, three bullets, and keep the command as inline code.",
  status:
    "Rebuild the short status note: one bold sentence, a two-item bullet list, and two numbered steps.",
}

const familyTitle: Record<WorkplaceNoteFamily, string> = {
  handoff: "Shift handoff note",
  decision: "Team decision note",
  checklist: "Short checklist",
  status: "Status update note",
}

const familyTeaching: Record<
  WorkplaceNoteFamily,
  { concept: string; howTo: string }
> = {
  handoff: {
    concept:
      "A handoff note uses one H1 title and H2 sections so the next person can scan it.",
    howTo:
      "Type `#` before the title, `##` before each section name, and `- ` before each item.",
  },
  decision: {
    concept:
      "A decision note quotes the rule with a blockquote and numbers the steps in order.",
    howTo:
      "Type `#` and `##` for the headings, `> ` before the decision, and `1. 2. 3.` before the steps.",
  },
  checklist: {
    concept:
      "A checklist uses bullets for tasks and inline code for the exact command to type.",
    howTo:
      "Type `#` and `##` for the headings, `- ` before each task, and wrap the command in backticks.",
  },
  status: {
    concept:
      "A status note bolds the one deadline and splits work into Done bullets and Next numbered steps.",
    howTo:
      "Type `#` and `##` for the headings, `**` around the deadline, `- ` for Done, and `1. 2.` for Next.",
  },
}

const familySyntaxTokens: Record<WorkplaceNoteFamily, readonly string[]> = {
  handoff: ["# Title", "## Section", "- Item"],
  decision: ["# Title", "> Decision", "1. Step"],
  checklist: ["# Title", "- Task", "`command`"],
  status: ["# Title", "**Deadline**", "- Done item", "1. Next step"],
}

const familyHints: Record<
  WorkplaceNoteFamily,
  readonly [string, string, string]
> = {
  handoff: [
    "Start the title with `# ` and each section with `## `.",
    "Every list line starts with `- ` and one space.",
    "Pattern: `# Title`, `## Section`, then `- Item` lines.",
  ],
  decision: [
    "The decision line starts with `> ` and one space.",
    "The steps use `1. `, `2. `, `3. ` with one space after the dot.",
    "Pattern: `# Title`, `## Decision`, `> Rule`, `## Steps`, `1. Step`.",
  ],
  checklist: [
    "Every task line starts with `- ` and one space.",
    "Wrap only the command in single backticks.",
    "Pattern: `- Run \\`command\\` on the machine`.",
  ],
  status: [
    "Wrap the deadline sentence in double asterisks: `**like this**`.",
    "Done uses `- ` bullets; Next uses `1. ` and `2. `.",
    "Pattern: `# Title`, bold sentence, `## Done`, `## Next`.",
  ],
}

const familyRetryFamily: Record<WorkplaceNoteFamily, string> = {
  handoff: "level-4-workplace-handoff",
  decision: "level-4-workplace-decision",
  checklist: "level-4-workplace-checklist",
  status: "level-4-workplace-status",
}

function limitsCheck(problemId: string): MatchCheck {
  return {
    id: `${problemId}-limits`,
    kind: "document-limits",
    maxLines: 16,
    priority: 5,
    feedback: "Keep the note within 16 lines, like the Goal.",
  }
}

function outlineCheck(
  problemId: string,
  sequence: Extract<MatchCheck, { kind: "block-sequence" }>["sequence"],
): MatchCheck {
  return {
    id: `${problemId}-outline`,
    kind: "block-sequence",
    scope: documentScope,
    sequence,
    exact: true,
    priority: 10,
    feedback: "Match the Goal's block order exactly.",
  }
}

function sectionsCheck(problemId: string, h2Count: number): MatchCheck {
  return {
    id: `${problemId}-sections`,
    kind: "block-count",
    scope: documentScope,
    block: "heading",
    depth: 2,
    min: h2Count,
    max: h2Count,
    priority: 15,
    feedback: `Use exactly ${h2Count} H2 section heading${h2Count === 1 ? "" : "s"}.`,
  }
}

function hierarchyCheck(problemId: string): MatchCheck {
  return {
    id: `${problemId}-hierarchy`,
    kind: "heading-depth-order",
    allowSkippedDepths: false,
    priority: 20,
    feedback: "Keep one H1 title followed by H2 sections.",
  }
}

function listCheck(
  problemId: string,
  suffix: string,
  occurrence: number,
  orderedList: boolean,
  items: 2 | 3,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-${suffix}`,
    kind: "list-shape",
    scope: h2Section(occurrence),
    ordered: orderedList,
    minItems: items,
    maxItems: items,
    requireVisibleItems: true,
    priority,
    feedback: `Use a ${orderedList ? "numbered" : "bullet"} list with ${items} visible items in this section.`,
  }
}

const familyChecks: Record<
  WorkplaceNoteFamily,
  (problemId: string) => MatchCheck[]
> = {
  handoff: (problemId) => [
    limitsCheck(problemId),
    outlineCheck(problemId, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    sectionsCheck(problemId, 2),
    hierarchyCheck(problemId),
    listCheck(problemId, "today-list", 0, false, 2, 30),
    listCheck(problemId, "tomorrow-list", 1, false, 2, 40),
  ],
  decision: (problemId) => [
    limitsCheck(problemId),
    outlineCheck(problemId, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    sectionsCheck(problemId, 2),
    hierarchyCheck(problemId),
    {
      id: `${problemId}-decision-quote`,
      kind: "blockquote-shape",
      scope: h2Section(0),
      requireNonemptyContent: true,
      priority: 30,
      feedback: "Write the decision as one blockquote in the Decision section.",
    },
    listCheck(problemId, "steps-list", 1, true, 3, 40),
  ],
  checklist: (problemId) => [
    limitsCheck(problemId),
    outlineCheck(problemId, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    sectionsCheck(problemId, 1),
    hierarchyCheck(problemId),
    listCheck(problemId, "task-list", 0, false, 3, 30),
    {
      id: `${problemId}-command-code`,
      kind: "inline-code-shape",
      scope: h2Section(0),
      min: 1,
      requireNonemptyContent: true,
      priority: 40,
      feedback: "Wrap the command in single backticks so it reads as code.",
    },
  ],
  status: (problemId) => [
    limitsCheck(problemId),
    outlineCheck(problemId, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    sectionsCheck(problemId, 2),
    hierarchyCheck(problemId),
    {
      id: `${problemId}-bold-note`,
      kind: "inline-presence",
      scope: documentScope,
      inline: "strong",
      min: 1,
      requireNonemptyContent: true,
      priority: 25,
      feedback: "Make the deadline sentence bold with double asterisks.",
    },
    listCheck(problemId, "done-list", 0, false, 2, 30),
    listCheck(problemId, "next-list", 1, true, 2, 40),
  ],
}

function editorialChecks(problemId: string): EditorialCheck[] {
  return [
    {
      id: `${problemId}-no-italics`,
      kind: "max-inline-count",
      scope: documentScope,
      inline: "emphasis",
      max: 0,
      review:
        "This form reads best without italics; save emphasis for the bold deadline style.",
    },
  ]
}

function createWorkplaceNoteProblem(
  input: WorkplaceNotesBatch021Input,
): NormalizedProblem {
  const teaching = familyTeaching[input.family]
  return {
    id: input.id,
    schemaVersion: 2,
    level: 4,
    flavor: "standard",
    familyId: "workplace-notes",
    skillIds:
      input.family === "handoff"
        ? ["heading-hierarchy", "unordered-list"]
        : input.family === "decision"
          ? ["heading-hierarchy", "blockquote", "ordered-list"]
          : input.family === "checklist"
            ? ["heading-hierarchy", "unordered-list", "inline-code"]
            : ["heading-hierarchy", "bold-emphasis", "unordered-list", "ordered-list"],
    difficulty: "mixed",
    teachingMode: "recall",
    teaching: {
      concept: teaching.concept,
      howTo: teaching.howTo,
      example: input.teachingExample,
    },
    syntaxTokens: [...familySyntaxTokens[input.family]],
    title: familyTitle[input.family],
    prompt: familyPrompt[input.family],
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: familyChecks[input.family](input.id),
    editorialChecks: editorialChecks(input.id),
    hints: [...familyHints[input.family]] as [string, string, string],
    retryFamily: familyRetryFamily[input.family],
    reviewTags: ["compact-document", "workplace-note", input.family],
    vocabulary: {
      profile: "development-spec",
      domains: [input.domain],
      terms: [...input.terms],
    },
    sourceBatchId: workplaceNotesBatch021Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const workplaceNotesBatch021Problems: readonly NormalizedProblem[] =
  workplaceNotesBatch021Inputs.map(createWorkplaceNoteProblem)
