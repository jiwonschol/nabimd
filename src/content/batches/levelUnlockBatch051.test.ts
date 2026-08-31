import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import {
  acceptedGuidedSyntaxInputs,
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
import { levelUnlockBatch051Fixtures } from "./levelUnlockBatch051Fixtures"
import { levelUnlockBatch051Problems } from "./levelUnlockBatch051Problems"

const levelTwo = curriculumLevels.find((entry) => entry.id === "level-2")!
const levelThree = curriculumLevels.find((entry) => entry.id === "level-3")!
const batchDirectory = `${process.cwd()}/curriculum/problem-bank/batches/2026-08-31-l2-l3-unlock-051`

function containsLink(node: { type: string; children?: readonly unknown[] }): boolean {
  return node.type === "link" || (node.children ?? []).some((child) =>
    containsLink(child as { type: string; children?: readonly unknown[] }),
  )
}

describe("Level 2 and 3 unlock batch 051", () => {
  it("tracks the empty review boundary in a clean checkout", () => {
    const readme = readFileSync(
      `${batchDirectory}/reviews/README.md`,
      "utf8",
    )
    expect(readme).toContain("two sealed JSON review records")
    expect(readme).toContain("all 55 candidate revisions independently")
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
    expect(contract.files.map(({ path }) => path)).toContain(
      "src/components/RenderedDocument.tsx",
    )
    expect(contract.files.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        "src/content/curriculumElements.ts",
        "src/content/entryChoices.ts",
        "src/content/mixedExercisePolicy.ts",
        "src/selection/runComposition.ts",
        "src/selection/runPolicy.ts",
      ]),
    )
    expect(contract.dependencies.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["mdast-util-gfm", "micromark-extension-gfm"]),
    )
  })

  it("binds curriculum ownership and scheduling into the contract policy", () => {
    const policy = JSON.parse(
      readFileSync(
        `${process.cwd()}/curriculum/problem-bank/engine-contract-policy.json`,
        "utf8",
      ),
    ) as { files: readonly string[] }

    expect(policy.files).toEqual(expect.arrayContaining([
      "src/components/AnswerPanel.tsx",
      "src/content/curriculumElements.ts",
      "src/content/entryChoices.ts",
      "src/content/mixedExercisePolicy.ts",
      "src/selection/runComposition.ts",
      "src/selection/runPolicy.ts",
    ]))
  })

  it("freezes failure fixtures for parser and renderer edge cases", () => {
    const unreferencedDefinitions = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-unreferenced-definition"),
    )
    const literalCodeBackslashes = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-literal-code-backslashes"),
    )
    const invisibleDefinitions = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-invisible-definition"),
    )
    const invisibleHtmlBlocks = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-invisible-html-block"),
    )
    const hiddenLinkMetadata = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-hidden-link-metadata"),
    )
    const hiddenFootnoteIdentifiers = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-hidden-footnote-identifier"),
    )
    const renderNeutralEscapes = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-render-neutral-escape"),
    )
    const hiddenReferenceIdentifiers = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-hidden-reference-identifier"),
    )
    const minimalDocuments = levelUnlockBatch051Fixtures.filter(
      (fixture) => fixture.id?.endsWith("-minimal-document"),
    )
    expect(unreferencedDefinitions).toHaveLength(5)
    expect(literalCodeBackslashes).toHaveLength(5)
    expect(invisibleDefinitions).toHaveLength(5)
    expect(invisibleHtmlBlocks).toHaveLength(7)
    expect(hiddenLinkMetadata).toHaveLength(5)
    expect(hiddenFootnoteIdentifiers).toHaveLength(5)
    expect(renderNeutralEscapes).toHaveLength(7)
    expect(hiddenReferenceIdentifiers).toHaveLength(7)
    expect(minimalDocuments).toHaveLength(30)
    for (const fixture of [
      ...unreferencedDefinitions,
      ...literalCodeBackslashes,
      ...invisibleDefinitions,
      ...invisibleHtmlBlocks,
      ...hiddenLinkMetadata,
      ...hiddenFootnoteIdentifiers,
      ...renderNeutralEscapes,
      ...hiddenReferenceIdentifiers,
      ...minimalDocuments,
    ]) {
      expect(fixture.expectedStatus, fixture.id).toBe("fail")
      expect(fixture.expectedFeedbackId, fixture.id).toMatch(/^(?:use-|keep-readable$)/)
    }
    for (const fixture of [
      ...hiddenLinkMetadata,
      ...hiddenFootnoteIdentifiers,
      ...renderNeutralEscapes,
      ...hiddenReferenceIdentifiers,
      ...minimalDocuments,
      ...invisibleHtmlBlocks,
    ]) {
      const problem = levelUnlockBatch051Problems.find(
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
      validateProblemBank(levelUnlockBatch051Problems, levelUnlockBatch051Fixtures),
    ).toEqual([])
    expect(levelUnlockBatch051Fixtures).toHaveLength(436)
  })

  it("replays every advertised guided alternative through the evaluator", () => {
    for (const problem of levelUnlockBatch051Problems) {
      const checkpoints = deriveSyntaxCheckpoints(problem.target, problem.starterText)
      const canonicalValues = Object.fromEntries(
        checkpoints.map((checkpoint) => [checkpoint.id, checkpoint.canonicalInput]),
      )
      for (const checkpoint of checkpoints) {
        for (const input of acceptedGuidedSyntaxInputs(checkpoint)) {
          const draft = buildGuidedDraft(
            problem.target,
            checkpoints,
            checkpoints.length,
            { ...canonicalValues, [checkpoint.id]: input },
          )
          expect(
            evaluateProblem(problem, draft).status,
            `${problem.id} ${checkpoint.id} ${JSON.stringify(input)}\n${draft}`,
          ).toBe("matched")
        }
      }
    }
  })
  it("provides five dedicated retry variants for every supported element", () => {
    const singles = levelUnlockBatch051Problems.filter(
      (problem) => getCurriculumElements(problem).length === 1,
    )
    const counts = singles.reduce<Record<string, number>>((result, problem) => {
      const element = getCurriculumElements(problem)[0]!
      result[element] = (result[element] ?? 0) + 1
      return result
    }, {})

    expect(counts).toEqual({
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
    for (const problem of levelUnlockBatch051Problems.filter(
      (candidate) => candidate.level === 3,
    )) {
      expect(problem.target.split("\n").length, problem.id).toBeGreaterThanOrEqual(3)
      expect(problem.target, problem.id).toContain("\n\n")
      expect(problem.matchChecks, problem.id).toContainEqual(
        expect.objectContaining({
          id: "keep-readable",
          kind: "document-limits",
          minBlocks: 2,
          minLines: 3,
          maxLines: 28,
        }),
      )
    }
  })

  it("keeps every angle-bracket URL visually absent from its plaintext starter", () => {
    const problems = levelUnlockBatch051Problems.filter(
      (problem) => problem.familyId === "angle-bracket-url",
    )
    expect(problems).toHaveLength(5)
    for (const problem of problems) {
      expect(containsLink(parseMarkdownSource(problem.target)), problem.id).toBe(true)
      expect(
        containsLink(parseMarkdownSource(derivePlaintextStarter(problem.target))),
        problem.id,
      ).toBe(false)
    }
  })

  it("places escape lessons where the backslash prevents real Markdown parsing", () => {
    for (const [id, unescapedType] of [
      ["l3-escape-2", "heading"],
      ["l3-escape-4", "blockquote"],
      ["l3-escape-5", "list"],
    ] as const) {
      const problem = levelUnlockBatch051Problems.find(
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
    const projected = [...problemBank, ...levelUnlockBatch051Problems]
    const frozenIds = new Set(levelUnlockBatch051Problems.map(({ id }) => id))
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
    for (const problem of levelUnlockBatch051Problems) {
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe("matched")
      expect(
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length,
        problem.id,
      ).toBeGreaterThan(0)
      expect(withinRuntimeBudget(problem), problem.id).toBe(true)
    }
  })

  it("replays every completed guided draft through the real evaluator", () => {
    for (const problem of levelUnlockBatch051Problems) {
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
    const mixed = levelUnlockBatch051Problems.filter(
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
    const projected = [...problemBank, ...levelUnlockBatch051Problems]

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
      "escape",
      "list-with-block",
      "footnote",
    ])
    expect(isEntryAvailableForBank(levelTwo, projected, RUN_POLICY.turnSize)).toBe(true)
    expect(isEntryAvailableForBank(levelThree, projected, RUN_POLICY.turnSize)).toBe(true)
    expect(levelThree.unimplementedElements).toContain("heading-id")
  })
})
