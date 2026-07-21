import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { defaultKeymap } from "@codemirror/commands"
import { searchKeymap, searchPanelOpen } from "@codemirror/search"
import { EditorView } from "@codemirror/view"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { resolveReadlineNavigationKeymap } from "./editorKeyboard"
import { deriveMarkdownBlankGuides } from "../content/plaintextStarter"
import { getProblemsForLevel } from "../content/problemBank"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"

describe("MarkdownSourceEditor", () => {
  it("presents only the writing surface without a second toolbar", () => {
    render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value=""
      />,
    )

    expect(screen.queryByText("answer.md")).toBeNull()
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toBeVisible()
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveAccessibleDescription(
      "Press Escape, then Tab to leave the editor.",
    )
    expect(
      screen.getByText("Press Escape, then Tab to leave the editor."),
    ).toHaveClass("visually-hidden")
    expect(
      screen.queryByRole("button", { name: "Show invisibles" }),
    ).toBeNull()
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
    expect(searchKeymap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Mod-f" }),
        expect.objectContaining({ key: "F3", shift: expect.any(Function) }),
        expect.objectContaining({ key: "Mod-g" }),
        expect.objectContaining({ key: "Mod-Alt-g" }),
      ]),
    )
  })

  it("opens search with Control+F before readline navigation can consume it", () => {
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

    fireEvent.keyDown(editor, { ctrlKey: true, key: "f" })

    expect(searchPanelOpen(view.state)).toBe(true)
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

  it("renders line-break and space marks without changing the source", async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        showInvisibles={false}
        value={"# Study tools\nNext"}
      />,
    )

    rerender(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        showInvisibles
        value={"# Study tools\nNext"}
      />,
    )

    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveTextContent("# Study tools↵Next↵")
    expect(onChange).not.toHaveBeenCalled()

    rerender(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        showInvisibles={false}
        value={"# Study tools\nNext"}
      />,
    )

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Your Markdown" }),
      ).toHaveTextContent("# Study toolsNext"),
    )
  })

  it("shows positional blank cells without putting answer marks in the document", async () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownSourceEditor
        blankGuides={{
          guides: [{ from: 0, markers: "##" }],
          starterText: "Study tools",
        }}
        onChange={onChange}
        onCheck={vi.fn()}
        value="Study tools"
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })
    const view = EditorView.findFromDOM(editor)
    expect(view).not.toBeNull()
    if (!view) return

    const cells = container.querySelectorAll(".cm-markdown-blank-guide__cell")
    expect(cells).toHaveLength(2)
    expect(container.querySelector(".cm-markdown-blank-guide")).toHaveTextContent(
      "",
    )
    expect(container.querySelector(".cm-markdown-blank-guide")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
    expect(view.state.doc.toString()).toBe("Study tools")
    expect(onChange).not.toHaveBeenCalled()

    view.dispatch({ changes: { from: 0, insert: "#" } })
    expect(
      container.querySelectorAll(".cm-markdown-blank-guide__cell"),
    ).toHaveLength(1)

    view.dispatch({ changes: { from: 1, insert: "# " } })
    await waitFor(() =>
      expect(container.querySelector(".cm-markdown-blank-guide")).toBeNull(),
    )
    expect(view.state.doc.toString()).toBe("## Study tools")
    expect(onChange).toHaveBeenLastCalledWith("## Study tools")

    view.dispatch({ changes: { from: 0, to: 3, insert: "" } })
    expect(
      container.querySelectorAll(".cm-markdown-blank-guide__cell"),
    ).toHaveLength(2)
    expect(view.state.doc.toString()).toBe("Study tools")
  })

  it("recognizes marks already present in a restored draft", () => {
    const { container } = render(
      <MarkdownSourceEditor
        blankGuides={{
          guides: [
            { from: 0, markers: "**" },
            { from: 5, markers: "**" },
          ],
          starterText: "Tools",
        }}
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value="**Tools**"
      />,
    )

    expect(container.querySelector(".cm-markdown-blank-guide")).toBeNull()
    expect(
      EditorView.findFromDOM(
        screen.getByRole("textbox", { name: "Your Markdown" }),
      )?.state.doc.toString(),
    ).toBe("**Tools**")
  })

  it("recognizes every mark already present in a restored composite draft", () => {
    const problem = getProblemsForLevel(3)[0]
    expect(problem).toBeDefined()
    if (!problem) return
    const { container } = render(
      <MarkdownSourceEditor
        blankGuides={{
          guides: deriveMarkdownBlankGuides(problem.target),
          starterText: problem.starterText,
        }}
        onChange={vi.fn()}
        onCheck={vi.fn()}
        value={problem.target}
      />,
    )

    expect(container.querySelector(".cm-markdown-blank-guide")).toBeNull()
  })

  it("shows leading and between-word source spaces as formatting dots", () => {
    const { container } = render(
      <MarkdownSourceEditor
        onChange={vi.fn()}
        onCheck={vi.fn()}
        showInvisibles
        value={"   nested item"}
      />,
    )

    const marks = container.querySelectorAll(".cm-invisible-character--space")
    expect(marks).toHaveLength(4)
    Array.from(marks).slice(0, 3).forEach((mark) => {
      expect(mark).toHaveTextContent("·")
      expect(mark).toHaveAttribute("aria-hidden", "true")
    })
    expect(marks[3]).toHaveClass("cm-invisible-character--word-space")
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveTextContent("···nested item↵")
  })

  it("shows distinct glyphs for NBSP and ideographic space", () => {
    const onChange = vi.fn()
    const { container } = render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        showInvisibles
        value={"#\u00a0Apple\u3000"}
      />,
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

  it("keeps Tab and Shift+Tab inside the focused word processor", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        showInvisibles
        value="item"
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })

    await user.click(editor)
    await user.keyboard("{Home}{Tab}")

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("\titem"))
    expect(editor).toHaveTextContent("→item↵")

    await user.keyboard("{Shift>}{Tab}{/Shift}")
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("item"))
  })

  it("does not deindent the first unselected line at a selection boundary", async () => {
    const onChange = vi.fn()
    render(
      <MarkdownSourceEditor
        onChange={onChange}
        onCheck={vi.fn()}
        value={"\tfirst\n\tsecond"}
      />,
    )
    const editor = screen.getByRole("textbox", { name: "Your Markdown" })
    const view = EditorView.findFromDOM(editor)
    expect(view).not.toBeNull()
    if (!view) return

    view.dispatch({ selection: { anchor: 0, head: 7 } })
    fireEvent.keyDown(editor, { key: "Tab", shiftKey: true })

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("first\n\tsecond"),
    )
  })
})
