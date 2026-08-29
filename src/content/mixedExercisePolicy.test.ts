import { describe, expect, it } from "vitest"
import { getProblem } from "./problemBank"
import {
  hasSeparatedSyntaxRepeat,
  isEligibleMixedExercise,
} from "./mixedExercisePolicy"

describe("mixed exercise card policy", () => {
  it("keeps one list split around its inline-code lesson eligible", () => {
    for (const id of [
      "l4-checklist-kiosk-shutdown",
      "l4-checklist-studio-closing",
      "l4-checklist-workshop-opening",
    ]) {
      const problem = getProblem(id)
      expect(hasSeparatedSyntaxRepeat(problem), id).toBe(false)
      expect(isEligibleMixedExercise(problem), id).toBe(true)
    }

    const longDelimiter = {
      target: "- ```a```\n- b",
      starterText: "a\nb",
    }
    expect(hasSeparatedSyntaxRepeat(longDelimiter)).toBe(false)
    expect(isEligibleMixedExercise(longDelimiter)).toBe(true)
  })

  it("does not exempt any other separated repeat", () => {
    expect(
      hasSeparatedSyntaxRepeat({
        target: "# First\n\n- Item\n\n## Detail\n\n# Second",
        starterText: "First\nItem\nDetail\nSecond",
      }),
    ).toBe(true)
    expect(
      hasSeparatedSyntaxRepeat({
        target: "- One\n\n**Bold**\n\n- Two",
        starterText: "One\nBold\nTwo",
      }),
    ).toBe(true)
    expect(
      hasSeparatedSyntaxRepeat({
        target: "- One\n\nParagraph with `code`.\n\n- Two",
        starterText: "One\n\nParagraph with code.\n\nTwo",
      }),
    ).toBe(true)
  })
})
