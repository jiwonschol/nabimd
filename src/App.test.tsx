import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { entryChoices } from "./content/entryChoices"
import { App } from "./App"

async function openLevel(level: 1 | 2 | 3 | 4 | 5 = 1) {
  const user = userEvent.setup()
  render(<App />)
  const entry = entryChoices.find((choice) => choice.level === level)!
  await user.click(screen.getByRole("button", { name: entry.label }))
  const editor = screen.getByRole("textbox", { name: "Your Markdown" })
  return { user, editor, entry }
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
  it("greets a fresh session with the definitive five-level ladder", () => {
    render(<App />)
    expect(screen.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
    for (const entry of entryChoices) {
      expect(screen.getByRole("button", { name: entry.label })).toBeVisible()
    }
    expect(screen.queryByRole("textbox", { name: "Your Markdown" })).toBeNull()
  })

  it("enters any selected level directly and keeps its run at 1 of 3", async () => {
    for (const entry of entryChoices) {
      window.sessionStorage.clear()
      const view = render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: entry.label }))
      expect(screen.getByLabelText("Practice progress")).toHaveTextContent("1 of 3")
      expect(screen.getByText(`Level ${entry.level}`)).toBeVisible()
      expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
      view.unmount()
    }
  })

  it("shows teaching automatically only at Level 1", async () => {
    const first = await openLevel(1)
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    expect(within(screen.getByRole("complementary", { name: "Hint" })).getByText("#")).toBeVisible()
    await first.user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    await first.user.click(screen.getByRole("button", { name: entryChoices[1].label }))
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("checks only on explicit action and accepts different prose", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("# completely different words")
    expect(screen.queryByRole("status")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Check" }))
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
  })

  it.each([
    { modifier: "Command", event: { key: "Enter", metaKey: true } },
    { modifier: "Control", event: { key: "Enter", ctrlKey: true } },
  ])("checks with $modifier + Enter", async ({ event }) => {
    const { user, editor } = await openLevel(1)
    await user.click(editor)
    await user.keyboard("# anything")
    fireEvent.keyDown(editor, event)
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
  })

  it("moves focus Check → Next → editor", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("# anything")
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus()

    await user.keyboard(" ")
    expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
    expect(screen.getByLabelText("Practice progress")).toHaveTextContent("2 of 3")
  })

  it("keeps Next unavailable and opens beginner Review after Try again", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("#No space")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull()
    expect(screen.getByRole("button", { name: "Check again" })).toBeVisible()
    const review = screen.getByRole("tabpanel", { name: "Review" })
    expect(review).toHaveTextContent("How it should look")
    expect(review).toHaveTextContent("How to fix it")
    expect(review).not.toHaveTextContent("Diff")
    expect(editor).not.toHaveFocus()
  })

  it("keeps Markdown-structure Review optional after Matched", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("# one{Enter}{Enter}# two")
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
    expect(screen.getByRole("tabpanel", { name: "Review" })).toHaveTextContent(
      "Keep one H1",
    )
  })

  it("uses a different same-level problem after repair", async () => {
    const { user, editor } = await openLevel(2)
    const originalGoal = screen.getByRole("region", { name: "Goal" }).textContent
    await user.keyboard("#No space")
    await user.click(screen.getByRole("button", { name: "Check" }))
    await user.keyboard("{Alt>}1{/Alt}")
    await replaceSource(user, editor, "# repaired")
    await user.click(screen.getByRole("button", { name: "Check again" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(
      originalGoal,
    )
    expect(screen.getByText("Level 2")).toBeVisible()
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("uses one fixed bar and exactly two workspace panels", async () => {
    await openLevel(5)
    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Try another" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Hint" })).toBeVisible()
    expect(screen.getByRole("region", { name: "Goal" })).toHaveClass("cbt-panel")
    expect(screen.getByRole("region", { name: "Your answer" })).toHaveClass("cbt-panel")
    expect(screen.queryByRole("region", { name: "Live preview" })).toBeNull()
    expect(screen.queryByRole("contentinfo")).toBeNull()
  })

  it("switches Write and Preview without consuming editor Tab", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("# Preview words")
    const writeTab = screen.getByRole("tab", { name: "Write" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    await user.keyboard("{Alt>}2{/Alt}")
    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(previewTab).toHaveFocus()
    expect(screen.getByRole("tabpanel", { name: "Preview" })).toHaveTextContent(
      "Preview words",
    )
    await user.keyboard("{ArrowRight}")
    expect(writeTab).toHaveFocus()
    await user.keyboard("{Alt>}1{/Alt}")
    expect(editor).toHaveFocus()
  })

  it("returns home and can reissue content at the same step", async () => {
    const { user } = await openLevel(3)
    const original = screen.getByRole("region", { name: "Goal" }).textContent
    await user.click(screen.getByRole("button", { name: "Try another" }))
    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(original)
    expect(screen.getByLabelText("Practice progress")).toHaveTextContent("1 of 3")

    await user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    expect(screen.getByRole("heading", { name: "Welcome. Choose where to begin." })).toBeVisible()
  })

  it("completes a run and offers all replay choices", async () => {
    const { user } = await openLevel(1)
    for (let index = 0; index < 3; index += 1) {
      const editor = screen.getByRole("textbox", { name: "Your Markdown" })
      await replaceSource(user, editor, "# acceptable")
      await user.click(screen.getByRole("button", { name: "Check" }))
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    expect(screen.getByRole("button", { name: "Practice again" })).toHaveFocus()
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()
  })
})
