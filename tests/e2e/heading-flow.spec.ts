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
  await expect(page.getByText(/^Perfect\./)).toBeVisible()
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

test("completes a three-step first-attempt Perfect run from the keyboard", async ({
  page,
}) => {
  await page.goto("/")
  await enterLevel1(page)
  const editor = sourceEditor(page)

  for (const answer of ["# Apple", "# Rainy day", "# Study tools"]) {
    await editor.fill(answer)
    await editor.press("Control+Enter")
    await expect(page.getByText(/^Perfect\./)).toBeVisible()
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

test("stacks the mobile workspace without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await enterLevel1(page)

  const boxes = await Promise.all([
    page.getByRole("region", { name: "Goal" }).boundingBox(),
    page.getByRole("complementary", { name: "Help" }).boundingBox(),
    page.getByRole("region", { name: "Your Markdown" }).boundingBox(),
    page.getByRole("region", { name: "Live preview" }).boundingBox(),
  ])
  for (const box of boxes) expect(box).not.toBeNull()
  expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y)
  expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y)
  expect(boxes[2]!.y).toBeLessThan(boxes[3]!.y)

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
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
