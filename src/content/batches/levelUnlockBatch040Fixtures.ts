import type { FixtureRole, ProblemFixture, SyntaxPresenceKind } from "../types"
import { levelUnlockBatch040Problems } from "./levelUnlockBatch040Problems"

type SupportedUnlockSyntax = Exclude<
  SyntaxPresenceKind,
  "heading-id" | "automatic-url"
>

type FixtureSources = {
  different: string
  caseVariation: string
  missing: string
  malformed: string
}

const singleSources: Readonly<Record<SupportedUnlockSyntax, FixtureSources>> = {
  "bold-italic": { different: "***Fresh words***", caseVariation: "___FRESH WORDS___", missing: "Fresh words", malformed: "**Fresh words*" },
  strikethrough: { different: "~~Earlier plan~~", caseVariation: "~~EARLIER PLAN~~", missing: "Earlier plan", malformed: "~Earlier plan~" },
  "nested-blockquote": { different: "> Topic\n> > Detail", caseVariation: "> TOPIC\n> > DETAIL", missing: "> Topic\n> Detail", malformed: "> Topic\n> Reply" },
  "code-block-language": { different: "```html\n<p>Hi</p>\n```", caseVariation: "```HTML\n<P>HI</P>\n```", missing: "```\nplain\n```", malformed: "    plain code" },
  "hard-line-break": { different: "Left  \nRight", caseVariation: "LEFT  \nRIGHT", missing: "Left\nRight", malformed: "Left \nRight" },
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

function fixture(problemId: string, role: FixtureRole, source: string, expectedStatus: ProblemFixture["expectedStatus"], extra: Pick<ProblemFixture, "expectedFeedbackId" | "exercisesCheckId" | "expectedReviewIds"> = {}, suffix: string = role): ProblemFixture {
  return {
    id: `${problemId}-${suffix}`,
    problemId,
    problemRevision: 1,
    role,
    kind: kind(role),
    source,
    expectedStatus,
    ...extra,
  }
}

function singleFixtures(problem: (typeof levelUnlockBatch040Problems)[number]): readonly ProblemFixture[] {
  const syntax = problem.skillIds[0] as SupportedUnlockSyntax
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
  if (syntax === "footnote") {
    fixtures.push(
      fixture(
        problem.id,
        "edge-case",
        "[^a]: Definition without a reference",
        "fail",
        failed,
        "unreferenced-definition",
      ),
    )
  }
  if (syntax === "escape") {
    fixtures.push(
      fixture(
        problem.id,
        "edge-case",
        "`\\*literal code\\*`",
        "fail",
        failed,
        "literal-code-backslashes",
      ),
    )
  }
  if (syntax === "angle-bracket-email") {
    fixtures.push(
      fixture(
        problem.id,
        "edge-case",
        "<mailto:foo>",
        "fail",
        failed,
        "mailto-uri",
      ),
    )
  }
  return fixtures
}

function mixedFixtures(problem: (typeof levelUnlockBatch040Problems)[number]): readonly ProblemFixture[] {
  const [first, second] = problem.skillIds
  const sourcesById: Readonly<Record<string, FixtureSources>> = {
    "l3-mixed-link-title-email": {
      different: "Guide\n\nRead the [map](https://example.net \"Office map\"), then email <help@example.net>.",
      caseVariation: "GUIDE\n\nREAD THE [MAP](https://EXAMPLE.NET \"OFFICE MAP\"), THEN EMAIL <HELP@EXAMPLE.NET>.",
      missing: "Guide\n\nEmail <help@example.net>.",
      malformed: "Guide\n\nRead the [map](https://example.net \"Office map\"), then email help@example.net.",
    },
    "l3-mixed-list-angle-url": {
      different: "Reference\n\n- > Visit <https://example.net>.",
      caseVariation: "REFERENCE\n\n- > VISIT <https://EXAMPLE.NET>.",
      missing: "Reference\n\nVisit <https://example.net>.",
      malformed: "Reference\n\n- > Visit https://example.net.",
    },
    "l3-mixed-escape-footnote": {
      different: "Template\n\nType \\_owner\\_ literally.[^a]\n\n[^a]: Form guide",
      caseVariation: "TEMPLATE\n\nTYPE \\_OWNER\\_ LITERALLY.[^A]\n\n[^A]: FORM GUIDE",
      missing: "Template\n\nType owner literally.[^a]\n\n[^a]: Form guide",
      malformed: "Template\n\nType \\_owner\\_ literally with source [1].",
    },
    "l3-mixed-link-title-url": {
      different: "Reference\n\nRead the [guide](https://example.edu \"Guide\"), then visit <https://example.edu/status>.",
      caseVariation: "REFERENCE\n\nREAD THE [GUIDE](https://EXAMPLE.EDU \"GUIDE\"), THEN VISIT <https://EXAMPLE.EDU/STATUS>.",
      missing: "Reference\n\nVisit <https://example.edu/status>.",
      malformed: "Reference\n\nRead the [guide](https://example.edu \"Guide\"), then visit https://example.edu/status.",
    },
    "l3-mixed-list-email": {
      different: "Handoff\n\n- > Email <team@example.org>.",
      caseVariation: "HANDOFF\n\n- > EMAIL <TEAM@EXAMPLE.ORG>.",
      missing: "Handoff\n\nEmail <team@example.org>.",
      malformed: "Handoff\n\n- > Email team@example.org.",
    },
  }
  const sources = sourcesById[problem.id]
  if (!sources) throw new Error(`Missing mixed fixture sources for ${problem.id}`)
  const matched = { expectedReviewIds: [] } as const
  const fixtures = [
    fixture(problem.id, "canonical", problem.target, "matched", matched),
    fixture(problem.id, "different-prose", sources.different, "matched", matched),
    fixture(problem.id, "case-spelling-variation", sources.caseVariation, "matched", matched),
    fixture(problem.id, "missing", sources.missing, "fail", { expectedFeedbackId: `use-${first}`, exercisesCheckId: `use-${first}` }),
    fixture(problem.id, "malformed", sources.malformed, "fail", { expectedFeedbackId: `use-${second}`, exercisesCheckId: `use-${second}` }),
    fixture(problem.id, "matched-with-review", `${sources.different}\n\nPlain follow-up.`, "matched", matched),
    fixture(problem.id, "edge-case", `${sources.different}\n${Array.from({ length: 28 }, (_, index) => `Plain line ${index + 1}.`).join("\n")}`, "fail", { expectedFeedbackId: "keep-short", exercisesCheckId: "keep-short" }),
  ]
  if (second === "angle-bracket-email") {
    const source = first === "link-title"
      ? '[Map](https://example.net "Office map")\n\nEmail <mailto:foo>.'
      : "- > Email <mailto:foo>."
    fixtures.push(
      fixture(
        problem.id,
        "edge-case",
        source,
        "fail",
        {
          expectedFeedbackId: `use-${second}`,
          exercisesCheckId: `use-${second}`,
        },
        "mailto-uri",
      ),
    )
  }
  return fixtures
}

export const levelUnlockBatch040Fixtures: readonly ProblemFixture[] =
  levelUnlockBatch040Problems.flatMap((problem) =>
    problem.skillIds.length === 1 ? singleFixtures(problem) : mixedFixtures(problem),
  )
