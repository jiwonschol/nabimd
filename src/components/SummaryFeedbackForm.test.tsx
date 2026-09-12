import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SummaryFeedbackForm } from "./SummaryFeedbackForm"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("SummaryFeedbackForm", () => {
  it("sends only the note and approved run context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()

    render(<SummaryFeedbackForm level={3} score={5} total={6} />)
    const note = screen.getByRole("textbox", {
      name: "Bug report, improvement, or impression",
    })
    await user.type(note, "  The last card felt clear.  ")
    await user.click(screen.getByRole("button", { name: "Send note" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const [, request] = fetchMock.mock.calls[0]!
    expect(JSON.parse(String(request.body))).toEqual({
      message: "The last card felt clear.",
      level: 3,
      score: 5,
      total: 6,
      appRevision: __BUILD_SHA__,
      website: "",
    })
    expect(screen.getByRole("heading", { name: "Thank you." })).toBeVisible()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("keeps the note available when submission fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    )
    render(<SummaryFeedbackForm level={1} score={6} total={6} />)

    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Bug report, improvement, or impression",
      }),
      { target: { value: "Something broke." } },
    )
    fireEvent.click(screen.getByRole("button", { name: "Send note" }))

    expect(
      await screen.findByText("Your note was not sent. Please try again."),
    ).toBeVisible()
    expect(screen.getByRole("textbox")).toHaveValue("Something broke.")
  })

  it("caps the note at 500 characters", () => {
    render(<SummaryFeedbackForm level={1} score={6} total={6} />)
    expect(
      screen.getByRole("textbox", {
        name: "Bug report, improvement, or impression",
      }),
    ).toHaveAttribute("maxlength", "500")
  })

  it("states the maximum feedback retention", () => {
    render(<SummaryFeedbackForm level={1} score={6} total={6} />)
    expect(screen.getByText(/for up to 90 days/)).toBeVisible()
  })
})
