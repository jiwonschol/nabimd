import { render } from "@testing-library/react"
import { StrictMode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Evaluation } from "../engine/types"
import { playFeedbackSound } from "../sound/feedbackSound"
import { VerdictNotice } from "./VerdictNotice"

vi.mock("../sound/feedbackSound", () => ({
  playFeedbackSound: vi.fn(),
}))

const failedEvaluation: Evaluation = {
  status: "fail",
  feedbackId: "missing-mark",
  message: "Add Markdown marks.",
}

const matchedEvaluation: Evaluation = {
  status: "matched",
  reviewItems: [],
}

describe("VerdictNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("plays the retry and matched cues for their verdict transitions", () => {
    const { rerender } = render(<VerdictNotice evaluation={null} />)

    rerender(<VerdictNotice evaluation={failedEvaluation} />)
    rerender(<VerdictNotice evaluation={null} />)
    rerender(<VerdictNotice evaluation={matchedEvaluation} />)

    expect(playFeedbackSound).toHaveBeenNthCalledWith(1, "retry")
    expect(playFeedbackSound).toHaveBeenNthCalledWith(2, "matched")
  })

  it("does not replay when a matched evaluation is replaced by another match", () => {
    const { rerender } = render(<VerdictNotice evaluation={null} />)

    rerender(<VerdictNotice evaluation={matchedEvaluation} />)
    rerender(
      <VerdictNotice
        evaluation={{
          status: "matched",
          reviewItems: [],
        }}
      />,
    )

    expect(playFeedbackSound).toHaveBeenCalledTimes(1)
    expect(playFeedbackSound).toHaveBeenCalledWith("matched")
  })

  it("plays Try again for every failed Check, even when status stays failed", () => {
    const { rerender } = render(
      <VerdictNotice evaluation={failedEvaluation} />,
    )

    rerender(
      <VerdictNotice
        evaluation={{ ...failedEvaluation, message: "Try the mark again." }}
      />,
    )

    expect(playFeedbackSound).toHaveBeenCalledTimes(2)
    expect(playFeedbackSound).toHaveBeenNthCalledWith(1, "retry")
    expect(playFeedbackSound).toHaveBeenNthCalledWith(2, "retry")
  })

  it("does not replay Try again during StrictMode effect verification", () => {
    render(
      <StrictMode>
        <VerdictNotice evaluation={failedEvaluation} />
      </StrictMode>,
    )

    expect(playFeedbackSound).toHaveBeenCalledOnce()
    expect(playFeedbackSound).toHaveBeenCalledWith("retry")
  })
})
