import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { entryChoices } from "../content/entryChoices"
import { OpenBookLanding } from "./OpenBookLanding"

describe("OpenBookLanding", () => {
  it("uses every level row as the direct start action", async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<OpenBookLanding onChoose={onChoose} turningEntryId={null} />)

    expect(
      screen.getByRole("heading", { name: "Structure becomes instinct." }),
    ).toBeVisible()
    expect(
      screen.getByText("Brief → Write source → Inspect render → Prove again"),
    ).toBeVisible()

    for (const entry of entryChoices) {
      expect(screen.getByRole("button", { name: entry.label })).toBeVisible()
    }
    expect(screen.queryByRole("button", { name: /begin|start|continue/i })).toBeNull()

    await user.click(
      screen.getByRole("button", { name: entryChoices[2].label }),
    )
    expect(onChoose).toHaveBeenCalledOnce()
    expect(onChoose).toHaveBeenCalledWith(entryChoices[2].id)
  })

  it("locks every level while the chosen page is turning", () => {
    render(
      <OpenBookLanding
        onChoose={vi.fn()}
        turningEntryId={entryChoices[1].id}
      />,
    )

    expect(screen.getByTestId("page-turn-transition")).toBeVisible()
    const transition = screen.getByTestId("page-turn-transition")
    const buttons = transition.querySelectorAll("button.chapter-entry")
    expect(buttons).toHaveLength(entryChoices.length)
    buttons.forEach((button) => expect(button).toBeDisabled())
    expect(buttons[1]).toHaveAttribute("aria-current", "true")
  })
})
