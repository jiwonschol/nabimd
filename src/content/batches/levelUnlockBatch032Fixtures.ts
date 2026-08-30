import type { FixtureRole, ProblemFixture, SyntaxPresenceKind } from "../types"
import { levelUnlockBatch032Problems } from "./levelUnlockBatch032Problems"

type FixtureSources = {
  different: string
  caseVariation: string
  missing: string
  malformed: string
}

const singleSources: Readonly<Record<Exclude<SyntaxPresenceKind, "heading-id">, FixtureSources>> = {
  "bold-italic": { different: "***Fresh words***", caseVariation: "___FRESH WORDS___", missing: "Fresh words", malformed: "**Fresh words*" },
  strikethrough: { different: "~~Earlier plan~~", caseVariation: "~~EARLIER PLAN~~", missing: "Earlier plan", malformed: "~Earlier plan~" },
  "nested-blockquote": { different: "> Topic\n> > Detail", caseVariation: "> TOPIC\n> > DETAIL", missing: "> Topic\n> Detail", malformed: "> Topic\n> Reply" },
  "code-block-language": { different: "```html\n<p>Hi</p>\n```", caseVariation: "```HTML\n<P>HI</P>\n```", missing: "```\nplain\n```", malformed: "    plain code" },
  "hard-line-break": { different: "Left  \nRight", caseVariation: "LEFT  \nRIGHT", missing: "Left\nRight", malformed: "Left \nRight" },
  "automatic-url": { different: "Visit https://example.net", caseVariation: "VISIT https://EXAMPLE.NET", missing: "Visit example.net", malformed: "Visit [site](https://example.net)" },
  "link-title": { different: "[Help](https://example.net \"Details\")", caseVariation: "[HELP](https://EXAMPLE.NET \"DETAILS\")", missing: "[Help](https://example.net)", malformed: "[Help](https://example.net \"\")" },
  "angle-bracket-url": { different: "<https://example.net/help>", caseVariation: "<https://EXAMPLE.NET/HELP>", missing: "https://example.net/help", malformed: "[Help](https://example.net/help)" },
  "angle-bracket-email": { different: "<help@example.net>", caseVariation: "<HELP@EXAMPLE.NET>", missing: "help@example.net", malformed: "[Email](mailto:help@example.net)" },
  escape: { different: "\\_Literal underscores\\_", caseVariation: "\\_LITERAL UNDERSCORES\\_", missing: "Literal underscores", malformed: "_Formatted underscores_" },
  "list-with-block": { different: "- Item\n\n  > Detail", caseVariation: "- ITEM\n\n  > DETAIL", missing: "- Item\n  - Detail", malformed: "- Item\n\n> Detail" },
  footnote: { different: "Claim[^a].\n\n[^a]: Source", caseVariation: "CLAIM[^A].\n\n[^A]: SOURCE", missing: "Claim with a source.", malformed: "Claim[1].\n\n[1]: Source" },
}

function kind(role: FixtureRole): ProblemFixture["kind"] {
  if (role === "different-prose") return "alternate"
  if (role === "case-spelling-variation") return "case-variation"
  if (role === "matched-with-review") return "matched-with-refinement"
  if (role === "edge-case") return "extra-paragraph"
  return role
}

function fixture(problemId: string, role: FixtureRole, source: string, expectedStatus: ProblemFixture["expectedStatus"], extra: Pick<ProblemFixture, "expectedFeedbackId" | "exercisesCheckId" | "expectedReviewIds"> = {}): ProblemFixture {
  return {
    id: `${problemId}-${role}`,
    problemId,
    problemRevision: 1,
    role,
    kind: kind(role),
    source,
    expectedStatus,
    ...extra,
  }
}

function singleFixtures(problem: (typeof levelUnlockBatch032Problems)[number]): readonly ProblemFixture[] {
  const syntax = problem.skillIds[0] as Exclude<SyntaxPresenceKind, "heading-id">
  const sources = singleSources[syntax]
  const checkId = `use-${syntax}`
  const matched = { expectedReviewIds: [] } as const
  const failed = { expectedFeedbackId: checkId, exercisesCheckId: checkId } as const
  const fixtures = [
    fixture(problem.id, "canonical", problem.target, "matched", matched),
    fixture(problem.id, "different-prose", sources.different, "matched", matched),
    fixture(problem.id, "case-spelling-variation", sources.caseVariation, "matched", matched),
    fixture(problem.id, "missing", sources.missing, "fail", failed),
    fixture(problem.id, "malformed", sources.malformed, "fail", failed),
    fixture(problem.id, "matched-with-review", `${sources.different}\n\nPlain follow-up.`, "matched", matched),
  ]
  if (problem.level === 3) {
    fixtures.push(fixture(problem.id, "edge-case", `${sources.different}\n${Array.from({ length: 28 }, (_, index) => `Plain line ${index + 1}.`).join("\n")}`, "fail", { expectedFeedbackId: "keep-short", exercisesCheckId: "keep-short" }))
  }
  return fixtures
}

function mixedFixtures(problem: (typeof levelUnlockBatch032Problems)[number]): readonly ProblemFixture[] {
  const [first, second] = problem.skillIds
  const isLinkMix = first === "link-title"
  const sources = isLinkMix
    ? {
        different: "[Map](https://example.net \"Office map\")\n\nEmail <help@example.net>.",
        caseVariation: "[MAP](https://EXAMPLE.NET \"OFFICE MAP\")\n\nEMAIL <HELP@EXAMPLE.NET>.",
        missing: "Guide and team email.",
        malformed: "[Map](https://example.net \"Office map\")\n\nEmail help@example.net.",
      }
    : {
        different: "- Reference\n\n  > Visit <https://example.net>.",
        caseVariation: "- REFERENCE\n\n  > VISIT <https://EXAMPLE.NET>.",
        missing: "Reference: example.net",
        malformed: "- Reference\n\n  > Visit https://example.net.",
      }
  const matched = { expectedReviewIds: [] } as const
  return [
    fixture(problem.id, "canonical", problem.target, "matched", matched),
    fixture(problem.id, "different-prose", sources.different, "matched", matched),
    fixture(problem.id, "case-spelling-variation", sources.caseVariation, "matched", matched),
    fixture(problem.id, "missing", sources.missing, "fail", { expectedFeedbackId: `use-${first}`, exercisesCheckId: `use-${first}` }),
    fixture(problem.id, "malformed", sources.malformed, "fail", { expectedFeedbackId: `use-${second}`, exercisesCheckId: `use-${second}` }),
    fixture(problem.id, "matched-with-review", `${sources.different}\n\nPlain follow-up.`, "matched", matched),
    fixture(problem.id, "edge-case", `${sources.different}\n${Array.from({ length: 28 }, (_, index) => `Plain line ${index + 1}.`).join("\n")}`, "fail", { expectedFeedbackId: "keep-short", exercisesCheckId: "keep-short" }),
  ]
}

export const levelUnlockBatch032Fixtures: readonly ProblemFixture[] =
  levelUnlockBatch032Problems.flatMap((problem) =>
    problem.skillIds.length === 1 ? singleFixtures(problem) : mixedFixtures(problem),
  )
