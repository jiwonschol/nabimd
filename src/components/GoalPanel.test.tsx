import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { getProblemsForLevel } from "../content/problemBank"
import { GoalPanel } from "./GoalPanel"

describe("GoalPanel", () => {
  it("shows the learner instruction instead of an unexplained Goal icon", () => {
    const problem = getProblemsForLevel(1)[0]

    if (!problem) throw new Error("Level 1 must contain a problem")

    const { container } = render(<GoalPanel problem={problem} />)

    expect(screen.getByText(problem.prompt)).toBeVisible()
    expect(container.querySelector(".goal-panel .panel-icon")).toBeNull()
  })
})
