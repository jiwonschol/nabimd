import { expect, test, type Locator, type Page } from "@playwright/test"

const levelLabels = [
  "Level 1 — Learn with the pattern",
  "Level 2 — Recall the syntax",
  "Level 3 — Write for people",
  "Level 4 — Write a development spec",
  "Level 5 — Write an agent work order",
] as const

const progressStorageKey = "nabimd.progress.v3"

function sourceEditor(page: Page): Locator {
  return page.getByRole("textbox", { name: "Your Markdown" })
}

async function enterLevel(page: Page, level: 1 | 2 | 3 | 4 | 5) {
  await page.getByRole("button", { name: levelLabels[level - 1] }).click()
}

async function enterLevel1(page: Page) {
  await enterLevel(page, 1)
}

async function currentProblemFamily(page: Page) {
  const panelId = await page.getByRole("tab", { name: "Write" }).getAttribute("aria-controls")
  if (!panelId?.startsWith("write-panel-")) {
    throw new Error("The active Write tab must identify its problem")
  }
  if (panelId.includes("-blockquote-")) return "blockquote"
  if (panelId.includes("-emphasis-")) return "emphasis"
  if (panelId.includes("-order-")) return "ordered-list"
  if (panelId.includes("-list-")) return "unordered-list"
  return "headings"
}

async function validDifferentProse(page: Page, words: string) {
  switch (await currentProblemFamily(page)) {
    case "blockquote":
      return `> ${words}`
    case "emphasis":
      return `**${words}**`
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
    case "unordered-list":
      return "Add at least three bullet items, with words after each marker."
    case "ordered-list":
      return "Add at least three numbered steps, with words after each marker."
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

test("every level opens its own three-problem run", async ({ page }) => {
  for (const [index, label] of levelLabels.entries()) {
    await page.goto("/")
    await page.getByRole("button", { name: label }).click()
    await expect(page.getByLabel("Practice progress")).toContainText(
      `Level ${index + 1}`,
    )
    await expect(page.getByLabel("Practice progress")).toContainText("1 of 3")
    await expect(sourceEditor(page)).toBeFocused()
    await page.getByRole("button", { name: "Nabi Markdown home" }).click()
    await expect(
      page.getByRole("heading", { name: "Welcome. Choose where to begin." }),
    ).toBeVisible()
  }
})

test("completes and replays Level 1 with keyboard input only", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: levelLabels[0] })).toBeFocused()
  await page.keyboard.press("Enter")

  const editor = sourceEditor(page)
  await expect(editor).toBeFocused()
  await expect(page.getByLabel("Markdown pattern")).toBeVisible()

  for (const words of ["first answer", "second answer", "third answer"]) {
    await editor.fill(await validDifferentProse(page, words))
    await editor.press("Control+Enter")
    await expect(page.getByRole("status")).toContainText("Matched")
    const next = page.getByRole("button", { name: "Next" })
    await expect(next).toBeFocused()
    await page.keyboard.press("Space")
  }

  await expect(
    page.getByRole("heading", { name: "Practice complete." }),
  ).toBeVisible()
  const practiceAgain = page.getByRole("button", { name: "Practice again" })
  await expect(practiceAgain).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(sourceEditor(page)).toBeFocused()
  await expect(page.getByLabel("Practice progress")).toContainText("1 of 3")
})

test("grades Markdown structure without grading capitalization or prose", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)

  await sourceEditor(page).fill(await validDifferentProse(page, "aple"))
  await sourceEditor(page).press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Matched")
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
})

test("blocks malformed syntax, then accepts a repair and transfers practice", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  const originalGoal = await page.getByRole("region", { name: "Goal" }).textContent()
  const repairFeedback = await expectedRepairFeedback(page)

  await editor.fill(await malformedSource(page))
  await editor.press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)
  await expect(page.getByRole("tabpanel", { name: "Review" })).toContainText(
    repairFeedback,
  )

  await page.keyboard.press("Alt+1")
  await expect(editor).toBeFocused()
  await editor.fill(await validDifferentProse(page, "repaired"))
  await editor.press("Control+Enter")
  await page.getByRole("button", { name: "Next" }).click()
  await expect(page.getByLabel("Practice progress")).toContainText("2 of 3")
  await expect(page.getByRole("region", { name: "Goal" })).not.toHaveText(
    originalGoal ?? "",
  )
})

test("Try another stays in level and serves different content", async ({ page }) => {
  await page.goto("/")
  await enterLevel(page, 3)

  const goal = page.getByRole("region", { name: "Goal" })
  const before = await goal.textContent()
  await page.getByRole("button", { name: "Try another" }).click()
  await expect(goal).not.toHaveText(before ?? "")
  await expect(page.getByLabel("Practice progress")).toContainText("Level 3")
  await expect(page.getByLabel("Practice progress")).toContainText("1 of 3")
})

test("recall levels hide Hint until requested", async ({ page }) => {
  await page.goto("/")
  await enterLevel(page, 2)

  const hintButton = page.getByRole("button", { name: "Hint" })
  await expect(hintButton).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByRole("complementary", { name: "Hint" })).toHaveCount(0)
  await page.getByRole("button", { name: "Exit" }).focus()
  await page.keyboard.press("?")
  await expect(hintButton).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("complementary", { name: "Hint" })).toBeVisible()
})

test("persists the current draft only for the browser session", async ({ page }) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  await editor.fill("# saved draft")

  const stored = await page.evaluate((key) => {
    const progress = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as {
      draftByProblemId?: Record<string, string>
    }
    return Object.values(progress.draftByProblemId ?? {})
  }, progressStorageKey)
  expect(stored).toContain("# saved draft")

  await page.reload()
  await expect(editor).toHaveText("# saved draft")
})

test("keeps Goal and Answer equal with fixed chrome at 1280x800", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 5)

  const topbar = page.locator(".exercise-topbar")
  const goal = page.getByRole("region", { name: "Goal" })
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

  const goalScroll = await goal.locator(".rendered-document__body").evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }))
  expect(goalScroll.scrollHeight).toBeGreaterThan(goalScroll.clientHeight)
})

test("a long Level 5 answer scrolls inside the editor, not the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel(page, 5)

  const longSource = Array.from(
    { length: 80 },
    (_, index) => `## Work item ${index + 1}\n\n- Owner\n- Deadline\n- Verification`,
  ).join("\n\n")
  await sourceEditor(page).fill(longSource)

  const editorScroll = await page.locator(".cm-scroller").evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }))
  expect(editorScroll.scrollHeight).toBeGreaterThan(editorScroll.clientHeight)
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
  await expect(page.getByText("[Image: tracking pixel]")).toBeVisible()
  await expect(page.getByRole("img")).toHaveCount(0)
  expect(runtimeRequests).toEqual([])
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
    page.getByRole("region", { name: "Goal" }).locator(".rendered-document__body"),
  ).toHaveCSS("font-family", /Source Serif 4/)
  expect(consoleNoise).toEqual([])
})
