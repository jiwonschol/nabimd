import type { FixtureRole, ProblemFixture } from "../types"
import { blockquoteBatch006Problems } from "./blockquoteBatch006Problems"

function fixtureKind(role: FixtureRole): ProblemFixture["kind"] {
  switch (role) {
    case "canonical":
      return "canonical"
    case "different-prose":
      return "alternate"
    case "case-spelling-variation":
      return "case-variation"
    case "missing":
      return "missing"
    case "malformed":
      return "malformed"
    case "matched-with-review":
      return "matched-with-refinement"
    case "edge-case":
      return "normalized-whitespace"
  }
}

function createBlockquoteFixtures(
  problem: (typeof blockquoteBatch006Problems)[number],
  index: number,
): ProblemFixture[] {
  const alternate = `New callout ${index + 1}.`
  const fail = {
    expectedStatus: "fail" as const,
    expectedFeedbackId: "use-blockquote",
    exercisesCheckId: "use-blockquote",
  }
  const fixtures: readonly {
    role: FixtureRole
    kind?: ProblemFixture["kind"]
    source: string
    expectedStatus: ProblemFixture["expectedStatus"]
    expectedFeedbackId?: string
    exercisesCheckId?: string
    expectedReviewIds?: readonly string[]
  }[] = [
    { role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "different-prose", source: `> ${alternate}`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "case-spelling-variation", source: "> COMPLETELY DIFFRENT words!", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-no-space", source: `>${alternate}`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-three-space-indent", source: `   > ${alternate}`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-lazy-continuation", source: `> First line ${index + 1}\ncontinued words`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-image-alt", source: "> ![Useful description](photo.png)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-heading-content", source: "> # Different heading", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-list-content", source: "> - Different item", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-code-content", source: ">     visible code", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-list-wrapper", source: "- Parent\n  > Nested quote", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "matched-with-review", kind: "nested-blockquote", source: "> Outer words\n>> Inner words", expectedStatus: "matched", expectedReviewIds: ["keep-one-blockquote"] },
    { role: "matched-with-review", kind: "multiple-blockquotes", source: "> First callout\n\nBridge text.\n\n> Second callout", expectedStatus: "matched", expectedReviewIds: ["keep-one-blockquote"] },
    { role: "missing", source: alternate, ...fail },
    { role: "malformed", kind: "empty-blockquote", source: ">", ...fail },
    { role: "edge-case", kind: "empty-image-alt-blockquote", source: "> ![](photo.png)", ...fail },
    { role: "edge-case", kind: "thematic-break-blockquote", source: "> ---", ...fail },
    { role: "edge-case", kind: "blockquote-nbsp-only", source: "> &nbsp;", ...fail },
    { role: "edge-case", kind: "blockquote-zero-width-only", source: "> &#x200B;", ...fail },
    { role: "edge-case", kind: "blockquote-definition-only", source: "> [label]: /url", ...fail },
    { role: "edge-case", kind: "blockquote-comment-only", source: "> <!-- hidden -->", ...fail },
    { role: "edge-case", kind: "blockquote-empty-html-only", source: "> <div></div>", ...fail },
    { role: "edge-case", kind: "escaped-blockquote", source: "\\> Escaped marker", ...fail },
    { role: "edge-case", kind: "inline-code-blockquote", source: "`> Inline lookalike`", ...fail },
    { role: "edge-case", kind: "fenced-code-blockquote", source: "```md\n> Fenced lookalike\n```", ...fail },
    { role: "edge-case", kind: "indented-code-blockquote", source: "    > Indented lookalike", ...fail },
    { role: "edge-case", kind: "html-blockquote", source: "<blockquote>HTML lookalike</blockquote>", ...fail },
    { role: "edge-case", kind: "blockquote-fullwidth-marker", source: "＞ Fullwidth marker", ...fail },
  ]

  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.role}-${fixture.kind ?? fixtureKind(fixture.role)}`,
    problemId: problem.id,
    problemRevision: problem.revision,
    role: fixture.role,
    kind: fixture.kind ?? fixtureKind(fixture.role),
    source: fixture.source,
    expectedStatus: fixture.expectedStatus,
    ...(fixture.expectedFeedbackId ? { expectedFeedbackId: fixture.expectedFeedbackId } : {}),
    ...(fixture.exercisesCheckId ? { exercisesCheckId: fixture.exercisesCheckId } : {}),
    ...(fixture.expectedReviewIds ? { expectedReviewIds: fixture.expectedReviewIds } : {}),
  }))
}

export const blockquoteBatch006Fixtures: readonly ProblemFixture[] =
  blockquoteBatch006Problems.flatMap(createBlockquoteFixtures)
