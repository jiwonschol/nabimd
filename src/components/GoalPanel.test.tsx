import { render, screen, within } from "@testing-library/react"
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { describe, expect, it } from "vitest"
import { getProblem, getProblemsForLevel } from "../content/problemBank"
import { GoalPanel } from "./GoalPanel"

describe("GoalPanel", () => {
  it("shows the learner instruction instead of an unexplained Goal icon", () => {
    const problem = getProblemsForLevel(1)[0]

    if (!problem) throw new Error("Level 1 must contain a problem")

    const { container } = render(<GoalPanel problem={problem} />)

    expect(
      screen.getByRole("heading", { level: 2, name: problem.prompt }),
    ).toBeVisible()
    expect(container.querySelector(".goal-panel .panel-icon")).toBeNull()
    expect(container.querySelector(".writing-processor")).toHaveAttribute(
      "data-leading-blank-rows",
      "2",
    )
  })

  it("starts higher-level Goal documents on the first row", () => {
    const problem = getProblemsForLevel(3)[0]

    if (!problem) throw new Error("Level 3 must contain a problem")

    const { container } = render(<GoalPanel problem={problem} />)

    expect(container.querySelector(".writing-processor")).not.toHaveAttribute(
      "data-leading-blank-rows",
    )
  })

  it("also reserves the first two Goal rows throughout Level 2", () => {
    const problem = getProblemsForLevel(2)[0]

    if (!problem) throw new Error("Level 2 must contain a problem")

    const { container } = render(<GoalPanel problem={problem} />)

    expect(container.querySelector(".writing-processor")).toHaveAttribute(
      "data-leading-blank-rows",
      "2",
    )
  })

  it("shows source-backed leading spaces in the rendered Goal", () => {
    const problem = getProblem("l2-nested-steps-laundry-routine")
    const { container } = render(<GoalPanel problem={problem} />)

    const marks = container.querySelectorAll(
      ".cm-invisible-character--space",
    )
    expect(marks).toHaveLength(23)
    expect(
      container.querySelectorAll(".cm-invisible-character--word-space"),
    ).toHaveLength(17)
    expect(
      Array.from(marks)
        .filter(
          (mark) =>
            !mark.classList.contains("cm-invisible-character--word-space"),
        )
        .map((mark) => mark.textContent)
        .join(""),
    ).toBe("······")
  })

  it("uses the shared CodeMirror word processor without collapsing source rows", () => {
    const problem = getProblem("l2-code-block-bus-reference")
    const { container } = render(<GoalPanel problem={problem} />)

    const processor = container.querySelector(
      '.markdown-word-processor[data-presentation="rendered"]',
    )
    expect(processor).not.toBeNull()

    const editor = container.querySelector<HTMLElement>(".cm-content")
    expect(editor).not.toBeNull()
    if (!editor) return

    const view = EditorView.findFromDOM(editor)
    expect(view).not.toBeNull()
    if (!view) return

    expect(view.state.doc.toString()).toBe(problem.target)
    expect(view.state.doc.lines).toBe(problem.target.split("\n").length)
    expect(view.state.facet(EditorState.readOnly)).toBe(true)
    expect(editor).toHaveAttribute("contenteditable", "false")

    const rows = Array.from(container.querySelectorAll(".cm-line"))
    expect(rows).toHaveLength(8)
    expect(rows[0]).toHaveTextContent("Bus card↵")
    expect(rows[3]).toHaveTextContent("Route 8↵")
    expect(rows[6]).toHaveTextContent("North stop↵")
    expect(rows[7]).toHaveTextContent("Main Street↵")
    for (const index of [1, 2, 4, 5]) {
      expect(rows[index]).toHaveTextContent(/^↵$/)
    }
    expect(
      container.querySelectorAll(".cm-rendered-widget--fence"),
    ).toHaveLength(2)
    expect(
      container.querySelectorAll(".cm-rendered-widget--list"),
    ).toHaveLength(2)
  })

  it("keeps the rendered structure available without adding a second visual editor", () => {
    const problem = getProblem("l2-code-block-bus-reference")
    const { container } = render(<GoalPanel problem={problem} />)

    const semanticDocument = screen.getByRole("document", {
      name: "Goal document rendered structure",
    })
    expect(within(semanticDocument).getByRole("heading", { name: "Bus card" }))
      .toBeInTheDocument()
    expect(within(semanticDocument).getByRole("list")).toBeInTheDocument()
    expect(
      container.querySelectorAll('.markdown-word-processor[data-presentation="rendered"]'),
    ).toHaveLength(1)
  })
})
