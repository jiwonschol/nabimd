import type { ProblemFixture } from "./types"

function createHeadingFixtures(
  problemId: string,
  text: string,
): ProblemFixture[] {
  return [
    {
      problemId,
      kind: "canonical",
      source: `# ${text}`,
      expectedStatus: "perfect",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "alternate",
      source: `# ${text} #`,
      expectedStatus: "perfect",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "missing",
      source: text,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "malformed",
      source: `#${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      problemId,
      kind: "matched-with-refinement",
      source: `# ${text}\n\n# Details`,
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
    },
    {
      problemId,
      kind: "perfect",
      source: `# ${text}`,
      expectedStatus: "perfect",
      expectedReviewIds: [],
    },
  ]
}

export const headingProblemFixtures = [
  ...createHeadingFixtures("heading-apple", "Apple"),
  ...createHeadingFixtures("heading-rainy-day", "Rainy day"),
  ...createHeadingFixtures("heading-study-tools", "Study tools"),
] as const satisfies readonly ProblemFixture[]
