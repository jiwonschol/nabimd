import type { NormalizedProblem, SyntaxPresenceKind } from "../types"

export const levelUnlockBatch048Id = "2026-08-31-l2-l3-unlock-048"

const curriculumVersion = "2026-07-19"

type SupportedUnlockSyntax = Exclude<
  SyntaxPresenceKind,
  "heading-id" | "automatic-url" | "angle-bracket-email"
>

type SingleInput = {
  level: 2 | 3
  syntax: SupportedUnlockSyntax
  label: string
  targets: readonly [string, string, string, string, string]
  example: string
}

export const levelUnlockSingleInputs: readonly SingleInput[] = [
  {
    level: 2,
    syntax: "bold-italic",
    label: "bold italic text",
    targets: [
      "***Read this first***",
      "___Keep this nearby___",
      "***Save before closing***",
      "___Bring this tomorrow___",
      "***Check the final total***",
    ],
    example: "***Important***",
  },
  {
    level: 2,
    syntax: "strikethrough",
    label: "strikethrough text",
    targets: [
      "~~Old address~~",
      "~~Canceled meeting~~",
      "~~Previous deadline~~",
      "~~Outdated instructions~~",
      "~~Earlier estimate~~",
    ],
    example: "~~Old note~~",
  },
  {
    level: 2,
    syntax: "nested-blockquote",
    label: "nested block quote",
    targets: [
      "> Main note\n> > Reply",
      "> Question\n> > Answer",
      "> Update\n> > Follow-up",
      "> Request\n> > Response",
      "> Summary\n> > Detail",
    ],
    example: "> Note\n> > Detail",
  },
  {
    level: 2,
    syntax: "code-block-language",
    label: "syntax-highlighted code block",
    targets: [
      "```js\nconst ready = true\n```",
      "```css\n.card { color: blue; }\n```",
      "```html\n<p>Hello</p>\n```",
      "```json\n{\"ready\": true}\n```",
      "```sql\nSELECT name FROM tasks;\n```",
    ],
    example: "```html\n<p>Hello</p>\n```",
  },
  {
    level: 2,
    syntax: "hard-line-break",
    label: "line break",
    targets: [
      "First step  \nSecond step",
      "Morning note  \nEvening note",
      "Room 12  \nSecond floor",
      "Call today  \nEmail tomorrow",
      "Draft ready  \nReview pending",
    ],
    example: "Line one  \nLine two",
  },
  {
    level: 3,
    syntax: "link-title",
    label: "link title",
    targets: [
      "Project guide\n\nRead the [setup notes](https://example.com \"Setup notes\") before Monday.",
      "Office visit\n\nOpen the [floor map](https://example.org 'Office map') before you leave.",
      "Team handbook\n\nKeep the [leave policy](https://example.net \"Leave policy\") nearby.",
      "Workshop prep\n\nReview the [arrival guide](https://example.edu 'Arrival guide') this week.",
      "Support handoff\n\nShare the [contact guide](https://example.info \"Contact guide\") with the next shift.",
    ],
    example: "[Help](https://example.net \"More details\")",
  },
  {
    level: 3,
    syntax: "angle-bracket-url",
    label: "angle-bracket URL",
    targets: [
      "Project reference\n\nOpen <ftp://example.com/plan> for the current plan.",
      "Visitor information\n\nUse <ftp://example.org/help> before arriving.",
      "Team archive\n\nCheck <ftp://example.net/calendar> for the next date.",
      "Release archive\n\nRead <ftp://example.edu/releases> before the update.",
      "Support archive\n\nVisit <ftp://example.info/status> for the latest notice.",
    ],
    example: "<ftp://example.net/help>",
  },
  {
    level: 3,
    syntax: "escape",
    label: "escaped punctuation",
    targets: [
      "Notation note\n\nWrite \"\\*required\\*\" as literal text in the form.",
      "Draft label\n\n\\# pending stays plain text in the report.",
      "Search note\n\nType \\_archive\\_ exactly in the search field.",
      "Template reminder\n\n\\> owner stays ordinary text in the example.",
      "Command note\n\n\\+ optional stays ordinary text in the guide.",
    ],
    example: "\\_Literal marks\\_",
  },
  {
    level: 3,
    syntax: "list-with-block",
    label: "list item with a block",
    targets: [
      "Meeting follow-up\n\n- > Bring a notebook",
      "Project reminder\n\n- > Share the update",
      "Visitor note\n\n- > Check in at reception",
      "Workshop plan\n\n- > Save time for questions",
      "Support handoff\n\n- > Confirm the next owner",
    ],
    example: "- > Detail",
  },
  {
    level: 3,
    syntax: "footnote",
    label: "footnote",
    targets: [
      "Research note\n\nCheck the source[^1] before sharing the summary.\n\n[^1]: Project notes",
      "Team update\n\nRead the detail[^note] before the meeting.\n\n[^note]: Team handbook",
      "Travel brief\n\nConfirm the arrival time[^trip] before booking.\n\n[^trip]: Visitor guide",
      "Release summary\n\nVerify the supported version[^release] before updating.\n\n[^release]: Release notes",
      "Support record\n\nKeep the ticket number[^case] with the handoff.\n\n[^case]: Support log",
    ],
    example: "Claim[^1]\n\n[^1]: Source",
  },
] as const

function createSingleProblem(input: SingleInput, variant: number): NormalizedProblem {
  const target = input.targets[variant]!
  const suffix = variant + 1
  const matchChecks: NormalizedProblem["matchChecks"] = [{
    id: `use-${input.syntax}`,
    kind: "syntax-presence",
    syntax: input.syntax,
    min: 1,
    priority: 10,
    feedback: `Use Markdown ${input.label} syntax.`,
  }, ...(input.level === 3 ? [{
    id: "keep-readable",
    kind: "document-limits" as const,
    minBlocks: 2,
    minLines: 3,
    maxLines: 28,
    priority: 20,
    feedback: "Write a short document with at least two blocks and no more than 28 lines.",
  }] : [])]
  return {
    id: `l${input.level}-${input.syntax}-${suffix}`,
    schemaVersion: 2,
    level: input.level,
    flavor: "standard",
    familyId: input.syntax,
    skillIds: [input.syntax],
    difficulty: variant === 0 ? "warmup" : "makeover",
    teachingMode: "recall",
    teaching: {
      concept: `${input.label[0]!.toUpperCase()}${input.label.slice(1)} is a Markdown syntax pattern.`,
      howTo: `Type the punctuation that creates the ${input.label}.`,
      example: input.example,
    },
    syntaxTokens: [input.syntax],
    title: input.label,
    prompt: input.level === 3
      ? `Write the short document with the ${input.label}.`
      : `Write the ${input.label}.`,
    target,
    starterText: "",
    protectedContent: [],
    matchChecks,
    editorialChecks: [],
    hints: [
      `Look for the punctuation used by a ${input.label}.`,
      `Add the missing ${input.label} marks.`,
      `Example: ${input.example}`,
    ],
    retryFamily: `level-${input.level}-${input.syntax}`,
    reviewTags: [input.syntax, "level-unlock"],
    vocabulary: {
      profile: input.level === 2 ? "everyday-recall" : "workplace-document",
      domains: [input.level === 2 ? "everyday-notes" : "workplace-notes"],
      terms: [...new Set(target.match(/[A-Za-z]+/g) ?? [])].slice(0, 8),
    },
    sourceBatchId: levelUnlockBatch048Id,
    revision: 1,
    curriculumVersion,
    contentVariant: `variant-${suffix}`,
  }
}

const singleProblems = levelUnlockSingleInputs.flatMap((input) =>
  input.targets.map((_, variant) => createSingleProblem(input, variant)),
)

const mixedInputs = [
  {
    id: "l3-mixed-link-title-escape",
    target: "Team guide\n\nRead the [handoff notes](https://example.com \"Team guide\"), then write \\*owner\\* literally.",
    skillIds: ["link-title", "escape"],
    syntaxTokens: ["link-title", "escape"],
    contentVariant: "link-and-escape",
  },
  {
    id: "l3-mixed-list-angle-url",
    target: "Visitor checklist\n\n- > Open <ftp://example.org/visit> before arriving.",
    skillIds: ["list-with-block", "angle-bracket-url"],
    syntaxTokens: ["list-with-block", "angle-bracket-url"],
    contentVariant: "list-and-url",
  },
  {
    id: "l3-mixed-escape-footnote",
    target: "Template note\n\nWrite \\*owner\\* as literal text in the form.[^1]\n\n[^1]: Project template",
    skillIds: ["escape", "footnote"],
    syntaxTokens: ["escape", "footnote"],
    contentVariant: "escape-and-footnote",
  },
  {
    id: "l3-mixed-link-title-url",
    target: "Release reference\n\nRead the [update guide](https://example.net \"Update guide\"), then check <ftp://example.net/status>.",
    skillIds: ["link-title", "angle-bracket-url"],
    syntaxTokens: ["link-title", "angle-bracket-url"],
    contentVariant: "link-and-url",
  },
  {
    id: "l3-mixed-list-footnote",
    target: "Support handoff\n\n- > Confirm the next owner.[^1]\n\n[^1]: Support log",
    skillIds: ["list-with-block", "footnote"],
    syntaxTokens: ["list-with-block", "footnote"],
    contentVariant: "list-and-footnote",
  },
] as const

const mixedProblems: readonly NormalizedProblem[] = mixedInputs.map((input) => ({
  id: input.id,
  schemaVersion: 2,
  level: 3,
  flavor: "standard",
  familyId: "level-3-mixed-syntax",
  skillIds: input.skillIds,
  difficulty: "mixed",
  teachingMode: "recall",
  teaching: {
    concept: "A short Markdown document can combine more than one syntax pattern.",
    howTo: "Add each requested mark while keeping the document readable.",
    example: input.target,
  },
  syntaxTokens: input.syntaxTokens,
  title: "Combined Markdown patterns",
  prompt: "Write the short document with both Markdown patterns.",
  target: input.target,
  starterText: "",
  protectedContent: [],
  matchChecks: [
    ...input.syntaxTokens.map((syntax, priority) => ({
      id: `use-${syntax}`,
      kind: "syntax-presence" as const,
      syntax,
      min: 1,
      priority: 10 + priority,
      feedback: `Use Markdown ${syntax} syntax.`,
    })),
    {
      id: "keep-readable",
      kind: "document-limits" as const,
      minBlocks: 2,
      minLines: 3,
      maxLines: 28,
      priority: 20,
      feedback: "Write a short document with at least two blocks and no more than 28 lines.",
    },
  ],
  editorialChecks: [],
  hints: [
    "Find the punctuation for both requested patterns.",
    "Complete one syntax pattern at a time.",
    "Check that both patterns still parse as Markdown.",
  ],
  retryFamily: "level-3-mixed-syntax",
  reviewTags: ["mixed-syntax", "level-unlock"],
  vocabulary: {
    profile: "workplace-document",
    domains: ["workplace-notes"],
    terms: [...new Set(input.target.match(/[A-Za-z]+/g) ?? [])].slice(0, 8),
  },
  sourceBatchId: levelUnlockBatch048Id,
  revision: 1,
  curriculumVersion,
  contentVariant: input.contentVariant,
}))

export const levelUnlockBatch048Problems: readonly NormalizedProblem[] = [
  ...singleProblems,
  ...mixedProblems,
]
