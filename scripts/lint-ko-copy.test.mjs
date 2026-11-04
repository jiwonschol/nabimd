import { describe, expect, it } from "vitest"
import { findHardcodedCopy, findPoliteEndings } from "./lint-ko-copy.mjs"

describe("Korean copy lint", () => {
  it("flags 해요체 and passes ~다 sentences", () => {
    expect(findPoliteEndings('  "a": "진도를 지웠어요.",\n  "b": "진도를 지웠다.",')).toEqual([
      { line: 1, text: "진도를 지웠어요." },
    ])
    expect(findPoliteEndings('"c": "다시 해 볼까요? 아니면 쉬어요"')).toHaveLength(1)
    expect(findPoliteEndings('"d": "요약을 본다."')).toEqual([])
  })

  it("flags copy written into a component", () => {
    const source = [
      "export function A() {",
      "  const ref = useRef<HTMLDivElement>(null)",
      '  return <button aria-label="Close">Save now</button>',
      "}",
      'const label = "저장한다"',
    ].join("\n")
    expect(findHardcodedCopy(source).map((finding) => finding.text)).toEqual([
      "Save now",
      'aria-label="Close"',
      "저장한다",
    ])
  })

  it("sees text beside an expression in the same element", () => {
    expect(findHardcodedCopy("const a = <p>Hello {name}</p>").map((f) => f.text)).toEqual([
      "Hello",
    ])
    expect(
      findHardcodedCopy("const a = <p>{count} items left</p>").map((f) => f.text),
    ).toEqual(["items left"])
    expect(findHardcodedCopy('const a = <p>{t("a")} · {t("b")}</p>')).toEqual([])
  })

  it("lets dictionary lookups, the product name and comments through", () => {
    const source = [
      "// 화면 문구는 사전에서 온다",
      "export function A() {",
      '  return <h1 className="x">{t("home.title")}<span>Nabi Markdown</span></h1>',
      "}",
    ].join("\n")
    expect(findHardcodedCopy(source)).toEqual([])
  })
})
