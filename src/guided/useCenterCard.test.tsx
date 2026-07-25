import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getProblem } from "../content/problemBank"
import {
  resetCenterCardMemoryForTests,
  useCenterCard,
} from "./useCenterCard"

type HintAwareCard = ReturnType<typeof useCenterCard> & {
  hintOpen?: boolean
  hintRows?: readonly { input: string; source: string }[]
  focusRequest?: number
  openHint?: () => void
  closeHint?: () => void
  toggleHint?: () => void
}

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
  it("clears partial marks and requests first-box focus when Hint opens", () => {
    const { result } = renderItalicCard()
    act(() => result.current.editSegment(0, "*"))
    const before = result.current as HintAwareCard
    const previousFocusRequest = before.focusRequest ?? 0

    expect(before.openHint).toBeTypeOf("function")
    act(() => before.openHint!())

    const current = result.current as HintAwareCard
    expect(current.segmentValues).toEqual(["", ""])
    expect(current.hintOpen).toBe(true)
    expect(current.focusRequest).toBeGreaterThan(previousFocusRequest)
  })

  it("opens the exact Hint after a wrong non-empty answer and records one miss", () => {
    const { result, onMiss } = renderItalicCard()
    act(() => result.current.editSegment(0, "@"))
    act(() => result.current.submit())

    const current = result.current as HintAwareCard
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

    const current = result.current as HintAwareCard
    expect(current.hintOpen).toBe(true)
    expect(current.segmentValues).toEqual(["", ""])
    expect(onMiss).not.toHaveBeenCalled()
  })

  it("keeps Hint open while the learner retries", () => {
    const { result } = renderItalicCard()
    act(() => result.current.submit())
    act(() => result.current.editSegment(0, "_"))

    expect((result.current as HintAwareCard).hintOpen).toBe(true)
  })

  it("toggles and closes the same inline Hint", () => {
    const { result } = renderItalicCard()
    const initial = result.current as HintAwareCard
    expect(initial.toggleHint).toBeTypeOf("function")
    expect(initial.closeHint).toBeTypeOf("function")

    act(() => initial.toggleHint!())
    expect((result.current as HintAwareCard).hintOpen).toBe(true)
    act(() => (result.current as HintAwareCard).closeHint!())
    expect((result.current as HintAwareCard).hintOpen).toBe(false)
  })

  it("accepts either standard italic delimiter and grows that exact source", () => {
    const { result, onComplete } = renderItalicCard()
    act(() => result.current.editSegment(0, "_"))
    act(() => result.current.editSegment(1, "_"))
    act(() => result.current.submit())

    expect(onComplete).toHaveBeenCalledWith("_Paper boat_")
  })
})
