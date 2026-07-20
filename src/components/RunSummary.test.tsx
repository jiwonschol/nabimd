import { render, screen } from "@testing-library/react"
import { StrictMode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { playFeedbackSound } from "../sound/feedbackSound"
import { RunSummary } from "./RunSummary"

vi.mock("../sound/feedbackSound", () => ({
  playFeedbackSound: vi.fn(),
}))

function renderSummary(failedProblemIds: string[] = []) {
  render(
    <RunSummary
      elapsedMs={65_000}
      failedProblemIds={failedProblemIds}
      onChangeLevel={vi.fn()}
      onPracticeAgain={vi.fn()}
      score={failedProblemIds.length ? 6 - failedProblemIds.length : 6}
      total={6}
    />,
  )
}

describe("RunSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("closes a clean run with one primary next action", () => {
    renderSummary()

    expect(screen.getByRole("heading", { name: "Well done." })).toBeVisible()
    expect(
      screen.getByText("You kept every Markdown pattern intact."),
    ).toBeVisible()
    expect(screen.getByLabelText("Score")).toHaveTextContent("6 / 6")
    expect(screen.getByLabelText("Total time")).toHaveTextContent("01:05")
    expect(screen.getByText("Nothing to revisit this time.")).toBeVisible()
    expect(screen.getByRole("button", { name: "Practice again" })).toHaveFocus()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()
    expect(screen.queryByText(/standing|percentile|collecting data/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Start over" })).not.toBeInTheDocument()
    expect(playFeedbackSound).toHaveBeenCalledWith("summary")
  })

  it("turns one failed family into one concise teacher note", () => {
    renderSummary(["l1-blockquote-milk-in-fridge"])

    expect(screen.getByRole("heading", { name: "Good finish." })).toBeVisible()
    expect(screen.getByText("One thing to revisit")).toBeVisible()
    expect(screen.getByRole("heading", { name: "Try block quotes once more." })).toBeVisible()
    expect(screen.getByText("> Keep this note")).toBeVisible()
    expect(
      screen.getByText("Start the line with a greater-than sign, a space, then the words."),
    ).toBeVisible()
    expect(screen.getAllByRole("listitem", { name: /Syntax reminder/ })).toHaveLength(1)
  })

  it("groups repeated failures and keeps a longer review concise", () => {
    renderSummary([
      "l1-heading-apple",
      "l1-heading-rainy-day",
      "l1-blockquote-milk-in-fridge",
      "l1-list-pencil-case",
      "l1-order-plant-seed",
    ])

    expect(screen.getByText("A few marks to revisit")).toBeVisible()
    expect(screen.getAllByRole("listitem", { name: /Syntax reminder/ })).toHaveLength(3)
    expect(screen.getByText("A quick second round will make these marks easier to recall."))
      .toBeVisible()
  })

  it("plays the completion cue once during StrictMode effect verification", () => {
    render(
      <StrictMode>
        <RunSummary
          elapsedMs={12_000}
          failedProblemIds={[]}
          onChangeLevel={vi.fn()}
          onPracticeAgain={vi.fn()}
          score={6}
          total={6}
        />
      </StrictMode>,
    )

    expect(playFeedbackSound).toHaveBeenCalledOnce()
    expect(playFeedbackSound).toHaveBeenCalledWith("summary")
  })
})
