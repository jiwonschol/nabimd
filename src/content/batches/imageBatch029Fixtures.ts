import type { ProblemFixture } from "../types"
import { imageBatch028Fixtures } from "./imageBatch028Fixtures"
import { imageBatch029Problems } from "./imageBatch029Problems"

const upgradedFixtures: readonly ProblemFixture[] = imageBatch028Fixtures.map(
  (fixture) => ({
    ...fixture,
    problemRevision: 3,
  }),
)

const sourceBoundaryFixtures: readonly ProblemFixture[] =
  imageBatch029Problems.flatMap((problem) => {
    const fail = {
      expectedFeedbackId: "use-image",
      exercisesCheckId: "use-image",
    } as const

    // Delimiter regressions use `]()` rather than only `](` because a wrong
    // delimiter is observable to the nonempty check only when its tail is empty.
    return [
      {
        id: `${problem.id}-title-close-bracket`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: '![A lantern at dusk](/photos/lantern.jpg "Evening ] walk")',
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
      {
        id: `${problem.id}-title-open-parenthesis`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: '![A lantern at dusk](/photos/lantern.jpg "Evening ( walk")',
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
      {
        id: `${problem.id}-title-delimiter-sequence`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: '![A lantern at dusk](/photos/lantern.jpg "Evening ]( walk")',
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
      {
        id: `${problem.id}-title-ending-delimiter-sequence`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: '![A lantern at dusk](/photos/lantern.jpg "title ]()")',
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
      {
        id: `${problem.id}-space-only-image-address`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: "![A lantern at dusk](   )",
        expectedStatus: "fail",
        ...fail,
      },
      {
        id: `${problem.id}-angle-empty-image-address`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: "![A lantern at dusk](<>)",
        expectedStatus: "fail",
        ...fail,
      },
      {
        id: `${problem.id}-nul-image-address`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: "![A lantern at dusk](<\u0000>)",
        expectedStatus: "fail",
        ...fail,
      },
      {
        id: `${problem.id}-single-visible-character-alt`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: "![a](/photos/lantern.jpg)",
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
      {
        id: `${problem.id}-escaped-delimiter-sequence-inside-alt`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: "![a \\]() b](/photos/lantern.jpg)",
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
      {
        id: `${problem.id}-escaped-tight-delimiter-sequence-inside-alt`,
        problemId: problem.id,
        problemRevision: 3,
        role: "edge-case",
        kind: "normalized-whitespace",
        source: "![a \\]()](/photos/lantern.jpg)",
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
    ] satisfies readonly ProblemFixture[]
  })

export const imageBatch029Fixtures: readonly ProblemFixture[] = [
  ...upgradedFixtures,
  ...sourceBoundaryFixtures,
]
