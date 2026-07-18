import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StatusBar } from "./StatusBar"

const defaultProps = {
  phase: "editing" as const,
  evaluation: null,
  hadFailure: false,
  canCheck: true,
  onCheck: vi.fn(),
  onNext: vi.fn(),
  onReview: vi.fn(),
}

describe("StatusBar", () => {
  it("shows the platform shortcut beside Check and exposes it to assistive technology", () => {
    render(<StatusBar {...defaultProps} />)

    const check = screen.getByRole("button", { name: "Check" })
    expect(check).toHaveAttribute("aria-keyshortcuts", "Control+Enter")
    expect(screen.getByText("Ctrl+↩")).toBeVisible()
  })

  it("focuses a passing Next action without advertising the Check shortcut", () => {
    render(
      <StatusBar
        {...defaultProps}
        evaluation={{
          status: "perfect",
          reviewItems: [],
        }}
        phase="evaluated"
      />,
    )

    const next = screen.getByRole("button", { name: "Next" })
    expect(next).toHaveFocus()
    expect(next).not.toHaveAttribute("aria-keyshortcuts")
    expect(screen.queryByText("Ctrl+↩")).not.toBeInTheDocument()
  })

  it("can transition to the complete phase without changing hook order", () => {
    const { rerender } = render(
      <StatusBar {...defaultProps} phase="complete" />,
    )

    expect(() => {
      rerender(<StatusBar {...defaultProps} />)
    }).not.toThrow()
    expect(screen.getByRole("contentinfo")).toBeVisible()
  })
})
