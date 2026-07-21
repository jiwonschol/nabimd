import { render, screen, within } from "@testing-library/react"
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  GLYPH_DELAY_MS,
  GLYPH_ENTER_MS,
  HOLD_MS,
  LEAD_PAUSE_MS,
  ONSET_MS,
  WHY_EXIT_MS,
  WHY_GAP_MS,
  WHY_OPENING_QUESTION,
  WHY_REASONS,
  WhyMarkdown,
  revealDuration,
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

// jsdom ships no Web Animations API, so the component would otherwise always
// take its static fallback. Provide a minimal animate() so the animated branch
// is actually exercised, then restore the original afterwards.
const NATIVE_ANIMATE = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "animate",
)

function enableWebAnimations() {
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    writable: true,
    value: () => ({ cancel() {} }),
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (NATIVE_ANIMATE) {
    Object.defineProperty(Element.prototype, "animate", NATIVE_ANIMATE)
  } else {
    delete (Element.prototype as { animate?: unknown }).animate
  }
})

describe("WhyMarkdown", () => {
  it("stages visible glyphs at 32ms intervals and pauses before the support line", () => {
    stubReducedMotion(false)
    enableWebAnimations()
    render(<WhyMarkdown />)

    const glyphs = document.querySelectorAll<HTMLElement>(".open-book-why__glyph")
    expect(glyphs[0]).toHaveStyle({ animationDelay: "0ms" })
    expect(glyphs[1]).toHaveStyle({ animationDelay: `${GLYPH_DELAY_MS}ms` })

    const firstReason = document.querySelector<HTMLElement>(".open-book-why__reason")!
    const firstWord = firstReason.querySelector<HTMLElement>(".open-book-why__lead .open-book-why__word")!
    expect(firstWord.nextSibling).toMatchObject({ nodeType: Node.TEXT_NODE, textContent: " " })
    const leadGlyphs = firstReason.querySelectorAll<HTMLElement>(".open-book-why__lead .open-book-why__glyph")
    const supportGlyphs = firstReason.querySelectorAll<HTMLElement>(".open-book-why__support .open-book-why__glyph")
    const lastLeadDelay = Number.parseInt(leadGlyphs[leadGlyphs.length - 1]!.style.animationDelay, 10)
    const firstSupportDelay = Number.parseInt(supportGlyphs[0]!.style.animationDelay, 10)
    const lastSupportDelay = Number.parseInt(supportGlyphs[supportGlyphs.length - 1]!.style.animationDelay, 10)
    expect(firstSupportDelay - (lastLeadDelay + GLYPH_ENTER_MS)).toBe(LEAD_PAUSE_MS)
    expect(lastSupportDelay + GLYPH_ENTER_MS).toBe(revealDuration(WHY_REASONS[0]!))
  })

  it("does not exit an active reason before its final glyph and completed-text hold", () => {
    vi.useFakeTimers()
    vi.spyOn(Math, "random").mockReturnValue(0)
    stubReducedMotion(false)
    enableWebAnimations()
    render(<WhyMarkdown />)

    act(() => vi.advanceTimersByTime(ONSET_MS + revealDuration(WHY_REASONS[1]!)))
    const active = document.querySelector(".open-book-why__reason--active")!
    expect(active).not.toHaveClass("open-book-why__reason--exiting")

    act(() => vi.advanceTimersByTime(HOLD_MS - 1))
    expect(active).not.toHaveClass("open-book-why__reason--exiting")
    act(() => vi.advanceTimersByTime(1))
    expect(active).toHaveClass("open-book-why__reason--exiting")
  })

  it("starts the next reason only after the exit and quiet gap", () => {
    vi.useFakeTimers()
    vi.spyOn(Math, "random").mockReturnValue(0)
    stubReducedMotion(false)
    enableWebAnimations()
    render(<WhyMarkdown />)

    act(() =>
      vi.advanceTimersByTime(
        ONSET_MS + revealDuration(WHY_REASONS[1]!) + HOLD_MS + WHY_EXIT_MS + WHY_GAP_MS - 1,
      ),
    )
    expect(document.querySelectorAll(".open-book-why__reason--active")).toHaveLength(0)
    act(() => vi.advanceTimersByTime(1))
    expect(document.querySelectorAll(".open-book-why__reason--active")).toHaveLength(1)
  })

  it("shows the opening question and all five reasons verbatim, in order, when motion is reduced", () => {
    vi.useFakeTimers()
    stubReducedMotion(true)
    render(<WhyMarkdown />)

    const region = screen.getByRole("region", { name: "Why learn Markdown" })
    expect(region).toHaveClass("open-book-why--static")
    expect(within(region).getByText(WHY_OPENING_QUESTION)).toBeVisible()

    const reasons = within(region).getAllByRole("listitem")
    expect(reasons).toHaveLength(WHY_REASONS.length)
    WHY_REASONS.forEach((reason, index) => {
      const item = reasons[index]!
      expect(within(item).getByText(reason.lead)).toBeVisible()
      expect(within(item).getByText(reason.support)).toBeVisible()
    })
    expect(vi.getTimerCount()).toBe(0)
  })

  it("animates but keeps every reason and the question in the DOM in the given order for assistive tech", () => {
    stubReducedMotion(false)
    enableWebAnimations()
    render(<WhyMarkdown />)

    const region = screen.getByRole("region", { name: "Why learn Markdown" })
    expect(region).not.toHaveClass("open-book-why--static")
    expect(within(region).getByText(WHY_OPENING_QUESTION)).toBeInTheDocument()

    const reasons = within(region).getAllByRole("listitem")
    expect(reasons.map((item) => item.textContent)).toEqual(
      WHY_REASONS.map((reason) => `${reason.lead}${reason.support}`),
    )
  })
})
