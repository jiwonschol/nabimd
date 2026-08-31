import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { derivePlaintextStarter } from "../content/plaintextStarter"
import {
  RenderedDocument,
  RenderedDocumentBody,
} from "./RenderedDocument"

describe("RenderedDocument", () => {
  it("renders an angle-bracket FTP target as a link but its starter as text", () => {
    const target = "Open <ftp://example.com/help>."
    const { container, rerender } = render(
      <RenderedDocumentBody source={target} />,
    )

    expect(container.querySelectorAll(".rendered-document__link")).toHaveLength(1)
    rerender(
      <RenderedDocumentBody source={derivePlaintextStarter(target)} />,
    )
    expect(container.querySelectorAll(".rendered-document__link")).toHaveLength(0)
  })

  it("shows a link title in the Goal while its plaintext starter omits it", () => {
    const target = '[Setup notes](https://example.com "Details")'
    const { container, rerender } = render(
      <RenderedDocumentBody source={target} />,
    )

    expect(container.querySelector(".rendered-document__link-title"))
      .toHaveTextContent("(Details)")
    expect(container).toHaveTextContent("Setup notes (Details)")

    rerender(
      <RenderedDocumentBody source={derivePlaintextStarter(target)} />,
    )
    expect(container.querySelector(".rendered-document__link-title")).toBeNull()
    expect(container).toHaveTextContent("Setup notes")
    expect(container).not.toHaveTextContent("Details")
  })

  it("uses one paper surface for Goal and Live preview", () => {
    const { rerender } = render(
      <RenderedDocument label="Goal" source="# Apple" />,
    )

    const goal = screen.getByRole("region", { name: "Goal" })
    expect(goal).toHaveClass("rendered-document")
    expect(goal).toHaveTextContent("Apple")

    rerender(<RenderedDocument label="Live preview" source="# Apple" />)

    const preview = screen.getByRole("region", { name: "Live preview" })
    expect(preview).toHaveClass("rendered-document")
    expect(preview.className).toBe(goal.className)
  })

  it("shows a quiet empty state without turning it into Markdown", () => {
    render(
      <RenderedDocument
        emptyMessage="Your preview will appear here."
        label="Live preview"
        source=""
      />,
    )

    expect(
      screen.getByText("Your preview will appear here."),
    ).toHaveClass("rendered-document__empty")
    expect(
      screen.getByRole("region", { name: "Live preview" }),
    ).not.toContainHTML("<p>Your preview will appear here.</p>")
  })

  it("exposes image alt text without loading remote media", () => {
    render(
      <RenderedDocument
        label="Live preview"
        source="![tracking pixel](https://example.com/pixel.png)"
      />,
    )

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    const placeholder = screen.getByText("[Image: tracking pixel]")
    expect(placeholder).toBeVisible()
    expect(placeholder).not.toHaveAttribute("aria-hidden")
    expect(
      screen.getByRole("region", { name: "Live preview" }),
    ).toHaveTextContent("[Image: tracking pixel]")
  })

  it.each([
    { label: "Safe", source: "[Safe](https://example.com/guide)" },
    {
      label: "Reference",
      source: "[Reference][guide]\n\n[guide]: https://example.com/guide",
    },
    { label: "Unsafe", source: "[Unsafe](javascript:alert(1))" },
  ])("renders Markdown links without navigable destinations", ({ label, source }) => {
    render(
      <RenderedDocument
        label="Live preview"
        source={source}
      />,
    )

    expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument()
    const renderedLabel = screen.getByText(label)
    expect(renderedLabel).toHaveClass("rendered-document__link")
    expect(renderedLabel.tagName).toBe("SPAN")
    expect(renderedLabel).not.toHaveAttribute("href")
  })

  it("keeps blockquotes visibly addressable across nested quote structures", () => {
    const { container, rerender } = render(
      <RenderedDocument
        label="Goal"
        source={"> A quoted note.\n>\n> > A nested quote.\n>\n> # Quoted heading"}
      />,
    )

    const goalQuotes = container.querySelectorAll("blockquote")
    expect(goalQuotes).toHaveLength(2)
    expect(goalQuotes[0]).toHaveClass("rendered-document__quote")
    expect(goalQuotes[1]).toHaveClass("rendered-document__quote")
    expect(
      screen.getByRole("heading", { level: 1, name: "Quoted heading" }),
    ).toBeInTheDocument()

    rerender(
      <RenderedDocument
        label="My answer"
        source={"> A quoted note.\n>\n> > A nested quote.\n>\n> # Quoted heading"}
      />,
    )

    expect(container.querySelectorAll("blockquote.rendered-document__quote"))
      .toHaveLength(2)
  })

  it("renders the Devpost extended Markdown used in Preview", () => {
    const { container } = render(
      <RenderedDocument
        label="My answer"
        source={[
          "~~Archived~~",
          "",
          "- [x] Verified",
          "",
          "| Item | Owner |",
          "| --- | --- |",
          "| Release | Nabi |",
          "",
          "A note.[^1]",
          "",
          "[^1]: Kept with the document.",
        ].join("\n")}
      />,
    )

    expect(container.querySelector("del")).toHaveTextContent("Archived")
    expect(container.querySelector('input[type="checkbox"]')).toBeChecked()
    expect(container.querySelector("table")).toHaveTextContent("Release")
    expect(container.querySelector("[data-footnotes]")).toHaveTextContent(
      "Kept with the document.",
    )
  })

  it("marks level 5 and level 6 headings on the teacher's returned page", () => {
    render(
      <RenderedDocumentBody
        corrections={
          new Map([
            [1, [1]],
            [3, [2]],
          ])
        }
        source={"##### Shelf note\n\n###### Final detail"}
      />,
    )

    expect(
      screen.getByRole("heading", { level: 5, name: /Shelf note/ }),
    ).toHaveAttribute("data-corrected", "true")
    expect(
      screen.getByRole("heading", { level: 6, name: /Final detail/ }),
    ).toHaveAttribute("data-corrected", "true")
  })

  it("uses a valid block wrapper when marking a thematic break", () => {
    const { container } = render(
      <RenderedDocumentBody
        corrections={new Map([[3, [1]]])}
        source={"Before\n\n---\n\nAfter"}
      />,
    )

    const markedBreak = container.querySelector(".rendered-document__break")
    expect(markedBreak?.tagName).toBe("DIV")
    expect(markedBreak).toHaveAttribute("data-corrected", "true")
    expect(markedBreak?.querySelector("hr")).toBeInTheDocument()
  })

  it("gives each visible correction number explicit accessible text", () => {
    render(
      <RenderedDocumentBody
        corrections={new Map([[1, [3]]])}
        source="# Marked heading"
      />,
    )

    expect(screen.getByText("Correction 3")).toHaveClass("visually-hidden")
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true")
  })

})
