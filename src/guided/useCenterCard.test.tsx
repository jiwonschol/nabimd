import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getProblem } from "../content/problemBank"
import {
  resetCenterCardMemoryForTests,
  useCenterCard,
} from "./useCenterCard"

function renderItalicCard() {
  const onGrow = vi.fn()
  const onComplete = vi.fn()
  const onMiss = vi.fn()
  const hook = renderHook(() =>
    useCenterCard({
      problem: getProblem("l1-italic-paper-boat"),
      draft: "",
      completed: false,
      onGrow,
      onComplete,
      onMiss,
    }),
  )

  return { ...hook, onGrow, onComplete, onMiss }
}

beforeEach(() => {
  resetCenterCardMemoryForTests()
})

describe("useCenterCard Hint and retry state", () => {
  it("restores an exact Hint when the persisted session says retry is pending", () => {
    const onGrow = vi.fn()
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useCenterCard({
        problem: getProblem("l1-italic-paper-boat"),
        draft: "",
        completed: false,
        onGrow,
        onComplete,
        retryPending: true,
      }),
    )

    expect(result.current.verdict).toBe("retry")
    expect(result.current.hintOpen).toBe(true)
    expect(result.current.hintRows).toEqual([
      { input: "**", source: "*Paper boat*" },
      { input: "__", source: "_Paper boat_" },
    ])
  })

  it("does not carry a persisted retry Hint into the next syntax slot", () => {
    const { result } = renderHook(() =>
      useCenterCard({
        problem: getProblem("l1-nested-bullets-lunch-tray"),
        draft: "",
        completed: false,
        onGrow: vi.fn(),
        onComplete: vi.fn(),
        retryPending: true,
      }),
    )

    act(() => result.current.editSegment(0, "- "))
    act(() => result.current.submit())

    expect(result.current.slotIndex).toBe(1)
    expect(result.current.verdict).toBe("idle")
    expect(result.current.hintOpen).toBe(false)
  })

  it("clears partial marks and requests first-box focus when Hint opens", () => {
    const { result } = renderItalicCard()
    act(() => result.current.editSegment(0, "*"))
    const previousFocusRequest = result.current.focusRequest

    act(() => result.current.openHint())

    const current = result.current
    expect(current.segmentValues).toEqual(["", ""])
    expect(current.hintOpen).toBe(true)
    expect(current.focusRequest).toBeGreaterThan(previousFocusRequest)
  })

  it("opens the exact Hint after a wrong non-empty answer and records one miss", () => {
    const { result, onMiss } = renderItalicCard()
    act(() => result.current.editSegment(0, "@"))
    act(() => result.current.submit())

    const current = result.current
    expect(current.segmentValues).toEqual(["", ""])
    expect(current.hintOpen).toBe(true)
    expect(current.hintRows).toEqual([
      { input: "**", source: "*Paper boat*" },
      { input: "__", source: "_Paper boat_" },
    ])
    expect(onMiss).toHaveBeenCalledTimes(1)
  })

  it("opens Hint without recording a miss when Enter is empty", () => {
    const { result, onMiss } = renderItalicCard()
    act(() => result.current.submit())

    const current = result.current
    expect(current.hintOpen).toBe(true)
    expect(current.segmentValues).toEqual(["", ""])
    expect(onMiss).not.toHaveBeenCalled()
  })

  it("keeps Hint open while the learner retries", () => {
    const { result } = renderItalicCard()
    act(() => result.current.submit())
    act(() => result.current.editSegment(0, "_"))

    expect(result.current.hintOpen).toBe(true)
  })

  it("toggles and closes the same inline Hint", () => {
    const { result } = renderItalicCard()
    act(() => result.current.toggleHint())
    expect(result.current.hintOpen).toBe(true)
    act(() => result.current.closeHint())
    expect(result.current.hintOpen).toBe(false)
  })

  it("requests syntax-box focus when the inline Hint closes", () => {
    const { result } = renderItalicCard()
    act(() => result.current.openHint())
    const previousFocusRequest = result.current.focusRequest

    act(() => result.current.closeHint())

    expect(result.current.hintOpen).toBe(false)
    expect(result.current.focusRequest).toBeGreaterThan(previousFocusRequest)
  })

  it("accepts either standard italic delimiter and grows that exact source", () => {
    const { result, onComplete } = renderItalicCard()
    act(() => result.current.editSegment(0, "_"))
    act(() => result.current.editSegment(1, "_"))
    act(() => result.current.submit())

    expect(onComplete).toHaveBeenCalledWith("_Paper boat_")
  })

  it("resubmits a fully grown final card so an interrupted completion can recover", () => {
    const { result, onComplete } = renderItalicCard()
    act(() => result.current.editSegment(0, "*"))
    act(() => result.current.editSegment(1, "*"))
    act(() => result.current.submit())
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => result.current.submit())

    expect(onComplete).toHaveBeenCalledTimes(2)
    expect(onComplete).toHaveBeenLastCalledWith("*Paper boat*")
  })
})
