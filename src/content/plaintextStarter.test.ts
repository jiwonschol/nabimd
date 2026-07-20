import { describe, expect, it } from "vitest"
import { derivePlaintextStarter } from "./plaintextStarter"

describe("derivePlaintextStarter", () => {
  it("keeps learner-visible prose while removing Markdown structure", () => {
    const target = [
      "# Trip note",
      "",
      "> Pack **light**.",
      "",
      "- Map",
      "- [Tickets](/tickets)",
      "  - Print copy",
      "",
      "---",
      "",
      "~~~js",
      "Gate 4",
      "~~~",
    ].join("\n")

    expect(derivePlaintextStarter(target)).toBe(
      [
        "Trip note",
        "",
        "Pack light.",
        "",
        "Map",
        "Tickets",
        "Print copy",
        "",
        "Gate 4",
      ].join("\n"),
    )
  })

  it("keeps inline text and image alt text but drops destinations and raw HTML", () => {
    const target = [
      "Use *quiet* mode, `npm test`, and the [guide](/guide).",
      "",
      "![Weather chart](chart.png)",
      "",
      "<aside>Internal note</aside>",
      "",
      "[guide]: /reference",
    ].join("\n")

    expect(derivePlaintextStarter(target)).toBe(
      "Use quiet mode, npm test, and the guide.\n\nWeather chart",
    )
  })

  it("normalizes line endings and invisible Unicode whitespace", () => {
    expect(
      derivePlaintextStarter(
        "# Blue\u00a0sky\u200b\r\n\r\nWide\u3000space\u2060   ",
      ),
    ).toBe("Blue sky\n\nWide space")
  })

  it("returns an empty starter for a target with no visible content", () => {
    expect(derivePlaintextStarter("---\n\n<!-- hidden -->")).toBe("")
  })
})
