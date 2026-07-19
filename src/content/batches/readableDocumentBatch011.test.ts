import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { readableDocumentBatch011Fixtures } from "./readableDocumentBatch011Fixtures"
import {
  readableDocumentBatch011Inputs,
  readableDocumentBatch011Problems,
} from "./readableDocumentBatch011Problems"

const expectedFamilyCounts = {
  "level3-meeting-agenda-document": 4,
  "level3-reference-note-document": 4,
  "level3-recommendation-brief-document": 4,
} as const

describe("Level 3 composite-document batch 011", () => {
  it("adds twelve recall problems across three new retry families", () => {
    expect(readableDocumentBatch011Problems).toHaveLength(12)
    expect(readableDocumentBatch011Inputs).toHaveLength(12)

    for (const problem of readableDocumentBatch011Problems) {
      expect(problem).toMatchObject({
        level: 3,
        flavor: "standard",
        familyId: "readable-human-document",
        difficulty: "makeover",
        teachingMode: "recall",
        protectedContent: [],
        sourceBatchId: "2026-07-19-l3-composite-documents-011",
        vocabulary: { profile: "workplace-document" },
      })
    }

    const retryCounts = Object.fromEntries(
      Object.keys(expectedFamilyCounts).map((retryFamily) => [
        retryFamily,
        readableDocumentBatch011Problems.filter(
          (problem) => problem.retryFamily === retryFamily,
        ).length,
      ]),
    )
    expect(retryCounts).toEqual(expectedFamilyCounts)
  })

  it("authors concise Goals with three mechanically distinct anatomies", () => {
    for (const problem of readableDocumentBatch011Problems) {
      const wordCount =
        problem.target.match(/[A-Za-z0-9][A-Za-z0-9'`.:-]*/g)?.length ?? 0
      expect(wordCount, problem.id).toBeGreaterThanOrEqual(55)
      expect(wordCount, problem.id).toBeLessThanOrEqual(100)
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })

      const rootTypes = fromMarkdown(problem.target).children.map(
        (node) => node.type,
      )
      if (problem.retryFamily === "level3-meeting-agenda-document") {
        expect(rootTypes, problem.id).toEqual([
          "heading",
          "paragraph",
          "heading",
          "paragraph",
          "thematicBreak",
          "heading",
          "list",
          "heading",
          "list",
        ])
      } else if (problem.retryFamily === "level3-reference-note-document") {
        expect(rootTypes, problem.id).toEqual([
          "heading",
          "paragraph",
          "heading",
          "paragraph",
          "thematicBreak",
          "heading",
          "blockquote",
        ])
      } else {
        expect(rootTypes, problem.id).toEqual([
          "heading",
          "paragraph",
          "heading",
          "list",
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
      readableDocumentBatch011Problems.map((problem) => problem.id),
      readableDocumentBatch011Problems.map((problem) => problem.target),
      readableDocumentBatch011Problems.map((problem) => problem.contentVariant),
      readableDocumentBatch011Problems.map((problem) =>
        JSON.stringify(problem.vocabulary),
      ),
    ]) {
      expect(new Set(values).size).toBe(12)
    }
  })

  it("does not collide with the 224-problem published bank", () => {
    const priorProblems = problemBank.filter(
      (problem) =>
        problem.sourceBatchId !== "2026-07-19-l3-composite-documents-011",
    )
    const priorIds = new Set(priorProblems.map((problem) => problem.id))
    const priorVariants = new Set(
      priorProblems.map((problem) => problem.contentVariant),
    )
    const priorTargets = new Set(
      priorProblems.map((problem) => problem.target),
    )
    const priorVocabulary = new Set(
      priorProblems.map((problem) => JSON.stringify(problem.vocabulary)),
    )

    for (const problem of readableDocumentBatch011Problems) {
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
        readableDocumentBatch011Problems,
        readableDocumentBatch011Fixtures,
      ),
    ).toEqual([])
    expect(readableDocumentBatch011Fixtures).toHaveLength(252)

    for (const problem of readableDocumentBatch011Problems) {
      const fixtures = readableDocumentBatch011Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures, problem.id).toHaveLength(21)
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

      for (const fixture of fixtures) {
        const actual = evaluateProblem(problem, fixture.source)
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
    }
  })
})
