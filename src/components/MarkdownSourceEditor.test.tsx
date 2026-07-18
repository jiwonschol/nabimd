import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"

describe("MarkdownSourceEditor", () => {
  it("presents a restrained Markdown file editor", () => {
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value=""
      />,
    )

    expect(screen.getByText("answer.md")).toBeVisible()
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Show invisibles" }),
    ).toHaveAttribute("aria-pressed", "false")
  })

  it("reports source edits and preserves controlled updates", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        value=""
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })

    await user.click(editor)
    await user.keyboard("# Apple")

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("# Apple"))
    const editCallCount = onChange.mock.calls.length

    rerender(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        value="# Rainy day"
      />,
    )

    await waitFor(() => expect(editor).toHaveTextContent("# Rainy day"))
    expect(onChange).toHaveBeenCalledTimes(editCallCount)
  })

  it("checks with Control or Command plus Enter", () => {
    const onCheck = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={onCheck}
        value="# Apple"
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })

    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true })
    fireEvent.keyDown(editor, { key: "Enter", metaKey: true })

    expect(onCheck).toHaveBeenCalledTimes(2)
  })

  it("toggles invisible decorations without changing source", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        value="# Study tools"
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Show invisibles" }),
    )

    expect(
      screen.getByRole("button", { name: "Hide invisibles" }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveTextContent("#·Study·tools")
    expect(onChange).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole("button", { name: "Hide invisibles" }),
    )

    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveTextContent("# Study tools")
    expect(onChange).not.toHaveBeenCalled()
  })
})
