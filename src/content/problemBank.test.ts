import { describe, expect, it } from "vitest"
import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import tracker from "../../curriculum/problem-bank/tracker.generated.json"
import { blockquoteBatch006Fixtures } from "./batches/blockquoteBatch006Fixtures"
import { advancedDocumentBatch017Fixtures } from "./batches/advancedDocumentBatch017Fixtures"
import { codeBlockBatch014Fixtures } from "./batches/codeBlockBatch014Fixtures"
import { developmentSpecBatch012Fixtures } from "./batches/developmentSpecBatch012Fixtures"
import { emphasisBatch003Fixtures } from "./batches/emphasisBatch003Fixtures"
import { headingBatch002Fixtures } from "./batches/headingBatch002Fixtures"
import { headingDepthBatch015Fixtures } from "./batches/headingDepthBatch015Fixtures"
import { inlineCodeBatch007Fixtures } from "./batches/inlineCodeBatch007Fixtures"
import { italicRebuildBatch013Fixtures } from "./batches/italicRebuildBatch013Fixtures"
import { linkBatch008Fixtures } from "./batches/linkBatch008Fixtures"
import { listBatch004Fixtures } from "./batches/listBatch004Fixtures"
import { nestedListBatch016Fixtures } from "./batches/nestedListBatch016Fixtures"
import { orderedListBatch005Fixtures } from "./batches/orderedListBatch005Fixtures"
import { readableDocumentBatch010Fixtures } from "./batches/readableDocumentBatch010Fixtures"
import { readableDocumentBatch011Fixtures } from "./batches/readableDocumentBatch011Fixtures"
import { thematicBreakBatch009Fixtures } from "./batches/thematicBreakBatch009Fixtures"
import { level12SeedFixtures } from "./level12SeedFixtures"
import { level35SeedFixtures } from "./level35SeedFixtures"
import {
  getProblem,
  getProblemsForLevel,
  problemBank,
  problemBankRevision,
} from "./problemBank"
import { derivePlaintextStarter } from "./plaintextStarter"
import type { NormalizedProblem } from "./types"
import { validateProblemBank } from "./validateProblemBank"

function withoutStarterText(problem: NormalizedProblem) {
  const { starterText: _starterText, ...rest } = problem
  return rest
}

describe("compiled five-level problem bank", () => {
  it("publishes the accepted foundation and reviewed expansion batches", () => {
    expect(tracker.acceptedTotal).toBe(344)
    expect(tracker.counts.byLevel).toEqual({
      1: 136,
      2: 148,
      3: 30,
      4: 20,
      5: 10,
    })
    expect(problemBank).toHaveLength(tracker.acceptedTotal)
    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(getProblemsForLevel(level)).toHaveLength(
        tracker.counts.byLevel[level],
      )
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
      getProblemsForLevel(3).filter(
        (problem) => problem.familyId === "readable-human-document",
      ),
    ).toHaveLength(trackedFamilies["readable-human-document"] ?? 0)
    expect(
      getProblemsForLevel(4).filter(
        (problem) => problem.familyId === "executable-development-spec",
      ),
    ).toHaveLength(trackedFamilies["executable-development-spec"] ?? 0)
    expect(
      getProblemsForLevel(5).filter(
        (problem) => problem.familyId === "agent-ready-work-order",
      ),
    ).toHaveLength(trackedFamilies["agent-ready-work-order"] ?? 0)
  })

  it("changes only starterText when hydrating the generated runtime projection", () => {
    const generatedProblems = [
      ...runtimeProjections.levels[1],
      ...runtimeProjections.levels[2],
      ...runtimeProjections.levels[3],
      ...runtimeProjections.levels[4],
      ...runtimeProjections.levels[5],
    ] as unknown as NormalizedProblem[]

    expect(problemBank.map(withoutStarterText)).toEqual(
      generatedProblems.map(withoutStarterText),
    )
  })

  it("pre-fills every reproduction problem with deterministic visible prose", () => {
    expect(getProblem("l1-heading-apple").starterText).toBe("Apple")
    expect(getProblem("l1-link-community-notice").starterText).toBe(
      "The latest update is in the community notice.",
    )
    expect(getProblem("l1-code-block-book-label").starterText).toBe(
      "Return on Tuesday",
    )
    expect(
      getProblem("l1-thematic-break-breakfast-dessert").starterText,
    ).toBe("Breakfast is ready.\n\nSave dessert for later.")
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

    for (const problem of problemBank.filter(({ level }) => level <= 2)) {
      expect(problem.starterText, problem.id).toBe(
        derivePlaintextStarter(problem.target),
      )
      expect(problem.starterText, problem.id).not.toMatch(
        /[\u00a0\u1680\u2000-\u200d\u202f\u205f\u2060\u3000\ufeff]/,
      )
    }
  })

  it("leaves composition-level starter text unchanged", () => {
    const generatedById = new Map(
      [
        ...runtimeProjections.levels[3],
        ...runtimeProjections.levels[4],
        ...runtimeProjections.levels[5],
      ].map((problem) => [problem.id, problem]),
    )

    for (const problem of problemBank.filter(({ level }) => level >= 3)) {
      expect(problem.starterText, problem.id).toBe(
        generatedById.get(problem.id)?.starterText,
      )
    }
  })

  it("has a deterministic revision and lookup", () => {
    expect(problemBankRevision).toContain("l1-")
    expect(problemBankRevision).toContain("l5-")
    expect(getProblem(problemBank[0].id)).toBe(problemBank[0])
    expect(() => getProblem("missing-problem")).toThrow("Unknown problem")
  })

  it("passes the schema-v2 bank and fixture contract", () => {
    const publishedProblemIds = new Set(problemBank.map(({ id }) => id))
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
    ].filter(({ problemId }) => publishedProblemIds.has(problemId))

    expect(
      validateProblemBank(problemBank, publishedFixtures),
    ).toEqual([])
  })
})
