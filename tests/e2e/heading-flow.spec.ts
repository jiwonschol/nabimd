import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"

type RuntimeProblemSource = {
  id: string
  target: string
}

const runtimeProjection = JSON.parse(
  readFileSync(
    new URL(
      "../../curriculum/problem-bank/runtime-projections.generated.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { levels: Record<string, RuntimeProblemSource[]> }
const runtimeProblemById = new Map(
  Object.values(runtimeProjection.levels)
    .flat()
    .map((problem) => [problem.id, problem]),
)

const levelLabels = [
  "Level 1 — Learn the syntax",
  "Level 2 — Rebuild real documents",
  "Level 3 — Write for people",
  "Level 4 — Write for work",
  "Level 5 — Write for developers",
] as const

const progressStorageKey = "nabimd.progress.v5"
const sessionSeedStorageKey = "nabimd.session-seed.v1"

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storageKey) => {
    if (window.sessionStorage.getItem(storageKey) === null) {
      window.sessionStorage.setItem(storageKey, "0")
    }
  }, sessionSeedStorageKey)
})

function cardBoxInput(page: Page): Locator {
  return page.getByRole("textbox", { name: /^Marks \d+ of \d+$/ }).first()
}

// Reads the growing document (the rendered processor on the answer page)
// through the webdriver-gated automation contract.
async function documentText(page: Page): Promise<string> {
  return page
    .locator(
      '.answer-panel [role="tabpanel"]:not([hidden]) .markdown-word-processor[data-presentation="rendered"] .markdown-source-editor__mount',
    )
    .last()
    .evaluate((mount) => {
      const readDocument = (
        mount as HTMLDivElement & {
          __nabimdReadDocumentForE2E?: () => string
        }
      ).__nabimdReadDocumentForE2E

      if (typeof readDocument !== "function") {
        throw new Error("Expected the supported CodeMirror document reader")
      }
      return readDocument()
    })
}

async function enterLevel(page: Page, level: 1 | 2 | 3 | 4 | 5) {
  await page.getByRole("button", { name: levelLabels[level - 1] }).click()
  await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
  await expect(cardBoxInput(page)).toBeFocused()
}

async function enterLevel1(page: Page) {
  await enterLevel(page, 1)
}

function slotMarksFor(target: string): string[] {
  return deriveSyntaxCheckpoints(target, "").map(
    (checkpoint) => checkpoint.canonicalInput,
  )
}

// Types one slot's marks into the card boxes (keystrokes route across box
// groups via the card's own focus advance) and confirms with Enter.
async function submitSlot(page: Page, marks: string) {
  const input = cardBoxInput(page)
  await expect(input).toBeVisible()
  if (!(await input.evaluate((el) => el === document.activeElement))) {
    await input.click()
  }
  await page.keyboard.type(marks)
  await page.keyboard.press("Enter")
}

async function completeProblem(page: Page) {
  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the current runtime problem")

  for (const marks of slotMarksFor(problem.target)) {
    await submitSlot(page, marks)
  }
}

async function completeProblemAndAdvance(page: Page) {
  const beforeId = await currentProblemId(page)
  await completeProblem(page)
  // Matched auto-advances after the verdict beat — no extra key, no click.
  await expect.poll(() => currentProblemId(page)).not.toBe(beforeId)
}

// Some regressions need document content the card would never accept (long
// filler, tracking pixels, foreign GFM). Those tests inject the draft into
// the saved session and reload — the render path is identical.
async function injectDraft(page: Page, source: string) {
  const problemId = await currentProblemId(page)
  await page.evaluate(
    ({ key, problemId, source }) => {
      const progress = JSON.parse(
        window.sessionStorage.getItem(key) ?? "null",
      ) as { draftByProblemId: Record<string, string> } | null
      if (!progress) throw new Error("Expected saved progress")
      progress.draftByProblemId[problemId] = source
      window.sessionStorage.setItem(key, JSON.stringify(progress))
    },
    { key: progressStorageKey, problemId, source },
  )
  await page.reload()
  await expect.poll(() => documentText(page)).toBe(source)
}

async function resetToGreeting(page: Page) {
  await page.goto("/")
  await page.evaluate((storageKey) => {
    window.sessionStorage.removeItem(storageKey)
  }, progressStorageKey)
  await page.reload()
}


async function currentProblemId(page: Page) {
  const panelId = await page
    .getByRole("tab", { name: "Write" })
    .getAttribute("aria-controls")
  if (!panelId?.startsWith("write-panel-")) {
    throw new Error("The active Write tab must identify its problem")
  }
  return panelId.slice("write-panel-".length)
}




test("greets a fresh session with the definitive five-level ladder", async ({
  page,
}) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
  for (const label of levelLabels) {
    await expect(page.getByRole("button", { name: label })).toBeVisible()
  }
  await expect(cardBoxInput(page)).toHaveCount(0)
})

test("opens third-party licenses in a new tab and keeps the landing open", async ({
  page,
}) => {
  await page.goto("/")
  const landingUrl = page.url()
  const licensesLink = page.getByRole("link", {
    name: "Third-party licenses",
  })

  const popupPromise = page.waitForEvent("popup")
  await licensesLink.click()
  const licensesPage = await popupPromise
  await licensesPage.waitForLoadState("domcontentloaded")

  expect(new URL(licensesPage.url()).pathname).toBe(
    "/third-party-licenses.html",
  )
  expect(page.url()).toBe(landingUrl)
  await expect(
    page.getByRole("heading", { name: "Markdown is easy." }),
  ).toBeVisible()

  await licensesPage.close()
})

test("keeps every chapter reachable in a short landscape viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 812, height: 375 })
  await page.goto("/")

  const introMetrics = await page
    .locator(".open-book-page--intro")
    .evaluate((element) => ({
      clientHeight: element.clientHeight,
      overflowY: window.getComputedStyle(element).overflowY,
      scrollHeight: element.scrollHeight,
    }))
  const mottoBodySize = await page
    .locator(".open-book-motto__body")
    .evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element).fontSize),
    )
  const instructionSize = await page
    .getByRole("heading", { name: "Choose a chapter to begin." })
    .evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element).fontSize),
    )

  expect(introMetrics.overflowY).not.toBe("auto")
  expect(introMetrics.scrollHeight).toBeLessThanOrEqual(
    introMetrics.clientHeight,
  )
  expect(mottoBodySize).toBeGreaterThan(instructionSize)
  await page.getByRole("button", { name: levelLabels[4] }).click()
  await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
  await expect(cardBoxInput(page)).toBeFocused()
})

test("keeps the open-book landing inside a tablet viewport", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto("/")

  const pageMetrics = await page
    .locator(".open-book-page--intro")
    .evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))

  expect(pageMetrics.scrollWidth).toBeLessThanOrEqual(pageMetrics.clientWidth)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(768)
})

test("keeps the landing wordmark clear of the motto in a short book", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await page.goto("/")

  const [wordmark, motto] = await Promise.all([
    page.locator(".open-book-page--intro > .wordmark").boundingBox(),
    page.locator(".open-book-motto").boundingBox(),
  ])
  expect(wordmark).not.toBeNull()
  expect(motto).not.toBeNull()
  expect(wordmark!.y + wordmark!.height + 8).toBeLessThanOrEqual(motto!.y)
})

test("keeps the same book spread geometry across the page turn", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 1000 })
  await page.goto("/")

  const landing = await page.locator(".app-shell.open-book-shell").boundingBox()
  expect(landing).not.toBeNull()

  await enterLevel(page, 5)
  const practice = await page.locator(".app-shell--practice").boundingBox()
  expect(practice).not.toBeNull()

  expect(Math.abs(practice!.x - landing!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(practice!.width - landing!.width)).toBeLessThanOrEqual(1)
})

test("every level opens its task-type turn", async ({ page }) => {
  for (const index of levelLabels.keys()) {
    await page.goto("/")
    await enterLevel(page, (index + 1) as 1 | 2 | 3 | 4 | 5)
    await expect(page.getByLabel("Practice details")).toContainText(
      `Level ${index + 1}`,
    )
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    )
    await expect(cardBoxInput(page)).toBeFocused()
    await page.getByRole("button", { name: "Nabi Markdown home" }).click()
    await expect(
      page.getByRole("heading", { name: "Choose a chapter to begin." }),
    ).toBeVisible()
  }
})

test("re-entering a level starts a different run", async ({ page }) => {
  await page.goto("/")
  await enterLevel(page, 1)
  const firstProblemId = await currentProblemId(page)

  await page.getByRole("button", { name: "Nabi Markdown home" }).click()
  await expect(
    page.getByRole("heading", { name: "Choose a chapter to begin." }),
  ).toBeVisible()

  await enterLevel(page, 1)
  expect(await currentProblemId(page)).not.toBe(firstProblemId)
})

test("browser history moves between problems and the level picker", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel(page, 1)
  const firstProblemId = await currentProblemId(page)
  const firstProblem = runtimeProblemById.get(firstProblemId)
  if (!firstProblem) throw new Error(`Missing runtime problem: ${firstProblemId}`)

  await completeProblem(page)
  await expect.poll(() => currentProblemId(page)).not.toBe(firstProblemId)
  const secondProblemId = await currentProblemId(page)

  await page.goBack()
  await expect.poll(() => currentProblemId(page)).toBe(firstProblemId)

  await page.goBack()
  await expect(
    page.getByRole("heading", { name: "Choose a chapter to begin." }),
  ).toBeVisible()

  await page.goForward()
  await expect.poll(() => currentProblemId(page)).toBe(firstProblemId)

  await page.goForward()
  await expect.poll(() => currentProblemId(page)).toBe(secondProblemId)
})

test("keeps the card ready for retyping immediately after a slot Try again", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)

  await submitSlot(page, "x")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(page.getByRole("tab", { name: "Write" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(cardBoxInput(page)).toBeFocused()

  // The wrong mark stays selected-for-replacement: clear and retype.
  await page.keyboard.press("Backspace")
  await completeProblem(page)
  await expect(page.getByRole("status")).toContainText("Matched")
})

test("navigates visited problems with the in-app previous and next controls", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const firstProblemId = await currentProblemId(page)
  const previous = page.getByRole("button", { name: "Previous exercise" })
  const nextVisited = page.getByRole("button", {
    name: "Next visited exercise",
  })
  await expect(previous).toBeDisabled()
  await expect(nextVisited).toBeDisabled()

  await completeProblemAndAdvance(page)
  const secondProblemId = await currentProblemId(page)
  expect(secondProblemId).not.toBe(firstProblemId)
  await expect(previous).toBeEnabled()

  await previous.click()
  await expect.poll(() => currentProblemId(page)).toBe(firstProblemId)
  await expect(previous).toBeDisabled()
  await expect(nextVisited).toBeEnabled()

  await nextVisited.click()
  await expect.poll(() => currentProblemId(page)).toBe(secondProblemId)
  await expect(nextVisited).toBeDisabled()
})

test("accepts the second italic syntax typed into the card", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "23")
  }, sessionSeedStorageKey)
  await page.goto("/")
  await enterLevel(page, 1)
  expect(await currentProblemId(page)).toBe("l1-italic-paper-boat")

  // The card accepts the underscore pair in place of the canonical asterisks
  // and lands it in the document exactly as typed.
  await submitSlot(page, "__")
  await expect(page.getByRole("status")).toContainText("Matched")
  expect(await documentText(page)).toBe("_Paper boat_")
})

test("makes practice syntax scale, spacing, and the shared shortcut visible", async ({
  page,
}) => {
  const consoleNoise: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleNoise.push(message.text())
  })
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "1")
  }, sessionSeedStorageKey)
  await page.goto("/")
  await enterLevel(page, 2)
  expect(await currentProblemId(page)).toBe("l2-sectioned-message-bus-stop")

  const headingSizes = await Promise.all(
    [1, 2, 3].map((depth) =>
      page
        .locator(`.goal-panel .cm-rendered-heading--${depth}`)
        .first()
        .evaluate((element) =>
          Number.parseFloat(window.getComputedStyle(element).fontSize),
        ),
    ),
  )
  expect(headingSizes[0]).toBeGreaterThan(headingSizes[1]!)
  expect(headingSizes[1]).toBeGreaterThan(headingSizes[2]!)

  const betweenWordSpace = page
    .locator(".goal-panel .cm-invisible-character--space")
    .first()
  await expect(betweenWordSpace).toBeVisible()
  await expect(betweenWordSpace).toHaveClass(/cm-invisible-character--word-space/)
  const spaceStyle = await betweenWordSpace.evaluate((element) => ({
    color: window.getComputedStyle(element).color,
    glyph: window.getComputedStyle(element, "::after").content,
  }))
  expect(spaceStyle).toEqual({
    color: "rgba(168, 92, 92, 0.62)",
    glyph: '"·"',
  })

  const check = page.getByRole("button", { name: "Check answer" })
  await expect(check).toContainText("Ctrl+↩")
  const matchedProblemId = await currentProblemId(page)
  await completeProblem(page)

  // The final slot judged the answer and, after the verdict beat, moved the
  // run forward by itself.
  await expect.poll(() => currentProblemId(page)).not.toBe(matchedProblemId)
  expect(consoleNoise).toEqual([])
})

test("starts every level blank and grows the document from the card", async ({
  page,
}) => {
  for (const level of [1, 2, 3, 4, 5] as const) {
    await resetToGreeting(page)
    await enterLevel(page, level)
    const problemId = await currentProblemId(page)
    const problem = runtimeProblemById.get(problemId)
    if (!problem) throw new Error(`Missing runtime problem: ${problemId}`)

    // The page opens blank; the first accepted slot grows the document into
    // a prefix of the Goal.
    await expect.poll(() => documentText(page)).toBe("")
    await expect(cardBoxInput(page)).toBeFocused()

    await submitSlot(page, slotMarksFor(problem.target)[0]!)
    await expect.poll(async () => {
      const grown = await documentText(page)
      return grown !== "" && problem.target.startsWith(grown)
    }).toBe(true)
  }
})

test("completes and replays Level 1 with keyboard input only", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: levelLabels[0] })).toBeFocused()
  await page.keyboard.press("Enter")

  await expect(cardBoxInput(page)).toBeFocused()
  await expect(page.getByRole("tab", { name: "Hint" })).toHaveAttribute(
    "aria-selected",
    "false",
  )

  for (let exercise = 0; exercise < 6; exercise += 1) {
    await expect(cardBoxInput(page)).toBeFocused()
    if (exercise < 5) {
      await completeProblemAndAdvance(page)
    } else {
      await completeProblem(page)
    }
  }

  const transition = page.getByTestId("summary-page-turn-transition")
  await expect(transition).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Well done." }),
  ).toBeFocused()
  const openingFrame = await page.evaluate(() => {
    const app = document.querySelector<HTMLElement>(
      ".page-turn-receiver > .app-shell",
    )
    const summary = document.querySelector<HTMLElement>(".run-summary")
    const ink = document.querySelector<HTMLElement>(".summary-ink")
    if (!app || !summary || !ink) throw new Error("Expected the Summary frame")
    return {
      app: app.getBoundingClientRect().toJSON(),
      clipPath: getComputedStyle(ink).clipPath,
      summary: summary.getBoundingClientRect().toJSON(),
    }
  })
  expect(openingFrame.clipPath).toBe("none")
  await expect(transition).toHaveCount(0)
  const settledFrame = await page.evaluate(() => {
    const app = document.querySelector<HTMLElement>(
      ".page-turn-receiver > .app-shell",
    )
    const summary = document.querySelector<HTMLElement>(".run-summary")
    if (!app || !summary) throw new Error("Expected the settled Summary frame")
    return {
      app: app.getBoundingClientRect().toJSON(),
      summary: summary.getBoundingClientRect().toJSON(),
    }
  })
  expect(settledFrame).toEqual({
    app: openingFrame.app,
    summary: openingFrame.summary,
  })
  await expect(page.getByLabel("Score")).toContainText("6 / 6")
  await expect(page.getByLabel("Total time")).toContainText(/\d{2}:\d{2}/)
  await expect(page.getByText("Nothing to revisit this time.")).toBeVisible()
  await expect(page.getByText(/standing|percentile/i)).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Summary" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Home", exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("list", { name: "Turn steps" })).toHaveCount(0)
  const pageMetrics = await page.evaluate(() => ({
    body: document.body.scrollHeight,
    document: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }))
  expect(pageMetrics.body).toBeLessThanOrEqual(pageMetrics.viewport)
  expect(pageMetrics.document).toBeLessThanOrEqual(pageMetrics.viewport)
  const practiceAgain = page.getByRole("button", { name: "Practice again" })
  await expect(practiceAgain).not.toBeFocused()
  await practiceAgain.focus()
  await page.keyboard.press("Enter")
  await expect(cardBoxInput(page)).toBeFocused()
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  )
})

test("drives the drill loop — verdict hold, fix, auto-advance, Alt navigation, hint peek — from the keyboard alone", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const firstProblemId = await currentProblemId(page)

  // A wrong mark holds the slot: the card verdict stays put while the boxes
  // remain focused for the retry.
  await submitSlot(page, "x")
  const verdict = page.getByRole("status")
  await expect(verdict).toContainText("Try again")
  await page.waitForTimeout(2000)
  await expect(verdict).toContainText("Try again")
  await expect(cardBoxInput(page)).toBeFocused()

  // Retyping puts the verdict away without any extra key.
  await page.keyboard.press("Backspace")
  await expect(page.getByRole("status")).toHaveCount(0)

  // The accepted slots grow the document and, after the beat, the run
  // advances — no second key.
  await completeProblem(page)
  await expect.poll(() => currentProblemId(page)).not.toBe(firstProblemId)
  await completeProblemAndAdvance(page)
  const thirdProblemId = await currentProblemId(page)

  // Alt+P walks back through visited steps; Alt+N returns forward.
  await page.keyboard.press("Alt+P")
  await expect.poll(() => currentProblemId(page)).not.toBe(thirdProblemId)
  await page.keyboard.press("Alt+N")
  await expect.poll(() => currentProblemId(page)).toBe(thirdProblemId)

  // Alt+H peeks at the Hint; the same key closes it and hands the card
  // back, ready to type.
  await page.keyboard.press("Alt+H")
  await expect(page.getByRole("tab", { name: "Hint" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await page.keyboard.press("Alt+H")
  await expect(page.getByRole("tab", { name: "Write" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(cardBoxInput(page)).toBeFocused()
})

test("blocks an early Check, then accepts the repair and transfers practice", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const originalGoal = await page
    .getByRole("region", { name: "Goal", exact: true })
    .textContent()

  // Asking for judgment on the not-yet-grown document fails it and owes a
  // repair.
  await page.getByRole("button", { name: "Check answer" }).click()
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(
    page.getByRole("button", { name: "Next exercise" }),
  ).toHaveCount(0)
  await page.getByRole("tab", { name: "Review" }).click()
  await expect(
    page
      .getByRole("tabpanel", { name: "Review" })
      .getByRole("list", { name: "Required corrections" })
      .getByRole("listitem")
      .first(),
  ).toBeVisible()

  await page.keyboard.press("Alt+1")
  await expect(cardBoxInput(page)).toBeFocused()
  await completeProblem(page)
  await expect(page.getByRole("status")).toContainText("Matched")
  // The repaired answer flows straight into the transfer exercise.
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  )
  await expect(page.getByLabel("Practice details")).toContainText(
    "Repair practice",
  )
  await expect(page.getByLabel("Practice details")).toContainText(
    "Exercise 2 of 7",
  )
  await expect(
    page.getByRole("region", { name: "Goal", exact: true }),
  ).not.toHaveText(
    originalGoal ?? "",
  )
})

test("Try another stays in level and serves different content", async ({ page }) => {
  await page.goto("/")
  await enterLevel(page, 3)

  const goal = page.getByRole("region", { name: "Goal", exact: true })
  const before = await goal.textContent()
  await page.getByRole("button", { name: "Try another" }).click()
  await expect(goal).not.toHaveText(before ?? "")
  await expect(page.getByLabel("Practice details")).toContainText("Level 3")
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  )
})

test("keeps Hint out of the way until the learner requests it", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel(page, 1)

  const hintTab = page.getByRole("tab", { name: "Hint" })
  await expect(hintTab).toHaveAttribute("aria-selected", "false")
  await expect(page.getByRole("tabpanel", { name: "Hint" })).toHaveCount(0)
  await page.getByRole("button", { name: "Exit" }).focus()
  await page.keyboard.press("?")
  await expect(hintTab).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("tabpanel", { name: "Hint" })).toBeVisible()
  await expect(page.getByLabel("Markdown pattern")).toBeVisible()
})

test("persists the grown document only for the browser session", async ({ page }) => {
  await page.goto("/")
  // A multi-slot Level 2 problem: growing the first slot never completes the
  // problem, so no auto-advance races the reload below.
  await enterLevel(page, 2)
  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the current runtime problem")
  expect(slotMarksFor(problem.target).length).toBeGreaterThan(1)
  await submitSlot(page, slotMarksFor(problem.target)[0]!)
  const grown = await documentText(page)
  expect(grown).not.toBe("")

  const stored = await page.evaluate((key) => {
    const progress = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as {
      draftByProblemId?: Record<string, string>
      runStartedAtMs?: number
    }
    return {
      drafts: Object.values(progress.draftByProblemId ?? {}),
      runStartedAtMs: progress.runStartedAtMs,
    }
  }, progressStorageKey)
  expect(stored.drafts).toContain(grown)

  await page.waitForTimeout(1_100)

  await page.reload()
  await expect.poll(() => documentText(page)).toBe(grown)
  await expect(page.getByLabel("Elapsed time")).not.toHaveText("00:00")
  const restoredStartedAt = await page.evaluate((key) => {
    const progress = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as {
      runStartedAtMs?: number
    }
    return progress.runStartedAtMs
  }, progressStorageKey)
  expect(restoredStartedAt).toBe(stored.runStartedAtMs)
})

test("keeps Goal and Answer equal with fixed chrome at 1280x800", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 5)

  const topbar = page.locator(".exercise-topbar")
  const goal = page.getByRole("region", { name: "Goal", exact: true })
  const answer = page.getByRole("region", { name: "Your answer" })
  const [topbarBox, goalBox, answerBox] = await Promise.all([
    topbar.boundingBox(),
    goal.boundingBox(),
    answer.boundingBox(),
  ])
  for (const box of [topbarBox, goalBox, answerBox]) {
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(800)
  }
  expect(Math.abs(goalBox!.width - answerBox!.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(goalBox!.height - answerBox!.height)).toBeLessThanOrEqual(1)

  const pageMetrics = await page.evaluate(() => ({
    body: document.body.scrollHeight,
    document: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }))
  expect(pageMetrics.body).toBeLessThanOrEqual(pageMetrics.viewport)
  expect(pageMetrics.document).toBeLessThanOrEqual(pageMetrics.viewport)

  const goalScroll = await goal.locator(".cm-scroller").evaluate((node) => ({
    clientHeight: node.clientHeight,
    overflowY: window.getComputedStyle(node).overflowY,
    scrollHeight: node.scrollHeight,
  }))
  expect(goalScroll.overflowY).toBe("auto")
  expect(goalScroll.scrollHeight).toBeGreaterThan(goalScroll.clientHeight)
})

test("keeps Goal and Write on the same source rows for Bus card", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "13")
  }, sessionSeedStorageKey)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 2)

  expect(await currentProblemId(page)).toBe("l2-code-block-bus-reference")
  const problem = runtimeProblemById.get("l2-code-block-bus-reference")
  if (!problem) throw new Error("Bus card must exist in the runtime bank")
  // Complete the card, let the run advance, and step back: the revisited
  // step shows the finished document with no card and no pending advance.
  await completeProblemAndAdvance(page)
  await page.getByRole("button", { name: "Previous exercise" }).click()
  await expect
    .poll(() => currentProblemId(page))
    .toBe("l2-code-block-bus-reference")

  const assertSharedRows = async (expectedHeight: number) => {
    const [goalEditable, answerEditable] = await Promise.all([
      page
        .locator(".goal-panel .cm-content")
        .getAttribute("contenteditable"),
      page
        .locator(
          ".answer-panel [role='tabpanel']:not([hidden]) .cm-content",
        )
        .last()
        .getAttribute("contenteditable"),
    ])
    expect(goalEditable).toBe("false")
    expect(answerEditable).toBe("false")

    const rows = await page.evaluate(() => {
      const collect = (selector: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).map(
          (row) => {
            const box = row.getBoundingClientRect()
            return {
              height: box.height,
              text: row.innerText,
              top: box.top,
            }
          },
        )
      return {
        answer: collect(".answer-panel [role='tabpanel']:not([hidden]) .cm-line"),
        answerGutter: collect(".answer-panel [role='tabpanel']:not([hidden]) .writing-processor__row"),
        goal: collect(".goal-panel .cm-line"),
        goalGutter: collect(".goal-panel .writing-processor__row"),
      }
    })

    expect(rows.goal).toHaveLength(8)
    expect(rows.answer).toHaveLength(8)
    for (let index = 0; index < 8; index += 1) {
      // Rendered widgets can distribute one fractional pixel differently at
      // this breakpoint; two pixels is the maximum full-row optical drift.
      expect(
        Math.abs(rows.goal[index]!.top - rows.answer[index]!.top),
        `Shared row ${index + 1}: ${JSON.stringify(rows)}`,
      ).toBeLessThanOrEqual(2)
      expect(Math.abs(rows.goal[index]!.height - rows.answer[index]!.height))
        .toBeLessThanOrEqual(1)
      expect(Math.abs(rows.goal[index]!.height - expectedHeight))
        .toBeLessThanOrEqual(1)
      const gutterIndex = index + 2
      const goalGutterDelta = Math.abs(
        rows.goal[index]!.top - rows.goalGutter[gutterIndex]!.top,
      )
      const answerGutterDelta = Math.abs(
        rows.answer[index]!.top - rows.answerGutter[gutterIndex]!.top,
      )
      expect(
        goalGutterDelta,
        `Goal row ${index + 1}: ${JSON.stringify(rows)}`,
      ).toBeLessThanOrEqual(1)
      expect(
        answerGutterDelta,
        `Answer row ${index + 1}: ${JSON.stringify(rows)}`,
      ).toBeLessThanOrEqual(1)
    }
    for (const index of [1, 2, 4, 5]) {
      expect(rows.goal[index]!.text.trim()).toBe("↵")
    }
  }

  await assertSharedRows(40)
  await page.setViewportSize({ width: 1024, height: 768 })
  await assertSharedRows(36)
})

test("Preview is the same rendered word processor as Goal", async ({ page }) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "13")
  }, sessionSeedStorageKey)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 2)

  expect(await currentProblemId(page)).toBe("l2-code-block-bus-reference")
  const problem = runtimeProblemById.get("l2-code-block-bus-reference")
  if (!problem) throw new Error("Bus card must exist in the runtime bank")
  await completeProblemAndAdvance(page)
  await page.getByRole("button", { name: "Previous exercise" }).click()
  await expect
    .poll(() => currentProblemId(page))
    .toBe("l2-code-block-bus-reference")
  await page.getByRole("tab", { name: "Preview" }).click()

  const preview = page.getByRole("tabpanel", { name: "Preview" })
  const renderedProcessor = preview.locator(
    '.markdown-word-processor[data-presentation="rendered"]',
  )
  await expect(renderedProcessor).toHaveCount(1)
  await expect(
    preview.locator(
      '.writing-processor[data-engine="codemirror"][data-mode="read-only"]',
    ),
  ).toHaveCount(1)
  await expect(renderedProcessor.locator(".cm-content")).toHaveAttribute(
    "contenteditable",
    "false",
  )
  await expect(
    preview.locator(
      ".writing-processor__content > .rendered-document__body",
    ),
  ).toHaveCount(0)

  const assertRenderedParity = async () => {
    const metrics = await page.evaluate(() => {
      const collect = (selector: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).map(
          (line) => {
            const box = line.getBoundingClientRect()
            const style = window.getComputedStyle(line)
            return {
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              height: box.height,
              lineHeight: style.lineHeight,
              text: line.innerText,
              top: box.top,
            }
          },
        )
      return {
        goal: collect(".goal-panel .cm-line"),
        preview: collect(
          '.answer-panel [role="tabpanel"]:not([hidden]) .cm-line',
        ),
      }
    })

    expect(metrics.goal).toHaveLength(problem.target.split("\n").length)
    expect(metrics.preview).toHaveLength(metrics.goal.length)
    metrics.goal.forEach((goalLine, index) => {
      const previewLine = metrics.preview[index]!
      expect(previewLine.text).toBe(goalLine.text)
      expect(previewLine.fontFamily).toBe(goalLine.fontFamily)
      expect(previewLine.fontSize).toBe(goalLine.fontSize)
      expect(previewLine.fontWeight).toBe(goalLine.fontWeight)
      expect(previewLine.lineHeight).toBe(goalLine.lineHeight)
      expect(Math.abs(previewLine.top - goalLine.top)).toBeLessThanOrEqual(1)
      expect(Math.abs(previewLine.height - goalLine.height)).toBeLessThanOrEqual(1)
    })
  }

  await assertRenderedParity()
  await page.setViewportSize({ width: 1024, height: 768 })
  await assertRenderedParity()

  await page.getByRole("tab", { name: "Write" }).click()
  await injectDraft(
    page,
    Array.from({ length: 40 }, (_, index) => `Document line ${index + 1}`).join(
      "\n",
    ),
  )
  await page.getByRole("tab", { name: "Preview" }).click()
  // CodeMirror virtualizes long documents, so assert the content through the
  // document reader rather than counting rendered rows.
  await expect
    .poll(async () => (await documentText(page)).split("\n").length)
    .toBe(40)
  const previewScroller = preview.locator(".cm-scroller")
  await previewScroller.evaluate((node) => {
    node.scrollTop = 120
    node.dispatchEvent(new Event("scroll"))
  })
  await expect
    .poll(() =>
      preview.locator(".writing-processor__rows").getAttribute("style"),
    )
    .toContain("translateY(-120px)")
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
})

test("collapsed link syntax cannot add visual rows to the rendered Goal", async ({
  page,
}) => {
  const problemId = "l3-reference-office-purchase"
  const seed = 6
  await page.addInitScript(
    ({ storageKey, value }) => {
      window.sessionStorage.setItem(storageKey, String(value))
    },
    { storageKey: sessionSeedStorageKey, value: seed },
  )
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto("/")
  await enterLevel(page, 3)

  expect(await currentProblemId(page)).toBe(problemId)
  const problem = runtimeProblemById.get(problemId)
  if (!problem) throw new Error(`${problemId} must exist in the runtime bank`)
  await completeProblemAndAdvance(page)
  await page.getByRole("button", { name: "Previous exercise" }).click()
  await expect.poll(() => currentProblemId(page)).toBe(problemId)

  const metrics = await page.evaluate(() => {
    const measure = (selector: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map(
        (line) => {
          const box = line.getBoundingClientRect()
          return {
            height: box.height,
            top: box.top,
          }
        },
      )
    return {
      answer: measure(
        ".answer-panel [role='tabpanel']:not([hidden]) .cm-line",
      ),
      goal: measure(".goal-panel .cm-line"),
    }
  })

  // The rendered Goal must keep one visual line per source line even though
  // the link marks are concealed; the count parity above is the actual
  // collapsed-link claim. The heading row anchors the shared row grid —
  // paragraph rows wrap differently between the serif rendered page and the
  // mono source page, so only the single-row heading compares exactly.
  expect(metrics.goal).toHaveLength(problem.target.split("\n").length)
  expect(metrics.answer).toHaveLength(metrics.goal.length)
  expect(metrics.goal[0]!.height).toBe(metrics.answer[0]!.height)
})

test("keeps the Practice chrome groups disjoint at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto("/")
  await enterLevel(page, 5)

  const [exit, level] = await Promise.all([
    page.getByRole("button", { name: "Exit" }).boundingBox(),
    page.locator(".exercise-progress__level").boundingBox(),
  ])
  expect(exit).not.toBeNull()
  expect(level).not.toBeNull()
  expect(exit!.x + exit!.width + 8).toBeLessThanOrEqual(level!.x)
})

for (const width of [320, 480, 760]) {
  test(`keeps mobile Practice actions above the workspace at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/")
    await enterLevel(page, 1)

    const [actions, tryAnother, check, workspace] = await Promise.all([
      page.locator(".exercise-topbar__end").boundingBox(),
      page.getByRole("button", { name: "Try another" }).boundingBox(),
      page.getByRole("button", { name: "Check answer" }).boundingBox(),
      page.locator(".cbt-workspace").boundingBox(),
    ])

    for (const box of [actions, tryAnother, check, workspace]) {
      expect(box).not.toBeNull()
    }

    for (const box of [actions!, tryAnother!, check!]) {
      expect(
        box.y + box.height,
        `mobile topbar actions must end before the workspace starts: ${JSON.stringify({
          actions,
          check,
          tryAnother,
          workspace,
        })}`,
      ).toBeLessThanOrEqual(workspace!.y)
    }
  })
}

for (const viewport of [
  { width: 901, height: 768 },
  { width: 800, height: 500 },
]) {
  test(`keeps Level 5 readable in a ${viewport.width}x${viewport.height} desktop window`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await enterLevel(page, 5)

    const [start, progress, goal, answer, header, instruction] = await Promise.all([
      page.locator(".exercise-topbar__start").boundingBox(),
      page.locator(".exercise-progress").boundingBox(),
      page.getByRole("region", { name: "Goal", exact: true }).boundingBox(),
      page.getByRole("region", { name: "Your answer" }).boundingBox(),
      page.locator(".goal-panel > .cbt-panel__header").boundingBox(),
      page.locator(".goal-panel__instruction").boundingBox(),
    ])

    for (const box of [start, progress, goal, answer, header, instruction]) {
      expect(box).not.toBeNull()
    }

    const progressOverlapWidth =
      Math.min(start!.x + start!.width, progress!.x + progress!.width) -
      Math.max(start!.x, progress!.x)
    const progressOverlapHeight =
      Math.min(start!.y + start!.height, progress!.y + progress!.height) -
      Math.max(start!.y, progress!.y)
    expect(Math.min(progressOverlapWidth, progressOverlapHeight)).toBeLessThanOrEqual(0)
    expect(Math.abs(goal!.y - answer!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(goal!.width - answer!.width)).toBeLessThanOrEqual(1)
    expect(instruction!.y).toBeGreaterThanOrEqual(header!.y)
    expect(instruction!.y + instruction!.height).toBeLessThanOrEqual(
      header!.y + header!.height + 1,
    )

    const horizontalFlow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }))
    expect(horizontalFlow.document).toBeLessThanOrEqual(horizontalFlow.viewport)
  })
}

test("keeps short-landscape Practice as two usable book pages", async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 })
  await page.goto("/")
  await enterLevel(page, 3)

  const [goal, answer] = await Promise.all([
    page.getByRole("region", { name: "Goal", exact: true }).boundingBox(),
    page.getByRole("region", { name: "Your answer" }).boundingBox(),
  ])
  expect(goal).not.toBeNull()
  expect(answer).not.toBeNull()
  expect(Math.abs(goal!.y - answer!.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(goal!.width - answer!.width)).toBeLessThanOrEqual(1)
  expect(goal!.height).toBeGreaterThan(150)
  expect(answer!.height).toBeGreaterThan(150)
})

test("moves failed Review focus to its single reading scroller", async ({ page }) => {
  await page.setViewportSize({ width: 756, height: 672 })
  await page.goto("/")
  await enterLevel(page, 3)

  await page.getByRole("button", { name: "Check answer" }).click()
  await expect(page.getByRole("status")).toContainText("Try again")

  const reviewTab = page.getByRole("tab", { name: "Review" })
  await reviewTab.click()
  const review = page.getByRole("tabpanel", { name: "Review" })
  await expect(reviewTab).toHaveAttribute("aria-selected", "true")
  await review.focus()
  await expect(review).toBeFocused()

  const metrics = await review.evaluate((panel) => {
    const list = panel.querySelector<HTMLElement>(".answer-review__corrections")
    const firstItem = list?.querySelector<HTMLElement>("li")
    const panelStyle = window.getComputedStyle(panel)
    const listStyle = list ? window.getComputedStyle(list) : null
    const itemStyle = firstItem ? window.getComputedStyle(firstItem, "::before") : null
    return {
      panelOverflowY: panelStyle.overflowY,
      panelTabIndex: panel.tabIndex,
      listOverflowY: listStyle?.overflowY,
      listStyleType: listStyle?.listStyleType,
      counterContent: itemStyle?.content,
    }
  })
  expect(metrics.panelOverflowY).toBe("auto")
  expect(metrics.panelTabIndex).toBe(0)
  expect(metrics.listOverflowY).toBe("visible")
  expect(metrics.listStyleType).toBe("none")
  expect(metrics.counterContent).not.toBe("none")

  const beforeScroll = await review.evaluate((panel) => panel.scrollTop)
  await page.keyboard.press("PageDown")
  await expect
    .poll(() => review.evaluate((panel) => panel.scrollTop))
    .toBeGreaterThan(beforeScroll)
})

test("opens a narrow Summary on praise without scrolling to its action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 800 })
  await page.goto("/")
  await enterLevel1(page)

  for (let turn = 0; turn < 6; turn += 1) {
    if (turn < 5) {
      await completeProblemAndAdvance(page)
    } else {
      await completeProblem(page)
    }
  }

  const summary = page.locator(".run-summary")
  await expect(page.getByTestId("summary-page-turn-transition")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Well done." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Well done." })).toBeFocused()
  await expect(page.getByTestId("summary-page-turn-transition")).toHaveCount(0)
  expect(await summary.evaluate((element) => element.scrollTop)).toBe(0)
  await expect(page.getByRole("button", { name: "Practice again" })).not.toBeFocused()
})

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 375, height: 812 },
]) {
  test(`keeps the completed book stable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await enterLevel1(page)

    for (let turn = 0; turn < 6; turn += 1) {
      if (turn < 5) {
        await completeProblemAndAdvance(page)
      } else {
        await completeProblem(page)
      }
    }

    await expect(page.getByRole("heading", { name: "Well done." })).toBeFocused()
    await expect(page.getByTestId("summary-page-turn-transition")).toHaveCount(0)
    const geometry = await page.evaluate(() => {
      const app = document.querySelector<HTMLElement>(
        ".page-turn-receiver > .app-shell",
      )
      const summary = document.querySelector<HTMLElement>(".run-summary")
      if (!app || !summary) throw new Error("Expected the Summary book")
      const appBox = app.getBoundingClientRect()
      const summaryBox = summary.getBoundingClientRect()
      return {
        appBottom: appBox.bottom,
        appLeft: appBox.left,
        appRight: appBox.right,
        appTop: appBox.top,
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        summaryBottom: summaryBox.bottom,
        summaryLeft: summaryBox.left,
        summaryRight: summaryBox.right,
        summaryTop: summaryBox.top,
      }
    })

    expect(geometry.documentWidth).toBeLessThanOrEqual(viewport.width)
    expect(geometry.documentHeight).toBeLessThanOrEqual(viewport.height)
    expect(geometry.summaryLeft).toBeGreaterThanOrEqual(geometry.appLeft)
    expect(geometry.summaryRight).toBeLessThanOrEqual(geometry.appRight)
    expect(geometry.summaryTop).toBeGreaterThanOrEqual(geometry.appTop)
    expect(geometry.summaryBottom).toBeLessThanOrEqual(geometry.appBottom)
  })
}

async function expectTopBarPiecesDisjoint(page: Page) {
  const overlaps = await page.evaluate(() => {
    const selectors: Record<string, string> = {
      wordmarkExit: ".exercise-topbar__start",
      elapsed: ".elapsed-control",
      sound: ".sound-control",
      level: ".exercise-progress__level",
      steps: ".turn-progress",
      repair: ".repair-progress",
      previous: '[aria-label="Previous exercise"]',
      nextVisited: '[aria-label="Next visited exercise"]',
      tryAnother: '[aria-label="Try another"]',
      primary: ".top-action--primary",
    }
    const boxes = Object.entries(selectors).flatMap(([name, selector]) => {
      const element = document.querySelector<HTMLElement>(selector)
      return element ? [[name, element.getBoundingClientRect()] as const] : []
    })
    const found: string[] = []
    for (let first = 0; first < boxes.length; first += 1) {
      for (let second = first + 1; second < boxes.length; second += 1) {
        const [firstName, a] = boxes[first]!
        const [secondName, b] = boxes[second]!
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        if (width > 0.5 && height > 0.5) {
          found.push(`${firstName} x ${secondName}`)
        }
      }
    }
    return found
  })
  expect(overlaps).toEqual([])
}

test("keeps top-bar groups from overlapping in plain and repair practice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 1)

  const [start, progress, end, soundToggle] = await Promise.all([
    page.locator(".exercise-topbar__start").boundingBox(),
    page.getByLabel("Practice details").boundingBox(),
    page.locator(".exercise-topbar__end").boundingBox(),
    page.getByRole("button", { name: "Mute sound" }).boundingBox(),
  ])

  expect(start).not.toBeNull()
  expect(progress).not.toBeNull()
  expect(end).not.toBeNull()
  expect(soundToggle).not.toBeNull()
  expect(start!.x + start!.width).toBeLessThanOrEqual(progress!.x)
  expect(progress!.x + progress!.width).toBeLessThanOrEqual(end!.x)
  await expectTopBarPiecesDisjoint(page)

  await page.getByRole("button", { name: "Check answer" }).click()
  await expect(page.getByRole("status")).toContainText("Try again")
  await completeProblem(page)
  await expect(page.getByRole("status")).toContainText("Matched")
  await page.getByRole("button", { name: "Next exercise" }).click()
  await expect(page.getByLabel("Practice details")).toContainText(
    "Repair practice",
  )

  const [repairProgress, repairEnd] = await Promise.all([
    page.getByLabel("Practice details").boundingBox(),
    page.locator(".exercise-topbar__end").boundingBox(),
  ])
  expect(repairProgress).not.toBeNull()
  expect(repairEnd).not.toBeNull()
  expect(start!.x + start!.width).toBeLessThanOrEqual(repairProgress!.x)
  expect(repairProgress!.x + repairProgress!.width).toBeLessThanOrEqual(
    repairEnd!.x,
  )
  await expectTopBarPiecesDisjoint(page)

  for (const width of [1024, 761, 375]) {
    await page.setViewportSize({ width, height: 800 })
    await expectTopBarPiecesDisjoint(page)
  }
})

test("a long Level 5 answer scrolls inside the editor, not the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 5)

  const longSource = Array.from(
    { length: 80 },
    (_, index) => `## Work item ${index + 1}\n\n- Owner\n- Deadline\n- Verification`,
  ).join("\n\n")
  await injectDraft(page, longSource)
  const documentScroller = page
    .locator(
      '.answer-panel [role="tabpanel"]:not([hidden]) .cm-scroller',
    )
    .last()
  await documentScroller.evaluate((node) => {
    node.scrollTop = node.scrollHeight
    node.dispatchEvent(new Event("scroll"))
  })
  const editorScroll = await documentScroller.evaluate((node) => ({
      clientHeight: node.clientHeight,
      overflowY: window.getComputedStyle(node).overflowY,
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
    }))
  expect(editorScroll.overflowY).toBe("auto")
  expect(editorScroll.scrollHeight).toBeGreaterThan(editorScroll.clientHeight)
  expect(editorScroll.scrollTop).toBeGreaterThan(0)
  await expect
    .poll(() =>
      page
        .getByRole("tabpanel", { name: "Write" })
        .locator(".writing-processor__rows")
        .getAttribute("style"),
    )
    .toContain("translateY(-")
  await expect
    .poll(() =>
      page
        .getByRole("tabpanel", { name: "Write" })
        .locator(".cm-invisible-character--line-break")
        .count(),
    )
    .toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
})

test("Preview uses local rendering and never fetches learner media", async ({
  page,
  baseURL,
}) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4173").origin
  const runtimeRequests: string[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.origin !== appOrigin || url.pathname.startsWith("/api/")) {
      runtimeRequests.push(request.url())
    }
  })

  await page.goto("/")
  await enterLevel1(page)
  await injectDraft(page, "![tracking pixel](https://example.com/pixel.png)")
  await page.keyboard.press("Alt+2")
  await expect(
    page
      .getByRole("tabpanel", { name: "Preview" })
      .locator(".cm-rendered-widget--image"),
  ).toHaveText("[Image: tracking pixel]")
  await expect(page.getByRole("img")).toHaveCount(0)
  expect(runtimeRequests).toEqual([])
})

test("Preview renders Devpost GFM inside the shared word-processor page", async ({
  page,
}) => {
  const source = [
    "~~Archived~~",
    "",
    "- [x] Verified",
    "1. [x] Ordered task",
    "",
    "| Item | Owner |",
    "| --- | --- |",
    "| Release | Nabi |",
    "| A \\| B | Nabi |",
    "",
    "Read [guide][docs].[^1]",
    "",
    "[docs]: https://example.com/guide",
    "[^1]: Kept with the document.",
  ].join("\n")

  await page.goto("/")
  await enterLevel1(page)
  await injectDraft(page, source)
  await page.keyboard.press("Alt+2")

  const preview = page.getByRole("tabpanel", { name: "Preview" })
  const processor = preview.locator(
    '.word-processor-page[data-page="rendered"]',
  )
  await expect(processor).toHaveCount(1)
  await expect(processor.locator(".cm-line")).toHaveCount(14)
  await expect(processor.locator(".cm-rendered-delete")).toHaveText(
    "Archived",
  )
  await expect(
    processor.locator(".cm-rendered-widget--list .cm-rendered-widget__glyph"),
  ).toHaveText(["☑", "☑"])
  await expect(processor.locator(".cm-rendered-table-header")).toContainText(
    "Item",
  )
  await expect(processor.locator(".cm-rendered-widget--table-pipe")).toHaveCount(
    9,
  )
  await expect(
    processor.locator(".cm-rendered-widget--escaped-pipe"),
  ).toHaveText("|")
  await expect(
    processor.locator(".cm-rendered-widget--table-separator"),
  ).toHaveCount(1)
  await expect(processor.locator(".cm-rendered-link")).toHaveText("guide")
  await expect(processor.locator(".cm-rendered-widget--footnote")).toHaveCount(
    2,
  )
  await expect(processor.locator(".cm-rendered-widget--definition")).toHaveCount(
    1,
  )
})

test("loads the Nabi brand and Source Serif without console noise", async ({ page }) => {
  const consoleNoise: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleNoise.push(`${message.type()}: ${message.text()}`)
    }
  })

  await page.goto("/")
  const wordmark = page.getByRole("heading", { name: "Nabi Markdown" })
  await expect(wordmark.locator("img")).toHaveAttribute(
    "src",
    "/brand/bfly-wordmark.png",
  )
  await enterLevel1(page)
  await expect(
    page
      .getByRole("region", { name: "Goal", exact: true })
      .locator(".cm-content"),
  ).toHaveCSS("font-family", /Source Serif 4/)
  expect(consoleNoise).toEqual([])
})
