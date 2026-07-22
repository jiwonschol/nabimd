import { describe, expect, it } from "vitest"
import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import tracker from "../../curriculum/problem-bank/tracker.generated.json"
import { blockquoteBatch006Fixtures } from "./batches/blockquoteBatch006Fixtures"
import { advancedDocumentBatch017Fixtures } from "./batches/advancedDocumentBatch017Fixtures"
import { advancedDocumentReplacementBatch018Fixtures } from "./batches/advancedDocumentReplacementBatch018Fixtures"
import { codeBlockBatch014Fixtures } from "./batches/codeBlockBatch014Fixtures"
import { developmentSpecBatch012Fixtures } from "./batches/developmentSpecBatch012Fixtures"
import { developerFormsBatch020Fixtures } from "./batches/developerFormsBatch020Fixtures"
import { emphasisBatch003Fixtures } from "./batches/emphasisBatch003Fixtures"
import { headingBatch002Fixtures } from "./batches/headingBatch002Fixtures"
import { headingDepthBatch015Fixtures } from "./batches/headingDepthBatch015Fixtures"
import { inlineCodeBatch007Fixtures } from "./batches/inlineCodeBatch007Fixtures"
import { italicRebuildBatch013Fixtures } from "./batches/italicRebuildBatch013Fixtures"
import { linkBatch008Fixtures } from "./batches/linkBatch008Fixtures"
import { listBatch004Fixtures } from "./batches/listBatch004Fixtures"
import { nestedListBatch016Fixtures } from "./batches/nestedListBatch016Fixtures"
import { nestedBulletBatch019Fixtures } from "./batches/nestedBulletBatch019Fixtures"
import { orderedListBatch005Fixtures } from "./batches/orderedListBatch005Fixtures"
import { readableDocumentBatch010Fixtures } from "./batches/readableDocumentBatch010Fixtures"
import { readableDocumentBatch011Fixtures } from "./batches/readableDocumentBatch011Fixtures"
import { thematicBreakBatch009Fixtures } from "./batches/thematicBreakBatch009Fixtures"
import { level12SeedFixtures } from "./level12SeedFixtures"
import { level35SeedFixtures } from "./level35SeedFixtures"
import { workplaceNotesBatch021Fixtures } from "./batches/workplaceNotesBatch021Fixtures"
import {
  flattenedStarterProjectionProblemBankRevision,
  getProblem,
  getProblemsForLevel,
  problemBank,
  problemBankRevision,
  withinRuntimeBudget,
} from "./problemBank"
import { derivePlaintextStarter } from "./plaintextStarter"
import type { NormalizedProblem } from "./types"
import { validateProblemBank } from "./validateProblemBank"
import { evaluateProblem } from "../engine/evaluateProblem"

function withoutStarterText(problem: NormalizedProblem) {
  const { starterText: _starterText, ...rest } = problem
  return rest
}

function authoredWordCount(source: string) {
  return source.match(/[A-Za-z0-9][A-Za-z0-9'`.:/-]*/g)?.length ?? 0
}

describe("compiled five-level problem bank", () => {
  it("publishes the accepted batches and serves only budget-compliant problems", () => {
    expect(tracker.acceptedTotal).toBe(372)
    expect(tracker.counts.byLevel).toEqual({
      1: 140,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
    // Published evidence stays immutable; runtime retires the over-length
    // document-era problems (2026-07-22 redesign), so the served bank is the
    // budget-compliant subset of the tracker.
    expect(problemBank.every(withinRuntimeBudget)).toBe(true)
    const servedByLevel = { 1: 140, 2: 148, 3: 30, 4: 12, 5: 12 } as const
    expect(problemBank).toHaveLength(
      Object.values(servedByLevel).reduce((sum, count) => sum + count, 0),
    )
    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(getProblemsForLevel(level)).toHaveLength(servedByLevel[level])
    }
  })

  it("publishes reviewed syntax and composite rebuild families", () => {
    const trackedFamilies = tracker.counts.byFamily as Record<string, number>
    expect(
      getProblemsForLevel(1).filter(
        (problem) => problem.familyId === "italic-emphasis",
      ),
    ).toHaveLength(trackedFamilies["italic-emphasis"] ?? 0)
    expect(
      getProblemsForLevel(2).filter(
        (problem) => problem.familyId === "rebuild-real-documents",
      ),
    ).toHaveLength(trackedFamilies["rebuild-real-documents"] ?? 0)
    expect(
      getProblemsForLevel(1).filter(
        (problem) => problem.familyId === "fenced-code-blocks",
      ),
    ).toHaveLength(trackedFamilies["fenced-code-blocks"] ?? 0)
    expect(
      getProblemsForLevel(2).filter(
        (problem) => problem.familyId === "rebuild-code-block-documents",
      ),
    ).toHaveLength(trackedFamilies["rebuild-code-block-documents"] ?? 0)
    expect(
      problemBank.filter((problem) => problem.familyId === "headings"),
    ).toHaveLength(44)
    expect(
      getProblemsForLevel(2).filter(
        (problem) => problem.familyId === "rebuild-sectioned-documents",
      ),
    ).toHaveLength(12)
    expect(
      getProblemsForLevel(2).filter(
        (problem) => problem.familyId === "rebuild-nested-list-documents",
      ),
    ).toHaveLength(12)
    expect(
      getProblemsForLevel(1).filter(
        (problem) => problem.familyId === "nested-lists",
      ),
    ).toHaveLength(trackedFamilies["nested-lists"] ?? 0)
    expect(
      getProblemsForLevel(3).filter(
        (problem) => problem.familyId === "readable-human-document",
      ),
    ).toHaveLength(trackedFamilies["readable-human-document"] ?? 0)
    // Document-length specs and work orders remain tracked evidence but are
    // retired from runtime by the budget filter.
    expect(
      getProblemsForLevel(4).filter(
        (problem) => problem.familyId === "executable-development-spec",
      ),
    ).toHaveLength(0)
    expect(
      getProblemsForLevel(5).filter(
        (problem) => problem.familyId === "agent-ready-work-order",
      ),
    ).toHaveLength(0)
    expect(
      getProblemsForLevel(4).filter(
        (problem) => problem.familyId === "workplace-notes",
      ),
    ).toHaveLength(trackedFamilies["workplace-notes"] ?? 0)
    for (const family of [
      "developer-readme",
      "developer-bug-report",
      "developer-pr-description",
    ]) {
      expect(
        getProblemsForLevel(5).filter(
          (problem) => problem.familyId === family,
        ),
      ).toHaveLength(trackedFamilies[family] ?? 0)
    }
  })

  it("changes only starterText when hydrating the budget-compliant projection", () => {
    const generatedProblems = (
      [
        ...runtimeProjections.levels[1],
        ...runtimeProjections.levels[2],
        ...runtimeProjections.levels[3],
        ...runtimeProjections.levels[4],
        ...runtimeProjections.levels[5],
      ] as unknown as NormalizedProblem[]
    ).filter(withinRuntimeBudget)

    expect(problemBank.map(withoutStarterText)).toEqual(
      generatedProblems.map(withoutStarterText),
    )
  })

  it("pre-fills every problem with deterministic visible prose and exact line topology", () => {
    expect(getProblem("l1-heading-apple").starterText).toBe("Apple")
    expect(getProblem("l1-nested-bullets-lunch-tray").starterText).toBe(
      "Lunch tray\nSandwich\nApple",
    )
    expect(getProblem("l1-link-community-notice").starterText).toBe(
      "The latest update is in the community notice.",
    )
    expect(getProblem("l1-code-block-book-label").starterText).toBe(
      "\nReturn on Tuesday\n",
    )
    expect(
      getProblem("l1-thematic-break-breakfast-dessert").starterText,
    ).toBe("Breakfast is ready.\n\n\n\nSave dessert for later.")
    expect(getProblem("l2-nested-checklist-closet-shelf").starterText).toBe(
      [
        "Closet shelf",
        "",
        "Sort the clean clothes by where they belong.",
        "",
        "Top shelf",
        "Sweaters",
        "Scarves",
        "Middle shelf",
        "Shoe bin",
      ].join("\n"),
    )

    for (const problem of problemBank) {
      expect(problem.starterText, problem.id).toBe(
        derivePlaintextStarter(problem.target),
      )
      expect(problem.starterText.split("\n"), problem.id).toHaveLength(
        problem.target.replace(/\r\n?/g, "\n").split("\n").length,
      )
      expect(problem.starterText, problem.id).not.toMatch(
        /[\u00a0\u1680\u2000-\u200d\u202f\u205f\u2060\u3000\ufeff]/,
      )
      expect(evaluateProblem(problem, problem.starterText).status, problem.id).toBe(
        "fail",
      )
    }
  })

  it("keeps the Level 3 thematic-break line as an empty insertion point", () => {
    const problem = getProblem("l3-agenda-break-room-supplies")
    const targetLines = problem.target.split("\n")
    const starterLines = problem.starterText.split("\n")
    const dividerLine = targetLines.indexOf("---")

    expect(dividerLine).toBeGreaterThan(0)
    expect(starterLines).toHaveLength(targetLines.length)
    expect(starterLines[dividerLine]).toBe("")
    expect(starterLines[dividerLine - 1]).toBe("")
    expect(starterLines[dividerLine + 1]).toBe("")
    expect(starterLines[dividerLine + 2]).toBe("Agenda")
  })

  it("keeps the Level 5 fence payload verbatim between empty fence lines", () => {
    const problem = getProblem("l5-bug-duplicate-webhook-retry-report")
    const targetLines = problem.target.split("\n")
    const starterLines = problem.starterText.split("\n")
    const openingFenceLine = targetLines.findIndex((line) =>
      line.startsWith("```"),
    )
    const closingFenceLine = targetLines.findIndex(
      (line, index) => index > openingFenceLine && line === "```",
    )

    expect(openingFenceLine).toBeGreaterThan(0)
    expect(closingFenceLine).toBeGreaterThan(openingFenceLine)
    expect(starterLines).toHaveLength(targetLines.length)
    expect(starterLines[openingFenceLine]).toBe("")
    expect(starterLines[closingFenceLine]).toBe("")
    expect(starterLines.slice(openingFenceLine + 1, closingFenceLine)).toEqual(
      targetLines.slice(openingFenceLine + 1, closingFenceLine),
    )
    expect(evaluateProblem(problem, problem.starterText).status).toBe("fail")
  })

  it("keeps every served advanced Goal inside the current practice ceiling", () => {
    const ceilings = {
      3: { lines: 28, words: 150 },
      4: { lines: 20, words: 120 },
      5: { lines: 20, words: 120 },
    } as const

    for (const problem of problemBank.filter(
      (candidate) => (candidate.level ?? 0) >= 3,
    )) {
      const level = problem.level as keyof typeof ceilings
      expect(problem.target.split("\n").length, problem.id).toBeLessThanOrEqual(
        ceilings[level].lines,
      )
      expect(authoredWordCount(problem.target), problem.id).toBeLessThanOrEqual(
        ceilings[level].words,
      )
    }
  })

  it("has a deterministic revision and lookup", () => {
    expect(problemBankRevision).toContain("l1-")
    expect(problemBankRevision).toContain("l5-")
    expect(
      flattenedStarterProjectionProblemBankRevision.endsWith(
        "|starter-projection@1",
      ),
    ).toBe(true)
    expect(problemBankRevision.endsWith("|starter-projection@2")).toBe(true)
    expect(getProblem(problemBank[0].id)).toBe(problemBank[0])
    expect(() => getProblem("missing-problem")).toThrow("Unknown problem")
  })

  it("passes the schema-v2 bank and fixture contract", () => {
    const publishedProblemRevisions = new Set(
      problemBank.map(({ id, revision }) => `${id}@${revision}`),
    )
    const publishedFixtures = [
      ...level12SeedFixtures,
      ...level35SeedFixtures,
      ...headingBatch002Fixtures,
      ...emphasisBatch003Fixtures,
      ...listBatch004Fixtures,
      ...orderedListBatch005Fixtures,
      ...blockquoteBatch006Fixtures,
      ...inlineCodeBatch007Fixtures,
      ...linkBatch008Fixtures,
      ...thematicBreakBatch009Fixtures,
      ...readableDocumentBatch010Fixtures,
      ...readableDocumentBatch011Fixtures,
      ...developmentSpecBatch012Fixtures,
      ...italicRebuildBatch013Fixtures,
      ...codeBlockBatch014Fixtures,
      ...headingDepthBatch015Fixtures,
      ...nestedListBatch016Fixtures,
      ...advancedDocumentBatch017Fixtures,
      ...advancedDocumentReplacementBatch018Fixtures,
      ...nestedBulletBatch019Fixtures,
      ...developerFormsBatch020Fixtures,
      ...workplaceNotesBatch021Fixtures,
    ].filter(({ problemId, problemRevision }) =>
      publishedProblemRevisions.has(`${problemId}@${problemRevision ?? 1}`),
    )

    expect(
      validateProblemBank(problemBank, publishedFixtures),
    ).toEqual([])
  })
})
