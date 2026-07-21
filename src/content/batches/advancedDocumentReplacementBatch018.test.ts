import type { RootContent } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import type { FixtureRole } from "../types"
import { advancedDocumentReplacementBatch018Fixtures } from "./advancedDocumentReplacementBatch018Fixtures"
import { advancedDocumentReplacementBatch018Problems } from "./advancedDocumentReplacementBatch018Problems"

const expectedRevisions = new Map<string, number>([
  ["l4-api-field-deprecation-migration", 2],
  ["l4-cache-namespace-migration", 2],
  ["l4-configuration-key-migration", 2],
  ["l4-duplicate-form-submission-investigation", 2],
  ["l4-lost-pagination-cursor-investigation", 2],
  ["l4-nullable-column-backfill-migration", 2],
  ["l4-offline-retry-banner-investigation", 2],
  ["l4-stale-permission-badge-investigation", 2],
  ["l5-auth-migration-work-order", 3],
  ["l5-dependency-upgrade-work-order", 3],
  ["l5-performance-recovery-work-order", 3],
  ["l5-release-context-work-order", 3],
  ["l5-analytics-adapter-refactor-work-order", 2],
  ["l5-api-contract-rollout-work-order", 2],
  ["l5-date-format-refactor-work-order", 2],
  ["l5-duplicate-job-recovery-work-order", 2],
  ["l5-notification-schema-rollout-work-order", 2],
  ["l5-search-index-recovery-work-order", 2],
])

const compliantCandidates = new Set([
  "l3-badge-reader-impact-brief",
  "l3-support-queue-impact-brief",
  "l4-accessible-dialog-spec",
  "l4-audit-archive-contract-spec",
  "l4-contact-import-contract-spec",
  "l4-customer-digest-contract-spec",
  "l4-editor-save-status-spec",
  "l4-notification-retry-spec",
  "l4-project-archive-spec",
  "l4-project-list-export-spec",
  "l4-search-filter-spec",
  "l4-support-webhook-contract-spec",
  "l4-table-density-spec",
  "l4-timezone-bug-spec",
])

const grammarPredicateAllowlist = new Set([
  "block-count",
  "block-sequence",
  "blockquote-shape",
  "code-block",
  "document-limits",
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

const requiredFixtureRoles: ReadonlySet<FixtureRole> = new Set([
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
])

function authoredWordCount(source: string): number {
  return source.match(/[A-Za-z0-9][A-Za-z0-9'`.:/-]*/g)?.length ?? 0
}

function authoredListSizes(source: string): number[] {
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

describe("advanced-document replacement batch 018", () => {
  it("replaces exactly the eighteen over-budget records at their next revisions", () => {
    expect(advancedDocumentReplacementBatch018Problems).toHaveLength(18)

    const actualRevisions = new Map(
      advancedDocumentReplacementBatch018Problems.map((problem) => [
        problem.id,
        problem.revision,
      ]),
    )
    expect(actualRevisions).toEqual(expectedRevisions)
    expect(
      advancedDocumentReplacementBatch018Problems.filter(
        (problem) => problem.level === 4,
      ),
    ).toHaveLength(8)
    expect(
      advancedDocumentReplacementBatch018Problems.filter(
        (problem) => problem.level === 5,
      ),
    ).toHaveLength(10)
    expect(
      advancedDocumentReplacementBatch018Problems.some((problem) =>
        compliantCandidates.has(problem.id),
      ),
    ).toBe(false)
  })

  it("keeps every replacement inside the corrected reading and list budgets", () => {
    for (const problem of advancedDocumentReplacementBatch018Problems) {
      expect(problem.target.split("\n").length, problem.id).toBeLessThanOrEqual(
        40,
      )
      expect(authoredWordCount(problem.target), problem.id).toBeLessThanOrEqual(
        165,
      )
      expect(
        authoredListSizes(problem.target).every((size) => size <= 3),
        problem.id,
      ).toBe(true)
    }
  })

  it("reclassifies Level 4 as short workplace practice, not developer work", () => {
    const level4Problems = advancedDocumentReplacementBatch018Problems.filter(
      (problem) => problem.level === 4,
    )
    expect(new Set(level4Problems.map((problem) => problem.familyId))).toEqual(
      new Set(["workplace-process-change", "workplace-issue-note"]),
    )
    for (const problem of level4Problems) {
      expect(`${problem.prompt}\n${problem.target}`, problem.id).not.toMatch(
        /\b(?:API|cache|schema|adapter|typecheck|npm|e2e)\b/i,
      )
    }
  })

  it("gives every replacement exactly one enforceable forty-line document limit", () => {
    for (const problem of advancedDocumentReplacementBatch018Problems) {
      const limits = problem.matchChecks.filter(
        (check) => check.kind === "document-limits",
      )
      expect(limits, problem.id).toHaveLength(1)
      expect(limits[0]!.maxLines, problem.id).toBeDefined()
      expect(limits[0]!.maxLines, problem.id).toBeLessThanOrEqual(40)
    }
  })

  it("grades Markdown grammar only and never protects authored prose", () => {
    for (const problem of advancedDocumentReplacementBatch018Problems) {
      expect(problem.protectedContent, problem.id).toEqual([])

      for (const check of problem.matchChecks) {
        expect(grammarPredicateAllowlist.has(check.kind), `${problem.id}/${check.id}`).toBe(
          true,
        )

        const operands = withoutPresentationFields(check)
        expect(
          operandKeys(operands).filter((key) =>
            forbiddenSemanticOperandKeys.has(key),
          ),
          `${problem.id}/${check.id}`,
        ).toEqual([])

        const serializedOperands = JSON.stringify(operands)
        for (const heading of problem.target.matchAll(/^#{1,6} (.+)$/gm)) {
          expect(serializedOperands, `${problem.id}/${check.id}`).not.toContain(
            heading[1],
          )
        }
      }
    }
  })

  it("matches every authored Goal through the real grading engine", () => {
    for (const problem of advancedDocumentReplacementBatch018Problems) {
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("validates required fixtures and directly exercises every check", () => {
    expect(
      validateProblemBank(
        advancedDocumentReplacementBatch018Problems,
        advancedDocumentReplacementBatch018Fixtures,
      ),
    ).toEqual([])

    for (const problem of advancedDocumentReplacementBatch018Problems) {
      const fixtures = advancedDocumentReplacementBatch018Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length, problem.id).toBeGreaterThan(0)
      const fixtureRoles = new Set(
        fixtures
          .map((fixture) => fixture.role)
          .filter((role): role is FixtureRole => role !== undefined),
      )
      for (const role of requiredFixtureRoles) {
        expect(fixtureRoles.has(role), `${problem.id}/${role}`).toBe(true)
      }
      const reviewFixture = fixtures.find(
        (fixture) => fixture.role === "matched-with-review",
      )
      expect(reviewFixture?.expectedReviewIds, problem.id).toBeDefined()
      expect(reviewFixture!.expectedReviewIds!.length, problem.id).toBeGreaterThan(0)

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

  it("has one isolated failing fixture for each document-limit check", () => {
    for (const problem of advancedDocumentReplacementBatch018Problems) {
      const limit = problem.matchChecks.find(
        (check) => check.kind === "document-limits",
      )
      expect(limit, problem.id).toBeDefined()

      const directLimitFailures = advancedDocumentReplacementBatch018Fixtures.filter(
        (fixture) =>
          fixture.problemId === problem.id &&
          fixture.exercisesCheckId === limit!.id &&
          fixture.expectedStatus === "fail",
      )
      expect(directLimitFailures, problem.id).toHaveLength(1)
      expect(
        directLimitFailures[0]!.source.split("\n").length,
        directLimitFailures[0]!.id,
      ).toBeGreaterThan(limit!.maxLines!)

      const actual = evaluateProblem(problem, directLimitFailures[0]!.source)
      expect(
        actual,
        directLimitFailures[0]!.id,
      ).toMatchObject({
        status: "fail",
        feedbackId: limit!.id,
      })
      expect(
        actual.status === "fail"
          ? actual.failures.map((failure) => failure.feedbackId)
          : [],
        directLimitFailures[0]!.id,
      ).toEqual([limit!.id])
    }
  })

  it("runs every fixture through the real learner grading engine", () => {
    for (const fixture of advancedDocumentReplacementBatch018Fixtures) {
      const problem = advancedDocumentReplacementBatch018Problems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      expect(problem, fixture.id).toBeDefined()

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
