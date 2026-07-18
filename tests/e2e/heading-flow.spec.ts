import { expect, test, type Locator, type Page } from "@playwright/test"

const progressStorageKey = "nabimd.progress.v2"

function sourceEditor(page: Page): Locator {
  return page.getByRole("textbox", { name: "Your Markdown" })
}

async function enterLevel1(page: Page) {
  await page.getByRole("button", {
    name: "New to Markdown — start at Level 1",
  }).click()
}

test("greets a fresh browser session with keyboard-ready entry choices", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Nabi Markdown" }),
  ).toBeVisible()
  await expect(page.getByRole("button", {
    name: "New to Markdown — start at Level 1",
  })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "I know the basics" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Challenge me" }),
  ).toBeVisible()
  await expect(sourceEditor(page)).toHaveCount(0)
})

test("completes and replays a fresh session with keyboard input only", async ({
  page,
}) => {
  await page.goto("/")

  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", {
    name: "New to Markdown — start at Level 1",
  })).toBeFocused()
  await page.keyboard.press("Enter")

  const editor = sourceEditor(page)
  await expect(page.getByRole("complementary", { name: "Hint" })).toContainText(
    "A main heading names the whole document.",
  )
  await expect(page.getByText("#", { exact: true })).toBeVisible()
  await expect(editor).toBeFocused()
  const expectedShortcutLabel = await page.evaluate(() => {
    const modernPlatform = (
      navigator as Navigator & {
        userAgentData?: { platform?: string }
      }
    ).userAgentData?.platform
    return /mac|iphone|ipad|ipod/i.test(modernPlatform || navigator.platform)
      ? "⌘↩"
      : "Ctrl+↩"
  })
  await expect(page.getByText(expectedShortcutLabel, { exact: true })).toBeVisible()

  for (const answer of ["# Apple", "# Rainy day", "# Study tools"]) {
    await editor.pressSequentially(answer)
    await editor.press("Control+Enter")
    await expect(page.getByRole("status")).toContainText("Matched")
    const next = page.getByRole("button", { name: "Next" })
    await expect(next).toBeFocused()
    await expect(next).not.toHaveAttribute("aria-keyshortcuts")
    await page.keyboard.press("Space")
    if (answer !== "# Study tools") await expect(editor).toBeFocused()
  }

  const practiceAgain = page.getByRole("button", { name: "Practice again" })
  await expect(practiceAgain).toBeFocused()
  await page.keyboard.press("Space")

  await expect(page.getByRole("region", { name: "Goal" })).toContainText(
    "Weekend forecast",
  )
  await expect(editor).toBeFocused()
  await page.keyboard.press("Space")
  await expect.poll(() => editor.evaluate((node) => node.textContent)).toBe(" ")
  await editor.press("Control+Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(page.getByRole("tab", { name: "Review" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)
})

test("fails, receives progressive Hint, repairs, transfers, and restores", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  await expect(editor).toHaveAttribute("aria-placeholder", "Type Markdown…")
  await expect(page.getByRole("complementary", { name: "Hint" })).toContainText(
    "#",
  )

  await editor.fill("#Apple")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await expect(page.getByRole("tabpanel", { name: "Review" })).toContainText(
    "Add one space after the hash symbol.",
  )
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)

  await page.getByRole("button", { name: "Hint" }).click()
  const hint = page.getByRole("complementary", { name: "Hint" })
  await expect(hint).toContainText("Use one hash symbol")
  await hint.getByRole("button", { name: "Next hint" }).click()
  await expect(hint).toContainText("one hash symbol, one space")

  await page.keyboard.press("Alt+1")
  await editor.fill("# Apple")
  await page.getByRole("button", { name: "Check again" }).click()
  await expect(page.getByRole("status")).toContainText("Matched")
  await page.getByRole("button", { name: "Next" }).click()

  await expect(page.getByRole("region", { name: "Goal" })).toContainText(
    "Rainy day",
  )
  await expect(editor).toBeFocused()
  await expect(page.getByRole("button", { name: "Hint" })).toHaveAttribute(
    "aria-expanded",
    "false",
  )
  await editor.press("Control+z")
  await expect(editor.locator(".cm-placeholder")).toBeVisible()

  await editor.fill("# Rainy day")
  await page.reload()
  await expect(editor).toHaveText("# Rainy day")
})

test("completes a three-step first-attempt Matched run from the keyboard", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  for (const answer of ["# Apple", "# Rainy day", "# Study tools"]) {
    await editor.fill(answer)
    await editor.press("Control+Enter")
    await expect(page.getByRole("status")).toContainText("Matched")
    await expect(page.getByRole("button", { name: "Next" })).toBeFocused()
    await page.keyboard.press("Enter")
  }
  await expect(
    page.getByRole("heading", { name: "Heading practice complete." }),
  ).toBeVisible()
})

test("opening Hint on a recall problem creates a different-content transfer", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "I know the basics" }).click()

  const editor = sourceEditor(page)
  await expect(page.getByRole("region", { name: "Goal" })).toContainText(
    "Rainy day",
  )
  await expect(page.getByRole("button", { name: "Hint" })).toHaveAttribute(
    "aria-expanded",
    "false",
  )
  await expect(page.getByRole("complementary", { name: "Hint" })).toHaveCount(0)

  await page.getByRole("button", { name: "Hint" }).click()
  await expect(page.getByRole("complementary", { name: "Hint" })).toContainText(
    "#",
  )
  await editor.fill("# Rainy day")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await page.getByRole("button", { name: "Next" }).click()

  await expect(page.getByRole("region", { name: "Goal" })).not.toContainText(
    "Rainy day",
  )
  await expect(editor.locator(".cm-placeholder")).toBeVisible()
})

test("keeps structural Review optional after Matched", async ({ page }) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  await editor.fill("# Apple\n\n# Details")
  await page.getByRole("button", { name: "Check", exact: true }).click()

  await expect(page.getByRole("status")).toContainText("Matched")
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
  await expect(page.getByRole("tab", { name: "Review" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(page.getByRole("tabpanel", { name: "Review" })).toContainText(
    "Keep one H1 as the document title",
  )
})

test("keeps Goal and Answer equal while Hint opens inside Goal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await page.getByRole("button", { name: "I know the basics" }).click()

  const goal = page.getByRole("region", { name: "Goal" })
  const answer = page.getByRole("region", { name: "Your answer" })
  const before = await Promise.all([goal.boundingBox(), answer.boundingBox()])
  for (const box of before) expect(box).not.toBeNull()
  expect(Math.abs(before[0]!.y - before[1]!.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(before[0]!.width - before[1]!.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(before[0]!.height - before[1]!.height)).toBeLessThanOrEqual(1)

  await page.getByRole("button", { name: "Hint" }).click()
  await expect(page.getByRole("complementary", { name: "Hint" })).toBeVisible()
  const after = await Promise.all([goal.boundingBox(), answer.boundingBox()])
  expect(after[0]).toEqual(before[0])
  expect(after[1]).toEqual(before[1])
})

test("shows invisible decorations without changing source or Preview", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  const source = "# Study\ttools"

  await editor.fill(source)
  await page.getByRole("button", { name: "Show invisibles" }).click()
  await expect(page.locator(".cm-invisible-character--space")).toHaveCount(1)
  await expect(page.locator(".cm-invisible-character--tab")).toHaveCount(1)
  const persistedDraft = await page.evaluate((key) => {
    const progress = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as {
      draftByProblemId?: Record<string, string>
    }
    return progress.draftByProblemId?.["heading-apple"]
  }, progressStorageKey)
  expect(persistedDraft).toBe(source)

  await page.keyboard.press("Alt+2")
  await expect(page.getByRole("tabpanel", { name: "Preview" })).toContainText(
    "Study tools",
  )
  await page.keyboard.press("Alt+1")
  await page.getByRole("button", { name: "Hide invisibles" }).click()
  await expect(editor).toHaveText(source)
})

test("reveals NBSP and ideographic-space traps without changing source", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  const source = "#\u00a0Apple\u3000"

  await editor.fill(source)
  await page.getByRole("button", { name: "Show invisibles" }).click()
  await expect(page.locator(".cm-invisible-character--non-breaking-space")).toHaveText("⍽")
  await expect(page.locator(".cm-invisible-character--ideographic-space")).toHaveText("□")
  await page.getByRole("button", { name: "Hide invisibles" }).click()
  await expect(editor).toHaveText(source)
})

test("stacks two equal mobile panels without document overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/")
  await enterLevel1(page)

  const goalBox = await page.getByRole("region", { name: "Goal" }).boundingBox()
  const answerBox = await page.getByRole("region", { name: "Your answer" }).boundingBox()
  expect(goalBox).not.toBeNull()
  expect(answerBox).not.toBeNull()
  expect(goalBox!.y).toBeLessThan(answerBox!.y)
  expect(Math.abs(goalBox!.width - answerBox!.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(goalBox!.height - answerBox!.height)).toBeLessThanOrEqual(1)

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }))
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
  expect(layout.documentHeight).toBeLessThanOrEqual(layout.viewportHeight)
})

test("keeps greeting and completion actions reachable in a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 320 })
  await page.goto("/")

  const greetingShell = page.locator(".greeting-shell")
  const challenge = page.getByRole("button", { name: "Challenge me" })
  await challenge.scrollIntoViewIfNeeded()
  await expect(challenge).toBeVisible()
  expect(
    await greetingShell.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)

  await page.getByRole("button", {
    name: "New to Markdown — start at Level 1",
  }).click()
  for (const answer of ["# Apple", "# Rainy day", "# Study tools"]) {
    await sourceEditor(page).fill(answer)
    await sourceEditor(page).press("Control+Enter")
    await page.getByRole("button", { name: "Next" }).click()
  }

  const completion = page.locator(".completion")
  const changeLevel = page.getByRole("button", { name: "Change level" })
  await changeLevel.scrollIntoViewIfNeeded()
  await expect(changeLevel).toBeVisible()
  expect(
    await completion.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
})

test("contains narrow top-bar overflow without widening the document", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto("/")
  await enterLevel1(page)

  await expect(
    page.getByRole("heading", { name: "Nabi Markdown" }),
  ).toBeVisible()
  await expect(page.getByLabel("Heading progress")).toHaveCount(1)
  const metrics = await page.locator(".exercise-topbar").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
})

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`keeps fixed chrome and equal panels in one viewport at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await enterLevel1(page)

    const requiredSurfaces = [
      page.locator(".exercise-topbar"),
      page.getByRole("region", { name: "Goal" }),
      page.getByRole("region", { name: "Your answer" }),
    ]
    const boxes = await Promise.all(requiredSurfaces.map((surface) => surface.boundingBox()))
    for (const box of boxes) {
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    }
    expect(Math.abs(boxes[1]!.width - boxes[2]!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(boxes[1]!.height - boxes[2]!.height)).toBeLessThanOrEqual(1)

    const metrics = await page.evaluate(() => ({
      bodyScrollHeight: document.body.scrollHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    }))
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.viewportHeight)
    expect(metrics.documentScrollHeight).toBeLessThanOrEqual(metrics.viewportHeight)
  })
}

test("scrolls a long work-order answer inside its panel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await page.getByRole("button", { name: "Challenge me" }).click()
  const editor = sourceEditor(page)
  const longSource = Array.from(
    { length: 80 },
    (_, index) => `## Work item ${index + 1}\n\n- Owner\n- Deadline\n- Verification`,
  ).join("\n\n")
  await editor.fill(longSource)

  const editorScroll = await page.locator(".cm-scroller").evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }))
  expect(editorScroll.scrollHeight).toBeGreaterThan(editorScroll.clientHeight)
  const pageScroll = await page.evaluate(() => ({
    body: document.body.scrollHeight,
    document: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }))
  expect(pageScroll.body).toBeLessThanOrEqual(pageScroll.viewport)
  expect(pageScroll.document).toBeLessThanOrEqual(pageScroll.viewport)
})

test("scrolls a long Review inside the answer panel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await enterLevel1(page)

  const longFailure = [
    "## Apple",
    ...Array.from({ length: 80 }, (_, index) => `- Work item ${index + 1}`),
  ].join("\n")
  await sourceEditor(page).fill(longFailure)
  await sourceEditor(page).press("Control+Enter")

  const review = page.getByRole("tabpanel", { name: "Review" })
  await expect(review).toBeVisible()
  const metrics = await review.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }))
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
  await review.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect.poll(() => review.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
})

test("keeps reduced-motion verdict feedback visible until dismissal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await enterLevel1(page)
  await sourceEditor(page).fill("# Apple")
  await sourceEditor(page).press("Control+Enter")

  const verdict = page.getByRole("status")
  await expect(verdict).toHaveCSS("opacity", "1")
  await page.waitForTimeout(100)
  await expect(verdict).toHaveCSS("opacity", "1")
})

test("loads the Nabi mark and local Source Serif faces without console noise", async ({
  page,
}) => {
  const consoleNoise: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleNoise.push(`${message.type()}: ${message.text()}`)
    }
  })

  await page.goto("/")
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/brand/bfly-favicon.png",
  )
  const greetingWordmark = page.getByRole("heading", { name: "Nabi Markdown" })
  const greetingLogo = greetingWordmark.locator("img")
  await expect(greetingLogo).toBeVisible()
  await expect(greetingLogo).toHaveAttribute("src", "/brand/bfly-wordmark.png")
  expect(
    await greetingLogo.evaluate((image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })),
  ).toEqual({ width: 128, height: 128 })

  await enterLevel1(page)
  await expect(
    page.getByRole("region", { name: "Goal" }).locator(".rendered-document__body"),
  ).toHaveCSS("font-family", /Source Serif 4/)
  await sourceEditor(page).fill("# Apple")
  await sourceEditor(page).press("Control+Enter")
  await expect(page.locator(".verdict-notice strong")).toHaveCSS(
    "font-family",
    /Source Serif 4/,
  )
  await page.evaluate(async () => {
    await document.fonts.load('400 16px "Source Serif 4"')
    await document.fonts.load('600 16px "Source Serif 4"')
    await document.fonts.ready
  })
  expect(
    await page.evaluate(() =>
      document.fonts.check('400 16px "Source Serif 4"'),
    ),
  ).toBe(true)
  expect(
    await page.evaluate(() =>
      document.fonts.check('600 16px "Source Serif 4"'),
    ),
  ).toBe(true)
  expect(consoleNoise).toEqual([])
})

test("loads Preview without a runtime API or learner-media request", async ({
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
  await sourceEditor(page).fill(
    "![tracking pixel](https://example.com/pixel.png)",
  )
  await page.keyboard.press("Alt+2")
  await expect(page.getByText("[Image: tracking pixel]")).toBeVisible()
  await expect(page.getByRole("img")).toHaveCount(0)
  expect(runtimeRequests).toEqual([])
})
