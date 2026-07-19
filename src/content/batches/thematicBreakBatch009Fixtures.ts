import type { FixtureRole, ProblemFixture } from "../types"
import {
  thematicBreakBatch009Inputs,
  thematicBreakBatch009Problems,
} from "./thematicBreakBatch009Problems"

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

function varyCanonicalProse(source: string): string {
  const uppercase = source.toUpperCase()
  const vowelIndex = uppercase.search(/[AEIOU]/)
  if (vowelIndex < 0) {
    throw new Error(`Thematic-break prose has no vowel to vary: ${source}`)
  }
  return `${uppercase.slice(0, vowelIndex)}${uppercase.slice(vowelIndex + 1)}`
}

type FixtureInput = {
  role: FixtureRole
  kind?: ProblemFixture["kind"]
  source: string
  expectedStatus: ProblemFixture["expectedStatus"]
  expectedFeedbackId?: string
  exercisesCheckId?: string
  expectedReviewIds?: readonly string[]
}

function createThematicBreakFixtures(
  problem: (typeof thematicBreakBatch009Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = thematicBreakBatch009Inputs[index]!
  const canonicalBefore = varyCanonicalProse(input.before)
  const canonicalAfter = input.after.toUpperCase()
  const alternate = `${input.alternateBefore}\n\n***\n\n${input.alternateAfter}`
  const fail = {
    expectedStatus: "fail" as const,
    expectedFeedbackId: "use-divider",
    exercisesCheckId: "use-divider",
  }
  const matched = {
    expectedStatus: "matched" as const,
    expectedReviewIds: [] as const,
  }
  const review = {
    expectedStatus: "matched" as const,
    expectedReviewIds: ["keep-one-divider"] as const,
  }
  const fixtures: readonly FixtureInput[] = [
    { role: "canonical", source: problem.target, ...matched },
    { role: "different-prose", source: alternate, ...matched },
    { role: "case-spelling-variation", source: `${canonicalBefore}\n\n___\n\n${canonicalAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-asterisk", source: `${input.alternateBefore}\n\n***\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-underscore", source: `${input.alternateBefore}\n\n___\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-spaced-dash", source: `${input.alternateBefore}\n\n- - -\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-spaced-asterisk", source: `${input.alternateBefore}\n\n* * *\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-spaced-underscore", source: `${input.alternateBefore}\n\n_ _ _\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-tab-spaced", source: `${input.alternateBefore}\n\n-\t-\t-\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-long-run", source: `${input.alternateBefore}\n\n--------\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-three-space-indent", source: `${input.alternateBefore}\n\n   ___\n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-trailing-whitespace", source: `${input.alternateBefore}\n\n***   \n\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-interrupting-asterisk", source: `${input.alternateBefore}\n***\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-interrupting-underscore", source: `${input.alternateBefore}\n___\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-interrupting-spaced-dash", source: `${input.alternateBefore}\n- - -\n${input.alternateAfter}`, ...matched },
    { role: "edge-case", kind: "thematic-break-comment-plus-rule", source: `<!-- note ${index + 1} -->\n\n---`, ...matched },
    { role: "edge-case", kind: "thematic-break-html-plus-rule", source: `<div>note ${index + 1}</div>\n\n***`, ...matched },
    { role: "edge-case", kind: "thematic-break-malformed-plus-rule", source: `--\n\n___`, ...matched },
    { role: "edge-case", kind: "thematic-break-blockquote-wrapper", source: "> ---", ...matched },
    { role: "edge-case", kind: "thematic-break-list-wrapper", source: `- Item ${index + 1}\n\n  ***`, ...matched },
    { role: "edge-case", kind: "thematic-break-ordered-list-wrapper", source: `1. Item ${index + 1}\n\n   ___`, ...matched },
    { role: "matched-with-review", kind: "thematic-break-two-root", source: `${input.before}\n\n---\n\n${input.after}\n\n***`, ...review },
    { role: "matched-with-review", kind: "thematic-break-root-plus-nested", source: `---\n\n> ***`, ...review },
    { role: "matched-with-review", kind: "thematic-break-two-nested", source: "> ---\n> ***", ...review },
    { role: "missing", source: `${input.before}\n\n${input.after}`, ...fail },
    { role: "malformed", kind: "thematic-break-two-dashes", source: `${input.before}\n\n--\n\n${input.after}`, ...fail },
    { role: "edge-case", kind: "thematic-break-setext-heading", source: `${input.before}\n---\n${input.after}`, ...fail },
    { role: "edge-case", kind: "thematic-break-long-setext-heading", source: `${input.before}\n-----\n${input.after}`, ...fail },
    { role: "edge-case", kind: "thematic-break-nested-setext-heading", source: `- Item ${index + 1}\n  ---`, ...fail },
    { role: "edge-case", kind: "thematic-break-four-space-code", source: "    ---", ...fail },
    { role: "edge-case", kind: "thematic-break-tab-indent-code", source: "\t***", ...fail },
    { role: "edge-case", kind: "thematic-break-two-asterisks", source: "**", ...fail },
    { role: "edge-case", kind: "thematic-break-two-underscores", source: "__", ...fail },
    { role: "edge-case", kind: "thematic-break-plus-signs", source: "+++", ...fail },
    { role: "edge-case", kind: "thematic-break-equals-signs", source: "===", ...fail },
    { role: "edge-case", kind: "thematic-break-mixed-marks", source: "-*-", ...fail },
    { role: "edge-case", kind: "thematic-break-mixed-spaced-marks", source: "- * -", ...fail },
    { role: "edge-case", kind: "thematic-break-trailing-words", source: "--- note", ...fail },
    { role: "edge-case", kind: "thematic-break-trailing-hash", source: "--- #", ...fail },
    { role: "edge-case", kind: "thematic-break-emphasis", source: "***word***", ...fail },
    { role: "edge-case", kind: "thematic-break-nested-star-list", source: "* * * item", ...fail },
    { role: "edge-case", kind: "thematic-break-plain-punctuation", source: "Before --- after", ...fail },
    { role: "edge-case", kind: "thematic-break-escaped-markers", source: "\\-\\-\\-", ...fail },
    { role: "edge-case", kind: "thematic-break-fullwidth-hyphens", source: "－－－", ...fail },
    { role: "edge-case", kind: "thematic-break-em-dashes", source: "———", ...fail },
    { role: "edge-case", kind: "thematic-break-inline-code", source: "`---`", ...fail },
    { role: "edge-case", kind: "thematic-break-fenced-code", source: "```md\n---\n```", ...fail },
    { role: "edge-case", kind: "thematic-break-comment-only", source: "<!-- --- -->", ...fail },
    { role: "edge-case", kind: "thematic-break-raw-html", source: "<hr>", ...fail },
    { role: "edge-case", kind: "thematic-break-link-label", source: "[---](/path)", ...fail },
    { role: "edge-case", kind: "thematic-break-image-alt", source: "![---](/image.png)", ...fail },
    { role: "edge-case", kind: "thematic-break-definition", source: "[guide]: ---", ...fail },
    { role: "edge-case", kind: "thematic-break-escaped-blockquote", source: "> \\-\\-\\-", ...fail },
  ]

  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.role}-${fixture.kind ?? fixtureKind(fixture.role)}`,
    problemId: problem.id,
    problemRevision: problem.revision,
    role: fixture.role,
    kind: fixture.kind ?? fixtureKind(fixture.role),
    source: fixture.source,
    expectedStatus: fixture.expectedStatus,
    ...(fixture.expectedFeedbackId
      ? { expectedFeedbackId: fixture.expectedFeedbackId }
      : {}),
    ...(fixture.exercisesCheckId
      ? { exercisesCheckId: fixture.exercisesCheckId }
      : {}),
    ...(fixture.expectedReviewIds
      ? { expectedReviewIds: fixture.expectedReviewIds }
      : {}),
  }))
}

export const thematicBreakBatch009Fixtures: readonly ProblemFixture[] =
  thematicBreakBatch009Problems.flatMap(createThematicBreakFixtures)
