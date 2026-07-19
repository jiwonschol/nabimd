import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Evaluation } from "../engine/types"
import { playSuccessSound } from "../sound/successSound"
import { VerdictNotice } from "./VerdictNotice"

vi.mock("../sound/successSound", () => ({
  playSuccessSound: vi.fn(),
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

  it("plays once for a non-matched to matched transition", () => {
    const { rerender } = render(<VerdictNotice evaluation={null} />)

    rerender(<VerdictNotice evaluation={failedEvaluation} />)
    rerender(<VerdictNotice evaluation={null} />)
    rerender(<VerdictNotice evaluation={matchedEvaluation} />)

    expect(playSuccessSound).toHaveBeenCalledTimes(1)
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

    expect(playSuccessSound).toHaveBeenCalledTimes(1)
  })
})
