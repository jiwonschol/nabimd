import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { entryChoices } from "./content/entryChoices"
import { getProblem } from "./content/problemBank"
import { App } from "./App"

async function openLevel(level: 1 | 2 | 3 | 4 | 5 = 1) {
  const user = userEvent.setup()
  render(<App />)
  const entry = entryChoices.find((choice) => choice.level === level)!
  await user.click(screen.getByRole("button", { name: entry.label }))
  const editor = screen.getByRole("textbox", { name: "Your Markdown" })
  return { user, editor, entry }
}

async function replaceSource(
  user: ReturnType<typeof userEvent.setup>,
  editor: HTMLElement,
  source: string,
) {
  await user.click(editor)
  await user.keyboard("{Control>}a{/Control}{Backspace}")
  if (source) await user.keyboard(source)
}

function currentProblem() {
  const writeTab = screen.getByRole("tab", { name: "Write" })
  const panelId = writeTab.getAttribute("aria-controls")
  if (!panelId?.startsWith("write-panel-")) {
    throw new Error("The active Write tab must identify its problem")
  }
  return getProblem(panelId.slice("write-panel-".length))
}

function currentSkill() {
  return currentProblem().skillIds[0]
}

function validDifferentProse() {
  switch (currentSkill()) {
    case "blockquote":
      return "> completely different words"
    case "bold-emphasis":
      return "**completely different words**"
    case "inline-code":
      return "Use `completely different words`."
    case "links":
      return "Use [completely different words](/changed)."
    case "unordered-list":
      return "- Alpha\n- Bravo\n- Charlie"
    case "ordered-list":
      return "1. Alpha\n2. Bravo\n3. Charlie"
    default:
      return "# completely different words"
  }
}

function malformedSource() {
  switch (currentSkill()) {
    case "blockquote":
      return "Plain words without a blockquote"
    case "bold-emphasis":
      return "**No closing"
    case "inline-code":
      return "`No closing"
    case "links":
      return "[No closing](/path"
    case "unordered-list":
      return "-No space\n-Also malformed\n-Still malformed"
    case "ordered-list":
      return "1.No space\n2.Also malformed\n3.Still malformed"
    default:
      return "#No space"
  }
}

function validRepair() {
  switch (currentSkill()) {
    case "blockquote":
      return "> repaired"
    case "bold-emphasis":
      return "**repaired**"
    case "inline-code":
      return "Use `repaired`."
    case "links":
      return "Use [repaired](/path)."
    case "unordered-list":
      return "- One\n- Two\n- Three"
    case "ordered-list":
      return "1. One\n2. Two\n3. Three"
    default:
      return "# repaired"
  }
}

function matchedWithReview() {
  switch (currentSkill()) {
    case "blockquote":
      return "> one\n\nBridge text.\n\n> two"
    case "bold-emphasis":
      return "**one** and **two**"
    case "inline-code":
      return "Use `one` then `two`."
    case "links":
      return "Use [one](/one) then [two](/two)."
    case "unordered-list":
      return "- One\n- Two\n- Three\n\nBridge text.\n\n- Four\n- Five\n- Six"
    case "ordered-list":
      return "1. One\n2. Two\n3. Three\n\nBridge text.\n\n1. Four\n2. Five\n3. Six"
    default:
      return "# one\n\n# two"
  }
}

describe("App", () => {
  it("greets a fresh session with the definitive five-level ladder", () => {
    render(<App />)
    expect(screen.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
    for (const entry of entryChoices) {
      expect(screen.getByRole("button", { name: entry.label })).toBeVisible()
    }
    expect(screen.queryByRole("textbox", { name: "Your Markdown" })).toBeNull()
  })

  it("enters any selected level directly and starts its six-problem turn", async () => {
    for (const entry of entryChoices) {
      window.sessionStorage.clear()
      const view = render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: entry.label }))
      const expectedLength = entry.level === 5 ? 4 : 6
      expect(screen.getByLabelText("Practice progress")).toHaveTextContent(
        `1 of ${expectedLength}`,
      )
      expect(screen.getByLabelText(entry.label)).toBeVisible()
      expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
      view.unmount()
    }
  })

  it("shows teaching automatically at the start of every chosen level", async () => {
    const first = await openLevel(1)
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    expect(
      within(screen.getByRole("complementary", { name: "Hint" })).getAllByText(
        currentProblem().syntaxTokens[0]!,
      )[0],
    ).toBeVisible()
    await first.user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    await first.user.click(screen.getByRole("button", { name: entryChoices[1].label }))
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
  })

  it("keeps the selected task identity visible in the exercise header", async () => {
    await openLevel(2)
    expect(screen.getByLabelText("Practice progress")).toHaveTextContent(
      "Level 2 — Rebuild real documents",
    )
  })

  it("routes Levels 1–2 to a visible target and Levels 3–5 to a brief", async () => {
    const targetView = await openLevel(2)
    const targetGoal = screen.getByRole("region", { name: "Goal" })
    expect(targetGoal).toHaveTextContent("Make this document")
    expect(targetGoal.querySelector(".rendered-document__body")).not.toBeNull()

    await targetView.user.click(
      screen.getByRole("button", { name: "Nabi Markdown home" }),
    )
    await targetView.user.click(
      screen.getByRole("button", { name: entryChoices[2].label }),
    )
    const briefProblem = currentProblem()
    const briefGoal = screen.getByRole("region", { name: "Goal" })
    expect(briefGoal).toHaveTextContent("Build from this brief")
    expect(briefGoal).toHaveTextContent(briefProblem.prompt)
    expect(briefGoal.querySelector(".rendered-document__body")).toBeNull()
    expect(briefGoal).not.toHaveTextContent(briefProblem.target.split("\n")[0]!)
  })

  it("checks only on explicit action and accepts different prose", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(validDifferentProse())
    expect(screen.queryByRole("status")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Check" }))
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
  })

  it.each([
    { modifier: "Command", event: { key: "Enter", metaKey: true } },
    { modifier: "Control", event: { key: "Enter", ctrlKey: true } },
  ])("checks with $modifier + Enter", async ({ event }) => {
    const { user, editor } = await openLevel(1)
    await user.click(editor)
    await user.keyboard(validDifferentProse())
    fireEvent.keyDown(editor, event)
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
  })

  it("moves focus Check → Next → editor", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(validDifferentProse())
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus()

    await user.keyboard(" ")
    expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
    expect(screen.getByLabelText("Practice progress")).toHaveTextContent("2 of 6")
  })

  it("keeps Next unavailable and opens beginner Review after Try again", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(malformedSource())
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull()
    expect(screen.getByRole("button", { name: "Check again" })).toBeVisible()
    const review = screen.getByRole("tabpanel", { name: "Review" })
    expect(review).toHaveTextContent("How it should look")
    expect(review).toHaveTextContent("How to fix it")
    expect(review.querySelectorAll(".rendered-document__body")).toHaveLength(2)
    expect(review.querySelector("pre")).toBeNull()
    expect(review).not.toHaveTextContent("Diff")
    expect(editor).not.toHaveFocus()
  })

  it("does not reveal the canonical answer after a high-level failure", async () => {
    const { user } = await openLevel(3)
    const problem = currentProblem()

    await user.click(screen.getByRole("button", { name: "Check" }))

    const review = screen.getByRole("tabpanel", { name: "Review" })
    expect(review).not.toHaveTextContent("How it should look")
    expect(review).not.toHaveTextContent(problem.target.split("\n")[0]!)
    expect(review.querySelectorAll(".rendered-document__body")).toHaveLength(1)
  })

  it("keeps Markdown-structure Review optional after Matched", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(matchedWithReview())
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible()
    expect(screen.getByRole("tabpanel", { name: "Review" })).toHaveTextContent(
      currentProblem().editorialChecks[0]!.review,
    )
  })

  it("uses a different same-level problem after repair", async () => {
    const { user, editor } = await openLevel(2)
    const originalGoal = screen.getByRole("region", { name: "Goal" }).textContent
    await user.keyboard(malformedSource())
    await user.click(screen.getByRole("button", { name: "Check" }))
    await user.keyboard("{Alt>}1{/Alt}")
    await replaceSource(user, editor, validRepair())
    await user.click(screen.getByRole("button", { name: "Check again" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(
      originalGoal,
    )
    expect(screen.getByLabelText(entryChoices[1].label)).toBeVisible()
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("uses one fixed bar and exactly two workspace panels", async () => {
    await openLevel(5)
    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Try another" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Hint" })).toBeVisible()
    expect(screen.getByRole("region", { name: "Goal" })).toHaveClass("cbt-panel")
    expect(screen.getByRole("region", { name: "Your answer" })).toHaveClass("cbt-panel")
    expect(screen.queryByRole("region", { name: "Live preview" })).toBeNull()
    expect(screen.queryByRole("contentinfo")).toBeNull()
  })

  it("switches Write and Preview without consuming editor Tab", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("# Preview words")
    const writeTab = screen.getByRole("tab", { name: "Write" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    await user.keyboard("{Alt>}2{/Alt}")
    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(previewTab).toHaveFocus()
    expect(screen.getByRole("tabpanel", { name: "Preview" })).toHaveTextContent(
      "Preview words",
    )
    await user.keyboard("{ArrowRight}")
    expect(writeTab).toHaveFocus()
    await user.keyboard("{Alt>}1{/Alt}")
    expect(editor).toHaveFocus()
  })

  it("returns home and can reissue content at the same step", async () => {
    const { user } = await openLevel(3)
    const original = screen.getByRole("region", { name: "Goal" }).textContent
    await user.click(screen.getByRole("button", { name: "Try another" }))
    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(original)
    expect(screen.getByLabelText("Practice progress")).toHaveTextContent("1 of 6")

    await user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    expect(screen.getByRole("heading", { name: "Welcome. Choose where to begin." })).toBeVisible()
  })

  it("completes a run and offers all replay choices", async () => {
    const { user } = await openLevel(1)
    for (let index = 0; index < 6; index += 1) {
      const editor = screen.getByRole("textbox", { name: "Your Markdown" })
      await replaceSource(user, editor, currentProblem().target)
      await user.click(screen.getByRole("button", { name: "Check" }))
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    expect(screen.getByRole("button", { name: "Practice again" })).toHaveFocus()
    expect(screen.getByLabelText("Level 1 — Learn the syntax")).toBeVisible()
    expect(screen.getByRole("button", { name: "Start over" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()
  })
})
