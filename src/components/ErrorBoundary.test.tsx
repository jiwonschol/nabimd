import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ErrorBoundary } from "./ErrorBoundary"
import { PROGRESS_STORAGE_KEY } from "../progress/progressStore"

const LEARNER_MARKDOWN = "# My private notes\n\n- something personal"

function Boom({ message }: { message: string }): never {
  throw new Error(message)
}

function seedProgress(): void {
  window.sessionStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify({
      version: 5,
      currentProblemId: "l1-heading-apple",
      draftByProblemId: { "l1-heading-apple": LEARNER_MARKDOWN },
      completedProblemIds: ["l1-heading-pear"],
      runStepIndex: 2,
    }),
  )
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    // React logs caught errors; the assertions below are what matter.
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText("All good")).toBeInTheDocument()
  })

  it("shows a readable screen instead of a blank page when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom message="Root element not found" />
      </ErrorBoundary>,
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Clear saved answers and reload" }),
    ).toBeInTheDocument()
  })

  it("names the exercise that broke, so a report can be matched to it", () => {
    seedProgress()
    render(
      <ErrorBoundary>
        <Boom message="Root element not found" />
      </ErrorBoundary>,
    )
    expect(screen.getByText("l1-heading-apple")).toBeInTheDocument()
  })

  it("clears saved drafts but keeps progress", async () => {
    seedProgress()
    const reload = vi.fn()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    })

    render(
      <ErrorBoundary>
        <Boom message="Root element not found" />
      </ErrorBoundary>,
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Clear saved answers and reload" }),
    )

    const saved = JSON.parse(
      window.sessionStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>

    expect(saved.draftByProblemId).toEqual({})
    expect(saved.completedProblemIds).toEqual(["l1-heading-pear"])
    expect(saved.runStepIndex).toBe(2)
    expect(reload).toHaveBeenCalledOnce()
  })

  it("never puts the learner's writing in the prefilled issue link", () => {
    seedProgress()
    render(
      <ErrorBoundary>
        <Boom message={`Failed on: ${LEARNER_MARKDOWN}`} />
      </ErrorBoundary>,
    )

    const link = screen.getByRole("link", { name: /Report this on GitHub/ })
    const href = link.getAttribute("href") ?? ""
    const decoded = decodeURIComponent(href)

    expect(decoded).not.toContain("My private notes")
    expect(decoded).not.toContain("something personal")
    // The unrecognised message is redacted rather than published.
    expect(decoded).toContain("redacted")
    // But the report still points at the exercise and the build.
    expect(decoded).toContain("l1-heading-apple")
    expect(decoded).toContain("template=bug_report.yml")
  })

  it("still shows the real message on screen, where only the learner sees it", () => {
    render(
      <ErrorBoundary>
        <Boom message={`Failed on: ${LEARNER_MARKDOWN}`} />
      </ErrorBoundary>,
    )
    // getByText collapses whitespace, so assert on the rendered detail directly.
    const detail = screen.getByText("Detail").nextElementSibling
    expect(detail?.textContent).toContain("My private notes")
    expect(detail?.textContent).toContain("something personal")
  })
})
