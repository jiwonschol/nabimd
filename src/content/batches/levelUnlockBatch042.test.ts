import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import {
  buildGuidedDraft,
  deriveSyntaxCheckpoints,
} from "../../guided/guidedSyntax"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { parseMarkdownSource } from "../../markdown/parser"
import { derivePlaintextStarter } from "../plaintextStarter"
import { RUN_POLICY } from "../../selection/runPolicy"
import { createRunProblemIdsForBank } from "../entryChoices"
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
import { levelUnlockBatch042Fixtures } from "./levelUnlockBatch042Fixtures"
import { levelUnlockBatch042Problems } from "./levelUnlockBatch042Problems"

const levelTwo = curriculumLevels.find((entry) => entry.id === "level-2")!
const levelThree = curriculumLevels.find((entry) => entry.id === "level-3")!
const batchDirectory = `${process.cwd()}/curriculum/problem-bank/batches/2026-08-31-l2-l3-unlock-042`

describe("Level 2 and 3 unlock batch 042", () => {
  it("tracks the empty review boundary in a clean checkout", () => {
    const readme = readFileSync(
      `${batchDirectory}/reviews/README.md`,
      "utf8",
    )
    expect(readme).toContain("two sealed JSON review records")
    expect(readme).toContain("all 60 candidate revisions independently")
  })

  it("binds the prompt to the five teachable Level 2 families", () => {
    const prompt = readFileSync(`${batchDirectory}/generation-prompt.md`, "utf8")

    expect(prompt).toContain("five supported Level 2")
    expect(prompt).not.toContain("six supported Level 2")
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
    expect(contract.files.map(({ path }) => path)).toContain(
      "src/editor/renderedMarkdown.ts",
    )
    expect(contract.dependencies.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["mdast-util-gfm", "micromark-extension-gfm"]),
    )
  })

  it("freezes failure fixtures for parser and renderer edge cases", () => {
    const unreferencedDefinitions = levelUnlockBatch042Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-unreferenced-definition"),
    )
    const literalCodeBackslashes = levelUnlockBatch042Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-literal-code-backslashes"),
    )
    const mailtoUris = levelUnlockBatch042Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-mailto-uri"),
    )
    const invisibleDefinitions = levelUnlockBatch042Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-invisible-definition"),
    )
    expect(unreferencedDefinitions).toHaveLength(5)
    expect(literalCodeBackslashes).toHaveLength(5)
    expect(mailtoUris).toHaveLength(7)
    expect(invisibleDefinitions).toHaveLength(5)
    for (const fixture of [
      ...unreferencedDefinitions,
      ...literalCodeBackslashes,
      ...mailtoUris,
      ...invisibleDefinitions,
    ]) {
      expect(fixture.expectedStatus, fixture.id).toBe("fail")
      expect(fixture.expectedFeedbackId, fixture.id).toMatch(/^use-/)
    }
    for (const fixture of mailtoUris) {
      const problem = levelUnlockBatch042Problems.find(
        (candidate) => candidate.id === fixture.problemId,
      )
      if (!problem) throw new Error(`Missing problem for ${fixture.id}`)
      expect(evaluateProblem(problem, fixture.source).status, fixture.id).toBe(
        "fail",
      )
    }
  })

  it("passes the source schema and fixture coverage gate", () => {
    expect(
      validateProblemBank(levelUnlockBatch042Problems, levelUnlockBatch042Fixtures),
    ).toEqual([])
    expect(levelUnlockBatch042Fixtures).toHaveLength(417)
  })
  it("provides five dedicated retry variants for every supported element", () => {
    const singles = levelUnlockBatch042Problems.filter(
      (problem) => getCurriculumElements(problem).length === 1,
    )
    const counts = singles.reduce<Record<string, number>>((result, problem) => {
      const element = getCurriculumElements(problem)[0]!
      result[element] = (result[element] ?? 0) + 1
      return result
    }, {})

    expect(counts).toEqual({
      "angle-bracket-email": 5,
      "angle-bracket-url": 5,
      "bold-italic": 5,
      "code-block-language": 5,
      escape: 5,
      footnote: 5,
      "hard-line-break": 5,
      "link-title": 5,
      "list-with-block": 5,
      "nested-blockquote": 5,
      strikethrough: 5,
    })
  })

  it("authors every Level 3 target as a short readable document", () => {
    for (const problem of levelUnlockBatch042Problems.filter(
      (candidate) => candidate.level === 3,
    )) {
      expect(problem.target.split("\n").length, problem.id).toBeGreaterThanOrEqual(3)
      expect(problem.target, problem.id).toContain("\n\n")
    }
  })

  it("places escape lessons where the backslash prevents real Markdown parsing", () => {
    for (const [id, unescapedType] of [
      ["l3-escape-2", "heading"],
      ["l3-escape-4", "blockquote"],
      ["l3-escape-5", "list"],
    ] as const) {
      const problem = levelUnlockBatch042Problems.find(
        (candidate) => candidate.id === id,
      )!
      expect(
        parseMarkdownSource(problem.target).children.some(
          (node) => node.type === unescapedType,
        ),
        `${id}: target`,
      ).toBe(false)
      expect(
        parseMarkdownSource(derivePlaintextStarter(problem.target)).children.some(
          (node) => node.type === unescapedType,
        ),
        `${id}: starter`,
      ).toBe(true)
    }
  })

  it("does not repeat a frozen card during the first five turns", () => {
    const projected = [...problemBank, ...levelUnlockBatch042Problems]
    const frozenIds = new Set(levelUnlockBatch042Problems.map(({ id }) => id))
    for (const entryId of ["level-2", "level-3"] as const) {
      for (let seed = 0; seed < 40; seed += 1) {
        const seen = new Set<string>()
        for (let run = 0; run < 5; run += 1) {
          for (const id of createRunProblemIdsForBank(
            entryId,
            run,
            projected,
            seed,
          )) {
            if (!frozenIds.has(id)) continue
            expect(seen.has(id), `${entryId}:seed-${seed}:run-${run}:${id}`).toBe(false)
            seen.add(id)
          }
        }
      }
    }
  })

  it("grades every canonical target and gives it a guided checkpoint within budget", () => {
    for (const problem of levelUnlockBatch042Problems) {
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe("matched")
      expect(
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length,
        problem.id,
      ).toBeGreaterThan(0)
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("replays every completed guided draft through the real evaluator", () => {
    for (const problem of levelUnlockBatch042Problems) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )
      const completed = buildGuidedDraft(
        problem.target,
        checkpoints,
        checkpoints.length,
      )
      expect(evaluateProblem(problem, completed).status, problem.id).not.toBe(
        "fail",
      )
    }
  })

  it("adds five eligible Level 3-owned mixed exercises", () => {
    const mixed = levelUnlockBatch042Problems.filter(
      (problem) => getCurriculumElements(problem).length > 1,
    )

    expect(mixed).toHaveLength(5)
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
    const projected = [...problemBank, ...levelUnlockBatch042Problems]

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
