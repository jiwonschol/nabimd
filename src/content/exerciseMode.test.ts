import { describe, expect, it } from "vitest"
import { getExerciseMode } from "./exerciseMode"

describe("getExerciseMode", () => {
  it("resolves the selected curriculum entry instead of immutable problem metadata", () => {
    expect(getExerciseMode("level-1")).toBe("target")
    expect(getExerciseMode("level-2")).toBe("target")
    expect(getExerciseMode("level-3")).toBe("target")
  })
})
