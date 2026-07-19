import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  __resetFeedbackSoundForTesting,
  setSoundMuted,
} from "../sound/feedbackSound"
import { ExerciseTopBar } from "./ExerciseTopBar"

function renderTopBar(
  phase: "editing" | "complete",
  onToggleHint = vi.fn(),
  overrides: Partial<ComponentProps<typeof ExerciseTopBar>> = {},
) {
  render(
    <ExerciseTopBar
      canCheck
      entryId="level-1"
      evaluation={null}
      hadFailure={false}
      hintOpen={false}
      currentIsTransfer={false}
      onCheck={vi.fn()}
      onExit={vi.fn()}
      onNext={vi.fn()}
      onToggleHint={onToggleHint}
      onTryAnother={vi.fn()}
      phase={phase}
      problemPosition={1}
      runCompletedAtMs={null}
      runLength={6}
      runStartedAtMs={1_000}
      scheduledRunLength={6}
      scheduledStepIndex={0}
      {...overrides}
    />,
  )
  return onToggleHint
}

describe("ExerciseTopBar", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
  })

  afterEach(() => {
    __resetFeedbackSoundForTesting()
    vi.restoreAllMocks()
  })

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

  it("does not toggle Hint while typing a question mark", () => {
    const activeToggle = renderTopBar("editing")
    const input = document.createElement("input")
    document.body.append(input)

    fireEvent.keyDown(input, { key: "?" })

    expect(activeToggle).not.toHaveBeenCalled()
    input.remove()
  })

  it("prevents the browser action for a handled Hint shortcut", () => {
    const activeToggle = renderTopBar("editing")
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "?",
    })

    document.dispatchEvent(event)

    expect(activeToggle).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it("reflects and toggles the persisted sound preference", () => {
    setSoundMuted(true)
    renderTopBar("editing")

    const soundToggle = screen.getByRole("button", {
      name: "Mute feedback sounds",
    })

    expect(soundToggle).toHaveTextContent("Muted")
    fireEvent.click(soundToggle)

    expect(soundToggle).toHaveTextContent("Sound on")
    expect(window.localStorage.getItem("nabimd.sound-muted")).toBe("false")
  })

  it("renders scheduled steps separately from repair practice", () => {
    renderTopBar("editing", vi.fn(), {
      currentIsTransfer: true,
      problemPosition: 2,
      runLength: 7,
      scheduledStepIndex: 0,
    })

    expect(screen.getAllByRole("listitem", { name: /Step/ })).toHaveLength(6)
    expect(screen.getByRole("listitem", { name: "Step 1, current" })).toHaveAttribute(
      "aria-current",
      "step",
    )
    expect(screen.getByText("1 of 6")).toBeVisible()
    expect(screen.getByText("Repair practice")).toBeVisible()
    expect(screen.getByText("Exercise 2 of 7")).toBeVisible()
  })
})
