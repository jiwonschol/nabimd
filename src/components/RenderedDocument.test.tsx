import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RenderedDocumentBody } from "./RenderedDocument"

const englishImage = (alt: string) => `[Image: ${alt || "image"}]`

/** A labelled region around the body, the way the screens place it. */
function RenderedDocument({
  label,
  source,
  emptyMessage,
}: {
  label: string
  source: string
  emptyMessage?: string
}) {
  return (
    <section aria-label={label} className="rendered-document">
      <RenderedDocumentBody
        emptyMessage={emptyMessage}
        imageLabel={englishImage}
        source={source}
      />
    </section>
  )
}

describe("RenderedDocument", () => {
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
})
