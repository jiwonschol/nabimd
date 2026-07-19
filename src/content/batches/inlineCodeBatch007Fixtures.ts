import type { FixtureRole, ProblemFixture } from "../types"
import { inlineCodeBatch007Problems } from "./inlineCodeBatch007Problems"

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

function createInlineCodeFixtures(
  problem: (typeof inlineCodeBatch007Problems)[number],
  index: number,
): ProblemFixture[] {
  const alternate = `different item ${index + 1}`
  const fail = {
    expectedStatus: "fail" as const,
    expectedFeedbackId: "use-inline-code",
    exercisesCheckId: "use-inline-code",
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
    { role: "different-prose", source: `Use \`${alternate}\`.`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "case-spelling-variation", source: "Use `COMPLETELY DIFFRENT words`.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "double-backtick-code", source: "Use ``value`part``.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "literal-backtick-inline-code", source: "Type `` ` ``.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "spaced-inline-code", source: "Use ` spaced words `.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "multiline-inline-code", source: "Use `line\nbreak`.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "inline-code-heading", source: "# Try `value`", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "inline-code-list-item", source: "- Set `mode`", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "inline-code-blockquote-content", source: "> Use `note`", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "inline-code-link-label", source: "[Open `file`](/path)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "inline-code-emphasis-wrapper", source: "**Use `value`**", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "entity-literal-inline-code", source: "Type `&nbsp;` literally.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "null-plus-visible-inline-code", source: "Use `\u0000visible`.", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "matched-with-review", kind: "multiple-inline-code", source: "Use `first` then `second`.", expectedStatus: "matched", expectedReviewIds: ["keep-one-inline-code"] },
    { role: "matched-with-review", kind: "empty-plus-real-inline-code", source: "` ` and `real`", expectedStatus: "matched", expectedReviewIds: ["keep-one-inline-code"] },
    { role: "missing", source: `Use ${alternate}.`, ...fail },
    { role: "malformed", kind: "unmatched-backtick", source: `Use \`${alternate}.`, ...fail },
    { role: "edge-case", kind: "mismatched-backticks", source: `Use \`\`${alternate}\`.`, ...fail },
    { role: "edge-case", kind: "whitespace-only-inline-code", source: "` `", ...fail },
    { role: "edge-case", kind: "nbsp-only-inline-code", source: "`\u00a0`", ...fail },
    { role: "edge-case", kind: "ideographic-space-only-inline-code", source: "`\u3000`", ...fail },
    { role: "edge-case", kind: "zero-width-only-inline-code", source: "`\u200b`", ...fail },
    { role: "edge-case", kind: "bom-bidi-only-inline-code", source: "`\ufeff\u200e\u200f`", ...fail },
    { role: "edge-case", kind: "control-only-inline-code", source: "`\u0001\u001b\u007f`", ...fail },
    { role: "edge-case", kind: "null-only-inline-code", source: "`\u0000`", ...fail },
    { role: "edge-case", kind: "braille-blank-only-inline-code", source: "`\u2800`", ...fail },
    { role: "edge-case", kind: "escaped-inline-code", source: "\\`value\\`", ...fail },
    { role: "edge-case", kind: "fenced-code-only", source: "```md\n`value`\n```", ...fail },
    { role: "edge-case", kind: "indented-code-only", source: "    `value`", ...fail },
    { role: "edge-case", kind: "raw-html-code", source: "<code>value</code>", ...fail },
    { role: "edge-case", kind: "inline-code-image-alt", source: "![`value`](/image.png)", ...fail },
    { role: "edge-case", kind: "inline-code-definition", source: "[`value`]: /url", ...fail },
    { role: "edge-case", kind: "inline-code-autolink", source: "<https://example.com/`value`>", ...fail },
    { role: "edge-case", kind: "inline-code-comment", source: "<!-- `value` -->", ...fail },
    { role: "edge-case", kind: "fullwidth-backtick", source: "｀value｀", ...fail },
    { role: "edge-case", kind: "apostrophe-code", source: "'value'", ...fail },
    { role: "edge-case", kind: "empty-backticks", source: "``", ...fail },
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

export const inlineCodeBatch007Fixtures: readonly ProblemFixture[] =
  inlineCodeBatch007Problems.flatMap(createInlineCodeFixtures)
