import type { Problem } from "./types"

const sharedHints = [
  "Turn the line into the document's main heading.",
  "Type one hash symbol, one space, then the title.",
  "Example: `# Team update`",
] as const

const singleTitleCheck = {
  id: "one-document-title",
  kind: "single-h1",
  review:
    "Keep one H1 as the document title; use lower heading levels for sections.",
} as const

export const headingProblems = [
  {
    id: "heading-project-notes",
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    title: "Make a document title",
    prompt: "Turn Project notes into the document's main heading.",
    target: "# Project notes",
    starterText: "Project notes",
    protectedContent: ["Project notes"],
    matchChecks: [
      {
        id: "space-after-hash",
        kind: "heading-spacing",
        level: 1,
        text: "Project notes",
        priority: 10,
        feedback: "Add one space after the hash symbol.",
      },
      {
        id: "preserve-project-notes",
        kind: "preserves-text",
        text: "Project notes",
        priority: 20,
        feedback: "Keep the words ‘Project notes’ in your answer.",
      },
      {
        id: "use-h1-heading",
        kind: "has-heading",
        level: 1,
        text: "Project notes",
        priority: 30,
        feedback: "Start the title with one hash symbol and one space.",
      },
    ],
    editorialChecks: [singleTitleCheck],
    hints: sharedHints,
    retryFamily: "heading-h1",
    reviewTags: ["one-document-title"],
  },
  {
    id: "heading-weekend-guide",
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    title: "Make a document title",
    prompt: "Turn Weekend guide into the document's main heading.",
    target: "# Weekend guide",
    starterText: "Weekend guide",
    protectedContent: ["Weekend guide"],
    matchChecks: [
      {
        id: "space-after-hash",
        kind: "heading-spacing",
        level: 1,
        text: "Weekend guide",
        priority: 10,
        feedback: "Add one space after the hash symbol.",
      },
      {
        id: "preserve-weekend-guide",
        kind: "preserves-text",
        text: "Weekend guide",
        priority: 20,
        feedback: "Keep the words ‘Weekend guide’ in your answer.",
      },
      {
        id: "use-h1-heading",
        kind: "has-heading",
        level: 1,
        text: "Weekend guide",
        priority: 30,
        feedback: "Start the title with one hash symbol and one space.",
      },
    ],
    editorialChecks: [singleTitleCheck],
    hints: sharedHints,
    retryFamily: "heading-h1",
    reviewTags: ["one-document-title"],
  },
  {
    id: "heading-reading-list",
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    title: "Make a document title",
    prompt: "Turn Summer reading list into the document's main heading.",
    target: "# Summer reading list",
    starterText: "Summer reading list",
    protectedContent: ["Summer reading list"],
    matchChecks: [
      {
        id: "space-after-hash",
        kind: "heading-spacing",
        level: 1,
        text: "Summer reading list",
        priority: 10,
        feedback: "Add one space after the hash symbol.",
      },
      {
        id: "preserve-summer-reading-list",
        kind: "preserves-text",
        text: "Summer reading list",
        priority: 20,
        feedback: "Keep the words ‘Summer reading list’ in your answer.",
      },
      {
        id: "use-h1-heading",
        kind: "has-heading",
        level: 1,
        text: "Summer reading list",
        priority: 30,
        feedback: "Start the title with one hash symbol and one space.",
      },
    ],
    editorialChecks: [singleTitleCheck],
    hints: sharedHints,
    retryFamily: "heading-h1",
    reviewTags: ["one-document-title"],
  },
] as const satisfies readonly Problem[]

export function getHeadingProblem(id: string): Problem {
  const problem = headingProblems.find((candidate) => candidate.id === id)

  if (!problem) {
    throw new Error(`Unknown heading problem: ${id}`)
  }

  return problem
}
