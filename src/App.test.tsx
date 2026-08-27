import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createRunProblemIds, entryChoices } from "./content/entryChoices"
import { getProblem } from "./content/problemBank"
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
  const view = render(<App />)
  const entry = entryChoices.find((choice) => choice.level === level)!
  await user.click(screen.getByRole("button", { name: entry.label }))
  await waitFor(() => {
    expect(screen.getByTestId("page-turn-receiver")).not.toHaveAttribute(
      "inert",
    )
  })
  return { user, entry, ...view }
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
  const practice = document.querySelector<HTMLElement>(
    ".app-shell--practice[data-problem-id]",
  )
  const problemId = practice?.dataset.problemId
  if (!problemId) throw new Error("The active card must identify its problem")
  return getProblem(problemId)
}

function useSessionSeedForFirstProblem(
  chapter: 1 | 2 | 3 | 4 | 5,
  predicate: (problem: ReturnType<typeof getProblem>) => boolean,
) {
  const entry = entryChoices.find((choice) => choice.level === chapter)!

  for (let seed = 0; seed < 1_000; seed += 1) {
    const firstProblemId = createRunProblemIds(entry.id, 0, seed)[0]!
    if (predicate(getProblem(firstProblemId))) {
      window.sessionStorage.setItem(SESSION_SEED_STORAGE_KEY, String(seed))
      return
    }
  }

  throw new Error(`Expected a selectable Chapter ${chapter} problem`)
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

function writePanelDocument() {
  return (
    document.querySelector<HTMLElement>(".app-shell--practice")?.dataset.draft ??
    ""
  )
}

describe("App", () => {
  it("greets a fresh session with the definitive five-chapter shelf", () => {
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
    expect(
      receiver.querySelector('[aria-label="Markdown syntax practice"]'),
    ).not.toBeNull()

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

  it("enters any selected chapter directly and starts its six-problem turn", async () => {
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
      expect(screen.getByLabelText(`Chapter ${entry.level}`)).toBeVisible()
      await waitFor(() => expect(firstBoxInput()).toHaveFocus())
      view.unmount()
    }
  })

  it("keeps exact teaching inside the card at every chosen level", async () => {
    const first = await openLevel(1)
    const hintButton = screen.getByRole("button", { name: "Hint" })
    expect(hintButton).toHaveAttribute("aria-expanded", "false")
    await first.user.click(hintButton)
    expect(
      screen.getByRole("region", { name: "Exact Markdown hint" }),
    ).toBeVisible()
    expect(firstBoxInput()).toHaveFocus()

    await first.user.click(
      screen.getByRole("button", { name: "Nabi Markdown home" }),
    )
    await first.user.click(
      screen.getByRole("button", { name: entryChoices[4].label }),
    )
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("keeps the selected task identity visible in the exercise header", async () => {
    await openLevel(2)
    const practiceDetails = screen.getByRole("group", {
      name: "Practice details",
    })
    expect(practiceDetails).toHaveTextContent("Chapter 2")
    expect(practiceDetails).not.toHaveTextContent("Lists")
  })

  it("shows only local rendered context and mark inputs during practice", async () => {
    await openLevel(3)
    const card = screen.getByRole("region", {
      name: "Markdown syntax practice",
    })
    expect(within(card).getByLabelText("Rendered context")).toBeVisible()
    expect(within(card).getAllByRole("textbox").length).toBeGreaterThan(0)
    expect(screen.queryByRole("region", { name: "Goal" })).toBeNull()
    expect(screen.queryByRole("tablist")).toBeNull()
    expect(screen.queryByText("Your answer")).toBeNull()
  })

  it("starts the document blank and grows it as slots are accepted", async () => {
    await openLevel(2)
    const problem = currentProblem()
    const marks = slotMarks(problem)
    expect(marks.length).toBeGreaterThan(1)
    expect(writePanelDocument()).toBe("")

    // `Step x of 6` in the top bar is the only progress label; the marks
    // inside a card never introduce a second counter.
    const card = screen.getByLabelText("Markdown syntax practice")
    expect(card).not.toHaveTextContent(/Mark \d+ of \d+/)
    expect(screen.getByLabelText(/Practice progress, \d+ of \d+/)).toBeVisible()

    submitSlot(marks[0]!)
    expect(writePanelDocument()).not.toBe("")
    expect(problem.target.startsWith(writePanelDocument())).toBe(true)
    expect(screen.getByLabelText("Markdown syntax practice")).not.toHaveTextContent(
      /Mark \d+ of \d+/,
    )
  })

  it("accepts an alternate unordered-list marker in a slot", async () => {
    useSessionSeedForFirstProblem(
      5,
      (problem) => problem.id === "l2-sectioned-checklist-bake-sale",
    )
    await openLevel(5)
    const marks = slotMarks()
    expect(marks.length).toBeGreaterThan(2)
    submitSlot(marks[0]!)
    submitSlot(marks[1]!)
    const alternate = marks[2]!.replace("-", "*")
    expect(alternate).not.toBe(marks[2])

    submitSlot(alternate)
    // Accepted alternates land in the document exactly as typed.
    expect(writePanelDocument()).toContain("* ")
  })

  it("normalizes the Korean won sign to a backtick in code slots", async () => {
    useSessionSeedForFirstProblem(
      4,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "inline-code",
    )
    await openLevel(4)

    // macOS Korean input types ₩ on the backtick key; the card absorbs it.
    submitSlot("₩₩")
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(writePanelDocument()).toContain("`")
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

    // A typed space stays visible in its box as the book's middle dot.
    fireEvent.change(firstBoxInput(), { target: { value: "# " } })
    expect(
      document.querySelector(".center-card__box-space")?.textContent,
    ).toBe("·")

    completeProblemViaCard()
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
  })

  it("restores the exact Hint after a failed slot survives a remount", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    const { unmount } = await openLevel(1)

    submitSlot("x")
    expect(
      screen.getByRole("region", { name: "Exact Markdown hint" }),
    ).toBeVisible()

    unmount()
    resetCenterCardMemoryForTests()
    render(<App />)

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(
      screen.getByRole("region", { name: "Exact Markdown hint" }),
    ).toBeVisible()
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
      5,
      (problem) => problem.id === "l2-sectioned-checklist-bake-sale",
    )
    await openLevel(5)
    const marks = slotMarks()
    expect(marks.length).toBeGreaterThan(2)

    submitSlot(marks[0]!)
    submitSlot(marks[1]!)
    submitSlot(marks[2]!)
    // The card carries no `Mark x of y` counter, so which slot is showing is
    // proven by the answer in the boxes: the frontier slot is empty.
    const card = screen.getByLabelText("Markdown syntax practice")
    expect(card).not.toHaveTextContent(/Mark \d+ of \d+/)
    expect(firstBoxInput()).toHaveValue("")

    // ArrowUp steps back through accepted slots, showing the stored answer.
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowUp" })
    expect(firstBoxInput()).toHaveValue(marks[2]!)
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowUp" })
    expect(firstBoxInput()).toHaveValue(marks[1]!)

    // ArrowDown returns toward the frontier.
    fireEvent.keyDown(firstBoxInput(), { key: "ArrowDown" })
    expect(firstBoxInput()).toHaveValue(marks[2]!)

    // Editing a past slot regrows the document and jumps back to the
    // frontier. The list-style normalizer keeps the marks coherent.
    const alternate = marks[2]!.replace("-", "*")
    fireEvent.change(firstBoxInput(), { target: { value: alternate } })
    fireEvent.keyDown(firstBoxInput(), { key: "Enter" })
    expect(firstBoxInput()).toHaveValue("")
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

  it("keeps a completed card visible on a revisited step", async () => {
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
    expect(
      screen.getByRole("region", { name: "Markdown syntax practice" }),
    ).toBeVisible()
    expect(screen.queryByRole("button", { name: "Check answer" })).toBeNull()

    // A visited step exists ahead, so the drill must not sweep the learner
    // forward while they are looking back.
    await act(() => new Promise((resolve) => setTimeout(resolve, 1100)))
    expect(currentProblem().id).toBe(firstProblem.id)
    expect(
      screen.getByRole("button", { name: "Next visited exercise" }),
    ).toBeEnabled()
  })

  it("uses one fixed bar and one card with no document workspace", async () => {
    await openLevel(5)
    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Try another" })).toBeVisible()
    expect(
      screen.getByRole("region", { name: "Markdown syntax practice" }),
    ).toBeVisible()
    expect(screen.queryByRole("region", { name: "Goal" })).toBeNull()
    expect(screen.queryByRole("tablist")).toBeNull()
    expect(document.querySelector(".cbt-workspace")).toBeNull()
    expect(boxInputs().length).toBeGreaterThan(0)
  })

  it("opens an inline Hint with ? and keeps focus in the mark boxes", async () => {
    await openLevel(1)
    const input = firstBoxInput()
    act(() => input.focus())

    fireEvent.keyDown(input, { key: "?", code: "Slash", shiftKey: true })
    expect(
      screen.getByRole("region", { name: "Exact Markdown hint" }),
    ).toBeVisible()
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

  it("confines Hint entry and keyboard focus to the mark boxes", async () => {
    await openLevel(1)
    const input = firstBoxInput()
    act(() => input.focus())

    fireEvent.change(input, { target: { value: "x" } })
    fireEvent.keyDown(input, { key: "?", code: "Slash", shiftKey: true })
    expect(input).toHaveValue("")
    expect(
      screen.getByRole("region", { name: "Exact Markdown hint" }),
    ).toBeVisible()
    expect(firstBoxInput()).toHaveFocus()
  })

  it("returns home and can reissue content at the same step", async () => {
    const { user } = await openLevel(3)
    const original = currentProblem().id
    await user.click(screen.getByRole("button", { name: "Try another" }))
    expect(currentProblem().id).not.toBe(original)
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

  it("ignores pre-chapter browser history snapshots", async () => {
    await openLevel(1)
    const currentProblemId = currentProblem().id
    const oldProblemIds = createRunProblemIds("level-4", 0, 0)

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: {
            marker: "nabimd-practice-v1",
            view: "practice",
            snapshot: {
              entryId: "level-1",
              runNumber: 0,
              runProblemIds: oldProblemIds,
              runStepIndex: 0,
              scheduledStepIndex: 0,
              currentProblemId: oldProblemIds[0],
              currentIsTransfer: false,
              runStartedAtMs: 1_000,
            },
          },
        }),
      )
    })

    expect(currentProblem().id).toBe(currentProblemId)
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
    expect(screen.getByRole("button", { name: "Change chapter" })).toBeVisible()
    // The finished work is handed back on the page itself: no viewer to open,
    // nothing to type into, and a clean run carries no correction marks.
    expect(screen.getByLabelText("Your work")).toBeVisible()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(screen.queryByLabelText(/^Correction /)).toBeNull()
    expect(
      screen.getByText("A clean page — nothing to correct."),
    ).toBeVisible()

    await user.click(practiceAgain)
    await waitFor(() => expect(firstBoxInput()).toBeVisible())
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )
  })
})
