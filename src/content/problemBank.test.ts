import { describe, expect, it } from "vitest"
import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import { blockquoteBatch006Fixtures } from "./batches/blockquoteBatch006Fixtures"
import { developmentSpecBatch012Fixtures } from "./batches/developmentSpecBatch012Fixtures"
import { emphasisBatch003Fixtures } from "./batches/emphasisBatch003Fixtures"
import { headingBatch002Fixtures } from "./batches/headingBatch002Fixtures"
import { inlineCodeBatch007Fixtures } from "./batches/inlineCodeBatch007Fixtures"
import { linkBatch008Fixtures } from "./batches/linkBatch008Fixtures"
import { listBatch004Fixtures } from "./batches/listBatch004Fixtures"
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
import { validateProblemBank } from "./validateProblemBank"

describe("compiled five-level problem bank", () => {
  it("publishes the accepted foundation and eleven reviewed expansion batches", () => {
    expect(problemBank).toHaveLength(248)
    expect(getProblemsForLevel(1)).toHaveLength(100)
    expect(getProblemsForLevel(2)).toHaveLength(100)
    expect(getProblemsForLevel(3)).toHaveLength(28)
    expect(getProblemsForLevel(4)).toHaveLength(16)
    expect(getProblemsForLevel(5)).toHaveLength(4)
  })

  it("executes the generated runtime projection without a parallel source list", () => {
    expect(problemBank).toEqual([
      ...runtimeProjections.levels[1],
      ...runtimeProjections.levels[2],
      ...runtimeProjections.levels[3],
      ...runtimeProjections.levels[4],
      ...runtimeProjections.levels[5],
    ])
  })

  it("has a deterministic revision and lookup", () => {
    expect(problemBankRevision).toContain("l1-")
    expect(problemBankRevision).toContain("l5-")
    expect(getProblem(problemBank[0].id)).toBe(problemBank[0])
    expect(() => getProblem("missing-problem")).toThrow("Unknown problem")
  })

  it("passes the schema-v2 bank and fixture contract", () => {
    expect(
      validateProblemBank(problemBank, [
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
      ]),
    ).toEqual([])
  })
})
