import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ErrorBoundary } from "./ErrorBoundary"
import { setCurrentProblemId } from "../app/currentProblem"
import { LANG_STORAGE_KEY } from "../i18n/text"

const LEARNER_MARKDOWN = "# My private notes\n\n- something personal"

function Boom({ message }: { message: string }): never {
  throw new Error(message)
}

function seedProblem(): void {
  setCurrentProblemId("l1-heading-apple")
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(LANG_STORAGE_KEY, "en")
    setCurrentProblemId(undefined)
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
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument()
  })

  it("speaks the stored screen language", () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, "ko")
    render(
      <ErrorBoundary>
        <Boom message="Root element not found" />
      </ErrorBoundary>,
    )
    expect(screen.getByText("화면을 그리다 멈췄다.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument()
  })

  it("names the exercise that broke, so a report can be matched to it", () => {
    seedProblem()
    render(
      <ErrorBoundary>
        <Boom message="Root element not found" />
      </ErrorBoundary>,
    )
    expect(screen.getByText("l1-heading-apple")).toBeInTheDocument()
  })

  it("reloads the page from the reload button", async () => {
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
    await userEvent.click(screen.getByRole("button", { name: "Reload" }))

    expect(reload).toHaveBeenCalledOnce()
  })

  it("never puts the learner's writing in the prefilled issue link", () => {
    seedProblem()
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
