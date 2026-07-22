import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { SyntaxCheckpoint } from "../guided/guidedSyntax"
import { GuidedSyntaxCard } from "./GuidedSyntaxCard"

const checkpoint: SyntaxCheckpoint = {
  id: "syntax-21-3",
  line: 21,
  targetFrom: 100,
  targetTo: 113,
  activeOffset: 100,
  canonicalInput: "## ",
  segments: [
    { kind: "input", value: "## " },
    { kind: "locked", value: "Next steps" },
  ],
}

function renderCard(overrides: Partial<Parameters<typeof GuidedSyntaxCard>[0]> = {}) {
  const props: Parameters<typeof GuidedSyntaxCard>[0] = {
    attempts: 0,
    canGoBack: false,
    canGoForward: false,
    checkpoint,
    current: 3,
    hintOpen: false,
    instruction: "Make Next steps a level-two heading.",
    onBack: vi.fn(),
    onForward: vi.fn(),
    onSubmit: vi.fn(),
    onToggleHint: vi.fn(),
    onValueChange: vi.fn(),
    total: 5,
    value: "",
    ...overrides,
  }
  return { ...render(<GuidedSyntaxCard {...props} />), props }
}

describe("GuidedSyntaxCard", () => {
  it("keeps prose locked and submits only the typed syntax", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    const { rerender, props } = renderCard({ onSubmit, onValueChange })

    expect(
      screen.getByRole("heading", {
        name: "Make Next steps a level-two heading.",
      }),
    ).toBeVisible()
    expect(screen.getByText("Next steps")).toBeVisible()
    const input = screen.getByRole("textbox", {
      name: "Markdown syntax for line 21",
    })
    await user.type(input, "## ")
    expect(onValueChange).toHaveBeenNthCalledWith(1, "#")

    rerender(
      <GuidedSyntaxCard
        {...props}
        onSubmit={onSubmit}
        value="## "
      />,
    )
    await user.click(screen.getByRole("textbox", { name: "Markdown syntax for line 21" }))
    await user.keyboard("{Enter}")
    expect(onSubmit).toHaveBeenCalledWith("## ")
  })

  it("submits the current syntax from the visible Enter button", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderCard({ onSubmit, value: "## " })

    await user.click(screen.getByRole("button", { name: "Submit syntax" }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith("## ")
  })

  it("shows the exact answer only after Hint is opened", async () => {
    const user = userEvent.setup()
    const onToggleHint = vi.fn()
    const { rerender, props } = renderCard({ onToggleHint })

    expect(screen.queryByText("##␠")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show syntax hint" }))
    expect(onToggleHint).toHaveBeenCalledOnce()

    rerender(
      <GuidedSyntaxCard {...props} hintOpen onToggleHint={onToggleHint} />,
    )
    expect(screen.getByText("##␠")).toBeVisible()
  })

  it("exposes visited history without enabling unseen forward progress", () => {
    renderCard({ canGoBack: true, canGoForward: false })

    expect(screen.getByRole("button", { name: "Previous syntax" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Next visited syntax" })).toBeDisabled()
    expect(screen.getByText("3 / 5")).toBeVisible()
  })

  it("emphasizes the voluntary hint after two incorrect attempts", () => {
    renderCard({ attempts: 2 })

    expect(screen.getByRole("button", { name: "Show syntax hint" })).toHaveAttribute(
      "data-attention",
      "true",
    )
  })
})
