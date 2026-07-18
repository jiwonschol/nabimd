import { describe, expect, it } from "vitest"
import { headingProblems } from "./headingProblems"
import { normalizeProblem } from "./normalizeProblem"
import type { ProblemInput } from "./types"

function schemaV2Input(flavor?: "standard"): ProblemInput {
  return {
    ...headingProblems[0],
    schemaVersion: 2,
    level: 1,
    flavor,
    vocabulary: {
      profile: "everyday",
      domains: ["fruit"],
      terms: ["apple"],
    },
    sourceBatchId: "seed-headings-v2",
    revision: 1,
    curriculumVersion: "2026-07-19",
    contentVariant: "apple",
  }
}

describe("normalizeProblem", () => {
  it("normalizes omitted and explicit standard flavor identically", () => {
    expect(normalizeProblem(schemaV2Input())).toEqual(
      normalizeProblem(schemaV2Input("standard")),
    )
    expect(normalizeProblem(schemaV2Input()).flavor).toBe("standard")
  })

  it("projects the accepted legacy headings into schema v2", () => {
    expect(normalizeProblem(headingProblems[0])).toMatchObject({
      schemaVersion: 2,
      level: 1,
      flavor: "standard",
      vocabulary: {
        profile: "everyday",
        domains: ["everyday"],
        terms: ["Apple"],
      },
      sourceBatchId: "legacy-heading-v1",
      revision: 1,
      curriculumVersion: "2026-07-19",
      contentVariant: "Apple",
    })
  })

  it("returns fresh metadata arrays instead of mutating authoring input", () => {
    const input = schemaV2Input()
    const normalized = normalizeProblem(input)

    expect(normalized).not.toBe(input)
    expect(normalized.vocabulary.domains).not.toBe(input.vocabulary.domains)
    expect(normalized.vocabulary.terms).not.toBe(input.vocabulary.terms)
  })

  it("omits absent optional metadata from the canonical runtime object", () => {
    const normalized = normalizeProblem(schemaV2Input())

    expect(Object.hasOwn(normalized, "convention")).toBe(false)
  })
})
