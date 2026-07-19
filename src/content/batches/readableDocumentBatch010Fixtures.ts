import type { FixtureRole, ProblemFixture } from "../types"
import {
  readableDocumentBatch010Inputs,
  readableDocumentBatch010Problems,
} from "./readableDocumentBatch010Problems"

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
      return "alternate"
  }
}

function transformH2Section(
  source: string,
  occurrence: number,
  transform: (sectionSource: string) => string,
): string {
  const headings = [...source.matchAll(/^## .+$/gm)]
  const start = headings[occurrence]?.index
  if (start === undefined) {
    throw new Error(`Missing H2 occurrence ${occurrence}`)
  }
  const end = headings[occurrence + 1]?.index ?? source.length
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function toOrderedList(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) => {
    let item = 0
    return sectionSource.replace(/^- /gm, () => `${(item += 1)}. `)
  })
}

function toUnorderedList(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) =>
    sectionSource.replace(/^\d+\. /gm, "- "),
  )
}

function shortenList(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) => {
    let item = 0
    return sectionSource
      .split("\n")
      .filter((line) => {
        if (!/^(?:- |\d+\. )/.test(line)) return true
        item += 1
        return item <= 2
      })
      .join("\n")
  })
}

function hideUnorderedListItems(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) => {
    let item = 0
    return sectionSource.replace(
      /^- .+$/gm,
      () => `- <!-- hidden item ${(item += 1)} -->`,
    )
  })
}

function replaceListWith(
  source: string,
  occurrence: number,
  replacement: string,
): string {
  return transformH2Section(source, occurrence, (sectionSource) => {
    const lines = sectionSource.split("\n")
    const listIndexes = lines
      .map((line, index) => (/^(?:- |\d+\. )/.test(line) ? index : -1))
      .filter((index) => index >= 0)
    const first = listIndexes.at(0)
    if (first === undefined) throw new Error(`Missing list in H2 ${occurrence}`)
    const listIndexSet = new Set(listIndexes)
    const next = lines.filter((_, index) => !listIndexSet.has(index))
    next.splice(first, 0, ...replacement.split("\n"))
    return next.join("\n")
  })
}

function appendToSection(
  source: string,
  occurrence: number,
  block: string,
): string {
  return transformH2Section(
    source,
    occurrence,
    (sectionSource) => `${sectionSource.trimEnd()}\n\n${block}\n\n`,
  )
}

function insertSkippedHeading(source: string): string {
  return source.replace(
    /^## /m,
    "### Supporting detail\n\nThis extra heading skips a level.\n\n## ",
  )
}

function varyCaseAndSpelling(source: string, index: number): string {
  const words = [...source.matchAll(/[A-Za-z]{6,}/g)]
  const selected = words[(index * 3 + 1) % words.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Readable-document source has no word to vary")
  }
  const changed = selected[0].toUpperCase().slice(0, -1)
  return `${source.slice(0, selected.index)}${changed}${source.slice(selected.index + selected[0].length)}`
}

function withoutDocumentTitle(source: string): string {
  return source.replace(/^# /, "")
}

function withExtraSection(source: string): string {
  return `${source}\n\n## Additional notes\n\nThis extra section is outside the requested short structure.`
}

function withExtraDocumentTitle(source: string): string {
  return `${source}\n\n# Separate document title`
}

function withExtraValidMarkdown(source: string): string {
  return `${source}\n\n---\n\n> A separate supporting note.`
}

function fixturesForStatus(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const outlineId = `${problemId}-outline`
  const sectionsId = `${problemId}-sections`
  const hierarchyId = `${problemId}-hierarchy`
  const statusId = `${problemId}-status`
  const actionsId = `${problemId}-actions`
  const withoutStrong = target.replace(/\*\*([^*]+)\*\*/, "$1")
  const malformedStrong = target.replace(/\*\*([^*]+)\*\*/, "**$1*")

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: outlineId, exercisesCheckId: outlineId },
    { suffix: "malformed-strong", role: "malformed", source: malformedStrong, expectedStatus: "fail", expectedFeedbackId: statusId, exercisesCheckId: statusId },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraSection(target), expectedStatus: "fail", expectedFeedbackId: sectionsId, exercisesCheckId: sectionsId },
    { suffix: "skipped-heading-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "ordered-actions", role: "edge-case", kind: "ordered-list", source: toOrderedList(target, 1), expectedStatus: "fail", expectedFeedbackId: actionsId, exercisesCheckId: actionsId },
    { suffix: "strong-in-wrong-section", role: "edge-case", source: appendToSection(withoutStrong, 1, "The **bold text is in the wrong section**."), expectedStatus: "fail", expectedFeedbackId: statusId },
    { suffix: "two-actions", role: "edge-case", kind: "too-short-list", source: shortenList(target, 1), expectedStatus: "fail", expectedFeedbackId: actionsId },
    { suffix: "raw-html-strong", role: "edge-case", source: target.replace(/\*\*([^*]+)\*\*/, "<strong>$1</strong>"), expectedStatus: "fail", expectedFeedbackId: statusId },
    { suffix: "inline-code-strong-lookalike", role: "edge-case", source: target.replace(/\*\*([^*]+)\*\*/, "`**$1**`"), expectedStatus: "fail", expectedFeedbackId: statusId },
    { suffix: "raw-html-list-lookalike", role: "edge-case", source: replaceListWith(target, 1, "<ul><li>First</li><li>Second</li><li>Third</li></ul>"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "fenced-list-lookalike", role: "edge-case", source: replaceListWith(target, 1, "```md\n- First\n- Second\n- Third\n```"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "alternate-bullet-marker", role: "edge-case", kind: "asterisk-bullet", source: target.replace(/^- /gm, "* "), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "extra-valid-markdown", role: "edge-case", source: withExtraValidMarkdown(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "hidden-only-action-items", role: "edge-case", source: hideUnorderedListItems(target, 1), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function fixturesForHowTo(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const outlineId = `${problemId}-outline`
  const sectionsId = `${problemId}-sections`
  const hierarchyId = `${problemId}-hierarchy`
  const preparationId = `${problemId}-preparation`
  const stepsId = `${problemId}-steps`
  const exactItemId = `${problemId}-exact-item`
  const withoutInlineCode = target.replace(/`([^`]+)`/, "$1")
  const malformedInlineCode = target.replace(/`([^`]+)`/, "`$1")

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: outlineId, exercisesCheckId: outlineId },
    { suffix: "malformed-inline-code", role: "malformed", source: malformedInlineCode, expectedStatus: "fail", expectedFeedbackId: exactItemId, exercisesCheckId: exactItemId },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraSection(target), expectedStatus: "fail", expectedFeedbackId: sectionsId, exercisesCheckId: sectionsId },
    { suffix: "skipped-heading-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "ordered-preparation", role: "edge-case", kind: "ordered-list", source: toOrderedList(target, 0), expectedStatus: "fail", expectedFeedbackId: preparationId, exercisesCheckId: preparationId },
    { suffix: "unordered-steps", role: "edge-case", kind: "unordered-list", source: toUnorderedList(target, 1), expectedStatus: "fail", expectedFeedbackId: stepsId, exercisesCheckId: stepsId },
    { suffix: "two-preparation-items", role: "edge-case", kind: "too-short-list", source: shortenList(target, 0), expectedStatus: "fail", expectedFeedbackId: preparationId },
    { suffix: "two-steps", role: "edge-case", kind: "too-short-list", source: shortenList(target, 1), expectedStatus: "fail", expectedFeedbackId: stepsId },
    { suffix: "inline-code-in-wrong-section", role: "edge-case", source: appendToSection(withoutInlineCode, 0, "Confirm the exact label `ready` before continuing."), expectedStatus: "fail", expectedFeedbackId: exactItemId },
    { suffix: "inline-code-outside-list", role: "edge-case", source: appendToSection(withoutInlineCode, 1, "Use the exact interface label `ready` for this guide."), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "raw-html-code-lookalike", role: "edge-case", kind: "raw-html-code", source: target.replace(/`([^`]+)`/, "<code>$1</code>"), expectedStatus: "fail", expectedFeedbackId: exactItemId },
    { suffix: "fenced-steps-lookalike", role: "edge-case", kind: "fenced-code-list", source: replaceListWith(target, 1, "```md\n1. First\n2. Second\n3. Third\n```"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "hidden-only-preparation-items", role: "edge-case", source: hideUnorderedListItems(target, 0), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "extra-valid-markdown", role: "edge-case", source: withExtraValidMarkdown(target), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function fixturesForDecision(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const outlineId = `${problemId}-outline`
  const sectionsId = `${problemId}-sections`
  const hierarchyId = `${problemId}-hierarchy`
  const decisionId = `${problemId}-decision`
  const actionsId = `${problemId}-actions`
  const emptyDecision = target.replace(/^> .+$/m, ">")

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: outlineId, exercisesCheckId: outlineId },
    { suffix: "empty-decision-quote", role: "malformed", source: emptyDecision, expectedStatus: "fail", expectedFeedbackId: decisionId, exercisesCheckId: decisionId },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraSection(target), expectedStatus: "fail", expectedFeedbackId: sectionsId, exercisesCheckId: sectionsId },
    { suffix: "skipped-heading-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "ordered-actions", role: "edge-case", kind: "ordered-list", source: toOrderedList(target, 2), expectedStatus: "fail", expectedFeedbackId: actionsId, exercisesCheckId: actionsId },
    { suffix: "decision-quote-in-wrong-section", role: "edge-case", source: appendToSection(emptyDecision, 0, "> This quote is in the context section."), expectedStatus: "fail", expectedFeedbackId: decisionId },
    { suffix: "two-actions", role: "edge-case", kind: "too-short-list", source: shortenList(target, 2), expectedStatus: "fail", expectedFeedbackId: actionsId },
    { suffix: "raw-html-blockquote-lookalike", role: "edge-case", source: target.replace(/^> (.+)$/m, "<blockquote>$1</blockquote>"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "fenced-blockquote-lookalike", role: "edge-case", kind: "fenced-code-blockquote", source: target.replace(/^> (.+)$/m, "```md\n> $1\n```"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "escaped-blockquote-lookalike", role: "edge-case", kind: "escaped-blockquote", source: target.replace(/^> /m, "\\> "), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "alternate-bullet-marker", role: "edge-case", kind: "plus-bullet", source: target.replace(/^- /gm, "+ "), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "extra-valid-markdown", role: "edge-case", source: withExtraValidMarkdown(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "hidden-only-action-items", role: "edge-case", source: hideUnorderedListItems(target, 2), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function createReadableDocumentFixtures(
  problem: (typeof readableDocumentBatch010Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = readableDocumentBatch010Inputs[index]!
  const familyProblems = readableDocumentBatch010Problems.filter(
    (_, candidateIndex) =>
      readableDocumentBatch010Inputs[candidateIndex]!.family === input.family,
  )
  const familyIndex = familyProblems.findIndex(
    (candidate) => candidate.id === problem.id,
  )
  const alternate = familyProblems[(familyIndex + 1) % familyProblems.length]!.target
  const authored =
    input.family === "status-handoff"
      ? fixturesForStatus(problem.target, alternate, index, problem.id)
      : input.family === "how-to"
        ? fixturesForHowTo(problem.target, alternate, index, problem.id)
        : fixturesForDecision(problem.target, alternate, index, problem.id)

  return authored.map((fixture) => ({
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

export const readableDocumentBatch010Fixtures: readonly ProblemFixture[] =
  readableDocumentBatch010Problems.flatMap(createReadableDocumentFixtures)
