import { describe, expect, it } from "vitest"
import { koCardsByMark } from "../content/ko"
import { evaluateProblem } from "../engine/evaluateProblem"
import { loadBank } from "./bank"
import { englishItems } from "./bankEn"
import { itemsFromKoBank } from "./bankKo"
import { MARKS } from "./marks"

describe("English bank", () => {
  const items = englishItems()

  it("serves the standard problems whose marks are all among the twelve", () => {
    expect(items).toHaveLength(316)
    expect(items.filter((item) => !item.mixed)).toHaveLength(236)
    expect(items.filter((item) => item.mixed)).toHaveLength(80)
    for (const item of items) {
      expect(item.marks.every((mark) => (MARKS as readonly string[]).includes(mark))).toBe(true)
    }
  })

  it("opens every served Level 1 problem in fill mode and passes its answer", () => {
    const levelOne = items.filter((item) => item.problem.level === 1)
    // 164 Level 1 records; the 16 nested-list and thematic-break ones are
    // outside the twelve marks and are not served.
    expect(levelOne).toHaveLength(148)
    for (const { problem } of levelOne) {
      expect(problem.starterText, problem.id).not.toBe(problem.target)
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe("matched")
      expect(evaluateProblem(problem, problem.starterText).status, problem.id).toBe("fail")
    }
  })
})

describe("Korean bank", () => {
  it("serves the Korean bank v1: 96 single-mark and 24 mixed documents", async () => {
    const items = await loadBank("ko")
    expect(items.filter((item) => !item.mixed)).toHaveLength(96)
    expect(items.filter((item) => item.mixed)).toHaveLength(24)
    for (const mark of MARKS) {
      expect(items.filter((item) => !item.mixed && item.marks[0] === mark), mark).toHaveLength(8)
    }
    for (const { problem } of items) {
      expect(problem.starterText, problem.id).not.toBe("")
      expect(problem.starterText, problem.id).not.toBe(problem.target)
      expect(evaluateProblem(problem, problem.target).status, problem.id).toBe("matched")
    }
  })

  it("names the bank's bulleted list as the list mark", () => {
    const [card] = koCardsByMark.list
    const items = itemsFromKoBank({
      koCardsByMark: { list: [card!] },
      koMixedCards: [{ problem: card!.problem, marks: ["heading", "list"] }],
    })
    expect(items.map((item) => [item.marks, item.mixed])).toEqual([
      [["unordered-list"], false],
      [["heading", "unordered-list"], true],
    ])
  })

  it("explains a Setext title with the dedicated hash-style feedback (D11)", () => {
    const grocery = koCardsByMark.list[0]!.problem
    const title = grocery.target.split("\n")[0]!.replace(/^# /, "")
    const setext = grocery.target.replace(`# ${title}`, `${title}\n===`)
    expect(evaluateProblem(grocery, setext)).toMatchObject({
      status: "fail",
      feedbackId: "use-hash-heading-style",
      message: `제목 아래에 선을 긋지 말고 줄 처음에 # 을 쓴다. 예: # ${title}`,
    })
  })
})
