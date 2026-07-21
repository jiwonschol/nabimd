import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"
import { RenderedDocumentBody } from "./RenderedDocument"
import { WritingProcessor } from "./WritingProcessor"

describe("WritingProcessor", () => {
  it("owns the rows and content for both read-only and edit modes", () => {
    const { container } = render(
      <>
        <WritingProcessor
          contentVersion="# Reading plan"
          label="Goal document"
          mode="read-only"
        >
          <RenderedDocumentBody source="# Reading plan" />
        </WritingProcessor>
        <WritingProcessor
          contentVersion=""
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

  it("owns document navigation keys in read-only mode", () => {
    render(
      <WritingProcessor
        contentVersion="Long goal"
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
        contentVersion="A prefilled document"
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
})
