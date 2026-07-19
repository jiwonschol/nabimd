import { fromMarkdown } from "mdast-util-from-markdown"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { getSyntaxFamily } from "../../selection/runComposition"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { headingDepthBatch015Fixtures } from "./headingDepthBatch015Fixtures"
import {
  headingDepthBatch015Problems,
  headingDepthLevel1Inputs,
  headingDepthLevel2Inputs,
} from "./headingDepthBatch015Problems"

const batchId =
  "2026-07-20-l1-heading-depth-l2-sectioned-documents-015"

describe("ATX heading-depth and sectioned-document batch 015", () => {
  it("contains twelve Level 1 lessons and twelve Level 2 rebuilds", () => {
    expect(headingDepthBatch015Problems).toHaveLength(24)
    expect(
      headingDepthBatch015Problems.filter((problem) => problem.level === 1),
    ).toHaveLength(12)
    expect(
      headingDepthBatch015Problems.filter((problem) => problem.level === 2),
    ).toHaveLength(12)
    expect(
      new Set(headingDepthBatch015Problems.map((problem) => problem.id)).size,
    ).toBe(24)
    expect(
      new Set(
        headingDepthBatch015Problems.map((problem) => problem.contentVariant),
      ).size,
    ).toBe(24)
    expect(
      headingDepthBatch015Problems.every(
        (problem) =>
          problem.sourceBatchId === batchId && problem.flavor === "standard",
      ),
    ).toBe(true)
  })

  it("freezes the exact Level 1 depth matrix and ATX grammar contract", () => {
    const levelOne = headingDepthBatch015Problems.filter(
      (problem) => problem.level === 1,
    )
    const depths = headingDepthLevel1Inputs.reduce<Record<number, number>>(
      (counts, input) => {
        counts[input.depth] = (counts[input.depth] ?? 0) + 1
        return counts
      },
      {},
    )
    expect(depths).toEqual({ 2: 3, 3: 3, 4: 2, 5: 2, 6: 2 })

    for (const [index, problem] of levelOne.entries()) {
      const input = headingDepthLevel1Inputs[index]!
      expect(problem).toMatchObject({
        familyId: "headings",
        skillIds: ["heading-h1"],
        difficulty: "warmup",
        teachingMode: "introduce",
        retryFamily: "level-1-heading-depth",
        vocabulary: { profile: "everyday" },
      })
      expect(getSyntaxFamily(problem)).toBe("heading")
      expect(problem.target).toBe(input.goal)
      expect(problem.teaching.example).toBe(input.teachingExample)
      expect(problem.teaching.example).not.toBe(problem.target)
      expect(problem.teaching.howTo).toBe(
        `Start the line with exactly ${input.depth} hash marks, then a space.`,
      )
      expect(problem.syntaxTokens).toEqual(["#".repeat(input.depth), "Space"])
      expect(problem.matchChecks).toEqual([
        expect.objectContaining({
          kind: "heading-spacing",
          level: input.depth,
        }),
        expect.objectContaining({
          kind: "hash-heading-style",
          level: input.depth,
        }),
        expect.objectContaining({
          kind: "block-sequence",
          scope: { kind: "document" },
          exact: true,
          sequence: [{ block: "heading", depth: input.depth }],
        }),
      ])
      for (const check of problem.matchChecks.slice(0, 2)) {
        expect("text" in check ? check.text : undefined).toBeUndefined()
      }
      expect(new Set(problem.matchChecks.map((check) => check.id)).size).toBe(3)
    }
  })

  it("freezes four Level 2 documents in each retry family", () => {
    const levelTwo = headingDepthBatch015Problems.filter(
      (problem) => problem.level === 2,
    )
    const expectedRetryFamilies = new Map([
      ["level-2-sectioned-process", 4],
      ["level-2-sectioned-checklist", 4],
      ["level-2-sectioned-message", 4],
    ])
    const actualRetryFamilies = new Map<string, number>()
    for (const problem of levelTwo) {
      actualRetryFamilies.set(
        problem.retryFamily,
        (actualRetryFamilies.get(problem.retryFamily) ?? 0) + 1,
      )
      expect(problem).toMatchObject({
        familyId: "rebuild-sectioned-documents",
        difficulty: "mixed",
        teachingMode: "recall",
        vocabulary: { profile: "everyday-recall" },
      })
      expect(problem.title.toLowerCase()).not.toContain("recall")
      expect(problem.prompt).toBe(
        "Rebuild the rendered document as Markdown. Your wording may differ, but keep the same Markdown shape.",
      )
      expect(
        problem.matchChecks.some(
          (check) => check.kind === "block-sequence" && check.exact === true,
        ),
      ).toBe(true)
      expect(problem.matchChecks).toContainEqual(
        expect.objectContaining({
          kind: "heading-depth-order",
          allowSkippedDepths: false,
        }),
      )
    }
    expect(actualRetryFamilies).toEqual(expectedRetryFamilies)
    expect(headingDepthLevel2Inputs).toHaveLength(12)
  })

  it("authors each Level 2 target with its exact declared block anatomy", () => {
    for (const [index, input] of headingDepthLevel2Inputs.entries()) {
      const problem = headingDepthBatch015Problems.find(
        (candidate) => candidate.id === input.id,
      )!
      const rootBlocks = fromMarkdown(problem.target).children.map((node) => {
        if (node.type === "heading") return `h${node.depth}`
        if (node.type === "list") return node.ordered ? "ordered-list" : "unordered-list"
        return node.type
      })
      expect(rootBlocks, input.id).toEqual([...input.anatomy])
      expect(problem.target, `target ${index}`).not.toBe("")
    }
  })

  it("does not collide with the published 296-problem bank", () => {
    const previousIds = new Set(problemBank.map((problem) => problem.id))
    const previousVariants = new Set(
      problemBank.map((problem) => problem.contentVariant),
    )
    const previousTargets = new Set(problemBank.map((problem) => problem.target))
    const ownTargets = new Set<string>()
    for (const problem of headingDepthBatch015Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(ownTargets.has(problem.target), problem.id).toBe(false)
      ownTargets.add(problem.target)
    }
  })

  it("binds every candidate to complete real-engine fixtures", () => {
    expect(
      validateProblemBank(
        headingDepthBatch015Problems,
        headingDepthBatch015Fixtures,
      ),
    ).toEqual([])
    for (const problem of headingDepthBatch015Problems) {
      const fixtures = headingDepthBatch015Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures.length, problem.id).toBeGreaterThanOrEqual(10)
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

  it.each(headingDepthBatch015Fixtures)(
    "runs $id through the real learner grading engine",
    (fixture) => {
      const problem = headingDepthBatch015Problems.find(
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
