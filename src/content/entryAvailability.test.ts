import { describe, expect, it } from "vitest"
import { createRunProblemIds, entryChoices } from "./entryChoices"

describe("curriculum entry availability", () => {
  it("allows only levels with enough implemented elements for one unique turn", () => {
    expect(
      entryChoices.map(({ id, available }) => ({ id, available })),
    ).toEqual([
      { id: "level-1", available: true },
      { id: "level-2", available: false },
      { id: "level-3", available: false },
    ])
    expect(createRunProblemIds("level-1", 0)).not.toHaveLength(0)
    expect(() => createRunProblemIds("level-2", 0)).toThrow(
      "Level 2 is not available yet",
    )
    expect(() => createRunProblemIds("level-3", 0)).toThrow(
      "Level 3 is not available yet",
    )
  })
})
