import type {
  CheckScope,
  FixtureRole,
  MatchCheck,
  NormalizedProblem,
  ProblemFixture,
} from "../types"
import {
  advancedDocumentBatch017Inputs,
  advancedDocumentBatch017Problems,
} from "./advancedDocumentBatch017Problems"

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
  const end = laterHeading?.index ?? source.length
  return [start, end]
}

function transformScope(
  source: string,
  scope: CheckScope,
  transform: (selected: string) => string,
): string {
  if (scope.kind === "document") return transform(source)
  if (scope.kind === "block") {
    throw new Error("Batch 017 fixtures do not author block-scoped checks")
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
  const headingCase = source.replace(
    /^# ([A-Z])([A-Za-z]*)/,
    (_match, first: string, rest: string) =>
      `# ${first.toLowerCase()}${rest.toUpperCase()}`,
  )
  const proseWords = [...headingCase.matchAll(/[A-Za-z]{7,}/g)].filter(
    (match) => match.index !== undefined && !headingCase.slice(0, match.index).endsWith("`"),
  )
  const selected = proseWords[(index * 5 + 3) % proseWords.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Advanced-document source has no prose word to vary")
  }
  const replacement = `${selected[0].slice(0, -1)}x`
  return `${headingCase.slice(0, selected.index)}${replacement}${headingCase.slice(selected.index + selected[0].length)}`
}

function withoutDocumentTitle(source: string) {
  return source.replace(/^# .+\n\n/, "")
}

function withMalformedDocumentTitle(source: string) {
  return source.replace(/^# /, "#")
}

function withDuplicateDocumentTitle(source: string) {
  return `${source}\n\n# Supporting title written as a second document title`
}

function withQuotedOpeningInsteadOfParagraph(source: string) {
  return source.replace(
    /^(# .+\n\n)([\s\S]*?)(\n\n## )/,
    (_match, title: string, opening: string, firstSection: string) =>
      `${title}> ${opening}${firstSection}`,
  )
}

function mutateList(
  source: string,
  check: Extract<MatchCheck, { kind: "list-shape" }>,
): string {
  return transformScope(source, check.scope, (section) => {
    if (check.descendantsOnly) {
      return section.replace(/^  [-*+] /gm, "- ")
    }
    if (check.ordered === true) {
      return section.replace(/^\d+[.)] /gm, "- ")
    }
    return section.replace(
      /^[-*+] /gm,
      (() => {
        let index = 0
        return () => `${(index += 1)}. `
      })(),
    )
  })
}

function mutateCheck(problem: NormalizedProblem, check: MatchCheck): string {
  switch (check.kind) {
    case "block-sequence":
      return withQuotedOpeningInsteadOfParagraph(problem.target)
    case "block-count":
      if (check.block === "heading" && check.depth === 2) {
        return `${problem.target}\n\n## Extra section\n\nThis extra section changes the required document anatomy.`
      }
      if (check.block === "heading" && check.depth === 3) {
        return transformScope(
          problem.target,
          check.scope,
          (section) => `${section.trimEnd()}\n\n### Extra stage\n\n- Inspect one boundary\n- Record one result\n\n`,
        )
      }
      if (check.block === "thematic-break") {
        return transformScope(problem.target, check.scope, (section) =>
          section.replace(/^---$/m, "Divider removed."),
        )
      }
      throw new Error(`Unsupported block-count fixture for ${check.id}`)
    case "heading-depth-order":
      return problem.target.replace(
        /^(# .+)$/m,
        "$1\n\n#### Skipped heading depth",
      )
    case "list-shape":
      return mutateList(problem.target, check)
    case "blockquote-shape":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/^> .+$/m, ">"),
      )
    case "inline-presence":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/\*\*([^*]+)\*\*/, "$1"),
      )
    case "inline-code-shape":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/`([^`\n]+)`/g, "$1"),
      )
    case "link-shape":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/\[([^\]]+)\]\([^)]+\)/, "$1"),
      )
    case "code-block":
      return transformScope(problem.target, check.scope, (section) =>
        section.replace(/^```[^\n]+$/m, "```"),
      )
    case "heading-spacing":
    case "hash-heading-style":
    case "has-heading":
    case "document-limits":
      throw new Error(`Unsupported Batch 017 match check ${check.kind}`)
  }
}

function expectedFeedbackForMutation(
  problem: NormalizedProblem,
  check: MatchCheck,
): string {
  if (check.kind === "block-count" && check.block === "thematic-break") {
    return `${problem.id}-outline`
  }
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

function materializeFixtures(
  problem: (typeof advancedDocumentBatch017Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = advancedDocumentBatch017Inputs[index]!
  const familyProblems = advancedDocumentBatch017Problems.filter(
    (_, candidateIndex) =>
      advancedDocumentBatch017Inputs[candidateIndex]!.family === input.family,
  )
  const familyIndex = familyProblems.findIndex(
    (candidate) => candidate.id === problem.id,
  )
  const alternate =
    familyProblems[(familyIndex + 1) % familyProblems.length]?.target
  if (!alternate || alternate === problem.target) {
    throw new Error(`Problem ${problem.id} has no same-family alternate`)
  }

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
      source: `${withoutDocumentTitle(problem.target)}\n\nThis draft still needs one document title.`,
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
      suffix: "duplicate-title-review",
      role: "matched-with-review",
      source: withDuplicateDocumentTitle(problem.target),
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
    },
    ...directFailureFixtures(problem),
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

export const advancedDocumentBatch017Fixtures: readonly ProblemFixture[] =
  advancedDocumentBatch017Problems.flatMap(materializeFixtures)
