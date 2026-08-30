import type { NormalizedProblem, SyntaxPresenceKind } from "../types"

export const levelUnlockBatch033Id = "2026-08-30-l2-l3-unlock-033"

const curriculumVersion = "2026-07-19"

type SupportedUnlockSyntax = Exclude<
  SyntaxPresenceKind,
  "heading-id" | "automatic-url"
>

type SingleInput = {
  level: 2 | 3
  syntax: SupportedUnlockSyntax
  label: string
  targets: readonly [string, string]
  example: string
}

export const levelUnlockSingleInputs: readonly SingleInput[] = [
  { level: 2, syntax: "bold-italic", label: "bold italic text", targets: ["***Read this first***", "___Keep this nearby___"], example: "***Important***" },
  { level: 2, syntax: "strikethrough", label: "strikethrough text", targets: ["~~Old address~~", "~~Canceled meeting~~"], example: "~~Old note~~" },
  { level: 2, syntax: "nested-blockquote", label: "nested block quote", targets: ["> Main note\n> > Reply", "> Question\n> > Answer"], example: "> Note\n> > Detail" },
  { level: 2, syntax: "code-block-language", label: "syntax-highlighted code block", targets: ["```js\nconst ready = true\n```", "```css\n.card { color: blue; }\n```"], example: "```html\n<p>Hello</p>\n```" },
  { level: 2, syntax: "hard-line-break", label: "line break", targets: ["First step  \nSecond step", "Morning note  \nEvening note"], example: "Line one  \nLine two" },
  { level: 3, syntax: "link-title", label: "link title", targets: ["[Guide](https://example.com \"Read the guide\")", "[Map](https://example.org 'Open the map')"], example: "[Help](https://example.net \"More details\")" },
  { level: 3, syntax: "angle-bracket-url", label: "angle-bracket URL", targets: ["<https://example.com>", "<https://example.org/help>"], example: "<https://example.net>" },
  { level: 3, syntax: "angle-bracket-email", label: "angle-bracket email", targets: ["<hello@example.com>", "<team@example.org>"], example: "<help@example.net>" },
  { level: 3, syntax: "escape", label: "escaped punctuation", targets: ["\\*Literal stars\\*", "\\# Literal hash"], example: "\\_Literal marks\\_" },
  { level: 3, syntax: "list-with-block", label: "list item with a block", targets: ["- Reminder\n\n  > Bring a notebook", "- Update\n\n  ```text\n  Ready\n  ```"], example: "- Item\n\n  > Detail" },
  { level: 3, syntax: "footnote", label: "footnote", targets: ["Check the source[^1].\n\n[^1]: Project notes", "Read the detail[^note].\n\n[^note]: Team handbook"], example: "Claim[^1]\n\n[^1]: Source" },
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
    id: "keep-short",
    kind: "document-limits" as const,
    maxLines: 28,
    priority: 20,
    feedback: "Keep the answer within 28 lines.",
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
    prompt: `Write the ${input.label}.`,
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
    sourceBatchId: levelUnlockBatch033Id,
    revision: 1,
    curriculumVersion,
    contentVariant: `variant-${suffix}`,
  }
}

const singleProblems = levelUnlockSingleInputs.flatMap((input) => [
  createSingleProblem(input, 0),
  createSingleProblem(input, 1),
])

const mixedInputs = [
  {
    id: "l3-mixed-link-title-email",
    target: "[Guide](https://example.com \"Team guide\")\n\nContact <team@example.com>.",
    skillIds: ["link-title", "angle-bracket-email"],
    syntaxTokens: ["link-title", "angle-bracket-email"],
  },
  {
    id: "l3-mixed-list-angle-url",
    target: "- Check the source\n\n  > Open <https://example.org>.",
    skillIds: ["list-with-block", "angle-bracket-url"],
    syntaxTokens: ["list-with-block", "angle-bracket-url"],
  },
] as const

const mixedProblems: readonly NormalizedProblem[] = mixedInputs.map((input, index) => ({
  id: input.id,
  schemaVersion: 2,
  level: 3,
  flavor: "standard",
  familyId: "level-3-mixed-syntax",
  skillIds: input.skillIds,
  difficulty: "mixed",
  teachingMode: "recall",
  teaching: {
    concept: "A short Markdown note can combine more than one syntax pattern.",
    howTo: "Add each requested mark while keeping the note readable.",
    example: index === 0 ? "[Help](https://example.net \"Details\")\n\nEmail <help@example.net>." : "- Source\n\n  > Open <https://example.net>.",
  },
  syntaxTokens: input.syntaxTokens,
  title: "Combined Markdown patterns",
  prompt: "Write the short note with both Markdown patterns.",
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
      id: "keep-short",
      kind: "document-limits" as const,
      maxLines: 28,
      priority: 20,
      feedback: "Keep the answer within 28 lines.",
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
  sourceBatchId: levelUnlockBatch033Id,
  revision: 1,
  curriculumVersion,
  contentVariant: index === 0 ? "link-and-email" : "list-and-url",
}))

export const levelUnlockBatch033Problems: readonly NormalizedProblem[] = [
  ...singleProblems,
  ...mixedProblems,
]
