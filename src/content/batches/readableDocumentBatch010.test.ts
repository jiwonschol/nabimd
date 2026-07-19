import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { readableDocumentBatch010Fixtures } from "./readableDocumentBatch010Fixtures"
import {
  readableDocumentBatch010Inputs,
  readableDocumentBatch010Problems,
} from "./readableDocumentBatch010Problems"

const expectedFamilyCounts = {
  "level3-status-handoff-document": 4,
  "level3-how-to-document": 4,
  "level3-decision-record": 4,
} as const

describe("Level 3 readable-document batch 010", () => {
  it("adds twelve recall problems across three structural retry families", () => {
    expect(readableDocumentBatch010Problems).toHaveLength(12)
    expect(readableDocumentBatch010Inputs).toHaveLength(12)

    for (const problem of readableDocumentBatch010Problems) {
      expect(problem).toMatchObject({
        level: 3,
        flavor: "standard",
        familyId: "readable-human-document",
        difficulty: "makeover",
        teachingMode: "recall",
        protectedContent: [],
        sourceBatchId: "2026-07-19-l3-readable-documents-010",
        vocabulary: { profile: "workplace-document" },
      })
    }

    const retryCounts = Object.fromEntries(
      Object.keys(expectedFamilyCounts).map((retryFamily) => [
        retryFamily,
        readableDocumentBatch010Problems.filter(
          (problem) => problem.retryFamily === retryFamily,
        ).length,
      ]),
    )
    expect(retryCounts).toEqual(expectedFamilyCounts)
  })

  it("authors concise, readable Goals with three genuinely distinct anatomies", () => {
    for (const problem of readableDocumentBatch010Problems) {
      const wordCount = problem.target.match(/[A-Za-z0-9][A-Za-z0-9'`.:-]*/g)?.length ?? 0
      expect(wordCount, problem.id).toBeGreaterThanOrEqual(55)
      expect(wordCount, problem.id).toBeLessThanOrEqual(100)
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })

      const rootTypes = fromMarkdown(problem.target).children.map((node) => node.type)
      if (problem.retryFamily === "level3-status-handoff-document") {
        expect(rootTypes, problem.id).toEqual([
          "heading",
          "paragraph",
          "heading",
          "paragraph",
          "heading",
          "list",
        ])
      } else if (problem.retryFamily === "level3-how-to-document") {
        expect(rootTypes, problem.id).toEqual([
          "heading",
          "paragraph",
          "heading",
          "list",
          "heading",
          "list",
        ])
      } else {
        expect(rootTypes, problem.id).toEqual([
          "heading",
          "paragraph",
          "heading",
          "paragraph",
          "heading",
          "blockquote",
          "heading",
          "list",
        ])
      }
    }
  })

  it("keeps identifiers, Goals, variants, and vocabulary unique", () => {
    for (const values of [
      readableDocumentBatch010Problems.map((problem) => problem.id),
      readableDocumentBatch010Problems.map((problem) => problem.target),
      readableDocumentBatch010Problems.map((problem) => problem.contentVariant),
      readableDocumentBatch010Problems.map((problem) =>
        JSON.stringify(problem.vocabulary),
      ),
    ]) {
      expect(new Set(values).size).toBe(12)
    }
  })

  it("does not collide with the 212-problem published bank", () => {
    const priorProblems = problemBank.filter(
      (problem) =>
        problem.sourceBatchId !== "2026-07-19-l3-readable-documents-010",
    )
    const priorIds = new Set(priorProblems.map((problem) => problem.id))
    const priorVariants = new Set(
      priorProblems.map((problem) => problem.contentVariant),
    )
    const priorTargets = new Set(priorProblems.map((problem) => problem.target))
    const priorVocabulary = new Set(
      priorProblems.map((problem) => JSON.stringify(problem.vocabulary)),
    )

    for (const problem of readableDocumentBatch010Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(
        priorVocabulary.has(JSON.stringify(problem.vocabulary)),
        problem.id,
      ).toBe(false)
    }
  })

  it("gives every match check direct real-engine fixture evidence", () => {
    expect(
      validateProblemBank(
        readableDocumentBatch010Problems,
        readableDocumentBatch010Fixtures,
      ),
    ).toEqual([])

    for (const problem of readableDocumentBatch010Problems) {
      const fixtures = readableDocumentBatch010Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length, problem.id).toBeGreaterThanOrEqual(15)
      expect(fixtures.length, problem.id).toBeLessThanOrEqual(18)
      expect(new Set(fixtures.map((fixture) => fixture.source)).size, problem.id).toBe(
        fixtures.length,
      )
      expect(
        new Set(
          fixtures
            .map((fixture) => fixture.exercisesCheckId)
            .filter((id): id is string => Boolean(id)),
        ),
        problem.id,
      ).toEqual(new Set(problem.matchChecks.map((check) => check.id)))
    }
  })

  it.each(readableDocumentBatch010Fixtures)(
    "runs $id through the real grading engine",
    (fixture) => {
      const problem = readableDocumentBatch010Problems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      expect(problem).toBeDefined()

      const actual = evaluateProblem(problem!, fixture.source)
      expect(actual.status).toBe(fixture.expectedStatus)
      if (actual.status === "fail") {
        expect(actual.feedbackId).toBe(fixture.expectedFeedbackId)
      } else {
        expect(actual.reviewItems.map((item) => item.id)).toEqual(
          fixture.expectedReviewIds ?? [],
        )
      }
    },
  )
})
