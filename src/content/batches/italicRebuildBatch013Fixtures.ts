import type { FixtureRole, ProblemFixture } from "../types"
import {
  italicRebuildBatch013Problems,
  rebuildInputs,
} from "./italicRebuildBatch013Problems"
import type { RebuildInput } from "./italicRebuildBatch013Problems"

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

type FixtureInput = {
  suffix: string
  role: FixtureRole
  kind?: ProblemFixture["kind"]
  source: string
  expectedStatus: ProblemFixture["expectedStatus"]
  expectedFeedbackId?: string
  exercisesCheckId?: string
  expectedReviewIds?: readonly string[]
}

function materializeFixtures(
  problem: (typeof italicRebuildBatch013Problems)[number],
  fixtures: readonly FixtureInput[],
): ProblemFixture[] {
  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.suffix}`,
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

function l1Fixtures(
  problem: (typeof italicRebuildBatch013Problems)[number],
  index: number,
): ProblemFixture[] {
  const phrase = problem.protectedContent[0]!
  const alternate = `Quiet lantern ${index + 1}`
  const checkId = "use-italic-emphasis"
  return materializeFixtures(problem, [
    { suffix: "canonical", role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: `*${alternate}*`, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: `*MISPELED words ${index + 1}*`, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "underscore-italic", role: "edge-case", kind: "italic-underscore", source: `_${alternate}_`, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "combined-bold-italic", role: "edge-case", kind: "italic-combined-strong", source: `***${alternate}***`, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "italic-link-label", role: "edge-case", kind: "italic-link-label", source: `[*${alternate}*](https://example.com/${index + 1})`, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing", role: "missing", source: phrase, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "unclosed-marker", role: "malformed", source: `*${phrase}`, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "bold-only", role: "edge-case", kind: "italic-bold-only", source: `**${alternate}**`, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "escaped-markers", role: "edge-case", kind: "italic-escaped-marker", source: `\\*${alternate}\\*`, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "raw-html", role: "edge-case", kind: "italic-raw-html", source: `<em>${alternate}</em>`, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "inline-code", role: "edge-case", kind: "inline-code", source: `\`*${alternate}*\``, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "fenced-code", role: "edge-case", kind: "italic-fenced-code", source: `\`\`\`md\n*${alternate}*\n\`\`\``, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "image-alt", role: "edge-case", kind: "italic-image-alt", source: `![*${alternate}*](local.png)`, expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "invisible-zero-width", role: "edge-case", kind: "italic-invisible-zero-width", source: "*\u200B*", expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "invisible-comment", role: "edge-case", kind: "italic-invisible-comment", source: "*<!-- hidden -->*", expectedStatus: "fail", expectedFeedbackId: checkId, exercisesCheckId: checkId },
    { suffix: "matched-review", role: "matched-with-review", source: `${problem.target} and *Another gentle point*`, expectedStatus: "matched", expectedReviewIds: ["keep-one-italic-focus"] },
  ])
}

function varyCaseAndSpelling(source: string, index: number): string {
  const words = [...source.matchAll(/[A-Za-z]{4,}/g)]
  const selected = words[(index * 2 + 1) % words.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Rebuild source has no word to vary")
  }
  const changed = selected[0].toUpperCase().slice(0, -1)
  return `${source.slice(0, selected.index)}${changed}${source.slice(selected.index + selected[0].length)}`
}

function replaceItalic(source: string, replacement: (text: string) => string) {
  return source.replace(/\*([^*]+)\*/, (_, text: string) => replacement(text))
}

function withoutH1(source: string) {
  return source.replace(/^# /, "")
}

function withSecondItalic(source: string) {
  return replaceItalic(source, (text) => `*${text}* and *one extra thought*`)
}

function italicInTitleOnly(source: string) {
  return replaceItalic(source, (text) => text).replace(
    /^# (.+)$/m,
    "# *$1*",
  )
}

function italicInFinalBlockOnly(source: string, family: RebuildInput["family"]) {
  const plainMiddle = replaceItalic(source, (text) => text)
  return family === "quote-card"
    ? plainMiddle.replace(/^> (.+)$/m, "> *$1*")
    : plainMiddle.replace(/^(- |\d+\. )(.+)$/m, "$1*$2*")
}

function swapListKind(source: string, ordered: boolean) {
  let item = 0
  return ordered
    ? source.replace(/^\d+\. /gm, "- ")
    : source.replace(/^- /gm, () => `${(item += 1)}. `)
}

function hideListItems(source: string) {
  let item = 0
  return source.replace(/^(- |\d+\. ).+$/gm, (_, marker: string) =>
    `${marker}<!-- hidden item ${(item += 1)} -->`,
  )
}

function rebuildFixtures(
  problem: (typeof italicRebuildBatch013Problems)[number],
  inputIndex: number,
): ProblemFixture[] {
  const input = rebuildInputs[inputIndex]!
  const siblings = rebuildInputs.filter((candidate) => candidate.family === input.family)
  const siblingIndex = siblings.findIndex((candidate) => candidate.id === input.id)
  const alternate = siblings[(siblingIndex + 1) % siblings.length]!.target
  const shapeId = `${problem.id}-shape`
  const italicId = `${problem.id}-italic`
  const finalId = `${problem.id}-${input.family === "quote-card" ? "quote" : "list"}`

  const common: FixtureInput[] = [
    { suffix: "canonical", role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(problem.target, inputIndex), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutH1(problem.target), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "malformed-italic", role: "malformed", source: replaceItalic(problem.target, (text) => `*${text}`), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "matched-review", role: "matched-with-review", source: withSecondItalic(problem.target), expectedStatus: "matched", expectedReviewIds: ["keep-one-italic-focus"] },
    { suffix: "italic-in-title-only", role: "edge-case", kind: "italic-wrong-block-title", source: italicInTitleOnly(problem.target), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "italic-in-final-block-only", role: "edge-case", kind: "italic-wrong-block-final", source: italicInFinalBlockOnly(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "invisible-zero-width", role: "edge-case", kind: "italic-invisible-zero-width", source: replaceItalic(problem.target, () => "*\u200B*"), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "invisible-comment", role: "edge-case", kind: "italic-invisible-comment", source: replaceItalic(problem.target, () => "*<!-- hidden -->*"), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "underscore-italic", role: "edge-case", kind: "italic-underscore", source: replaceItalic(problem.target, (text) => `_${text}_`), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "bold-only", role: "edge-case", kind: "italic-bold-only", source: replaceItalic(problem.target, (text) => `**${text}**`), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "raw-html-italic", role: "edge-case", kind: "italic-raw-html", source: replaceItalic(problem.target, (text) => `<em>${text}</em>`), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "inline-code-italic", role: "edge-case", kind: "inline-code", source: replaceItalic(problem.target, (text) => `\`*${text}*\``), expectedStatus: "fail", expectedFeedbackId: italicId, exercisesCheckId: italicId },
    { suffix: "extra-block", role: "edge-case", kind: "extra-paragraph", source: `${problem.target}\n\nOne extra paragraph.`, expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
  ]

  if (input.family === "quote-card") {
    return materializeFixtures(problem, [
      ...common,
      { suffix: "plain-final-message", role: "edge-case", kind: "italic-plain-final-message", source: problem.target.replace(/^> /m, ""), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
      { suffix: "empty-quote", role: "edge-case", kind: "empty-blockquote", source: problem.target.replace(/^> .+$/m, ">"), expectedStatus: "fail", expectedFeedbackId: finalId, exercisesCheckId: finalId },
      { suffix: "nested-quote", role: "edge-case", kind: "nested-blockquote", source: problem.target.replace(/^> /m, "> > "), expectedStatus: "fail", expectedFeedbackId: finalId, exercisesCheckId: finalId },
    ])
  }

  return materializeFixtures(problem, [
    ...common,
    { suffix: "wrong-list-kind", role: "edge-case", kind: input.family === "short-process" ? "unordered-list" : "ordered-list", source: swapListKind(problem.target, input.family === "short-process"), expectedStatus: "fail", expectedFeedbackId: finalId, exercisesCheckId: finalId },
    { suffix: "hidden-list-items", role: "edge-case", kind: "italic-hidden-list-items", source: hideListItems(problem.target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-list-marker", role: "edge-case", kind: "italic-alternate-list-marker", source: input.family === "quick-note" ? problem.target.replace(/^- /gm, "+ ") : problem.target.replace(/^\d+\. /gm, "1. "), expectedStatus: "matched", expectedReviewIds: [] },
  ])
}

export const italicRebuildBatch013Fixtures: readonly ProblemFixture[] =
  italicRebuildBatch013Problems.flatMap((problem, index) =>
    problem.level === 1
      ? l1Fixtures(problem, index)
      : rebuildFixtures(problem, index - 12),
  )
