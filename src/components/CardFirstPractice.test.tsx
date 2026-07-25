import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getProblem } from "../content/problemBank"
import { resetCenterCardMemoryForTests } from "../guided/useCenterCard"
import { CardFirstPractice } from "./CardFirstPractice"

const problem = getProblem("l1-italic-paper-boat")

describe("CardFirstPractice", () => {
  beforeEach(() => {
    resetCenterCardMemoryForTests()
  })

  it("uses one centered card instead of Goal and answer pages", () => {
    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={vi.fn()}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    expect(
      screen.getByRole("region", { name: "Markdown syntax practice" }),
    ).toBeVisible()
    expect(screen.queryByRole("region", { name: "Goal" })).toBeNull()
    expect(screen.queryByRole("tablist")).toBeNull()
    expect(screen.queryByText("Your answer")).toBeNull()
  })

  it("grows the document one accepted mark at a time", () => {
    const onGrow = vi.fn()
    render(
      <CardFirstPractice
        draft=""
        interactive
        onComplete={vi.fn()}
        onGrow={onGrow}
        onMiss={vi.fn()}
        problem={problem}
        problemCompleted={false}
      />,
    )

    const firstBox = screen.getAllByRole("textbox")[0]!
    fireEvent.change(firstBox, { target: { value: "**" } })
    fireEvent.keyDown(document.activeElement ?? firstBox, { key: "Enter" })

    expect(onGrow).toHaveBeenCalledWith("*Paper boat*")
  })
})
