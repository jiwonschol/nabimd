import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { developmentSpecBatch012Fixtures } from "./developmentSpecBatch012Fixtures"
import {
  developmentSpecBatch012Id,
  developmentSpecBatch012Inputs,
  developmentSpecBatch012Problems,
} from "./developmentSpecBatch012Problems"

const expectedFamilyCounts = {
  "level4-feature-interface-spec": 4,
  "level4-bug-investigation-spec": 4,
  "level4-staged-migration-spec": 4,
} as const

const expectedFixtureCounts = {
  "level4-feature-interface-spec": 39,
  "level4-bug-investigation-spec": 43,
  "level4-staged-migration-spec": 40,
} as const

const featureRootTypes = [
  "heading",
  "paragraph",
  "heading",
  "list",
  "heading",
  "paragraph",
  "heading",
  "blockquote",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "code",
] as const

const bugRootTypes = [
  "heading",
  "paragraph",
  "heading",
  "blockquote",
  "thematicBreak",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "blockquote",
  "heading",
  "list",
] as const

const migrationRootTypes = [
  "heading",
  "paragraph",
  "heading",
  "list",
  "heading",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "list",
  "heading",
  "blockquote",
  "heading",
  "code",
] as const

describe("Level 4 development-spec batch 012", () => {
  it("adds twelve recall problems across three mechanically distinct retry families", () => {
    expect(developmentSpecBatch012Problems).toHaveLength(12)
    expect(developmentSpecBatch012Inputs).toHaveLength(12)

    for (const problem of developmentSpecBatch012Problems) {
      expect(problem).toMatchObject({
        level: 4,
        flavor: "standard",
        familyId: "executable-development-spec",
        difficulty: "makeover",
        teachingMode: "recall",
        protectedContent: [],
        sourceBatchId: developmentSpecBatch012Id,
        vocabulary: { profile: "development-spec" },
      })
      expect(problem.convention).toBeUndefined()
    }

    const retryCounts = Object.fromEntries(
      Object.keys(expectedFamilyCounts).map((retryFamily) => [
        retryFamily,
        developmentSpecBatch012Problems.filter(
          (problem) => problem.retryFamily === retryFamily,
        ).length,
      ]),
    )
    expect(retryCounts).toEqual(expectedFamilyCounts)
  })

  it("keeps realistic Level 4 Goals within the reviewed length band", () => {
    for (const problem of developmentSpecBatch012Problems) {
      const wordCount =
        problem.target.match(/[A-Za-z0-9][A-Za-z0-9'`.:-]*/g)?.length ?? 0
      expect(wordCount, problem.id).toBeGreaterThanOrEqual(110)
      expect(wordCount, problem.id).toBeLessThanOrEqual(230)
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("freezes the three exact canonical root anatomies", () => {
    for (const problem of developmentSpecBatch012Problems) {
      const rootTypes = fromMarkdown(problem.target).children.map(
        (node) => node.type,
      )
      if (problem.retryFamily === "level4-feature-interface-spec") {
        expect(rootTypes, problem.id).toEqual(featureRootTypes)
      } else if (problem.retryFamily === "level4-bug-investigation-spec") {
        expect(rootTypes, problem.id).toEqual(bugRootTypes)
      } else {
        expect(rootTypes, problem.id).toEqual(migrationRootTypes)
      }
    }
  })

  it("keeps identifiers, Goals, variants, and vocabulary unique", () => {
    for (const values of [
      developmentSpecBatch012Problems.map((problem) => problem.id),
      developmentSpecBatch012Problems.map((problem) => problem.target),
      developmentSpecBatch012Problems.map((problem) => problem.contentVariant),
      developmentSpecBatch012Problems.map((problem) =>
        JSON.stringify(problem.vocabulary),
      ),
    ]) {
      expect(new Set(values).size).toBe(12)
    }
  })

  it("does not collide with the previously published bank", () => {
    const batchIds = new Set(
      developmentSpecBatch012Problems.map((problem) => problem.id),
    )
    const priorProblems = problemBank.filter(
      (problem) =>
        problem.sourceBatchId !== developmentSpecBatch012Id &&
        !batchIds.has(problem.id),
    )
    const priorIds = new Set(priorProblems.map((problem) => problem.id))
    const priorVariants = new Set(
      priorProblems.map((problem) => problem.contentVariant),
    )
    const priorTargets = new Set(priorProblems.map((problem) => problem.target))
    const priorVocabulary = new Set(
      priorProblems.map((problem) => JSON.stringify(problem.vocabulary)),
    )

    for (const problem of developmentSpecBatch012Problems) {
      expect(priorIds.has(problem.id), problem.id).toBe(false)
      expect(priorVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(priorTargets.has(problem.target), problem.id).toBe(false)
      expect(
        priorVocabulary.has(JSON.stringify(problem.vocabulary)),
        problem.id,
      ).toBe(false)
    }
  })

  it("gives every check unique, direct real-engine evidence", () => {
    expect(
      validateProblemBank(
        developmentSpecBatch012Problems,
        developmentSpecBatch012Fixtures,
      ),
    ).toEqual([])
    expect(developmentSpecBatch012Fixtures).toHaveLength(488)

    for (const problem of developmentSpecBatch012Problems) {
      const fixtures = developmentSpecBatch012Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures, problem.id).toHaveLength(
        expectedFixtureCounts[
          problem.retryFamily as keyof typeof expectedFixtureCounts
        ],
      )
      expect(new Set(fixtures.map((fixture) => fixture.id)).size, problem.id).toBe(
        fixtures.length,
      )
      const fixturesBySource = new Map<string, typeof fixtures>()
      for (const fixture of fixtures) {
        const group = fixturesBySource.get(fixture.source) ?? []
        fixturesBySource.set(fixture.source, [...group, fixture])
      }
      const duplicateSourceFixtures = [...fixturesBySource.values()]
        .filter((group) => group.length > 1)
        .map((group) => group.map((fixture) => fixture.id))
      expect(duplicateSourceFixtures, problem.id).toEqual([])
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
