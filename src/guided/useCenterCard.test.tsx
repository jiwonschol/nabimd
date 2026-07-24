import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getProblem } from "../content/problemBank"
import { buildGuidedDraft, deriveSyntaxCheckpoints } from "./guidedSyntax"
import { resetCenterCardMemoryForTests, useCenterCard } from "./useCenterCard"

vi.mock("../sound/feedbackSound", () => ({
  playFeedbackSound: vi.fn(),
}))

afterEach(() => {
  resetCenterCardMemoryForTests()
})

describe("useCenterCard", () => {
  it("ignores remembered completed progress when the current draft is blank", () => {
    const problem = getProblem("l1-blockquote-book-by-lamp")
    const checkpoints = deriveSyntaxCheckpoints(
      problem.target,
      problem.starterText,
    )
    const finishedDraft = buildGuidedDraft(
      problem.target,
      checkpoints,
      checkpoints.length,
    )
    const callbacks = {
      onGrow: vi.fn(),
      onComplete: vi.fn(),
      onMiss: vi.fn(),
    }

    const completedHook = renderHook(() =>
      useCenterCard({
        problem,
        draft: finishedDraft,
        completed: true,
        ...callbacks,
      }),
    )

    expect(completedHook.result.current.done).toBe(true)
    completedHook.unmount()

    const freshHook = renderHook(() =>
      useCenterCard({
        problem,
        draft: "",
        completed: false,
        ...callbacks,
      }),
    )

    expect(freshHook.result.current.done).toBe(false)
    expect(freshHook.result.current.slotIndex).toBe(0)
    expect(freshHook.result.current.checkpoint?.id).toBe(checkpoints[0]?.id)
  })

  it("keeps accepted alternate marks only while they still match the current draft", () => {
    const problem = getProblem("l1-list-art-box")
    const checkpoints = deriveSyntaxCheckpoints(
      problem.target,
      problem.starterText,
    )
    const callbacks = {
      onGrow: vi.fn(),
      onComplete: vi.fn(),
      onMiss: vi.fn(),
    }

    let draft = ""
    const { result, rerender } = renderHook(() =>
      useCenterCard({
        problem,
        draft,
        completed: false,
        ...callbacks,
        onGrow: (nextDraft) => {
          draft = nextDraft
          callbacks.onGrow(nextDraft)
        },
      }),
    )

    act(() => {
      result.current.editSegment(0, "* ")
    })
    act(() => {
      result.current.submit()
    })
    rerender()

    expect(result.current.frontierIndex).toBe(1)
    expect(callbacks.onGrow).toHaveBeenLastCalledWith(
      buildGuidedDraft(problem.target, checkpoints, 1, {
        [checkpoints[0]!.id]: "* ",
      }),
    )

    draft = ""
    rerender()

    expect(result.current.frontierIndex).toBe(0)
    expect(result.current.checkpoint?.id).toBe(checkpoints[0]?.id)
  })
})
