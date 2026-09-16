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
      submissionId: expect.any(String),
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
      await screen.findByText(
        "We couldn’t confirm whether your note was sent. Your text is still here.",
      ),
    ).toBeVisible()
    expect(screen.getByRole("textbox")).toHaveValue("Something broke.")
  })

  it("reuses the submission ID after a lost response, including trimmed whitespace", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    render(<SummaryFeedbackForm level={1} score={5} total={5} />)
    const note = screen.getByRole("textbox")
    await user.type(note, "Keep this note.")
    await user.click(screen.getByRole("button", { name: "Send note" }))

    expect(await screen.findByText(
      "We couldn’t confirm whether your note was sent. Your text is still here.",
    )).toBeVisible()
    expect(note).toHaveValue("Keep this note.")
    expect(note).toBeEnabled()
    await user.type(note, "  ")
    await user.click(screen.getByRole("button", { name: "Send note" }))
    expect(await screen.findByText("Your note was sent.")).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const first = JSON.parse(fetchMock.mock.calls[0]![1].body)
    const retry = JSON.parse(fetchMock.mock.calls[1]![1].body)
    expect(first.submissionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(retry).toEqual(first)
  })

  it.each(["message", "level", "score", "total"] as const)(
    "uses a new ID when the submitted %s changes",
    async (changedField) => {
      const fetchMock = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 500 })),
      )
      vi.stubGlobal("fetch", fetchMock)
      const props = { level: 1, score: 4, total: 5 }
      const { rerender } = render(<SummaryFeedbackForm {...props} />)
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "Original note." },
      })
      fireEvent.click(screen.getByRole("button", { name: "Send note" }))
      await screen.findByText(/We couldn’t confirm/)
      if (changedField === "message") {
        fireEvent.change(screen.getByRole("textbox"), {
          target: { value: "Changed note." },
        })
      } else {
        rerender(<SummaryFeedbackForm {...props} {...{
          [changedField]: props[changedField] + 1,
        }} />)
      }
      fireEvent.click(screen.getByRole("button", { name: "Send note" }))
      await screen.findByText(/We couldn’t confirm/)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      const first = JSON.parse(fetchMock.mock.calls[0]![1].body)
      const next = JSON.parse(fetchMock.mock.calls[1]![1].body)
      expect(next.submissionId).not.toBe(first.submissionId)
      expect(next[changedField]).not.toBe(first[changedField])
    },
  )

  it("keeps the rate limit message and reuses the ID when retrying", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    render(<SummaryFeedbackForm level={1} score={5} total={5} />)
    await user.type(screen.getByRole("textbox"), "Try later.")
    await user.click(screen.getByRole("button", { name: "Send note" }))
    expect(await screen.findByText(/Too many notes/)).toBeVisible()
    expect(screen.queryByText(/We couldn’t confirm/)).toBeNull()
    expect(screen.getByRole("textbox")).toHaveValue("Try later.")
    await user.click(screen.getByRole("button", { name: "Send note" }))
    expect(await screen.findByText("Your note was sent.")).toBeVisible()
    expect(fetchMock.mock.calls[1]![1].body).toBe(fetchMock.mock.calls[0]![1].body)
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
