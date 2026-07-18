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
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
  })

  it("focuses each deliberate continuation and restores editor focus", async () => {
    const { user, editor } = await openApp()
    await user.keyboard("# Apple")
    await user.keyboard("{Control>}{Enter}{/Control}")

    const next = screen.getByRole("button", { name: "Next" })
    expect(next).toHaveFocus()

    await user.keyboard(" ")

    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Rainy day",
    )
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
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
    expect(
      screen.getByRole("button", { name: "Practice again" }),
    ).toHaveFocus()
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Change level" }),
    ).toBeVisible()
  })

  it("starts replay with editor focus from the completion interstitial", async () => {
    const { user } = await openApp()

    for (const answer of ["# Apple", "# Rainy day", "# Study tools"]) {
      const editor = screen.getByRole("textbox", { name: "Your Markdown" })
      await replaceSource(user, editor, answer)
      await user.click(screen.getByRole("button", { name: "Check" }))
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    await user.keyboard(" ")

    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Weekend forecast",
    )
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
  })

  it("opens on an empty Level 1 lesson with the new rule visible", async () => {
    const { editor } = await openApp()

    expect(
      screen.getByRole("heading", { name: "Nabi Markdown" }),
    ).toBeVisible()
    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Apple",
    )

    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    const hint = screen.getByRole("complementary", { name: "Hint" })
    expect(within(hint).getByText("#", { exact: true })).toBeVisible()
    expect(within(hint).getByText("Space")).toBeVisible()
    expect(within(hint).getByText("Title")).toBeVisible()

    expect(editor).toHaveAttribute("aria-placeholder", "Type Markdown…")
    expect(screen.getByText("answer.md")).toBeVisible()
    expect(screen.getByRole("tab", { name: "Preview" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Check" })).toBeVisible()
    expect(hint).toHaveTextContent(
      "A main heading names the whole document.",
    )
    expect(hint).toHaveTextContent(
      "Start a line with one hash, add a space, then type the title.",
    )
  })

  it.each([
    ["I know the basics", "Rainy day"],
    ["Challenge me", "Study tools"],
  ])("keeps the Instruction lean for the %s entry", async (entry, target) => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: entry }))

    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(target)
    expect(
      screen.queryByText("A main heading names the whole document."),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("# Weather")).not.toBeInTheDocument()
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

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
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

    await user.click(screen.getByRole("button", { name: "Hint" }))
    const help = screen.getByRole("complementary", { name: "Hint" })

    expect(help).toHaveTextContent("Use one hash symbol to make a main heading.")
    expect(within(help).getByText("1 of 3")).toBeVisible()

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

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()

    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.getByRole("tabpanel", { name: "Review" })).toHaveTextContent(
      "Keep one H1 as the document title",
    )
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
  })

  it("shows a clean Matched pass without an empty Review", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("# Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
    expect(screen.queryByRole("tab", { name: "Review" })).toBeNull()
    expect(screen.getByRole("tab", { name: "Preview" })).toBeVisible()
  })

  it("opens a different-content recall transfer with Hint closed", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("#Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))
    await user.keyboard("{Alt>}1{/Alt}")
    await replaceSource(user, editor, "# Apple")
    await user.click(screen.getByRole("button", { name: "Check again" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("region", { name: "Goal" })).toHaveTextContent(
      "Rainy day",
    )
    const transferEditor = screen.getByRole("textbox", {
      name: "Your Markdown",
    })
    expect(transferEditor).toHaveAttribute("aria-placeholder", "Type Markdown…")
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )

    fireEvent.keyDown(transferEditor, { key: "z", ctrlKey: true })
    expect(transferEditor).toHaveAttribute("aria-placeholder", "Type Markdown…")

    await user.click(screen.getByRole("button", { name: "Hint" }))
    expect(
      within(screen.getByRole("complementary", { name: "Hint" })).getByText(
        "#",
        { exact: true },
      ),
    ).toBeVisible()
  })

  it("uses the same fixed panel frame for Goal and Your answer", async () => {
    await openApp()

    const goal = screen.getByRole("region", { name: "Goal" })
    const answer = screen.getByRole("region", { name: "Your answer" })

    expect(goal).toHaveClass("cbt-panel")
    expect(answer).toHaveClass("cbt-panel")
  })

  it("uses one fixed CBT bar and exactly two equal workspace panels", async () => {
    await openApp()

    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Try another" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Hint" })).toBeVisible()
    expect(screen.getByRole("region", { name: "Goal" })).toBeVisible()
    expect(
      screen.getByRole("region", { name: "Your answer" }),
    ).toBeVisible()
    expect(
      screen.queryByRole("region", { name: "Live preview" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument()
  })

  it("returns directly to the entry chooser from the active wordmark", async () => {
    const { user } = await openApp()

    await user.click(
      screen.getByRole("button", { name: "Nabi Markdown home" }),
    )

    expect(
      screen.getByRole("heading", { name: "Welcome. Choose where to begin." }),
    ).toBeVisible()
  })

  it("reissues different content in the same step", async () => {
    const { user } = await openApp()
    const originalGoal = screen.getByRole("region", { name: "Goal" }).textContent

    await user.click(screen.getByRole("button", { name: "Try another" }))

    expect(screen.getByLabelText("Heading progress")).toHaveTextContent("1 of 3")
    expect(screen.getByRole("region", { name: "Goal" })).not.toHaveTextContent(
      originalGoal ?? "Apple",
    )
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
  })

  it("switches the answer between Write and Preview without consuming Tab", async () => {
    const { user, editor } = await openApp()
    await user.keyboard("# Apple")

    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    await user.keyboard("{Alt>}2{/Alt}")
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.getByRole("tabpanel", { name: "Preview" })).toHaveTextContent(
      "Apple",
    )

    await user.keyboard("{Alt>}1{/Alt}")
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(editor).toHaveFocus()
  })

  it("opens beginner-facing Review after Try again", async () => {
    const { user, editor } = await openApp()
    await user.click(editor)
    await user.keyboard("#Apple")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    const review = screen.getByRole("tabpanel", { name: "Review" })
    expect(review).toHaveTextContent("1 thing to fix")
    expect(review).toHaveTextContent("How it should look")
    expect(review).toHaveTextContent("What you wrote")
    expect(review).toHaveTextContent("How to fix it")
    expect(review).not.toHaveTextContent("Diff")
  })
})
