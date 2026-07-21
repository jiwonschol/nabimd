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
      screen.getByRole("heading", { name: "Markdown is easy." }),
    ).toBeVisible()
    expect(
      screen.getByRole("region", { name: "Markdown is easy." }),
    ).toBeVisible()
    expect(
      screen.getByText("Learning to use it well is just as easy."),
    ).toBeVisible()
    expect(screen.getByText("Nobody ever showed you —")).toBeVisible()
    expect(
      screen.getByText("that is the only reason you haven't."),
    ).toBeVisible()
    expect(screen.queryByText("Structure becomes instinct.")).toBeNull()
    expect(screen.queryByText("A short daily writing practice")).toBeNull()
    expect(
      screen.queryByText("Brief → Write source → Inspect render → Prove again"),
    ).toBeNull()
    expect(screen.queryByRole("list", { name: "How practice works" })).toBeNull()
    expect(
      screen.queryByText("Five levels · ten quiet minutes at a time"),
    ).toBeNull()
    expect(screen.queryByText("There is no wrong place to start.")).toBeNull()
    expect(
      screen.queryByText("Learn the building blocks of Markdown."),
    ).toBeNull()
    expect(screen.queryByTestId("landing-book-spine")).toBeNull()

    const sourceLink = screen.getByRole("link", {
      name: "Source code (AGPL-3.0) on GitHub",
    })
    expect(sourceLink).toHaveAttribute(
      "href",
      "https://github.com/jiwonschol/nabimd",
    )
    expect(sourceLink).toHaveAttribute("target", "_blank")
    expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer")

    const thirdPartyLicensesLink = screen.getByRole("link", {
      name: "Third-party licenses",
    })
    expect(thirdPartyLicensesLink).toHaveAttribute(
      "href",
      "/third-party-licenses.html",
    )
    expect(thirdPartyLicensesLink).toHaveAttribute("target", "_blank")
    expect(thirdPartyLicensesLink).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    )

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
