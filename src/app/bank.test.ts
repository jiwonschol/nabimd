import { describe, expect, it } from "vitest"
import { koSamples } from "../content/ko/_samples"
import { evaluateProblem } from "../engine/evaluateProblem"
import { loadBank } from "./bank"
import { englishItems } from "./bankEn"
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
  it("runs on the three samples until the Korean bank lands", async () => {
    const items = await loadBank("ko")
    expect(items.map((item) => [item.problem.id, item.marks])).toEqual([
      ["ko-sample-grocery-memo", ["unordered-list"]],
      ["ko-sample-meeting-memo", ["ordered-list"]],
      ["ko-sample-ai-request", ["blockquote"]],
    ])
    for (const { problem } of items) {
      expect(problem.starterText).not.toBe("")
      expect(evaluateProblem(problem, problem.target).status).toBe("matched")
    }
  })

  it("explains a Setext title with the dedicated hash-style feedback (D11)", () => {
    const grocery = koSamples[0].problem
    const setext = grocery.target.replace("# 장보기 메모", "장보기 메모\n===")
    expect(evaluateProblem(grocery, setext)).toMatchObject({
      status: "fail",
      feedbackId: "use-hash-heading-style",
      message: "제목은 # 으로 시작하는 방식으로 쓴다. 예: # 장보기 메모",
    })
  })
})

describe("Korean bank index (issue #253)", () => {
  it("reads the bank's cards, naming its bulleted list as the list mark", async () => {
    const { itemsFromKoIndex } = await import("./bankKo")
    const grocery = koSamples[0].problem
    const meeting = koSamples[1]!.problem
    const items = itemsFromKoIndex({
      koCardsByMark: { list: [{ problem: grocery, marks: ["list"] }] },
      koMixedCards: [{ problem: meeting, marks: ["heading", "bold", "ordered-list"] }],
    })
    expect(items.map((item) => [item.problem.id, item.marks, item.mixed])).toEqual([
      ["ko-sample-grocery-memo", ["unordered-list"], false],
      ["ko-sample-meeting-memo", ["heading", "bold", "ordered-list"], true],
    ])
    expect(items[0]!.problem.starterText).not.toBe("")
  })
})
