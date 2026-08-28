import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { entryChoices } from "../content/entryChoices"
import { OpenBookLanding } from "./OpenBookLanding"

describe("OpenBookLanding", () => {
  it("shows all three levels while keeping incomplete levels unavailable", async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<OpenBookLanding onChoose={onChoose} turningEntryId={null} />)

    const everyday = screen.getByRole("button", {
      name: "Level 1 — Everyday Markdown",
    })
    const useful = screen.getByRole("button", {
      name: "Level 2 — Useful patterns",
    })
    const goodToKnow = screen.getByRole("button", {
      name: "Level 3 — Good to know",
    })

    expect(everyday).toBeEnabled()
    expect(useful).toBeDisabled()
    expect(goodToKnow).toBeDisabled()
    expect(screen.getByText("The marks you use most.")).toBeVisible()
    expect(screen.getByText("Useful combinations and shortcuts.")).toBeVisible()
    expect(
      screen.getByText("Less common syntax worth recognizing."),
    ).toBeVisible()

    await user.click(useful)
    expect(onChoose).not.toHaveBeenCalled()
    await user.click(everyday)
    expect(onChoose).toHaveBeenCalledOnce()
    expect(onChoose).toHaveBeenCalledWith("level-1")
  })

  it("shows the release identifier and opens the user-facing changelog", async () => {
    const user = userEvent.setup()
    render(
      <OpenBookLanding
        onChoose={vi.fn()}
        release={{ version: "0.1.0", buildSha: "abc123456789" }}
        turningEntryId={null}
      />,
    )

    expect(screen.getByText("v0.1.0 · abc1234")).toBeVisible()
    const changelogToggle = screen.getByText("Changelog")
    const changelog = changelogToggle.closest("details")
    expect(changelog).not.toHaveAttribute("open")

    await user.click(changelogToggle)

    expect(changelog).toHaveAttribute("open")
    expect(
      screen.getByRole("heading", { name: "What's changed" }),
    ).toBeVisible()
    expect(screen.getByText("Release details and reporting")).toBeVisible()
    expect(screen.getByText("A calmer practice workspace")).toBeVisible()
  })

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
      name: "Source code (AGPL-3.0) on GitHub (opens in a new tab)",
    })
    expect(sourceLink).toHaveAttribute(
      "href",
      "https://github.com/jiwonschol/nabimd",
    )
    expect(sourceLink).toHaveAttribute("target", "_blank")
    expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer")

    const thirdPartyLicensesLink = screen.getByRole("link", {
      name: "Third-party licenses (opens in a new tab)",
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

    const availableEntry = entryChoices.find((entry) => entry.available)!
    await user.click(
      screen.getByRole("button", { name: availableEntry.label }),
    )
    expect(onChoose).toHaveBeenCalledOnce()
    expect(onChoose).toHaveBeenCalledWith(availableEntry.id)
  })

  it("locks every level while the chosen page is turning", () => {
    render(
      <OpenBookLanding
        onChoose={vi.fn()}
        turningEntryId={entryChoices[0]!.id}
      />,
    )

    expect(screen.getByTestId("page-turn-transition")).toBeVisible()
    const transition = screen.getByTestId("page-turn-transition")
    const buttons = transition.querySelectorAll("button.chapter-entry")
    expect(buttons).toHaveLength(entryChoices.length)
    buttons.forEach((button) => expect(button).toBeDisabled())
    expect(buttons[0]).toHaveAttribute("aria-current", "true")
  })

  it("makes all hidden landing content inert while the page is turning", () => {
    render(
      <OpenBookLanding
        onChoose={vi.fn()}
        turningEntryId={entryChoices[0]!.id}
      />,
    )

    const transition = screen.getByTestId("page-turn-transition")
    expect(transition).toHaveAttribute("aria-hidden", "true")
    expect(transition).toHaveAttribute("inert")

    const projectLinks = transition.querySelector(
      'nav[aria-label="Project links"]',
    )
    expect(projectLinks).not.toBeNull()
    expect(projectLinks?.querySelectorAll("a")).toHaveLength(2)
    expect(projectLinks?.closest("[inert]")).toBe(transition)
  })
})
