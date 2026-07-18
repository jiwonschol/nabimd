import { level35SeedProblems } from "./level35SeedProblems"
import type { NormalizedProblem, ProblemFixture } from "./types"

const level3Problems = level35SeedProblems.filter((problem) => problem.level === 3)
const level4Problems = level35SeedProblems.filter((problem) => problem.level === 4)
const level5Problems = level35SeedProblems.filter((problem) => problem.level === 5)

function transformH2Section(
  source: string,
  occurrence: number,
  transform: (sectionSource: string) => string,
): string {
  const headings = [...source.matchAll(/^## .+$/gm)]
  const start = headings[occurrence]?.index
  if (start === undefined) return source
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

function insertSkippedHeading(source: string): string {
  return source.replace(
    /^(# .+\n)/,
    "$1\n#### Skipped supporting detail\n\nThis heading skips two levels.\n",
  )
}

function removeThirdH3(source: string): string {
  let occurrence = 0
  return source.replace(/^### /gm, (marker) => {
    occurrence += 1
    return occurrence === 3 ? "" : marker
  })
}

function alterProse(source: string): string {
  return source.toLowerCase().replace(/\bthe\b/, "teh")
}

type FixtureSources = {
  differentProse: string
  caseSpellingVariation: string
  missing: { source: string; feedbackId: string }
  malformed: { source: string; feedbackId: string }
  directFailures: Readonly<Record<string, string>>
}

function fixturesFor(
  problem: NormalizedProblem,
  sources: FixtureSources,
): ProblemFixture[] {
  const fixtures: ProblemFixture[] = [
    {
      id: `${problem.id}-canonical`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "canonical",
      kind: "canonical",
      source: problem.target,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      id: `${problem.id}-different-prose`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "different-prose",
      kind: "alternate",
      source: sources.differentProse,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      id: `${problem.id}-case-spelling`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "case-spelling-variation",
      kind: "case-variation",
      source: sources.caseSpellingVariation,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      id: `${problem.id}-missing`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "missing",
      kind: "missing",
      source: sources.missing.source,
      expectedStatus: "fail",
      expectedFeedbackId: sources.missing.feedbackId,
      exercisesCheckId: sources.missing.feedbackId,
    },
    {
      id: `${problem.id}-malformed`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "malformed",
      kind: "malformed",
      source: sources.malformed.source,
      expectedStatus: "fail",
      expectedFeedbackId: sources.malformed.feedbackId,
      exercisesCheckId: sources.malformed.feedbackId,
    },
    {
      id: `${problem.id}-matched-review`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "matched-with-review",
      kind: "matched-with-refinement",
      source: `${problem.target}\n\n# Extra document title`,
      expectedStatus: "matched",
      expectedReviewIds: ["one-document-title"],
    },
  ]

  const coveredFailures = new Set([
    sources.missing.feedbackId,
    sources.malformed.feedbackId,
  ])
  for (const check of problem.matchChecks) {
    if (coveredFailures.has(check.id)) continue
    const source = sources.directFailures[check.id]
    if (source === undefined) {
      throw new Error(`Missing direct failure source for ${problem.id}/${check.id}`)
    }
    fixtures.push({
      id: `${problem.id}-fails-${check.id}`,
      problemId: problem.id,
      problemRevision: problem.revision,
      role: "edge-case",
      kind: "alternate",
      source,
      expectedStatus: "fail",
      expectedFeedbackId: check.id,
      exercisesCheckId: check.id,
    })
  }
  return fixtures
}

const level3Fixtures = level3Problems.flatMap((problem, index) => {
  const target = problem.target
  const outlineId = `${problem.id}-outline`
  const emphasisId = `${problem.id}-emphasis`
  return fixturesFor(problem, {
    differentProse: level3Problems[(index + 1) % level3Problems.length]!.target,
    caseSpellingVariation: alterProse(target),
    missing: { source: target.replace(/^# /, ""), feedbackId: outlineId },
    malformed: {
      source: target.replace(/\*\*([^*]+)\*\*/, "**$1*"),
      feedbackId: emphasisId,
    },
    directFailures: {
      [outlineId]: target.replace(/^# /, ""),
      [`${problem.id}-sections`]: `${target}\n\n## Extra section\n\nExtra material.`,
      [`${problem.id}-hierarchy`]: insertSkippedHeading(target),
      [emphasisId]: target.replace(/\*\*([^*]+)\*\*/, "$1"),
      [`${problem.id}-actions`]: toOrderedList(target, 1),
    },
  })
})

const level4Fixtures = level4Problems.flatMap((problem, index) => {
  const target = problem.target
  const outlineId = `${problem.id}-outline`
  const verificationId = `${problem.id}-verification`
  return fixturesFor(problem, {
    differentProse: level4Problems[(index + 1) % level4Problems.length]!.target,
    caseSpellingVariation: alterProse(target),
    missing: { source: target.replace(/^# /, ""), feedbackId: outlineId },
    malformed: {
      source: target.replace("```sh", "```"),
      feedbackId: verificationId,
    },
    directFailures: {
      [outlineId]: target.replace(/^# /, ""),
      [`${problem.id}-sections`]: `${target}\n\n## Extra section\n\nExtra material.`,
      [`${problem.id}-hierarchy`]: insertSkippedHeading(target),
      [`${problem.id}-implementation`]: toUnorderedList(target, 2),
      [`${problem.id}-acceptance`]: toOrderedList(target, 3),
      [verificationId]: target.replace("```sh", "```"),
    },
  })
})

const level5Fixtures = level5Problems.flatMap((problem, index) => {
  const target = problem.target
  const outlineId = `${problem.id}-outline`
  const verificationId = `${problem.id}-verification`
  return fixturesFor(problem, {
    differentProse: level5Problems[(index + 1) % level5Problems.length]!.target,
    caseSpellingVariation: alterProse(target),
    missing: { source: target.replace(/^# /, ""), feedbackId: outlineId },
    malformed: {
      source: target.replace("```bash", "```"),
      feedbackId: verificationId,
    },
    directFailures: {
      [outlineId]: target.replace(/^# /, ""),
      [`${problem.id}-sections`]: `${target}\n\n## Extra section\n\nExtra material.`,
      [`${problem.id}-hierarchy`]: insertSkippedHeading(target),
      [`${problem.id}-authority`]: toUnorderedList(target, 1),
      [`${problem.id}-stages`]: removeThirdH3(target),
      [`${problem.id}-constraints`]: toOrderedList(target, 3),
      [`${problem.id}-stops`]: toOrderedList(target, 4),
      [verificationId]: target.replace("```bash", "```"),
      [`${problem.id}-report`]: target.replace("```markdown", "```"),
    },
  })
})

export const level35SeedFixtures: readonly ProblemFixture[] = [
  ...level3Fixtures,
  ...level4Fixtures,
  ...level5Fixtures,
]
