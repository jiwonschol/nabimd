import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { EditorView } from "@codemirror/view"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { entryChoices } from "./content/entryChoices"
import { getProblem } from "./content/problemBank"
import { playPageTurnSound } from "./sound/pageTurnSound"
import { App } from "./App"

vi.mock("./sound/pageTurnSound", () => ({
  playPageTurnSound: vi.fn(),
}))

afterEach(() => {
  vi.mocked(playPageTurnSound).mockClear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

async function openLevel(level: 1 | 2 | 3 | 4 | 5 = 1) {
  const user = userEvent.setup()
  render(<App />)
  const entry = entryChoices.find((choice) => choice.level === level)!
  await user.click(screen.getByRole("button", { name: entry.label }))
  const editor = screen.getByRole("textbox", { name: "Your Markdown" })
  return { user, editor, entry }
}

function replaceSource(editor: HTMLElement, source: string) {
  const view = EditorView.findFromDOM(editor)
  if (!view) throw new Error("Expected a mounted CodeMirror editor")

  act(() => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: source },
      selection: { anchor: source.length },
    })
  })
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
  if (currentProblem().skillIds.length > 1) return "# broken"
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
  if (currentProblem().skillIds.length > 1) return currentProblem().target
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

  it("turns the chosen page while the practice sheet receives the session", () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(
      screen.getByRole("button", { name: entryChoices[0].label }),
    )

    expect(playPageTurnSound).toHaveBeenCalledOnce()
    expect(screen.getByTestId("page-turn-transition")).toBeVisible()
    const receiver = screen.getByTestId("page-turn-receiver")
    expect(receiver).toHaveAttribute("inert")
    expect(receiver.querySelector('[aria-label="Your Markdown"]')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(720)
    })

    expect(screen.queryByTestId("page-turn-transition")).toBeNull()
    expect(screen.getByTestId("page-turn-receiver")).not.toHaveAttribute("inert")
    expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
  })

  it("ignores repeated level activation while a page is already turning", () => {
    vi.useFakeTimers()
    render(<App />)

    const level = screen.getByRole("button", { name: entryChoices[0].label })
    fireEvent.click(level)
    fireEvent.click(level)

    expect(playPageTurnSound).toHaveBeenCalledOnce()
    expect(screen.getAllByTestId("page-turn-transition")).toHaveLength(1)
  })

  it("shortens the handoff when reduced motion is preferred", () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    )
    render(<App />)

    fireEvent.click(
      screen.getByRole("button", { name: entryChoices[0].label }),
    )
    act(() => {
      vi.advanceTimersByTime(119)
    })
    expect(screen.getByTestId("page-turn-transition")).toBeVisible()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByTestId("page-turn-transition")).toBeNull()
  })

  it("enters any selected level directly and starts its six-problem turn", async () => {
    for (const entry of entryChoices) {
      window.sessionStorage.clear()
      const view = render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: entry.label }))
      const expectedLength = 6
      expect(screen.getByRole("progressbar")).toHaveAccessibleName(
        `Practice progress, 1 of ${expectedLength}`,
      )
      expect(screen.queryByText(`1 of ${expectedLength}`)).toBeNull()
      expect(screen.getByLabelText(entry.label)).toBeVisible()
      expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
      view.unmount()
    }
  })

  it("keeps teaching behind the answer Hint tab at every chosen level", async () => {
    const first = await openLevel(1)
    const firstHint = screen.getByRole("tab", { name: "Hint" })
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "data-tooltip",
      "Write",
    )
    expect(firstHint).toHaveAttribute("data-tooltip", "Hint")
    expect(firstHint).toHaveAttribute("aria-keyshortcuts", "Alt+3 ?")
    expect(firstHint).toHaveAttribute("aria-selected", "false")
    await first.user.click(firstHint)
    const pattern = within(
      screen.getByRole("tabpanel", { name: "Hint" }),
    ).getByLabelText("Markdown pattern")
    expect(
      Array.from(pattern.querySelectorAll("code"), (node) => node.textContent),
    ).toEqual(currentProblem().syntaxTokens)
    await first.user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    await first.user.click(screen.getByRole("button", { name: entryChoices[1].label }))
    expect(screen.getByRole("tab", { name: "Hint" })).toHaveAttribute(
      "aria-selected",
      "false",
    )
  })

  it("turns Level 5 syntax marks into readable source examples", async () => {
    const { user } = await openLevel(5)
    await user.click(screen.getByRole("tab", { name: "Hint" }))

    const hint = screen.getByRole("tabpanel", { name: "Hint" })
    expect(within(hint).getByText("# Title")).toBeVisible()
    expect(within(hint).getByText("## Section")).toBeVisible()
    expect(within(hint).getByText("### Phase")).toBeVisible()
    expect(within(hint).getByText("1. Read AGENTS.md")).toBeVisible()
  })

  it("keeps the selected task identity visible in the exercise header", async () => {
    await openLevel(2)
    expect(
      screen.getByRole("group", { name: "Practice details" }),
    ).toHaveTextContent("Level 2 — Rebuild real documents")
  })

  it("renders the authored target as the fixed Goal at every level", async () => {
    const targetView = await openLevel(2)
    const targetGoal = screen.getByRole("region", { name: "Goal" })
    expect(targetGoal.querySelector(".rendered-document__body")).not.toBeNull()

    await targetView.user.click(
      screen.getByRole("button", { name: "Nabi Markdown home" }),
    )
    await targetView.user.click(
      screen.getByRole("button", { name: entryChoices[2].label }),
    )
    const highLevelProblem = currentProblem()
    const highLevelGoal = screen.getByRole("region", { name: "Goal" })
    expect(highLevelGoal.querySelector(".rendered-document__body")).not.toBeNull()
    const prompt = within(highLevelGoal).getByText(highLevelProblem.prompt)
    expect(prompt).toBeVisible()
    expect(prompt).toHaveClass("goal-panel__instruction")
    expect(highLevelGoal).toHaveAttribute("aria-describedby", prompt.id)
    const expectedHeading = highLevelProblem.target
      .split("\n")[0]!
      .replace(/^#+\s*/, "")
    expect(
      within(highLevelGoal).getByRole("heading", {
        name: expectedHeading,
      }),
    ).toBeVisible()
    expect(highLevelGoal).not.toHaveTextContent("Build from this brief")
  })

  it("checks only on explicit action and accepts different prose", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(validDifferentProse())
    expect(screen.queryByRole("status")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Check answer" }))
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
  })

  it("checks with the universal Control + Enter shortcut", async () => {
    const { user, editor } = await openLevel(1)
    await user.click(editor)
    await user.keyboard(validDifferentProse())
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true })
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
  })

  it("moves focus Check → Next → editor with one unified shortcut", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(validDifferentProse())
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(screen.getByRole("button", { name: "Next exercise" })).toHaveFocus()

    await user.keyboard(" ")
    const nextEditor = screen.getByRole("textbox", { name: "Your Markdown" })
    expect(nextEditor).toHaveFocus()
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 2 of 6",
    )

    fireEvent.keyDown(nextEditor, {
      key: "Enter",
      ctrlKey: true,
      repeat: true,
    })
    expect(screen.queryByRole("status")).toBeNull()
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 2 of 6",
    )
    expect(nextEditor).toHaveFocus()
  })

  it("keeps Next unavailable and opens beginner Review after Try again", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(malformedSource())
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(screen.queryByRole("button", { name: "Next exercise" })).toBeNull()
    expect(screen.getByRole("button", { name: "Check answer" })).toBeVisible()
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

    await user.click(screen.getByRole("button", { name: "Check answer" }))

    const review = screen.getByRole("tabpanel", { name: "Review" })
    expect(review).not.toHaveTextContent("How it should look")
    expect(review).not.toHaveTextContent(problem.target.split("\n")[0]!)
    expect(review.querySelectorAll(".rendered-document__body")).toHaveLength(1)
  })

  it("keeps Markdown-structure Review optional after Matched", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard(matchedWithReview())
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
    expect(screen.getByRole("tabpanel", { name: "Review" })).toHaveTextContent(
      currentProblem().editorialChecks[0]!.review,
    )
  })

  it("uses a different same-level problem after repair", async () => {
    const { user, editor } = await openLevel(2)
    const originalGoal = screen.getByRole("region", { name: "Goal" }).textContent
    await user.keyboard(malformedSource())
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("tab", { name: "Write" }))
    replaceSource(editor, validRepair())
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))

    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(
      originalGoal,
    )
    expect(screen.getByLabelText(entryChoices[1].label)).toBeVisible()
    expect(screen.getByRole("tab", { name: "Hint" })).toHaveAttribute(
      "aria-selected",
      "false",
    )
  })

  it("uses one fixed bar and exactly two workspace panels", async () => {
    await openLevel(5)
    const answerPanel = screen.getByRole("region", { name: "Your answer" })
    const answerHeader = answerPanel.querySelector(".answer-panel__header")
    expect(answerHeader).not.toBeNull()
    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Try another" })).toBeVisible()
    expect(screen.getByRole("tab", { name: "Hint" })).toBeVisible()
    expect(screen.getByRole("region", { name: "Goal" })).toHaveClass("cbt-panel")
    expect(answerPanel).toHaveClass("cbt-panel")
    expect(
      within(answerHeader as HTMLElement).queryByRole("button", {
        name: "Show invisibles",
      }),
    ).toBeNull()
    expect(screen.queryByText("answer.md")).toBeNull()
    expect(screen.queryByTestId("practice-book-spine")).toBeNull()
    expect(
      screen
        .getByRole("region", { name: "Goal" })
        .querySelector(".writing-processor"),
    ).not.toBeNull()
    expect(answerPanel.querySelector(".markdown-source-editor")).not.toBeNull()
    expect(screen.getByRole("region", { name: "Goal" })).not.toHaveClass(
      "writing-sheet",
    )
    expect(answerPanel).not.toHaveClass("writing-sheet")
    expect(screen.queryByRole("region", { name: "Live preview" })).toBeNull()
    expect(screen.queryByRole("contentinfo")).toBeNull()
  })

  it("uses one writing processor in read-only and edit modes", async () => {
    await openLevel(5)

    const goal = screen.getByRole("textbox", { name: "Goal document" })
    const answer = screen.getByRole("textbox", { name: "Your Markdown" })
    const goalProcessor = goal.closest(".writing-processor")
    const answerProcessor = answer.closest(".writing-processor")

    expect(goalProcessor).not.toBeNull()
    expect(answerProcessor).not.toBeNull()
    expect(goalProcessor).toHaveAttribute("data-mode", "read-only")
    expect(answerProcessor).toHaveAttribute("data-mode", "edit")
    expect(goalProcessor?.querySelector(".writing-processor__rows")).not.toBeNull()
    expect(answerProcessor?.querySelector(".writing-processor__rows")).not.toBeNull()
    expect(goalProcessor?.querySelector(".writing-processor__content")).not.toBeNull()
    expect(answerProcessor?.querySelector(".writing-processor__content")).not.toBeNull()
  })

  it("keeps view shortcuts active across Write, Preview, and Hint", async () => {
    const { user, editor } = await openLevel(1)
    await user.keyboard("# Preview words")
    const writeTab = screen.getByRole("tab", { name: "Write" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    await user.keyboard("{Alt>}2{/Alt}")
    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(previewTab).toHaveFocus()
    expect(screen.queryByRole("button", { name: "Show invisibles" })).toBeNull()
    const previewPanel = screen.getByRole("tabpanel", { name: "Preview" })
    expect(previewPanel).toHaveTextContent("Preview words")
    expect(previewPanel).toHaveClass("answer-panel__body--sheet")
    expect(previewPanel).not.toHaveClass("answer-panel__body--reading")
    expect(previewPanel.querySelectorAll(".writing-processor")).toHaveLength(
      1,
    )
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Hint" })).toHaveFocus()
    expect(screen.getByRole("tabpanel", { name: "Hint" })).toBeVisible()
    await user.keyboard("{Alt>}1{/Alt}")
    expect(writeTab).toHaveAttribute("aria-selected", "true")
    expect(editor).toHaveFocus()
    expect(screen.queryByRole("button", { name: "Show invisibles" })).toBeNull()
  })

  it("opens Hint with ? outside the editor without stealing typed question marks", async () => {
    const { user, editor } = await openLevel(1)

    await user.keyboard("question?")
    expect(EditorView.findFromDOM(editor)?.state.doc.toString()).toContain(
      "question?",
    )
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    screen.getByRole("button", { name: "Exit" }).focus()
    await user.keyboard("?")

    expect(screen.getByRole("tab", { name: "Hint" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(editor).not.toHaveFocus()
  })

  it("does not leave stale focus when a shortcut selects the current tab", async () => {
    const { user } = await openLevel(1)
    const hintTab = screen.getByRole("tab", { name: "Hint" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    await user.keyboard("{Alt>}3{/Alt}")
    await user.keyboard("{Alt>}3{/Alt}")
    expect(hintTab).toHaveFocus()

    await user.click(previewTab)
    expect(previewTab).toHaveFocus()
  })

  it("returns home and can reissue content at the same step", async () => {
    const { user } = await openLevel(3)
    const original = screen.getByRole("region", { name: "Goal" }).textContent
    await user.click(screen.getByRole("button", { name: "Try another" }))
    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(original)
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )

    await user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    expect(
      screen.getByRole("heading", { name: "Choose a chapter to begin." }),
    ).toBeVisible()
  })

  it("completes a run with one primary replay choice", async () => {
    const { user } = await openLevel(1)
    for (let index = 0; index < 6; index += 1) {
      const editor = screen.getByRole("textbox", { name: "Your Markdown" })
      replaceSource(editor, currentProblem().target)
      await user.click(screen.getByRole("button", { name: "Check answer" }))
      await user.click(screen.getByRole("button", { name: "Next exercise" }))
    }

    expect(screen.getByRole("button", { name: "Practice again" })).toHaveFocus()
    expect(screen.getByRole("heading", { name: "Summary" })).toBeVisible()
    expect(screen.queryByLabelText("Level 1 — Learn the syntax")).toBeNull()
    expect(screen.getByRole("button", { name: "Home" })).toBeVisible()
    expect(screen.queryByTestId("summary-book-spine")).toBeNull()
    expect(screen.queryByRole("button", { name: "Start over" })).toBeNull()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()
  })
})
