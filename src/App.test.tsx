import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { App } from "./App"

describe("App", () => {
  it("opens directly on a real Markdown exercise", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", { name: "Nabi Markdown" }),
    ).toBeVisible()
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Check" })).toBeVisible()
  })
})
