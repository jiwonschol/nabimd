import type { FixtureRole, ProblemFixture } from "../types"
import { listBatch004Problems } from "./listBatch004Problems"

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

function createListFixtures(
  problem: (typeof listBatch004Problems)[number],
  index: number,
): ProblemFixture[] {
  const differentItems = [`New item ${index + 1}`, "Anything works", "Last idea"]
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
    { role: "different-prose", source: differentItems.map((item) => `- ${item}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "case-spelling-variation", source: "- MISPELED WORDS\n- lowercase text\n- punctuation!", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "asterisk-bullet", source: differentItems.map((item) => `* ${item}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "plus-bullet", source: differentItems.map((item) => `+ ${item}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "blockquote-list", source: differentItems.map((item) => `> - ${item}`).join("\n"), expectedStatus: "matched", expectedReviewIds: [] },
    { role: "missing", source: differentItems.join("\n"), expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "malformed", source: differentItems.map((item) => `-${item}`).join("\n"), expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "edge-case", kind: "ordered-list", source: differentItems.map((item, itemIndex) => `${itemIndex + 1}. ${item}`).join("\n"), expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "edge-case", kind: "too-short-list", source: `- ${differentItems[0]}\n- ${differentItems[1]}`, expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "edge-case", kind: "inline-code-list", source: differentItems.map((item) => `\`- ${item}\``).join("\n\n"), expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "edge-case", kind: "empty-list", source: "-\n-\n-", expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "edge-case", kind: "image-alt-list", source: "- ![One](one.png)\n- ![Two](two.png)\n- ![Three](three.png)", expectedStatus: "matched", expectedReviewIds: [] },
    { role: "edge-case", kind: "empty-image-alt-list", source: "- ![](one.png)\n- ![](two.png)\n- ![](three.png)", expectedStatus: "fail", expectedFeedbackId: "use-bullet-list", exercisesCheckId: "use-bullet-list" },
    { role: "matched-with-review", kind: "multiple-lists", source: `- One\n- Two\n- Three\n\nA short bridge.\n\n- Four\n- Five\n- Six`, expectedStatus: "matched", expectedReviewIds: ["keep-one-list"] },
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

export const listBatch004Fixtures: readonly ProblemFixture[] =
  listBatch004Problems.flatMap(createListFixtures)
