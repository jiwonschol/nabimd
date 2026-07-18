import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ExerciseTopBar } from "./ExerciseTopBar"

function renderTopBar(
  phase: "editing" | "complete",
  onToggleHint = vi.fn(),
) {
  render(
    <ExerciseTopBar
      canCheck
      entryId="level-1"
      evaluation={null}
      hadFailure={false}
      hintOpen={false}
      onCheck={vi.fn()}
      onExit={vi.fn()}
      onNext={vi.fn()}
      onToggleHint={onToggleHint}
      onTryAnother={vi.fn()}
      phase={phase}
      problemPosition={1}
      runLength={3}
    />,
  )
  return onToggleHint
}

describe("ExerciseTopBar", () => {
  it("toggles Hint with ? only during an active exercise", () => {
    const activeToggle = renderTopBar("editing")
    fireEvent.keyDown(document, { key: "?" })
    expect(activeToggle).toHaveBeenCalledTimes(1)
  })

  it("does not create hidden Hint state after completion", () => {
    const completedToggle = renderTopBar("complete")
    fireEvent.keyDown(document, { key: "?" })
    expect(completedToggle).not.toHaveBeenCalled()
  })
})
