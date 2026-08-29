import { fireEvent, render, screen } from "@testing-library/react"
import { StrictMode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { SyntaxMistake } from "../guided/guidedSyntax"
import { playFeedbackSound } from "../sound/feedbackSound"
import { joinSyntaxTokens, RunSummary } from "./RunSummary"

vi.mock("../sound/feedbackSound", () => ({
  playFeedbackSound: vi.fn(),
}))

// Both ids are real bank problems, so the checkpoint ids the ledger carries
// resolve to real source lines. `l2-heading-grocery-list` opens with a level 1
// heading; `l1-italic-paper-boat` is `*Paper boat*`.
const PAGES = [
  {
    problemId: "l2-heading-grocery-list",
    title: "Grocery list",
    source: "# Grocery list\n\nMilk and bread\n\n- Apples",
  },
  {
    problemId: "l1-italic-paper-boat",
    title: "Paper boat",
    source: "*Paper boat*",
  },
]

function mistake(overrides: Partial<SyntaxMistake> = {}): SyntaxMistake {
  return {
    problemId: "l2-heading-grocery-list",
    checkpointId: "syntax-1-1",
    groupIndex: 0,
    term: "level 1 heading",
    submitted: "@",
    expected: ["# "],
    ...overrides,
  }
}

function renderSummary(syntaxMistakes: SyntaxMistake[] = []) {
  render(
    <RunSummary
      completedPages={PAGES}
      elapsedMs={65_000}
      onChangeLevel={vi.fn()}
      onPracticeAgain={vi.fn()}
      score={6 - syntaxMistakes.length}
      syntaxMistakes={syntaxMistakes}
      total={6}
    />,
  )
}

function noteItems() {
  return screen
    .getAllByRole("listitem")
    .filter((item) => item.className.includes("run-summary__note"))
}

describe("RunSummary as a teacher's return", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("shows rendered work and its Markdown together, one completed exercise at a time", () => {
    renderSummary()

    const work = screen.getByLabelText("Your work")
    expect(work).toHaveTextContent("Grocery list")
    expect(screen.getByRole("region", { name: "Rendered document" })).toHaveTextContent(
      "Grocery list",
    )
    expect(screen.getByRole("region", { name: "Markdown source" })).toHaveTextContent(
      "# Grocery list",
    )
    // The completed pages are the page now, not a dialog behind a button.
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(
      screen.queryByRole("button", { name: /completed pages/i }),
    ).toBeNull()
    // Review only: nothing on this page takes typing.
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
    expect(
      screen.getByRole("article", {
        name: "Completed exercise 1 of 2: Grocery list",
      }),
    ).toBeVisible()
    expect(screen.queryByText("Paper boat")).toBeNull()

    fireEvent.click(
      screen.getByRole("button", { name: "Next completed exercise" }),
    )
    expect(
      screen.getByRole("article", {
        name: "Completed exercise 2 of 2: Paper boat",
      }),
    ).toBeVisible()
    expect(screen.getByRole("region", { name: "Markdown source" })).toHaveTextContent(
      "*Paper boat*",
    )
  })

  it("marks the missed line and prints the matching numbered note", () => {
    renderSummary([mistake()])

    // The mark sits on the line that was missed — the heading, not the body.
    const heading = screen.getByRole("heading", {
      level: 1,
      name: /Grocery list/,
    })
    expect(heading).toHaveAttribute("data-corrected", "true")
    expect(screen.getByText("Correction 1")).toBeVisible()

    // The note names the family and spells out the grammar-required space.
    expect(
      screen.getByText(/Level 1 heading needs these marks\./),
    ).toBeVisible()
    expect(screen.getByText("Space")).toBeVisible()
  })

  it("keeps keyboard focus on completed-exercise navigation", () => {
    renderSummary()
    const next = screen.getByRole("button", {
      name: "Next completed exercise",
    })
    next.focus()

    fireEvent.click(next)

    expect(next).toHaveFocus()
    const previous = screen.getByRole("button", {
      name: "Previous completed exercise",
    })
    previous.focus()
    fireEvent.click(previous)
    expect(previous).toHaveFocus()
  })

  it("marks only the missed line, leaving the rest of the work clean", () => {
    renderSummary([mistake()])

    expect(document.querySelectorAll("[data-corrected]")).toHaveLength(1)
  })

  it("numbers corrections down the page rather than by when they happened", () => {
    // The italic miss was recorded first but belongs to the second page, so
    // it must still be numbered after the heading on the first page.
    renderSummary([
      mistake({
        problemId: "l1-italic-paper-boat",
        term: "italic text",
        expected: ["*", "_"],
      }),
      mistake(),
    ])

    const notes = noteItems()
    expect(notes[0]).toHaveTextContent("Level 1 heading needs these marks.")
    expect(notes[1]).toHaveTextContent("Italic text needs these marks.")
    expect(screen.getByText("Correction 1")).toBeVisible()
    fireEvent.click(
      screen.getByRole("button", { name: "Next completed exercise" }),
    )
    expect(screen.getByText("Correction 2")).toBeVisible()
  })

  it("lists every accepted form for a missed group", () => {
    renderSummary([
      mistake({
        problemId: "l1-italic-paper-boat",
        term: "italic text",
        expected: ["*", "_"],
      }),
    ])

    const forms = noteItems()[0]!.querySelectorAll(".run-summary__keycaps")
    expect([...forms].map((form) => form.textContent)).toEqual(["*", "_"])
  })

  it("leaves a clean run completely unmarked", () => {
    renderSummary()

    expect(screen.getByText("A clean page — nothing to correct.")).toBeVisible()
    expect(screen.queryByText(/^Correction \d+$/)).toBeNull()
    expect(document.querySelectorAll("[data-corrected]")).toHaveLength(0)
    expect(screen.getByLabelText("Run summary")).toHaveAttribute(
      "data-clean",
      "true",
    )
  })

  it("keeps score and time available but in the quiet footer rank", () => {
    renderSummary()

    expect(screen.getByLabelText("Score")).toHaveTextContent("6")
    expect(screen.getByLabelText("Total time")).toHaveTextContent("01:05")
    expect(screen.getByLabelText("Score").parentElement).toHaveClass(
      "summary-ink--actions",
    )
  })

  it("reveals the replay action after the note without focusing past it", () => {
    renderSummary()

    const replay = screen.getByRole("button", { name: "Practice again" })
    const completion = screen.getByRole("heading", { name: "Well done." })
    expect(completion).toHaveFocus()
    expect(completion).toHaveAttribute("data-quiet-focus", "true")
    expect(replay).not.toHaveFocus()
    expect(replay.parentElement).toHaveClass(
      "summary-ink",
      "summary-ink--actions",
    )

    fireEvent.blur(completion)
    fireEvent.focus(completion)
    expect(completion).not.toHaveAttribute("data-quiet-focus")
  })

  it("runs both quiet actions", () => {
    const onPracticeAgain = vi.fn()
    const onChangeLevel = vi.fn()
    render(
      <RunSummary
        completedPages={PAGES}
        elapsedMs={65_000}
        onChangeLevel={onChangeLevel}
        onPracticeAgain={onPracticeAgain}
        score={6}
        total={6}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Practice again" }))
    fireEvent.click(screen.getByRole("button", { name: "Change level" }))
    expect(onPracticeAgain).toHaveBeenCalledTimes(1)
    expect(onChangeLevel).toHaveBeenCalledTimes(1)
  })

  it("holds the teacher reveal until the physical page turn has completed", () => {
    render(
      <RunSummary
        elapsedMs={65_000}
        motionReady={false}
        onChangeLevel={vi.fn()}
        onPracticeAgain={vi.fn()}
        score={6}
        total={6}
      />,
    )

    expect(screen.getByLabelText("Run summary")).toHaveClass(
      "run-summary--waiting",
    )
    expect(screen.getByRole("heading", { name: "Well done." })).toHaveFocus()
  })

  it.each([
    ["narrow", "(max-width: 760px)"],
    ["short desktop", "(max-height: 680px)"],
  ])("opens a %s Summary on the teacher's line", (_label, query) => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((candidate: string) => ({
        matches: candidate === query,
        media: candidate,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )

    renderSummary()

    expect(screen.getByRole("heading", { name: "Well done." })).toHaveFocus()
    expect(
      screen.getByRole("button", { name: "Practice again" }),
    ).not.toHaveFocus()
  })

  it("plays the completion cue once during StrictMode effect verification", () => {
    render(
      <StrictMode>
        <RunSummary
          elapsedMs={12_000}
          onChangeLevel={vi.fn()}
          onPracticeAgain={vi.fn()}
          score={6}
          total={6}
        />
      </StrictMode>,
    )

    expect(playFeedbackSound).toHaveBeenCalledOnce()
    expect(playFeedbackSound).toHaveBeenCalledWith("summary")
  })

  it("joins syntax tokens with a readable gap", () => {
    expect(joinSyntaxTokens(["Blank line", "---", "Blank line"])).toBe(
      "Blank line  ---  Blank line",
    )
  })
})
