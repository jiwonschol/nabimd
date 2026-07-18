import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { App } from "./App"

async function openApp() {
  const user = userEvent.setup()
  render(<App />)
  const editor = screen.getByRole("textbox", { name: "Your Markdown" })
  return { user, editor }
}

describe("App", () => {
  it("opens directly on the first real heading exercise", async () => {
    const { editor } = await openApp()

    expect(
      screen.getByRole("heading", { name: "Nabi Markdown" }),
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Make a document title" }),
    ).toBeVisible()
    expect(
      screen.getByRole("region", { name: "Target" }),
    ).toHaveTextContent("Project notes")
    expect(editor).toHaveValue("Project notes")
    expect(screen.getByRole("button", { name: "Check" })).toBeVisible()
  })

  it("does not grade while the learner is typing", async () => {
    const { user, editor } = await openApp()

    await user.clear(editor)
    await user.type(editor, "#Project notes")

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
    await user.clear(editor)
    await user.type(editor, "# Project notes")

    fireEvent.keyDown(editor, event)

    expect(
      screen.getByText("Perfect. Every check for this exercise passed."),
    ).toBeVisible()
  })

  it("keeps Next unavailable after Fail", async () => {
    const { user, editor } = await openApp()
    await user.clear(editor)
    await user.type(editor, "#Project notes")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Check again" }),
    ).toBeVisible()
  })

  it("reveals three progressive hints without inserting an answer", async () => {
    const { user, editor } = await openApp()
    await user.clear(editor)
    await user.type(editor, "#Project notes")
    await user.click(screen.getByRole("button", { name: "Check" }))
    const sourceBeforeHint = (editor as HTMLTextAreaElement).value

    await user.click(screen.getByRole("button", { name: "Hint" }))

    expect(
      screen.getByRole("complementary", { name: "Coach" }),
    ).toHaveTextContent("Turn the line into the document's main heading.")
    expect(screen.getByText("1 / 3")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Next hint" }))
    expect(screen.getByText("2 / 3")).toBeVisible()
    expect(
      screen.getByText("Type one hash symbol, one space, then the title."),
    ).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Next hint" }))
    expect(screen.getByText("3 / 3")).toBeVisible()
    expect(screen.getByText("Example: `# Team update`")).toBeVisible()
    expect(editor).toHaveValue(sourceBeforeHint)
  })

  it("keeps Review closed and optional after Matched", async () => {
    const { user, editor } = await openApp()
    await user.clear(editor)
    await user.type(editor, "# Project notes\n\n# Details")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(
      screen.getByText("Matched. Your Markdown uses the requested skill."),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
    expect(
      screen.queryByRole("complementary", { name: "Coach" }),
    ).toBeNull()

    await user.click(screen.getByRole("button", { name: "Review" }))

    expect(
      screen.getByRole("complementary", { name: "Coach" }),
    ).toHaveTextContent("Keep one H1 as the document title")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
  })

  it("shows Perfect as a pass without a required Review", async () => {
    const { user, editor } = await openApp()
    await user.clear(editor)
    await user.type(editor, "# Project notes")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(
      screen.getByText("Perfect. Every check for this exercise passed."),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Review" }),
    ).not.toBeInTheDocument()
  })

  it("opens a different-content transfer after a repaired failure", async () => {
    const { user, editor } = await openApp()
    await user.clear(editor)
    await user.type(editor, "#Project notes")
    await user.click(screen.getByRole("button", { name: "Check" }))
    await user.clear(editor)
    await user.type(editor, "# Project notes")
    await user.click(screen.getByRole("button", { name: "Check again" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(
      screen.getByText(
        "Turn Weekend guide into the document's main heading.",
      ),
    ).toBeVisible()
    expect(editor).toHaveValue("Weekend guide")
  })
})
