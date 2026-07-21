import { describe, expect, it } from "vitest"
import { fromMarkdown } from "mdast-util-from-markdown"
import type { RootContent } from "mdast"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { advancedDocumentBatch017Fixtures } from "./advancedDocumentBatch017Fixtures"
import {
  advancedDocumentBatch017Id,
  advancedDocumentBatch017Inputs,
  advancedDocumentBatch017Problems,
} from "./advancedDocumentBatch017Problems"

const expectedProblems = [
  {
    id: "l3-support-queue-impact-brief",
    level: 3,
    familyId: "readable-human-document",
    retryFamily: "level3-operational-impact-brief",
    profile: "workplace-document",
  },
  {
    id: "l3-badge-reader-impact-brief",
    level: 3,
    familyId: "readable-human-document",
    retryFamily: "level3-operational-impact-brief",
    profile: "workplace-document",
  },
  {
    id: "l4-support-webhook-contract-spec",
    level: 4,
    familyId: "executable-development-spec",
    retryFamily: "level4-integration-contract-spec",
    profile: "development-spec",
  },
  {
    id: "l4-contact-import-contract-spec",
    level: 4,
    familyId: "executable-development-spec",
    retryFamily: "level4-integration-contract-spec",
    profile: "development-spec",
  },
  {
    id: "l4-customer-digest-contract-spec",
    level: 4,
    familyId: "executable-development-spec",
    retryFamily: "level4-integration-contract-spec",
    profile: "development-spec",
  },
  {
    id: "l4-audit-archive-contract-spec",
    level: 4,
    familyId: "executable-development-spec",
    retryFamily: "level4-integration-contract-spec",
    profile: "development-spec",
  },
  {
    id: "l5-duplicate-job-recovery-work-order",
    level: 5,
    familyId: "agent-ready-work-order",
    retryFamily: "level5-evidence-recovery-work-order",
    profile: "agent-workflow",
  },
  {
    id: "l5-search-index-recovery-work-order",
    level: 5,
    familyId: "agent-ready-work-order",
    retryFamily: "level5-evidence-recovery-work-order",
    profile: "agent-workflow",
  },
  {
    id: "l5-date-format-refactor-work-order",
    level: 5,
    familyId: "agent-ready-work-order",
    retryFamily: "level5-bounded-refactor-work-order",
    profile: "agent-workflow",
  },
  {
    id: "l5-analytics-adapter-refactor-work-order",
    level: 5,
    familyId: "agent-ready-work-order",
    retryFamily: "level5-bounded-refactor-work-order",
    profile: "agent-workflow",
  },
  {
    id: "l5-api-contract-rollout-work-order",
    level: 5,
    familyId: "agent-ready-work-order",
    retryFamily: "level5-coordinated-rollout-work-order",
    profile: "agent-workflow",
  },
  {
    id: "l5-notification-schema-rollout-work-order",
    level: 5,
    familyId: "agent-ready-work-order",
    retryFamily: "level5-coordinated-rollout-work-order",
    profile: "agent-workflow",
  },
] as const

const expectedRetryFamilyCounts = new Map([
  ["level3-operational-impact-brief", 2],
  ["level4-integration-contract-spec", 4],
  ["level5-evidence-recovery-work-order", 2],
  ["level5-bounded-refactor-work-order", 2],
  ["level5-coordinated-rollout-work-order", 2],
])

const grammarPredicateAllowlist = new Set([
  "block-count",
  "block-sequence",
  "blockquote-shape",
  "code-block",
  "heading-depth-order",
  "inline-code-shape",
  "inline-presence",
  "link-shape",
  "list-shape",
])

const forbiddenSemanticOperandKeys = new Set([
  "content",
  "expectedText",
  "headingLabel",
  "headingText",
  "literal",
  "pattern",
  "regex",
  "text",
  "title",
  "value",
])

function withoutPresentationFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutPresentationFields)
  if (value === null || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "id" && key !== "feedback")
      .map(([key, child]) => [key, withoutPresentationFields(child)]),
  )
}

function operandKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(operandKeys)
  if (value === null || typeof value !== "object") return []

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => [key, ...operandKeys(child)],
  )
}

function countByLevel() {
  return Object.fromEntries(
    [3, 4, 5].map((level) => [
      level,
      advancedDocumentBatch017Problems.filter(
        (problem) => problem.level === level,
      ).length,
    ]),
  )
}

function authoredWordCount(source: string) {
  return source.match(/[A-Za-z0-9][A-Za-z0-9'`.:/-]*/g)?.length ?? 0
}

function authoredListSizes(source: string) {
  const sizes: number[] = []
  const visit = (node: RootContent) => {
    if (node.type === "list") sizes.push(node.children.length)
    if ("children" in node) {
      for (const child of node.children) visit(child as RootContent)
    }
  }
  for (const node of fromMarkdown(source).children) visit(node)
  return sizes
}

describe("Level 3-5 advanced-document batch 017", () => {
  it("freezes the exact two, four, and six reviewed additions", () => {
    expect(advancedDocumentBatch017Inputs).toHaveLength(12)
    expect(advancedDocumentBatch017Problems).toHaveLength(12)
    expect(countByLevel()).toEqual({ 3: 2, 4: 4, 5: 6 })

    expect(
      advancedDocumentBatch017Problems.map((problem) => ({
        id: problem.id,
        level: problem.level,
        familyId: problem.familyId,
        retryFamily: problem.retryFamily,
        profile: problem.vocabulary.profile,
      })),
    ).toEqual(expectedProblems)
  })

  it("keeps every retry family large enough to offer a different prompt", () => {
    const actualCounts = new Map<string, number>()
    for (const problem of advancedDocumentBatch017Problems) {
      actualCounts.set(
        problem.retryFamily,
        (actualCounts.get(problem.retryFamily) ?? 0) + 1,
      )
    }

    expect(actualCounts).toEqual(expectedRetryFamilyCounts)
  })

  it("uses only structural Markdown predicates without heading-text operands", () => {
    const actualKinds = new Set(
      advancedDocumentBatch017Problems.flatMap((problem) =>
        problem.matchChecks.map((check) => check.kind),
      ),
    )
    expect(actualKinds).toEqual(grammarPredicateAllowlist)

    for (const problem of advancedDocumentBatch017Problems) {
      for (const check of problem.matchChecks) {
        const operands = withoutPresentationFields(check)
        expect(
          operandKeys(operands).filter((key) =>
            forbiddenSemanticOperandKeys.has(key),
          ),
          `${problem.id}/${check.id}`,
        ).toEqual([])

        const serializedOperands = JSON.stringify(operands)
        const headings = [...problem.target.matchAll(/^#{1,6} (.+)$/gm)].map(
          (match) => match[1],
        )
        for (const heading of headings) {
          expect(serializedOperands, `${problem.id}/${check.id}`).not.toContain(
            heading,
          )
        }
      }
    }
  })

  it("keeps Goals substantial but brief enough to practice Markdown rather than reading", () => {
    const wordRangeByLevel = {
      3: { min: 90, max: 150 },
      4: { min: 95, max: 165 },
      5: { min: 150, max: 230 },
    } as const
    const maximumLinesByLevel = { 3: 28, 4: 40, 5: 65 } as const

    for (const problem of advancedDocumentBatch017Problems) {
      const level = problem.level as 3 | 4 | 5
      const words = authoredWordCount(problem.target)
      expect(words, problem.id).toBeGreaterThanOrEqual(wordRangeByLevel[level].min)
      expect(words, problem.id).toBeLessThanOrEqual(wordRangeByLevel[level].max)
      expect(problem.target.split("\n").length, problem.id).toBeLessThanOrEqual(
        maximumLinesByLevel[level],
      )
      if (level >= 4) {
        expect(
          authoredListSizes(problem.target).every((size) => size <= 3),
          problem.id,
        ).toBe(true)
      }
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("pins the current Level 5 agent-work-order convention", () => {
    for (const problem of advancedDocumentBatch017Problems) {
      if (problem.level === 5) {
        expect(problem.convention, problem.id).toEqual({
          id: "nabi-agent-work-order",
          version: "2026.07",
          reviewedOn: "2026-07-20",
        })
      } else {
        expect(problem.convention, problem.id).toBeUndefined()
      }
    }
  })

  it("does not collide with the accepted bank or within the batch", () => {
    const batchIds = new Set(
      advancedDocumentBatch017Problems.map((problem) => problem.id),
    )
    const previousBank = problemBank.filter(
      (problem) =>
        problem.sourceBatchId !== advancedDocumentBatch017Id &&
        !batchIds.has(problem.id),
    )
    const priorIds = new Set(previousBank.map((problem) => problem.id))
    const priorTargets = new Set(previousBank.map((problem) => problem.target))
    const priorVariants = new Set(
      previousBank.map((problem) => problem.contentVariant),
    )
    const ownIds = new Set<string>()
    const ownTargets = new Set<string>()
    const ownVariants = new Set<string>()
    const ownExamples = new Set<string>()

    for (const problem of advancedDocumentBatch017Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(ownIds.has(problem.id), problem.id).toBe(false)
      expect(ownTargets.has(problem.target), problem.id).toBe(false)
      expect(ownVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(ownExamples.has(problem.teaching.example), problem.id).toBe(false)
      ownIds.add(problem.id)
      ownTargets.add(problem.target)
      ownVariants.add(problem.contentVariant)
      ownExamples.add(problem.teaching.example)
    }
  })

  it("validates the fixture matrix and gives every structural check direct evidence", () => {
    expect(
      validateProblemBank(
        advancedDocumentBatch017Problems,
        advancedDocumentBatch017Fixtures,
      ),
    ).toEqual([])

    for (const problem of advancedDocumentBatch017Problems) {
      const fixtures = advancedDocumentBatch017Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length, problem.id).toBeGreaterThan(0)
      expect(new Set(fixtures.map((fixture) => fixture.id)).size, problem.id).toBe(
        fixtures.length,
      )
      expect(new Set(fixtures.map((fixture) => fixture.source)).size, problem.id).toBe(
        fixtures.length,
      )

      const directCoverage = new Set(
        fixtures
          .map((fixture) => fixture.exercisesCheckId)
          .filter((checkId): checkId is string => Boolean(checkId)),
      )
      expect(directCoverage, problem.id).toEqual(
        new Set(problem.matchChecks.map((check) => check.id)),
      )
    }
  })

  it("runs every fixture through the real learner grading engine", () => {
    for (const fixture of advancedDocumentBatch017Fixtures) {
      const problem = advancedDocumentBatch017Problems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      expect(problem).toBeDefined()

      const actual = evaluateProblem(problem!, fixture.source)
      if (fixture.expectedStatus === "fail") {
        expect(actual, fixture.id).toMatchObject({
          status: "fail",
          feedbackId: fixture.expectedFeedbackId,
        })
      } else {
        expect(actual, fixture.id).toEqual({
          status: "matched",
          reviewItems: (fixture.expectedReviewIds ?? []).map((id) =>
            expect.objectContaining({ id }),
          ),
        })
      }
    }
  })
})
