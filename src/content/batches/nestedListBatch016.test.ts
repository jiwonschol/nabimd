import { fromMarkdown } from "mdast-util-from-markdown"
import type { RootContent } from "mdast"
import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { getSyntaxFamily } from "../../selection/runComposition"
import { problemBank } from "../problemBank"
import { validateProblemBank } from "../validateProblemBank"
import { nestedListBatch016Fixtures } from "./nestedListBatch016Fixtures"
import {
  nestedListBatch016Inputs,
  nestedListBatch016Problems,
} from "./nestedListBatch016Problems"

const batchId = "2026-07-20-l2-nested-list-documents-016"

const expectedRetryFamilies = new Map([
  ["level-2-nested-checklist", 4],
  ["level-2-nested-outline", 4],
  ["level-2-nested-steps", 4],
])

const expectedTitles = new Map([
  ["level-2-nested-checklist", "Rebuild a nested checklist"],
  ["level-2-nested-outline", "Rebuild a nested outline"],
  ["level-2-nested-steps", "Rebuild a nested step list"],
])

function rootAnatomy(source: string): string[] {
  return fromMarkdown(source).children.map((node) => {
    if (node.type === "heading") return `h${node.depth}`
    if (node.type === "list") return node.ordered ? "ordered-list" : "unordered-list"
    return node.type
  })
}

function countLists(nodes: readonly RootContent[]): number {
  let count = 0
  const visit = (node: RootContent) => {
    if (node.type === "list") count += 1
    if ("children" in node) {
      for (const child of node.children) visit(child as RootContent)
    }
  }
  for (const node of nodes) visit(node)
  return count
}

describe("Level 2 nested-list document batch 016", () => {
  it("contains twelve unique, reachable Level 2 composite rebuilds", () => {
    expect(nestedListBatch016Problems).toHaveLength(12)
    expect(new Set(nestedListBatch016Problems.map((problem) => problem.id)).size).toBe(12)
    expect(
      new Set(nestedListBatch016Problems.map((problem) => problem.contentVariant)).size,
    ).toBe(12)

    const retryFamilies = new Map<string, number>()
    for (const problem of nestedListBatch016Problems) {
      retryFamilies.set(
        problem.retryFamily,
        (retryFamilies.get(problem.retryFamily) ?? 0) + 1,
      )
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 2,
        flavor: "standard",
        familyId: "rebuild-nested-list-documents",
        difficulty: "mixed",
        teachingMode: "recall",
        vocabulary: { profile: "everyday-recall" },
        protectedContent: [],
        sourceBatchId: batchId,
      })
      expect(problem.skillIds.length).toBeGreaterThanOrEqual(2)
      expect(getSyntaxFamily(problem)).toBeNull()
      expect(problem.title).toBe(expectedTitles.get(problem.retryFamily))

      const learnerFacing = JSON.stringify({
        title: problem.title,
        prompt: problem.prompt,
        teaching: problem.teaching,
        hints: problem.hints,
      })
      expect(learnerFacing.toLowerCase()).not.toContain("recall")
      expect(problem.teaching.howTo).toContain("nest one list inside another")
      expect(problem.teaching.howTo.toLowerCase()).not.toContain("same marker")
    }
    expect(retryFamilies).toEqual(expectedRetryFamilies)
  })

  it("freezes four targets with each exact root anatomy and exactly one descendant list", () => {
    const expectedAnatomies = new Map([
      ["level-2-nested-checklist", ["h1", "paragraph", "unordered-list"]],
      ["level-2-nested-outline", ["h1", "h2", "paragraph", "unordered-list"]],
      ["level-2-nested-steps", ["h1", "paragraph", "ordered-list"]],
    ])

    expect(nestedListBatch016Inputs).toHaveLength(12)
    for (const problem of nestedListBatch016Problems) {
      expect(rootAnatomy(problem.target), problem.id).toEqual(
        expectedAnatomies.get(problem.retryFamily),
      )
      expect(countLists(fromMarkdown(problem.target).children), problem.id).toBe(2)
      expect(problem.matchChecks).toEqual([
        expect.objectContaining({
          kind: "block-sequence",
          scope: { kind: "document" },
          exact: true,
        }),
        expect.objectContaining({
          kind: "list-shape",
          scope: { kind: "document" },
          ordered: problem.retryFamily === "level-2-nested-steps",
          minItems: 2,
          requireNonemptyItems: true,
          requireVisibleItems: true,
        }),
        expect.objectContaining({
          kind: "block-count",
          scope: { kind: "document" },
          block: "list",
          recursive: true,
          min: 2,
          max: 2,
        }),
        expect.objectContaining({
          id: `nested-${problem.retryFamily.replace("level-2-nested-", "")}-visible-child-items`,
          kind: "list-shape",
          scope: { kind: "document" },
          ordered: "either",
          minItems: 2,
          recursive: true,
          descendantsOnly: true,
          requireVisibleItems: true,
        }),
        expect.objectContaining({
          id: `nested-${problem.retryFamily.replace("level-2-nested-", "")}-no-extra-blockquote`,
          kind: "block-count",
          scope: { kind: "block", block: "list", occurrence: 0 },
          block: "blockquote",
          recursive: true,
          max: 0,
        }),
        expect.objectContaining({
          id: `nested-${problem.retryFamily.replace("level-2-nested-", "")}-no-extra-heading`,
          kind: "block-count",
          scope: { kind: "block", block: "list", occurrence: 0 },
          block: "heading",
          recursive: true,
          max: 0,
        }),
        expect.objectContaining({
          id: `nested-${problem.retryFamily.replace("level-2-nested-", "")}-no-extra-divider`,
          kind: "block-count",
          scope: { kind: "block", block: "list", occurrence: 0 },
          block: "thematic-break",
          recursive: true,
          max: 0,
        }),
        expect.objectContaining({
          id: `nested-${problem.retryFamily.replace("level-2-nested-", "")}-no-extra-code`,
          kind: "block-count",
          scope: { kind: "block", block: "list", occurrence: 0 },
          block: "code",
          recursive: true,
          max: 0,
        }),
      ])
    }
  })

  it("does not collide with the accepted bank or within the batch", () => {
    const previousBank = problemBank.filter(
      (problem) => problem.sourceBatchId !== batchId,
    )
    const previousIds = new Set(previousBank.map((problem) => problem.id))
    const previousTargets = new Set(previousBank.map((problem) => problem.target))
    const previousExamples = new Set(
      previousBank.map((problem) => problem.teaching.example),
    )
    const previousVariants = new Set(
      previousBank.map((problem) => problem.contentVariant),
    )
    const ownTargets = new Set<string>()
    const ownExamples = new Set<string>()

    for (const problem of nestedListBatch016Problems) {
      expect(previousIds.has(problem.id), problem.id).toBe(false)
      expect(previousTargets.has(problem.target), problem.id).toBe(false)
      expect(previousExamples.has(problem.teaching.example), problem.id).toBe(false)
      expect(previousVariants.has(problem.contentVariant), problem.id).toBe(false)
      expect(ownTargets.has(problem.target), problem.id).toBe(false)
      expect(ownExamples.has(problem.teaching.example), problem.id).toBe(false)
      expect(problem.teaching.example).not.toBe(problem.target)
      ownTargets.add(problem.target)
      ownExamples.add(problem.teaching.example)
    }
  })

  it("binds every problem to the required adversarial real-engine fixture matrix", () => {
    expect(
      validateProblemBank(
        nestedListBatch016Problems,
        nestedListBatch016Fixtures,
      ),
    ).toEqual([])

    const requiredSuffixes = [
      "canonical",
      "different-prose",
      "case-spelling",
      "alternative-indentation",
      "alternative-markers",
      "mixed-child-marker",
      "flat-list",
      "insufficient-indentation",
      "extra-root-list",
      "third-list-depth",
      "missing-list",
      "wrong-root-order",
      "too-few-root-items",
      "invisible-root-item",
      "invisible-child-comment",
      "invisible-child-default-ignorable",
      "invisible-child-null",
      "extra-root-block",
      "fenced-code-lookalike",
      "indented-code-lookalike",
      "blockquote-only-nested-list",
      "extra-nested-blockquote",
      "extra-nested-heading",
      "extra-nested-divider",
      "extra-nested-code",
    ] as const

    for (const problem of nestedListBatch016Problems) {
      const fixtures = nestedListBatch016Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures).toHaveLength(requiredSuffixes.length)
      expect(fixtures.map((fixture) => fixture.id)).toEqual(
        requiredSuffixes.map((suffix) => `${problem.id}-${suffix}`),
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

  it.each(nestedListBatch016Fixtures)(
    "runs $id through the real learner grading engine",
    (fixture) => {
      const problem = nestedListBatch016Problems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      expect(problem).toBeDefined()
      const result = evaluateProblem(problem!, fixture.source)
      expect(result.status).toBe(fixture.expectedStatus)
      if (result.status === "fail") {
        expect(result.feedbackId).toBe(fixture.expectedFeedbackId)
      } else {
        expect(result.reviewItems.map((item) => item.id)).toEqual(
          fixture.expectedReviewIds ?? [],
        )
      }
    },
  )
})
