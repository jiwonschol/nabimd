import { render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  WHY_OPENING_QUESTION,
  WHY_REASONS,
  WhyMarkdown,
} from "./WhyMarkdown"

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("WhyMarkdown", () => {
  it("shows the opening question and all five reasons verbatim when motion is reduced", () => {
    stubReducedMotion(true)
    render(<WhyMarkdown />)

    const region = screen.getByRole("region", { name: "Why learn Markdown" })
    expect(within(region).getByText(WHY_OPENING_QUESTION)).toBeVisible()

    const reasons = within(region).getAllByRole("listitem")
    expect(reasons).toHaveLength(WHY_REASONS.length)
    WHY_REASONS.forEach((reason, index) => {
      const item = reasons[index]!
      expect(within(item).getByText(reason.lead)).toBeVisible()
      expect(within(item).getByText(reason.support)).toBeVisible()
    })
  })

  it("keeps every reason and the question in the DOM in the given order for assistive tech", () => {
    stubReducedMotion(false)
    render(<WhyMarkdown />)

    const region = screen.getByRole("region", { name: "Why learn Markdown" })
    expect(within(region).getByText(WHY_OPENING_QUESTION)).toBeInTheDocument()

    const reasons = within(region).getAllByRole("listitem")
    expect(reasons.map((item) => item.textContent)).toEqual(
      WHY_REASONS.map((reason) => `${reason.lead}${reason.support}`),
    )
  })
})
