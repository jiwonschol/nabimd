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

  it("persists a draft and restores it in a new hook", async () => {
    const storage = new MemoryStorage()
    const firstHook = renderHook(() => useLearningSession(storage))

    act(() => firstHook.result.current.edit("#Apple"))

    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain("#Apple")
    })

    firstHook.unmount()
    const restoredHook = renderHook(() => useLearningSession(storage))

    expect(restoredHook.result.current.session.draft).toBe("#Apple")
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
