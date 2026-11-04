import { describe, expect, it } from "vitest"
import {
  emptyProgress,
  FAMILIAR_PASSES,
  markState,
  RECENT_LIMIT,
  recordCheck,
} from "./learning"

describe("learning progress", () => {
  it("moves a mark from not tried to tried to familiar", () => {
    let progress = emptyProgress()
    expect(markState(progress.ko, "blockquote")).toBe("new")

    progress = recordCheck(progress, "ko", {
      problemId: "a",
      marks: ["blockquote"],
      passed: false,
      at: 1,
    })
    expect(markState(progress.ko, "blockquote")).toBe("tried")

    for (let pass = 0; pass < FAMILIAR_PASSES; pass += 1) {
      progress = recordCheck(progress, "ko", {
        problemId: `p${pass}`,
        marks: ["blockquote"],
        passed: true,
        at: 2 + pass,
      })
    }
    expect(markState(progress.ko, "blockquote")).toBe("familiar")
    expect(progress.ko.marks.blockquote).toEqual({
      tries: 1 + FAMILIAR_PASSES,
      passes: FAMILIAR_PASSES,
      lastAt: 1 + FAMILIAR_PASSES,
    })
  })

  it("keeps the two languages apart", () => {
    const progress = recordCheck(emptyProgress(), "en", {
      problemId: "x",
      marks: ["table"],
      passed: true,
      at: 1,
    })
    expect(markState(progress.en, "table")).toBe("tried")
    expect(markState(progress.ko, "table")).toBe("new")
  })

  it("keeps a short newest-first list of written documents", () => {
    let progress = emptyProgress()
    for (let index = 0; index < RECENT_LIMIT + 5; index += 1) {
      progress = recordCheck(progress, "ko", {
        problemId: `doc-${index}`,
        marks: ["heading"],
        passed: true,
        at: index,
      })
    }
    progress = recordCheck(progress, "ko", {
      problemId: "doc-10",
      marks: ["heading"],
      passed: true,
      at: 99,
    })
    expect(progress.ko.recentIds).toHaveLength(RECENT_LIMIT)
    expect(progress.ko.recentIds[0]).toBe("doc-10")
    expect(progress.ko.recentIds.filter((id) => id === "doc-10")).toHaveLength(1)
  })
})
