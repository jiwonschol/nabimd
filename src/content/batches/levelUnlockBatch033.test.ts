import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { deriveSyntaxCheckpoints } from "../../guided/guidedSyntax"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { RUN_POLICY } from "../../selection/runPolicy"
import { curriculumLevels } from "../curriculumLevels"
import {
  getCurriculumElements,
  getImplementedElementsForEntry,
  getProblemEntryId,
  isEntryAvailableForBank,
} from "../curriculumElements"
import { isEligibleMixedExercise } from "../mixedExercisePolicy"
import { problemBank } from "../problemBank"
import { withinRuntimeBudget } from "../runtimeBudget"
import { validateProblemBank } from "../validateProblemBank"
import { levelUnlockBatch033Fixtures } from "./levelUnlockBatch033Fixtures"
import { levelUnlockBatch033Problems } from "./levelUnlockBatch033Problems"

const levelTwo = curriculumLevels.find((entry) => entry.id === "level-2")!
const levelThree = curriculumLevels.find((entry) => entry.id === "level-3")!
const batchDirectory = `${process.cwd()}/curriculum/problem-bank/batches/2026-08-30-l2-l3-unlock-033`

describe("Level 2 and 3 unlock batch 033", () => {
  it("tracks the empty review boundary in a clean checkout", () => {
    const readme = readFileSync(
      `${batchDirectory}/reviews/README.md`,
      "utf8",
    )
    expect(readme).toContain("two sealed JSON review records")
    expect(readme).toContain("all 24 candidate revisions independently")
  })

  it("binds the parser dialect into the frozen engine contract", () => {
    const contract = JSON.parse(
      readFileSync(`${batchDirectory}/engine-contract.json`, "utf8"),
    ) as {
      files: readonly { path: string }[]
      dependencies: readonly { name: string }[]
    }
    expect(contract.files.map(({ path }) => path)).toContain(
      "src/markdown/parser.ts",
    )
    expect(contract.dependencies.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["mdast-util-gfm", "micromark-extension-gfm"]),
    )
  })

  it("freezes failure fixtures for incomplete footnotes and code literals", () => {
    const unreferencedDefinitions = levelUnlockBatch033Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-unreferenced-definition"),
    )
    const literalCodeBackslashes = levelUnlockBatch033Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-literal-code-backslashes"),
    )
    expect(unreferencedDefinitions).toHaveLength(2)
    expect(literalCodeBackslashes).toHaveLength(2)
    for (const fixture of [
      ...unreferencedDefinitions,
      ...literalCodeBackslashes,
    ]) {
      expect(fixture.expectedStatus, fixture.id).toBe("fail")
      expect(fixture.expectedFeedbackId, fixture.id).toMatch(/^use-/)
    }
  })

  it("passes the source schema and fixture coverage gate", () => {
    expect(
      validateProblemBank(levelUnlockBatch033Problems, levelUnlockBatch033Fixtures),
    ).toEqual([])
    expect(levelUnlockBatch033Fixtures).toHaveLength(24 * 6 + 14 + 4)
  })
  it("provides two dedicated retry variants for every supported element", () => {
    const singles = levelUnlockBatch033Problems.filter(
      (problem) => getCurriculumElements(problem).length === 1,
    )
    const counts = singles.reduce<Record<string, number>>((result, problem) => {
      const element = getCurriculumElements(problem)[0]!
      result[element] = (result[element] ?? 0) + 1
      return result
    }, {})

    expect(counts).toEqual({
      "angle-bracket-email": 2,
      "angle-bracket-url": 2,
      "bold-italic": 2,
      "code-block-language": 2,
      escape: 2,
      footnote: 2,
      "hard-line-break": 2,
      "link-title": 2,
      "list-with-block": 2,
      "nested-blockquote": 2,
      strikethrough: 2,
    })
  })

  it("grades every canonical target and gives it a guided checkpoint within budget", () => {
    for (const problem of levelUnlockBatch033Problems) {
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe("matched")
      expect(
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length,
        problem.id,
      ).toBeGreaterThan(0)
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("adds two eligible Level 3-owned mixed exercises", () => {
    const mixed = levelUnlockBatch033Problems.filter(
      (problem) => getCurriculumElements(problem).length > 1,
    )

    expect(mixed).toHaveLength(2)
    for (const problem of mixed) {
      expect(getProblemEntryId(problem), problem.id).toBe("level-3")
      expect(isEligibleMixedExercise(problem), problem.id).toBe(true)
      expect(
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length,
        problem.id,
      ).toBeLessThanOrEqual(5)
    }
  })

  it("makes both entries available when the frozen candidates are published", () => {
    const projected = [...problemBank, ...levelUnlockBatch033Problems]

    expect(getImplementedElementsForEntry(levelTwo, projected)).toEqual([
      "bold-italic",
      "strikethrough",
      "thematic-break",
      "nested-list",
      "nested-blockquote",
      "code-block-language",
      "hard-line-break",
    ])
    expect(getImplementedElementsForEntry(levelThree, projected)).toEqual([
      "link-title",
      "angle-bracket-url",
      "angle-bracket-email",
      "escape",
      "list-with-block",
      "footnote",
    ])
    expect(isEntryAvailableForBank(levelTwo, projected, RUN_POLICY.turnSize)).toBe(true)
    expect(isEntryAvailableForBank(levelThree, projected, RUN_POLICY.turnSize)).toBe(true)
    expect(levelThree.unimplementedElements).toContain("heading-id")
  })
})
