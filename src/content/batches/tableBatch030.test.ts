import { describe, expect, it } from "vitest"
import { describeCheckpoint } from "../../components/CenterCard"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { deriveSyntaxCheckpoints } from "../../guided/guidedSyntax"
import { parseMarkdownSource } from "../../markdown/parser"
import { isEligibleTransferProblem } from "../../selection/selectTransferProblem"
import { getCurriculumElement, getProblemEntryId } from "../curriculumElements"
import { derivePlaintextStarter } from "../plaintextStarter"
import { createRunProblemIdsForBank } from "../entryChoices"
import { problemBank, withinRuntimeBudget } from "../problemBank"
import type { FixtureRole } from "../types"
import { validateProblemBank } from "../validateProblemBank"
import { getSyntaxFamily } from "../../selection/runComposition"
import { tableBatch030Fixtures } from "./tableBatch030Fixtures"
import {
  tableBatch030Id,
  tableBatch030Problems,
} from "./tableBatch030Problems"

const requiredRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
  "edge-case",
]

type AstNode = {
  type?: string
  value?: string
  children?: readonly AstNode[]
}

function visibleText(node: AstNode): string {
  return `${node.value ?? ""}${node.children?.map(visibleText).join("") ?? ""}`
}

describe("Level 1 table batch 030", () => {
  it("adds twelve distinct two-column table exercises to Level 1", () => {
    expect(tableBatch030Problems).toHaveLength(12)
    expect(new Set(tableBatch030Problems.map((problem) => problem.id)).size).toBe(12)
    expect(new Set(tableBatch030Problems.map((problem) => problem.target)).size).toBe(12)

    for (const problem of tableBatch030Problems) {
      expect(problem).toMatchObject({
        schemaVersion: 2,
        level: 1,
        flavor: "standard",
        familyId: "tables",
        skillIds: ["table"],
        retryFamily: "level-1-table",
        sourceBatchId: tableBatch030Id,
        revision: 1,
        protectedContent: [],
      })
      expect(getCurriculumElement(problem), problem.id).toBe("table")
      expect(getProblemEntryId(problem), problem.id).toBe("level-1")
      expect(getSyntaxFamily(problem), problem.id).toBe("table")
      expect(problem.target).not.toMatch(/^\||\|$/m)
      expect(problem.target.split("\n"), problem.id).toHaveLength(3)
      expect(derivePlaintextStarter(problem.target).split("\n"), problem.id).toHaveLength(3)
    }
  })

  it("keeps all twelve targets inside the frozen three-row anatomy", () => {
    const markdownInsideSemanticCells = /[*_~`>\[\]()]|(?:^|\s)#{1,6}(?:\s|$)/

    for (const problem of tableBatch030Problems) {
      const [header, divider, body] = problem.target.split("\n")
      expect(divider, problem.id).toBe("--- | ---")

      for (const row of [header!, divider!, body!]) {
        expect(row.split("|"), `${problem.id}:${row}`).toHaveLength(2)
      }
      for (const row of [header!, body!]) {
        const cells = row.split("|").map((cell) => cell.trim())
        expect(cells.every((cell) => cell.length > 0), problem.id).toBe(true)
        expect(cells.some((cell) => !/^-+$/.test(cell)), problem.id).toBe(true)
        expect(cells.some((cell) => markdownInsideSemanticCells.test(cell)), problem.id).toBe(false)
      }

      const root = parseMarkdownSource(problem.target) as unknown as AstNode
      const tables = root.children?.filter((node) => node.type === "table") ?? []
      expect(tables, problem.id).toHaveLength(1)
      const semanticRows = tables[0]!.children ?? []
      expect(semanticRows, problem.id).toHaveLength(2)
      for (const row of semanticRows) {
        expect(row.type, problem.id).toBe("tableRow")
        expect(row.children, problem.id).toHaveLength(2)
        for (const cell of row.children ?? []) {
          expect(cell.type, problem.id).toBe("tableCell")
          expect(cell.children?.map((node) => node.type), problem.id).toEqual([
            "text",
          ])
        }
        expect(
          row.children?.some((cell) => !/^-+$/.test(visibleText(cell).trim())),
          problem.id,
        ).toBe(true)
      }
      expect(problem.protectedContent, problem.id).toEqual([])
    }
  })

  it("takes every candidate through the real three-card learner path", () => {
    for (const problem of tableBatch030Problems) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        derivePlaintextStarter(problem.target),
      )
      expect(checkpoints, problem.id).toHaveLength(3)
      expect(
        checkpoints.map((checkpoint) =>
          checkpoint.segments
            .filter((segment) => segment.kind === "input")
            .map((segment) => segment.value),
        ),
        problem.id,
      ).toEqual([["|"], ["|"], ["|"]])
      expect(checkpoints.map((checkpoint) => describeCheckpoint(checkpoint).term), problem.id).toEqual([
        "table row",
        "column headers",
        "table row",
      ])
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("does not collide with the accepted bank", () => {
    const ids = new Set(problemBank.map((problem) => problem.id))
    const targets = new Set(problemBank.map((problem) => problem.target))
    const variants = new Set(problemBank.map((problem) => problem.contentVariant))

    for (const problem of tableBatch030Problems) {
      expect(ids.has(problem.id), problem.id).toBe(false)
      expect(targets.has(problem.target), problem.id).toBe(false)
      expect(variants.has(problem.contentVariant), problem.id).toBe(false)
    }
  })

  it("keeps all twelve IDs in publication, runtime, turns, and Try another reach", () => {
    const candidateIds = new Set(tableBatch030Problems.map((problem) => problem.id))
    const projectedBank = [...problemBank, ...tableBatch030Problems]
    const runtimeIds = new Set(
      projectedBank
        .filter(withinRuntimeBudget)
        .filter((problem) => candidateIds.has(problem.id))
        .map((problem) => problem.id),
    )
    const scheduledIds = new Set<string>()
    for (let seed = 0; seed < 40; seed += 1) {
      for (let run = 0; run < 10; run += 1) {
        for (const id of createRunProblemIdsForBank(
          "level-1",
          run,
          projectedBank,
          seed,
        )) {
          if (candidateIds.has(id)) scheduledIds.add(id)
        }
      }
    }
    const first = tableBatch030Problems[0]!
    const reachableIds = new Set(
      tableBatch030Problems
        .filter(
          (candidate) =>
            candidate.id === first.id ||
            isEligibleTransferProblem(first, candidate, first.retryFamily),
        )
        .map((problem) => problem.id),
    )

    expect(candidateIds.size).toBe(12)
    expect(runtimeIds).toEqual(candidateIds)
    expect(scheduledIds).toEqual(candidateIds)
    expect(reachableIds).toEqual(candidateIds)
  })

  it("binds every fixture role and direct evidence for the table check", () => {
    expect(tableBatch030Fixtures).toHaveLength(192)
    expect(validateProblemBank(tableBatch030Problems, tableBatch030Fixtures)).toEqual([])

    for (const problem of tableBatch030Problems) {
      const fixtures = tableBatch030Fixtures.filter(
        (fixture) => fixture.problemId === problem.id,
      )
      expect(fixtures, problem.id).toHaveLength(16)
      for (const role of requiredRoles) {
        expect(fixtures.some((fixture) => fixture.role === role), `${problem.id}:${role}`).toBe(true)
      }
      expect(
        fixtures.some((fixture) => fixture.exercisesCheckId === "use-table"),
        problem.id,
      ).toBe(true)
    }
  })

  it("runs all frozen fixtures through the real learner engine", () => {
    const problems = new Map(
      tableBatch030Problems.map((problem) => [problem.id, problem]),
    )

    for (const fixture of tableBatch030Fixtures) {
      const result = evaluateProblem(problems.get(fixture.problemId)!, fixture.source)
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
})
