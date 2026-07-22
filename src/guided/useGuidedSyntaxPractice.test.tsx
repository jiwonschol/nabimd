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

  it("accepts underscore delimiters for an italic checkpoint and preserves them in the draft", () => {
    const italicProblem = {
      id: "guided-italic-test",
      target: "*Quiet music*",
      starterText: "Quiet music",
    }
    const onChange = vi.fn()
    const onCheck = vi.fn()
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: italicProblem.starterText,
        onChange,
        onCheck,
        problem: italicProblem,
      }),
    )

    act(() => result.current.submit("__"))

    expect(onChange).toHaveBeenLastCalledWith("_Quiet music_")
    expect(onCheck).toHaveBeenCalledWith("_Quiet music_")
    expect(result.current.completed).toBe(true)
  })

  it.each([
    ["strong", "**Important**", "Important", "____", "__Important__"],
    ["thematic break", "Before\n\n---\n\nAfter", "Before\n\n\n\nAfter", "***", "Before\n\n***\n\nAfter"],
    ["code fence", "```\nhello\n```", "\nhello\n", "~~~~~~", "~~~\nhello\n~~~"],
  ] as const)("accepts and preserves the equivalent %s form", (_name, target, starterText, input, expected) => {
    const alternateProblem = {
      id: `guided-${_name}`,
      target,
      starterText,
    }
    const onCheck = vi.fn()
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: starterText,
        onChange: vi.fn(),
        onCheck,
        problem: alternateProblem,
      }),
    )

    act(() => result.current.submit(input))

    expect(onCheck).toHaveBeenCalledWith(expected)
    expect(result.current.completed).toBe(true)
  })

  it("keeps a valid list structure when equivalent bullet markers are mixed", () => {
    const listProblem = {
      id: "guided-list-test",
      target: "- Pens\n- Paper\n- Glue",
      starterText: "Pens\nPaper\nGlue",
    }
    const onCheck = vi.fn()
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: listProblem.starterText,
        onChange: vi.fn(),
        onCheck,
        problem: listProblem,
      }),
    )

    act(() => result.current.submit("* "))
    act(() => result.current.submit("+ "))
    act(() => result.current.submit("- "))

    expect(onCheck).toHaveBeenCalledWith("* Pens\n* Paper\n* Glue")
    expect(result.current.completed).toBe(true)
  })

  it("restores a completed draft that uses equivalent Markdown markers", () => {
    const italicProblem = {
      id: "guided-italic-restore-test",
      target: "*Quiet music*",
      starterText: "Quiet music",
    }
    const { result } = renderHook(() =>
      useGuidedSyntaxPractice({
        draft: "_Quiet music_",
        onChange: vi.fn(),
        onCheck: vi.fn(),
        problem: italicProblem,
      }),
    )

    expect(result.current.draft).toBe("_Quiet music_")
    expect(result.current.completed).toBe(true)
    expect(result.current.canGoForward).toBe(false)
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
