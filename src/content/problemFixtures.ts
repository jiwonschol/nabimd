import type { ProblemFixture } from "./types"
import { headingProblems } from "./headingProblems"

function createHeadingFixtures(
  problemId: string,
  text: string,
): ProblemFixture[] {
  const lowercaseText = text.toLocaleLowerCase()
  const normalizedWhitespaceSource = text.includes(" ")
    ? `# ${text.replace(" ", "\u00a0")}`
    : `#  ${text}`

  return [
    {
      problemId,
      kind: "canonical",
      source: `# ${text}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "alternate",
      source: `# ${text} #`,
      expectedStatus: "matched",
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
      kind: "leading-atx",
      source: `   # ${text}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "indented-code",
      source: `    # ${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "tab-separator",
      source: `#\t${text}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "fullwidth-hash",
      source: `＃ ${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "raw-html-h1",
      source: `<h1>${text}</h1>`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "h2",
      source: `## ${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "escaped-hash",
      source: `\\# ${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "blockquote-h1",
      source: `> # ${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "empty",
      source: "",
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
    {
      problemId,
      kind: "compound-missing-space",
      source: `#${text} today`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      problemId,
      kind: "lowercase-compound",
      source: `#${lowercaseText}`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      problemId,
      kind: "case-variation",
      source: `# ${lowercaseText}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "setext",
      source: `${text}\n=====`,
      expectedStatus: "fail",
      expectedFeedbackId: "use-hash-heading-style",
    },
    {
      problemId,
      kind: "nbsp-separator",
      source: `#\u00a0${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      problemId,
      kind: "ideographic-space-separator",
      source: `#\u3000${text}`,
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      problemId,
      kind: "inline-emphasis",
      source: `# **${text}**`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "inline-code",
      source: `# \`${text}\``,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "inline-link",
      source: `# [${text}](https://example.com)`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "extra-paragraph",
      source: `# ${text}\n\nExtra context.`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "extra-h2",
      source: `# ${text}\n\n## Details`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "duplicate-h1",
      source: `# ${text}\n\n# ${text}`,
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
    },
    {
      problemId,
      kind: "malformed-plus-correct",
      source: `#${text}\n\n# ${text}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      problemId,
      kind: "normalized-whitespace",
      source: normalizedWhitespaceSource,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
  ]
}

export const headingProblemFixtures: readonly ProblemFixture[] =
  headingProblems.flatMap((problem) =>
    createHeadingFixtures(problem.id, problem.protectedContent[0]!),
  )
