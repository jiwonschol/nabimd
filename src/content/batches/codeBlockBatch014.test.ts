import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import {
  createTurnProblemIds,
  getSyntaxFamily,
} from "../../selection/runComposition"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { codeBlockBatch014Fixtures } from "./codeBlockBatch014Fixtures"
import {
  codeBlockBatch014Problems,
  codeBlockRebuildInputs,
} from "./codeBlockBatch014Problems"

const batchId = "2026-07-20-l1-code-block-l2-rebuilds-014"

describe("fenced code-block and rebuild batch 014", () => {
  it("adds twelve Level 1 lessons and twelve Level 2 rebuilds", () => {
    expect(codeBlockBatch014Problems).toHaveLength(24)
    expect(codeBlockRebuildInputs).toHaveLength(12)

    for (const level of [1, 2] as const) {
      const problems = codeBlockBatch014Problems.filter(
        (problem) => problem.level === level,
      )
      expect(problems).toHaveLength(12)
      expect(new Set(problems.map((problem) => problem.id)).size).toBe(12)
      expect(new Set(problems.map((problem) => problem.contentVariant)).size).toBe(12)
      expect(
        problems.every(
          (problem) =>
            problem.sourceBatchId === batchId &&
            problem.flavor === "standard",
        ),
      ).toBe(true)
    }
  })

  it("schedules Level 1 code blocks and keeps Level 2 rebuilds composite", () => {
    const levelOne = codeBlockBatch014Problems.filter(
      (problem) => problem.level === 1,
    )
    const levelTwo = codeBlockBatch014Problems.filter(
      (problem) => problem.level === 2,
    )

    expect(levelOne.every((problem) => getSyntaxFamily(problem) === "code-block")).toBe(true)
    expect(levelTwo.every((problem) => getSyntaxFamily(problem) === null)).toBe(true)
    expect(new Set(levelTwo.map((problem) => problem.retryFamily))).toEqual(
      new Set([
        "level-2-code-block-sample-note",
        "level-2-code-block-quick-reference",
        "level-2-code-block-numbered-routine",
      ]),
    )
    for (const family of [
      "sample-note",
      "quick-reference",
      "numbered-routine",
    ]) {
      expect(codeBlockRebuildInputs.filter((input) => input.family === family)).toHaveLength(4)
    }
  })

  it("makes every Level 2 variant reachable within one stable session seed", () => {
    const candidateBank = [...problemBank, ...codeBlockBatch014Problems]
    const batchLevelTwo = codeBlockBatch014Problems.filter(
      (problem) => problem.level === 2,
    )
    const batchIds = new Set(batchLevelTwo.map(({ id }) => id))
    const byId = new Map(candidateBank.map((problem) => [problem.id, problem]))

    for (const seed of Array.from({ length: 256 }, (_, seed) => seed)) {
      const seen = new Set<string>()
      for (let turn = 0; turn < 48; turn += 1) {
        const selected = createTurnProblemIds(2, turn, candidateBank, seed)
        for (const id of selected) {
          if (batchIds.has(id)) seen.add(id)
        }
        const atLevelFamilies = selected
          .slice(0, 4)
          .map((id) => byId.get(id)!.retryFamily)
        expect(
          atLevelFamilies.every(
            (family, index) =>
              index === 0 || family !== atLevelFamilies[index - 1],
          ),
        ).toBe(true)
      }
      expect(seen).toEqual(batchIds)
    }
  })

  it("teaches a closed nonempty fence and authors compact real-document Goals", () => {
    for (const problem of codeBlockBatch014Problems) {
      const codeCheck = problem.matchChecks.find(
        (check) => check.kind === "code-block",
      )
      expect(codeCheck).toMatchObject({
        kind: "code-block",
        min: 1,
        requireFenced: true,
        requireClosedFence: true,
        requireNonemptyContent: true,
      })
      expect(codeCheck).not.toHaveProperty("requireLanguageTag")
      expect(problem.target).toMatch(/```\n[^\n]+\n```/)
      expect(problem.teaching?.example).not.toBe(problem.target)

      const rootTypes = fromMarkdown(problem.target).children.map(
        (node) => node.type,
      )
      expect(rootTypes).toEqual(
        problem.level === 1
          ? ["code"]
          : problem.retryFamily === "level-2-code-block-sample-note"
            ? ["heading", "blockquote", "code"]
            : problem.retryFamily === "level-2-code-block-quick-reference"
              ? ["heading", "code", "list"]
              : ["heading", "code", "list"],
      )
    }
  })

  it("does not collide with the published 272-problem bank", () => {
    const previousBank = problemBank.filter(
      (problem) => problem.sourceBatchId !== batchId,
    )
    const previousIds = new Set(previousBank.map((problem) => problem.id))
    const previousVariants = new Set(
      previousBank.map((problem) => problem.contentVariant),
    )
    const previousTargets = new Set(previousBank.map((problem) => problem.target))
    const ownTargets = new Set<string>()

    for (const problem of codeBlockBatch014Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(ownTargets.has(problem.target), problem.id).toBe(false)
      ownTargets.add(problem.target)
    }
  })

  it("binds every candidate to complete real-engine fixtures", () => {
    expect(
      validateProblemBank(codeBlockBatch014Problems, codeBlockBatch014Fixtures),
    ).toEqual([])

    for (const problem of codeBlockBatch014Problems) {
      const fixtures = codeBlockBatch014Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length).toBeGreaterThanOrEqual(15)
      expect([...new Set(fixtures.map((fixture) => fixture.role))]).toEqual(
        expect.arrayContaining([
          "canonical",
          "different-prose",
          "case-spelling-variation",
          "missing",
          "malformed",
          "matched-with-review",
          "edge-case",
        ]),
      )
      expect(
        new Set(
          fixtures
            .map((fixture) => fixture.exercisesCheckId)
            .filter((id): id is string => Boolean(id)),
        ),
      ).toEqual(new Set(problem.matchChecks.map((check) => check.id)))
    }
  })

  it.each(codeBlockBatch014Fixtures)(
    "runs $id through the learner grading engine",
    (fixture) => {
      const problem = codeBlockBatch014Problems.find(
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

  it("grades fenced code-block grammar rather than prose, case, spelling, or language tags", () => {
    for (const problem of codeBlockBatch014Problems.filter(
      (candidate) => candidate.level === 1,
    )) {
      expect(evaluateProblem(problem, "```\ncompletely new words\n```").status).toBe("matched")
      expect(evaluateProblem(problem, "```txt\nMISPELED WORDS\n```").status).toBe("matched")
      expect(evaluateProblem(problem, "    indented code").status).toBe("fail")
      expect(evaluateProblem(problem, "```\nvisible but unclosed").status).toBe("fail")
    }
  })
})
