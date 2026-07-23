import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { EditorView } from "@codemirror/view"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createRunProblemIds, entryChoices } from "./content/entryChoices"
import { getProblem } from "./content/problemBank"
import { evaluateProblem } from "./engine/evaluateProblem"
import { buildReviewCorrections } from "./feedback/reviewCorrections"
import { deriveSyntaxCheckpoints } from "./guided/guidedSyntax"
import { resetCenterCardMemoryForTests } from "./guided/useCenterCard"
import { SESSION_SEED_STORAGE_KEY } from "./session/useLearningSession"
import { playPageTurnSound } from "./sound/pageTurnSound"
import { App } from "./App"

vi.mock("./sound/pageTurnSound", () => ({
  playPageTurnSound: vi.fn(),
}))

afterEach(async () => {
  vi.mocked(playPageTurnSound).mockClear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  // jsdom queues history traversals (back/forward/go and the popstate heals
  // they trigger) as macrotasks. A traversal a test did not await — easy to
  // miss when the restore is rejected and the session never changes — would
  // otherwise fire into the NEXT test's App and restore a stale entry there,
  // so every test drains the queue on the way out.
  await drainHistoryTraversals()
  // Each test owns its run: leftover progress (an owed repair, a mid-run
  // step) from the previous test otherwise leaks through the shared jsdom
  // sessionStorage into the next mount.
  window.sessionStorage.clear()
  resetCenterCardMemoryForTests()
})

function stubReducedMotionPreference() {
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
}

async function openLevel(level: 1 | 2 | 3 | 4 | 5 = 1) {
  const user = userEvent.setup()
  // jsdom has no matchMedia, so the page turn would hold the practice sheet
  // inert on a real 720ms timer — long enough for the next interactions to be
  // swallowed. Prefer reduced motion and wait the turn out before returning.
  stubReducedMotionPreference()
  render(<App />)
  const entry = entryChoices.find((choice) => choice.level === level)!
  await user.click(screen.getByRole("button", { name: entry.label }))
  await waitFor(() => {
    expect(screen.getByTestId("page-turn-receiver")).not.toHaveAttribute(
      "inert",
    )
  })
  return { user, entry }
}

// Flushes jsdom's queued history traversals (back/forward/go and the popstate
// heals they trigger). The afterEach above runs this for every test; call it
// mid-test only when an assertion needs the traversal's outcome and the
// session itself does not change (e.g. a rejected restore).
function drainHistoryTraversals() {
  return act(async () => {
    for (let i = 0; i < 4; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
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

function useSessionSeedForFirstProblem(
  level: 1 | 2 | 3 | 4 | 5,
  predicate: (problem: ReturnType<typeof getProblem>) => boolean,
) {
  const entry = entryChoices.find((choice) => choice.level === level)!

  for (let seed = 0; seed < 1_000; seed += 1) {
    const firstProblemId = createRunProblemIds(entry.id, 0, seed)[0]!
    if (predicate(getProblem(firstProblemId))) {
      window.sessionStorage.setItem(SESSION_SEED_STORAGE_KEY, String(seed))
      return
    }
  }

  throw new Error(`Expected a selectable Level ${level} problem`)
}

// ---- Center-card interaction helpers -------------------------------------

function boxInputs() {
  return screen.getAllByRole("textbox", { name: /^Marks \d+ of \d+$/ })
}

function firstBoxInput() {
  return boxInputs()[0]!
}

function slotMarks(problem = currentProblem()) {
  return deriveSyntaxCheckpoints(problem.target, problem.starterText).map(
    (checkpoint) => checkpoint.canonicalInput,
  )
}

// Types one slot's marks into the card (spillover distributes across box
// groups) and confirms with Enter.
function submitSlot(marks: string) {
  const input = firstBoxInput()
  fireEvent.change(input, { target: { value: marks } })
  const active =
    document.activeElement instanceof HTMLInputElement
      ? document.activeElement
      : input
  fireEvent.keyDown(active, { key: "Enter" })
}

function completeProblemViaCard() {
  for (const marks of slotMarks()) submitSlot(marks)
}

// Completes the problem and advances immediately via the Next button (the
// manual fast path inside the verdict beat), keeping tests off real timers.
async function completeAndAdvance(user: ReturnType<typeof userEvent.setup>) {
  completeProblemViaCard()
  await user.click(screen.getByRole("button", { name: "Next exercise" }))
}

// The card only accepts correct marks, so a document-level failure comes from
// asking for judgment early: Check on a not-yet-grown document.
async function failWithEarlyCheck(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Check answer" }))
}

function writePanelDocument() {
  const writePanel = screen.getByRole("tabpanel", { name: "Write" })
  // A replaced problem can leave the outgoing processor in the DOM for the
  // rest of the commit; the live document is always the latest mount.
  const contents = writePanel.querySelectorAll<HTMLElement>(".cm-content")
  const content = contents[contents.length - 1]
  if (!content) throw new Error("Expected the rendered document processor")
  return EditorView.findFromDOM(content)?.state.doc.toString() ?? ""
}

describe("App", () => {
  it("greets a fresh session with the definitive five-level ladder", () => {
    render(<App />)
    expect(screen.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
    for (const entry of entryChoices) {
      expect(screen.getByRole("button", { name: entry.label })).toBeVisible()
    }
    expect(screen.queryByLabelText("Syntax input")).toBeNull()
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
    expect(receiver.querySelector('[aria-label="Syntax input"]')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(720)
    })

    expect(screen.queryByTestId("page-turn-transition")).toBeNull()
    expect(screen.getByTestId("page-turn-receiver")).not.toHaveAttribute("inert")
    expect(firstBoxInput()).toHaveFocus()
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
    stubReducedMotionPreference()
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
      resetCenterCardMemoryForTests()
      const view = render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: entry.label }))
      const expectedLength = 6
      expect(screen.getByRole("progressbar")).toHaveAccessibleName(
        `Practice progress, 1 of ${expectedLength}`,
      )
      expect(screen.queryByText(`1 of ${expectedLength}`)).toBeNull()
      expect(screen.getByLabelText(`Level ${entry.level}`)).toBeVisible()
      await waitFor(() => expect(firstBoxInput()).toHaveFocus())
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
    expect(firstHint).toHaveAttribute("aria-keyshortcuts", "Alt+H Alt+3 ?")
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
    useSessionSeedForFirstProblem(
      5,
      (problem) =>
        problem.syntaxTokens.includes("```bash") &&
        problem.syntaxTokens.includes("1."),
    )
    const { user } = await openLevel(5)
    await user.click(screen.getByRole("tab", { name: "Hint" }))

    const hint = screen.getByRole("tabpanel", { name: "Hint" })
    expect(within(hint).getAllByRole("code")).toHaveLength(
      currentProblem().syntaxTokens.length,
    )
    expect(within(hint).getByText("# Title")).toBeVisible()
    expect(within(hint).getByText("## Section")).toBeVisible()
    expect(within(hint).getByText("1. Read AGENTS.md")).toBeVisible()
    expect(
      Array.from(hint.querySelectorAll("code"), (node) => node.textContent),
    ).toContain("```bash\n...\n```")
    expect(within(hint).getByText("`npm test`")).toBeVisible()
  })

  it("keeps the selected task identity visible in the exercise header", async () => {
    await openLevel(2)
    const practiceDetails = screen.getByRole("group", {
      name: "Practice details",
    })
    expect(practiceDetails).toHaveTextContent("Level 2")
    expect(practiceDetails).not.toHaveTextContent("Rebuild real documents")
  })

  it("renders the authored target as the fixed Goal at every level", async () => {
    const targetView = await openLevel(2)
    const targetGoal = screen.getByRole("region", { name: "Goal" })
    expect(
      targetGoal.querySelector(
        '.markdown-word-processor[data-presentation="rendered"]',
      ),
    ).not.toBeNull()

    await targetView.user.click(
      screen.getByRole("button", { name: "Nabi Markdown home" }),
    )
    await targetView.user.click(
      screen.getByRole("button", { name: entryChoices[2].label }),
    )
    const highLevelProblem = currentProblem()
    const highLevelGoal = screen.getByRole("region", { name: "Goal" })
    expect(
      highLevelGoal.querySelector(
        '.markdown-word-processor[data-presentation="rendered"]',
      ),
    ).not.toBeNull()
    const prompt = within(highLevelGoal).getByText(highLevelProblem.prompt)
    expect(prompt).toBeVisible()
    expect(prompt).toHaveClass("goal-panel__instruction")
    expect(highLevelGoal).toHaveAttribute("aria-describedby", prompt.id)
    const expectedHeading = highLevelProblem.target
      .split("\n")[0]!
      .replace(/^#+\s*/, "")
    const goalDocument = within(highLevelGoal).getByRole("region", {
      name: "Goal document",
    })
    expect(goalDocument).toHaveTextContent(expectedHeading)
    expect(goalDocument.querySelector(".cm-content")).toHaveAttribute(
      "contenteditable",
      "false",
    )
    expect(highLevelGoal).not.toHaveTextContent("Build from this brief")
  })

  it("starts the document blank and grows it as slots are accepted", async () => {
    await openLevel(2)
    const problem = currentProblem()
    const marks = slotMarks(problem)
    expect(marks.length).toBeGreaterThan(1)
    expect(writePanelDocument()).toBe("")

    const card = screen.getByLabelText("Syntax input")
    expect(card).toHaveTextContent(`Mark 1 of ${marks.length}`)

    submitSlot(marks[0]!)
    expect(writePanelDocument()).not.toBe("")
    expect(problem.target.startsWith(writePanelDocument())).toBe(true)
    expect(screen.getByLabelText("Syntax input")).toHaveTextContent(
      `Mark 2 of ${marks.length}`,
    )
  })

  it("accepts an alternate unordered-list marker in a slot", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) => problem.id === "l1-list-toolbox",
    )
    await openLevel(1)
    const marks = slotMarks()
    const alternate = marks[0]!.replace("-", "*")
    expect(alternate).not.toBe(marks[0])

    submitSlot(alternate)
    // Accepted alternates land in the document exactly as typed.
    expect(writePanelDocument()).toContain("* ")
  })

  it("holds the slot with Try again on a wrong mark and clears on retype", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    await openLevel(1)

    submitSlot("x")
    const verdict = screen.getByRole("status")
    expect(verdict).toHaveTextContent("Try again")
    expect(writePanelDocument()).toBe("")
    expect(screen.queryByRole("button", { name: "Next exercise" })).toBeNull()

    // The rejected mark is wiped and typing restarts at the first box.
    expect(firstBoxInput()).toHaveValue("")
    expect(firstBoxInput()).toHaveFocus()

    // The first keystroke of the retry puts the slot verdict away.
    fireEvent.change(firstBoxInput(), { target: { value: "#" } })
    expect(screen.queryByRole("status")).toBeNull()

    completeProblemViaCard()
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
  })

  it("records a slot miss in the run summary", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    const { user } = await openLevel(1)

    submitSlot("x")
    expect(screen.getByRole("status")).toHaveTextContent("Try again")

    for (let step = 0; step < 6; step += 1) {
      completeProblemViaCard()
      await user.click(screen.getByRole("button", { name: "Next exercise" }))
    }

    expect(
      await screen.findByRole("heading", { name: "Good finish." }),
    ).toBeVisible()
    expect(screen.getByLabelText("Score")).toHaveTextContent("5 / 6")
    expect(screen.queryByText("Nothing to revisit this time.")).toBeNull()
  })

  it("walks previous slots with ArrowUp and ArrowDown and edits them in place", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) => problem.id === "l1-list-toolbox",
    )
    await openLevel(1)
    const marks = slotMarks()
    expect(marks.length).toBeGreaterThan(2)

    submitSlot(marks[0]!)
    submitSlot(marks[1]!)
    const card = screen.getByLabelText("Syntax input")
    expect(card).toHaveTextContent(`Mark 3 of ${marks.length}`)

    // ArrowUp steps back through accepted slots, showing the stored answer.
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowUp" })
    expect(card).toHaveTextContent(`Mark 2 of ${marks.length}`)
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowUp" })
    expect(card).toHaveTextContent(`Mark 1 of ${marks.length}`)
    expect(firstBoxInput()).toHaveValue(marks[0]!)

    // ArrowDown returns toward the frontier.
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowDown" })
    expect(card).toHaveTextContent(`Mark 2 of ${marks.length}`)
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowUp" })

    // Editing a past slot regrows the document and jumps back to the
    // frontier. The list-style normalizer keeps the marks coherent.
    const alternate = marks[0]!.replace("-", "*")
    fireEvent.change(firstBoxInput(), { target: { value: alternate } })
    fireEvent.keyDown(firstBoxInput(), { key: "Enter" })
    expect(card).toHaveTextContent(`Mark 3 of ${marks.length}`)
    expect(writePanelDocument()).toContain("* ")
  })

  it("advances by itself after the last slot — no second confirmation key", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    await openLevel(1)

    completeProblemViaCard()
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )

    await waitFor(
      () =>
        expect(screen.getByRole("progressbar")).toHaveAccessibleName(
          "Practice progress, 2 of 6",
        ),
      { timeout: 3000 },
    )
    await waitFor(() => expect(firstBoxInput()).toHaveFocus())
  })

  it("advances exactly once even when Enter keeps being pressed in the beat", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    await openLevel(1)

    completeProblemViaCard()
    fireEvent.keyDown(document.body, { key: "Enter" })
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )

    await waitFor(
      () =>
        expect(screen.getByRole("progressbar")).toHaveAccessibleName(
          "Practice progress, 2 of 6",
        ),
      { timeout: 3000 },
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 1100)))
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 2 of 6",
    )
  })

  it("holds a re-checked Matched verdict on a revisited step", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    const { user } = await openLevel(1)
    const firstProblem = currentProblem()
    await completeAndAdvance(user)
    expect(currentProblem().id).not.toBe(firstProblem.id)

    await user.click(screen.getByRole("button", { name: "Previous exercise" }))
    expect(currentProblem().id).toBe(firstProblem.id)

    // The revisited document is complete, so Check re-judges it as Matched.
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    expect(screen.getByRole("status")).toHaveTextContent("Matched")

    // A visited step exists ahead, so the drill must not sweep the learner
    // forward while they are looking back.
    await act(() => new Promise((resolve) => setTimeout(resolve, 1100)))
    expect(currentProblem().id).toBe(firstProblem.id)
    expect(
      screen.getByRole("button", { name: "Next visited exercise" }),
    ).toBeEnabled()
  })

  it("judges the incomplete document when Check is pressed early", async () => {
    const { user } = await openLevel(2)
    await failWithEarlyCheck(user)

    const verdict = screen.getByRole("status")
    expect(verdict).toHaveTextContent("Try again")
    expect(screen.queryByRole("button", { name: "Next exercise" })).toBeNull()
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    // No auto-dismiss timer: the verdict is still on screen well past the
    // old 1.6-second toast life.
    await act(() => new Promise((resolve) => setTimeout(resolve, 1800)))
    expect(screen.getByRole("status")).toHaveTextContent("Try again")

    // Growing the document again puts the document-level verdict away.
    submitSlot(slotMarks()[0]!)
    expect(screen.queryByRole("status")).toBeNull()
    expect(screen.getByRole("tab", { name: "Review" })).toBeVisible()
  })

  it("closes the held Try again verdict with Escape and reopens it on a new Check", async () => {
    const { user } = await openLevel(1)
    await failWithEarlyCheck(user)
    expect(screen.getByRole("status")).toHaveTextContent("Try again")

    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(screen.queryByRole("status")).toBeNull()

    await failWithEarlyCheck(user)
    expect(screen.getByRole("status")).toHaveTextContent("Try again")

    await user.click(screen.getByRole("button", { name: "Close verdict" }))
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("lists every high-level correction without rendering either document", async () => {
    useSessionSeedForFirstProblem(3, (problem) =>
      problem.matchChecks.some(
        (check) => check.kind === "inline-presence" && check.inline === "strong",
      ),
    )
    const { user } = await openLevel(3)
    const problem = currentProblem()

    await failWithEarlyCheck(user)
    await user.click(screen.getByRole("tab", { name: "Review" }))

    const evaluation = evaluateProblem(problem, "")
    if (evaluation.status !== "fail") {
      throw new Error("Expected an empty composite document to fail")
    }
    const expectedCorrections = buildReviewCorrections(
      problem,
      evaluation,
      "",
    )
    const review = screen.getByRole("tabpanel", { name: "Review" })
    const corrections = within(review).getByRole("list", {
      name: "Required corrections",
    })
    const correctionItems = within(corrections).getAllByRole("listitem")
    expect(correctionItems).toHaveLength(expectedCorrections.length)
    expectedCorrections.forEach((correction, index) => {
      const item = within(correctionItems[index]!)
      expect(item.getByText(correction.label)).toBeVisible()
      expect(item.getByText(correction.location)).toBeVisible()
      expect(item.getByText(correction.repairInstruction)).toBeVisible()
      if (correction.requiredSource) {
        expect(item.getByText(correction.requiredSource)).toBeVisible()
      }
      else expect(correctionItems[index]!.querySelector("code")).toBeNull()
    })
    expect(within(corrections).getByText("Bold text")).toBeVisible()
    expect(review).not.toHaveTextContent(problem.target.split("\n")[0]!)
    expect(review.querySelector(".rendered-document__body")).toBeNull()
  })

  it("uses a different same-level problem after repair", async () => {
    const { user } = await openLevel(2)
    const originalGoal = screen.getByRole("region", { name: "Goal" }).textContent

    await failWithEarlyCheck(user)
    expect(screen.getByRole("status")).toHaveTextContent("Try again")

    await completeAndAdvance(user)

    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(
      originalGoal,
    )
    expect(
      screen.getByLabelText(`Level ${entryChoices[1].level}`),
    ).toBeVisible()
    expect(screen.getByLabelText("Practice details")).toHaveTextContent(
      "Repair practice",
    )
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
    expect(
      answerPanel.querySelector(
        '.markdown-word-processor[data-presentation="rendered"]',
      ),
    ).not.toBeNull()
    expect(answerPanel.querySelector(".center-card")).not.toBeNull()
    expect(screen.getByRole("region", { name: "Goal" })).not.toHaveClass(
      "writing-sheet",
    )
    expect(answerPanel).not.toHaveClass("writing-sheet")
    expect(screen.queryByRole("region", { name: "Live preview" })).toBeNull()
    expect(screen.queryByRole("contentinfo")).toBeNull()
  })

  it("renders Goal and the growing document through the same read-only processor", async () => {
    await openLevel(5)

    const goal = screen.getByRole("region", { name: "Goal document" })
    const writePanel = screen.getByRole("tabpanel", { name: "Write" })
    const documentProcessor = writePanel.querySelector(
      '.markdown-word-processor[data-presentation="rendered"]',
    )
    const goalProcessor = goal.closest(".writing-processor")

    expect(goalProcessor).not.toBeNull()
    expect(documentProcessor).not.toBeNull()
    expect(goalProcessor).toHaveAttribute("data-mode", "read-only")
    expect(documentProcessor?.closest(".writing-processor")).toHaveAttribute(
      "data-mode",
      "read-only",
    )
    expect(goalProcessor).toHaveAttribute("data-engine", "codemirror")
    expect(goal.querySelector(".cm-content")).toHaveAttribute(
      "contenteditable",
      "false",
    )
    expect(documentProcessor?.querySelector(".cm-content")).toHaveAttribute(
      "contenteditable",
      "false",
    )
    // The card's box inputs are the only editable surface.
    expect(boxInputs().length).toBeGreaterThan(0)
  })

  it("mirrors the grown document in Preview through the shared processor", async () => {
    const { user } = await openLevel(2)
    submitSlot(slotMarks()[0]!)
    const grown = writePanelDocument()
    expect(grown).not.toBe("")

    await user.click(screen.getByRole("tab", { name: "Preview" }))

    const preview = screen.getByRole("tabpanel", { name: "Preview" })
    const processor = preview.querySelector(
      '.markdown-word-processor[data-presentation="rendered"]',
    )
    expect(processor).not.toBeNull()
    const content = processor?.querySelector<HTMLElement>(".cm-content")
    expect(content).not.toBeNull()
    if (!content) return
    expect(EditorView.findFromDOM(content)?.state.doc.toString()).toBe(grown)
    expect(content).toHaveAttribute("contenteditable", "false")
  })

  it("peeks the Hint with Alt+H and returns focus to the card", async () => {
    await openLevel(1)
    const input = firstBoxInput()
    act(() => input.focus())

    fireEvent.keyDown(input, { code: "KeyH", key: "h", altKey: true })
    expect(screen.getByRole("tab", { name: "Hint" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    fireEvent.keyDown(
      screen.getByRole("tabpanel", { name: "Hint" }),
      { code: "KeyH", key: "h", altKey: true },
    )
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    await waitFor(() => expect(firstBoxInput()).toHaveFocus())
  })

  it("navigates visited steps from the keyboard with Alt+P and Alt+N", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    const { user } = await openLevel(1)
    const firstProblem = currentProblem()
    await completeAndAdvance(user)
    expect(currentProblem().id).not.toBe(firstProblem.id)
    const secondProblemId = currentProblem().id

    fireEvent.keyDown(firstBoxInput(), { code: "KeyP", key: "p", altKey: true })
    expect(currentProblem().id).toBe(firstProblem.id)

    fireEvent.keyDown(document.body, { code: "KeyN", key: "n", altKey: true })
    expect(currentProblem().id).toBe(secondProblemId)
  })

  it("moves between visited problems with the in-app previous and next controls", async () => {
    const { user } = await openLevel(1)
    const firstProblem = currentProblem()
    const previousButton = screen.getByRole("button", {
      name: "Previous exercise",
    })
    const nextVisitedButton = screen.getByRole("button", {
      name: "Next visited exercise",
    })
    expect(previousButton).toBeDisabled()
    expect(nextVisitedButton).toBeDisabled()

    await completeAndAdvance(user)
    expect(currentProblem().id).not.toBe(firstProblem.id)
    expect(previousButton).toBeEnabled()
    expect(nextVisitedButton).toBeDisabled()

    await user.click(previousButton)
    expect(currentProblem().id).toBe(firstProblem.id)
    // The revisited step restores its grown document.
    expect(writePanelDocument()).toBe(firstProblem.target)
    expect(previousButton).toBeDisabled()
    expect(nextVisitedButton).toBeEnabled()

    await user.click(nextVisitedButton)
    expect(currentProblem().id).not.toBe(firstProblem.id)
    expect(nextVisitedButton).toBeDisabled()
  })

  it("keeps browser Back walking backwards after an in-app previous move", async () => {
    const { user } = await openLevel(1)
    const firstProblem = currentProblem()
    await completeAndAdvance(user)
    expect(currentProblem().id).not.toBe(firstProblem.id)

    await user.click(screen.getByRole("button", { name: "Previous exercise" }))
    expect(currentProblem().id).toBe(firstProblem.id)

    // The in-app move rewrote the top history entry, so Back must not bounce
    // forward to the step that was just left.
    await act(async () => {
      window.history.back()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(currentProblem().id).toBe(firstProblem.id)

    act(() => window.history.back())
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Choose a chapter to begin." }),
      ).toBeVisible(),
    )
  })

  it("keeps browser history on problem steps inside the practice run", async () => {
    const { user } = await openLevel(1)
    const firstProblem = currentProblem()

    await completeAndAdvance(user)
    const secondProblem = currentProblem()
    expect(secondProblem.id).not.toBe(firstProblem.id)

    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblem.id))

    act(() => window.history.forward())
    await waitFor(() => expect(currentProblem().id).toBe(secondProblem.id))
  })

  it("keeps view shortcuts active across Write, Preview, and Hint", async () => {
    const { user } = await openLevel(2)
    submitSlot(slotMarks()[0]!)
    const grown = writePanelDocument()
    const writeTab = screen.getByRole("tab", { name: "Write" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })
    act(() => firstBoxInput().focus())

    await user.keyboard("{Alt>}2{/Alt}")
    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(previewTab).toHaveFocus()
    expect(screen.queryByRole("button", { name: "Show invisibles" })).toBeNull()
    const previewPanel = screen.getByRole("tabpanel", { name: "Preview" })
    expect(previewPanel).toHaveTextContent(grown.split("\n")[0]!.replace(/^#+\s*/, ""))
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
    await waitFor(() => expect(firstBoxInput()).toHaveFocus())
  })

  it("keeps view shortcuts active while the card owns focus", async () => {
    const { user } = await openLevel(1)
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    await waitFor(() => expect(firstBoxInput()).toHaveFocus())
    await user.keyboard("{Alt>}2{/Alt}")

    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(previewTab).toHaveFocus()
  })

  it("opens Hint with ? outside the card without stealing typed question marks", async () => {
    await openLevel(1)
    const input = firstBoxInput()
    act(() => input.focus())

    // A ? typed while the card input owns focus stays text entry.
    fireEvent.keyDown(input, { key: "?" })
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    const exit = screen.getByRole("button", { name: "Exit" })
    exit.focus()
    expect(exit).toHaveFocus()
    fireEvent.keyDown(exit, { key: "?" })

    expect(screen.getByRole("tab", { name: "Hint" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(input).not.toHaveFocus()
  })

  it("keeps ? in the card when a document-level key event observes card focus", async () => {
    await openLevel(1)
    const input = firstBoxInput()
    act(() => input.focus())
    fireEvent.keyDown(document, { key: "?" })

    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(input).toHaveFocus()
  })

  it("does not leave stale focus when a shortcut selects the current tab", async () => {
    const { user } = await openLevel(1)
    const hintTab = screen.getByRole("tab", { name: "Hint" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    act(() => firstBoxInput().focus())
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
    await waitFor(() => expect(firstBoxInput()).toHaveFocus())
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )

    await user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    expect(
      screen.getByRole("heading", { name: "Choose a chapter to begin." }),
    ).toBeVisible()
  })

  it("uses browser Back to revisit the previous problem and then the landing", async () => {
    const { user } = await openLevel(1)
    const firstProblemId = currentProblem().id
    await completeAndAdvance(user)
    expect(currentProblem().id).not.toBe(firstProblemId)

    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblemId))

    act(() => window.history.back())
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Choose a chapter to begin." }),
      ).toBeVisible(),
    )
  })

  it("keeps browser Forward symmetric after returning to the landing", async () => {
    const { user } = await openLevel(1)
    const firstProblemId = currentProblem().id
    await completeAndAdvance(user)
    const secondProblemId = currentProblem().id

    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblemId))
    act(() => window.history.back())
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Choose a chapter to begin." }),
      ).toBeVisible(),
    )

    act(() => window.history.forward())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblemId))
    act(() => window.history.forward())
    await waitFor(() => expect(currentProblem().id).toBe(secondProblemId))
  })

  it("walks the history pointer back when Back is rejected on an owed repair", async () => {
    const { user } = await openLevel(1)
    const failedProblemId = currentProblem().id
    await failWithEarlyCheck(user)
    await completeAndAdvance(user)
    const repairProblemId = currentProblem().id
    expect(repairProblemId).not.toBe(failedProblemId)

    // Back while the repair is owed: the restore is rejected, and the pointer
    // must walk forward again so it sits on the repair entry, not behind it.
    act(() => window.history.back())
    await drainHistoryTraversals()
    const healedState = window.history.state as {
      snapshot?: { currentProblemId?: string }
    } | null
    expect(healedState?.snapshot?.currentProblemId).toBe(repairProblemId)
    expect(currentProblem().id).toBe(repairProblemId)

    // Complete the repair and advance; the resulting pushState must extend
    // the walk. Had the pointer stayed behind, this push would truncate the
    // repair entry and Back would skip straight to the failed exercise.
    await completeAndAdvance(user)
    expect(currentProblem().id).not.toBe(repairProblemId)

    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(repairProblemId))
    await drainHistoryTraversals()
  })

  it("walks the history pointer forward when Forward is rejected on an owed repair", async () => {
    const { user } = await openLevel(1)
    const firstProblemId = currentProblem().id
    await completeAndAdvance(user)
    const secondProblemId = currentProblem().id

    // Walk back to the first step so a real entry sits ahead of the pointer.
    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblemId))

    // Swap in fresh content (a blank card) and fail it so a repair becomes
    // owed, then try Forward: the restore is rejected and the pointer must
    // walk back to the current entry.
    await user.click(screen.getByRole("button", { name: "Try another" }))
    const replacementProblemId = currentProblem().id
    expect(replacementProblemId).not.toBe(firstProblemId)
    await failWithEarlyCheck(user)
    act(() => window.history.forward())
    await drainHistoryTraversals()
    const healedState = window.history.state as {
      snapshot?: { currentProblemId?: string }
    } | null
    expect(healedState?.snapshot?.currentProblemId).toBe(replacementProblemId)
    expect(currentProblem().id).toBe(replacementProblemId)
    expect(secondProblemId).not.toBe(firstProblemId)
  })

  it("completes a run with one primary replay choice", async () => {
    const { user } = await openLevel(1)

    for (let step = 0; step < 6; step += 1) {
      completeProblemViaCard()
      await user.click(screen.getByRole("button", { name: "Next exercise" }))
    }

    expect(
      await screen.findByRole("heading", { name: "Well done." }),
    ).toBeVisible()
    expect(screen.getByLabelText("Score")).toHaveTextContent("6 / 6")
    const practiceAgain = screen.getByRole("button", { name: "Practice again" })
    expect(practiceAgain).toBeVisible()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()

    await user.click(practiceAgain)
    await waitFor(() => expect(firstBoxInput()).toBeVisible())
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )
  })
})
