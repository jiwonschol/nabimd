import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PROGRESS_STORAGE_KEY } from "../progress/progressStore"
import { MemoryStorage } from "../test/MemoryStorage"
import { useLearningSession } from "./useLearningSession"

describe("useLearningSession", () => {
  it("opens the first heading problem with its starter text", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    expect(result.current.problem.id).toBe("heading-project-notes")
    expect(result.current.session.draft).toBe("Project notes")
    expect(result.current.canNext).toBe(false)
  })

  it("persists a draft and restores it in a new hook", async () => {
    const storage = new MemoryStorage()
    const firstHook = renderHook(() => useLearningSession(storage))

    act(() => firstHook.result.current.edit("#Project notes"))

    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain("#Project notes")
    })

    firstHook.unmount()
    const restoredHook = renderHook(() => useLearningSession(storage))

    expect(restoredHook.result.current.session.draft).toBe("#Project notes")
  })

  it("checks explicitly and selects a different transfer problem after repair", () => {
    const { result } = renderHook(() =>
      useLearningSession(new MemoryStorage()),
    )

    act(() => result.current.edit("#Project notes"))
    act(() => result.current.check())
    expect(result.current.session.evaluation?.status).toBe("fail")
    expect(result.current.canNext).toBe(false)

    act(() => result.current.edit("# Project notes"))
    act(() => result.current.check())
    expect(result.current.canNext).toBe(true)

    act(() => result.current.next())
    expect(result.current.problem.id).toBe("heading-weekend-guide")
    expect(result.current.session.currentIsTransfer).toBe(true)
  })
})
