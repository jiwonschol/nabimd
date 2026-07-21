import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { normalizeProblem } from "../content/normalizeProblem"
import type { GradableProblem, MatchCheck } from "../content/types"
import { evaluateProblem } from "../engine/evaluateProblem"
import { buildReviewCorrections } from "./reviewCorrections"

function checkBase(id: string, priority: number) {
  return { id, priority, feedback: `Fix ${id}.` }
}

function problemWith(
  target: string,
  matchChecks: readonly MatchCheck[],
): GradableProblem {
  return {
    ...normalizeProblem(headingProblems[0]),
    id: "composite-feedback-test",
    target,
    starterText: target,
    matchChecks,
    editorialChecks: [],
  }
}

const ownerTarget = [
  "# Update",
  "",
  "## Next",
  "",
  "**Owner:** Read the [status page](/status).",
].join("\n")

const ownerSequenceCheck: MatchCheck = {
  ...checkBase("document-shape", 10),
  kind: "block-sequence",
  scope: { kind: "document" },
  sequence: [
    { block: "heading", depth: 1 },
    { block: "heading", depth: 2 },
    { block: "paragraph" },
  ],
  exact: true,
}

const ownerStrongCheck: MatchCheck = {
  ...checkBase("owner-bold", 20),
  kind: "inline-presence",
  scope: { kind: "section", headingDepth: 2, occurrence: 0 },
  inline: "strong",
  min: 1,
  requireNonemptyContent: true,
}

const ownerLinkCheck: MatchCheck = {
  ...checkBase("owner-link", 30),
  kind: "link-shape",
  scope: { kind: "section", headingDepth: 2, occurrence: 0 },
  min: 1,
  requireNonemptyLabel: true,
  requireNonemptyDestination: true,
  allowReferences: false,
  allowAutolinks: false,
}

function failedEvaluation(problem: GradableProblem, source: string) {
  const evaluation = evaluateProblem(problem, source)
  if (evaluation.status !== "fail") {
    throw new Error("Expected a failed evaluation")
  }
  return evaluation
}

describe("buildReviewCorrections", () => {
  it("attaches a consequential outline guard to one precise bold repair", () => {
    const problem = problemWith(ownerTarget, [
      ownerSequenceCheck,
      ownerStrongCheck,
      ownerLinkCheck,
    ])
    const source = [
      "# Update",
      "",
      "## Next",
      "",
      "# Owner: Read the [status page](/status).",
    ].join("\n")
    const evaluation = failedEvaluation(problem, source)

    expect(evaluation.failures.map((failure) => failure.feedbackId)).toEqual([
      "document-shape",
      "owner-bold",
      "owner-link",
    ])
    expect(evaluation.failures.every((failure) => failure.diagnostic)).toBe(true)

    expect(buildReviewCorrections(problem, evaluation, source)).toEqual([
      expect.objectContaining({
        id: "owner-bold",
        kind: "syntax",
        label: "Bold text",
        location: "In “Next”",
        learnerExcerpt: "# Owner: Read the [status page](/status).",
        requiredSource: "**Owner:**",
        attachedFailureIds: ["document-shape", "owner-bold", "owner-link"],
      }),
    ])
  })

  it("keeps independent bold and link requirements separate", () => {
    const problem = problemWith(ownerTarget, [
      ownerStrongCheck,
      ownerLinkCheck,
    ])
    const source = "# Update\n\n## Next\n\nOwner: Read the status page."
    const evaluation = failedEvaluation(problem, source)
    const corrections = buildReviewCorrections(problem, evaluation, source)

    expect(corrections).toHaveLength(2)
    expect(corrections.map((correction) => correction.id)).toEqual([
      "owner-bold",
      "owner-link",
    ])
    expect(corrections.map((correction) => correction.requiredSource)).toEqual([
      "**Owner:**",
      "[status page](/status)",
    ])
  })

  it("orders independent errors by their fixed Goal positions", () => {
    const target = [
      "# Guide",
      "",
      "## Evidence",
      "",
      "> One observed fact.",
      "",
      "## Steps",
      "",
      "- First",
      "- Second",
      "",
      "## Reference",
      "",
      "Read the [guide](/guide).",
      "",
      "## Verify",
      "",
      "```sh",
      "npm test",
      "```",
    ].join("\n")
    const checks: readonly MatchCheck[] = [
      {
        ...checkBase("verify-code", 10),
        kind: "code-block",
        scope: { kind: "section", headingDepth: 2, occurrence: 3 },
        min: 1,
        requireFenced: true,
      },
      {
        ...checkBase("reference-link", 20),
        kind: "link-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 2 },
        min: 1,
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        allowReferences: false,
        allowAutolinks: false,
      },
      {
        ...checkBase("steps-list", 30),
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        ordered: false,
        minItems: 2,
      },
      {
        ...checkBase("evidence-quote", 40),
        kind: "blockquote-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
      },
      {
        ...checkBase("document-title", 50),
        kind: "has-heading",
        level: 1,
      },
    ]
    const problem = problemWith(target, checks)
    const evaluation = failedEvaluation(problem, "")

    expect(
      buildReviewCorrections(problem, evaluation, "").map((correction) =>
        correction.id,
      ),
    ).toEqual([
      "document-title",
      "evidence-quote",
      "steps-list",
      "reference-link",
      "verify-code",
    ])
  })

  it("omits a learner excerpt when structural alignment is ambiguous", () => {
    const problem = problemWith(ownerTarget, [ownerStrongCheck])
    const source = "# Update\n\n## Next"
    const evaluation = failedEvaluation(problem, source)

    expect(buildReviewCorrections(problem, evaluation, source)[0]).toMatchObject({
      id: "owner-bold",
      learnerExcerpt: null,
      requiredSource: "**Owner:**",
    })
  })

  it("omits a same-length alignment when more than one block shape changed", () => {
    const target = [
      "# Update",
      "",
      "## First",
      "",
      "**Owner:** One",
      "",
      "## Second",
      "",
      "Read the [status](/status).",
    ].join("\n")
    const problem = problemWith(target, [ownerStrongCheck])
    const source = [
      "# Update",
      "",
      "## First",
      "",
      "### Wrong block",
      "",
      "## Second",
      "",
      "### Another wrong block",
    ].join("\n")
    const evaluation = failedEvaluation(problem, source)

    expect(buildReviewCorrections(problem, evaluation, source)[0]).toMatchObject({
      learnerExcerpt: null,
    })
  })

  it("keeps excerpts bound to the last checked source while the draft changes", () => {
    const problem = problemWith(ownerTarget, [ownerStrongCheck])
    const checkedSource = "# Update\n\n## Next\n\nOwner: Read the status page."
    const evaluation = failedEvaluation(problem, checkedSource)

    expect(
      buildReviewCorrections(problem, evaluation, ownerTarget)[0],
    ).toMatchObject({
      learnerExcerpt: "Owner: Read the status page.",
    })
  })

  it("never fabricates a Markdown source cue for structure-only repairs", () => {
    const problem = problemWith(ownerTarget, [ownerSequenceCheck])
    const source = "# Update\n\n## Next\n\n# Owner"
    const evaluation = failedEvaluation(problem, source)

    expect(buildReviewCorrections(problem, evaluation, source)).toEqual([
      expect.objectContaining({
        id: "document-shape",
        kind: "structure",
        requiredSource: null,
      }),
    ])
  })
})
