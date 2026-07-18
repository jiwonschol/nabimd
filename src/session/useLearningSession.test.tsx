import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  PROGRESS_STORAGE_KEY,
  createDefaultProgress,
  saveProgress,
} from "../progress/progressStore"
import { MemoryStorage } from "../test/MemoryStorage"
import { useLearningSession } from "./useLearningSession"

describe("useLearningSession", () => {
  it("finishes a three-step run instead of ending after the first Perfect", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.start("level-1"))
    act(() => result.current.edit("# Apple"))
    act(() => result.current.check())
    act(() => result.current.next())

    expect(result.current.problem.id).toBe("heading-rainy-day")
    expect(result.current.session.phase).toBe("editing")
    expect(result.current.session.runStepIndex).toBe(1)

    act(() => result.current.edit("# Rainy day"))
    act(() => result.current.check())
    act(() => result.current.next())
    expect(result.current.problem.id).toBe("heading-study-tools")
    expect(result.current.session.runStepIndex).toBe(2)

    act(() => result.current.edit("# Study tools"))
    act(() => result.current.check())
    act(() => result.current.next())
    expect(result.current.session.phase).toBe("complete")
  })

  it("starts deterministic different content for Practice again", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.start("challenge"))
    expect(result.current.problem.id).toBe("heading-study-tools")

    act(() => result.current.practiceAgain())

    expect(result.current.session.entryId).toBe("challenge")
    expect(result.current.session.runNumber).toBe(1)
    expect(result.current.problem.id).toBe("heading-apple")
    expect(result.current.session.draft).toBe("")
  })

  it("resets to the chosen entry's original run for Start over", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.start("challenge"))
    act(() => result.current.practiceAgain())
    act(() => result.current.edit("draft from replay"))
    act(() => result.current.startOver())

    expect(result.current.session.entryId).toBe("challenge")
    expect(result.current.session.runNumber).toBe(0)
    expect(result.current.problem.id).toBe("heading-study-tools")
    expect(result.current.session.draft).toBe("")
    expect(result.current.session.runStepIndex).toBe(0)
  })

  it("clears the run and returns to entry selection for Change level", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.start("basics"))
    act(() => result.current.edit("# Rainy day"))
    act(() => result.current.changeLevel())

    expect(result.current.session.entryId).toBeNull()
    expect(result.current.session.runProblemIds).toEqual([])
    expect(result.current.session.progress.draftByProblemId).toEqual({})
  })

  it("auto-opens Help only at the start of a Level 1 run", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.start("level-1"))
    expect(result.current.session.coach).toBe("hint")
    expect(result.current.session.teachingMode).toBe("introduce")

    act(() => result.current.practiceAgain())
    expect(result.current.problem.id).toBe("heading-rainy-day")
    expect(result.current.session.coach).toBe("hint")
    expect(result.current.session.teachingMode).toBe("introduce")

    act(() => result.current.start("basics"))
    expect(result.current.session.coach).toBe("closed")
    expect(result.current.session.teachingMode).toBe("recall")
  })

  it("continues the run after one transfer without chaining another transfer", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.start("level-1"))
    act(() => result.current.edit("#Apple"))
    act(() => result.current.check())
    act(() => result.current.edit("# Apple"))
    act(() => result.current.check())
    act(() => result.current.next())
    expect(result.current.problem.id).toBe("heading-rainy-day")
    expect(result.current.session.currentIsTransfer).toBe(true)

    act(() => result.current.edit("#Rainy day"))
    act(() => result.current.check())
    act(() => result.current.edit("# Rainy day"))
    act(() => result.current.check())
    act(() => result.current.next())

    expect(result.current.session.phase).toBe("editing")
    expect(result.current.problem.id).toBe("heading-study-tools")
    expect(result.current.session.currentIsTransfer).toBe(false)
    expect(result.current.session.runStepIndex).toBe(2)
  })

  it("appends a finishable transfer step after a failure on the last run step", async () => {
    const storage = new MemoryStorage()
    const firstHook = renderHook(() => useLearningSession(storage))
    const { result } = firstHook

    act(() => result.current.start("challenge"))
    for (const answer of ["# Study tools", "# Apple"]) {
      act(() => result.current.edit(answer))
      act(() => result.current.check())
      act(() => result.current.next())
    }

    act(() => result.current.edit("#Rainy day"))
    act(() => result.current.check())
    act(() => result.current.edit("# Rainy day"))
    act(() => result.current.check())
    act(() => result.current.next())

    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.session.runStepIndex).toBe(3)
    expect(result.current.session.runProblemIds).toHaveLength(4)
    expect(result.current.session.runProblemIds[3]).toBe(
      result.current.problem.id,
    )
    expect(result.current.session.draft).toBe("")

    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain(
        result.current.problem.id,
      )
    })
    firstHook.unmount()
    const restored = renderHook(() => useLearningSession(storage))
    expect(restored.result.current.session.phase).toBe("editing")
    expect(restored.result.current.session.currentIsTransfer).toBe(true)
  })

  it("opens the introduced Apple problem with an empty draft", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    expect(result.current.problem.id).toBe("heading-apple")
    expect(result.current.session.draft).toBe("")
    expect(result.current.session.coach).toBe("hint")
    expect(result.current.session.needsTransfer).toBe(false)
    expect(result.current.canNext).toBe(false)
  })

  it("persists the selected entry, progress, and draft in a new hook", async () => {
    const storage = new MemoryStorage()
    const firstHook = renderHook(() => useLearningSession(storage))

    act(() => firstHook.result.current.start("basics"))
    act(() => firstHook.result.current.edit("#Rainy day"))

    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain("#Rainy day")
    })

    firstHook.unmount()
    const restoredHook = renderHook(() => useLearningSession(storage))

    expect(restoredHook.result.current.session.entryId).toBe("basics")
    expect(restoredHook.result.current.problem.id).toBe("heading-rainy-day")
    expect(restoredHook.result.current.session.runStepIndex).toBe(0)
    expect(restoredHook.result.current.session.draft).toBe("#Rainy day")
  })

  it("starts with volatile progress when sessionStorage access throws", () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      window,
      "sessionStorage",
    )
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError")
      },
    })

    try {
      const { result } = renderHook(() => useLearningSession())

      expect(result.current.problem.id).toBe("heading-apple")
      act(() => result.current.edit("# Apple"))
      expect(result.current.session.draft).toBe("# Apple")
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "sessionStorage", descriptor)
      }
    }
  })

  it("selects a different transfer problem after a repaired failure", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.edit("#Apple"))
    act(() => result.current.check())
    expect(result.current.session.evaluation?.status).toBe("fail")
    expect(result.current.canNext).toBe(false)

    act(() => result.current.edit("# Apple"))
    act(() => result.current.check())
    expect(result.current.canNext).toBe(true)

    act(() => result.current.next())
    expect(result.current.problem.id).toBe("heading-rainy-day")
    expect(result.current.session.draft).toBe("")
    expect(result.current.session.currentIsTransfer).toBe(true)
  })

  it("selects a different transfer problem after recall Help is used", () => {
    const storage = new MemoryStorage()
    saveProgress(storage, createDefaultProgress("heading-rainy-day"))
    const { result } = renderHook(() => useLearningSession(storage))

    expect(result.current.session.coach).toBe("closed")
    act(() => result.current.requestHint())
    expect(result.current.session.needsTransfer).toBe(true)

    act(() => result.current.edit("# Rainy day"))
    act(() => result.current.check())
    act(() => result.current.next())

    expect(result.current.problem.id).not.toBe("heading-rainy-day")
    expect(result.current.session.currentIsTransfer).toBe(true)
  })

  it("keeps an empty draft checkable so feedback can provide a start", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    expect(result.current.session.draft).toBe("")
    expect(result.current.canCheck).toBe(true)
  })
})
