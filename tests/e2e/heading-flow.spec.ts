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
  "Level 4 — Write a development spec",
  "Level 5 — Write an agent work order",
] as const

const progressStorageKey = "nabimd.progress.v5"
const sessionSeedStorageKey = "nabimd.session-seed.v1"

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "0")
  }, sessionSeedStorageKey)
})

function sourceEditor(page: Page): Locator {
  return page.getByRole("textbox", { name: "Your Markdown" })
}

async function sourceText(page: Page): Promise<string> {
  const editor = sourceEditor(page)
  if ((await editor.locator(".cm-placeholder").count()) > 0) return ""
  return (await editor.locator(".cm-line").allTextContents()).join("\n")
}

async function enterLevel(page: Page, level: 1 | 2 | 3 | 4 | 5) {
  await page.getByRole("button", { name: levelLabels[level - 1] }).click()
  await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
  await expect(sourceEditor(page)).toBeFocused()
}

async function enterLevel1(page: Page) {
  await enterLevel(page, 1)
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

test("pre-fills reproduction prose but keeps composition blank", async ({
  page,
}) => {
  for (const level of [1, 2] as const) {
    await resetToGreeting(page)
    await enterLevel(page, level)
    const editor = sourceEditor(page)
    const problemId = await currentProblemId(page)
    const problem = runtimeProblemById.get(problemId)
    if (!problem) throw new Error(`Missing runtime problem: ${problemId}`)
    const starterText = derivePlaintextStarter(problem.target)

    expect(starterText).not.toBe("")
    await expect.poll(() => sourceText(page)).toBe(starterText)

    await page.getByRole("button", { name: "Show invisibles" }).click()
    await page.getByRole("button", { name: "Hide invisibles" }).click()
    await expect.poll(() => sourceText(page)).toBe(starterText)
  }

  await resetToGreeting(page)
  await enterLevel(page, 3)
  await expect.poll(() => sourceText(page)).toBe("")
})

test("completes and replays Level 1 with keyboard input only", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: levelLabels[0] })).toBeFocused()
  await page.keyboard.press("Enter")

  const editor = sourceEditor(page)
  await expect(editor).toBeFocused()
  await expect(page.getByRole("tab", { name: "Hint" })).toHaveAttribute(
    "aria-selected",
    "false",
  )

  for (const words of [
    "first answer",
    "second answer",
    "third answer",
    "fourth answer",
    "fifth answer",
    "sixth answer",
  ]) {
    await editor.fill(await validDifferentProse(page, words))
    await editor.press("Control+Enter")
    await expect(page.getByRole("status")).toContainText("Matched")
    const next = page.getByRole("button", { name: "Next exercise" })
    await expect(next).toBeFocused()
    await page.keyboard.press("Control+Enter")
  }

  await expect(
    page.getByRole("heading", { name: "Practice complete." }),
  ).toBeVisible()
  await expect(page.getByLabel("Score")).toContainText("6 / 6")
  await expect(page.getByLabel("Total time")).toContainText(/\d{2}:\d{2}/)
  await expect(page.getByLabel("Level standing")).toContainText(
    "Collecting data",
  )
  await expect(
    page.getByRole("listitem", { name: "Step 6, completed" }),
  ).toBeVisible()
  const pageMetrics = await page.evaluate(() => ({
    body: document.body.scrollHeight,
    document: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }))
  expect(pageMetrics.body).toBeLessThanOrEqual(pageMetrics.viewport)
  expect(pageMetrics.document).toBeLessThanOrEqual(pageMetrics.viewport)
  const practiceAgain = page.getByRole("button", { name: "Practice again" })
  await expect(practiceAgain).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(sourceEditor(page)).toBeFocused()
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  )
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
  const originalGoal = await page.getByRole("region", { name: "Goal" }).textContent()
  const repairFeedback = await expectedRepairFeedback(page)

  await editor.fill(await malformedSource(page))
  await editor.press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(
    page.getByRole("button", { name: "Next exercise" }),
  ).toHaveCount(0)
  await expect(page.getByRole("tabpanel", { name: "Review" })).toContainText(
    repairFeedback,
  )

  await page.keyboard.press("Alt+1")
  await expect(editor).toBeFocused()
  await editor.fill(await validDifferentProse(page, "repaired"))
  await editor.press("Control+Enter")
  await page.getByRole("button", { name: "Next exercise" }).click()
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
  await expect(editor).toHaveText("# saved draft")
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
  const goal = page.getByRole("region", { name: "Goal" })
  const answer = page.getByRole("region", { name: "Your answer" })
  await goal.locator(".rendered-document__body").evaluate((node) => {
    const paragraph = node.querySelector("p")
    if (paragraph) {
      paragraph.textContent = Array.from(
        { length: 80 },
        (_, index) => `Work-order requirement ${index + 1}.`,
      ).join(" ")
    }
  })
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
    overflowY: window.getComputedStyle(node).overflowY,
    scrollHeight: node.scrollHeight,
  }))
  expect(goalScroll.overflowY).toBe("auto")
  expect(goalScroll.scrollHeight).toBeGreaterThan(goalScroll.clientHeight)
})

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
