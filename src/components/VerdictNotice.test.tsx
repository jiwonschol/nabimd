import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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
  it("plays a success sound only for a new matched evaluation", () => {
    const { rerender } = render(<VerdictNotice evaluation={null} />)

    rerender(<VerdictNotice evaluation={failedEvaluation} />)
    rerender(<VerdictNotice evaluation={null} />)
    rerender(<VerdictNotice evaluation={matchedEvaluation} />)

    expect(playSuccessSound).toHaveBeenCalledTimes(1)
  })
})
