import { describe, expect, it } from "vitest"
import { problemBank } from "../content/problemBank"
import type { GradableProblem } from "../content/types"
import { hintPatternLines } from "./AnswerPanel"

function bankProblem(id: string): GradableProblem {
  const problem = problemBank.find((candidate) => candidate.id === id)
  if (!problem) throw new Error(`Missing problem: ${id}`)
  return problem
}

function firstOfFamily(level: number, familyId: string): GradableProblem {
  const problem = problemBank.find(
    (candidate) =>
      (candidate.level ?? 1) === level && candidate.familyId === familyId,
  )
  if (!problem) throw new Error(`Missing family: L${level} ${familyId}`)
  return problem
}

describe("hintPatternLines", () => {
  it("joins the link pattern into the single line the learner types", () => {
    const lines = hintPatternLines(firstOfFamily(1, "links"))
    expect(lines).toEqual([
      { kind: "code", text: "[Link text](Web address)" },
    ])
  })

  it("keeps the grammar-required space visible as an interpunct", () => {
    expect(hintPatternLines(firstOfFamily(1, "headings"))).toEqual([
      { kind: "code", text: "#·Heading" },
    ])
    expect(hintPatternLines(firstOfFamily(1, "blockquotes"))).toEqual([
      { kind: "code", text: ">·Words" },
    ])
  })

  it("keeps list patterns to one grammar line plus the New line cue", () => {
    expect(hintPatternLines(firstOfFamily(1, "lists"))).toEqual([
      { kind: "code", text: "-·Item" },
      { kind: "meta", text: "New line" },
    ])
  })

  it("keeps multiline grammars on their real lines", () => {
    expect(hintPatternLines(firstOfFamily(1, "horizontal-rules"))).toEqual([
      { kind: "meta", text: "Blank line" },
      { kind: "code", text: "---" },
      { kind: "meta", text: "Blank line" },
    ])
    expect(hintPatternLines(firstOfFamily(1, "fenced-code-blocks"))).toEqual([
      { kind: "code", text: "```" },
      { kind: "code", text: "Text" },
      { kind: "code", text: "```" },
    ])
    expect(hintPatternLines(bankProblem("l1-nested-bullets-bedside-table"))).toEqual([
      { kind: "code", text: "- Item" },
      { kind: "code", text: "  - Nested item" },
    ])
  })

  it("leaves mark-list problems one mark per row", () => {
    const rebuild = problemBank.find((candidate) =>
      candidate.familyId.startsWith("rebuild"),
    )
    if (!rebuild) throw new Error("Missing rebuild problem")
    expect(hintPatternLines(rebuild)).toEqual(
      rebuild.syntaxTokens.map((token) => ({ kind: "code", text: token })),
    )

    const level5 = problemBank.find((candidate) => candidate.level === 5)
    if (!level5) throw new Error("Missing level 5 problem")
    for (const line of hintPatternLines(level5)) {
      expect(line.kind).toBe("code")
    }
  })

  it("never leaves an invisible trailing space in any published pattern", () => {
    for (const problem of problemBank) {
      for (const line of hintPatternLines(problem)) {
        expect(line.text, problem.id).not.toMatch(/[\t ]$/)
        expect(line.text, problem.id).not.toBe("")
      }
    }
  })
})
