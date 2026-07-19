import type { FixtureRole, ProblemFixture } from "../types"
import {
  readableDocumentBatch011Inputs,
  readableDocumentBatch011Problems,
} from "./readableDocumentBatch011Problems"

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
  if (start === undefined) throw new Error(`Missing H2 occurrence ${occurrence}`)
  const end = headings[occurrence + 1]?.index ?? source.length
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function appendToSection(source: string, occurrence: number, block: string): string {
  return transformH2Section(
    source,
    occurrence,
    (sectionSource) => `${sectionSource.trimEnd()}\n\n${block}\n\n`,
  )
}

function toOrderedList(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) => {
    let item = 0
    return sectionSource.replace(/^- /gm, () => `${(item += 1)}. `)
  })
}

function toUnorderedList(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) =>
    sectionSource.replace(/^\d+[.)] /gm, "- "),
  )
}

function shortenList(source: string, occurrence: number): string {
  return transformH2Section(source, occurrence, (sectionSource) => {
    let item = 0
    return sectionSource
      .split("\n")
      .filter((line) => {
        if (!/^(?:[-*+] |\d+[.)] )/.test(line)) return true
        item += 1
        return item <= 2
      })
      .join("\n")
  })
}

function useAlternateListMarkers(source: string): string {
  return source
    .replace(/^- /gm, "* ")
    .replace(/^(\d+)\. /gm, "$1) ")
}

function hideListItems(source: string, occurrences: readonly number[]): string {
  return occurrences.reduce(
    (current, occurrence) =>
      transformH2Section(current, occurrence, (sectionSource) => {
        let item = 0
        return sectionSource.replace(
          /^(?:[-*+] |\d+[.)] ).+$/gm,
          (line) => {
            item += 1
            const marker = line.match(/^(?:[-*+] |\d+[.)] )/)?.[0] ?? "- "
            return `${marker}<!-- hidden item ${item} -->`
          },
        )
      }),
    source,
  )
}

function replaceFirstMarkdownLink(
  source: string,
  replacement: string | ((label: string, destination: string) => string),
): string {
  return source.replace(
    /\[([^\]]+)\]\(([^)]*)\)/,
    (_match, label: string, destination: string) =>
      typeof replacement === "string"
        ? replacement
        : replacement(label, destination),
  )
}

function withoutDocumentTitle(source: string): string {
  return source.replace(/^# /, "")
}

function withExtraDocumentTitle(source: string): string {
  return `${source}\n\n# Separate document title`
}

function withExtraSection(source: string): string {
  return `${source}\n\n## Additional notes\n\nThis section is outside the requested short structure.`
}

function insertSkippedHeading(source: string): string {
  return source.replace(
    /^## /m,
    "### Supporting detail\n\nThis extra heading skips a level.\n\n## ",
  )
}

function varyCaseAndSpelling(source: string, index: number): string {
  const paragraphs = [...source.matchAll(/\n\n([A-Za-z][^\n]*)/g)]
  const selected = paragraphs[index % paragraphs.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Composite-document source has no prose to vary")
  }
  const start = selected.index + 2
  const paragraph = selected[1]
  const word = paragraph?.match(/^[A-Za-z]+/)?.[0]
  if (!word) throw new Error("Composite-document paragraph has no leading word")
  return `${source.slice(0, start)}${word.toLowerCase()}${source.slice(start + word.length)}`
}

function withExtraValidMarkdown(source: string): string {
  return `${source}\n\nA short supporting paragraph can remain outside the required blocks.`
}

function replaceDivider(source: string, replacement: string): string {
  return source.replace(/^---$/m, replacement)
}

function moveDivider(source: string, targetOccurrence: number): string {
  return appendToSection(replaceDivider(source, ""), targetOccurrence, "---")
}

function emptyBlockquote(source: string): string {
  return source.replace(/^> .+$/m, ">")
}

function fixturesForMeeting(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const outlineId = `${problemId}-outline`
  const sectionsId = `${problemId}-sections`
  const hierarchyId = `${problemId}-hierarchy`
  const dividerId = `${problemId}-divider`
  const agendaId = `${problemId}-agenda`
  const preparationId = `${problemId}-preparation`

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: outlineId, exercisesCheckId: outlineId },
    { suffix: "malformed-divider", role: "malformed", source: replaceDivider(target, "--"), expectedStatus: "fail", expectedFeedbackId: dividerId, exercisesCheckId: dividerId },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraSection(target), expectedStatus: "fail", expectedFeedbackId: sectionsId, exercisesCheckId: sectionsId },
    { suffix: "skipped-heading-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "extra-valid-markdown", role: "edge-case", source: withExtraValidMarkdown(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "duplicate-divider", role: "edge-case", source: appendToSection(target, 0, "***"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "divider-in-wrong-section", role: "edge-case", source: moveDivider(target, 1), expectedStatus: "fail", expectedFeedbackId: dividerId },
    { suffix: "fenced-divider-lookalike", role: "edge-case", source: replaceDivider(target, "```md\n---\n```"), expectedStatus: "fail", expectedFeedbackId: dividerId },
    { suffix: "raw-html-divider-lookalike", role: "edge-case", source: replaceDivider(target, "<hr>"), expectedStatus: "fail", expectedFeedbackId: dividerId },
    { suffix: "nested-divider", role: "edge-case", source: replaceDivider(target, "> ---"), expectedStatus: "fail", expectedFeedbackId: dividerId },
    { suffix: "unordered-agenda", role: "edge-case", kind: "unordered-list", source: toUnorderedList(target, 1), expectedStatus: "fail", expectedFeedbackId: agendaId, exercisesCheckId: agendaId },
    { suffix: "two-agenda-items", role: "edge-case", kind: "too-short-list", source: shortenList(target, 1), expectedStatus: "fail", expectedFeedbackId: agendaId },
    { suffix: "ordered-preparation", role: "edge-case", kind: "ordered-list", source: toOrderedList(target, 2), expectedStatus: "fail", expectedFeedbackId: preparationId, exercisesCheckId: preparationId },
    { suffix: "two-preparation-items", role: "edge-case", kind: "too-short-list", source: shortenList(target, 2), expectedStatus: "fail", expectedFeedbackId: preparationId },
    { suffix: "alternate-divider", role: "edge-case", source: replaceDivider(target, "***"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-list-markers", role: "edge-case", source: useAlternateListMarkers(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "hidden-only-list-items", role: "edge-case", source: hideListItems(target, [1, 2]), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function fixturesForReference(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const outlineId = `${problemId}-outline`
  const sectionsId = `${problemId}-sections`
  const hierarchyId = `${problemId}-hierarchy`
  const dividerId = `${problemId}-divider`
  const linkId = `${problemId}-reference-link`
  const takeawayId = `${problemId}-takeaway`
  const plainLink = replaceFirstMarkdownLink(target, (label) => label)

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: outlineId, exercisesCheckId: outlineId },
    { suffix: "malformed-link", role: "malformed", source: replaceFirstMarkdownLink(target, (label, destination) => `[${label}](${destination}`), expectedStatus: "fail", expectedFeedbackId: linkId, exercisesCheckId: linkId },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraSection(target), expectedStatus: "fail", expectedFeedbackId: sectionsId, exercisesCheckId: sectionsId },
    { suffix: "skipped-heading-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "extra-valid-markdown", role: "edge-case", source: withExtraValidMarkdown(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "divider-in-wrong-section", role: "edge-case", source: moveDivider(target, 1), expectedStatus: "fail", expectedFeedbackId: dividerId, exercisesCheckId: dividerId },
    { suffix: "alternate-divider", role: "edge-case", source: replaceDivider(target, "___"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "link-in-wrong-section", role: "edge-case", source: appendToSection(plainLink, 1, "Read the [other guide](/guides/other)."), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "empty-link-label", role: "edge-case", source: replaceFirstMarkdownLink(target, (_label, destination) => `[](${destination})`), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "empty-link-destination", role: "edge-case", source: replaceFirstMarkdownLink(target, (label) => `[${label}]()`), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "autolink", role: "edge-case", source: replaceFirstMarkdownLink(target, "<https://example.com/reference>"), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "raw-html-anchor", role: "edge-case", source: replaceFirstMarkdownLink(target, (label, destination) => `<a href=\"${destination}\">${label}</a>`), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "image-lookalike", role: "edge-case", source: replaceFirstMarkdownLink(target, (label, destination) => `![${label}](${destination})`), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "inline-code-lookalike", role: "edge-case", source: replaceFirstMarkdownLink(target, (label, destination) => `\`[${label}](${destination})\``), expectedStatus: "fail", expectedFeedbackId: linkId },
    { suffix: "reference-link", role: "edge-case", source: `${replaceFirstMarkdownLink(target, (label) => `[${label}][reference]`)}\n\n[reference]: /guides/reference`, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "empty-takeaway", role: "edge-case", source: emptyBlockquote(target), expectedStatus: "fail", expectedFeedbackId: takeawayId, exercisesCheckId: takeawayId },
    { suffix: "raw-html-blockquote-lookalike", role: "edge-case", source: target.replace(/^> (.+)$/m, "<blockquote>$1</blockquote>"), expectedStatus: "fail", expectedFeedbackId: outlineId },
  ]
}

function fixturesForRecommendation(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const outlineId = `${problemId}-outline`
  const sectionsId = `${problemId}-sections`
  const hierarchyId = `${problemId}-hierarchy`
  const optionsId = `${problemId}-options`
  const recommendationId = `${problemId}-recommendation`
  const nextStepsId = `${problemId}-next-steps`
  const emptyRecommendation = emptyBlockquote(target)

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: outlineId, exercisesCheckId: outlineId },
    { suffix: "empty-recommendation", role: "malformed", source: emptyRecommendation, expectedStatus: "fail", expectedFeedbackId: recommendationId, exercisesCheckId: recommendationId },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraSection(target), expectedStatus: "fail", expectedFeedbackId: sectionsId, exercisesCheckId: sectionsId },
    { suffix: "skipped-heading-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "extra-valid-markdown", role: "edge-case", source: withExtraValidMarkdown(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "ordered-options", role: "edge-case", kind: "ordered-list", source: toOrderedList(target, 0), expectedStatus: "fail", expectedFeedbackId: optionsId, exercisesCheckId: optionsId },
    { suffix: "two-options", role: "edge-case", kind: "too-short-list", source: shortenList(target, 0), expectedStatus: "fail", expectedFeedbackId: optionsId },
    { suffix: "recommendation-in-wrong-section", role: "edge-case", source: appendToSection(emptyRecommendation, 0, "> This recommendation is in the options section."), expectedStatus: "fail", expectedFeedbackId: recommendationId },
    { suffix: "html-only-recommendation", role: "edge-case", source: target.replace(/^> .+$/m, "> <span></span>"), expectedStatus: "fail", expectedFeedbackId: recommendationId },
    { suffix: "raw-html-blockquote-lookalike", role: "edge-case", source: target.replace(/^> (.+)$/m, "<blockquote>$1</blockquote>"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "fenced-blockquote-lookalike", role: "edge-case", source: target.replace(/^> (.+)$/m, "```md\n> $1\n```"), expectedStatus: "fail", expectedFeedbackId: outlineId },
    { suffix: "unordered-next-steps", role: "edge-case", kind: "unordered-list", source: toUnorderedList(target, 2), expectedStatus: "fail", expectedFeedbackId: nextStepsId, exercisesCheckId: nextStepsId },
    { suffix: "two-next-steps", role: "edge-case", kind: "too-short-list", source: shortenList(target, 2), expectedStatus: "fail", expectedFeedbackId: nextStepsId },
    { suffix: "alternate-list-markers", role: "edge-case", source: useAlternateListMarkers(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "hidden-only-list-items", role: "edge-case", source: hideListItems(target, [0, 2]), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "nested-recommendation", role: "edge-case", source: target.replace(/^> /m, "> > "), expectedStatus: "fail", expectedFeedbackId: recommendationId },
    { suffix: "additional-options-list", role: "edge-case", source: appendToSection(target, 0, "- A fourth optional approach"), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function createReadableDocumentFixtures(
  problem: (typeof readableDocumentBatch011Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = readableDocumentBatch011Inputs[index]!
  const familyProblems = readableDocumentBatch011Problems.filter(
    (_, candidateIndex) =>
      readableDocumentBatch011Inputs[candidateIndex]!.family === input.family,
  )
  const familyIndex = familyProblems.findIndex(
    (candidate) => candidate.id === problem.id,
  )
  const alternate = familyProblems[(familyIndex + 1) % familyProblems.length]!.target
  const authored =
    input.family === "meeting-agenda"
      ? fixturesForMeeting(problem.target, alternate, index, problem.id)
      : input.family === "reference-note"
        ? fixturesForReference(problem.target, alternate, index, problem.id)
        : fixturesForRecommendation(problem.target, alternate, index, problem.id)

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

export const readableDocumentBatch011Fixtures: readonly ProblemFixture[] =
  readableDocumentBatch011Problems.flatMap(createReadableDocumentFixtures)
