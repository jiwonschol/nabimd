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
import { SESSION_SEED_STORAGE_KEY } from "./session/useLearningSession"
import { playPageTurnSound } from "./sound/pageTurnSound"
import { App, PAGE_TURN_DURATION_MS } from "./App"

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

function currentSkill() {
  return currentProblem().skillIds[0]
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

function validDifferentProse() {
  if (currentProblem().familyId === "nested-lists") {
    return "- Completely different\n  - misspeled words\n  - anything works"
  }
  switch (currentSkill()) {
    case "blockquote":
      return "> completely different words"
    case "bold-emphasis":
      return "**completely different words**"
    case "italic-emphasis":
      return "*completely different words*"
    case "inline-code":
      return "Use `completely different words`."
    case "inline-link":
      return "Use [completely different words](/changed)."
    case "unordered-list":
      return "- Alpha\n- Bravo\n- Charlie"
    case "ordered-list":
      return "1. Alpha\n2. Bravo\n3. Charlie"
    case "code-block":
      return "```\ncompletely different\n```"
    case "thematic-break":
      return "First part.\n\n---\n\nSecond part."
    default: {
      // Heading problems grade the mark depth, so echo the target's marks:
      // l1-heading-depth-* rejects a lone "#" even with different prose.
      const headingMarks = currentProblem().target.match(/^#+(?= )/m)?.[0] ?? "#"
      return `${headingMarks} completely different words`
    }
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
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
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
      const view = render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: entry.label }))
      const expectedLength = 6
      expect(screen.getByRole("progressbar")).toHaveAccessibleName(
        `Practice progress, 1 of ${expectedLength}`,
      )
      expect(screen.queryByText(`1 of ${expectedLength}`)).toBeNull()
      expect(screen.getByLabelText(`Level ${entry.level}`)).toBeVisible()
      expect(
        screen.getByRole("textbox", { name: "Your Markdown" }),
      ).toHaveFocus()
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

  it("checks only on explicit action and accepts different prose", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) =>
        problem.skillIds.length === 1 && problem.skillIds[0] === "heading-h1",
    )
    const { user, editor } = await openLevel(1)
    replaceSource(editor, validDifferentProse())
    expect(screen.queryByRole("status")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Check answer" }))
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
  })

  it("checks with the universal Control + Enter shortcut", async () => {
    const { user, editor } = await openLevel(1)
    await user.click(editor)
    replaceSource(editor, validDifferentProse())
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true })
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
  })

  it("moves focus Check → Next → editor with one unified shortcut", async () => {
    const { user, editor } = await openLevel(1)
    replaceSource(editor, validDifferentProse())
    await user.click(editor)
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(screen.getByRole("button", { name: "Next exercise" })).toHaveFocus()

    await user.keyboard("{Control>}{Enter}{/Control}")
    const nextEditor = screen.getByRole("textbox", { name: "Your Markdown" })
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
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
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
  })

  it("keeps Next unavailable and stays on Write after Try again", async () => {
    const { user, editor } = await openLevel(1)
    replaceSource(editor, malformedSource())
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(screen.queryByRole("button", { name: "Next exercise" })).toBeNull()
    expect(screen.getByRole("button", { name: "Check answer" })).toBeVisible()
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    await waitFor(() => expect(editor).toHaveFocus())

    await user.click(screen.getByRole("tab", { name: "Review" }))
    const review = screen.getByRole("tabpanel", { name: "Review" })
    expect(review).toHaveAttribute("tabindex", "0")
    expect(
      within(review).getByRole("list", { name: "Required corrections" }),
    ).toBeVisible()
    expect(review.querySelector(".rendered-document__body")).toBeNull()
    expect(review.querySelector("pre")).toBeNull()
    expect(review).not.toHaveTextContent("Diff")

    await user.keyboard("{Alt>}1{/Alt}")
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Your Markdown" })).toHaveFocus()
    })
    await user.keyboard("{Alt>}2{/Alt}")
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Review" })).toHaveFocus()
    })
  })

  it("keeps failed Review available while editing until a successful recheck", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) => problem.id === "l1-list-toolbox",
    )
    const { user, editor } = await openLevel(1)
    replaceSource(editor, malformedSource())
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    await user.click(screen.getByRole("tab", { name: "Review" }))
    const review = screen.getByRole("tabpanel", { name: "Review" })
    const checkedExcerpts = within(review)
      .getAllByText("You wrote")
      .map((label) => label.parentElement?.querySelector("code")?.textContent)
    expect(checkedExcerpts).not.toHaveLength(0)
    for (const checkedExcerpt of checkedExcerpts) {
      expect(checkedExcerpt).toContain(malformedSource())
    }

    await user.click(screen.getByRole("tab", { name: "Write" }))
    const activeEditor = screen.getByRole("textbox", { name: "Your Markdown" })
    replaceSource(activeEditor, validRepair())
    await user.click(screen.getByRole("tab", { name: "Review" }))

    expect(
      within(screen.getByRole("tabpanel", { name: "Review" })).getByRole(
        "list",
        { name: "Required corrections" },
      ),
    ).toBeVisible()
    expect(
      within(screen.getByRole("tabpanel", { name: "Review" }))
        .getAllByText("You wrote")
        .map((label) => label.parentElement?.querySelector("code")?.textContent),
    ).toEqual(checkedExcerpts)
    expect(screen.getByRole("button", { name: "Check answer" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Next exercise" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Check answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("tab", { name: "Preview" })).toBeVisible()
    expect(screen.queryByRole("tab", { name: "Review" })).toBeNull()
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
  })

  it("returns focus to the editor after every failed Check", async () => {
    const { user, editor } = await openLevel(1)
    replaceSource(editor, malformedSource())
    const check = screen.getByRole("button", { name: "Check answer" })

    await user.click(check)
    await waitFor(() => expect(editor).toHaveFocus())

    await user.click(check)
    await waitFor(() => expect(editor).toHaveFocus())
  })

  it("replaces Review and Hint feedback after a different failed recheck", async () => {
    useSessionSeedForFirstProblem(3, (problem) =>
      problem.matchChecks.some(
        (check) =>
          check.kind === "inline-presence" && check.inline === "strong",
      ),
    )
    const { user, editor } = await openLevel(3)
    const problem = currentProblem()
    const oldRequirement = problem.matchChecks.find(
      (check) =>
        check.kind === "inline-presence" && check.inline === "strong",
    )
    const newRequirement = problem.matchChecks.find(
      (check) => check.kind === "list-shape" && check.ordered === false,
    )
    if (!oldRequirement || !newRequirement) {
      throw new Error("Expected distinct composite-document requirements")
    }

    replaceSource(editor, problem.target.replace(/\*\*(.*?)\*\*/, "$1"))
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    await user.click(screen.getByRole("tab", { name: "Review" }))
    const firstReview = screen.getByRole("tabpanel", { name: "Review" })
    expect(within(firstReview).getByText(oldRequirement.feedback)).toBeVisible()
    expect(within(firstReview).queryByText(newRequirement.feedback)).toBeNull()

    await user.click(screen.getByRole("tab", { name: "Hint" }))
    const firstHint = screen.getByRole("tabpanel", { name: "Hint" })
    await user.click(
      within(firstHint).getByRole("button", { name: "Next hint" }),
    )
    expect(within(firstHint).getByText(oldRequirement.feedback)).toBeVisible()

    replaceSource(editor, problem.target.replace(/^- /gm, ""))
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    await user.click(screen.getByRole("tab", { name: "Review" }))
    const recheckedReview = screen.getByRole("tabpanel", { name: "Review" })
    expect(
      within(recheckedReview).getByText(newRequirement.feedback),
    ).toBeVisible()
    expect(
      within(recheckedReview).queryByText(oldRequirement.feedback),
    ).toBeNull()

    await user.click(screen.getByRole("tab", { name: "Hint" }))
    const recheckedHint = screen.getByRole("tabpanel", { name: "Hint" })
    expect(within(recheckedHint).getByText(newRequirement.feedback)).toBeVisible()
    expect(within(recheckedHint).queryByText(oldRequirement.feedback)).toBeNull()
  })

  it("lists every high-level correction without rendering either document", async () => {
    useSessionSeedForFirstProblem(3, (problem) =>
      problem.matchChecks.some(
        (check) => check.kind === "inline-presence" && check.inline === "strong",
      ),
    )
    const { user, editor } = await openLevel(3)
    const problem = currentProblem()

    replaceSource(editor, "")
    await user.click(screen.getByRole("button", { name: "Check answer" }))
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

  it("scopes post-failure Hint to every and only failed correction", async () => {
    useSessionSeedForFirstProblem(3, (problem) =>
      problem.matchChecks.some(
        (check) => check.kind === "inline-presence" && check.inline === "strong",
      ),
    )
    const { user, editor } = await openLevel(3)
    const problem = currentProblem()
    const boldCheck = problem.matchChecks.find(
      (check) => check.kind === "inline-presence" && check.inline === "strong",
    )
    if (!boldCheck) throw new Error("Expected a bold requirement")
    const withoutBold = problem.target.replace(/\*\*(.*?)\*\*/, "$1")
    const evaluation = evaluateProblem(problem, withoutBold)
    if (evaluation.status !== "fail") {
      throw new Error("Expected missing bold syntax to fail")
    }
    const boldCorrection = buildReviewCorrections(
      problem,
      evaluation,
      withoutBold,
    ).find((correction) => correction.id === boldCheck.id)
    if (!boldCorrection?.requiredSource) {
      throw new Error("Expected an exact bold source cue")
    }

    replaceSource(editor, withoutBold)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("tab", { name: "Hint" }))

    const hint = screen.getByRole("tabpanel", { name: "Hint" })
    expect(within(hint).getByText("Bold text")).toBeVisible()
    expect(within(hint).getByText(boldCorrection.requiredSource)).toBeVisible()
    expect(within(hint).queryByText("# Title")).toBeNull()
    expect(within(hint).queryByText(problem.teaching.howTo)).toBeNull()
    for (const authoredHint of problem.hints) {
      expect(within(hint).queryByText(authoredHint)).toBeNull()
    }

    await user.click(within(hint).getByRole("button", { name: "Next hint" }))
    expect(within(hint).getByText(boldCheck.feedback)).toBeVisible()
    expect(within(hint).queryByRole("button", { name: "Next hint" })).toBeNull()
  })

  it("keeps Markdown-structure Review optional after Matched", async () => {
    useSessionSeedForFirstProblem(
      1,
      (problem) => problem.id === "l1-list-toolbox",
    )
    const { user, editor } = await openLevel(1)
    replaceSource(editor, matchedWithReview())
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("Matched")
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeVisible()
    expect(screen.getByRole("tabpanel", { name: "Review" })).toHaveTextContent(
      currentProblem().editorialChecks[0]!.review,
    )
  })

  it("uses a different same-level problem after repair", async () => {
    const { user } = await openLevel(2)
    const originalGoal = screen.getByRole("region", { name: "Goal" }).textContent
    await user.keyboard(malformedSource())
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("tab", { name: "Write" }))
    replaceSource(
      screen.getByRole("textbox", { name: "Your Markdown" }),
      validRepair(),
    )
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))

    expect(screen.getByRole("region", { name: "Goal" }).textContent).not.toBe(
      originalGoal,
    )
    expect(
      screen.getByLabelText(`Level ${entryChoices[1].level}`),
    ).toBeVisible()
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

    const goal = screen.getByRole("region", { name: "Goal document" })
    const answer = screen.getByRole("textbox", { name: "Your Markdown" })
    const goalProcessor = goal.closest(".writing-processor")
    const answerProcessor = answer.closest(".writing-processor")

    expect(goalProcessor).not.toBeNull()
    expect(answerProcessor).not.toBeNull()
    expect(goalProcessor).toHaveAttribute("data-mode", "read-only")
    expect(answerProcessor).toHaveAttribute("data-mode", "edit")
    expect(goalProcessor).toHaveAttribute("data-engine", "codemirror")
    expect(answerProcessor).toHaveAttribute("data-engine", "codemirror")
    expect(goal).toHaveAttribute("data-presentation", "rendered")
    expect(answer.closest(".markdown-word-processor")).toHaveAttribute(
      "data-presentation",
      "source",
    )
    expect(goal.querySelector(".cm-content")).toHaveAttribute(
      "contenteditable",
      "false",
    )
    expect(answer).toHaveAttribute("contenteditable", "true")
    expect(goalProcessor?.querySelector(".writing-processor__rows")).not.toBeNull()
    expect(answerProcessor?.querySelector(".writing-processor__rows")).not.toBeNull()
    expect(goalProcessor?.querySelector(".writing-processor__content")).not.toBeNull()
    expect(answerProcessor?.querySelector(".writing-processor__content")).not.toBeNull()
  })

  it("renders Preview through the same read-only word processor as Goal", async () => {
    const { user, editor } = await openLevel(1)
    const source = "# Preview words\n\n- First item"
    replaceSource(editor, source)

    await user.click(screen.getByRole("tab", { name: "Preview" }))

    const preview = screen.getByRole("tabpanel", { name: "Preview" })
    const processor = preview.querySelector(
      '.markdown-word-processor[data-presentation="rendered"]',
    )
    expect(processor).not.toBeNull()
    expect(processor?.closest(".writing-processor")).toHaveAttribute(
      "data-engine",
      "codemirror",
    )
    expect(
      preview.querySelector(
        ".writing-processor__content > .rendered-document__body",
      ),
    ).toBeNull()

    const content = processor?.querySelector<HTMLElement>(".cm-content")
    expect(content).not.toBeNull()
    if (!content) return

    const view = EditorView.findFromDOM(content)
    expect(view?.state.doc.toString()).toBe(source)
    expect(content).toHaveAttribute("contenteditable", "false")
  })

  it("uses one word-processor page shell for Goal, Write, and Preview", async () => {
    const { user, editor } = await openLevel(2)
    const problem = currentProblem()
    const editorView = EditorView.findFromDOM(editor)
    expect(editorView?.state.doc.toString()).toBe(problem.starterText)

    const goalPage = screen
      .getByRole("region", { name: "Goal" })
      .querySelector('.word-processor-page[data-page="rendered"]')
    const writePage = screen
      .getByRole("tabpanel", { name: "Write" })
      .querySelector('.word-processor-page[data-page="source"]')
    expect(goalPage).not.toBeNull()
    expect(writePage).not.toBeNull()
    expect(goalPage).toHaveClass("writing-processor", "word-processor-page")
    expect(writePage).toHaveClass("writing-processor", "word-processor-page")

    const goalContent = goalPage?.querySelector<HTMLElement>(".cm-content")
    const writeContent = writePage?.querySelector<HTMLElement>(".cm-content")
    expect(goalContent).not.toBeNull()
    expect(writeContent).not.toBeNull()
    if (!goalContent || !writeContent) return
    expect(EditorView.findFromDOM(goalContent)?.state.doc.toString()).toBe(
      problem.target,
    )
    expect(goalContent).toHaveAttribute("contenteditable", "false")
    expect(writeContent).toHaveAttribute("contenteditable", "true")

    const source = "# Live page\n\n- One\n- Two"
    replaceSource(editor, source)
    await user.click(screen.getByRole("tab", { name: "Preview" }))

    const previewPage = screen
      .getByRole("tabpanel", { name: "Preview" })
      .querySelector('.word-processor-page[data-page="rendered"]')
    expect(previewPage).not.toBeNull()
    const previewContent = previewPage?.querySelector<HTMLElement>(".cm-content")
    expect(previewContent).not.toBeNull()
    if (!previewContent) return
    expect(EditorView.findFromDOM(previewContent)?.state.doc.toString()).toBe(
      source,
    )
    expect(previewPage).toHaveClass("writing-processor", "word-processor-page")
    expect(previewContent).toHaveAttribute("contenteditable", "false")
    expect(EditorView.findFromDOM(goalContent)?.state.doc.toString()).toBe(
      problem.target,
    )

    await user.click(screen.getByRole("tab", { name: "Write" }))
    const updatedSource = "## Updated live page\n\n1. First\n2. Second"
    replaceSource(editor, updatedSource)
    await user.click(screen.getByRole("tab", { name: "Preview" }))
    expect(EditorView.findFromDOM(previewContent)?.state.doc.toString()).toBe(
      updatedSource,
    )
    expect(EditorView.findFromDOM(goalContent)?.state.doc.toString()).toBe(
      problem.target,
    )
  })

  it("pre-fills the answer sheet with the Goal's prose so only the marks are missing", async () => {
    const { editor } = await openLevel(1)
    const problem = currentProblem()

    expect(problem.starterText).not.toBe("")
    expect(problem.starterText).not.toBe(problem.target)
    expect(EditorView.findFromDOM(editor)?.state.doc.toString()).toBe(
      problem.starterText,
    )
  })

  it("lets the learner retype immediately after Try again", async () => {
    const { user, editor } = await openLevel(1)
    replaceSource(editor, malformedSource())
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    expect(screen.getByRole("status")).toHaveTextContent("Try again")
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    replaceSource(editor, validDifferentProse())
    expect(EditorView.findFromDOM(editor)?.state.doc.toString()).toBe(
      validDifferentProse(),
    )
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    expect(screen.getByRole("status")).toHaveTextContent("Matched")
  })

  it("moves between visited problems with the in-app previous and next controls", async () => {
    const { user, editor } = await openLevel(1)
    const firstProblem = currentProblem()
    const previousButton = screen.getByRole("button", {
      name: "Previous exercise",
    })
    const nextVisitedButton = screen.getByRole("button", {
      name: "Next visited exercise",
    })
    expect(previousButton).toBeDisabled()
    expect(nextVisitedButton).toBeDisabled()

    const firstAnswer = validDifferentProse()
    replaceSource(editor, firstAnswer)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
    expect(currentProblem().id).not.toBe(firstProblem.id)
    expect(previousButton).toBeEnabled()
    expect(nextVisitedButton).toBeDisabled()

    await user.click(previousButton)
    expect(currentProblem().id).toBe(firstProblem.id)
    const restoredEditor = screen.getByRole("textbox", {
      name: "Your Markdown",
    })
    expect(EditorView.findFromDOM(restoredEditor)?.state.doc.toString()).toBe(
      firstAnswer,
    )
    expect(previousButton).toBeDisabled()
    expect(nextVisitedButton).toBeEnabled()

    await user.click(nextVisitedButton)
    expect(currentProblem().id).not.toBe(firstProblem.id)
    expect(nextVisitedButton).toBeDisabled()
  })

  it("keeps browser Back walking backwards after an in-app previous move", async () => {
    const { user, editor } = await openLevel(1)
    const firstProblem = currentProblem()
    replaceSource(editor, validDifferentProse())
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
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
    const { user, editor } = await openLevel(1)
    const firstProblem = currentProblem()

    replaceSource(editor, validDifferentProse())
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
    const secondProblem = currentProblem()
    expect(secondProblem.id).not.toBe(firstProblem.id)

    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblem.id))

    act(() => window.history.forward())
    await waitFor(() => expect(currentProblem().id).toBe(secondProblem.id))
  })

  it("keeps view shortcuts active across Write, Preview, and Hint", async () => {
    const { user, editor } = await openLevel(1)
    replaceSource(editor, "# Preview words")
    await user.click(editor)
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

  it("keeps view shortcuts active while the editor owns focus", async () => {
    const { user, editor } = await openLevel(1)
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    expect(editor).toHaveFocus()
    await user.keyboard("{Alt>}2{/Alt}")

    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(previewTab).toHaveFocus()
  })

  it("opens Hint with ? outside the editor without stealing typed question marks", async () => {
    const { user, editor } = await openLevel(1)

    await user.click(editor)
    expect(editor).toHaveFocus()
    await user.keyboard("question?")
    expect(EditorView.findFromDOM(editor)?.state.doc.toString()).toContain(
      "question?",
    )
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
    expect(editor).not.toHaveFocus()
  })

  it("keeps ? in the editor when a document-level key event observes editor focus", async () => {
    const { user, editor } = await openLevel(1)

    await user.click(editor)
    expect(editor).toHaveFocus()
    fireEvent.keyDown(document, { key: "?" })

    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(editor).toHaveFocus()
  })

  it("does not leave stale focus when a shortcut selects the current tab", async () => {
    const { user } = await openLevel(1)
    const hintTab = screen.getByRole("tab", { name: "Hint" })
    const previewTab = screen.getByRole("tab", { name: "Preview" })

    await user.click(screen.getByRole("textbox", { name: "Your Markdown" }))
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
    expect(
      screen.getByRole("textbox", { name: "Your Markdown" }),
    ).toHaveFocus()
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Practice progress, 1 of 6",
    )

    await user.click(screen.getByRole("button", { name: "Nabi Markdown home" }))
    expect(
      screen.getByRole("heading", { name: "Choose a chapter to begin." }),
    ).toBeVisible()
  })

  it("uses browser Back to revisit the previous problem and then the landing", async () => {
    const { user, editor } = await openLevel(1)
    const firstProblemId = currentProblem().id
    replaceSource(editor, currentProblem().target)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
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
    const { user, editor } = await openLevel(1)
    const firstProblemId = currentProblem().id
    replaceSource(editor, currentProblem().target)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
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
    const { user, editor } = await openLevel(1)
    const failedProblemId = currentProblem().id
    replaceSource(editor, "not markdown")
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    replaceSource(editor, currentProblem().target)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
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
    const repairEditor = screen.getByRole("textbox", { name: "Your Markdown" })
    replaceSource(repairEditor, currentProblem().target)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
    expect(currentProblem().id).not.toBe(repairProblemId)

    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(repairProblemId))
    await drainHistoryTraversals()
  })

  it("walks the history pointer forward when Forward is rejected on an owed repair", async () => {
    const { user, editor } = await openLevel(1)
    const firstProblemId = currentProblem().id
    replaceSource(editor, currentProblem().target)
    await user.click(screen.getByRole("button", { name: "Check answer" }))
    await user.click(screen.getByRole("button", { name: "Next exercise" }))
    const secondProblemId = currentProblem().id

    // Walk back to the first step so a real entry sits ahead of the pointer.
    act(() => window.history.back())
    await waitFor(() => expect(currentProblem().id).toBe(firstProblemId))

    // Fail it: a repair is now owed while the second step's entry lies ahead.
    const editorNow = screen.getByRole("textbox", { name: "Your Markdown" })
    replaceSource(editorNow, "not markdown")
    await user.click(screen.getByRole("button", { name: "Check answer" }))

    // Forward into the ahead entry is rejected; the heal must walk the
    // pointer BACK toward the current entry, not further forward.
    act(() => window.history.forward())
    await drainHistoryTraversals()
    const healedState = window.history.state as {
      snapshot?: { currentProblemId?: string }
    } | null
    expect(healedState?.snapshot?.currentProblemId).toBe(firstProblemId)
    expect(currentProblem().id).toBe(firstProblemId)
    expect(currentProblem().id).not.toBe(secondProblemId)
  })

  it("completes a run with one primary replay choice", async () => {
    const { user } = await openLevel(1)
    for (let index = 0; index < 6; index += 1) {
      const editor = screen.getByRole("textbox", { name: "Your Markdown" })
      replaceSource(editor, currentProblem().target)
      await user.click(screen.getByRole("button", { name: "Check answer" }))
      await user.click(screen.getByRole("button", { name: "Next exercise" }))
    }

    expect(screen.getByTestId("summary-page-turn-transition")).toBeVisible()
    expect(screen.getByTestId("summary-page-turn-transition")).toHaveAttribute(
      "inert",
    )
    expect(screen.getByLabelText("Run summary")).toHaveClass(
      "run-summary--waiting",
    )
    expect(screen.getByRole("heading", { name: "Well done." })).toHaveFocus()
    expect(screen.getByRole("button", { name: "Practice again" })).not.toHaveFocus()
    expect(screen.getByRole("heading", { name: "Summary" })).toBeVisible()
    expect(screen.queryByLabelText("Level 1 — Learn the syntax")).toBeNull()
    expect(screen.getByRole("button", { name: "Home" })).toBeVisible()
    expect(screen.queryByTestId("summary-book-spine")).toBeNull()
    expect(screen.queryByRole("button", { name: "Start over" })).toBeNull()
    expect(screen.getByRole("button", { name: "Change level" })).toBeVisible()

    await waitFor(
      () => {
        expect(screen.queryByTestId("summary-page-turn-transition")).toBeNull()
        expect(screen.getByLabelText("Run summary")).not.toHaveClass(
          "run-summary--waiting",
        )
      },
      { timeout: PAGE_TURN_DURATION_MS + 400 },
    )
  }, 10_000)
})
