import { fromMarkdown } from "mdast-util-from-markdown"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { buildReviewCorrections } from "../../feedback/reviewCorrections"
import { problemBank } from "../problemBank"
import type { FixtureRole, NormalizedProblem } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { imageBatch028Problems } from "./imageBatch028Problems"
import { imageBatch029Fixtures } from "./imageBatch029Fixtures"
import {
  imageBatch029Id,
  imageBatch029Problems,
} from "./imageBatch029Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

type PositionedNode = {
  type: string
  children?: readonly PositionedNode[]
  position?: { end?: { offset?: number } }
}

function firstDirectLinkEnd(source: string): number {
  const pending: PositionedNode[] = [fromMarkdown(source) as PositionedNode]
  while (pending.length > 0) {
    const node = pending.shift()!
    if (node.type === "link") return node.position?.end?.offset ?? -1
    pending.unshift(...(node.children ?? []))
  }
  return -1
}

function addPoisonTitleToFirstLink(source: string): string {
  const end = firstDirectLinkEnd(source)
  expect(end, source).toBeGreaterThan(0)
  expect(source[end - 1], source).toBe(")")
  return `${source.slice(0, end - 1)} "title ]()")${source.slice(end)}`
}

function withoutRevisionBinding(problem: NormalizedProblem) {
  const { revision: _revision, sourceBatchId: _sourceBatchId, ...content } =
    problem
  return content
}

describe("Level 1 image batch 029", () => {
  it("replaces the accepted image exercises at revision three without changing content", () => {
    expect(imageBatch029Problems).toHaveLength(12)
    expect(imageBatch028Problems.map((problem) => problem.id)).toEqual(
      imageBatch029Problems.map((problem) => problem.id),
    )

    for (const [index, replacement] of imageBatch029Problems.entries()) {
      const prior = imageBatch028Problems[index]!
      expect(replacement, replacement.id).toMatchObject({
        revision: 3,
        sourceBatchId: imageBatch029Id,
      })
      expect(withoutRevisionBinding(replacement), replacement.id).toEqual(
        withoutRevisionBinding(prior),
      )
    }
  })

  it("serves the accepted revision-three replacement after publication", () => {
    const currentById = new Map(
      problemBank.map((problem) => [problem.id, problem]),
    )
    for (const replacement of imageBatch029Problems) {
      expect(currentById.get(replacement.id), replacement.id).toMatchObject({
        revision: 3,
        sourceBatchId: imageBatch029Id,
      })
      expect(
        problemBank.filter((problem) => problem.id === replacement.id),
        replacement.id,
      ).toHaveLength(1)
    }
  })

  it("binds every source boundary to all twelve candidates", () => {
    expect(imageBatch029Fixtures).toHaveLength(324)
    expect(
      validateProblemBank(imageBatch029Problems, imageBatch029Fixtures),
    ).toEqual([])

    for (const problem of imageBatch029Problems) {
      const fixtures = imageBatch029Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures, problem.id).toHaveLength(27)
      for (const role of requiredRoles) {
        expect(
          fixtures.some((fixture) => fixture.role === role),
          `${problem.id}:${role}`,
        ).toBe(true)
      }
      for (const suffix of [
        "title-close-bracket",
        "title-open-parenthesis",
        "title-delimiter-sequence",
        "title-ending-delimiter-sequence",
        "space-only-image-address",
        "angle-empty-image-address",
        "nul-image-address",
        "single-visible-character-alt",
        "escaped-delimiter-sequence-inside-alt",
        "escaped-tight-delimiter-sequence-inside-alt",
      ]) {
        expect(
          fixtures.some((fixture) => fixture.id === `${problem.id}-${suffix}`),
          `${problem.id}:${suffix}`,
        ).toBe(true)
      }
    }
  })

  it("runs all 324 frozen fixtures through the real learner engine", () => {
    const problems = new Map(
      imageBatch029Problems.map((problem) => [problem.id, problem]),
    )

    for (const fixture of imageBatch029Fixtures) {
      const result = evaluateProblem(
        problems.get(fixture.problemId)!,
        fixture.source,
      )
      expect(result.status, fixture.id).toBe(fixture.expectedStatus)
      if (result.status === "fail") {
        expect(result.feedbackId, fixture.id).toBe(fixture.expectedFeedbackId)
      } else {
        expect(result.reviewItems.map((item) => item.id), fixture.id).toEqual(
          fixture.expectedReviewIds ?? [],
        )
      }
    }
  })

  it("stops when the reviewed learner instruction changes", () => {
    const problems = new Map(
      imageBatch029Problems.map((problem) => [problem.id, problem]),
    )
    const instructions = new Set<string>()

    for (const fixture of imageBatch029Fixtures.filter(
      (candidate) => candidate.expectedStatus === "fail",
    )) {
      const problem = problems.get(fixture.problemId)!
      const result = evaluateProblem(problem, fixture.source)
      expect(result.status, fixture.id).toBe("fail")
      if (result.status !== "fail") continue
      const instruction = buildReviewCorrections(
        problem,
        result,
        fixture.source,
      )[0]?.repairInstruction
      expect(instruction, fixture.id).toBeDefined()
      instructions.add(instruction!)
    }

    expect(instructions.size).toBe(1)
    const feedbackDigest = createHash("sha256")
      .update(JSON.stringify([...instructions].sort()))
      .digest("hex")
    expect(
      feedbackDigest,
      "Learner feedback changed. Before updating the reviewed digest, ask: does this sentence cover every failure this contract rejects?",
    ).toBe("5605dffe07c28011ca92f813bd45519829c229682e1ecc31cbd9b67d5280dd48")
  })

  it("keeps all 36 link-shape consumers matched with the same poison title", () => {
    const linkDestinationProblems = problemBank.filter((problem) =>
      problem.matchChecks.some(
        (check) =>
          check.kind === "link-shape" && check.requireNonemptyDestination,
      ),
    )
    expect(linkDestinationProblems).toHaveLength(36)

    for (const problem of linkDestinationProblems) {
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe(
        "matched",
      )
      const poisoned = addPoisonTitleToFirstLink(problem.target)
      expect(evaluateProblem(problem, poisoned).status, problem.id).toBe(
        "matched",
      )
    }
  })
})
