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
  overrides: Partial<ComponentProps<typeof ExerciseTopBar>> = {},
) {
  render(
    <ExerciseTopBar
      canCheck
      entryId="level-1"
      evaluation={null}
      currentIsTransfer={false}
      onCheck={vi.fn()}
      onExit={vi.fn()}
      onNext={vi.fn()}
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

  it("keeps Hint with the answer page rather than duplicating it in the top bar", () => {
    renderTopBar("editing")

    expect(screen.queryByRole("button", { name: "Hint" })).toBeNull()
  })

  it("reflects and toggles the persisted sound preference", () => {
    setSoundMuted(true)
    renderTopBar("editing")

    const soundToggle = screen.getByRole("button", { name: "Turn sound on" })

    expect(soundToggle).toHaveAttribute("aria-pressed", "true")
    expect(soundToggle).toHaveAttribute("data-tooltip", "Turn sound on")
    fireEvent.click(soundToggle)

    expect(soundToggle).toHaveAccessibleName("Mute sound")
    expect(soundToggle).toHaveAttribute("data-tooltip", "Mute sound")
    expect(soundToggle).toHaveAttribute("aria-pressed", "false")
    expect(window.localStorage.getItem("nabimd.sound-muted")).toBe("false")
  })

  it("renders scheduled steps separately from repair practice", () => {
    renderTopBar("editing", {
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
    expect(screen.queryByText("1 of 6")).toBeNull()
    const progress = screen.getByRole("progressbar")
    expect(progress).toHaveAccessibleName("Practice progress, 1 of 6")
    expect(progress).toHaveAttribute("aria-valuenow", "1")
    expect(progress).toHaveAttribute("aria-valuemax", "6")
    expect(progress).not.toContainElement(
      screen.getByRole("button", { name: "Mute sound" }),
    )
    expect(screen.getByText("Repair practice")).toBeVisible()
    expect(screen.getByText("Exercise 2 of 7")).toBeVisible()
  })

  it("places compact level progress between sound and Try another", () => {
    renderTopBar("editing")

    const sound = screen.getByRole("button", { name: "Mute sound" })
    const progress = screen.getByRole("group", { name: "Practice details" })
    const tryAnother = screen.getByRole("button", { name: "Try another" })
    const rightPage = sound.closest(".exercise-topbar__page--right")

    expect(progress).toHaveTextContent("Level 1")
    expect(progress).not.toHaveTextContent("Learn the syntax")
    expect(rightPage).toContainElement(progress)
    expect(sound.closest(".exercise-topbar__time")?.nextElementSibling).toBe(
      progress,
    )
    expect(progress.nextElementSibling).toContainElement(tryAnother)
  })

  it("lets the focused Next keycap advance with Space, Enter, or the shared shortcut", () => {
    const onNext = vi.fn()
    renderTopBar("editing", {
      evaluation: { status: "matched", reviewItems: [] },
      onNext,
    })
    const next = screen.getByRole("button", { name: "Next exercise" })

    expect(next).toHaveAttribute("aria-keyshortcuts", expect.stringContaining("Control+Enter"))
    expect(next).not.toHaveTextContent("Space / Enter")

    fireEvent.keyDown(next, { key: " " })
    fireEvent.keyDown(next, { key: "Enter" })
    expect(onNext).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(next, { key: "Enter", ctrlKey: true })
    expect(onNext).toHaveBeenCalledTimes(3)

    fireEvent.keyDown(next, { key: "Enter", repeat: true })
    fireEvent.keyDown(next, { key: " ", repeat: true })
    expect(onNext).toHaveBeenCalledTimes(3)
  })

  it("names the primary keycap by action without shortcut copy", () => {
    renderTopBar("editing")

    const check = screen.getByRole("button", { name: "Check answer" })
    expect(check).toHaveAttribute("data-tooltip", "Check answer")
    expect(screen.getByRole("button", { name: "Try another" })).toHaveAttribute(
      "data-tooltip",
      "Try another",
    )
    expect(check).not.toHaveTextContent("Control")
    expect(check).not.toHaveTextContent("Check")
  })

  it("waits for deliberate pointer movement before showing the Summary Home tooltip", () => {
    renderTopBar("complete")
    const home = screen.getByRole("button", { name: "Home" })

    expect(home).not.toHaveAttribute("data-tooltip")
    fireEvent.pointerMove(window)
    expect(home).toHaveAttribute("data-tooltip", "Home")
  })
})
