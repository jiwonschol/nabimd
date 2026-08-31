import type { FixtureRole, ProblemFixture, SyntaxPresenceKind } from "../types"
import { levelUnlockBatch051Problems } from "./levelUnlockBatch051Problems"

type SupportedUnlockSyntax = Exclude<
  SyntaxPresenceKind,
  "heading-id" | "automatic-url" | "angle-bracket-email"
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
  "link-title": { different: "[Help](https://example.net \"Details\")", caseVariation: "[HELP](https://EXAMPLE.NET \"DETAILS\")", missing: "[Help](https://example.net)", malformed: "[Help](https://example.net \"Details)" },
  "angle-bracket-url": { different: "<ftp://example.net/help>", caseVariation: "<FTP://EXAMPLE.NET/HELP>", missing: "ftp://example.net/help", malformed: "[Help](ftp://example.net/help)" },
  escape: { different: "\\_Literal underscores\\_", caseVariation: "\\_LITERAL UNDERSCORES\\_", missing: "Literal underscores", malformed: "_Formatted underscores_" },
  "list-with-block": { different: "- Item\n\n  > Detail", caseVariation: "- ITEM\n\n  > DETAIL", missing: "- Item\n  - Detail", malformed: "- Item\n\n> Detail" },
  footnote: { different: "Claim[^a].\n\n[^a]: Source", caseVariation: "CLAIM[^A].\n\n[^A]: SOURCE", missing: "Claim with a source.", malformed: "Claim[1].\n\n[1]: Source" },
}

const minimalLevelThreeSources: Readonly<Record<
  Extract<SupportedUnlockSyntax, "link-title" | "angle-bracket-url" | "escape" | "list-with-block" | "footnote">,
  string
>> = {
  "link-title": '[x](/ "t")',
  "angle-bracket-url": "<ftp:x>",
  escape: "\\*",
  "list-with-block": "- >",
  footnote: "x[^a]\n[^a]: y",
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

function singleFixtures(problem: (typeof levelUnlockBatch051Problems)[number]): readonly ProblemFixture[] {
  const syntax = problem.skillIds[0] as SupportedUnlockSyntax
  const sources = singleSources[syntax]
  const checkId = `use-${syntax}`
  const matched = { expectedReviewIds: [] } as const
  const failed = { expectedFeedbackId: checkId, exercisesCheckId: checkId } as const
  const different = problem.level === 3
    ? `${sources.different}\n\nPlain follow-up.`
    : sources.different
  const caseVariation = problem.level === 3
    ? `${sources.caseVariation}\n\nPlain follow-up.`
    : sources.caseVariation
  const fixtures = [
    fixture(problem.id, "canonical", problem.target, "matched", matched),
    fixture(problem.id, "different-prose", different, "matched", matched),
    fixture(problem.id, "case-spelling-variation", caseVariation, "matched", matched),
    fixture(problem.id, "missing", sources.missing, "fail", failed),
    fixture(problem.id, "malformed", sources.malformed, "fail", failed),
    fixture(problem.id, "matched-with-review", `${sources.different}\n\nPlain follow-up.`, "matched", matched),
  ]
  if (problem.level === 3) {
    fixtures.push(
      fixture(problem.id, "edge-case", `${sources.different}\n${Array.from({ length: 28 }, (_, index) => `Plain line ${index + 1}.`).join("\n")}`, "fail", { expectedFeedbackId: "keep-readable", exercisesCheckId: "keep-readable" }),
      fixture(problem.id, "edge-case", minimalLevelThreeSources[syntax as keyof typeof minimalLevelThreeSources], "fail", { expectedFeedbackId: "keep-readable", exercisesCheckId: "keep-readable" }, "minimal-document"),
    )
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
  if (syntax === "list-with-block") {
    fixtures.push(
      fixture(
        problem.id,
        "edge-case",
        "- item\n\n  [a]: /url",
        "fail",
        failed,
        "invisible-definition",
      ),
      fixture(
        problem.id,
        "edge-case",
        "Title\n\n- item\n\n  <!-- hidden -->",
        "fail",
        failed,
        "invisible-html-block",
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
      fixture(
        problem.id,
        "edge-case",
        "[visible](https://example.com/\\*)",
        "fail",
        failed,
        "hidden-link-metadata",
      ),
      fixture(
        problem.id,
        "edge-case",
        "note[^a\\*]\n\n[^a\\*]: definition",
        "fail",
        failed,
        "hidden-footnote-identifier",
      ),
      fixture(
        problem.id,
        "edge-case",
        "[visible][a\\*]\n\n[a\\*]: /url",
        "fail",
        failed,
        "hidden-reference-identifier",
      ),
      fixture(
        problem.id,
        "edge-case",
        "plain\\.",
        "fail",
        failed,
        "render-neutral-escape",
      ),
    )
  }
  return fixtures
}

function mixedFixtures(problem: (typeof levelUnlockBatch051Problems)[number]): readonly ProblemFixture[] {
  const [first, second] = problem.skillIds
  const sourcesById: Readonly<Record<string, FixtureSources>> = {
    "l3-mixed-link-title-escape": {
      different: "Guide\n\nRead the [map](https://example.net \"Office map\"), then write \\*owner\\* literally.",
      caseVariation: "GUIDE\n\nREAD THE [MAP](https://EXAMPLE.NET \"OFFICE MAP\"), THEN WRITE \\*OWNER\\* LITERALLY.",
      missing: "Guide\n\nWrite \\*owner\\* literally.",
      malformed: "Guide\n\nRead the [map](https://example.net \"Office map\"), then write owner literally.",
    },
    "l3-mixed-list-angle-url": {
      different: "Reference\n\n- > Visit <ftp://example.net/help>.",
      caseVariation: "REFERENCE\n\n- > VISIT <FTP://EXAMPLE.NET/HELP>.",
      missing: "Reference\n\nVisit <ftp://example.net/help>.",
      malformed: "Reference\n\n- > Visit ftp://example.net/help.",
    },
    "l3-mixed-escape-footnote": {
      different: "Template\n\nType \\_owner\\_ literally.[^a]\n\n[^a]: Form guide",
      caseVariation: "TEMPLATE\n\nTYPE \\_OWNER\\_ LITERALLY.[^A]\n\n[^A]: FORM GUIDE",
      missing: "Template\n\nType owner literally.[^a]\n\n[^a]: Form guide",
      malformed: "Template\n\nType \\_owner\\_ literally with source [1].",
    },
    "l3-mixed-link-title-url": {
      different: "Reference\n\nRead the [guide](https://example.edu \"Guide\"), then visit <ftp://example.edu/status>.",
      caseVariation: "REFERENCE\n\nREAD THE [GUIDE](https://EXAMPLE.EDU \"GUIDE\"), THEN VISIT <FTP://EXAMPLE.EDU/STATUS>.",
      missing: "Reference\n\nVisit <ftp://example.edu/status>.",
      malformed: "Reference\n\nRead the [guide](https://example.edu \"Guide\"), then visit ftp://example.edu/status.",
    },
    "l3-mixed-list-footnote": {
      different: "Handoff\n\n- > Confirm the owner.[^a]\n\n[^a]: Team log",
      caseVariation: "HANDOFF\n\n- > CONFIRM THE OWNER.[^A]\n\n[^A]: TEAM LOG",
      missing: "Handoff\n\nConfirm the owner.[^a]\n\n[^a]: Team log",
      malformed: "Handoff\n\n- > Confirm the owner without a source.",
    },
  }
  const sources = sourcesById[problem.id]
  if (!sources) throw new Error(`Missing mixed fixture sources for ${problem.id}`)
  const matched = { expectedReviewIds: [] } as const
  const minimalById: Readonly<Record<string, string>> = {
    "l3-mixed-link-title-escape": '[x](/ "t") \\*literal\\*',
    "l3-mixed-list-angle-url": "- > <ftp:x>",
    "l3-mixed-escape-footnote": "\\*literal\\*[^a]\n[^a]: y",
    "l3-mixed-link-title-url": '[x](/ "t") <ftp:x>',
    "l3-mixed-list-footnote": "- > x[^a]\n[^a]: y",
  }
  const fixtures = [
    fixture(problem.id, "canonical", problem.target, "matched", matched),
    fixture(problem.id, "different-prose", sources.different, "matched", matched),
    fixture(problem.id, "case-spelling-variation", sources.caseVariation, "matched", matched),
    fixture(problem.id, "missing", sources.missing, "fail", { expectedFeedbackId: `use-${first}`, exercisesCheckId: `use-${first}` }),
    fixture(problem.id, "malformed", sources.malformed, "fail", { expectedFeedbackId: `use-${second}`, exercisesCheckId: `use-${second}` }),
    fixture(problem.id, "matched-with-review", `${sources.different}\n\nPlain follow-up.`, "matched", matched),
    fixture(problem.id, "edge-case", `${sources.different}\n${Array.from({ length: 28 }, (_, index) => `Plain line ${index + 1}.`).join("\n")}`, "fail", { expectedFeedbackId: "keep-readable", exercisesCheckId: "keep-readable" }),
    fixture(problem.id, "edge-case", minimalById[problem.id]!, "fail", { expectedFeedbackId: "keep-readable", exercisesCheckId: "keep-readable" }, "minimal-document"),
  ]
  if (problem.skillIds.includes("escape")) {
    const renderNeutralSource = problem.skillIds.includes("link-title")
      ? '[x](/ "t") plain\\.\n\nPlain follow-up.'
      : "plain\\.[^a]\n\n[^a]: Source"
    fixtures.push(fixture(problem.id, "edge-case", renderNeutralSource, "fail", { expectedFeedbackId: "use-escape", exercisesCheckId: "use-escape" }, "render-neutral-escape"))
    const hiddenReferenceSource = problem.skillIds.includes("link-title")
      ? '[visible][a\\*]\n\n[a\\*]: /url "title"'
      : "[visible][a\\*]\n\n[a\\*]: /url\n\nClaim[^b]\n\n[^b]: Source"
    fixtures.push(fixture(problem.id, "edge-case", hiddenReferenceSource, "fail", { expectedFeedbackId: "use-escape", exercisesCheckId: "use-escape" }, "hidden-reference-identifier"))
  }
  if (problem.skillIds.includes("list-with-block")) {
    const invisibleHtmlSource = problem.skillIds.includes("angle-bracket-url")
      ? "Reference\n\n- item\n\n  <!-- hidden -->\n\nVisit <ftp://example.net/help>."
      : "Handoff\n\n- item[^a]\n\n  <!-- hidden -->\n\n[^a]: Team log"
    fixtures.push(fixture(problem.id, "edge-case", invisibleHtmlSource, "fail", { expectedFeedbackId: "use-list-with-block", exercisesCheckId: "use-list-with-block" }, "invisible-html-block"))
  }
  return fixtures
}

export const levelUnlockBatch051Fixtures: readonly ProblemFixture[] =
  levelUnlockBatch051Problems.flatMap((problem) =>
    problem.skillIds.length === 1 ? singleFixtures(problem) : mixedFixtures(problem),
  )
