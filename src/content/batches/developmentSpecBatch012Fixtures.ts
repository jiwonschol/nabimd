import type { FixtureRole, ProblemFixture } from "../types"
import {
  developmentSpecBatch012Inputs,
  developmentSpecBatch012Problems,
} from "./developmentSpecBatch012Problems"

type FixtureInput = {
  suffix: string
  role: FixtureRole
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
  transform: (section: string) => string,
): string {
  const headings = [...source.matchAll(/^## .+$/gm)]
  const start = headings[occurrence]?.index
  if (start === undefined) throw new Error(`Missing H2 occurrence ${occurrence}`)
  const end = headings[occurrence + 1]?.index ?? source.length
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function transformH3Section(
  source: string,
  occurrence: number,
  transform: (section: string) => string,
): string {
  const headings = [...source.matchAll(/^### .+$/gm)]
  const start = headings[occurrence]?.index
  if (start === undefined) throw new Error(`Missing H3 occurrence ${occurrence}`)
  const followingH3 = headings[occurrence + 1]?.index ?? source.length
  const followingH2Match = source.slice(start).match(/^## .+$/m)
  const followingH2 =
    followingH2Match?.index === undefined
      ? source.length
      : start + followingH2Match.index
  const end = Math.min(followingH3, followingH2)
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function appendToH2(source: string, occurrence: number, block: string): string {
  return transformH2Section(
    source,
    occurrence,
    (section) => `${section.trimEnd()}\n\n${block}\n\n`,
  )
}

function toOrdered(section: string): string {
  let item = 0
  return section.replace(/^- /gm, () => `${(item += 1)}. `)
}

function toUnordered(section: string): string {
  return section.replace(/^\d+[.)] /gm, "- ")
}

function shortenList(section: string, maximum: number): string {
  let items = 0
  return section
    .split("\n")
    .filter((line) => {
      if (!/^(?:[-*+] |\d+[.)] )/.test(line)) return true
      items += 1
      return items <= maximum
    })
    .join("\n")
}

function emptyListItems(section: string): string {
  return section.replace(/^(?<marker>(?:[-*+] |\d+[.)] )).+$/gm, "$<marker>")
}

function nestedOrderedOnly(section: string): string {
  return section.replace(
    /^- .+(?:\n- .+)+/m,
    "- Parent item\n  1. Nested first\n  2. Nested second\n  3. Nested third\n",
  )
}

function nestedUnorderedOnly(section: string): string {
  return section.replace(
    /^\d+[.)] .+(?:\n\d+[.)] .+)+/m,
    "1. Parent step\n   - Nested first\n   - Nested second\n   - Nested third\n",
  )
}

function useAlternateListMarkers(source: string): string {
  return source.replace(/^- /gm, "* ").replace(/^(\d+)\. /gm, "$1) ")
}

function withoutDocumentTitle(source: string): string {
  return source.replace(/^# /, "")
}

function withExtraDocumentTitle(source: string): string {
  return `${source}\n\n# Independent document title`
}

function withExtraH2(source: string): string {
  return `${source}\n\n## Undeclared section\n\nThis section is outside the requested anatomy.`
}

function insertSkippedHeading(source: string): string {
  return source.replace(/^(# .+)$/m, "$1\n\n#### Skipped supporting detail")
}

function withExtraIntroParagraph(source: string): string {
  return source.replace(
    /^## /m,
    "A second introductory paragraph is valid Markdown and does not change the required sections.\n\n## ",
  )
}

function varyCaseAndSpelling(source: string, index: number): string {
  const changed = source.replace(/^# ([A-Z])/, (_match, letter: string) =>
    `# ${letter.toLowerCase()}`,
  )
  const words = ["specification", "investigation", "migration", "project"]
  const word = words[index % words.length]!
  return changed.replace(new RegExp(word, "i"), `${word.slice(0, -1)}x`)
}

function useSetextH1AndH2(source: string): string {
  return source
    .split("\n")
    .flatMap((line) => {
      if (line.startsWith("## ")) return [line.slice(3), "---"]
      if (line.startsWith("# ")) return [line.slice(2), "==="]
      return [line]
    })
    .join("\n")
}

function replaceFirstLink(
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

function removeFirstInlineCode(source: string): string {
  return source.replace(/`([^`]+)`/, "$1")
}

function replaceVerificationFence(
  source: string,
  replacement: (language: string, body: string) => string,
): string {
  return source.replace(
    /```([^\n]*)\n([\s\S]*?)\n```/,
    (_match, language: string, body: string) => replacement(language, body),
  )
}

function fixturesForFeature(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const id = (suffix: string) => `${problemId}-${suffix}`
  const withoutLink = replaceFirstLink(target, (label) => label)
  const withoutCode = removeFirstInlineCode(target)
  const emptyConstraint = transformH2Section(target, 2, (section) =>
    section.replace(/^> .+$/m, ">"),
  )

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: id("outline"), exercisesCheckId: id("outline") },
    { suffix: "malformed-link", role: "malformed", source: replaceFirstLink(target, (label, destination) => `[${label}](${destination}`), expectedStatus: "fail", expectedFeedbackId: id("dependency-link"), exercisesCheckId: id("dependency-link") },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraH2(target), expectedStatus: "fail", expectedFeedbackId: id("sections"), exercisesCheckId: id("sections") },
    { suffix: "skipped-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: id("hierarchy"), exercisesCheckId: id("hierarchy") },
    { suffix: "ordered-scope", role: "edge-case", source: transformH2Section(target, 0, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("scope"), exercisesCheckId: id("scope") },
    { suffix: "dependency-code-removed", role: "edge-case", source: withoutCode, expectedStatus: "fail", expectedFeedbackId: id("dependency-code"), exercisesCheckId: id("dependency-code") },
    { suffix: "empty-constraint", role: "edge-case", source: emptyConstraint, expectedStatus: "fail", expectedFeedbackId: id("constraint"), exercisesCheckId: id("constraint") },
    { suffix: "unordered-implementation", role: "edge-case", source: transformH2Section(target, 3, toUnordered), expectedStatus: "fail", expectedFeedbackId: id("implementation"), exercisesCheckId: id("implementation") },
    { suffix: "ordered-acceptance", role: "edge-case", source: transformH2Section(target, 4, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("acceptance"), exercisesCheckId: id("acceptance") },
    { suffix: "verification-note", role: "edge-case", source: transformH2Section(target, 5, (section) => section.replace(/\n```/, "\nExtra verification note.\n\n```")), expectedStatus: "fail", expectedFeedbackId: id("verification-section"), exercisesCheckId: id("verification-section") },
    { suffix: "untagged-verification", role: "edge-case", source: replaceVerificationFence(target, (_language, body) => `\`\`\`\n${body}\n\`\`\``), expectedStatus: "fail", expectedFeedbackId: id("verification-code"), exercisesCheckId: id("verification-code") },
    { suffix: "setext-headings", role: "edge-case", source: useSetextH1AndH2(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-list-markers", role: "edge-case", source: useAlternateListMarkers(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "extra-intro", role: "edge-case", source: withExtraIntroParagraph(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "short-scope", role: "edge-case", source: transformH2Section(target, 0, (section) => shortenList(section, 2)), expectedStatus: "fail", expectedFeedbackId: id("scope") },
    { suffix: "nested-ordered-scope", role: "edge-case", source: transformH2Section(target, 0, nestedOrderedOnly), expectedStatus: "fail", expectedFeedbackId: id("scope") },
    { suffix: "empty-link-label", role: "edge-case", source: replaceFirstLink(target, (_label, destination) => `[](${destination})`), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "empty-link-destination", role: "edge-case", source: replaceFirstLink(target, (label) => `[${label}]()`), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "reference-link", role: "edge-case", source: `${replaceFirstLink(target, (label) => `[${label}][dependency]`)}\n\n[dependency]: /guides/dependency`, expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "autolink", role: "edge-case", source: replaceFirstLink(target, "<https://example.com/dependency>"), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "html-anchor", role: "edge-case", source: replaceFirstLink(target, (label, destination) => `<a href=\"${destination}\">${label}</a>`), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "image-link-lookalike", role: "edge-case", source: replaceFirstLink(target, (label, destination) => `![${label}](${destination})`), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "inline-code-link-lookalike", role: "edge-case", source: replaceFirstLink(target, (label, destination) => `\`[${label}](${destination})\``), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "link-in-wrong-section", role: "edge-case", source: appendToH2(withoutLink, 0, "- Read the [other interface guide](/guides/other)."), expectedStatus: "fail", expectedFeedbackId: id("dependency-link") },
    { suffix: "unmatched-inline-code", role: "edge-case", source: target.replace(/`([^`]+)`/, "`$1"), expectedStatus: "fail", expectedFeedbackId: id("dependency-code") },
    { suffix: "empty-inline-code", role: "edge-case", source: target.replace(/`([^`]+)`/, "``"), expectedStatus: "fail", expectedFeedbackId: id("dependency-code") },
    { suffix: "inline-code-in-wrong-section", role: "edge-case", source: appendToH2(withoutCode, 0, "- Preserve `OtherType` while editing."), expectedStatus: "fail", expectedFeedbackId: id("dependency-code") },
    { suffix: "double-backtick-inline-code", role: "edge-case", source: target.replace(/`([^`]+)`/, "``$1``"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "nested-constraint", role: "edge-case", source: transformH2Section(target, 2, (section) => section.replace(/^> /m, "> > ")), expectedStatus: "fail", expectedFeedbackId: id("constraint") },
    { suffix: "html-constraint-lookalike", role: "edge-case", source: transformH2Section(target, 2, (section) => section.replace(/^> (.+)$/m, "<blockquote>$1</blockquote>")), expectedStatus: "fail", expectedFeedbackId: id("constraint") },
    { suffix: "constraint-in-wrong-section", role: "edge-case", source: appendToH2(emptyConstraint, 1, "> This quote is in the dependency section."), expectedStatus: "fail", expectedFeedbackId: id("constraint") },
    { suffix: "tilde-verification-fence", role: "edge-case", source: replaceVerificationFence(target, (language, body) => `~~~${language}\n${body}\n~~~`), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "indented-verification-code", role: "edge-case", source: replaceVerificationFence(target, (_language, body) => body.split("\n").map((line) => `    ${line}`).join("\n")), expectedStatus: "fail", expectedFeedbackId: id("verification-code") },
    { suffix: "nested-verification-code", role: "edge-case", source: replaceVerificationFence(target, (language, body) => [`> \`\`\`${language}`, ...body.split("\n").map((line) => `> ${line}`), "> ```"].join("\n")), expectedStatus: "fail", expectedFeedbackId: id("verification-section") },
    { suffix: "empty-tagged-verification", role: "edge-case", source: replaceVerificationFence(target, (language) => `\`\`\`${language}\n\`\`\``), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function fixturesForBug(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const id = (suffix: string) => `${problemId}-${suffix}`
  const emptyEvidence = transformH2Section(target, 0, (section) =>
    section.replace(/^> .+$/m, ">"),
  )
  const emptyDecision = transformH2Section(target, 5, (section) =>
    section.replace(/^> .+$/m, ">"),
  )

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: id("outline"), exercisesCheckId: id("outline") },
    { suffix: "empty-evidence", role: "malformed", source: emptyEvidence, expectedStatus: "fail", expectedFeedbackId: id("evidence"), exercisesCheckId: id("evidence") },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraH2(target), expectedStatus: "fail", expectedFeedbackId: id("sections"), exercisesCheckId: id("sections") },
    { suffix: "skipped-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: id("hierarchy"), exercisesCheckId: id("hierarchy") },
    { suffix: "extra-evidence-block", role: "edge-case", source: appendToH2(target, 0, "Extra observed context."), expectedStatus: "fail", expectedFeedbackId: id("evidence-section"), exercisesCheckId: id("evidence-section") },
    { suffix: "unordered-reproduction", role: "edge-case", source: transformH2Section(target, 1, toUnordered), expectedStatus: "fail", expectedFeedbackId: id("reproduction"), exercisesCheckId: id("reproduction") },
    { suffix: "ordered-constraints", role: "edge-case", source: transformH2Section(target, 2, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("constraints"), exercisesCheckId: id("constraints") },
    { suffix: "unordered-fix-plan", role: "edge-case", source: transformH2Section(target, 3, toUnordered), expectedStatus: "fail", expectedFeedbackId: id("fix-plan"), exercisesCheckId: id("fix-plan") },
    { suffix: "ordered-regression", role: "edge-case", source: transformH2Section(target, 4, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("regression-acceptance"), exercisesCheckId: id("regression-acceptance") },
    { suffix: "empty-open-decision", role: "edge-case", source: emptyDecision, expectedStatus: "fail", expectedFeedbackId: id("open-decision"), exercisesCheckId: id("open-decision") },
    { suffix: "verification-extra-block", role: "edge-case", source: appendToH2(target, 6, "Extra verification context."), expectedStatus: "fail", expectedFeedbackId: id("verification-section"), exercisesCheckId: id("verification-section") },
    { suffix: "ordered-verification-list", role: "edge-case", source: transformH2Section(target, 6, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("verification-list"), exercisesCheckId: id("verification-list") },
    { suffix: "verification-code-removed", role: "edge-case", source: transformH2Section(target, 6, (section) => section.replace(/`/g, "")), expectedStatus: "fail", expectedFeedbackId: id("verification-code"), exercisesCheckId: id("verification-code") },
    { suffix: "setext-headings", role: "edge-case", source: useSetextH1AndH2(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-list-markers", role: "edge-case", source: useAlternateListMarkers(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "extra-intro", role: "edge-case", source: withExtraIntroParagraph(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-divider-asterisks", role: "edge-case", source: target.replace(/^---$/m, "***"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-divider-underscores", role: "edge-case", source: target.replace(/^---$/m, "___"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "short-divider-lookalike", role: "edge-case", source: target.replace(/^---$/m, "--"), expectedStatus: "fail", expectedFeedbackId: id("evidence-section") },
    { suffix: "code-divider-lookalike", role: "edge-case", source: target.replace(/^---$/m, "`---`"), expectedStatus: "fail", expectedFeedbackId: id("evidence-section") },
    { suffix: "html-divider-lookalike", role: "edge-case", source: target.replace(/^---$/m, "<hr>"), expectedStatus: "fail", expectedFeedbackId: id("evidence-section") },
    { suffix: "nested-divider", role: "edge-case", source: target.replace(/^---$/m, "> ---"), expectedStatus: "fail", expectedFeedbackId: id("evidence-section") },
    { suffix: "reversed-evidence-order", role: "edge-case", source: transformH2Section(target, 0, (section) => section.replace(/(> .+)\n\n---/, "---\n\n$1")), expectedStatus: "fail", expectedFeedbackId: id("evidence-section") },
    { suffix: "nested-evidence", role: "edge-case", source: transformH2Section(target, 0, (section) => section.replace(/^> /m, "> > ")), expectedStatus: "fail", expectedFeedbackId: id("evidence") },
    { suffix: "html-evidence-lookalike", role: "edge-case", source: transformH2Section(target, 0, (section) => section.replace(/^> (.+)$/m, "<blockquote>$1</blockquote>")), expectedStatus: "fail", expectedFeedbackId: id("evidence-section") },
    { suffix: "short-reproduction", role: "edge-case", source: transformH2Section(target, 1, (section) => shortenList(section, 3)), expectedStatus: "fail", expectedFeedbackId: id("reproduction") },
    { suffix: "empty-reproduction", role: "edge-case", source: transformH2Section(target, 1, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("reproduction") },
    { suffix: "nested-reproduction", role: "edge-case", source: transformH2Section(target, 1, nestedUnorderedOnly), expectedStatus: "fail", expectedFeedbackId: id("reproduction") },
    { suffix: "short-constraints", role: "edge-case", source: transformH2Section(target, 2, (section) => shortenList(section, 2)), expectedStatus: "fail", expectedFeedbackId: id("constraints") },
    { suffix: "empty-constraints", role: "edge-case", source: transformH2Section(target, 2, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("constraints") },
    { suffix: "short-fix-plan", role: "edge-case", source: transformH2Section(target, 3, (section) => shortenList(section, 2)), expectedStatus: "fail", expectedFeedbackId: id("fix-plan") },
    { suffix: "empty-regression", role: "edge-case", source: transformH2Section(target, 4, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("regression-acceptance") },
    { suffix: "nested-open-decision", role: "edge-case", source: transformH2Section(target, 5, (section) => section.replace(/^> /m, "> > ")), expectedStatus: "fail", expectedFeedbackId: id("open-decision") },
    { suffix: "decision-in-wrong-section", role: "edge-case", source: appendToH2(emptyDecision, 4, "> This decision is in the regression section."), expectedStatus: "fail", expectedFeedbackId: id("open-decision") },
    { suffix: "short-verification-list", role: "edge-case", source: transformH2Section(target, 6, (section) => shortenList(section, 1)), expectedStatus: "fail", expectedFeedbackId: id("verification-list") },
    { suffix: "one-inline-code-check", role: "edge-case", source: transformH2Section(target, 6, (section) => section.replace(/`([^`]+)`(?=[^`]*$)/, "$1")), expectedStatus: "fail", expectedFeedbackId: id("verification-code") },
    { suffix: "empty-inline-code-checks", role: "edge-case", source: transformH2Section(target, 6, (section) => section.replace(/`[^`]+`/g, "``")), expectedStatus: "fail", expectedFeedbackId: id("verification-code") },
    { suffix: "nested-verification-list", role: "edge-case", source: transformH2Section(target, 6, nestedOrderedOnly), expectedStatus: "fail", expectedFeedbackId: id("verification-list") },
    { suffix: "double-backtick-checks", role: "edge-case", source: transformH2Section(target, 6, (section) => section.replace(/`([^`]+)`/g, "``$1``")), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function fixturesForMigration(
  target: string,
  alternate: string,
  index: number,
  problemId: string,
): readonly FixtureInput[] {
  const id = (suffix: string) => `${problemId}-${suffix}`
  const emptyDecision = transformH2Section(target, 4, (section) =>
    section.replace(/^> .+$/m, ">"),
  )

  return [
    { suffix: "canonical", role: "canonical", source: target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutDocumentTitle(target), expectedStatus: "fail", expectedFeedbackId: id("outline"), exercisesCheckId: id("outline") },
    { suffix: "untagged-verification", role: "malformed", source: replaceVerificationFence(target, (_language, body) => `\`\`\`\n${body}\n\`\`\``), expectedStatus: "fail", expectedFeedbackId: id("verification-code"), exercisesCheckId: id("verification-code") },
    { suffix: "duplicate-title-review", role: "matched-with-review", source: withExtraDocumentTitle(target), expectedStatus: "matched", expectedReviewIds: ["one-document-title"] },
    { suffix: "extra-h2", role: "edge-case", source: withExtraH2(target), expectedStatus: "fail", expectedFeedbackId: id("sections"), exercisesCheckId: id("sections") },
    { suffix: "skipped-depth", role: "edge-case", source: insertSkippedHeading(target), expectedStatus: "fail", expectedFeedbackId: id("hierarchy"), exercisesCheckId: id("hierarchy") },
    { suffix: "extra-h3", role: "edge-case", source: transformH2Section(target, 1, (section) => section.replace(/^(### .+)$/m, "$1\n\n### Extra stage\n\n- Inspect one path\n- Inspect another path")), expectedStatus: "fail", expectedFeedbackId: id("stage-count"), exercisesCheckId: id("stage-count") },
    { suffix: "ordered-preconditions", role: "edge-case", source: transformH2Section(target, 0, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("preconditions"), exercisesCheckId: id("preconditions") },
    { suffix: "extra-stage-content", role: "edge-case", source: transformH2Section(target, 1, (section) => section.replace(/^(### .+)$/m, "Stage introduction.\n\n$1")), expectedStatus: "fail", expectedFeedbackId: id("migration-section"), exercisesCheckId: id("migration-section") },
    { suffix: "ordered-stage-1", role: "edge-case", source: transformH3Section(target, 0, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("stage-1"), exercisesCheckId: id("stage-1") },
    { suffix: "ordered-stage-2", role: "edge-case", source: transformH3Section(target, 1, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("stage-2"), exercisesCheckId: id("stage-2") },
    { suffix: "ordered-stage-3", role: "edge-case", source: transformH3Section(target, 2, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("stage-3"), exercisesCheckId: id("stage-3") },
    { suffix: "unordered-rollback", role: "edge-case", source: transformH2Section(target, 2, toUnordered), expectedStatus: "fail", expectedFeedbackId: id("rollback"), exercisesCheckId: id("rollback") },
    { suffix: "ordered-acceptance", role: "edge-case", source: transformH2Section(target, 3, toOrdered), expectedStatus: "fail", expectedFeedbackId: id("acceptance"), exercisesCheckId: id("acceptance") },
    { suffix: "empty-open-decision", role: "edge-case", source: emptyDecision, expectedStatus: "fail", expectedFeedbackId: id("open-decision"), exercisesCheckId: id("open-decision") },
    { suffix: "verification-extra-block", role: "edge-case", source: transformH2Section(target, 5, (section) => section.replace(/\n```/, "\nExtra verification note.\n\n```")), expectedStatus: "fail", expectedFeedbackId: id("verification-section"), exercisesCheckId: id("verification-section") },
    { suffix: "setext-h1-h2", role: "edge-case", source: useSetextH1AndH2(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternate-list-markers", role: "edge-case", source: useAlternateListMarkers(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "extra-intro", role: "edge-case", source: withExtraIntroParagraph(target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "short-preconditions", role: "edge-case", source: transformH2Section(target, 0, (section) => shortenList(section, 2)), expectedStatus: "fail", expectedFeedbackId: id("preconditions") },
    { suffix: "empty-preconditions", role: "edge-case", source: transformH2Section(target, 0, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("preconditions") },
    { suffix: "nested-ordered-preconditions", role: "edge-case", source: transformH2Section(target, 0, nestedOrderedOnly), expectedStatus: "fail", expectedFeedbackId: id("preconditions") },
    { suffix: "stage-order-reworded", role: "edge-case", source: transformH2Section(target, 1, (section) => section.replace(/### ([^\n]+)([\s\S]*?)(?=\n### |$)/g, (_match, title: string, body: string, offset: number) => `### ${offset}-${title}${body}`)), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "short-stage-1", role: "edge-case", source: transformH3Section(target, 0, (section) => shortenList(section, 1)), expectedStatus: "fail", expectedFeedbackId: id("stage-1") },
    { suffix: "empty-stage-2", role: "edge-case", source: transformH3Section(target, 1, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("stage-2") },
    { suffix: "nested-stage-3", role: "edge-case", source: transformH3Section(target, 2, nestedOrderedOnly), expectedStatus: "fail", expectedFeedbackId: id("stage-3") },
    { suffix: "stage-list-before-heading", role: "edge-case", source: transformH2Section(target, 1, (section) => section.replace(/(### [^\n]+\n\n)(- [^\n]+\n- [^\n]+)/, "$2\n\n$1")), expectedStatus: "fail", expectedFeedbackId: id("migration-section") },
    { suffix: "short-rollback", role: "edge-case", source: transformH2Section(target, 2, (section) => shortenList(section, 2)), expectedStatus: "fail", expectedFeedbackId: id("rollback") },
    { suffix: "empty-rollback", role: "edge-case", source: transformH2Section(target, 2, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("rollback") },
    { suffix: "nested-unordered-rollback", role: "edge-case", source: transformH2Section(target, 2, nestedUnorderedOnly), expectedStatus: "fail", expectedFeedbackId: id("rollback") },
    { suffix: "short-acceptance", role: "edge-case", source: transformH2Section(target, 3, (section) => shortenList(section, 2)), expectedStatus: "fail", expectedFeedbackId: id("acceptance") },
    { suffix: "empty-acceptance", role: "edge-case", source: transformH2Section(target, 3, emptyListItems), expectedStatus: "fail", expectedFeedbackId: id("acceptance") },
    { suffix: "nested-open-decision", role: "edge-case", source: transformH2Section(target, 4, (section) => section.replace(/^> /m, "> > ")), expectedStatus: "fail", expectedFeedbackId: id("open-decision") },
    { suffix: "decision-in-wrong-section", role: "edge-case", source: appendToH2(emptyDecision, 3, "> This decision is in the acceptance section."), expectedStatus: "fail", expectedFeedbackId: id("open-decision") },
    { suffix: "tilde-verification", role: "edge-case", source: replaceVerificationFence(target, (language, body) => `~~~${language}\n${body}\n~~~`), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "indented-verification", role: "edge-case", source: replaceVerificationFence(target, (_language, body) => body.split("\n").map((line) => `    ${line}`).join("\n")), expectedStatus: "fail", expectedFeedbackId: id("verification-code") },
    { suffix: "nested-verification", role: "edge-case", source: replaceVerificationFence(target, (language, body) => [`> \`\`\`${language}`, ...body.split("\n").map((line) => `> ${line}`), "> ```"].join("\n")), expectedStatus: "fail", expectedFeedbackId: id("verification-section") },
    { suffix: "empty-tagged-verification", role: "edge-case", source: replaceVerificationFence(target, (language) => `\`\`\`${language}\n\`\`\``), expectedStatus: "matched", expectedReviewIds: [] },
  ]
}

function createFixtures(
  problem: (typeof developmentSpecBatch012Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = developmentSpecBatch012Inputs[index]!
  const familyProblems = developmentSpecBatch012Problems.filter(
    (_, candidateIndex) =>
      developmentSpecBatch012Inputs[candidateIndex]!.family === input.family,
  )
  const familyIndex = familyProblems.findIndex(
    (candidate) => candidate.id === problem.id,
  )
  const alternate = familyProblems[(familyIndex + 1) % familyProblems.length]!.target
  const authored =
    input.family === "feature-interface"
      ? fixturesForFeature(problem.target, alternate, index, problem.id)
      : input.family === "bug-investigation"
        ? fixturesForBug(problem.target, alternate, index, problem.id)
        : fixturesForMigration(problem.target, alternate, index, problem.id)

  return authored.map((fixture) => ({
    id: `${problem.id}-${fixture.suffix}`,
    problemId: problem.id,
    problemRevision: problem.revision,
    role: fixture.role,
    kind: fixtureKind(fixture.role),
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

export const developmentSpecBatch012Fixtures: readonly ProblemFixture[] =
  developmentSpecBatch012Problems.flatMap(createFixtures)
