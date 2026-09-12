import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getProblem } from "../content/problemBank"
import { resetCenterCardMemoryForTests } from "../guided/useCenterCard"
import { CardFirstPractice } from "./CardFirstPractice"

const problem = getProblem("l1-italic-paper-boat")

describe("CardFirstPractice", () => {
  let resizeCallback: ResizeObserverCallback | null

  beforeEach(() => {
    resetCenterCardMemoryForTests()
    resizeCallback = null
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("uses one centered card instead of Goal and answer pages", () => {
    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={vi.fn()}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    expect(
      screen.getByRole("region", { name: "Markdown syntax practice" }),
    ).toBeVisible()
    expect(screen.queryByRole("region", { name: "Goal" })).toBeNull()
    expect(screen.queryByRole("tablist")).toBeNull()
    expect(screen.queryByText("Your answer")).toBeNull()
  })

  it("grows the document one accepted mark at a time", () => {
    const onGrow = vi.fn()
    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={onGrow}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    const firstBox = screen.getAllByRole("textbox")[0]!
    fireEvent.change(firstBox, { target: { value: "**" } })
    fireEvent.keyDown(document.activeElement ?? firstBox, { key: "Enter" })

    expect(onGrow).toHaveBeenCalledWith("*Paper boat*")
  })

  it("animates the card height while the exact Hint opens", () => {
    vi.useFakeTimers()
    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={vi.fn()}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Hint" }))
    const practice = screen.getByLabelText("Markdown syntax practice").parentElement
    expect(practice).toHaveAttribute("data-transition", "height")

    act(() => vi.advanceTimersByTime(249))
    expect(practice).toHaveAttribute("data-transition", "height")
    act(() => vi.advanceTimersByTime(1))
    expect(practice).not.toHaveAttribute("data-transition")
  })

  it("reverses an interrupted Hint transition from its rendered height", () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        if (!this.classList.contains("card-practice")) return 0
        const naturalHeight = this.querySelector(".center-card__exact-hint")
          ? 300
          : 200
        return Math.max(naturalHeight, Number.parseFloat(this.style.height) || 0)
      },
    )
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const height =
          this.classList.contains("card-practice") &&
          this.dataset.transition === "height"
            ? 250
            : Number.parseFloat(this.style.height) || this.scrollHeight
        return {
          bottom: height,
          height,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }
      },
    )

    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={vi.fn()}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Hint" }))
    const practice = screen.getByLabelText("Markdown syntax practice").parentElement!
    expect(practice.style.height).toBe("300px")

    fireEvent.click(screen.getByRole("button", { name: "Close hint" }))
    expect(practice.style.height).toBe("200px")
    expect(practice).toHaveAttribute("data-transition", "height")
  })

  it("starts the next transition from the reflowed resting height", () => {
    vi.useFakeTimers()
    const forcedStartHeights: string[] = []
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        if (!this.classList.contains("card-practice")) return 0
        return this.querySelector(".center-card__exact-hint") ? 360 : 200
      },
    )
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("card-practice")) {
          forcedStartHeights.push(this.style.height)
        }
        return 0
      },
    )

    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={vi.fn()}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    act(() => {
      resizeCallback?.(
        [
          {
            borderBoxSize: [{ blockSize: 264, inlineSize: 400 }],
            contentRect: { height: 240 } as DOMRectReadOnly,
          } as unknown as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      )
    })
    fireEvent.click(screen.getByRole("button", { name: "Hint" }))

    expect(forcedStartHeights).toContain("264px")
  })
})
