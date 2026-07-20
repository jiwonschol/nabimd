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
        "",
        "",
        "",
        "Gate 4",
        "",
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
      [
        "Use quiet mode, npm test, and the guide.",
        "",
        "Weather chart",
        "",
        "",
        "",
        "",
      ].join("\n"),
    )
  })

  it("normalizes line endings and invisible Unicode whitespace", () => {
    expect(
      derivePlaintextStarter(
        "# Blue\u00a0sky\u200b\r\n\r\nWide\u3000space\u2060   ",
      ),
    ).toBe("Blue sky\n\nWide space")
  })

  it("preserves meaningful indentation inside fenced code bodies", () => {
    expect(
      derivePlaintextStarter(
        ["```text", "  first", "    second", "```"].join("\n"),
      ),
    ).toBe(["", "  first", "    second", ""].join("\n"))
  })

  it("keeps placeholder lines for a target with no visible content", () => {
    expect(derivePlaintextStarter("---\n\n<!-- hidden -->")).toBe("\n\n")
  })

  it("keeps a thematic-break placeholder without changing line topology", () => {
    const target = [
      "# Brief",
      "",
      "Purpose.",
      "",
      "---",
      "",
      "## Agenda",
      "",
      "- Item",
    ].join("\n")
    const starter = derivePlaintextStarter(target)

    expect(starter).toBe(
      [
        "Brief",
        "",
        "Purpose.",
        "",
        "",
        "",
        "Agenda",
        "",
        "Item",
      ].join("\n"),
    )
    expect(starter.split("\n")).toHaveLength(target.split("\n").length)
  })

  it("removes only fence delimiters and preserves Markdown-looking payload", () => {
    const target = [
      "## Final report",
      "",
      "```markdown",
      "# Implementation report  ",
      "  - Scope:\t",
      "```",
    ].join("\n")
    const starter = derivePlaintextStarter(target)

    expect(starter).toBe(
      [
        "Final report",
        "",
        "",
        "# Implementation report  ",
        "  - Scope:\t",
        "",
      ].join("\n"),
    )
    expect(starter.split("\n")).toHaveLength(target.split("\n").length)
  })
})
