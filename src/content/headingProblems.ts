import type { Problem } from "./types"
import headingBank from "./generated/headingBank.generated.json"

const sharedHints = [
  "Use one hash symbol to make a main heading.",
  "Type one hash symbol, one space, then the title.",
  "Example: `# Team update`",
] as const

const sharedTeaching = {
  concept: "A main heading names the whole document.",
  howTo: "Start a line with one hash, add a space, then type the title.",
  example: "# Weather",
} as const

const singleTitleCheck = {
  id: "one-document-title",
  kind: "single-h1",
  review:
    "Keep one H1 as the document title; use lower heading levels for sections.",
} as const

const exactTargetCheck = {
  id: "matches-target-exactly",
  kind: "matches-target-exactly",
  review:
    "Your document renders more than the goal — remove the extra emphasis/content to match it exactly.",
} as const

type HeadingProblemInput = {
  id: string
  text: string
  teachingMode: Problem["teachingMode"]
  preserveFeedback: string
}

export function parseTeachingMode(value: unknown): Problem["teachingMode"] {
  if (value === "introduce" || value === "recall") return value

  throw new Error(`Invalid generated teaching mode: ${String(value)}`)
}

function createHeadingProblem({
  id,
  text,
  teachingMode,
  preserveFeedback,
}: HeadingProblemInput): Problem {
  return {
    id,
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    teachingMode,
    teaching: sharedTeaching,
    syntaxTokens: ["#", "Space", "Title"],
    title: "Main heading",
    prompt: "Rebuild the heading below in Markdown.",
    target: `# ${text}`,
    starterText: "",
    protectedContent: [text],
    matchChecks: [
      {
        id: "space-after-hash",
        kind: "heading-spacing",
        level: 1,
        text,
        priority: 10,
        feedback: "Add one space after the hash symbol.",
      },
      {
        id: `match-${id.replace("heading-", "")}-capitalization`,
        kind: "heading-capitalization",
        level: 1,
        text,
        priority: 15,
        feedback: `Close — match the capitalization: the goal says '${text}'.`,
      },
      {
        id: `preserve-${id.replace("heading-", "")}`,
        kind: "preserves-text",
        text,
        priority: 20,
        feedback: preserveFeedback,
      },
      {
        id: "use-hash-heading-style",
        kind: "hash-heading-style",
        level: 1,
        text,
        priority: 25,
        feedback: `That's a real heading! Markdown has two heading styles — this quest practices the hash style. Try: # ${text}`,
      },
      {
        id: "use-h1-heading",
        kind: "has-heading",
        level: 1,
        text,
        priority: 30,
        feedback: "Start the title with one hash symbol and one space.",
      },
    ],
    editorialChecks: [exactTargetCheck, singleTitleCheck],
    hints: sharedHints,
    retryFamily: "heading-h1",
    reviewTags: ["one-document-title"],
  }
}

const generatedHeadingProblems = headingBank.map(
  ({ id, text, teachingMode }) =>
    createHeadingProblem({
      id,
      text,
      teachingMode: parseTeachingMode(teachingMode),
      preserveFeedback: `${text.includes(" ") ? "Keep the words" : "Keep the word"} ‘${text}’ in your answer.`,
    }),
)

if (!generatedHeadingProblems[0]) {
  throw new Error("The generated heading bank must not be empty")
}

export const headingProblems = generatedHeadingProblems as [
  Problem,
  ...Problem[],
]

export function getHeadingProblem(id: string): Problem {
  const problem = headingProblems.find((candidate) => candidate.id === id)

  if (!problem) {
    throw new Error(`Unknown heading problem: ${id}`)
  }

  return problem
}
