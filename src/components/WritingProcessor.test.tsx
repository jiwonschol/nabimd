import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  MarkdownSourceEditor,
  MarkdownWordProcessor,
} from "./MarkdownSourceEditor"
import { RenderedDocumentBody } from "./RenderedDocument"
import { WritingProcessor } from "./WritingProcessor"

describe("WritingProcessor", () => {
  it("owns the rows and content for both read-only and edit modes", () => {
    const { container } = render(
      <>
        <WritingProcessor
          label="Goal document"
          mode="read-only"
        >
          <RenderedDocumentBody source="# Reading plan" />
        </WritingProcessor>
        <WritingProcessor
          label="Your Markdown"
          mode="edit"
        >
          <MarkdownSourceEditor
            onChange={vi.fn()}
            onCheck={vi.fn()}
            value=""
          />
        </WritingProcessor>
      </>,
    )

    const processors = container.querySelectorAll(".writing-processor")
    expect(processors).toHaveLength(2)
    processors.forEach((processor) => {
      expect(processor.querySelector(".writing-processor__rows")).not.toBeNull()
      expect(processor.querySelector(".writing-processor__content")).not.toBeNull()
    })
    expect(screen.getByRole("textbox", { name: "Goal document" })).toHaveAttribute(
      "aria-readonly",
      "true",
    )
    expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveAttribute(
      "contenteditable",
      "true",
    )
  })

  it("reserves real processor rows before low-level document content", () => {
    const { container } = render(
      <WritingProcessor
        label="Goal document"
        leadingBlankRows={2}
        mode="read-only"
      >
        <RenderedDocumentBody source="# Reading plan" />
      </WritingProcessor>,
    )

    const processor = container.querySelector(".writing-processor")
    expect(processor).toHaveAttribute("data-leading-blank-rows", "2")
  })

  it("owns document navigation keys in read-only mode", () => {
    render(
      <WritingProcessor
        label="Goal document"
        mode="read-only"
      >
        <RenderedDocumentBody source="Long goal" />
      </WritingProcessor>,
    )
    const sheet = screen.getByRole("textbox", { name: "Goal document" })
    Object.defineProperties(sheet, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 1600 },
    })

    fireEvent.keyDown(sheet, { key: "PageDown" })
    expect(sheet.scrollTop).toBe(360)
    fireEvent.keyDown(sheet, { key: "Home", metaKey: true })
    expect(sheet.scrollTop).toBe(0)
    fireEvent.keyDown(sheet, { key: "End", metaKey: true })
    expect(sheet.scrollTop).toBe(1600)
  })

  it("syncs rows when the edit scroller mounts after the processor", async () => {
    const { container } = render(
      <WritingProcessor
        label="Your Markdown"
        mode="edit"
      >
        <MarkdownSourceEditor
          onChange={vi.fn()}
          onCheck={vi.fn()}
          value="A prefilled document"
        />
      </WritingProcessor>,
    )

    await screen.findByRole("textbox", { name: "Your Markdown" })
    const scroller = container.querySelector<HTMLElement>(".cm-scroller")
    const rows = container.querySelector<HTMLElement>(
      ".writing-processor__rows",
    )
    expect(scroller).not.toBeNull()
    expect(rows).not.toBeNull()

    scroller!.scrollTop = 240
    fireEvent.scroll(scroller!)

    await waitFor(() => {
      expect(rows).toHaveStyle({ transform: "translateY(-240px)" })
    })
  })

  it("uses the same scroller and gutter synchronization in rendered read-only mode", async () => {
    const { container } = render(
      <WritingProcessor
        engine="codemirror"
        label="Goal document"
        mode="read-only"
      >
        <MarkdownWordProcessor
          active={false}
          label="Goal document"
          presentation="rendered"
          readOnly
          showInvisibles
          value={"# Bus card\n\n```\nRoute 8\n```\n\n- North stop\n- Main Street"}
        />
      </WritingProcessor>,
    )

    const processor = await screen.findByRole("region", {
      name: "Goal document",
    })
    const scroller = container.querySelector<HTMLElement>(".cm-scroller")
    const editor = container.querySelector<HTMLElement>(".cm-content")
    const rows = container.querySelector<HTMLElement>(
      ".writing-processor__rows",
    )
    expect(processor).toHaveAttribute("tabindex", "0")
    expect(editor).toHaveAttribute("contenteditable", "false")
    expect(editor).toHaveAttribute("aria-hidden", "true")
    expect(scroller).not.toBeNull()
    expect(rows).not.toBeNull()

    scroller!.scrollTop = 160
    fireEvent.scroll(scroller!)

    await waitFor(() => {
      expect(rows).toHaveStyle({ transform: "translateY(-160px)" })
    })
  })

  it("lets keyboard-only learners scroll the read-only word processor", async () => {
    const { container } = render(
      <WritingProcessor
        engine="codemirror"
        label="Goal document"
        mode="read-only"
      >
        <MarkdownWordProcessor
          active={false}
          label="Goal document"
          presentation="rendered"
          readOnly
          value={"# Long goal\n\nOne\n\nTwo\n\nThree"}
        />
      </WritingProcessor>,
    )

    const processor = await screen.findByRole("region", {
      name: "Goal document",
    })
    const scroller = container.querySelector<HTMLElement>(".cm-scroller")
    expect(scroller).not.toBeNull()
    Object.defineProperty(scroller!, "clientHeight", {
      configurable: true,
      value: 400,
    })

    fireEvent.keyDown(processor, { key: "PageDown" })
    expect(scroller!.scrollTop).toBe(360)
    fireEvent.keyDown(processor, { key: "PageUp" })
    expect(scroller!.scrollTop).toBe(0)
  })

  it("keeps one editor scroll subscription while controlled text changes", async () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <WritingProcessor
        label="Your Markdown"
        mode="edit"
      >
        <MarkdownSourceEditor
          onChange={onChange}
          onCheck={vi.fn()}
          value="first"
        />
      </WritingProcessor>,
    )
    await screen.findByRole("textbox", { name: "Your Markdown" })
    const scroller = container.querySelector<HTMLElement>(".cm-scroller")
    expect(scroller).not.toBeNull()
    const addEventListener = vi.spyOn(scroller!, "addEventListener")

    rerender(
      <WritingProcessor
        label="Your Markdown"
        mode="edit"
      >
        <MarkdownSourceEditor
          onChange={onChange}
          onCheck={vi.fn()}
          value="second"
        />
      </WritingProcessor>,
    )

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Your Markdown" }),
      ).toHaveTextContent("second"),
    )
    expect(addEventListener).not.toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      expect.anything(),
    )
  })
})
