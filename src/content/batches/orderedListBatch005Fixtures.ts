import type { FixtureRole, ProblemFixture } from "../types"
import { orderedListBatch005Problems } from "./orderedListBatch005Problems"

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

function createOrderedListFixtures(
  problem: (typeof orderedListBatch005Problems)[number],
  index: number,
): ProblemFixture[] {
  const differentSteps = [`New step ${index + 1}`, "Anything works", "Last step"]
  const fail = {
    expectedStatus: "fail" as const,
    expectedFeedbackId: "use-numbered-list",
    exercisesCheckId: "use-numbered-list",
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
    { role: "different-prose", source: differentSteps.map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "case-spelling-variation", source: "1. MISPELED WORDS\n2. lowercase text\n3. punctuation!", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "repeated-one", source: differentSteps.map((step) => `1. ${step}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "parenthesis-marker", source: differentSteps.map((step, stepIndex) => `${stepIndex + 1}) ${step}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "non-one-start", source: differentSteps.map((step, stepIndex) => `${stepIndex + 4}. ${step}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "nonsequential-numbers", source: `4. ${differentSteps[0]}\n8. ${differentSteps[1]}\n2. ${differentSteps[2]}`, expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-list", source: differentSteps.map((step, stepIndex) => `> ${stepIndex + 1}. ${step}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "image-alt-list", source: "1. ![One](one.png)\n2. ![Two](two.png)\n3. ![Three](three.png)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "missing", source: differentSteps.join("\n"), ...fail },
    { role: "malformed", source: differentSteps.map((step, stepIndex) => `${stepIndex + 1}.${step}`).join("\n"), ...fail },
    { role: "edge-case", kind: "unordered-list", source: differentSteps.map((step) => `- ${step}`).join("\n"), ...fail },
    { role: "edge-case", kind: "too-short-list", source: `1. ${differentSteps[0]}\n2. ${differentSteps[1]}`, ...fail },
    { role: "edge-case", kind: "one-empty-item", source: `1. ${differentSteps[0]}\n2.\n3. ${differentSteps[2]}`, ...fail },
    { role: "edge-case", kind: "split-two-plus-one", source: `1. ${differentSteps[0]}\n2. ${differentSteps[1]}\n\nA short bridge.\n\n1. ${differentSteps[2]}`, ...fail },
    { role: "edge-case", kind: "inline-code-list", source: differentSteps.map((step, stepIndex) => `\`${stepIndex + 1}. ${step}\``).join("\n\n"), ...fail },
    { role: "edge-case", kind: "fenced-code-list", source: "```md\n1. One\n2. Two\n3. Three\n```", ...fail },
    { role: "edge-case", kind: "indented-code-list", source: "    1. One\n    2. Two\n    3. Three", ...fail },
    { role: "edge-case", kind: "empty-list", source: "1.\n2.\n3.", ...fail },
    { role: "edge-case", kind: "empty-image-alt-list", source: "1. ![](one.png)\n2. ![](two.png)\n3. ![](three.png)", ...fail },
    { role: "edge-case", kind: "nested-under-unordered", source: "- Parent\n  1. One\n  2. Two\n  3. Three", ...fail },
    { role: "edge-case", kind: "mixed-delimiters", source: "1. One\n2) Two\n3. Three", ...fail },
    { role: "edge-case", kind: "blank-lines", source: "1. One\n\n2. Two\n\n3. Three", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "matched-with-review", kind: "nested-under-ordered", source: "1. Parent\n   1. One\n   2. Two\n   3. Three", expectedStatus: "matched", expectedReviewIds: ["keep-one-ordered-list"] },
    { role: "edge-case", kind: "empty-parents-with-children", source: "1.\n   1. Child one\n2.\n   1. Child two\n3.\n   1. Child three", ...fail },
    { role: "matched-with-review", kind: "multiple-lists", source: "1. One\n2. Two\n3. Three\n\nA short bridge.\n\n1. Four\n2. Five\n3. Six", expectedStatus: "matched", expectedReviewIds: ["keep-one-ordered-list"] },
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

export const orderedListBatch005Fixtures: readonly ProblemFixture[] =
  orderedListBatch005Problems.flatMap(createOrderedListFixtures)
