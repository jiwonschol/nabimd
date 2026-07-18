import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { App } from "./App"

async function openApp() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(
    screen.getByRole("button", {
      name: "New to Markdown — start at Level 1",
    }),
  )
  const editor = screen.getByRole("textbox", { name: "Your Markdown" })
  return { user, editor }
}

async function replaceSource(
  user: ReturnType<typeof userEvent.setup>,
  editor: HTMLElement,
  source: string,
) {
  await user.click(editor)
  await user.keyboard("{Control>}a{/Control}{Backspace}")
  if (source) await user.keyboard(source)
}

describe("App", () => {
  it("greets a fresh browser session with the three approved entry choices", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", { name: "Nabi Markdown" }),
    ).toBeVisible()
    expect(screen.getByText(/welcome/i)).toBeVisible()
    expect(
      screen.getByRole("button", {
        name: "New to Markdown — start at Level 1",
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "I know the basics" }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Challenge me" }),
    ).toBeVisible()
    expect(
      screen.queryByRole("textbox", { name: "Your Markdown" }),
    ).not.toBeInTheDocument()
  })

  it("enters the selected heading mode in one keyboard activation", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.tab()
    await user.tab()
    await user.keyboard("{Enter}")

    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Rainy day",
    )
    expect(
      within(screen.getByRole("complementary", { name: "Help" })).getByRole(
        "button",
        { name: "Show hint" },
      ),
    ).toBeVisible()
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
  })

  it("labels progress by finishable run steps for a higher entry", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Challenge me" }))

    expect(
      screen.getByLabelText("Heading progress"),
    ).toHaveTextContent("1 of 3")
    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Study tools",
    )
  })

  it("offers all three replay choices when the run finishes", async () => {
    const { user } = await openApp()
    const answers = ["# Apple", "# Rainy day", "# Study tools"]

    for (const answer of answers) {
      const editor = screen.getByRole("textbox", { name: "Your Markdown" })
      await replaceSource(user, editor, answer)
      await user.click(screen.getByRole("button", { name: "Check" }))
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    expect(
      screen.getByRole("heading", { name: "Heading practice complete." }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Practice again" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Change level" }),
    ).toBeVisible()
  })

  it("opens on an empty Level 1 lesson with the new rule visible", async () => {
    const { editor } = await openApp()

    expect(
      screen.getByRole("heading", { name: "Nabi Markdown" }),
    ).toBeVisible()
    expect(screen.getByText("Instruction")).toBeVisible()
    expect(
      screen.getByRole("heading", {
        name: "Rebuild the heading below in Markdown.",
      }),
    ).toBeVisible()
    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Apple",
    )

    const help = screen.getByRole("complementary", { name: "Help" })
    expect(within(help).getByRole("button", { name: "Hide hint" })).toBeVisible()
    expect(within(help).getByText("#", { exact: true })).toBeVisible()
    expect(within(help).getByText("Space")).toBeVisible()
    expect(within(help).getByText("Title")).toBeVisible()

    expect(editor).toHaveAttribute("aria-placeholder", "Type Markdown…")
    expect(screen.getByText("answer.md")).toBeVisible()
    expect(
      screen.getByRole("region", { name: "Live preview" }),
    ).toHaveTextContent("Your preview will appear here.")
    expect(screen.getByRole("button", { name: "Check" })).toBeVisible()
  })

  it("does not grade while the learner is typing", async () => {
    const { user, editor } = await openApp()

    await user.click(editor)
    await user.keyboard("#Apple")

    expect(
      screen.queryByText("Add one space after the hash symbol."),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(
      screen.getByText("Add one space after the hash symbol."),
    ).toBeVisible()
  })

  it.each([
    { modifier: "Command", event: { key: "Enter", metaKey: true } },
    { modifier: "Control", event: { key: "Enter", ctrlKey: true } },
  ])("checks with $modifier + Enter", async ({ event }) => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("# Apple")

    fireEvent.keyDown(editor, event)

    expect(
      screen.getByText("Perfect. Every check for this exercise passed."),
    ).toBeVisible()
  })

  it("keeps Next unavailable after Fail", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("#Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.queryByRole("button", { name: "Next" })).toBeNull()
    expect(screen.getByRole("button", { name: "Check again" })).toBeVisible()
  })

  it("reveals progressive hints downward without editing source", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("#Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))

    const help = screen.getByRole("complementary", { name: "Help" })
    await user.click(within(help).getByRole("button", { name: "Show hint" }))

    expect(help).toHaveTextContent("Use one hash symbol to make a main heading.")
    expect(within(help).getByText("1 / 3")).toBeVisible()

    await user.click(within(help).getByRole("button", { name: "Next hint" }))
    expect(help).toHaveTextContent(
      "Type one hash symbol, one space, then the title.",
    )

    await user.click(within(help).getByRole("button", { name: "Next hint" }))
    expect(help).toHaveTextContent("Example: `# Team update`")
    expect(editor).toHaveTextContent("#Apple")
  })

  it("keeps Review optional after Matched", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("# Apple{Enter}{Enter}# Details")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(
      screen.getByText("Matched. Your Markdown uses the requested skill."),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Review" }))

    expect(
      screen.getByRole("complementary", { name: "Help" }),
    ).toHaveTextContent("Keep one H1 as the document title")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
  })

  it("shows Perfect as a pass without a required Review", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("# Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(
      screen.getByText("Perfect. Every check for this exercise passed."),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Review" })).toBeNull()
  })

  it("opens a different-content recall transfer with Hint closed", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("#Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))
    await replaceSource(user, editor, "# Apple")
    await user.click(screen.getByRole("button", { name: "Check again" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Rainy day",
    )
    expect(editor).toHaveAttribute("aria-placeholder", "Type Markdown…")

    const help = screen.getByRole("complementary", { name: "Help" })
    expect(within(help).getByRole("button", { name: "Show hint" })).toBeVisible()
    expect(within(help).queryByText("#", { exact: true })).toBeNull()

    fireEvent.keyDown(editor, { key: "z", ctrlKey: true })
    expect(editor).toHaveAttribute("aria-placeholder", "Type Markdown…")

    await user.click(within(help).getByRole("button", { name: "Show hint" }))
    expect(within(help).getByText("#", { exact: true })).toBeVisible()
  })

  it("uses the same paper component for Goal and Live preview", async () => {
    await openApp()

    const goal = screen.getByRole("region", { name: "Goal" })
    const preview = screen.getByRole("region", { name: "Live preview" })

    expect(goal).toHaveClass("rendered-document")
    expect(preview).toHaveClass("rendered-document")
    expect(goal.className).toBe(preview.className)
  })
})
