import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import {
  deriveSyntaxCheckpoints,
  projectCheckpointContext,
} from "../guided/guidedSyntax"
import { CenterCard } from "./CenterCard"

function cardProps(
  overrides: Record<string, unknown> = {},
): ComponentProps<typeof CenterCard> {
  const target = "*Paper boat*"
  const checkpoint = deriveSyntaxCheckpoints(target, "Paper boat")[0]!
  return {
    checkpoint,
    slotIndex: 0,
    slotTotal: 2,
    segmentValues: ["", ""],
    verdict: "idle",
    canGoToPreviousSlot: false,
    canGoToNextSlot: false,
    onEditSegment: vi.fn(),
    onPreviousSlot: vi.fn(),
    onNextSlot: vi.fn(),
    onSubmit: vi.fn(),
    context: projectCheckpointContext(target, checkpoint),
    hintOpen: true,
    hintRows: [
      { input: "**", source: "*Paper boat*" },
      { input: "__", source: "_Paper boat_" },
    ],
    focusRequest: 0,
    onToggleHint: vi.fn(),
    onCloseHint: vi.fn(),
    ...overrides,
  } as ComponentProps<typeof CenterCard>
}

describe("CenterCard", () => {
  it("renders a direct instruction with only the syntax term emphasized", () => {
    render(<CenterCard {...cardProps()} />)

    const instruction = screen.getByRole("heading", { level: 2 })
    expect(instruction).toHaveTextContent(
      "Wrap the phrase in Markdown marks for italic text.",
    )
    expect(instruction.querySelectorAll("strong")).toHaveLength(1)
    expect(instruction.querySelector("strong")).toHaveTextContent("italic text")
  })

  it("keeps locked prose outside the two syntax textboxes", () => {
    render(<CenterCard {...cardProps()} />)

    expect(screen.getAllByRole("textbox")).toHaveLength(2)
    expect(screen.getByText("Paper boat", { selector: "span" })).toBeVisible()
  })

  it("shows all accepted alternatives as separate exact Hint rows", () => {
    render(<CenterCard {...cardProps()} />)

    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    const hint = screen.getByRole("region", { name: "Exact Markdown hint" })
    expect(hint).toHaveTextContent("*Paper boat*")
    expect(hint).toHaveTextContent("_Paper boat_")
    expect(hint.querySelectorAll("li")).toHaveLength(2)
  })

  it("lets pointer users submit through the visible Enter control", () => {
    const onSubmit = vi.fn()
    render(<CenterCard {...cardProps({ onSubmit })} />)

    fireEvent.click(screen.getByRole("button", { name: "Check marks" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("toggles Hint with ? while a syntax box owns focus", () => {
    const onToggleHint = vi.fn()
    render(<CenterCard {...cardProps({ onToggleHint })} />)
    const firstBox = screen.getAllByRole("textbox")[0]!
    firstBox.focus()

    fireEvent.keyDown(firstBox, { key: "?", code: "Slash", shiftKey: true })
    expect(onToggleHint).toHaveBeenCalledTimes(1)
  })

  it("returns focus to the first syntax box on a new focus request", () => {
    const props = cardProps({ hintOpen: false, focusRequest: 0 })
    const { rerender } = render(<CenterCard {...props} />)
    const boxes = screen.getAllByRole("textbox")
    boxes[1]!.focus()
    expect(boxes[1]).toHaveFocus()

    rerender(<CenterCard {...cardProps({ hintOpen: true, focusRequest: 1 })} />)
    expect(screen.getAllByRole("textbox")[0]).toHaveFocus()
  })

  it("keeps transition snapshots readonly without stealing focus", () => {
    render(
      <>
        <button autoFocus type="button">
          Before card
        </button>
        <CenterCard {...cardProps({ interactive: false })} />
      </>,
    )

    expect(screen.getByRole("button", { name: "Before card" })).toHaveFocus()
    for (const box of screen.getAllByRole("textbox")) {
      expect(box).toHaveAttribute("readonly")
    }
  })
})
