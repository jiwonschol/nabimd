import { describe, expect, it } from "vitest"
import type { MatchCheck, TableShape } from "../../content/types"
import { validateProblemBank } from "../../content/validateProblemBank"
import { createEvaluationContext } from "../evaluationContext"
import { structuralCheckPasses } from "./structural"

function tableCheck(
  tableShape: TableShape,
  scope: Extract<MatchCheck, { kind: "block-count" }>["scope"] = {
    kind: "document",
  },
): Extract<MatchCheck, { kind: "block-count" }> {
  return {
    id: "shaped-table",
    kind: "block-count",
    scope,
    block: "table",
    min: 1,
    priority: 10,
    feedback: "표를 쓴다.",
    tableShape,
  }
}

function passes(check: MatchCheck, source: string) {
  return structuralCheckPasses(
    check as Exclude<
      MatchCheck,
      { kind: "heading-spacing" | "hash-heading-style" | "has-heading" }
    >,
    createEvaluationContext(source),
  )
}

const twoByTwo = "| 요일 | 메뉴 |\n| --- | --- |\n| 월 | 국수 |\n| 화 | 김밥 |"

describe("table shape on block-count", () => {
  it("counts a table whose header cells and body rows match", () => {
    expect(passes(tableCheck({ headerCells: 2, minBodyRows: 2, maxBodyRows: 2 }), twoByTwo)).toBe(true)
  })

  it("accepts alignment colons and missing edge pipes", () => {
    const source = "요일 | 메뉴\n:--- | ---:\n월 | 국수\n화 | 김밥"
    expect(passes(tableCheck({ headerCells: 2, minBodyRows: 2 }), source)).toBe(true)
  })

  it("rejects a table with no body rows", () => {
    const source = "| 요일 | 메뉴 |\n| --- | --- |"
    expect(passes(tableCheck({ headerCells: 2, minBodyRows: 1 }), source)).toBe(false)
  })

  it("does not count body rows whose cells are all empty", () => {
    const source = "| 요일 | 메뉴 |\n| --- | --- |\n|  |  |\n|  |  |"
    expect(passes(tableCheck({ headerCells: 2, minBodyRows: 1 }), source)).toBe(false)
  })

  it("rejects a table with a different number of header cells", () => {
    const source = "| 요일 | 메뉴 | 값 |\n| --- | --- | --- |\n| 월 | 국수 | 6천 |"
    expect(passes(tableCheck({ headerCells: 2, minBodyRows: 1 }), source)).toBe(false)
  })

  it("rejects more body rows than the maximum", () => {
    expect(passes(tableCheck({ headerCells: 2, maxBodyRows: 1 }), twoByTwo)).toBe(false)
  })

  it("rejects piped text that never becomes a table", () => {
    const source = "| 요일 | 메뉴 |\n| 월 | 국수 |"
    expect(passes(tableCheck({ headerCells: 2 }), source)).toBe(false)
  })

  it("limits the count to the scoped section", () => {
    const source = `# 식단\n\n## 이번 주\n\n메모만 둔다.\n\n## 다음 주\n\n${twoByTwo}`
    const scoped = (occurrence: number) =>
      tableCheck({ headerCells: 2, minBodyRows: 1 }, {
        kind: "section",
        headingDepth: 2,
        occurrence,
      })
    expect(passes(scoped(0), source)).toBe(false)
    expect(passes(scoped(1), source)).toBe(true)
  })

  it("is rejected by the validator outside table blocks or with bad numbers", () => {
    const base = {
      id: "t",
      teachingMode: "introduce",
      teaching: { concept: "c", howTo: "h", example: "e" },
      syntaxTokens: [],
      title: "t",
      prompt: "p",
      target: twoByTwo,
      starterText: "",
      protectedContent: [],
      editorialChecks: [],
      hints: ["a", "b", "c"],
      reviewTags: [],
      familyId: "headings",
      skillIds: ["heading-h1"],
      difficulty: "warmup",
      retryFamily: "heading-h1",
    } as const
    const errors = validateProblemBank(
      [
        {
          ...base,
          matchChecks: [
            { ...tableCheck({ headerCells: 0, minBodyRows: 3, maxBodyRows: 1 }), block: "list" },
          ],
        },
      ],
      [],
    )
    expect(errors).toEqual(
      expect.arrayContaining([
        "Problem t check shaped-table can only use tableShape with table blocks",
        "Problem t check shaped-table has invalid tableShape header cells",
        "Problem t check shaped-table has min greater than max",
      ]),
    )
  })
})
