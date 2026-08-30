import { describe, expect, it } from "vitest"
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
import { levelUnlockBatch032Fixtures } from "./levelUnlockBatch032Fixtures"
import { levelUnlockBatch032Problems } from "./levelUnlockBatch032Problems"

const levelTwo = curriculumLevels.find((entry) => entry.id === "level-2")!
const levelThree = curriculumLevels.find((entry) => entry.id === "level-3")!

describe("Level 2 and 3 unlock batch 032", () => {
  it("passes the source schema and fixture coverage gate", () => {
    expect(
      validateProblemBank(levelUnlockBatch032Problems, levelUnlockBatch032Fixtures),
    ).toEqual([])
    expect(levelUnlockBatch032Fixtures).toHaveLength(26 * 6 + 14)
  })
  it("provides two dedicated retry variants for every supported element", () => {
    const singles = levelUnlockBatch032Problems.filter(
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
      "automatic-url": 2,
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
    for (const problem of levelUnlockBatch032Problems) {
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe("matched")
      expect(
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length,
        problem.id,
      ).toBeGreaterThan(0)
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("adds two eligible Level 3-owned mixed exercises", () => {
    const mixed = levelUnlockBatch032Problems.filter(
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
    const projected = [...problemBank, ...levelUnlockBatch032Problems]

    expect(getImplementedElementsForEntry(levelTwo, projected)).toEqual([
      "bold-italic",
      "strikethrough",
      "thematic-break",
      "nested-list",
      "nested-blockquote",
      "code-block-language",
      "hard-line-break",
      "automatic-url",
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
