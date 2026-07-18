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
  await expect(
    page.getByText("A main heading names the whole document.", {
      exact: false,
    }),
  ).toBeVisible()
  await expect(page.getByText("# Weather", { exact: true })).toBeVisible()
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
  await expect(
    page.getByText(expectedShortcutLabel, { exact: true }),
  ).toBeVisible()

  for (const answer of ["# Apple", "# Rainy day", "# Study tools"]) {
    await page.keyboard.type(answer)
    await page.keyboard.press("Control+Enter")
    await expect(page.getByText(/^Matched\./)).toBeVisible()
    const next = page.getByRole("button", { name: "Next" })
    await expect(next).toBeFocused()
    await expect(next).not.toHaveAttribute("aria-keyshortcuts")
    await page.keyboard.press("Space")
    if (answer !== "# Study tools") await expect(editor).toBeFocused()
  }

  const practiceAgain = page.getByRole("button", { name: "Practice again" })
  await expect(practiceAgain).toBeFocused()
  await page.keyboard.press("Space")

  await expect(
    page.getByRole("region", { name: "Goal" }),
  ).toContainText("Weekend forecast")
  await expect(
    page.getByText("A main heading names the whole document.", {
      exact: false,
    }),
  ).toBeVisible()
  await expect(editor).toBeFocused()

  await page.keyboard.press("Space")
  await expect(editor).toHaveText(" ")
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)
  await expect(
    page.getByRole("region", { name: "Goal" }),
  ).toContainText("Weekend forecast")

  await page.keyboard.press("Control+Enter")
  await expect(page.getByText(/^Try again:/)).toBeVisible()
  await expect(editor).toBeFocused()
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)
})

test("fails, receives progressive Help, repairs, transfers, and restores", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  await expect(editor).toHaveAttribute("aria-placeholder", "Type Markdown…")
  await expect(editor.locator(".cm-placeholder")).toBeVisible()
  await expect(
    page.getByRole("complementary", { name: "Help" }),
  ).toContainText("#")

  await editor.fill("#Apple")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await expect(
    page.getByText("Add one space after the hash symbol."),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)

  await page.getByRole("button", { name: "Show hint" }).click()
  const help = page.getByRole("complementary", { name: "Help" })
  await expect(help).toContainText("Use one hash symbol")
  await help.getByRole("button", { name: "Next hint" }).click()
  await expect(help).toContainText("one hash symbol, one space")
  await expect(editor).toHaveText("#Apple")

  await editor.fill("# Apple")
  await page.getByRole("button", { name: "Check again" }).click()
  await expect(page.getByText(/^Matched\./)).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()

  await expect(
    page.getByRole("region", { name: "Goal" }),
  ).toContainText("Rainy day")
  await expect(editor.locator(".cm-placeholder")).toBeVisible()
  await expect(page.getByRole("button", { name: "Show hint" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Check" })).toBeVisible()
  await editor.press("Control+z")
  await expect(editor.locator(".cm-placeholder")).toBeVisible()

  await editor.fill("# Rainy day")
  await expect(editor).toHaveText("# Rainy day")
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
    await expect(page.getByText(/^Matched\./)).toBeVisible()
    await page.getByRole("button", { name: "Next" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Heading practice complete." }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Practice again" }),
  ).toBeVisible()
})

test("opening Help on a recall problem creates a different-content transfer", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "I know the basics" }).click()

  const editor = sourceEditor(page)
  const help = page.getByRole("complementary", { name: "Help" })
  await expect(
    page.getByRole("region", { name: "Goal" }),
  ).toContainText("Rainy day")
  await expect(help.getByRole("button", { name: "Show hint" })).toBeVisible()
  await expect(help.getByText("#", { exact: true })).toHaveCount(0)
  await expect(
    page.getByText("A main heading names the whole document.", {
      exact: false,
    }),
  ).toHaveCount(0)

  await help.getByRole("button", { name: "Show hint" }).click()
  await expect(help.getByText("#", { exact: true })).toBeVisible()
  await editor.fill("# Rainy day")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await page.getByRole("button", { name: "Next" }).click()

  await expect(
    page.getByRole("region", { name: "Goal" }),
  ).not.toContainText("Rainy day")
  await expect(editor.locator(".cm-placeholder")).toBeVisible()
})

test("keeps Matched review optional", async ({ page }) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  await editor.fill("# Apple\n\n# Details")
  await page.getByRole("button", { name: "Check", exact: true }).click()

  await expect(page.getByText(/^Matched\./)).toBeVisible()
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
  await expect(
    page.getByRole("complementary", { name: "Help" }),
  ).not.toContainText("Keep one H1")

  await page.getByRole("button", { name: "Review" }).click()
  await expect(
    page.getByRole("complementary", { name: "Help" }),
  ).toContainText("Keep one H1 as the document title")
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
})

test("keeps both desktop rows aligned while Help opens downward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/")
  await enterLevel1(page)

  const goal = page.getByRole("region", { name: "Goal" })
  const help = page.getByRole("complementary", { name: "Help" })
  const editor = page.getByRole("region", { name: "Your Markdown" })
  const preview = page.getByRole("region", { name: "Live preview" })

  const initial = await Promise.all([
    goal.boundingBox(),
    help.boundingBox(),
    editor.boundingBox(),
    preview.boundingBox(),
  ])
  for (const box of initial) expect(box).not.toBeNull()
  const [goalBox, helpBox, editorBox, previewBox] = initial
  expect(Math.abs(goalBox!.y - helpBox!.y)).toBeLessThanOrEqual(1)
  expect(
    Math.abs(
      goalBox!.y + goalBox!.height - (helpBox!.y + helpBox!.height),
    ),
  ).toBeLessThanOrEqual(1)
  expect(Math.abs(editorBox!.y - previewBox!.y)).toBeLessThanOrEqual(1)
  expect(
    Math.abs(
      editorBox!.y + editorBox!.height -
        (previewBox!.y + previewBox!.height),
    ),
  ).toBeLessThanOrEqual(1)

  await help.getByRole("button", { name: "Hide hint" }).click()
  const closedGoal = await goal.boundingBox()
  const closedHelp = await help.boundingBox()
  expect(closedGoal).not.toBeNull()
  expect(closedHelp).not.toBeNull()
  expect(closedGoal!.x).toBeCloseTo(goalBox!.x, 0)
  expect(closedGoal!.width).toBeCloseTo(goalBox!.width, 0)
  expect(closedHelp!.x).toBeCloseTo(helpBox!.x, 0)
  expect(closedHelp!.width).toBeCloseTo(helpBox!.width, 0)
  expect(Math.abs(closedGoal!.y - closedHelp!.y)).toBeLessThanOrEqual(1)
  expect(
    Math.abs(
      closedGoal!.y + closedGoal!.height -
        (closedHelp!.y + closedHelp!.height),
    ),
  ).toBeLessThanOrEqual(1)

  await help.getByRole("button", { name: "Show hint" }).click()
  await expect(help.getByText("#", { exact: true })).toBeVisible()
})

test("shows invisible decorations without changing source or preview", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)
  const source = "# Study\ttools"

  await editor.fill(source)
  await expect(
    page.getByRole("region", { name: "Live preview" }),
  ).toContainText("Study tools")
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
  await expect(
    page.getByRole("region", { name: "Live preview" }),
  ).toContainText("Study tools")

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

  await expect(
    page.locator(".cm-invisible-character--non-breaking-space"),
  ).toHaveText("⍽")
  await expect(
    page.locator(".cm-invisible-character--ideographic-space"),
  ).toHaveText("□")
  await expect(editor).toHaveText("#⍽Apple□")

  await page.getByRole("button", { name: "Hide invisibles" }).click()
  await expect(editor).toHaveText(source)
})

test("stacks the mobile workspace in semantic order without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/")
  await enterLevel1(page)

  const boxes = await Promise.all([
    page.getByRole("heading", {
      name: "Rebuild the heading below in Markdown.",
    }).boundingBox(),
    page.getByRole("region", { name: "Goal" }).boundingBox(),
    page.getByRole("complementary", { name: "Help" }).boundingBox(),
    page.getByRole("region", { name: "Your Markdown" }).boundingBox(),
    page.getByRole("region", { name: "Live preview" }).boundingBox(),
    page.getByText("Write the heading, then check your work.").boundingBox(),
    page.getByRole("button", { name: "Check", exact: true }).boundingBox(),
  ])
  for (const box of boxes) expect(box).not.toBeNull()
  expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y)
  expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y)
  expect(boxes[2]!.y).toBeLessThan(boxes[3]!.y)
  expect(boxes[3]!.y).toBeLessThan(boxes[4]!.y)
  expect(boxes[4]!.y).toBeLessThan(boxes[5]!.y)
  expect(boxes[5]!.y).toBeLessThanOrEqual(boxes[6]!.y)

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
})

test("keeps brand and progress readable without horizontal overflow at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto("/")
  await enterLevel1(page)

  const wordmark = page.getByRole("heading", { name: "Nabi Markdown" })
  const progress = page.getByLabel("Heading progress")
  await expect(wordmark).toBeVisible()
  await expect(wordmark).toContainText("Nabi Markdown")
  await expect(progress).toBeVisible()
  await expect(progress).toContainText("1 of 3")

  const wordmarkBox = await wordmark.boundingBox()
  const progressBox = await progress.boundingBox()
  expect(wordmarkBox).not.toBeNull()
  expect(progressBox).not.toBeNull()
  expect(wordmarkBox!.x).toBeGreaterThanOrEqual(0)
  expect(wordmarkBox!.x + wordmarkBox!.width).toBeLessThanOrEqual(320)
  expect(progressBox!.x).toBeGreaterThanOrEqual(wordmarkBox!.x + wordmarkBox!.width)
  expect(progressBox!.x + progressBox!.width).toBeLessThanOrEqual(320)

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
})

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`keeps the complete desk in bounds without page scroll at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await enterLevel1(page)

    const requiredSurfaces = [
      page.locator(".app-header"),
      page.getByRole("heading", {
        name: "Rebuild the heading below in Markdown.",
      }),
      page.getByRole("region", { name: "Goal" }),
      page.getByRole("complementary", { name: "Help" }),
      page.getByRole("region", { name: "Your Markdown" }),
      page.getByRole("region", { name: "Live preview" }),
      page.getByText("Write the heading, then check your work."),
      page.getByRole("button", { name: "Check", exact: true }),
    ]
    const boxes = await Promise.all(
      requiredSurfaces.map((surface) => surface.boundingBox()),
    )
    for (const box of boxes) {
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    }

    const metrics = await page.evaluate(() => ({
      bodyScrollHeight: document.body.scrollHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    }))
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.viewportHeight)
    expect(metrics.documentScrollHeight).toBeLessThanOrEqual(
      metrics.viewportHeight,
    )
  })
}

test("loads the shared Nabi mark and local Source Serif faces without console noise", async ({
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
  await expect(greetingLogo).toHaveAttribute(
    "src",
    "/brand/bfly-wordmark.png",
  )
  await expect(greetingLogo).toHaveAttribute("alt", "")
  await expect(greetingLogo).toHaveJSProperty("complete", true)
  expect(
    await greetingLogo.evaluate((image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })),
  ).toEqual({ width: 128, height: 128 })

  const wordmarkAsset = await page.request.get("/brand/bfly-wordmark.png")
  const faviconAsset = await page.request.get("/brand/bfly-favicon.png")
  expect(wordmarkAsset.ok()).toBe(true)
  expect(faviconAsset.ok()).toBe(true)
  expect((await wordmarkAsset.body()).byteLength).toBeLessThan(32_000)
  expect((await faviconAsset.body()).byteLength).toBeLessThan(16_000)
  expect(
    await page.evaluate(async () => {
      const image = new Image()
      image.src = "/brand/bfly-favicon.png"
      await image.decode()
      return { width: image.naturalWidth, height: image.naturalHeight }
    }),
  ).toEqual({ width: 64, height: 64 })

  await expect
    .poll(() => page.evaluate(() => document.fonts.check('600 16px "Source Serif 4"')))
    .toBe(true)
  expect(await greetingWordmark.evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Source Serif 4")

  await enterLevel1(page)
  const deskWordmark = page.getByRole("heading", { name: "Nabi Markdown" })
  await expect(deskWordmark.locator("img")).toBeVisible()
  for (const label of ["Goal", "Live preview"]) {
    await expect(
      page.getByRole("region", { name: label }).locator(".rendered-document__body"),
    ).toHaveCSS("font-family", /Source Serif 4/)
  }
  await expect(page.locator(".status-bar__message")).toHaveCSS(
    "font-family",
    /Source Serif 4/,
  )
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('16px "Source Serif 4"')))
    .toBe(true)
  expect(await page.evaluate(() => document.fonts.check('600 16px "Source Serif 4"')))
    .toBe(true)
  expect(consoleNoise).toEqual([])
})

test("loads without a runtime API or learner-media request", async ({
  page,
  baseURL,
}) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4173").origin
  const runtimeRequests: string[] = []
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== appOrigin) {
      runtimeRequests.push(request.url())
    }
  })

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Nabi Markdown" }),
  ).toBeVisible()

  await enterLevel1(page)
  await sourceEditor(page).fill(
    "![tracking pixel](https://example.com/pixel.png)",
  )
  await expect(page.getByText("[Image: tracking pixel]")).toBeVisible()
  await expect(page.getByRole("img")).toHaveCount(0)
  expect(runtimeRequests).toEqual([])
})
