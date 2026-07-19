import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RenderedDocument } from "./RenderedDocument"

describe("RenderedDocument", () => {
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

  it("never loads media from Markdown source", () => {
    render(
      <RenderedDocument
        label="Live preview"
        source="![tracking pixel](https://example.com/pixel.png)"
      />,
    )

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("[Image: tracking pixel]")).toBeVisible()
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
})
