import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { defaultKeymap } from "@codemirror/commands"
import { EditorView } from "@codemirror/view"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { resolveReadlineNavigationKeymap } from "./editorKeyboard"
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
    expect(
      screen.getByRole("region", { name: "Your Markdown" }),
    ).not.toHaveAttribute("data-e2e-document")
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

  it("checks with the universal Control plus Enter shortcut", () => {
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

    expect(onCheck).toHaveBeenCalledOnce()
  })

  it("consumes a repeated action shortcut without checking again", () => {
    const onCheck = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={onCheck}
        value="# Apple"
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })

    fireEvent.keyDown(editor, {
      key: "Enter",
      ctrlKey: true,
      repeat: true,
    })

    expect(onCheck).not.toHaveBeenCalled()
  })

  it("adds only the readline motions missing from each platform default", () => {
    expect(
      resolveReadlineNavigationKeymap({ platform: "MacIntel" }).map(
        ({ key }) => key,
      ),
    ).toEqual(["Alt-f", "Alt-b"])
    expect(
      resolveReadlineNavigationKeymap({ platform: "Linux x86_64" }).map(
        ({ key }) => key,
      ),
    ).toEqual(["Ctrl-a", "Ctrl-e", "Ctrl-f", "Ctrl-b", "Alt-f", "Alt-b"])

    expect(defaultKeymap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Mod-Home" }),
        expect.objectContaining({ key: "Mod-End" }),
        expect.objectContaining({ mac: "Ctrl-a" }),
        expect.objectContaining({ mac: "Ctrl-e" }),
        expect.objectContaining({ mac: "Ctrl-f" }),
        expect.objectContaining({ mac: "Ctrl-b" }),
      ]),
    )
  })

  it("executes line, character, and word motions without editing the document", () => {
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value={"alpha beta\ngamma delta"}
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })
    const view = EditorView.findFromDOM(editor)
    expect(view).not.toBeNull()
    if (!view) return

    const bindings = resolveReadlineNavigationKeymap({ platform: "Linux" })
    const run = (key: string) => {
      const binding = bindings.find((candidate) => candidate.key === key)
      expect(binding?.run).toBeTypeOf("function")
      binding?.run?.(view)
    }

    view.dispatch({ selection: { anchor: 17 } })
    run("Ctrl-a")
    expect(view.state.selection.main.head).toBe(11)
    run("Ctrl-e")
    expect(view.state.selection.main.head).toBe(22)
    run("Ctrl-b")
    expect(view.state.selection.main.head).toBe(21)
    run("Ctrl-f")
    expect(view.state.selection.main.head).toBe(22)

    view.dispatch({ selection: { anchor: 11 } })
    run("Alt-f")
    expect(view.state.selection.main.head).toBeGreaterThan(11)
    run("Alt-b")
    expect(view.state.selection.main.head).toBe(11)
    expect(view.state.doc.toString()).toBe("alpha beta\ngamma delta")
  })

  it("recognizes macOS Option word motions by physical key code", () => {
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value="alpha beta"
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })
    const view = EditorView.findFromDOM(editor)
    expect(view).not.toBeNull()
    if (!view) return

    const fallback = resolveReadlineNavigationKeymap({
      platform: "MacIntel",
    }).find((binding) => binding.any)?.any
    expect(fallback).toBeTypeOf("function")

    view.dispatch({ selection: { anchor: view.state.doc.length } })
    expect(
      fallback?.(
        view,
        {
          altKey: true,
          code: "KeyB",
          ctrlKey: false,
          key: "∫",
          metaKey: false,
          shiftKey: false,
        } as KeyboardEvent,
      ),
    ).toBe(true)
    expect(view.state.selection.main.head).toBeLessThan(view.state.doc.length)

    expect(
      fallback?.(
        view,
        {
          altKey: true,
          code: "KeyF",
          ctrlKey: false,
          key: "ƒ",
          metaKey: false,
          shiftKey: false,
        } as KeyboardEvent,
      ),
    ).toBe(true)
    expect(view.state.selection.main.head).toBe(view.state.doc.length)
  })

  it("owns caret shortcuts at document boundaries", () => {
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value="alpha beta"
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })
    const view = EditorView.findFromDOM(editor)
    expect(view).not.toBeNull()
    if (!view) return

    view.dispatch({ selection: { anchor: 0 } })
    const lineStart = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: "a",
    })
    editor.dispatchEvent(lineStart)
    expect(lineStart.defaultPrevented).toBe(true)
    expect(view.state.selection.main).toMatchObject({ anchor: 0, head: 0 })

    view.dispatch({ selection: { anchor: view.state.doc.length } })
    const wordForward = new KeyboardEvent("keydown", {
      altKey: true,
      bubbles: true,
      cancelable: true,
      code: "KeyF",
      key: "ƒ",
    })
    editor.dispatchEvent(wordForward)
    expect(wordForward.defaultPrevented).toBe(true)
    expect(view.state.selection.main).toMatchObject({
      anchor: view.state.doc.length,
      head: view.state.doc.length,
    })
    expect(view.state.doc.toString()).toBe("alpha beta")
  })

  it("keeps plain Enter as a newline instead of an action", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCheck = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={onCheck}
        value=""
      />,
    )

    await user.keyboard("one{Enter}two")

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("one\ntwo"))
    expect(onCheck).not.toHaveBeenCalled()
  })

  it("places text focus in the editor and inserts Space as source text", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        value=""
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })

    expect(editor).toHaveFocus()
    await user.keyboard("# Apple")

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("# Apple"))
  })

  it("does not steal focus when it mounts as an inactive view", () => {
    const beforeEditor = document.createElement("button")
    beforeEditor.textContent = "Before editor"
    document.body.append(beforeEditor)
    beforeEditor.focus()

    render(
      <MarkdownSourceEditor
        active={false}
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value=""
      />,
    )

    expect(beforeEditor).toHaveFocus()
    beforeEditor.remove()
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

  it("shows distinct glyphs for NBSP and ideographic space", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        value={"#\u00a0Apple\u3000"}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Show invisibles" }),
    )

    expect(
      container.querySelector(".cm-invisible-character--non-breaking-space"),
    ).toHaveTextContent("⍽")
    expect(
      container.querySelector(".cm-invisible-character--ideographic-space"),
    ).toHaveTextContent("□")
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveTextContent("#⍽Apple□")
    expect(onChange).not.toHaveBeenCalled()
  })
})
