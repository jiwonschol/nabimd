import { fireEvent, render, screen } from "@testing-library/react"
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
})
