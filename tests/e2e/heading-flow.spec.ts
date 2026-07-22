import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { derivePlaintextStarter } from "../../src/content/plaintextStarter"

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

function sourceEditor(page: Page): Locator {
  return page.getByRole("textbox", { name: "Your Markdown" })
}

async function sourceText(page: Page): Promise<string> {
  return page
    .locator(
      '.answer-panel .markdown-word-processor[data-presentation="source"] .markdown-source-editor__mount',
    )
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
  await expect(sourceEditor(page)).toBeFocused()
}

async function enterLevel1(page: Page) {
  await enterLevel(page, 1)
}

async function completeProblem(page: Page) {
  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the current runtime problem")

  await sourceEditor(page).fill(problem.target)
  await sourceEditor(page).press("Control+Enter")
}

async function completeProblemAndAdvance(page: Page) {
  const beforeId = await currentProblemId(page)
  await completeProblem(page)
  // Matched auto-advances after the verdict beat — one chord per problem,
  // no second key and no click (issue #102).
  await expect.poll(() => currentProblemId(page)).not.toBe(beforeId)
}

async function resetToGreeting(page: Page) {
  await page.goto("/")
  await page.evaluate((storageKey) => {
    window.sessionStorage.removeItem(storageKey)
  }, progressStorageKey)
  await page.reload()
}

async function currentProblemFamily(page: Page) {
  const problemId = await currentProblemId(page)
  if (problemId.includes("-blockquote-")) return "blockquote"
  if (problemId.includes("-emphasis-")) return "emphasis"
  if (problemId.includes("-italic-")) return "italic"
  if (problemId.includes("-inline-code-")) return "inline-code"
  if (problemId.includes("-code-block-")) {
    if (problemId.includes("-copy-")) return "code-block-copy"
    if (problemId.includes("-reference")) return "code-block-reference"
    if (problemId.includes("-routine")) return "code-block-routine"
    return "code-block"
  }
  if (problemId.includes("-link-")) return "links"
  if (problemId.includes("-thematic-break-")) return "thematic-break"
  if (problemId.includes("-order-")) return "ordered-list"
  if (problemId.includes("-list-")) return "unordered-list"
  return "headings"
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

async function validDifferentProse(page: Page, words: string) {
  switch (await currentProblemFamily(page)) {
    case "blockquote":
      return `> ${words}`
    case "emphasis":
      return `**${words}**`
    case "italic":
      return `*${words}*`
    case "inline-code":
      return `Use \`${words}\`.`
    case "code-block":
      return `\`\`\`\n${words}\n\`\`\``
    case "code-block-copy":
      return `# ${words}\n\n> ${words}\n\n\`\`\`\n${words}\n\`\`\``
    case "code-block-reference":
      return `# ${words}\n\n\`\`\`\n${words}\n\`\`\`\n\n- ${words} one\n- ${words} two`
    case "code-block-routine":
      return `# ${words}\n\n\`\`\`\n${words}\n\`\`\`\n\n1. ${words} one\n2. ${words} two\n3. ${words} three`
    case "links":
      return `Use [${words}](/changed).`
    case "thematic-break":
      return `${words} before\n\n---\n\n${words} after`
    case "unordered-list":
      return `- ${words} one\n- ${words} two\n- ${words} three`
    case "ordered-list":
      return `1. ${words} one\n2. ${words} two\n3. ${words} three`
    default:
      return `# ${words}`
  }
}

async function malformedSource(page: Page) {
  switch (await currentProblemFamily(page)) {
    case "blockquote":
      return "Plain words without a blockquote"
    case "emphasis":
      return "**No closing"
    case "italic":
      return "*No closing"
    case "inline-code":
      return "`No closing"
    case "code-block":
    case "code-block-copy":
    case "code-block-reference":
    case "code-block-routine":
      return "```\nNo closing fence"
    case "links":
      return "[No closing](/path"
    case "thematic-break":
      return "Before the divider\n\n--\n\nAfter the divider"
    case "unordered-list":
      return "-No space\n-Also malformed\n-Still malformed"
    case "ordered-list":
      return "1.No space\n2.Also malformed\n3.Still malformed"
    default:
      return "#No space"
  }
}

async function expectedRepairFeedback(page: Page) {
  switch (await currentProblemFamily(page)) {
    case "blockquote":
      return "Add a blockquote with words inside it."
    case "emphasis":
      return "Make at least one phrase bold with Markdown."
    case "italic":
      return "Make at least one phrase italic with Markdown."
    case "inline-code":
      return "Wrap at least one meaningful item in backticks."
    case "code-block":
      return "Put text between matching lines of three backticks."
    case "code-block-copy":
    case "code-block-reference":
    case "code-block-routine":
      return "Rebuild the three-block shape shown in the Goal."
    case "links":
      return "Add a Markdown link with readable words and a web address."
    case "thematic-break":
      return "Add a Markdown divider between the two text blocks."
    case "unordered-list":
      return "Put one space after each bullet marker, for example `- Item`."
    case "ordered-list":
      return "Put one space after each numbered marker, for example `1. Step`."
    default:
      return "Add one space after the hash symbol."
  }
}

test("greets a fresh session with the definitive five-level ladder", async ({
  page,
}) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
  for (const label of levelLabels) {
    await expect(page.getByRole("button", { name: label })).toBeVisible()
  }
  await expect(sourceEditor(page)).toHaveCount(0)
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
  await expect(sourceEditor(page)).toBeFocused()
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
    await expect(sourceEditor(page)).toBeFocused()
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

  await sourceEditor(page).fill(firstProblem.target)
  await sourceEditor(page).press("Control+Enter")
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

test("keeps the editor editable immediately after Try again", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  await editor.fill(await malformedSource(page))
  await editor.press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(page.getByRole("tab", { name: "Write" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(editor).toBeFocused()

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

test("accepts the second italic syntax typed into the editor", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "23")
  }, sessionSeedStorageKey)
  await page.goto("/")
  await enterLevel(page, 1)
  expect(await currentProblemId(page)).toBe("l1-italic-paper-boat")

  await sourceEditor(page).fill("_Paper boat_")
  expect(await sourceText(page)).toBe("_Paper boat_")
  await sourceEditor(page).press("Control+Enter")

  await expect(page.getByRole("status")).toContainText("Matched")
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

  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the seeded Level 2 problem")
  const check = page.getByRole("button", { name: "Check answer" })
  await expect(check).toContainText("Ctrl+↩")
  const matchedProblemId = await currentProblemId(page)
  await sourceEditor(page).fill(problem.target)
  await sourceEditor(page).press("Control+Enter")

  // The one chord judged the answer and, after the verdict beat, moved the
  // run forward by itself.
  await expect.poll(() => currentProblemId(page)).not.toBe(matchedProblemId)
  expect(consoleNoise).toEqual([])
})

test("starts every level with the Goal-derived starter prose", async ({
  page,
}) => {
  for (const level of [1, 2, 3, 4, 5] as const) {
    await resetToGreeting(page)
    await enterLevel(page, level)
    const editor = sourceEditor(page)
    const problemId = await currentProblemId(page)
    const problem = runtimeProblemById.get(problemId)
    if (!problem) throw new Error(`Missing runtime problem: ${problemId}`)
    const starter = derivePlaintextStarter(problem.target)
    expect(starter).not.toBe(problem.target)
    await expect.poll(() => sourceText(page)).toBe(starter)
    await expect(editor).toBeFocused()

    const modifier = await page.evaluate(() =>
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "Meta" : "Control",
    )
    await editor.press(`${modifier}+z`)
    expect(await sourceText(page)).toBe(starter)
  }
})

test("completes and replays Level 1 with keyboard input only", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: levelLabels[0] })).toBeFocused()
  await page.keyboard.press("Enter")

  await expect(sourceEditor(page)).toBeFocused()
  await expect(page.getByRole("tab", { name: "Hint" })).toHaveAttribute(
    "aria-selected",
    "false",
  )

  for (let exercise = 0; exercise < 6; exercise += 1) {
    await expect(sourceEditor(page)).toBeFocused()
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
  await expect(sourceEditor(page)).toBeFocused()
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
  const editor = sourceEditor(page)
  const firstProblemId = await currentProblemId(page)

  // A wrong answer holds: the verdict stays past the old toast life and
  // carries the pinpointed correction, while the editor stays focused.
  await editor.fill(await malformedSource(page))
  await editor.press("Control+Enter")
  const verdict = page.getByRole("status")
  await expect(verdict).toContainText("Try again")
  await page.waitForTimeout(2000)
  await expect(verdict).toContainText("Try again")
  await expect(verdict).toContainText("Use")
  await expect(editor).toBeFocused()

  // Retyping puts the verdict away without any extra key.
  await editor.fill(await validDifferentProse(page, "drill words"))
  await expect(page.getByRole("status")).toHaveCount(0)

  // One chord judges and, after the beat, advances — no second key. The
  // repair transfer scheduled by the earlier miss arrives first.
  await editor.press("Control+Enter")
  await expect.poll(() => currentProblemId(page)).not.toBe(firstProblemId)
  await expect(page.getByLabel("Practice details")).toContainText(
    "Repair practice",
  )
  await completeProblemAndAdvance(page)
  const thirdProblemId = await currentProblemId(page)

  // Alt+P walks back through visited steps; Alt+N returns forward.
  await page.keyboard.press("Alt+P")
  await expect.poll(() => currentProblemId(page)).not.toBe(thirdProblemId)
  await page.keyboard.press("Alt+N")
  await expect.poll(() => currentProblemId(page)).toBe(thirdProblemId)

  // Alt+H peeks at the Hint; the same key closes it and hands the editor
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
  await expect(sourceEditor(page)).toBeFocused()

  // Plain Enter is still just typing.
  const linesBefore = (await sourceText(page)).split("\n").length
  await sourceEditor(page).press("End")
  await sourceEditor(page).press("Enter")
  expect((await sourceText(page)).split("\n").length).toBe(linesBefore + 1)
})

test("grades Markdown structure without grading capitalization or prose", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)

  await sourceEditor(page).fill(await validDifferentProse(page, "aple"))
  await sourceEditor(page).press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Matched")
  await expect(
    page.getByRole("button", { name: "Next exercise" }),
  ).toBeVisible()
})

test("blocks malformed syntax, then accepts a repair and transfers practice", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  const originalGoal = await page
    .getByRole("region", { name: "Goal", exact: true })
    .textContent()
  const repairFeedback = await expectedRepairFeedback(page)

  await editor.fill(await malformedSource(page))
  await editor.press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(
    page.getByRole("button", { name: "Next exercise" }),
  ).toHaveCount(0)
  await page.getByRole("tab", { name: "Review" }).click()
  await expect(page.getByRole("tabpanel", { name: "Review" })).toContainText(
    repairFeedback,
  )

  await page.keyboard.press("Alt+1")
  await expect(sourceEditor(page)).toBeFocused()
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

test("groups a Level 3 heading substitution into one exact bold correction", async ({
  page,
}) => {
  await page.goto("/")
  await page.evaluate(
    ({ progressKey, seedKey }) => {
      window.sessionStorage.removeItem(progressKey)
      window.sessionStorage.setItem(seedKey, "42")
    },
    { progressKey: progressStorageKey, seedKey: sessionSeedStorageKey },
  )
  await page.reload()
  await enterLevel(page, 3)

  const problemId = await currentProblemId(page)
  expect(problemId).toBe("l3-badge-reader-impact-brief")
  const problem = runtimeProblemById.get(problemId)
  if (!problem) throw new Error("Expected the seeded Level 3 problem")
  const malformed = problem.target.replace("**Owner:**", "# Owner:")

  await sourceEditor(page).fill(malformed)
  await sourceEditor(page).press("Control+Enter")
  await page.getByRole("tab", { name: "Review" }).click()

  const review = page.getByRole("tabpanel", { name: "Review" })
  const corrections = review.getByRole("list", { name: "Required corrections" })
  await expect(corrections.getByRole("listitem")).toHaveCount(1)
  await expect(corrections.getByText("Bold text")).toBeVisible()
  await expect(corrections.getByText("In “Owner and next update”")).toBeVisible()
  await expect(corrections.getByText("**Owner:**")).toBeVisible()
  const checkedExcerpt = await corrections
    .getByText("You wrote")
    .locator("..")
    .locator("code")
    .textContent()
  expect(checkedExcerpt).toContain("# Owner:")

  await page.getByRole("tab", { name: "Hint" }).click()
  const hint = page.getByRole("tabpanel", { name: "Hint" })
  await expect(
    hint.getByRole("list", { name: "Failed Markdown patterns" })
      .getByRole("listitem"),
  ).toHaveCount(1)
  await expect(hint.getByText("**Owner:**")).toBeVisible()

  await page.getByRole("tab", { name: "Write" }).click()
  await sourceEditor(page).fill(problem.target)
  await page.getByRole("tab", { name: "Review" }).click()
  await expect(
    corrections.getByText("You wrote").locator("..").locator("code"),
  ).toHaveText(checkedExcerpt ?? "")

  await page.getByRole("button", { name: "Check answer" }).click()
  await expect(page.getByRole("status")).toContainText("Matched")
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

test("persists the current draft only for the browser session", async ({ page }) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  await editor.fill("# saved draft")

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
  expect(stored.drafts).toContain("# saved draft")

  await page.waitForTimeout(1_100)

  await page.reload()
  await expect.poll(() => sourceText(page)).toBe("# saved draft")
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
  await sourceEditor(page).fill(problem.target)

  const assertSharedRows = async (expectedHeight: number) => {
    const [goalEditable, answerEditable] = await Promise.all([
      page
        .locator(".goal-panel .cm-content")
        .getAttribute("contenteditable"),
      sourceEditor(page).getAttribute("contenteditable"),
    ])
    expect(goalEditable).toBe("false")
    expect(answerEditable).toBe("true")

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
  await sourceEditor(page).fill(problem.target)
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
  await sourceEditor(page).fill(
    Array.from({ length: 40 }, (_, index) => `Document line ${index + 1}`).join(
      "\n",
    ),
  )
  await page.getByRole("tab", { name: "Preview" }).click()
  await expect(preview.locator(".cm-line")).toHaveCount(40)
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
  await sourceEditor(page).fill(problem.target)

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

    expect(start!.x + start!.width).toBeLessThanOrEqual(progress!.x)
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

  const editor = sourceEditor(page)
  await editor.fill("")
  await editor.press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(editor).toBeFocused()

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

test("keeps top-bar groups from overlapping at 1280px", async ({ page }) => {
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
})

test("a long Level 5 answer scrolls inside the editor, not the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 5)

  const longSource = Array.from(
    { length: 80 },
    (_, index) => `## Work item ${index + 1}\n\n- Owner\n- Deadline\n- Verification`,
  ).join("\n\n")
  const editor = sourceEditor(page)
  await editor.fill(longSource)
  await editor.press("Control+End")
  await editor.pressSequentially(" tail")

  const editorScroll = await page
    .locator(
      '.answer-panel [role="tabpanel"]:not([hidden]) .cm-scroller',
    )
    .evaluate((node) => ({
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
  await sourceEditor(page).fill("![tracking pixel](https://example.com/pixel.png)")
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
  await sourceEditor(page).fill(source)
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
