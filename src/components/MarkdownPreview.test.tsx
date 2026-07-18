import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MarkdownPreview } from "./MarkdownPreview"

describe("MarkdownPreview", () => {
  it("does not load image URLs from learner Markdown", () => {
    render(
      <MarkdownPreview
        source="![tracking pixel](https://example.com/pixel.png)"
        label="Your preview"
        variant="learner"
      />,
    )

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("[Image: tracking pixel]")).toBeVisible()
  })
})
