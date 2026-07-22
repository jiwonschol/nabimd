import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildGuidedDraft, deriveSyntaxCheckpoints } from "./guidedSyntax"
import { useGuidedSyntaxPractice } from "./useGuidedSyntaxPractice"

const problem = {
  id: "guided-heading-test",
  target: "# Title\n\n## Next steps",
  starterText: "Title\n\nNext steps",
}

describe("useGuidedSyntaxPractice", () => {
  beforeEach(() => {
    window.history.replaceState(
      {
        marker: "nabimd-practice-v1",
        view: "practice",
        snapshot: { currentProblemId: problem.id },
      },
      "",
    )
  })

  it("progressively builds the source and checks the exact target on the final Enter", () => {
    const onChange = vi.fn()
    const onCheck = vi.fn()
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: problem.starterText,
        onChange,
        onCheck,
        problem,
      }),
    )

    expect(result.current.draft).toBe("")
    expect(result.current.currentIndex).toBe(0)

    act(() => result.current.setValue("# "))
    act(() => result.current.submit("# "))

    expect(onChange).toHaveBeenLastCalledWith("# Title\n\n")
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.canGoBack).toBe(true)
    expect(onCheck).not.toHaveBeenCalled()

    act(() => result.current.setValue("## "))
    act(() => result.current.submit("## "))

    expect(onChange).toHaveBeenLastCalledWith(problem.target)
    expect(onCheck).toHaveBeenCalledWith(problem.target)
    expect(result.current.completed).toBe(true)
  })

  it("keeps an incorrect answer in place and calls attention to Hint after two attempts", () => {
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: problem.starterText,
        onChange: vi.fn(),
        onCheck: vi.fn(),
        problem,
      }),
    )

    act(() => result.current.submit("## "))
    act(() => result.current.submit("## "))

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.attempts).toBe(2)
    expect(result.current.value).toBe("##")
  })

  it("restores a visited checkpoint from browser history without undoing the built draft", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: problem.starterText,
        onChange,
        onCheck: vi.fn(),
        problem,
      }),
    )

    act(() => result.current.submit("# "))
    const builtDraft = result.current.draft
    const practiceState = window.history.state as Record<string, unknown>

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: {
            ...practiceState,
            guidedSyntax: {
              marker: "nabimd-guided-syntax-v1",
              problemId: problem.id,
              index: 0,
            },
          },
        }),
      )
    })

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.canGoForward).toBe(true)
    expect(result.current.draft).toBe(builtDraft)
  })

  it("preserves a learner-authored manual draft across restoration", () => {
    const savedDraft = "# Saved draft"
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: savedDraft,
        onChange: vi.fn(),
        onCheck: vi.fn(),
        problem,
      }),
    )

    expect(result.current.draft).toBe(savedDraft)
    expect(result.current.currentIndex).toBe(0)
  })

  it("does not expose browser Back when a partial draft was restored without checkpoint history", () => {
    const checkpoints = deriveSyntaxCheckpoints(problem.target, "")
    const partialDraft = buildGuidedDraft(problem.target, checkpoints, 1)
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: partialDraft,
        onChange: vi.fn(),
        onCheck: vi.fn(),
        problem,
      }),
    )

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.canGoBack).toBe(false)
  })

  it("does not expose browser Forward after restoring a completed draft", () => {
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: problem.target,
        onChange: vi.fn(),
        onCheck: vi.fn(),
        problem,
      }),
    )

    expect(result.current.completed).toBe(true)
    expect(result.current.canGoForward).toBe(false)
  })
})
