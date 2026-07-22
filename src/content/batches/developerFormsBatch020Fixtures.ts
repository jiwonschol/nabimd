import type {
  CheckScope,
  FixtureRole,
  MatchCheck,
  NormalizedProblem,
  ProblemFixture,
} from "../types"
import {
  developerFormsBatch020Inputs,
  developerFormsBatch020Problems,
  type DeveloperFormsBatch020Family,
} from "./developerFormsBatch020Problems"

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

function sectionRange(
  source: string,
  depth: 2 | 3,
  occurrence: number,
): readonly [number, number] {
  const marker = "#".repeat(depth)
  const headings = [...source.matchAll(new RegExp(`^${marker} .+$`, "gm"))]
  const start = headings[occurrence]?.index
  if (start === undefined) {
    throw new Error(`Missing H${depth} occurrence ${occurrence}`)
  }

  const laterHeading = [...source.matchAll(/^#{1,6} .+$/gm)].find(
    (candidate) =>
      candidate.index !== undefined &&
      candidate.index > start &&
      candidate[0].match(/^#+/)![0].length <= depth,
  )
  return [start, laterHeading?.index ?? source.length]
}

function transformScope(
  source: string,
  scope: CheckScope,
  transform: (selected: string) => string,
): string {
  if (scope.kind === "document") return transform(source)
  if (scope.kind === "block") {
    throw new Error("Batch 020 fixtures do not author block-scoped checks")
  }
  if (scope.headingDepth !== 2 && scope.headingDepth !== 3) {
    throw new Error(`Unsupported fixture section depth ${scope.headingDepth}`)
  }

  const [start, end] = sectionRange(
    source,
    scope.headingDepth,
    scope.occurrence,
  )
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function varyCaseAndSpelling(source: string, index: number): string {
  return source.replace(/^# ([^\n]+)/, (_match, title: string) => {
    const words = title.split(" ")
    const wordIndex = index % words.length
    const word = words[wordIndex]!
    words[wordIndex] =
      word.length > 4 ? `${word.slice(0, -1).toUpperCase()}x` : word.toLowerCase()
    return `# ${words.join(" ")}`
  })
}

function withoutDocumentTitle(source: string): string {
  return source.replace(/^# .+\n\n/, "")
}

function withMalformedDocumentTitle(source: string): string {
  return source.replace(/^# /, "#")
}

function withEditorialReview(
  source: string,
  family: DeveloperFormsBatch020Family,
): { source: string; reviewId: string } {
  if (family === "readme-quick-start") {
    return {
      source: source.replace(/^# (.+)$/m, "# $1 `note`"),
      reviewId: "keep-inline-code-focused",
    }
  }

  const reviewId =
    family === "bug-report" ? "keep-one-observation" : "keep-one-boundary"
  return {
    source: source.replace(
      /^> (.+)$/m,
      (_match, callout: string) => `> ${callout}\n>\n>> Supporting note`,
    ),
    reviewId,
  }
}

function beyondDocumentLimit(
  source: string,
  check: Extract<MatchCheck, { kind: "document-limits" }>,
): string {
  if (check.maxLines === undefined) {
    throw new Error(`Document-limit fixture ${check.id} requires maxLines`)
  }
  const currentLines = source.split("\n").length
  const extraLines = check.maxLines + 1 - currentLines
  if (extraLines <= 0) {
    throw new Error(`Canonical source already exceeds ${check.id}`)
  }
  return `${source}${"\n".repeat(extraLines)}`
}

function wrongTopLevelSequence(source: string): string {
  return source.replace(/\n\n([^\n]+)$/, "\n\n> $1")
}

function mutateList(
  source: string,
  check: Extract<MatchCheck, { kind: "list-shape" }>,
): string {
  return transformScope(source, check.scope, (section) => {
    if (check.ordered === true) {
      return section.replace(/^\d+[.)] /gm, "- ")
    }
    return section.replace(
      /^[-*+] /gm,
      (() => {
        let item = 0
        return () => `${(item += 1)}. `
      })(),
    )
  })
}

function mutateCheck(problem: NormalizedProblem, check: MatchCheck): string {
  switch (check.kind) {
    case "document-limits":
      return beyondDocumentLimit(problem.target, check)
    case "block-sequence":
      return wrongTopLevelSequence(problem.target)
    case "block-count":
      return `${problem.target}\n\n## Extra section\n\nExtra text.`
    case "heading-depth-order":
      return problem.target.replace(/^## /m, "#### ")
    case "code-block":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/^```[^\n]+$/m, "```"),
      )
    case "list-shape":
      return mutateList(problem.target, check)
    case "inline-code-shape":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/`[^`\n]+`/g, "plain text"),
      )
    case "link-shape":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/\[([^\]]+)\]\([^)]+\)/, "$1"),
      )
    case "blockquote-shape":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/^> .+$/m, ">"),
      )
    case "heading-spacing":
    case "hash-heading-style":
    case "has-heading":
    case "inline-presence":
      throw new Error(`Unsupported Batch 020 match check ${check.kind}`)
  }
}

function expectedFeedbackForMutation(
  _problem: NormalizedProblem,
  check: MatchCheck,
): string {
  return check.id
}

function directFailureFixtures(problem: NormalizedProblem): FixtureInput[] {
  return problem.matchChecks.map((check) => ({
    suffix: `fails-${check.id}`,
    role: "edge-case",
    source: mutateCheck(problem, check),
    expectedStatus: "fail",
    expectedFeedbackId: expectedFeedbackForMutation(problem, check),
    exercisesCheckId: check.id,
  }))
}

function checkOfKind<K extends MatchCheck["kind"]>(
  problem: NormalizedProblem,
  kind: K,
): Extract<MatchCheck, { kind: K }> {
  const check = problem.matchChecks.find(
    (candidate): candidate is Extract<MatchCheck, { kind: K }> =>
      candidate.kind === kind,
  )
  if (!check) throw new Error(`Problem ${problem.id} has no ${kind} check`)
  return check
}

function replaceFence(
  source: string,
  scope: CheckScope,
  transform: (language: string, content: string) => string,
): string {
  return transformScope(source, scope, (section) =>
    section.replace(
      /^```([^\n]*)\n([\s\S]*?)\n```$/m,
      (_match, language: string, content: string) =>
        transform(language, content),
    ),
  )
}

function codeEdgeFixtures(problem: NormalizedProblem): FixtureInput[] {
  const check = checkOfKind(problem, "code-block")
  const fail = {
    role: "edge-case" as const,
    expectedStatus: "fail" as const,
    expectedFeedbackId: check.id,
  }
  return [
    {
      suffix: "alternate-tilde-fence",
      role: "edge-case",
      source: replaceFence(
        problem.target,
        check.scope,
        (language, content) => `~~~${language}\n${content}\n~~~`,
      ),
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "unclosed-fence",
      ...fail,
      source: replaceFence(
        problem.target,
        check.scope,
        (language, content) => `\`\`\`${language}\n${content}`,
      ),
      expectedFeedbackId: `${problem.id}-outline`,
    },
    {
      suffix: "empty-fence",
      ...fail,
      source: replaceFence(
        problem.target,
        check.scope,
        (language) => `\`\`\`${language}\n \n\`\`\``,
      ),
    },
    {
      suffix: "untagged-fence",
      ...fail,
      source: replaceFence(
        problem.target,
        check.scope,
        (_language, content) => `\`\`\`\n${content}\n\`\`\``,
      ),
    },
    {
      suffix: "indented-code-lookalike",
      ...fail,
      source: replaceFence(
        problem.target,
        check.scope,
        (_language, content) =>
          content
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n"),
      ),
    },
  ]
}

function listEdgeFixtures(problem: NormalizedProblem): FixtureInput[] {
  const check = checkOfKind(problem, "list-shape")
  const marker = check.ordered === true ? "\\d+[.)]" : "[-*+]"
  const line = new RegExp(`^(${marker}) (.+)$`, "gm")
  const fail = {
    role: "edge-case" as const,
    expectedStatus: "fail" as const,
    expectedFeedbackId: check.id,
  }
  const transform = (
    change: (section: string, matches: readonly RegExpMatchArray[]) => string,
  ) =>
    transformScope(problem.target, check.scope, (section) => {
      const matches = [...section.matchAll(line)]
      if (matches.length !== 2) {
        throw new Error(`Expected two list items for ${problem.id}`)
      }
      return change(section, matches)
    })
  const alternate = transform((section, matches) => {
    const alternateMarker = check.ordered === true ? "1)" : "*"
    return matches.reduce(
      (current, match) =>
        current.replace(match[0], `${alternateMarker} ${match[2]}`),
      section,
    )
  })

  return [
    {
      suffix: "alternate-list-markers",
      role: "edge-case",
      source: alternate,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "one-list-item",
      ...fail,
      source: transform((section, matches) =>
        section.replace(`${matches[1]![0]}\n`, ""),
      ),
    },
    {
      suffix: "three-list-items",
      ...fail,
      source: transform((section, matches) => {
        const thirdMarker = check.ordered === true ? "3." : "-"
        return section.replace(
          matches[1]![0],
          `${matches[1]![0]}\n${thirdMarker} Third item`,
        )
      }),
    },
    {
      suffix: "empty-list-item",
      ...fail,
      source: transform((section, matches) =>
        section.replace(matches[0]![0], `${matches[0]![1]} `),
      ),
    },
  ]
}

function inlineCodeEdgeFixtures(problem: NormalizedProblem): FixtureInput[] {
  const check = checkOfKind(problem, "inline-code-shape")
  const fail = {
    role: "edge-case" as const,
    expectedStatus: "fail" as const,
    expectedFeedbackId: check.id,
  }
  return [
    {
      suffix: "empty-inline-code",
      ...fail,
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(/`[^`\n]+`/g, "` `"),
      ),
    },
    {
      suffix: "inline-code-in-wrong-section",
      ...fail,
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(/`[^`\n]+`/g, "plain text"),
      ).replace(/^# (.+)$/m, "# $1 `elsewhere`"),
    },
  ]
}

function linkEdgeFixtures(problem: NormalizedProblem): FixtureInput[] {
  const check = checkOfKind(problem, "link-shape")
  const fail = {
    role: "edge-case" as const,
    expectedStatus: "fail" as const,
    expectedFeedbackId: check.id,
  }
  return [
    {
      suffix: "reference-link",
      role: "edge-case",
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(
          /\[([^\]]+)\]\(([^)]+)\)/,
          "[$1][guide]\n\n[guide]: $2",
        ),
      ),
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "angle-bracket-link-destination",
      role: "edge-case",
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(/\[([^\]]+)\]\(([^)]+)\)/, "[$1](<$2>)"),
      ),
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "empty-link-label",
      ...fail,
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(/\[[^\]]+\](\([^)]+\))/, "[]$1"),
      ),
    },
    {
      suffix: "empty-link-destination",
      ...fail,
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(/\[([^\]]+)\]\([^)]+\)/, "[$1]()"),
      ),
    },
    {
      suffix: "link-in-wrong-section",
      ...fail,
      source: transformScope(problem.target, check.scope, (section) =>
        section.replace(/\[([^\]]+)\]\([^)]+\)/, "$1"),
      ).replace(/^# (.+)$/m, "# [$1](/elsewhere)"),
    },
  ]
}

function quoteEdgeFixtures(problem: NormalizedProblem): FixtureInput[] {
  const check = checkOfKind(problem, "blockquote-shape")
  const fail = {
    role: "edge-case" as const,
    expectedStatus: "fail" as const,
    expectedFeedbackId: check.id,
  }
  const emptyOriginal = transformScope(problem.target, check.scope, (section) =>
    section.replace(/^> .+$/m, ">"),
  )
  const nestedMarker = problem.familyId === "developer-bug-report" ? "   >" : "  >"
  return [
    {
      suffix: "empty-blockquote",
      ...fail,
      source: emptyOriginal,
    },
    {
      suffix: "blockquote-in-wrong-section",
      ...fail,
      source: emptyOriginal.replace(
        /^(\d+[.)]|[-*+]) (.+)$/m,
        `$1 $2\n${nestedMarker} Moved quote`,
      ),
    },
  ]
}

function familyEdgeFixtures(problem: NormalizedProblem): FixtureInput[] {
  const fixtures = [
    ...codeEdgeFixtures(problem),
    ...listEdgeFixtures(problem),
    ...inlineCodeEdgeFixtures(problem),
  ]
  if (problem.matchChecks.some((check) => check.kind === "link-shape")) {
    fixtures.push(...linkEdgeFixtures(problem))
  }
  if (problem.matchChecks.some((check) => check.kind === "blockquote-shape")) {
    fixtures.push(...quoteEdgeFixtures(problem))
  }
  return fixtures
}

function materializeFixtures(
  problem: (typeof developerFormsBatch020Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = developerFormsBatch020Inputs[index]!
  const familyProblems = developerFormsBatch020Problems.filter(
    (_, candidateIndex) =>
      developerFormsBatch020Inputs[candidateIndex]!.family === input.family,
  )
  const familyIndex = familyProblems.findIndex(
    (candidate) => candidate.id === problem.id,
  )
  const alternate =
    familyProblems[(familyIndex + 1) % familyProblems.length]?.target
  if (!alternate || alternate === problem.target) {
    throw new Error(`Problem ${problem.id} has no same-family alternate`)
  }
  const editorialReview = withEditorialReview(problem.target, input.family)

  const authored: readonly FixtureInput[] = [
    {
      suffix: "canonical",
      role: "canonical",
      source: problem.target,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "different-prose",
      role: "different-prose",
      source: alternate,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "case-spelling",
      role: "case-spelling-variation",
      source: varyCaseAndSpelling(problem.target, index),
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "missing-title",
      role: "missing",
      source: withoutDocumentTitle(problem.target),
      expectedStatus: "fail",
      expectedFeedbackId: `${problem.id}-outline`,
    },
    {
      suffix: "malformed-title",
      role: "malformed",
      source: withMalformedDocumentTitle(problem.target),
      expectedStatus: "fail",
      expectedFeedbackId: `${problem.id}-outline`,
    },
    {
      suffix: "matched-review-contract",
      role: "matched-with-review",
      source: editorialReview.source,
      expectedStatus: "matched",
      expectedReviewIds: [editorialReview.reviewId],
    },
    ...directFailureFixtures(problem),
    ...familyEdgeFixtures(problem),
  ]

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

export const developerFormsBatch020Fixtures: readonly ProblemFixture[] =
  developerFormsBatch020Problems.flatMap(materializeFixtures)
