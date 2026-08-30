import { describe, expect, it } from "vitest"
import { createEvaluationContext } from "./evaluationContext"
import { countSyntaxPresence } from "./syntaxPresence"

describe("syntax presence", () => {
  it("counts escapes only where Markdown interprets them", () => {
    expect(countSyntaxPresence(createEvaluationContext("\\*text\\*"), "escape")).toBe(2)
    expect(countSyntaxPresence(createEvaluationContext("`\\*text\\*`"), "escape")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("```text\n\\# literal\n```"), "escape")).toBe(0)
  })

  it("counts each matched footnote identifier once", () => {
    expect(countSyntaxPresence(createEvaluationContext("Claim[^a]. Again[^a].\n\n[^a]: Source"), "footnote")).toBe(1)
    expect(countSyntaxPresence(createEvaluationContext("[^a]: Unreferenced"), "footnote")).toBe(0)
    expect(countSyntaxPresence(createEvaluationContext("Missing[^a]"), "footnote")).toBe(0)
  })
})
