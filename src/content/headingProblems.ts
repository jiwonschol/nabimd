import type { Problem } from "./types"

const sharedHints = [
  "Use one hash symbol to make a main heading.",
  "Type one hash symbol, one space, then the title.",
  "Example: `# Team update`",
] as const

const singleTitleCheck = {
  id: "one-document-title",
  kind: "single-h1",
  review:
    "Keep one H1 as the document title; use lower heading levels for sections.",
} as const

type HeadingProblemInput = {
  id: string
  text: string
  teachingMode: Problem["teachingMode"]
  preserveFeedback: string
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
        id: `preserve-${id.replace("heading-", "")}`,
        kind: "preserves-text",
        text,
        priority: 20,
        feedback: preserveFeedback,
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
    editorialChecks: [singleTitleCheck],
    hints: sharedHints,
    retryFamily: "heading-h1",
    reviewTags: ["one-document-title"],
  }
}

export const headingProblems = [
  createHeadingProblem({
    id: "heading-apple",
    text: "Apple",
    teachingMode: "introduce",
    preserveFeedback: "Keep the word ‘Apple’ in your answer.",
  }),
  createHeadingProblem({
    id: "heading-rainy-day",
    text: "Rainy day",
    teachingMode: "recall",
    preserveFeedback: "Keep the words ‘Rainy day’ in your answer.",
  }),
  createHeadingProblem({
    id: "heading-study-tools",
    text: "Study tools",
    teachingMode: "recall",
    preserveFeedback: "Keep the words ‘Study tools’ in your answer.",
  }),
] as const satisfies readonly Problem[]

export function getHeadingProblem(id: string): Problem {
  const problem = headingProblems.find((candidate) => candidate.id === id)

  if (!problem) {
    throw new Error(`Unknown heading problem: ${id}`)
  }

  return problem
}
