import { fireEvent, render, screen } from "@testing-library/react"
import { StrictMode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { problemBank } from "../content/problemBank"
import { evaluateProblem } from "../engine/evaluateProblem"
import type { Evaluation, MatchFailure } from "../engine/types"
import { buildReviewCorrections } from "../feedback/reviewCorrections"
import { playFeedbackSound } from "../sound/feedbackSound"
import { VerdictNotice } from "./VerdictNotice"

vi.mock("../sound/feedbackSound", () => ({
  playFeedbackSound: vi.fn(),
}))

const problem = problemBank[0]!

// The D17 starter is the Goal's prose with every mark removed, so checking it
// is guaranteed to fail with real engine diagnostics.
function failedEvaluation(): MatchFailure {
  const evaluation = evaluateProblem(problem, problem.starterText)
  if (evaluation.status !== "fail") {
    throw new Error("Expected the starter text to fail its own problem")
  }
  return evaluation
}

const matchedEvaluation: Evaluation = {
  status: "matched",
  reviewItems: [],
}

function renderNotice(
  evaluation: Evaluation | null,
  phase: "editing" | "evaluated" | "complete" = "evaluated",
) {
  return (
    <VerdictNotice
      draft={problem.starterText}
      evaluation={evaluation}
      phase={phase}
      problem={problem}
    />
  )
}

describe("VerdictNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("plays the retry and matched cues for their verdict transitions", () => {
    const { rerender } = render(renderNotice(null))

    rerender(renderNotice(failedEvaluation()))
    rerender(renderNotice(null))
    rerender(renderNotice(matchedEvaluation))

    expect(playFeedbackSound).toHaveBeenNthCalledWith(1, "retry")
    expect(playFeedbackSound).toHaveBeenNthCalledWith(2, "matched")
  })

  it("does not replay when a matched evaluation is replaced by another match", () => {
    const { rerender } = render(renderNotice(null))

    rerender(renderNotice(matchedEvaluation))
    rerender(renderNotice({ status: "matched", reviewItems: [] }))

    expect(playFeedbackSound).toHaveBeenCalledTimes(1)
    expect(playFeedbackSound).toHaveBeenCalledWith("matched")
  })

  it("plays Try again for every failed Check, even when status stays failed", () => {
    const { rerender } = render(renderNotice(failedEvaluation()))

    rerender(renderNotice(failedEvaluation()))

    expect(playFeedbackSound).toHaveBeenCalledTimes(2)
    expect(playFeedbackSound).toHaveBeenNthCalledWith(1, "retry")
    expect(playFeedbackSound).toHaveBeenNthCalledWith(2, "retry")
  })

  it("does not replay Try again during StrictMode effect verification", () => {
    render(<StrictMode>{renderNotice(failedEvaluation())}</StrictMode>)

    expect(playFeedbackSound).toHaveBeenCalledOnce()
    expect(playFeedbackSound).toHaveBeenCalledWith("retry")
  })

  it("holds the failed verdict with the top pinpointed correction", () => {
    const evaluation = failedEvaluation()
    render(renderNotice(evaluation))

    const notice = screen.getByRole("status")
    expect(notice).toHaveTextContent("Try again")
    const correction = buildReviewCorrections(
      problem,
      evaluation,
      problem.starterText,
    )[0]!
    expect(notice).toHaveTextContent(correction.label)
    expect(notice).toHaveTextContent(correction.repairInstruction)
  })

  it("hides the failed verdict once the learner is editing again", () => {
    const evaluation = failedEvaluation()
    const { rerender } = render(renderNotice(evaluation))
    expect(screen.getByRole("status")).toBeVisible()

    rerender(renderNotice(evaluation, "editing"))
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("dismisses with Escape and reopens for the next failed Check", () => {
    const { rerender } = render(renderNotice(failedEvaluation()))
    expect(screen.getByRole("status")).toBeVisible()

    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(screen.queryByRole("status")).toBeNull()

    rerender(renderNotice(failedEvaluation()))
    expect(screen.getByRole("status")).toBeVisible()

    fireEvent.click(screen.getByRole("button", { name: "Close verdict" }))
    expect(screen.queryByRole("status")).toBeNull()
  })
})
